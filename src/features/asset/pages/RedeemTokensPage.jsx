import { useEffect, useMemo, useState } from 'react';
import { ethers } from 'ethers';
import { toast } from 'react-toastify';
import { motion } from 'motion/react';
import AppLayout from '../../../components/layout/AppLayout';
import RedeemConsole from '../components/RedeemConsole';
import AssetGridSkeleton from '../components/AssetGridSkeleton';
import PageHeader from '../../../components/ui/PageHeader';
import StatCard from '../../../components/ui/StatCard';
import Button from '../../../components/ui/Button';
import EmptyState from '../../../components/ui/EmptyState';
import web3Service from '../../../services/web3Service';
import assetApi from '../api/assetApi';
import contractsConfig from '../../../config/contracts.config';
import { ROUTES } from '../../../config/routes';
import { useWeb3 } from '../../../context/Web3Context';
import { getContractErrorMessage } from '../../../utils/web3Errors';
import { formatShares } from '../../../utils/units';
import { formatNumber, formatUsd } from '../../../lib/utils';

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
  // tokenId → { shareToken, supply, balance, holdsAll } read from chain
  const [shareInfo, setShareInfo] = useState({});
  // tokenId → 'approve' | 'burn' | 'unbind' while that step runs
  const [stages, setStages] = useState({});
  const setStage = (id, stage) => setStages((prev) => ({ ...prev, [id]: stage }));

  const totals = useMemo(() => {
    let value = 0;
    let shares = 0;
    for (const p of assets) {
      value += Number(p.assetPrice) || 0;
      shares += Number(shareInfo[p.assetId]?.balance ?? 0);
    }
    return { value, shares };
  }, [assets, shareInfo]);

  const fetchAssets = async (address) => {
    try {
      const data = await assetApi.getOwnerAssets(address);
      const allProps = data.assets || [];

      const assetNftContract = web3Service.getReadOnlyAssetNftContract();
      const marketplaceContract = web3Service.getReadOnlyMarketplaceContract();
      const vaultContract = web3Service.getReadOnlyVaultContract();
      const filteredProps = [];
      const info = {};
      for (const prop of allProps) {
        try {
          const isFrac = await assetNftContract.isFractionalized(prop.assetId);
          if (!isFrac) continue;

          const fracData = await vaultContract.fractionalData(prop.assetId);
          if (fracData.redeemed) continue;

          // redeemShares allows either:
          //  - you hold every share (never listed, or nothing sold/listed
          //    away) — nobody else to protect, redeem straight away; or
          //  - the listing was cancelled (cancelListing → buyback), in which
          //    case your own balance is enough.
          const shareToken = new ethers.Contract(
            fracData.tokenAddress,
            contractsConfig.shareToken.abi,
            web3Service.getReadOnlyProvider(),
          );
          const [balance, supply, symbol] = await Promise.all([
            shareToken.balanceOf(address),
            shareToken.totalSupply(),
            shareToken.symbol().catch(() => ''),
          ]);
          const holdsAllShares = !balance.isZero() && balance.eq(supply);
          if (!holdsAllShares && !(await marketplaceContract.wasCancelled(prop.assetId))) continue;

          info[prop.assetId] = {
            shareToken: fracData.tokenAddress,
            symbol,
            supply: formatShares(supply),
            balance: formatShares(balance),
            holdsAll: holdsAllShares,
          };
          filteredProps.push(prop);
        } catch (err) {
          console.error(`Error checking asset ${prop.assetId}:`, err);
        }
      }
      setShareInfo(info);
      setAssets(filteredProps);
    } catch (err) {
      console.error('Error fetching assets:', err);
    } finally {
      setLoading(false);
    }
  };

  const redeemTokens = async (tokenId, complianceAddress) => {
    setStage(tokenId, 'approve');
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

      setStage(tokenId, 'burn');
      const vaultTx = await vaultContract.redeemShares(tokenId);
      await vaultTx.wait();

      setStage(tokenId, 'unbind');
      const unbindTokenContract = new ethers.Contract(complianceAddress, contractsConfig.compliance.abi, signer);

      const unbindTx = await unbindTokenContract.unbindToken(assetShareTokenAddr);
      await unbindTx.wait();

      const burned = Number(formatShares(ownerBalance));
      const supplyBefore = Number(shareInfo[tokenId]?.supply ?? burned);
      setFractionalEvents((prev) => ({
        ...prev,
        [tokenId]: { burned, othersKeep: Math.max(0, supplyBefore - burned) },
      }));
      toast.success(`Station NFT #${tokenId} is back in your wallet.`);
    } catch (error) {
      console.error('Error redeeming asset tokens:', error);
      toast.error(getContractErrorMessage(error, 'Redemption failed. Please try again.'));
    } finally {
      setStage(tokenId, null);
    }
  };

  useEffect(() => {
    if (address) {
      fetchAssets(address);
    } else {
      setLoading(false);
    }
  }, [address]);

  return (
    <AppLayout>
      <PageHeader
        eyebrow="Your assets"
        title="Reclaim a Station"
        description="Take your station back. If you still hold every share (for example you never listed), you can redeem right away. If investors hold shares, cancel the listing first so they can sell back to you — then redeem to burn your shares and reclaim the station NFT."
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
            label="Stations to reclaim"
            value={formatNumber(assets.length, 0)}
            tone="brand"
            icon={<RedeemIcon />}
          />
          <StatCard
            label="Shares to burn"
            value={formatNumber(totals.shares, 0)}
            sub="your balance across these stations"
            tone="success"
            icon={<CoinsIcon />}
          />
          <StatCard
            label="Station value reclaimed"
            value={formatUsd(totals.value, 0)}
            sub="NFTs back in your wallet"
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
            return (
              <motion.div key={station.assetId} variants={rise}>
                <RedeemConsole
                  asset={station}
                  info={shareInfo[station.assetId]}
                  stage={stages[station.assetId]}
                  done={fractionalEvents[station.assetId]}
                  onRedeem={() => redeemTokens(station.assetId, station.complianceAddress)}
                />
              </motion.div>
            );
          })}
        </motion.div>
      ) : (
        <EmptyState
          title="No stations to reclaim right now"
          action={
            <Button variant="soft" size="sm" onClick={() => (window.location.href = ROUTES.cancelListing)}>
              Go to Cancel Listing
            </Button>
          }
        >
          A fractionalized station appears here when you hold all of its shares, or once its listing has been
          cancelled so investors could sell back to you.
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
