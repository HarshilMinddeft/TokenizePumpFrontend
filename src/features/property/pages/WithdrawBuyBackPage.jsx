import { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import FlipClockCountdown from '@leenguyen/react-flip-clock-countdown';
import '@leenguyen/react-flip-clock-countdown/dist/index.css';
import AppLayout from '../../../components/layout/AppLayout';
import PropertyCard from '../components/PropertyCard';
import PageHeader from '../../../components/ui/PageHeader';
import Button from '../../../components/ui/Button';
import Spinner from '../../../components/ui/Spinner';
import EmptyState from '../../../components/ui/EmptyState';
import web3Service from '../../../services/web3Service';
import propertyApi from '../api/propertyApi';
import { useWeb3 } from '../../../context/Web3Context';
import { useTheme } from '../../../context/ThemeContext';
import { getContractErrorMessage } from '../../../utils/web3Errors';
import { formatShares, formatStable } from '../../../utils/units';

const StatRow = ({ label, value, emphasis = false }) => (
  <div className="flex items-baseline justify-between gap-3 text-sm">
    <span className="text-slate-500 dark:text-slate-400">{label}</span>
    <span
      className={`font-medium ${
        emphasis ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-700 dark:text-slate-200'
      }`}
    >
      {value}
    </span>
  </div>
);

/** Owner-side view of one listing with a live buyback, counting down to its claim deadline. */
const WithdrawCard = ({ listing, onWithdraw }) => {
  const { theme } = useTheme();
  const deadlineMs = Number(listing.buyBackDeadline) * 1000;
  const [expired, setExpired] = useState(() => deadlineMs <= Date.now());
  const [busy, setBusy] = useState(false);
  const nothingLeft = Number(listing.buyBackEscrow) === 0;

  const clockColors =
    theme === 'light'
      ? { label: '#7c6e5b', digitBg: '#fcf6ea', digitText: '#5d3f15', divider: '#eed7a6', separator: '#b8862f' }
      : { label: '#aab3c9', digitBg: '#2b1f0c', digitText: '#f2d9a6', divider: '#4a3414', separator: '#e3b766' };

  const handle = async () => {
    setBusy(true);
    try {
      await onWithdraw();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4 border-t border-slate-200 pt-3 dark:border-slate-800">
      {expired ? (
        <div className="flex items-center justify-center gap-2 rounded-lg bg-emerald-50 px-3 py-2.5 text-sm font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
          <svg viewBox="0 0 24 24" className="h-5 w-5 stroke-emerald-500 dark:stroke-emerald-400" fill="none" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
          </svg>
          Claim window closed
        </div>
      ) : (
        <div className="flex justify-center">
          <FlipClockCountdown
            to={deadlineMs}
            onComplete={() => setExpired(true)}
            labels={['Days', 'Hours', 'Min', 'Sec']}
            labelStyle={{
              fontSize: 9,
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              color: clockColors.label,
            }}
            digitBlockStyle={{
              width: 22,
              height: 32,
              fontSize: 17,
              fontWeight: 700,
              color: clockColors.digitText,
              backgroundColor: clockColors.digitBg,
            }}
            dividerStyle={{ color: clockColors.divider, height: 1 }}
            separatorStyle={{ color: clockColors.separator, size: 4 }}
            duration={0.5}
          />
        </div>
      )}

      <StatRow label="Buyback price" value={`$${listing.buyBackPrice}`} emphasis />
      <StatRow label="Escrow remaining" value={`$${listing.buyBackEscrow}`} />
      <StatRow label="Total shares issued" value={listing.totalTokens} />

      {nothingLeft ? (
        <p className="text-center text-xs text-slate-500 dark:text-slate-400">
          The escrow is fully paid out — every holder who sold back has been settled.
        </p>
      ) : expired ? (
        <Button fullWidth variant="secondary" onClick={handle} disabled={busy}>
          {busy ? 'Withdrawing…' : `Withdraw $${listing.buyBackEscrow}`}
        </Button>
      ) : (
        <p className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-center text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400">
          Holders can still sell back at the buyback price. Withdrawal unlocks when the countdown reaches zero.
        </p>
      )}
    </div>
  );
};

const WithdrawBuyBackPage = () => {
  const { address } = useWeb3();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!address) {
      setRows([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const data = await propertyApi.getAllMarketplaceProperties();
      const allProps = data.properties || [];
      const marketplace = web3Service.getReadOnlyMarketplaceContract();

      const owned = [];
      for (const prop of allProps) {
        try {
          const listing = await marketplace.listings(prop.propertyId);
          if (listing.owner.toLowerCase() !== address.toLowerCase()) continue;
          if (!listing.buyBack) continue;

          const outstanding = await marketplace.outstandingTokens(prop.propertyId);

          owned.push({
            property: prop,
            listing: {
              tokenId: prop.propertyId,
              totalTokens: formatShares(listing.totalTokens),
              // The marketplace's own outstandingTokens(tokenId) view — the
              // exact shares sold out of this listing and still held by
              // users, per its doc comment. Not derived locally, so it stays
              // correct even if the contract's accounting rules change.
              outstandingTokens: formatShares(outstanding),
              buyBackPrice: formatStable(listing.buyBackPrice),
              buyBackEscrow: formatStable(listing.buyBackEscrow),
              buyBackDeadline: listing.buyBackDeadline.toString(),
            },
          });
        } catch (err) {
          console.error(`Error reading listing ${prop.propertyId}:`, err);
        }
      }
      setRows(owned);
    } catch (err) {
      console.error('Error loading buyback withdrawals:', err);
    } finally {
      setLoading(false);
    }
  }, [address]);

  useEffect(() => {
    load();
  }, [load]);

  const withdrawDeposit = async (tokenId) => {
    try {
      const marketplace = await web3Service.getMarketplaceContract();
      const tx = await marketplace.withdrawBuyBackDeposit(tokenId);
      await tx.wait();

      toast.success('Unclaimed escrow withdrawn.');
      load();
    } catch (error) {
      console.error('Error withdrawing buyback deposit:', error);
      toast.error(getContractErrorMessage(error, 'Failed to withdraw the deposit. Please try again.'));
    }
  };

  return (
    <AppLayout>
      <PageHeader
        eyebrow="Your assets"
        title="Withdraw Buyback Escrow"
        description="Once the 60-day claim window closes on a buyback you activated, reclaim whatever stablecoin holders never came to sell back for."
        icon={
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 6v6l4 2m6-2a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z"
          />
        }
      />

      {loading ? (
        <Spinner words={['listings', 'escrow', 'deadlines', 'listings']} />
      ) : !address ? (
        <EmptyState title="Wallet not connected">
          Connect your wallet to view and withdraw buyback escrow for properties you have listed.
        </EmptyState>
      ) : rows.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map(({ property, listing }) => (
            <PropertyCard key={listing.tokenId} property={property}>
              <WithdrawCard listing={listing} onWithdraw={() => withdrawDeposit(listing.tokenId)} />
            </PropertyCard>
          ))}
        </div>
      ) : (
        <EmptyState title="No active buybacks">
          You have no properties with a live buyback. Activate one from the Cancel Listing page when you delist a
          property with outstanding shares.
        </EmptyState>
      )}
    </AppLayout>
  );
};

export default WithdrawBuyBackPage;
