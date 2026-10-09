import { useEffect, useMemo, useState } from 'react';
import { ethers } from 'ethers';
import { toast } from 'react-toastify';
import { motion } from 'motion/react';
import AppLayout from '../../../components/layout/AppLayout';
import ListingConsole from '../components/ListingConsole';
import AssetGridSkeleton from '../components/AssetGridSkeleton';
import PageHeader from '../../../components/ui/PageHeader';
import StatCard from '../../../components/ui/StatCard';
import Button from '../../../components/ui/Button';
import EmptyState from '../../../components/ui/EmptyState';
import web3Service from '../../../services/web3Service';
import assetApi from '../api/assetApi';
import contractsConfig from '../../../config/contracts.config';
import { useWeb3 } from '../../../context/Web3Context';
import { getContractErrorMessage } from '../../../utils/web3Errors';
import { ROUTES, getAppAssetDetailsPath } from '../../../config/routes';
import {
  formatShares,
  formatStable,
  isValidPriceTier,
  parseStable,
  parseWholeShares,
  PRICE_STEP,
  PRICE_TIERS,
  WHOLE_SHARES_MESSAGE,
} from '../../../utils/units';
import { formatNumber } from '../../../lib/utils';

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
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fractionalEvents, setFractionalEvents] = useState({});
  const [tokensInputs, setTokenInputs] = useState({});
  const [priceInputs, setPriceInputs] = useState({});
  const [existingListings, setExistingListings] = useState({});
  const [blockedByBuyBack, setBlockedByBuyBack] = useState({});
  const [sliceValues, setSliceValues] = useState({});
  const [userTokenBalances, setUserTokenBalances] = useState([]);
  // tokenId → 'approve' | 'list' while that on-chain step runs
  const [stages, setStages] = useState({});
  const setStage = (id, stage) => setStages((prev) => ({ ...prev, [id]: stage }));

  const totals = useMemo(() => {
    let balance = 0;
    for (const t of userTokenBalances) balance += Number(t.balance) || 0;

    const listedCount = assets.filter((p) => existingListings[p.assetId]).length;

    return { count: userTokenBalances.length, balance, listedCount };
  }, [userTokenBalances, assets, existingListings]);

  const fetchAssets = async (address) => {
    try {
      const data = await assetApi.getOwnerAssets(address);
      const allProps = data.assets || [];

      const assetNftContract = web3Service.getReadOnlyAssetNftContract();
      const marketplaceContract = web3Service.getReadOnlyMarketplaceContract();
      const vaultContract = web3Service.getReadOnlyVaultContract();
      const filteredProps = [];
      for (const prop of allProps) {
        try {
          const isFrac = await assetNftContract.isFractionalized(prop.assetId);
          if (!isFrac) continue;

          filteredProps.push(prop);

          // An active listing already has a price; only a new listing lets the
          // owner choose one, so record which case each asset is in.
          const listing = await marketplaceContract.listings(prop.assetId);
          setExistingListings((prev) => ({
            ...prev,
            [prop.assetId]: listing.active ? formatStable(listing.pricePerToken) : null,
          }));

          // listAsset reverts (BuyBackActive) while a prior buyback on this
          // asset is still open — the owner has to let holders sell back
          // and then call withdrawBuyBackDeposit before re-listing.
          setBlockedByBuyBack((prev) => ({ ...prev, [prop.assetId]: listing.buyBack }));

          // The vault doesn't store the slice size Fractionalize used, but
          // assetPrice / totalShares recovers it exactly (that's how
          // totalShares was derived in the first place). It's the starting
          // listing price: at that price, all shares add up to the station value.
          if (!listing.active) {
            const { totalShares } = await vaultContract.fractionalData(prop.assetId);
            if (!totalShares.isZero()) {
              const sliceValue = Number(prop.assetPrice) / Number(formatShares(totalShares));
              setSliceValues((prev) => ({ ...prev, [prop.assetId]: sliceValue }));
            }
          }
        } catch (err) {
          console.error(`Error checking fractionalization for token ${prop.assetId}:`, err);
        }
      }
      setAssets(filteredProps);
    } catch (err) {
      console.error('Error fetching assets:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserTokenBalance = async () => {
    if (!userAddress) return;
    try {
      const vaultContract = web3Service.getReadOnlyVaultContract();
      const balances = [];

      for (const prop of assets) {
        try {
          const assetTokenData = await vaultContract.fractionalData(prop.assetId);
          const assetShareTokenAddr = assetTokenData.tokenAddress;

          if (assetShareTokenAddr && assetShareTokenAddr !== ethers.constants.AddressZero) {
            const provider = web3Service.getProvider();
            const tokenContract = new ethers.Contract(
              assetShareTokenAddr,
              ['function balanceOf(address) view returns (uint256)'],
              provider,
            );

            const balance = await tokenContract.balanceOf(userAddress);

            balances.push({
              assetId: prop.assetId,
              assetName: prop.assetName,
              tokenAddress: assetShareTokenAddr,
              balance: formatShares(balance),
            });
          }
        } catch (err) {
          console.error(`Error fetching balance for asset ${prop.assetId}:`, err);
        }
      }

      setUserTokenBalances(balances);
    } catch (err) {
      console.error('Error fetching token balances:', err);
    }
  };

  const listToMarketplace = async (tokenId, listingPrice) => {
    const tokensToListForProp = parseWholeShares(tokensInputs[tokenId]);
    if (!tokensToListForProp) {
      toast.error(WHOLE_SHARES_MESSAGE);
      return;
    }

    if (!isValidPriceTier(listingPrice)) {
      toast.error(`Price per share must be a multiple of $${PRICE_STEP}.`);
      return;
    }

    setStage(tokenId, 'approve');
    try {

      const vaultContract = await web3Service.getVaultContract();
      const assetToken = await vaultContract.fractionalData(tokenId);
      const assetShareTokenAddr = assetToken.tokenAddress;

      const assetTokensTxn = await web3Service.getShareTokenContract(assetShareTokenAddr);

      const marketplaceContract = await web3Service.getMarketplaceContract();
      const checkListingData = await marketplaceContract.listings(tokenId);
      const checkListing = checkListingData.active;

      const approveTx = await assetTokensTxn.approve(contractsConfig.marketplace.address, tokensToListForProp);
      await approveTx.wait();

      setStage(tokenId, 'list');
      if (!checkListing) {
        // listAsset takes the share token itself (not the tokenId) and the
        // opening price; the marketplace derives the tokenId from the token.
        const listTx = await marketplaceContract.listAsset(
          assetShareTokenAddr,
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
        shareToken: afterListingData.assetToken,
        totalShares: formatShares(afterListingData.totalTokens),
        pricePerToken: formatStable(afterListingData.pricePerToken),
        remainingTokens: formatShares(afterListingData.remainingTokens),
      };

      setFractionalEvents((prev) => ({
        ...prev,
        [tokenId]: listingInfo,
      }));
      setExistingListings((prev) => ({ ...prev, [tokenId]: listingInfo.pricePerToken }));

      toast.success('Your shares are live on the marketplace.');
      setTokenInputs((prev) => ({ ...prev, [tokenId]: '' }));
      fetchUserTokenBalance();
    } catch (error) {
      console.error('Error listing tokens:', error);
      toast.error(getContractErrorMessage(error, 'Failed to list tokens. Please try again.'));
    } finally {
      setStage(tokenId, null);
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
      fetchAssets(userAddress);
    } else {
      setLoading(false);
    }
  }, [userAddress]);

  useEffect(() => {
    if (assets.length > 0 && userAddress) {
      fetchUserTokenBalance();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assets, userAddress]);

  const balanceFor = (id) => {
    const found = userTokenBalances.find((b) => b.assetId === id);
    return found ? found.balance : '0';
  };
  const shareTokenFor = (id) => userTokenBalances.find((b) => b.assetId === id)?.tokenAddress;

  return (
    <AppLayout>
      <PageHeader
        eyebrow="Your assets"
        title="List to Marketplace"
        description="Put your station shares up for sale. Shares sell at the price they were created at when the station was fractionalized, so the shares always add up to the station's value. Buyers pay in USDC."
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
            label="Stations with shares"
            value={formatNumber(assets.length, 0)}
            tone="brand"
            icon={<ListIcon />}
          />
          <StatCard
            label="Shares you hold"
            value={formatNumber(totals.balance, 0)}
            sub="ready to list across your stations"
            tone="success"
            icon={<CoinsIcon />}
          />
          <StatCard
            label="Live listings"
            value={`${formatNumber(totals.listedCount, 0)} / ${formatNumber(assets.length, 0)}`}
            sub="stations live on the marketplace"
            tone="warning"
            icon={<PriceIcon />}
          />
        </div>
      )}

      {loading ? (
        <AssetGridSkeleton />
      ) : assets.length > 0 ? (
        <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-6">
          {assets.map((station) => {
            // The owner sets the price per share here ($10–$100). It starts at
            // the slice size (station value ÷ shares), where all shares add up
            // to the station's value; any other price is a deliberate premium
            // or discount, which the board shows.
            const sliceValue = sliceValues[station.assetId];
            const defaultPrice = isValidPriceTier(sliceValue)
              ? sliceValue
              : sliceValue
                ? PRICE_TIERS.reduce((closest, tier) =>
                    Math.abs(tier - sliceValue) < Math.abs(closest - sliceValue) ? tier : closest,
                  )
                : DEFAULT_LISTING_PRICE;
            const selectedPrice = priceInputs[station.assetId] ?? defaultPrice;

            return (
              <motion.div key={station.assetId} variants={rise}>
                <ListingConsole
                  asset={station}
                  balance={balanceFor(station.assetId)}
                  shareToken={shareTokenFor(station.assetId)}
                  price={selectedPrice}
                  sliceValue={sliceValue}
                  priceOptions={PRICE_TIERS}
                  onPickPrice={(value) => setPriceInputs((prev) => ({ ...prev, [station.assetId]: value }))}
                  listedPrice={existingListings[station.assetId]}
                  blocked={blockedByBuyBack[station.assetId]}
                  amount={tokensInputs[station.assetId] ?? ''}
                  onAmount={(value) => handleInputChange(station.assetId, value)}
                  onList={() => listToMarketplace(station.assetId, selectedPrice)}
                  stage={stages[station.assetId]}
                  done={fractionalEvents[station.assetId]}
                  onWithdraw={() => (window.location.href = ROUTES.withdrawBuyBack)}
                  onView={() => (window.location.href = getAppAssetDetailsPath(station.assetId))}
                />
              </motion.div>
            );
          })}
        </motion.div>
      ) : (
        <EmptyState
          title="No stations with shares yet"
          action={
            <Button variant="soft" size="sm" onClick={() => (window.location.href = '/fractionalize-asset')}>
              Fractionalize a station
            </Button>
          }
        >
          A station appears here once you fractionalize it — its shares are then ready to list.
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
