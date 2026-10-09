import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import StatCard from '../../../components/ui/StatCard';
import EmptyState from '../../../components/ui/EmptyState';
import Badge from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';
import { useWeb3 } from '../../../context/Web3Context';
import rentApi, { apiErrorMessage } from '../api/rentApi';
import DataTable from './DataTable';
import { FIELD_INFO, averageHeld, explainRow } from '../utils/explain';
import ChainLink from './ChainLink';
import {
  ACTIVITY_LABELS,
  ALLOCATION_LABELS,
  formatDate,
  formatMoney,
  formatMonth,
  formatShares,
} from '../utils/format';

const PAGE_SIZE = 10;

const Icon = ({ d }) => (
  <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d={d} />
  </svg>
);

const ICONS = {
  rent: 'M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm3 0h.008v.008H18V10.5Zm-12 0h.008v.008H6V10.5Z',
  pending: 'M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z',
  asset:
    'M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Z',
  shares: 'M10.5 6a7.5 7.5 0 1 0 7.5 7.5h-7.5V6Z M13.5 10.5H21A7.5 7.5 0 0 0 13.5 3v7.5Z',
};

/**
 * The connected wallet's portfolio, rent history and trading activity. Shown as
 * the "My Portfolio" tab on the marketplace.
 *
 * @param {(tokenId: string) => string} detailPath link for a held asset
 * @param {() => void} onBrowse switches back to the assets tab
 */
/** "Fuel income +2": the biggest stream that paid, and how many others did. */
const sourcesSummary = (parts) => {
  const paying = parts.filter((x) => BigInt(x.amount) > 0n);
  const list = paying.length ? paying : parts;
  const top = [...list].sort((a, b) => (BigInt(b.amount) > BigInt(a.amount) ? 1 : -1))[0];
  return list.length > 1 ? `${top.label} +${list.length - 1}` : top.label;
};

/** Hover content: the investor's gross for a month, stream by stream. */
const SourcesTip = ({ payout, decimals }) => (
  <div className="space-y-1">
    <p className="font-semibold text-white">Your rent by income stream</p>
    {payout.streamBreakdown.map((x) => (
      <p key={x.key} className="flex justify-between gap-6">
        <span>{x.label}</span>
        <span className="tabular-nums">{formatMoney(x.amount, decimals)}</span>
      </p>
    ))}
    <p className="flex justify-between gap-6 border-t border-slate-600 pt-1 font-semibold text-white">
      <span>Gross</span>
      <span className="tabular-nums">{formatMoney(payout.grossAmount, decimals)}</span>
    </p>
  </div>
);

