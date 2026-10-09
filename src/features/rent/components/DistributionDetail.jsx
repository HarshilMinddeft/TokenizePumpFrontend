import Card from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';
import { cn, shortenAddress } from '../../../lib/utils';
import { InfoTip } from '../../../components/ui/Tooltip';
import DataTable from './DataTable';
import StreamBreakdown from './StreamBreakdown';
import { FIELD_INFO, SUMMARY_INFO, averageHeld, explainRow } from '../utils/explain';
import ChainLink from './ChainLink';
import {
  ALLOCATION_LABELS,
  BATCH_TONES,
  DISTRIBUTION_TONES,
  formatDate,
  formatMoney,
  formatMonth,
  formatShares,
} from '../utils/format';

const SummaryItem = ({ label, value, hint, info, emphasis = false }) => (
  <div className="rounded-xl bg-slate-50 px-4 py-3 dark:bg-slate-800/50">
    <p className="flex items-center text-[11px] font-semibold tracking-wide text-slate-400 uppercase dark:text-slate-500">
      {label}
      {info && <InfoTip content={info} />}
    </p>
    <p className={cn('mt-1 text-lg font-bold tabular-nums', emphasis ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-900 dark:text-white')}>
      {value}
    </p>
    {hint && <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{hint}</p>}
  </div>
);

const Step = ({ index, title, done, children }) => (
  <div className="flex gap-4">
    <span
      className={cn(
        'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold',
        done ? 'bg-emerald-500 text-white' : 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300',
      )}
    >
      {done ? '✓' : index}
    </span>
    <div className="min-w-0 flex-1">
      <p className="text-sm font-semibold text-slate-900 dark:text-white">{title}</p>
      <div className="mt-2">{children}</div>
    </div>
  </div>
);

/**
 * A draft or in-progress distribution: summary, the approve → sign-batches
 * flow for the admin's wallet, and the per-holder breakdown.
 */
const DistributionDetail = ({ detail, overview, address, busy, onApprove, onSignBatch, onCancel, onSync, onClose }) => {
  const { distribution: d, allocations, batches, stablecoin } = detail;
  const dec = stablecoin.decimals;
  const money = (v) => formatMoney(v, dec);

  const unpaid = batches.filter((b) => b.status !== 'PAID');
  const needed = unpaid.reduce((a, b) => a + BigInt(b.call.total), 0n);
  const allowance = BigInt(overview?.admin?.allowance ?? '0');
  const balance = BigInt(overview?.admin?.stablecoinBalance ?? '0');
  const approved = allowance >= needed;
  const isPayer = address?.toLowerCase() === d.payerWallet;
  const canSign = overview?.admin?.canSign;
  const open = d.status === 'DRAFT' || d.status === 'IN_PROGRESS';
  const anySent = batches.some((b) => b.status === 'SUBMITTED' || b.status === 'PAID');

  const ctx = {
    rent: d.rent,
    totalShares: d.totalShares,
    feeBps: d.feeBps,
    periodStart: d.periodStart,
    periodEnd: d.periodEnd,
    monthEnd: d.monthEnd,
    decimals: dec,
  };
  const explain = (field) => (a) => explainRow(a, ctx)[field];

  const allocationColumns = [
    {
      key: 'holder',
      header: 'Holder',
      render: (a) => (
        <span className="flex items-center gap-2">
          <ChainLink address={a.holder} copy />
          {a.holder === d.issuer && <Badge tone="brand">Issuer</Badge>}
        </span>
      ),
    },
    {
      key: 'opening',
      header: 'Start → end',
      align: 'right',
      info: FIELD_INFO.balances,
      render: (a) => `${formatShares(a.openingBalance)} → ${formatShares(a.closingBalance)}`,
    },
    { key: 'days', header: 'Days held', align: 'right', info: FIELD_INFO.daysHeld, explain: explain('daysHeld'), render: (a) => a.daysHeld },
    {
      key: 'avgHeld',
      header: 'Avg. while held',
      align: 'right',
      info: FIELD_INFO.averageHeld,
      explain: explain('averageHeld'),
      render: (a) => averageHeld(a).toLocaleString('en-US', { maximumFractionDigits: 2 }),
    },
    {
      key: 'avg',
      header: 'Avg. over period',
      align: 'right',
      info: FIELD_INFO.averagePeriod,
      explain: explain('averagePeriod'),
      render: (a) => Number(a.averageBalance).toLocaleString('en-US', { maximumFractionDigits: 2 }),
    },
    { key: 'share', header: 'Share', align: 'right', info: FIELD_INFO.share, explain: explain('share'), render: (a) => `${Number(a.sharePercent).toFixed(3)}%` },
    { key: 'gross', header: 'Gross', align: 'right', info: FIELD_INFO.gross, explain: explain('gross'), render: (a) => money(a.grossAmount) },
    { key: 'fee', header: 'Fee', align: 'right', info: FIELD_INFO.fee, explain: explain('fee'), render: (a) => money(a.feeAmount) },
    {
      key: 'net',
      header: 'Pays',
      align: 'right',
      info: FIELD_INFO.net,
      explain: explain('net'),
      render: (a) => <span className="font-semibold text-slate-900 dark:text-white">{money(a.netAmount)}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (a) => {
        const s = ALLOCATION_LABELS[a.status] ?? { label: a.status, tone: 'neutral' };
        return <Badge tone={s.tone} dot>{s.label}</Badge>;
      },
    },
    { key: 'batch', header: 'Batch', align: 'right', info: FIELD_INFO.batch, render: (a) => (a.batchIndex === null ? '—' : a.batchIndex + 1) },
  ];

  return (
    <div className="space-y-6">
      <Card className="p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                {d.assetName || `Asset #${d.tokenId}`} · {formatMonth(d.month)}
              </h2>
              <Badge tone={DISTRIBUTION_TONES[d.status]} dot size="md">{d.status.replace('_', ' ')}</Badge>
            </div>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Period {formatDate(d.periodStart, true, true)} → {formatDate(d.periodEnd, true, true)} (UTC) · {d.holderCount} holders ·{' '}
              {d.payableCount} paid in {d.batchCount} batch{d.batchCount === 1 ? '' : 'es'}
              {d.excludeIssuer ? ' · issuer excluded' : ''}
            </p>
            {d.note && <p className="mt-1 text-sm text-slate-600 italic dark:text-slate-300">“{d.note}”</p>}
          </div>
          <div className="flex gap-2">
            {open && (
              <Button size="sm" variant="secondary" onClick={onSync} loading={busy === 'sync'}>
                Refresh status
              </Button>
            )}
            {open && !anySent && (
              <Button size="sm" variant="outlineDanger" onClick={onCancel} loading={busy === 'cancel'}>
                Cancel draft
              </Button>
            )}
            <Button size="sm" variant="ghost" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <SummaryItem label="Total rent" value={money(d.rent)} hint={d.streams?.length ? `${d.streams.length} income stream${d.streams.length === 1 ? '' : 's'}` : undefined} />
          <SummaryItem label="You send" value={money(d.grossPaid)} hint="Holders + platform fee" info={SUMMARY_INFO.youSend} emphasis />
          <SummaryItem label="Holders receive" value={money(d.netPaid)} hint={`${d.payableCount} wallets`} info={SUMMARY_INFO.holdersReceive} />
          <SummaryItem label="Platform fee" value={money(d.fee)} hint={`${(d.feeBps / 100).toFixed(2)}% · fee version ${d.feeVersion}`} info={SUMMARY_INFO.fee} />
          <SummaryItem label="Kept in your wallet" value={money(d.selfKept)} hint="Your own wallet's share" info={SUMMARY_INFO.selfKept} />
          <SummaryItem label="Issuer excluded" value={money(d.excludedIssuer)} hint={d.excludeIssuer ? 'Not paid' : 'Issuer included'} info={SUMMARY_INFO.excludedIssuer} />
          <SummaryItem label="Not allocated" value={money(d.unallocated)} hint="Days with no holder (pre-launch, burned)" info={SUMMARY_INFO.unallocated} />
          <SummaryItem label="Prepared for" value={shortenAddress(d.payerWallet, 6, 4)} hint="Only this wallet can sign" />
        </div>
      </Card>

      <StreamBreakdown streams={d.streams} landModel={d.landModel} decimals={stablecoin.decimals} />

      {open && (
        <Card className="space-y-6 p-5 sm:p-6">
          <h3 className="text-[15px] font-semibold text-slate-900 dark:text-white">Pay out</h3>

          {!isPayer && (
            <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
              This draft was prepared for {shortenAddress(d.payerWallet, 6, 4)} (its own share is kept, not paid). Switch
              to that wallet to sign it, or cancel it and create a new draft from this wallet.
            </p>
          )}
          {isPayer && !canSign && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-500/10 dark:text-red-300">
              This wallet doesn’t have DISTRIBUTOR_ROLE on the RentDistributor contract, so its payout transactions
              would revert. Ask the contract admin to grant it.
            </p>
          )}
          {isPayer && balance < needed && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-500/10 dark:text-red-300">
              This wallet holds {money(balance.toString())} {stablecoin.symbol} but the remaining batches need{' '}
              {money(needed.toString())}. Top it up before signing.
            </p>
          )}

          <Step index={1} title={`Approve ${stablecoin.symbol}`} done={approved}>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Allow the RentDistributor contract to pull {money(needed.toString())} {stablecoin.symbol} from your wallet
              — exactly what the remaining batches pay out. Current approval: {money(allowance.toString())}.
            </p>
            {!approved && (
              <Button className="mt-3" size="sm" onClick={() => onApprove(needed)} loading={busy === 'approve'} disabled={!isPayer || Boolean(busy)}>
                Approve {money(needed.toString())}
              </Button>
            )}
          </Step>

          <Step index={2} title="Sign each batch" done={unpaid.length === 0}>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Each batch pays up to {overview?.maxBatchSize ?? 500} holders in one transaction. A batch can only ever
              be paid once, so it is safe to retry one that failed.
            </p>
            <div className="mt-3 space-y-2">
              {batches.map((b) => (
                <div
                  key={b.batchId}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 px-4 py-3 dark:border-slate-700"
                >
                  <div className="min-w-0">
                    <p className="flex items-center gap-2 text-sm font-medium text-slate-900 dark:text-white">
                      Batch {b.batchIndex + 1} of {batches.length}
                      <Badge tone={BATCH_TONES[b.status]} dot>{b.status}</Badge>
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                      {b.recipientCount} holders · {money(b.amount)}
                      {BigInt(b.platformFee) > 0n && ` + ${money(b.platformFee)} fee`}
                      {b.txHash && (
                        <>
                          {' · '}
                          <ChainLink hash={b.txHash} />
                        </>
                      )}
                    </p>
                    {b.error && <p className="mt-0.5 text-xs text-red-500">{b.error}</p>}
                  </div>
                  {(b.status === 'PENDING' || b.status === 'FAILED') && (
                    <Button
                      size="sm"
                      onClick={() => onSignBatch(b)}
                      loading={busy === `batch-${b.batchIndex}`}
                      disabled={!isPayer || !canSign || !approved || Boolean(busy)}
                    >
                      {b.status === 'FAILED' ? 'Retry' : 'Sign & pay'}
                    </Button>
                  )}
                  {b.status === 'SUBMITTED' && <span className="text-xs text-slate-500">Waiting for confirmation…</span>}
                </div>
              ))}
            </div>
          </Step>
        </Card>
      )}

      <DataTable
        title="Holder breakdown"
        subtitle="Each share earns the same rent per second held. Amounts are frozen as calculated for this draft."
        columns={allocationColumns}
        rows={allocations}
        rowKey={(a) => a.holder}
      />
    </div>
  );
};

export default DistributionDetail;
