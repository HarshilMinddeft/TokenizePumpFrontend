import { cn } from '../../lib/utils';

/**
 * Select
 * @param {string} [label]
 * @param {string} [error]
 */
const Select = ({ label, className = '', error, id, children, ...rest }) => {
  const selectId = id || (label ? `select-${label.toLowerCase().replace(/\W+/g, '-')}` : undefined);
  return (
    <label className="block text-left" htmlFor={selectId}>
      {label && (
        <span className="mb-1.5 block text-[13px] font-medium text-slate-700 dark:text-slate-300">{label}</span>
      )}
      <select
        id={selectId}
        className={cn(
          'h-10 w-full rounded-lg border bg-white px-3 text-sm text-slate-900 shadow-sm transition-all duration-150 outline-none focus:ring-4 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-slate-950 dark:text-slate-100',
          error
            ? 'border-red-400 focus:border-red-500 focus:ring-red-500/15 dark:border-red-800'
            : 'border-slate-300 focus:border-indigo-500 focus:ring-indigo-500/15 dark:border-slate-700 dark:focus:border-indigo-400',
          className,
        )}
        {...rest}
      >
        {children}
      </select>
      {error && <span className="mt-1.5 block text-xs font-medium text-red-500 dark:text-red-400">{error}</span>}
    </label>
  );
};

export default Select;
