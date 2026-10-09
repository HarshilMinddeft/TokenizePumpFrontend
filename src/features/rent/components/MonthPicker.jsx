import { useEffect, useRef, useState } from 'react';
import { cn } from '../../../lib/utils';
import { formatMonth } from '../utils/format';

const SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const EARLIEST_YEAR = 2025;

const key = (year, m) => `${year}-${String(m + 1).padStart(2, '0')}`;

const STATUS_STYLE = {
  COMPLETED: { label: 'Paid', dot: 'bg-emerald-500', text: 'text-emerald-600 dark:text-emerald-400' },
  IN_PROGRESS: { label: 'Paying', dot: 'bg-amber-500', text: 'text-amber-600 dark:text-amber-400' },
  DRAFT: { label: 'Draft', dot: 'bg-slate-400', text: 'text-slate-500 dark:text-slate-400' },
};

/**
 * Month (UTC) picker for rent distributions: a year switcher over a 4×3 grid.
 * Each month shows whether it can be distributed — future months and months
 * before the asset launched are disabled, the current month only in
 * testnet mode — and, for the selected asset, whether it already has a
 * distribution.
 *
 * @param {string} value              'YYYY-MM'
 * @param {boolean} allowCurrentMonth RENT_ALLOW_CURRENT_MONTH on the backend
 * @param {number} [launchedAt]       asset fractionalizedAt (unix seconds)
 * @param {Record<string,string>} [statusByMonth] 'YYYY-MM' → distribution status
 */
const MonthPicker = ({ label, value, onChange, allowCurrentMonth, launchedAt, statusByMonth = {} }) => {
  const now = new Date();
  const thisYear = now.getUTCFullYear();
  const thisMonth = key(thisYear, now.getUTCMonth());
  const launchMonth = launchedAt
    ? key(new Date(launchedAt * 1000).getUTCFullYear(), new Date(launchedAt * 1000).getUTCMonth())
    : null;

  const [open, setOpen] = useState(false);
  const [year, setYear] = useState(() => Number(value?.slice(0, 4)) || thisYear);
  const rootRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    setYear(Number(value?.slice(0, 4)) || thisYear);
    const onDown = (e) => rootRef.current && !rootRef.current.contains(e.target) && setOpen(false);
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  /** Why a month can't be picked, or null if it can. */
  const blockedReason = (m) => {
    if (m > thisMonth) return 'Upcoming';
    if (m === thisMonth && !allowCurrentMonth) return 'In progress';
    if (launchMonth && m < launchMonth) return 'Before launch';
    return null;
  };

  const selectedStatus = STATUS_STYLE[statusByMonth[value]];

  return (
    <div ref={rootRef} className="relative">
      <span className="mb-1.5 block text-[13px] font-medium text-slate-700 dark:text-slate-300">{label}</span>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="dialog"
        aria-expanded={open}
        className={cn(
          'flex h-10 w-full cursor-pointer items-center gap-3 rounded-lg border bg-white px-3 text-left text-sm shadow-sm transition-all duration-150 dark:bg-slate-950',
          open
            ? 'border-indigo-500 ring-4 ring-indigo-500/15 dark:border-indigo-400'
            : 'border-slate-300 hover:border-slate-400 dark:border-slate-700 dark:hover:border-slate-600',
        )}
      >
        <svg className="h-4 w-4 shrink-0 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5"
          />
        </svg>
        <span className="flex-1 font-medium text-slate-900 dark:text-white">{formatMonth(value)}</span>
        {value === thisMonth && (
          <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
            In progress
          </span>
        )}
        {selectedStatus && (
          <span className={cn('flex items-center gap-1.5 text-xs font-semibold', selectedStatus.text)}>
            <span className={cn('h-1.5 w-1.5 rounded-full', selectedStatus.dot)} />
            {selectedStatus.label}
          </span>
        )}
        <svg
          className={cn('h-4 w-4 shrink-0 text-slate-400 transition-transform', open && 'rotate-180')}
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Choose a month"
          className="animate-scale-in absolute top-full right-0 z-40 mt-2 w-full min-w-[300px] rounded-xl border border-slate-200 bg-white p-3 shadow-xl dark:border-slate-700 dark:bg-slate-900"
        >
          <div className="mb-3 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setYear((y) => y - 1)}
              disabled={year <= EARLIEST_YEAR}
              aria-label="Previous year"
              className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-30 dark:hover:bg-slate-800"
            >
              ‹
            </button>
            <span className="text-sm font-bold text-slate-900 dark:text-white">{year}</span>
            <button
              type="button"
              onClick={() => setYear((y) => y + 1)}
              disabled={year >= thisYear}
              aria-label="Next year"
              className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-30 dark:hover:bg-slate-800"
            >
              ›
            </button>
          </div>

          <div className="grid grid-cols-4 gap-1.5">
            {SHORT.map((name, i) => {
              const m = key(year, i);
              const blocked = blockedReason(m);
              const status = STATUS_STYLE[statusByMonth[m]];
              const selected = m === value;
              const current = m === thisMonth;
              return (
                <button
                  key={m}
                  type="button"
                  disabled={Boolean(blocked)}
                  title={blocked || (status ? `${status.label} for this asset` : formatMonth(m))}
                  onClick={() => {
                    onChange(m);
                    setOpen(false);
                  }}
                  className={cn(
                    'flex h-14 cursor-pointer flex-col items-center justify-center rounded-lg border text-sm transition-all duration-150',
                    selected
                      ? 'border-transparent bg-gradient-to-br from-indigo-600 to-violet-600 font-semibold text-white shadow-md shadow-indigo-600/30'
                      : blocked
                        ? 'cursor-not-allowed border-transparent text-slate-300 dark:text-slate-600'
                        : 'border-slate-200 font-medium text-slate-700 hover:border-indigo-300 hover:bg-indigo-50 dark:border-slate-700 dark:text-slate-200 dark:hover:border-indigo-400/40 dark:hover:bg-indigo-500/10',
                    current && !selected && !blocked && 'ring-1 ring-amber-400/60',
                  )}
                >
                  {name}
                  <span
                    className={cn(
                      'mt-0.5 flex h-3 items-center gap-1 text-[10px] font-medium',
                      selected ? 'text-white/80' : status ? status.text : 'text-slate-400',
                    )}
                  >
                    {status ? (
                      <>
                        <span className={cn('h-1.5 w-1.5 rounded-full', selected ? 'bg-white' : status.dot)} />
                        {status.label}
                      </>
                    ) : current ? (
                      'Now'
                    ) : blocked === 'Before launch' ? (
                      '—'
                    ) : null}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-slate-100 pt-2.5 text-[11px] text-slate-500 dark:border-slate-800 dark:text-slate-400">
            <span className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Paid
            </span>
            <span className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-slate-400" /> Draft
            </span>
            <span>Months are UTC</span>
            {!allowCurrentMonth && <span>· current month opens when it ends</span>}
          </div>
        </div>
      )}
    </div>
  );
};

export default MonthPicker;
