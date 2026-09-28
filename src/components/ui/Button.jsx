import { cn } from '../../lib/utils';

const SIZES = {
  sm: 'h-8 gap-1.5 rounded-lg px-3 text-xs',
  md: 'h-10 gap-2 rounded-xl px-4 text-sm',
  lg: 'h-11 gap-2 rounded-xl px-5 text-[15px]',
  icon: 'h-9 w-9 rounded-lg p-0',
};

const VARIANTS = {
  // Gold with dark text + hover sheen, as on the landing page CTAs (see
  // `btn-gold` in src/app/index.css).
  primary: 'btn-gold',
  secondary:
    'border border-slate-200 bg-white text-slate-700 shadow-sm hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800',
  ghost:
    'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white',
  soft: 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-500/15 dark:text-indigo-300 dark:hover:bg-indigo-500/25',
  danger:
    'bg-red-600 text-white shadow-sm shadow-red-600/30 hover:bg-red-500 dark:bg-red-600 dark:hover:bg-red-500',
  outlineDanger:
    'border border-red-200 bg-white text-red-600 hover:bg-red-50 dark:border-red-900 dark:bg-transparent dark:text-red-400 dark:hover:bg-red-950/40',
  success:
    'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30 hover:bg-emerald-500 dark:bg-emerald-600 dark:hover:bg-emerald-500',
};

const Spinner = ({ className }) => (
  <svg className={cn('h-4 w-4 shrink-0 animate-spin', className)} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4z" />
  </svg>
);

/**
 * Button
 * @param {('primary'|'secondary'|'ghost'|'soft'|'danger'|'outlineDanger'|'success')} [variant]
 * @param {('sm'|'md'|'lg'|'icon')} [size]
 * @param {boolean} [fullWidth]
 * @param {boolean} [loading]
 */
const Button = ({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  leftIcon,
  rightIcon,
  className = '',
  children,
  disabled,
  ...rest
}) => (
  <button
    className={cn(
      'inline-flex cursor-pointer items-center justify-center whitespace-nowrap font-semibold transition-all duration-150 outline-none select-none focus-visible:ring-2 focus-visible:ring-indigo-500/60 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:pointer-events-none disabled:opacity-50 dark:focus-visible:ring-offset-slate-950 active:scale-[0.985]',
      SIZES[size],
      VARIANTS[variant],
      fullWidth && 'w-full',
      className,
    )}
    disabled={disabled || loading}
    {...rest}
  >
    {loading && <Spinner />}
    {!loading && leftIcon}
    {children}
    {!loading && rightIcon}
  </button>
);

export default Button;
