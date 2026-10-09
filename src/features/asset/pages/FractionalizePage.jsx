import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { motion } from 'motion/react';
import AppLayout from '../../../components/layout/AppLayout';
import StationConsole from '../components/StationConsole';
import AssetGridSkeleton from '../components/AssetGridSkeleton';
import PageHeader from '../../../components/ui/PageHeader';
import StatCard from '../../../components/ui/StatCard';
import Button from '../../../components/ui/Button';
import EmptyState from '../../../components/ui/EmptyState';
import web3Service from '../../../services/web3Service';
import assetApi from '../api/assetApi';
import contractsConfig from '../../../config/contracts.config';
import useAssetsFilteredBy from '../hooks/useAssetsFilteredBy';
import { useWeb3 } from '../../../context/Web3Context';
import { getContractErrorMessage } from '../../../utils/web3Errors';
import { evenlyDividingTiers } from '../../../utils/units';
import { formatNumber, formatUsd } from '../../../lib/utils';
import { ROUTES } from '../../../config/routes';

/** Suggested slice size (dollars of station value per share) when the owner hasn't chosen one. */
const DEFAULT_SLICE_VALUE = 40;

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
  return tiers.includes(DEFAULT_SLICE_VALUE) ? DEFAULT_SLICE_VALUE : tiers[0];
};

const FractionalizePage = () => {
  const { address: userAddress } = useWeb3();
  const [fractionalEvents, setFractionalEvents] = useState({});
  const [sliceValues, setSliceValues] = useState({});
  // tokenId → 'approve' | 'lock' | 'mint' while that on-chain step runs
  const [stages, setStages] = useState({});
  const navigate = useNavigate();
  const setStage = (id, stage) => setStages((prev) => ({ ...prev, [id]: stage }));

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

  const fractionalize = async (tokenId, complianceAddress, sliceValue) => {
    setStage(tokenId, 'approve');
    try {
      const assetNftContract = await web3Service.getAssetNftContract();
      const approveTx = await assetNftContract.approve(contractsConfig.vault.address, tokenId);
      await approveTx.wait();

      setStage(tokenId, 'lock');
      const vaultContract = await web3Service.getVaultContract();
      // _sliceValue divides the NFT's assetPrice (whole dollars) into whole
      // shares — passed unscaled, not in stablecoin units. Not a sale price.
      const vaultTx = await vaultContract.fractionalizeAsset(
        tokenId,
        complianceAddress,
        Math.floor(Number(sliceValue)),
      );
      setStage(tokenId, 'mint');
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
      toast.success('Station fractionalized — shares minted to your wallet.');
    } catch (error) {
      console.error('Error in Fractionalize:', error);
      toast.error(getContractErrorMessage(error, 'Fractionalization failed. Please try again.'));
    } finally {
      setStage(tokenId, null);
    }
  };

  return (
    <AppLayout>
      <PageHeader
        eyebrow="Your assets"
        title="Fractionalize a Station"
        description="Turn a tokenized fuel station into compliant shares. Pick a slice size (how much value each share represents), lock the station NFT in the vault, and the shares — each earning from the station’s income streams — land in your wallet, ready to list."
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
            label="Total Stations ready"
            value={formatNumber(assets.length, 0)}
            tone="brand"
            icon={<ChipIcon />}
          />
          <StatCard
            label="All Shares to be minted"
            value={formatNumber(totals.shares, 0)}
            sub="at each station’s default slice size"
            tone="success"
            icon={<CoinsIcon />}
          />
          <StatCard
            label="All Station value unlocking"
            value={formatUsd(totals.value, 0)}
            sub="across your stations"
            tone="warning"
            icon={<TrendIcon />}
          />
        </div>
      )}

      {loading ? (
        <AssetGridSkeleton />
      ) : assets.length > 0 ? (
        <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-6">
          {assets.map((station) => {
            const tiers = evenlyDividingTiers(station.assetPrice);
            const defaultTier = tiers.includes(DEFAULT_SLICE_VALUE) ? DEFAULT_SLICE_VALUE : tiers[0];
            const sliceValue = sliceValues[station.assetId] ?? String(defaultTier ?? '');
            return (
              <motion.div key={station.assetId} variants={rise}>
                <StationConsole
                  asset={station}
                  tiers={tiers}
                  sliceValue={sliceValue}
                  onPick={(value) => setSliceValues((prev) => ({ ...prev, [station.assetId]: value }))}
                  stage={stages[station.assetId]}
                  result={fractionalEvents[station.assetId]}
                  onFractionalize={() => fractionalize(station.assetId, station.complianceAddress, sliceValue)}
                  onList={() => navigate(ROUTES.listAsset)}
                />
              </motion.div>
            );
          })}
        </motion.div>
      ) : (
        <EmptyState
          title="No stations ready to fractionalize"
          action={
            <Button variant="soft" size="sm" onClick={() => navigate(ROUTES.tokenizeAsset)}>
              Tokenize an asset first
            </Button>
          }
        >
          You don’t own a tokenized station yet. Once a station NFT is minted to your wallet it will appear here.
        </EmptyState>
      )}
    </AppLayout>
  );
};

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
