import { cn } from '../../lib/utils';

const Textarea = ({ label, hint, error, className = '', rows = 4, ...rest }) => (
  <label className="block text-left">
    {label && (
      <span className="mb-1.5 block text-[13px] font-medium text-slate-700 dark:text-slate-300">{label}</span>
    )}
    <textarea
      rows={rows}
      className={cn(
        'w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm transition-all duration-150 outline-none placeholder:text-slate-400 focus:ring-4 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500',
        error
          ? 'border-red-400 focus:border-red-500 focus:ring-red-500/15 dark:border-red-800'
          : 'border-slate-300 focus:border-indigo-500 focus:ring-indigo-500/15 dark:border-slate-700 dark:focus:border-indigo-400',
        className,
      )}
      {...rest}
    />
    {hint && !error && <span className="mt-1.5 block text-xs text-slate-400 dark:text-slate-500">{hint}</span>}
    {error && <span className="mt-1.5 block text-xs font-medium text-red-500 dark:text-red-400">{error}</span>}
  </label>
);

export default Textarea;
