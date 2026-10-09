import { useEffect, useMemo, useState } from 'react';
import { ethers } from 'ethers';
import { toast } from 'react-toastify';
import { motion } from 'motion/react';
import AppLayout from '../../../components/layout/AppLayout';
import CancelConsole from '../components/CancelConsole';
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
import { formatShares, formatStable, parseStable } from '../../../utils/units';
import { formatNumber } from '../../../lib/utils';
import { ROUTES } from '../../../config/routes';

/** Buyback must be priced at least 10% above the listing price (contract rule). */
const MIN_BUYBACK_MULTIPLIER = 1.1;

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};
const rise = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.32, ease: 'easeOut' } },
};

const CancelListingPage = () => {
  const { address: currentSigner } = useWeb3();
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fractionalEvents, setFractionalEvents] = useState({});
  const [userTokenBalances, setUserTokenBalances] = useState([]);
  const [assetShares, setAssetShares] = useState({});
  const [listingOwners, setListingOwners] = useState({});
  const [lockedByBuyBack, setLockedByBuyBack] = useState({});
  const [buyBackDeadlines, setBuyBackDeadlines] = useState({});
  const [listingPrices, setListingPrices] = useState({});
  const [outstandingShares, setOutstandingShares] = useState({});
  const [buyBackPrices, setBuyBackPrices] = useState({});
  const [unsoldShares, setUnsoldShares] = useState({});
  // tokenId → 'approve' | 'cancel' while that on-chain step runs
  const [stages, setStages] = useState({});
  const setStage = (id, stage) => setStages((prev) => ({ ...prev, [id]: stage }));

  const totals = useMemo(() => {
    let shares = 0;
    for (const key of Object.keys(assetShares)) {
      shares += Number(assetShares[key]) || 0;
    }
    return { count: assets.length, shares };
  }, [assets, assetShares]);

  const fetchAssets = async () => {
    try {
      const data = await assetApi.getAllMarketplaceAssets();
      const allProps = data.assets || [];

      const marketplaceContract = web3Service.getReadOnlyMarketplaceContract();
      const filteredProps = [];
      for (const prop of allProps) {
        try {
          const checkListing = await marketplaceContract.listings(prop.assetId);
          const outstanding = await marketplaceContract.outstandingTokens(prop.assetId);

          // cancelListing is now also callable on a sold-out listing (active
          // flips false in buyTokens once remainingTokens hits 0) as long as
          // it hasn't opened a buyback yet — that's the owner's only path to
          // start one for shares already fully sold. Once buyBack is on,
          // active stays false and outstanding only shrinks as holders sell
          // back, so this listing wouldn't otherwise reappear here.
          const hasUnsettledBuyBack = !checkListing.buyBack && !outstanding.isZero();
          if (!checkListing.active && !hasUnsettledBuyBack) continue;

          filteredProps.push(prop);
          setAssetShares((prev) => ({
            ...prev,
            [prop.assetId]: formatShares(checkListing.totalTokens),
          }));
          setOutstandingShares((prev) => ({
            ...prev,
            [prop.assetId]: formatShares(outstanding),
          }));
          setUnsoldShares((prev) => ({ ...prev, [prop.assetId]: formatShares(checkListing.remainingTokens) }));
          setListingPrices((prev) => ({
            ...prev,
            [prop.assetId]: formatStable(checkListing.pricePerToken),
          }));
          setListingOwners((prev) => ({ ...prev, [prop.assetId]: checkListing.owner }));
          // A listing with escrow still committed to holders can't be
          // cancelled again until the claim window closes and the owner
          // withdraws — cancelListing itself reverts (BuyBackActive) in
          // that state, since the escrow is already locked to a live
          // buyback price.
          setLockedByBuyBack((prev) => ({
            ...prev,
            [prop.assetId]: !checkListing.buyBackEscrow.isZero(),
          }));
          setBuyBackDeadlines((prev) => ({
            ...prev,
            [prop.assetId]: checkListing.buyBackDeadline.toString(),
          }));
        } catch (err) {
          console.error(`Error checking marketplace listing for token ${prop.assetId}:`, err);
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
    if (!currentSigner) return;
    try {
      const provider = web3Service.getProvider();
      const vaultContract = web3Service.getReadOnlyVaultContract();
      const balances = [];

      for (const prop of assets) {
        try {
          const fractionalData = await vaultContract.fractionalData(prop.assetId);
          const tokenAddress = fractionalData.tokenAddress;

          if (tokenAddress && tokenAddress !== ethers.constants.AddressZero) {
            const tokenContract = new ethers.Contract(tokenAddress, contractsConfig.shareToken.abi, provider);

            const [balance, symbol] = await Promise.all([
              tokenContract.balanceOf(currentSigner),
              tokenContract.symbol(),
            ]);

            balances.push({
              assetId: prop.assetId,
              tokenAddress,
              symbol,
              balance: formatShares(balance),
            });
          }
        } catch (err) {
          console.error(`Failed for asset ID ${prop.assetId}:`, err);
        }
      }
      setUserTokenBalances(balances);
    } catch (err) {
      console.error('Error fetching token balances:', err);
    }
  };

  const cancelListing = async (tokenId, buyBackPriceInput) => {
    const hasOutstandingNow = Number(outstandingShares[tokenId]) > 0;
    setStage(tokenId, hasOutstandingNow ? 'approve' : 'cancel');
    try {
      const hasOutstanding = Number(outstandingShares[tokenId]) > 0;
      const marketplaceContract = await web3Service.getMarketplaceContract();

      // cancelListing only reads buyBackPrice when shares are still
      // outstanding (it activates a buyback for them in the same call) — 0
      // is fine to pass otherwise, since the contract ignores it.
      const buyBackPrice = hasOutstanding ? parseStable(buyBackPriceInput) : ethers.constants.Zero;

      if (hasOutstanding) {
        // Ask the contract what it will pull rather than recomputing it
        // here, so the approval can never come up short of what
        // cancelListing needs to escrow.
        const deposit = await marketplaceContract.buyBackDepositRequired(tokenId, buyBackPrice);
        const stableCoin = await web3Service.getStableCoinContract();
        const approveTx = await stableCoin.approve(contractsConfig.marketplace.address, deposit);
        await approveTx.wait();
      }

      setStage(tokenId, 'cancel');
      const cancelTx = await marketplaceContract.cancelListing(tokenId, buyBackPrice);
      await cancelTx.wait();

      const listing = await marketplaceContract.listings(tokenId);
      const listingData = {
        assetTokenAddress: listing.assetToken,
        remainingTokens: formatShares(listing.remainingTokens),
        buyBackActivated: listing.buyBack,
        buyBackDeadline: listing.buyBackDeadline.toString(),
      };

      setFractionalEvents((prev) => ({
        ...prev,
        [tokenId]: listingData,
      }));
      toast.success(
        hasOutstanding
          ? 'Listing cancelled — buyback activated for outstanding shares.'
          : 'Listing cancelled successfully.',
      );
    } catch (error) {
      console.error('Transaction error:', error);
      toast.error(getContractErrorMessage(error, 'Failed to cancel listing. Please try again.'));
    } finally {
      setStage(tokenId, null);
    }
  };

  useEffect(() => {
    if (assets.length > 0 && currentSigner) {
      fetchUserTokenBalance();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assets, currentSigner]);

  useEffect(() => {
    fetchAssets();
  }, []);

  return (
    <AppLayout>
      <PageHeader
        eyebrow="Your assets"
        title="Delist a Station"
        description="Take a station off the marketplace. Unsold shares come straight back to you; if investors already hold shares, you fund a buyback so they can sell back at a premium before you reclaim the station."
        icon={
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
          />
        }
      />

      {!loading && (
        <div className="mb-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
          <StatCard
            label="Active listings"
            value={formatNumber(totals.count, 0)}
            tone="danger"
            icon={<CancelIcon />}
          />
          <StatCard
            label="Shares listed"
            value={formatNumber(totals.shares, 0)}
            sub="held by the marketplace"
            tone="warning"
            icon={<LockIcon />}
          />
          <StatCard
            label="Your listings"
            value={formatNumber(
              assets.filter((a) => listingOwners[a.assetId]?.toLowerCase() === currentSigner?.toLowerCase()).length,
              0,
            )}
            sub="stations you can delist"
            tone="brand"
            icon={<WalletIcon />}
          />
        </div>
      )}

      {loading ? (
        <AssetGridSkeleton />
      ) : assets.length > 0 ? (
        <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-6">
          {assets.map((station) => {
            const tokenInfo = userTokenBalances.find((tkn) => tkn.assetId === station.assetId);
            const isOwner = listingOwners[station.assetId]?.toLowerCase() === currentSigner?.toLowerCase();
            const listingPrice = Number(listingPrices[station.assetId] || 0);
            return (
              <motion.div key={station.assetId} variants={rise}>
                <CancelConsole
                  asset={station}
                  isOwner={isOwner}
                  balance={tokenInfo?.balance}
                  shareToken={tokenInfo?.tokenAddress}
                  symbol={tokenInfo?.symbol}
                  listed={Number(assetShares[station.assetId] || 0)}
                  unsold={Number(unsoldShares[station.assetId] || 0)}
                  outstanding={Number(outstandingShares[station.assetId] || 0)}
                  listingPrice={listingPrice}
                  minBuyBackPrice={Math.ceil(listingPrice * MIN_BUYBACK_MULTIPLIER * 100) / 100}
                  locked={lockedByBuyBack[station.assetId]}
                  deadline={buyBackDeadlines[station.assetId]}
                  buyBackPrice={buyBackPrices[station.assetId] || ''}
                  onBuyBackPrice={(value) => setBuyBackPrices((prev) => ({ ...prev, [station.assetId]: value }))}
                  onCancel={() => cancelListing(station.assetId, buyBackPrices[station.assetId] || '')}
                  stage={stages[station.assetId]}
                  done={fractionalEvents[station.assetId]}
                  onWithdraw={() => (window.location.href = ROUTES.withdrawBuyBack)}
                />
              </motion.div>
            );
          })}
        </motion.div>
      ) : (
        <EmptyState
          title="No live listings"
          action={
            <Button variant="soft" size="sm" onClick={() => (window.location.href = ROUTES.appMarketplace)}>
              Back to the marketplace
            </Button>
          }
        >
          A station appears here while its shares are on sale on the marketplace.
        </EmptyState>
      )}
    </AppLayout>
  );
};


const CancelIcon = () => (
  <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
  </svg>
);

const LockIcon = () => (
  <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z"
    />
  </svg>
);

const WalletIcon = () => (
  <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M21 12a2.25 2.25 0 0 0-2.25-2.25H15a3 3 0 1 1-6 0H5.25A2.25 2.25 0 0 0 3 12m18 0v6a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 9m18 0V6a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 6v3"
    />
  </svg>
);

export default CancelListingPage;
