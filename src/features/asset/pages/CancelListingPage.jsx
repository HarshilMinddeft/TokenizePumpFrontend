import { useEffect, useMemo, useState } from 'react';
import { ethers } from 'ethers';
import { toast } from 'react-toastify';
import { motion } from 'motion/react';
import AppLayout from '../../../components/layout/AppLayout';
import AssetCard from '../components/AssetCard';
import AssetGridSkeleton from '../components/AssetGridSkeleton';
import PageHeader from '../../../components/ui/PageHeader';
import StatCard from '../../../components/ui/StatCard';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import EmptyState from '../../../components/ui/EmptyState';
import Badge from '../../../components/ui/Badge';
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

const formatDeadline = (timestamp) =>
  new Date(Number(timestamp) * 1000).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

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
  const [busyId, setBusyId] = useState(null);

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
    setBusyId(tokenId);
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
      setBusyId(null);
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
        title="Cancel Listing"
        description="Delist your active assets and reclaim any unsold shares. Listings with an open buyback stay locked until the claim window closes."
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
            label="Eligible withdrawers"
            value={userTokenBalances.length > 0 ? formatNumber(userTokenBalances.length, 0) : '—'}
            sub="with matching wallet balance"
            tone="brand"
            icon={<WalletIcon />}
          />
        </div>
      )}

      {loading ? (
        <AssetGridSkeleton />
      ) : assets.length > 0 ? (
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3"
        >
          {assets.map((prop) => {
            const tokenInfo = userTokenBalances.find((tkn) => tkn.assetId === prop.assetId);
            const isOwner = listingOwners[prop.assetId]?.toLowerCase() === currentSigner?.toLowerCase();
            const done = fractionalEvents[prop.assetId];
            const shares = assetShares[prop.assetId];
            const locked = lockedByBuyBack[prop.assetId];
            const outstanding = Number(outstandingShares[prop.assetId] || 0);
            const buyBackDeadline = buyBackDeadlines[prop.assetId];
            const listingPrice = Number(listingPrices[prop.assetId] || 0);
            const minBuyBackPrice = (listingPrice * MIN_BUYBACK_MULTIPLIER).toFixed(2);
            const buyBackPriceInput = buyBackPrices[prop.assetId] || '';

            return (
              <motion.div key={prop.assetId} variants={rise} className="h-full">
                <AssetCard asset={prop}>
                  {done ? (
                    <div className="rounded-xl border border-emerald-200/70 bg-emerald-50/60 p-3.5 dark:border-emerald-900/60 dark:bg-emerald-950/30">
                      <Badge tone="success" dot>
                        Delisted successfully
                      </Badge>
                      <p className="mt-2 text-xs leading-relaxed text-emerald-800/80 dark:text-emerald-200/70">
                        {done.buyBackActivated
                          ? 'The listing was closed, unsold shares were returned to your wallet, and a buyback was activated for outstanding shares.'
                          : 'The listing was closed and any unsold shares were returned to your wallet.'}
                      </p>
                      {done.buyBackActivated && done.buyBackDeadline && (
                        <>
                          <p className="mt-2 flex items-center justify-between rounded-lg bg-white/60 px-3 py-2 text-xs font-semibold text-emerald-800 dark:bg-slate-900/40 dark:text-emerald-300">
                            <span>Withdrawable from</span>
                            <span className="tabular-nums">{formatDeadline(done.buyBackDeadline)}</span>
                          </p>
                          <Button
                            size="sm"
                            variant="secondary"
                            fullWidth
                            className="mt-2"
                            onClick={() => (window.location.href = ROUTES.withdrawBuyBack)}
                          >
                            Go to Withdraw Buyback
                          </Button>
                        </>
                      )}
                    </div>
                  ) : tokenInfo && isOwner ? (
                    <div className="space-y-2.5">
                      <div className="space-y-1.5 rounded-xl bg-red-50/70 px-3.5 py-2.5 text-[13px] dark:bg-red-950/20">
                        <Row label="Your current balance" value={`${formatNumber(tokenInfo.balance)} shares`} />
                        <Row label="Total listed" value={`${formatNumber(shares)} shares`} />
                        <Row label="Held by investors" value={`${formatNumber(outstanding)} shares`} />
                        <p className="truncate pt-1 font-mono text-[10.5px] text-red-400/70 dark:text-red-300/50">
                          {tokenInfo.tokenAddress}
                        </p>
                      </div>
                      {locked ? (
                        <div className="space-y-2 rounded-xl bg-amber-50 px-3.5 py-3 text-[12.5px] leading-relaxed text-amber-800 dark:bg-amber-950/20 dark:text-amber-300">
                          <p>
                            A funded buyback is still open on this listing. Withdraw the remaining escrow once the
                            claim window closes, then delist.
                          </p>
                          {buyBackDeadline && (
                            <p className="flex items-center justify-between rounded-lg bg-white/60 px-3 py-2 font-semibold dark:bg-slate-900/40">
                              <span>Withdrawable from</span>
                              <span className="tabular-nums">{formatDeadline(buyBackDeadline)}</span>
                            </p>
                          )}
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
                        <>
                          {outstanding > 0 && (
                            <div className="space-y-2 rounded-xl border border-amber-200 bg-amber-50/60 p-3 dark:border-amber-900/60 dark:bg-amber-950/20">
                              <p className="text-[12.5px] leading-relaxed text-amber-800 dark:text-amber-300">
                                {formatNumber(outstanding)} shares are still held by investors. Delisting requires
                                setting a buyback price so they can sell back, The full cost is escrowed (pulled as
                                USDC) from your wallet up front, in the same transaction.
                              </p>
                              <Input
                                label="Buyback price per share (USDC)"
                                type="number"
                                min={minBuyBackPrice}
                                step="0.01"
                                value={buyBackPriceInput}
                                onChange={(e) =>
                                  setBuyBackPrices((prev) => ({ ...prev, [prop.assetId]: e.target.value }))
                                }
                                placeholder={`Min $${minBuyBackPrice}`}
                                error={
                                  buyBackPriceInput && Number(buyBackPriceInput) < Number(minBuyBackPrice)
                                    ? `Must be at least $${minBuyBackPrice} — 10% above the $${listingPrice} listing price`
                                    : undefined
                                }
                              />
                              <div className="flex items-center justify-between rounded-lg bg-white/60 px-3 py-2 text-[12.5px] dark:bg-slate-900/40">
                                <span className="font-medium text-amber-800 dark:text-amber-300">
                                  USDC you&apos;ll approve &amp; escrow
                                </span>
                                <span className="font-bold text-amber-900 tabular-nums dark:text-amber-200">
                                  {Number(buyBackPriceInput) > 0
                                    ? `$${formatNumber(outstanding * Number(buyBackPriceInput))}`
                                    : '—'}
                                </span>
                              </div>
                            </div>
                          )}
                          <Button
                            fullWidth
                            variant="danger"
                            loading={busyId === prop.assetId}
                            disabled={outstanding > 0 && !(Number(buyBackPriceInput) >= Number(minBuyBackPrice))}
                            onClick={() => cancelListing(prop.assetId, buyBackPriceInput)}
                          >
                            Delist asset
                          </Button>
                          <p className="text-center text-[11px] text-slate-400 dark:text-slate-500">
                            {outstanding > 0
                              ? 'Approves and escrows the USDC buyback deposit, then delists and returns unsold shares'
                              : 'No USDC required — nothing is outstanding, so this just delists and returns unsold shares'}
                          </p>
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="rounded-xl bg-slate-50 px-3.5 py-3 text-center text-[13px] font-medium text-slate-400 dark:bg-slate-950/50 dark:text-slate-500">
                      Listed by another wallet — only the listing owner can delist.
                    </div>
                  )}
                </AssetCard>
              </motion.div>
            );
          })}
        </motion.div>
      ) : (
        <EmptyState
          title="No active listings"
          action={
            <Button variant="soft" size="sm" onClick={() => (window.location.href = ROUTES.appMarketplace)}>
              Back to the marketplace
            </Button>
          }
        >
          Your active marketplace listings appear here once you list a fractionalized asset for sale.
        </EmptyState>
      )}
    </AppLayout>
  );
};

const Row = ({ label, value }) => (
  <div className="flex items-center justify-between gap-3">
    <span className="shrink-0 text-slate-400 dark:text-slate-500">{label}</span>
    <span className="min-w-0 truncate text-right font-semibold text-slate-700 tabular-nums dark:text-slate-200">
      {value}
    </span>
  </div>
);

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
