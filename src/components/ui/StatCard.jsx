import { cn } from '../../lib/utils';
import Card from './Card';

const TONES = {
  neutral: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
  brand: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300',
  success: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300',
  danger: 'bg-red-50 text-red-500 dark:bg-red-500/15 dark:text-red-300',
  warning: 'bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300',
};

/**
 * StatCard — compact metric tile.
 * @param {string} label
 * @param {string|number} value
 * @param {string} [sub] supporting caption under the value
 * @param {React.ReactNode} [icon]
 * @param {('neutral'|'brand'|'success'|'danger'|'warning')} [tone]
 */
const StatCard = ({ label, value, sub, icon, tone = 'brand', className = '' }) => (
  <Card className={cn('relative h-full overflow-hidden p-4 sm:p-5', className)}>
    <div
      className={cn(
        'pointer-events-none absolute -top-10 -right-10 h-24 w-24 rounded-full opacity-60 blur-2xl',
        tone === 'brand' && 'bg-indigo-200/50 dark:bg-indigo-500/15',
        tone === 'success' && 'bg-emerald-200/50 dark:bg-emerald-500/10',
        tone === 'danger' && 'bg-red-200/50 dark:bg-red-500/10',
        tone === 'warning' && 'bg-amber-200/50 dark:bg-amber-500/10',
      )}
    />
    <div className="relative flex h-full items-start justify-between gap-3">
      <div className="flex min-w-0 flex-1 flex-col">
        <p className="line-clamp-2 min-h-[2em] text-xs leading-tight font-semibold tracking-wide text-slate-400 uppercase dark:text-slate-500">
          {label}
        </p>
        <p className="mt-2 truncate text-xl leading-none font-bold tracking-tight text-slate-900 tabular-nums sm:text-2xl dark:text-white">
          {value}
        </p>
        <p className="mt-1.5 min-h-[1em] truncate text-xs text-slate-400 dark:text-slate-500">{sub}</p>
      </div>
      {icon && (
        <div
          className={cn(
            'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl',
            TONES[tone],
          )}
        >
          {icon}
        </div>
      )}
    </div>
  </Card>
);

export default StatCard;
