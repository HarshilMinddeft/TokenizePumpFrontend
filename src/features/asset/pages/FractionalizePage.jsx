import { useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { motion } from 'motion/react';
import AppLayout from '../../../components/layout/AppLayout';
import AssetCard from '../components/AssetCard';
import AssetGridSkeleton from '../components/AssetGridSkeleton';
import PageHeader from '../../../components/ui/PageHeader';
import StatCard from '../../../components/ui/StatCard';
import Button from '../../../components/ui/Button';
import Select from '../../../components/ui/Select';
import EmptyState from '../../../components/ui/EmptyState';
import Badge from '../../../components/ui/Badge';
import web3Service from '../../../services/web3Service';
import assetApi from '../api/assetApi';
import contractsConfig from '../../../config/contracts.config';
import useAssetsFilteredBy from '../hooks/useAssetsFilteredBy';
import { useWeb3 } from '../../../context/Web3Context';
import { getContractErrorMessage } from '../../../utils/web3Errors';
import { evenlyDividingTiers, PRICE_STEP } from '../../../utils/units';
import { formatNumber, formatUsd, shortenAddress } from '../../../lib/utils';

/** Suggested price per share, in whole dollars, when the owner hasn't chosen one. */
const DEFAULT_BASE_PRICE = 40;

const isNotFractionalized = async (asset, assetNftContract) => {
  const isFrac = await assetNftContract.isFractionalized(asset.assetId);
  return !isFrac;
};

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};
const rise = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.32, ease: 'easeOut' } },
};

/** Cheapest evenly-dividing tier — used for the estimate before the owner picks one. */
const cheapestTierFor = (assetPrice) => {
  const tiers = evenlyDividingTiers(assetPrice);
  return tiers.includes(DEFAULT_BASE_PRICE) ? DEFAULT_BASE_PRICE : tiers[0];
};

