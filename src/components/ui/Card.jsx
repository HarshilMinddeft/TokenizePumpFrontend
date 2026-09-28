import { cn } from '../../lib/utils';

/**
 * Card — elevated surface with hairline border; espresso with a gold hairline
 * in dark mode, like the landing page panels.
 * @param {boolean} [hover] lift + gold glow on hover
 */
const Card = ({ className = '', hover = false, children, ...rest }) => (
  <div
    className={cn(
      'rounded-2xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(26,20,14,0.04),0_8px_24px_-16px_rgba(26,20,14,0.1)] dark:border-[color:var(--tf-hairline)] dark:bg-slate-900/90 dark:shadow-[0_1px_0_rgba(255,248,230,0.04)_inset]',
      hover && 'card-glow transition-all duration-300 hover:-translate-y-1',
      className,
    )}
    {...rest}
  >
    {children}
  </div>
);

export default Card;
