import { cn } from '../../lib/utils';

const TONES = {
  neutral: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
  brand: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300',
  success: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
  danger: 'bg-red-50 text-red-600 dark:bg-red-500/15 dark:text-red-300',
  warning: 'bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
  info: 'bg-sky-50 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300',
};

const DOT_TONES = {
  neutral: 'bg-slate-400 dark:bg-slate-500',
  brand: 'bg-indigo-500',
  success: 'bg-emerald-500',
  danger: 'bg-red-500',
  warning: 'bg-amber-500',
  info: 'bg-sky-500',
};

/**
 * Badge
 * @param {('neutral'|'brand'|'success'|'danger'|'warning'|'info')} [tone]
 * @param {boolean} [dot] render a status dot
 * @param {'sm'|'md'} [size]
 */
const Badge = ({ tone = 'neutral', dot = false, size = 'sm', className = '', children, ...rest }) => (
  <span
    className={cn(
      'inline-flex items-center gap-1.5 rounded-full font-semibold tracking-wide whitespace-nowrap',
      size === 'sm' ? 'px-2.5 py-0.5 text-[11px] uppercase' : 'px-3 py-1 text-xs',
      TONES[tone],
      className,
    )}
    {...rest}
  >
    {dot && <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', DOT_TONES[tone])} />}
    {children}
  </span>
);

export default Badge;
