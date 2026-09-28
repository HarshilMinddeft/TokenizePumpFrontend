import { cn } from '../../lib/utils';

const EmptyState = ({
  children,
  title = 'Nothing to show yet',
  icon,
  action,
  className = '',
  compact = false,
}) => (
  <div
    className={cn(
      'flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white/60 px-6 text-center dark:border-slate-700 dark:bg-slate-900/40',
      compact ? 'min-h-48 py-10' : 'min-h-80 py-16',
      className,
    )}
  >
    <div className="relative mb-5">
      <div className="absolute -inset-3 rounded-full bg-indigo-500/15 blur-xl" />
      <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-50 to-violet-100 text-indigo-500 ring-1 ring-indigo-100 dark:from-indigo-500/20 dark:to-violet-500/10 dark:text-indigo-300 dark:ring-indigo-500/20">
        {icon || (
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M2.25 13.5h3.86a2.25 2.25 0 0 1 2.012 1.244l.256.512a2.25 2.25 0 0 0 2.013 1.244h3.218a2.25 2.25 0 0 0 2.013-1.244l.256-.512a2.25 2.25 0 0 1 2.013-1.244h3.859m-19.5.338V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18v-4.162c0-.224-.034-.447-.1-.661L19.24 5.338a2.25 2.25 0 0 0-2.15-1.588H6.911a2.25 2.25 0 0 0-2.15 1.588L2.35 13.177a2.25 2.25 0 0 0-.1.661Z"
            />
          </svg>
        )}
      </div>
    </div>
    <p className="text-[15px] font-semibold text-slate-900 dark:text-slate-100">{title}</p>
    {children && <p className="mt-1 max-w-sm text-sm leading-relaxed text-slate-500 dark:text-slate-400">{children}</p>}
    {action && <div className="mt-5">{action}</div>}
  </div>
);

export default EmptyState;
