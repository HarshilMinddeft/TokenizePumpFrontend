import { ethers } from 'ethers';
import Input from '../../../components/ui/Input';
import Badge from '../../../components/ui/Badge';
import { STREAM_BY_KEY } from '../../../config/incomeStreams';
import { formatMoney } from '../utils/format';

/** "1200.50" → base units, or null when it isn't a valid amount for `decimals`. */
export const parseAmount = (value, decimals = 6) => {
  if (!new RegExp(`^\\d+(\\.\\d{1,${decimals}})?$`).test(value ?? '')) return null;
  return ethers.utils.parseUnits(value, decimals);
};

/** Σ of the valid amounts entered so far, in base units. */
export const sumAmounts = (values, keys, decimals = 6) =>
  keys.reduce((total, key) => total.add(parseAmount(values[key], decimals) ?? 0), ethers.BigNumber.from(0));

/**
 * One amount box per income stream the asset shares: the net profit it
 * earned this month, after operating costs. Streams the asset doesn't share
 * aren't shown — their amount is fixed at 0.
 */
const StreamAmounts = ({ keys, values, onChange, symbol, decimals = 6, feeBps = 0 }) => {
  const total = sumAmounts(values, keys, decimals);

  return (
    <div>
      <div className="space-y-2.5">
        {keys.map((key) => {
          const stream = STREAM_BY_KEY[key];
          return (
            <div
              key={key}
              className="grid grid-cols-1 items-center gap-2 rounded-xl border border-slate-200 p-3 sm:grid-cols-[1fr_200px] sm:gap-4 dark:border-slate-700"
            >
              <div className="min-w-0">
                <p className="flex items-center gap-2 text-[13px] font-medium text-slate-800 dark:text-slate-100">
                  {stream?.label ?? key}
                  <Badge tone="neutral">Stream {stream?.group}</Badge>
                </p>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  {stream?.hint ? `${stream.hint} — ` : ''}net profit for the month
                </p>
              </div>
              <Input
                aria-label={`${stream?.label ?? key} net profit (${symbol})`}
                prefix="$"
                inputMode="decimal"
                placeholder="0"
                value={values[key] ?? ''}
                onChange={(e) => onChange(key, e.target.value.trim())}
              />
            </div>
          );
        })}
      </div>

      <div className="mt-3 flex flex-wrap items-baseline justify-between gap-2 rounded-xl bg-slate-50 px-4 py-3 dark:bg-slate-800/50">
        <span className="text-[13px] font-medium text-slate-700 dark:text-slate-200">
          Total to distribute ({symbol})
        </span>
        <span className="text-lg font-bold text-slate-900 tabular-nums dark:text-white">
          {formatMoney(total.toString(), decimals)}
        </span>
      </div>
      <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
        Enter each stream’s profit <strong>after</strong> deducting its operating costs (0 if it earned nothing).
        {feeBps > 0
          ? ` A ${(feeBps / 100).toFixed(2)}% platform fee is taken from what holders receive.`
          : ' The platform rent fee is currently 0%.'}
      </p>
    </div>
  );
};

export default StreamAmounts;
