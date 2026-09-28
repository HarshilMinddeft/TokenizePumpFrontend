import { cn } from '../../lib/utils';

/**
 * Input
 * @param {string} [label]
 * @param {string} [hint]
 * @param {'neutral'|'positive'|'negative'} [hintTone] color variant for `hint` when there's no `error`
 * @param {string} [error]
 * @param {React.ReactNode} [leadingIcon] node rendered inside left side
 * @param {string} [prefix] static text adornment on the left (e.g. "$")
 * @param {string} [suffix] static text adornment on the right (e.g. "sqft")
 */
const Input = ({
  label,
  hint,
  hintTone = 'neutral',
  error,
  leadingIcon,
  prefix,
  suffix,
  className = '',
  id,
  ...rest
}) => {
  const inputId = id || (label ? `input-${label.toLowerCase().replace(/\W+/g, '-')}` : undefined);
  return (
    <label className="block text-left" htmlFor={inputId}>
      {label && (
        <span className="mb-1.5 block text-[13px] font-medium text-slate-700 dark:text-slate-300">{label}</span>
      )}
      <span className="relative block">
        {leadingIcon && (
          <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-slate-400">
            {leadingIcon}
          </span>
        )}
        {prefix && (
          <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm font-semibold text-slate-400 dark:text-slate-500">
            {prefix}
          </span>
        )}
        <input
          id={inputId}
          className={cn(
            'h-10 w-full rounded-lg border bg-white px-3 text-sm text-slate-900 shadow-sm transition-all duration-150 outline-none placeholder:text-slate-400 focus:ring-4 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500',
            error
              ? 'border-red-400 focus:border-red-500 focus:ring-red-500/15 dark:border-red-800'
              : 'border-slate-300 focus:border-indigo-500 focus:ring-indigo-500/15 dark:border-slate-700 dark:focus:border-indigo-400',
            (leadingIcon || prefix) && 'pl-9',
            suffix && 'pr-[3.75rem]',
            className,
          )}
          {...rest}
        />
        {suffix && (
          <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center rounded-r-lg border-l border-slate-200 bg-slate-50 px-2.5 text-xs font-semibold text-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-500">
            {suffix}
          </span>
        )}
      </span>
      {hint && !error && (
        <span
          className={cn(
            'mt-1.5 block text-xs font-medium',
            hintTone === 'positive'
              ? 'text-emerald-600 dark:text-emerald-400'
              : hintTone === 'negative'
                ? 'text-amber-600 dark:text-amber-500'
                : 'font-normal text-slate-400 dark:text-slate-500',
          )}
        >
          {hint}
        </span>
      )}
      {error && <span className="mt-1.5 block text-xs font-medium text-red-500 dark:text-red-400">{error}</span>}
    </label>
  );
};

export default Input;
