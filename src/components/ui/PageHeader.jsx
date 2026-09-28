import { cn } from '../../lib/utils';

const PageHeader = ({ title, description, icon, eyebrow, action, actions, className = '' }) => (
  <header className={cn('relative mb-8', className)}>
    <div className="pointer-events-none absolute -top-10 -left-16 -z-10 h-48 w-48 rounded-full bg-indigo-200/30 blur-3xl dark:bg-indigo-500/10" />
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex min-w-0 items-start gap-4 text-left">
        {icon && (
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-600/25 ring-1 ring-white/20 ring-inset dark:from-indigo-500 dark:to-violet-500">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}>
              {icon}
            </svg>
          </div>
        )}
        <div className="min-w-0">
          {eyebrow && (
            <p className="mb-1 text-[11px] font-bold tracking-[0.14em] text-indigo-600 uppercase dark:text-indigo-400">
              {eyebrow}
            </p>
          )}
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-[28px] dark:text-white">
            {title}
          </h1>
          {description && (
            <p className="mt-1.5 max-w-2xl text-[15px] leading-6 text-slate-500 dark:text-slate-400">
              {description}
            </p>
          )}
        </div>
      </div>
      {(action || actions) && (
        <div className="flex shrink-0 flex-wrap items-center gap-2.5">{action || actions}</div>
      )}
    </div>
  </header>
);

export default PageHeader;