const FractionalizePage = () => {
  const { address: userAddress } = useWeb3();
  const [fractionalEvents, setFractionalEvents] = useState({});
  const [basePrices, setBasePrices] = useState({});
  const [busyId, setBusyId] = useState(null);

  const { assets, loading } = useAssetsFilteredBy(
    () => (userAddress ? assetApi.getOwnerAssets(userAddress) : Promise.resolve({ assets: [] })),
    isNotFractionalized,
    web3Service.getReadOnlyAssetNftContract,
    [userAddress],
  );

  const totals = useMemo(() => {
    let value = 0;
    let shares = 0;
    for (const p of assets) {
      value += Number(p.assetPrice) || 0;
      const tier = cheapestTierFor(p.assetPrice);
      shares += tier ? Math.floor(Number(p.assetPrice) / tier) : 0;
    }
    return { value, shares };
  }, [assets]);

  const fractionalize = async (tokenId, complianceAddress, basePrice) => {
    setBusyId(tokenId);
    try {
      const assetNftContract = await web3Service.getAssetNftContract();
      const approveTx = await assetNftContract.approve(contractsConfig.vault.address, tokenId);
      await approveTx.wait();

      const vaultContract = await web3Service.getVaultContract();
      // _basePrice divides the NFT's assetPrice, which is stored as a
      // whole-dollar figure — so it is passed unscaled, not in stablecoin units.
      const vaultTx = await vaultContract.fractionalizeAsset(
        tokenId,
        complianceAddress,
        Math.floor(Number(basePrice)),
      );
      await vaultTx.wait();

      const assetToken = await vaultContract.fractionalData(tokenId);
      setFractionalEvents((prev) => ({
        ...prev,
        [tokenId]: {
          shareToken: assetToken.tokenAddress,
          totalShares: assetToken.totalShares.toString(),
          originalOwner: assetToken.originalOwner,
          complianceAddress: assetToken.complianceAddress,
        },
      }));
      toast.success('Asset fractionalized successfully.');
    } catch (error) {
      console.error('Error in Fractionalize:', error);
      toast.error(getContractErrorMessage(error, 'Fractionalization failed. Please try again.'));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <AppLayout>
      <PageHeader
        eyebrow="Your assets"
        title="Fractionalize Asset"
        description="Split a tokenized asset into a compliant share token. Fractionalized assets can then be listed on the marketplace or traded via the order book."
        icon={
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9.75 3.104v5.714a2.25 2.25 0 0 1-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 0 1 4.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0 1 12 15a9.065 9.065 0 0 0-6.23-.693L5 14.5m14.8.8 1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0 1 12 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5"
          />
        }
      />

      {!loading && (
        <div className="mb-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
          <StatCard
            label="Eligible assets"
            value={formatNumber(assets.length, 0)}
            tone="brand"
            icon={<ChipIcon />}
          />
          <StatCard
            label="Shares to be created across all assets"
            value={formatNumber(totals.shares, 0)}
            sub="At each one's cheapest divisible price"
            tone="success"
            icon={<CoinsIcon />}
          />
          <StatCard
            label="Asset value unlocking"
            value={formatUsd(totals.value, 0)}
            sub="across eligible assets"
            tone="warning"
            icon={<TrendIcon />}
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
            const validTiers = evenlyDividingTiers(prop.assetPrice);
            const defaultTier = validTiers.includes(DEFAULT_BASE_PRICE) ? DEFAULT_BASE_PRICE : validTiers[0];
            const basePrice = basePrices[prop.assetId] ?? String(defaultTier ?? '');
            const shares = Number(basePrice) > 0 ? Math.floor(Number(prop.assetPrice) / Number(basePrice)) : 0;
            const done = fractionalEvents[prop.assetId];

            return (
              <motion.div key={prop.assetId} variants={rise} className="h-full">
                <AssetCard asset={prop}>
                  {done ? (
                    <SuccessPanel
                      shareToken={done.shareToken}
                      totalShares={done.totalShares}
                      caption="This asset is now fractionalized. List it on the marketplace to start selling shares."
                    />
                  ) : (
                    <div className="space-y-3">
                      {validTiers.length > 0 ? (
                        <Select
                          label="Price per share"
                          value={basePrice}
                          onChange={(e) => setBasePrices((prev) => ({ ...prev, [prop.assetId]: e.target.value }))}
                        >
                          {validTiers.map((tier) => (
                            <option key={tier} value={tier}>
                              ${tier}
                            </option>
                          ))}
                        </Select>
                      ) : (
                        <p className="text-xs font-medium text-red-500 dark:text-red-400">
                          No ${PRICE_STEP}-multiple price evenly divides ${prop.assetPrice} — this asset
                          cannot be fractionalized into whole shares.
                        </p>
                      )}
                      <div className="flex items-center justify-between rounded-xl bg-indigo-50/70 px-3.5 py-2.5 text-[13px] dark:bg-indigo-500/10">
                        <span className="font-medium text-slate-500 dark:text-slate-400">Share supply created</span>
                        <span className="font-bold text-indigo-700 tabular-nums dark:text-indigo-300">
                          {shares.toLocaleString()} tokens
                        </span>
                      </div>
                      <Button
                        fullWidth
                        loading={busyId === prop.assetId}
                        disabled={shares === 0}
                        onClick={() => fractionalize(prop.assetId, prop.complianceAddress, basePrice)}
                      >
                        Fractionalize asset
                      </Button>
                      <p className="text-center text-[11px] text-slate-400 dark:text-slate-500">
                        Approve the NFT, then the vault mints the share token
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
          title="No assets ready to fractionalize"
          action={
            <Button variant="soft" size="sm" onClick={() => (window.location.href = '/tokenize-asset')}>
              Tokenize an asset first
            </Button>
          }
        >
          You don’t own any tokenized assets yet. Once an asset NFT is minted to your wallet it will appear here.
        </EmptyState>
      )}
    </AppLayout>
  );
};

/* Shared success panel used by several asset pages */
const SuccessPanel = ({ shareToken, totalShares, caption, label = 'Completed' }) => (
  <div className="rounded-xl border border-emerald-200/70 bg-emerald-50/60 p-3.5 dark:border-emerald-900/60 dark:bg-emerald-950/30">
    <div className="mb-2 flex items-center justify-between">
      <Badge tone="success" dot>
        {label}
      </Badge>
      {totalShares && (
        <span className="text-xs font-semibold text-emerald-700 tabular-nums dark:text-emerald-300">
          {formatNumber(totalShares)} shares
        </span>
      )}
    </div>
    {shareToken && (
      <p className="truncate font-mono text-[11px] text-emerald-700/80 dark:text-emerald-300/70">
        {shortenAddress(shareToken, 10, 6)}
      </p>
    )}
    {caption && <p className="mt-2 text-xs leading-relaxed text-emerald-800/80 dark:text-emerald-200/70">{caption}</p>}
  </div>
);

const ChipIcon = () => (
  <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M8.25 3v1.5M4.5 8.25H3m18 0h-1.5M4.5 12H3m18 0h-1.5m-15 3.75H3m18 0h-1.5M8.25 19.5V21M12 3v1.5m0 15V21m3.75-18v1.5m0 15V21m-9-1.5h10.5a2.25 2.25 0 0 0 2.25-2.25V6.75a2.25 2.25 0 0 0-2.25-2.25H6.75A2.25 2.25 0 0 0 4.5 6.75v10.5a2.25 2.25 0 0 0 2.25 2.25Zm.75-12h9v9h-9v-9Z"
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

export default FractionalizePage;