const InvestorDashboard = ({ detailPath, onBrowse }) => {
  const { address } = useWeb3();
  const navigate = useNavigate();

  const [summary, setSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [error, setError] = useState('');

  const [payouts, setPayouts] = useState({ items: [], total: 0, page: 1 });
  const [payoutsLoading, setPayoutsLoading] = useState(true);

  const [activity, setActivity] = useState({ items: [], page: 1 });
  const [activityLoading, setActivityLoading] = useState(true);

  const loadSummary = useCallback(async () => {
    if (!address) return;
    setSummaryLoading(true);
    setError('');
    try {
      setSummary(await rentApi.getInvestorSummary(address));
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not load your portfolio.'));
    } finally {
      setSummaryLoading(false);
    }
  }, [address]);

  const loadPayouts = useCallback(
    async (page = 1) => {
      if (!address) return;
      setPayoutsLoading(true);
      try {
        const data = await rentApi.getInvestorPayouts(address, page, PAGE_SIZE);
        setPayouts({ items: data.items, total: data.total, page });
      } catch {
        setPayouts({ items: [], total: 0, page });
      } finally {
        setPayoutsLoading(false);
      }
    },
    [address],
  );

  const loadActivity = useCallback(
    async (page = 1) => {
      if (!address) return;
      setActivityLoading(true);
      try {
        const data = await rentApi.getInvestorActivity(address, page, PAGE_SIZE);
        setActivity({ items: data.items, page });
      } catch {
        setActivity({ items: [], page });
      } finally {
        setActivityLoading(false);
      }
    },
    [address],
  );

  useEffect(() => {
    loadSummary();
    loadPayouts(1);
    loadActivity(1);
  }, [loadSummary, loadPayouts, loadActivity]);

  const decimals = summary?.stablecoin?.decimals ?? 6;
  const totals = summary?.totals;

  const holdingColumns = [
    {
      key: 'asset',
      header: 'Asset',
      render: (h) => (
        <button
          type="button"
          onClick={() => navigate(detailPath(h.tokenId))}
          className="flex cursor-pointer items-center gap-3 text-left"
        >
          {h.thumbnail ? (
            <img src={h.thumbnail} alt="" className="h-9 w-9 shrink-0 rounded-lg object-cover" />
          ) : (
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-xs font-bold text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300">
              #{h.tokenId}
            </span>
          )}
          <span className="font-medium text-slate-900 hover:text-indigo-600 dark:text-white dark:hover:text-indigo-400">
            {h.assetName || `Asset #${h.tokenId}`}
          </span>
        </button>
      ),
    },
    { key: 'balance', header: 'Shares', align: 'right', render: (h) => formatShares(h.balance) },
    {
      key: 'ownership',
      header: 'Ownership',
      align: 'right',
      render: (h) => `${Number(h.ownershipPercent).toFixed(2)}%`,
    },
    {
      key: 'since',
      header: 'Holding since',
      render: (h) => (BigInt(h.balance) > 0n ? formatDate(h.firstAcquiredAt) : 'Sold'),
    },
    {
      key: 'rent',
      header: 'Rent received',
      align: 'right',
      render: (h) => (
        <span className="font-semibold text-emerald-600 dark:text-emerald-400">
          {formatMoney(h.rentReceived, decimals)}
        </span>
      ),
    },
  ];

  // Each payout row carries its distribution's rent, supply and period, so
  // the worked calculation can be shown per row.
  const explain = (field) => (p) =>
    p.tokenSeconds
      ? explainRow(p, {
          rent: p.rent,
          totalShares: p.totalShares,
          feeBps: p.feeBps,
          periodStart: p.periodStart,
          periodEnd: p.periodEnd,
          monthEnd: p.monthEnd,
          decimals,
        })[field]
      : null;

  const payoutColumns = [
    { key: 'month', header: 'Month', render: (p) => <span className="font-medium">{formatMonth(p.month)}</span> },
    { key: 'asset', header: 'Asset', render: (p) => p.assetName || `Asset #${p.tokenId}` },
    {
      key: 'sources',
      header: 'Income sources',
      info: 'Your gross rent for the month, split across the income streams of the pump (fuel, car wash, …) in proportion to what each earned. Hover a value to see the amounts.',
      explain: (p) => (p.streamBreakdown?.length ? <SourcesTip payout={p} decimals={decimals} /> : null),
      render: (p) => (p.streamBreakdown?.length ? sourcesSummary(p.streamBreakdown) : '—'),
    },
    {
      key: 'days',
      header: 'Days held',
      align: 'right',
      info: FIELD_INFO.daysHeld,
      explain: explain('daysHeld'),
      render: (p) => p.daysHeld,
    },
    {
      key: 'avg',
      header: 'Avg. shares',
      align: 'right',
      info: FIELD_INFO.averageHeld,
      explain: explain('averageHeld'),
      render: (p) => averageHeld(p).toLocaleString('en-US', { maximumFractionDigits: 2 }),
    },
    {
      key: 'share',
      header: 'Share of rent',
      align: 'right',
      info: FIELD_INFO.share,
      explain: explain('share'),
      render: (p) => `${Number(p.sharePercent).toFixed(3)}%`,
    },
    {
      key: 'gross',
      header: 'Gross',
      align: 'right',
      info: FIELD_INFO.gross,
      explain: explain('gross'),
      render: (p) => formatMoney(p.grossAmount, decimals),
    },
    {
      key: 'fee',
      header: 'Fee',
      align: 'right',
      info: FIELD_INFO.fee,
      explain: explain('fee'),
      render: (p) => formatMoney(p.feeAmount, decimals),
    },
    {
      key: 'net',
      header: 'You receive',
      align: 'right',
      info: FIELD_INFO.net,
      explain: explain('net'),
      render: (p) => (
        <span className="font-semibold text-slate-900 dark:text-white">{formatMoney(p.netAmount, decimals)}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (p) => {
        const s = ALLOCATION_LABELS[p.status] ?? { label: p.status, tone: 'neutral' };
        return (
          <Badge tone={s.tone} dot>
            {s.label}
          </Badge>
        );
      },
    },
    { key: 'tx', header: 'Transaction', render: (p) => <ChainLink hash={p.txHash} /> },
  ];

  const activityColumns = [
    { key: 'date', header: 'Date', render: (a) => formatDate(a.timestamp, true) },
    {
      key: 'type',
      header: 'Activity',
      render: (a) => (
        <span className="flex items-center gap-2">
          <Badge tone={a.direction === 'IN' ? 'success' : 'neutral'}>{a.direction === 'IN' ? 'In' : 'Out'}</Badge>
          {ACTIVITY_LABELS[a.type] ?? a.type}
        </span>
      ),
    },
    { key: 'asset', header: 'Asset', render: (a) => a.assetName || `Asset #${a.tokenId}` },
    { key: 'amount', header: 'Shares', align: 'right', render: (a) => (a.amount ? formatShares(a.amount) : '—') },
    {
      key: 'value',
      header: 'Value',
      align: 'right',
      render: (a) => (a.totalValue ? formatMoney(a.totalValue, decimals) : '—'),
    },
    { key: 'tx', header: 'Transaction', render: (a) => <ChainLink hash={a.txHash} /> },
  ];

  const content = () => {
    if (!address) {
      return (
        <EmptyState title="Wallet not connected">
          Connect your wallet to see your holdings, the rent you have earned and your transaction history.
        </EmptyState>
      );
    }

    if (error) {
      return (
        <EmptyState title="Could not load your dashboard" action={<Button onClick={loadSummary}>Try again</Button>}>
          {error}
        </EmptyState>
      );
    }

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard
            label="Rent received"
            value={summaryLoading ? '…' : formatMoney(totals?.rentReceived, decimals)}
            sub={totals?.lastPayoutAt ? `Last paid ${formatDate(totals.lastPayoutAt)}` : 'No payouts yet'}
            tone="success"
            icon={<Icon d={ICONS.rent} />}
          />
          <StatCard
            label="Pending rent"
            value={summaryLoading ? '…' : formatMoney(totals?.pendingRent, decimals)}
            sub="Calculated, awaiting payout"
            tone="warning"
            icon={<Icon d={ICONS.pending} />}
          />
          <StatCard
            label="Assets held"
            value={summaryLoading ? '…' : (totals?.assetsHeld ?? 0)}
            sub="With a non-zero balance"
            tone="brand"
            icon={<Icon d={ICONS.asset} />}
          />
          <StatCard
            label="Shares held"
            value={summaryLoading ? '…' : formatShares(totals?.sharesHeld ?? 0)}
            sub="Across all assets"
            tone="brand"
            icon={<Icon d={ICONS.shares} />}
          />
        </div>

        <DataTable
          title="Your holdings"
          subtitle="Shares listed in an open sell order still count as yours, and keep earning rent until they sell."
          columns={holdingColumns}
          rows={summary?.holdings ?? []}
          rowKey={(h) => h.tokenId}
          loading={summaryLoading}
          empty="You don't hold any asset shares yet."
          action={
            <Button size="sm" variant="soft" onClick={onBrowse}>
              Browse assets
            </Button>
          }
        />

        <DataTable
          title="Rent history"
          subtitle="Rent is paid monthly, in proportion to how many shares you held and for how many days."
          columns={payoutColumns}
          rows={payouts.items}
          rowKey={(p) => `${p.distributionId}`}
          loading={payoutsLoading}
          empty="No rent has been distributed to this wallet yet."
          pagination={{ page: payouts.page, limit: PAGE_SIZE, total: payouts.total, onPage: loadPayouts }}
        />

        <DataTable
          title="Transactions"
          subtitle="Purchases, sales, orders and transfers of your asset shares."
          columns={activityColumns}
          rows={activity.items}
          rowKey={(a) => a.id}
          loading={activityLoading}
          empty="No transactions yet."
          pagination={{
            page: activity.page,
            limit: PAGE_SIZE,
            hasMore: activity.items.length === PAGE_SIZE,
            onPage: loadActivity,
          }}
        />
      </div>
    );
  };

  return (
    <>
      {address && (
        <div className="mb-4 flex items-center justify-between gap-3">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Your portfolio, rental income and trading history
          </p>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              loadSummary();
              loadPayouts(payouts.page);
              loadActivity(activity.page);
            }}
          >
            Refresh
          </Button>
        </div>
      )}
      {content()}
    </>
  );
};

export default InvestorDashboard;
