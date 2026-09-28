import { useEffect, useMemo, useState } from 'react';
import { ethers } from 'ethers';
import { toast } from 'react-toastify';
import { motion } from 'motion/react';
import AppLayout from '../../../components/layout/AppLayout';
import PropertyCard from '../components/PropertyCard';
import PropertyGridSkeleton from '../components/PropertyGridSkeleton';
import PageHeader from '../../../components/ui/PageHeader';
import StatCard from '../../../components/ui/StatCard';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import EmptyState from '../../../components/ui/EmptyState';
import Badge from '../../../components/ui/Badge';
import web3Service from '../../../services/web3Service';
import propertyApi from '../api/propertyApi';
import contractsConfig from '../../../config/contracts.config';
import { useWeb3 } from '../../../context/Web3Context';
import { getContractErrorMessage } from '../../../utils/web3Errors';
import { ROUTES } from '../../../config/routes';
import {
  formatShares,
  formatStable,
  isValidPriceTier,
  parseShares,
  parseStable,
  PRICE_STEP,
  PRICE_TIERS,
} from '../../../utils/units';
import { formatNumber, formatUsd, shortenAddress } from '../../../lib/utils';

const DEFAULT_LISTING_PRICE = 40;

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};
const rise = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.32, ease: 'easeOut' } },
};

