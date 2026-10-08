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
import EmptyState from '../../../components/ui/EmptyState';
import Badge from '../../../components/ui/Badge';
import web3Service from '../../../services/web3Service';
import assetApi from '../api/assetApi';
import contractsConfig from '../../../config/contracts.config';
import { ROUTES } from '../../../config/routes';
import { useWeb3 } from '../../../context/Web3Context';
import { getContractErrorMessage } from '../../../utils/web3Errors';
import { formatShares } from '../../../utils/units';
import { expectedShares, formatNumber, formatUsd, shortenAddress } from '../../../lib/utils';

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};
const rise = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.32, ease: 'easeOut' } },
};

const RedeemTokensPage = () => {
  const { address } = useWeb3();
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fractionalEvents, setFractionalEvents] = useState({});
  const [ownerBalances, setOwnerBalances] = useState({});
  const [busyId, setBusyId] = useState(null);

  const totals = useMemo(() => {
    let value = 0;
    let shares = 0;
    for (const p of assets) {
      value += Number(p.assetPrice) || 0;
      shares += expectedShares(p.assetPrice);
    }
    return { value, shares };
  }, [assets]);

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

          // redeemShares now only requires marketplace.wasCancelled(tokenId)
          // (set by cancelListing) plus holding your own balance — not 100%
          // of supply, since any shares still out after a buyback window
          // closes are simply forfeited by their holders, not blocking.
          const wasCancelled = await marketplaceContract.wasCancelled(prop.assetId);
          if (!wasCancelled) continue;

          const fracData = await vaultContract.fractionalData(prop.assetId);
          if (fracData.redeemed) continue;

          filteredProps.push(prop);
        } catch (err) {
          console.error(`Error checking asset ${prop.assetId}:`, err);
        }
      }
      setAssets(filteredProps);
    } catch (err) {
      console.error('Error fetching assets:', err);
    } finally {
      setLoading(false);
    }
  };

  const redeemTokens = async (tokenId, complianceAddress) => {
    setBusyId(tokenId);
    try {
      const signer = await web3Service.getSigner();
      const vaultContract = await web3Service.getVaultContract();

      const assetToken = await vaultContract.fractionalData(tokenId);
      const assetShareTokenAddr = assetToken.tokenAddress;

      const assetTokensTxn = await web3Service.getShareTokenContract(assetShareTokenAddr);

      // redeemShares pulls whatever the caller actually holds, which is less
      // than totalShares whenever any shares were sold and not bought back.
      const owner = await signer.getAddress();
      const ownerBalance = await assetTokensTxn.balanceOf(owner);

      const approveTx = await assetTokensTxn.approve(contractsConfig.vault.address, ownerBalance);
      await approveTx.wait();

      const vaultTx = await vaultContract.redeemShares(tokenId);
      await vaultTx.wait();

      const unbindTokenContract = new ethers.Contract(complianceAddress, contractsConfig.compliance.abi, signer);

      const unbindTx = await unbindTokenContract.unbindToken(assetShareTokenAddr);
      await unbindTx.wait();

      const afterData = await vaultContract.fractionalData(tokenId);
      setFractionalEvents((prev) => ({
        ...prev,
        [tokenId]: {
          shareToken: afterData.tokenAddress,
          totalShares: afterData.totalShares.toString(),
          originalOwner: afterData.originalOwner,
          compAddress: afterData.complianceAddress,
        },
      }));
      toast.success('Asset tokens redeemed successfully.');
    } catch (error) {
      console.error('Error redeeming asset tokens:', error);
      toast.error(getContractErrorMessage(error, 'Redemption failed. Please try again.'));
    } finally {
      setBusyId(null);
    }
  };

  useEffect(() => {
    if (address) {
      fetchAssets(address);
    } else {
      setLoading(false);
    }
  }, [address]);

  useEffect(() => {
    if (!address || assets.length === 0) return;
    let cancelled = false;

    (async () => {
      const vaultContract = web3Service.getReadOnlyVaultContract();
      const provider = web3Service.getProvider();
      const balances = {};
      for (const prop of assets) {
        try {
          const fracData = await vaultContract.fractionalData(prop.assetId);
          const tokenContract = new ethers.Contract(fracData.tokenAddress, contractsConfig.shareToken.abi, provider);
          const balance = await tokenContract.balanceOf(address);
          balances[prop.assetId] = formatShares(balance);
        } catch (err) {
          console.error(`Error fetching share balance for asset ${prop.assetId}:`, err);
        }
      }
      if (!cancelled) setOwnerBalances(balances);
    })();

    return () => {
      cancelled = true;
    };
  }, [address, assets]);

  return (
    <AppLayout>
      <PageHeader
        eyebrow="Your assets"
        title="Redeem Asset"
        description="Once a listing is cancelled (and any buyback window has run its course), redeem your shares to unbind the compliance contract and reclaim full ownership of the underlying asset."
        icon={
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"
          />
        }
      />

      {!loading && (
        <div className="mb-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
          <StatCard
            label="Redeemable assets"
            value={formatNumber(assets.length, 0)}
            tone="brand"
            icon={<RedeemIcon />}
          />
          <StatCard
            label="Shares you must hold"
            value={formatNumber(totals.shares, 0)}
            sub="to burn for full ownership"
            tone="success"
            icon={<CoinsIcon />}
          />
          <StatCard
            label="Asset value recovered"
            value={formatUsd(totals.value, 0)}
            sub="when redemption completes"
            tone="warning"
            icon={<TrendIcon />}
          />
        </div>
      )}

      {loading ? (
        <AssetGridSkeleton />
      ) : assets.length > 0 ? (
        <motion.div variants={stagger} initial="hidden" animate="show" className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {assets.map((prop) => {
            const done = fractionalEvents[prop.assetId];
            return (
              <motion.div key={prop.assetId} variants={rise} className="h-full">
                <AssetCard asset={prop}>
                  {done ? (
                    <div className="rounded-xl border border-emerald-200/70 bg-emerald-50/60 p-3.5 dark:border-emerald-900/60 dark:bg-emerald-950/30">
                      <Badge tone="success" dot>
                        All tokens redeemed
                      </Badge>
                      {done.compAddress && done.compAddress !== ethers.constants.AddressZero && (
                        <p className="mt-2 truncate font-mono text-[11px] text-emerald-700/80 dark:text-emerald-300/70">
                          {shortenAddress(done.compAddress, 10, 6)}
                        </p>
                      )}
                      <p className="mt-2 text-xs leading-relaxed text-emerald-800/80 dark:text-emerald-200/70">
                        The compliance contract was unbound — ownership of the asset is back with the original holder.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="space-y-1.5 rounded-xl bg-slate-50 px-3.5 py-2.5 text-[13px] dark:bg-slate-950/50">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400 dark:text-slate-500">Your share balance</span>
                          <span className="font-bold text-slate-700 tabular-nums dark:text-slate-200">
                            {formatNumber(ownerBalances[prop.assetId] ?? 0)} tokens
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400 dark:text-slate-500">Listing</span>
                          <span className="font-bold text-emerald-600 tabular-nums dark:text-emerald-400">
                            Cancelled — ready to redeem
                          </span>
                        </div>
                      </div>
                      <Button
                        fullWidth
                        loading={busyId === prop.assetId}
                        disabled={!(Number(ownerBalances[prop.assetId]) > 0)}
                        onClick={() => redeemTokens(prop.assetId, prop.complianceAddress)}
                      >
                        Redeem & reclaim asset
                      </Button>
                      <p className="text-center text-[11px] text-slate-400 dark:text-slate-500">
                        Burns your share balance and unbinds compliance — any shares other holders never sold back
                        stay with them
                      </p>
                    </div>
                  )}
                </AssetCard>
              </motion.div>
            );
          })}
        </motion.div>
      ) : (
        <EmptyState
          title="Nothing to redeem right now"
          action={
            <Button variant="soft" size="sm" onClick={() => (window.location.href = ROUTES.appMarketplace)}>
              Browse the marketplace
            </Button>
          }
        >
          Assets appear here when they are fully fractionalized and not actively listed. Make sure the required
          share supply is held by your wallet.
        </EmptyState>
      )}
    </AppLayout>
  );
};

const RedeemIcon = () => (
  <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"
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

const TrendIcon = () => (
  <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.281m5.94 2.28-2.28 5.941" />
  </svg>
);

export default RedeemTokensPage;
