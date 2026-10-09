import Card from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';
import { LAND_MODELS } from '../../../config/incomeStreams';
import { formatMoney } from '../utils/format';

/**
 * Read-only split of a month's rent across the income streams it came from.
 * `streams` is the snapshot stored on the distribution ({key, label, group,
 * amount}), so it stays correct even if the asset's settings change later.
 */
const StreamBreakdown = ({ streams, landModel, decimals = 6 }) => {
  if (!streams?.length) return null;
  const total = streams.reduce((sum, s) => sum + BigInt(s.amount), 0n);

  return (
    <Card className="p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-[15px] font-semibold text-slate-900 dark:text-white">Income streams</h3>
        {landModel && <Badge tone="info">{LAND_MODELS[landModel]?.short ?? landModel}</Badge>}
      </div>
      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
        Net profit entered for each stream, after operating costs. Their sum is the rent below. Streams the owner
        doesn’t share aren’t included.
      </p>

      <ul className="mt-4 divide-y divide-slate-100 dark:divide-slate-800">
        {streams.map((s) => {
          const pct = total > 0n ? Number((BigInt(s.amount) * 10000n) / total) / 100 : 0;
          return (
            <li key={s.key} className="flex items-center justify-between gap-4 py-2.5 text-sm">
              <span className="text-slate-700 dark:text-slate-200">{s.label}</span>
              <span className="flex items-baseline gap-3 tabular-nums">
                <span className="text-xs text-slate-400">{pct.toFixed(1)}%</span>
                <span className="font-medium text-slate-900 dark:text-white">{formatMoney(s.amount, decimals)}</span>
              </span>
            </li>
          );
        })}
        <li className="flex items-center justify-between gap-4 pt-3 text-sm font-semibold">
          <span className="text-slate-900 dark:text-white">Total rent</span>
          <span className="tabular-nums text-slate-900 dark:text-white">{formatMoney(total.toString(), decimals)}</span>
        </li>
      </ul>
    </Card>
  );
};

export default StreamBreakdown;
