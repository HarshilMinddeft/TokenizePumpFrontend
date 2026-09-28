import { cn } from '../../lib/utils';

/**
 * Progress — value in 0..100.
 * @param {string} [tone] fill color classes
 */
const Progress = ({ value = 0, tone, className = '', trackClassName = '', showLabel = false }) => {
  const clamped = Math.min(100, Math.max(0, Number(value) || 0));
  const fillClass =
    tone ||
    'bg-gradient-to-r from-indigo-500 to-violet-500 dark:from-indigo-400 dark:to-violet-400';
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div
        role="progressbar"
        aria-valuenow={Math.round(clamped)}
        aria-valuemin={0}
        aria-valuemax={100}
        className={cn('h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800', trackClassName)}
      >
        <div
          className={cn('h-full rounded-full transition-[width] duration-500 ease-out', fillClass)}
          style={{ width: `${clamped}%` }}
        />
      </div>
      {showLabel && (
        <span className="shrink-0 text-xs font-semibold text-slate-500 tabular-nums dark:text-slate-400">
          {Math.round(clamped)}%
        </span>
      )}
    </div>
  );
};

export default Progress;