const ListMarketplacePage = () => {
  const { address: userAddress } = useWeb3();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fractionalEvents, setFractionalEvents] = useState({});
  const [tokensInputs, setTokenInputs] = useState({});
  const [priceInputs, setPriceInputs] = useState({});
  const [existingListings, setExistingListings] = useState({});
  const [blockedByBuyBack, setBlockedByBuyBack] = useState({});
  const [fractionalizeBasePrices, setFractionalizeBasePrices] = useState({});
  const [userTokenBalances, setUserTokenBalances] = useState([]);
  const [busyId, setBusyId] = useState(null);

  const totals = useMemo(() => {
    let balance = 0;
    for (const t of userTokenBalances) balance += Number(t.balance) || 0;

    const listedCount = properties.filter((p) => existingListings[p.propertyId]).length;

    return { count: userTokenBalances.length, balance, listedCount };
  }, [userTokenBalances, properties, existingListings]);

  const fetchProperties = async (address) => {
    try {
      const data = await propertyApi.getOwnerProperties(address);
      const allProps = data.properties || [];

      const propertyNftContract = web3Service.getReadOnlyPropertyNftContract();
      const marketplaceContract = web3Service.getReadOnlyMarketplaceContract();
      const vaultContract = web3Service.getReadOnlyVaultContract();
      const filteredProps = [];
      for (const prop of allProps) {
        try {
          const isFrac = await propertyNftContract.isFractionalized(prop.propertyId);
          if (!isFrac) continue;

          filteredProps.push(prop);

          // An active listing already has a price; only a new listing lets the
          // owner choose one, so record which case each property is in.
          const listing = await marketplaceContract.listings(prop.propertyId);
          setExistingListings((prev) => ({
            ...prev,
            [prop.propertyId]: listing.active ? formatStable(listing.pricePerToken) : null,
          }));

          // listProperty reverts (BuyBackActive) while a prior buyback on this
          // property is still open — the owner has to let holders sell back
          // and then call withdrawBuyBackDeposit before re-listing.
          setBlockedByBuyBack((prev) => ({ ...prev, [prop.propertyId]: listing.buyBack }));

          // The vault doesn't store the base price Fractionalize used, but
          // propertyPrice / totalShares recovers it exactly (that's how
          // totalShares was derived in the first place).
          if (!listing.active) {
            const { totalShares } = await vaultContract.fractionalData(prop.propertyId);
            if (!totalShares.isZero()) {
              const basePrice = Number(prop.propertyPrice) / Number(formatShares(totalShares));
              setFractionalizeBasePrices((prev) => ({ ...prev, [prop.propertyId]: basePrice }));
            }
          }
        } catch (err) {
          console.error(`Error checking fractionalization for token ${prop.propertyId}:`, err);
        }
      }
      setProperties(filteredProps);
    } catch (err) {
      console.error('Error fetching properties:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserTokenBalance = async () => {
    if (!userAddress) return;
    try {
      const vaultContract = web3Service.getReadOnlyVaultContract();
      const balances = [];

      for (const prop of properties) {
        try {
          const propertyTokenData = await vaultContract.fractionalData(prop.propertyId);
          const propertyShareTokenAddr = propertyTokenData.tokenAddress;

          if (propertyShareTokenAddr && propertyShareTokenAddr !== ethers.constants.AddressZero) {
            const provider = web3Service.getProvider();
            const tokenContract = new ethers.Contract(
              propertyShareTokenAddr,
              ['function balanceOf(address) view returns (uint256)'],
              provider,
            );

            const balance = await tokenContract.balanceOf(userAddress);

            balances.push({
              propertyId: prop.propertyId,
              propertyName: prop.propertyName,
              tokenAddress: propertyShareTokenAddr,
              balance: formatShares(balance),
            });
          }
        } catch (err) {
          console.error(`Error fetching balance for property ${prop.propertyId}:`, err);
        }
      }

      setUserTokenBalances(balances);
    } catch (err) {
      console.error('Error fetching token balances:', err);
    }
  };

  const listToMarketplace = async (tokenId, listingPrice) => {
    const inputValue = tokensInputs[tokenId];
    if (!inputValue || Number(inputValue) <= 0) {
      toast.error('Please enter the number of tokens to list.');
      return;
    }

    if (!isValidPriceTier(listingPrice)) {
      toast.error(`Price per share must be a multiple of $${PRICE_STEP}.`);
      return;
    }

    setBusyId(tokenId);
    try {
      const tokensToListForProp = parseShares(inputValue);

      const vaultContract = await web3Service.getVaultContract();
      const propertyToken = await vaultContract.fractionalData(tokenId);
      const propertyShareTokenAddr = propertyToken.tokenAddress;

      const propertyTokensTxn = await web3Service.getShareTokenContract(propertyShareTokenAddr);

      const marketplaceContract = await web3Service.getMarketplaceContract();
      const checkListingData = await marketplaceContract.listings(tokenId);
      const checkListing = checkListingData.active;

      const approveTx = await propertyTokensTxn.approve(contractsConfig.marketplace.address, tokensToListForProp);
      await approveTx.wait();

      if (!checkListing) {
        // listProperty takes the share token itself (not the tokenId) and the
        // opening price; the marketplace derives the tokenId from the token.
        const listTx = await marketplaceContract.listProperty(
          propertyShareTokenAddr,
          tokensToListForProp,
          parseStable(listingPrice),
        );
        await listTx.wait();
      } else {
        const addTokensTx = await marketplaceContract.addTokensToListing(tokenId, tokensToListForProp);
        await addTokensTx.wait();
      }

      const afterListingData = await marketplaceContract.listings(tokenId);
      const listingInfo = {
        shareToken: afterListingData.propertyToken,
        totalShares: formatShares(afterListingData.totalTokens),
        pricePerToken: formatStable(afterListingData.pricePerToken),
        remainingTokens: formatShares(afterListingData.remainingTokens),
      };

      setFractionalEvents((prev) => ({
        ...prev,
        [tokenId]: listingInfo,
      }));
      setExistingListings((prev) => ({ ...prev, [tokenId]: listingInfo.pricePerToken }));

      toast.success('Successfully listed to marketplace!');
      setTokenInputs((prev) => ({ ...prev, [tokenId]: '' }));
      fetchUserTokenBalance();
    } catch (error) {
      console.error('Error listing tokens:', error);
      toast.error(getContractErrorMessage(error, 'Failed to list tokens. Please try again.'));
    } finally {
      setBusyId(null);
    }
  };

  const handleInputChange = (tokenId, value) => {
    setTokenInputs((prev) => ({
      ...prev,
      [tokenId]: value,
    }));
  };

  useEffect(() => {
    if (userAddress) {
      fetchProperties(userAddress);
    } else {
      setLoading(false);
    }
  }, [userAddress]);

  useEffect(() => {
    if (properties.length > 0 && userAddress) {
      fetchUserTokenBalance();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [properties, userAddress]);

  const balanceFor = (id) => {
    const found = userTokenBalances.find((b) => b.propertyId === id);
    return found ? found.balance : '0';
  };

  return (
    <AppLayout>
      <PageHeader
        eyebrow="Your assets"
        title="List to Marketplace"
        description="Put your fractional shares up for sale. Price per share defaults to what the property was fractionalized at, and buyers pay with USDC."
        icon={
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M2.25 21h19.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21"
          />
        }
      />

      {!loading && (
        <div className="mb-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
          <StatCard
            label="Fractionalized assets"
            value={formatNumber(properties.length, 0)}
            tone="brand"
            icon={<ListIcon />}
          />
          <StatCard
            label="Shares you hold"
            value={formatNumber(totals.balance, 0)}
            sub="across your portfolio"
            tone="success"
            icon={<CoinsIcon />}
          />
          <StatCard
            label="Already listed"
            value={`${formatNumber(totals.listedCount, 0)} / ${formatNumber(properties.length, 0)}`}
            sub="properties live on the marketplace"
            tone="warning"
            icon={<PriceIcon />}
          />
        </div>
      )}

      {loading ? (
        <PropertyGridSkeleton />
      ) : properties.length > 0 ? (
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3"
        >
          {properties.map((prop) => {
            const availableBalance = balanceFor(prop.propertyId);
            const listingDone = fractionalEvents[prop.propertyId];
            const listedPrice = existingListings[prop.propertyId];
            const blocked = blockedByBuyBack[prop.propertyId];

            // Default the dropdown to the price per share this property was
            // fractionalized at, snapped to the nearest offered tier — the
            // owner can still pick a different tier before listing.
            const basePrice = fractionalizeBasePrices[prop.propertyId];
            const defaultPrice = basePrice
              ? PRICE_TIERS.reduce((closest, tier) =>
                  Math.abs(tier - basePrice) < Math.abs(closest - basePrice) ? tier : closest,
                )
              : DEFAULT_LISTING_PRICE;
            const selectedPrice = priceInputs[prop.propertyId] ?? defaultPrice;

            return (
              <motion.div key={prop.propertyId} variants={rise} className="h-full">
                <PropertyCard property={prop}>
                  {listingDone ? (
                    <div className="rounded-xl border border-emerald-200/70 bg-emerald-50/60 p-3.5 dark:border-emerald-900/60 dark:bg-emerald-950/30">
                      <div className="mb-2 flex items-center justify-between">
                        <Badge tone="success" dot>
                          Live on marketplace
                        </Badge>
                        <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                          {formatNumber(listingDone.remainingTokens)} remaining
                        </span>
                      </div>
                      <div className="space-y-1 text-xs text-emerald-800/80 dark:text-emerald-200/70">
                        <p className="flex items-center justify-between">
                          <span>Price per token</span>
                          <span className="font-mono font-semibold">{formatUsd(listingDone.pricePerToken)}</span>
                        </p>
                        <p className="truncate">
                          <span className="mr-1.5 text-emerald-700/60 dark:text-emerald-300/50">Token</span>
                          {shortenAddress(listingDone.shareToken, 10, 6)}
                        </p>
                      </div>
                    </div>
                  ) : blocked ? (
                    <div className="space-y-2 rounded-xl bg-amber-50 px-3.5 py-3 text-[12.5px] leading-relaxed text-amber-800 dark:bg-amber-950/20 dark:text-amber-300">
                      <p>
                        A buyback from this property&apos;s last listing is still open. It has to be withdrawn before
                        you can list again.
                      </p>
                      <Button
                        size="sm"
                        variant="secondary"
                        fullWidth
                        onClick={() => (window.location.href = ROUTES.withdrawBuyBack)}
                      >
                        Go to Withdraw Buyback
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between rounded-xl bg-indigo-50/70 px-3.5 py-2.5 text-[13px] dark:bg-indigo-500/10">
                        <span className="font-medium text-slate-500 dark:text-slate-400">Your balance</span>
                        <span className="font-bold text-indigo-700 tabular-nums dark:text-indigo-300">
                          {formatNumber(availableBalance)} tokens
                        </span>
                      </div>
                      <Input
                        label="Tokens to list"
                        type="number"
                        min="0"
                        placeholder="e.g. 500"
                        value={tokensInputs[prop.propertyId] || ''}
                        onChange={(e) => handleInputChange(prop.propertyId, e.target.value)}
                        hint={
                          Number(availableBalance) > 0
                            ? `Available: ${formatNumber(availableBalance)} tokens`
                            : 'No share balance found for this wallet'
                        }
                      />
                      {listedPrice ? (
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Already listed at{' '}
                          <span className="font-medium text-slate-600 dark:text-slate-300">${listedPrice}</span> per
                          share. These tokens will be added to that listing at the same price.
                        </p>
                      ) : (
                        <Select
                          label="Price per share"
                          value={selectedPrice}
                          onChange={(e) => setPriceInputs((prev) => ({ ...prev, [prop.propertyId]: e.target.value }))}
                        >
                          {PRICE_TIERS.map((tier) => (
                            <option key={tier} value={tier}>
                              ${tier}
                            </option>
                          ))}
                        </Select>
                      )}
                      <Button
                        fullWidth
                        disabled={Number(availableBalance) <= 0}
                        loading={busyId === prop.propertyId}
                        onClick={() => listToMarketplace(prop.propertyId, selectedPrice)}
                      >
                        {listedPrice ? 'Add to listing' : `List at $${selectedPrice}/token`}
                      </Button>
                      <p className="text-center text-[11px] text-slate-400 dark:text-slate-500">
                        Approve the marketplace, then the shares go live instantly
                      </p>
                    </div>
                  )}
                </PropertyCard>
              </motion.div>
            );
          })}
        </motion.div>
      ) : (
        <EmptyState
          title="No fractionalized assets found"
          action={
            <Button variant="soft" size="sm" onClick={() => (window.location.href = '/fractionalize-property')}>
              Fractionalize a property
            </Button>
          }
        >
          Properties appear here once they are fractionalized and owned by your connected wallet.
        </EmptyState>
      )}
    </AppLayout>
  );
};

const ListIcon = () => (
  <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M3 3h1.5v3A2.25 2.25 0 0 0 6.75 8.25h13.5m-13.5 0a2.25 2.25 0 0 1-2.25 2.25m13.5 0v3a2.25 2.25 0 0 1-2.25 2.25H10.5m-9 9h6m0 0v-6m0 6H3m3 0a2.25 2.25 0 0 1-2.25-2.25V15m13.5-9.75v-1.5A2.25 2.25 0 0 0 15 2.25H9a2.25 2.25 0 0 0-2.25 2.25v1.5"
    />
  </svg>
);

const CoinsIcon = () => (
  <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 5.625c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125"
    />
  </svg>
);

const PriceIcon = () => (
  <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182.552-.44 1.278-.659 2.003-.659.725 0 1.45.22 2.003.659L14.5 8.5"
    />
  </svg>
);

export default ListMarketplacePage;
