import { useLocation, useNavigate } from 'react-router-dom';
import { useWeb3 } from '../../context/Web3Context';
import envConfig from '../../config/env.config';
import { cn } from '../../lib/utils';
import { NAV_GROUPS } from '../../config/navigation';
import useAuthorityRole from '../../features/asset/hooks/useAuthorityRole';
import useHasActiveBuyBack from '../../features/asset/hooks/useHasActiveBuyBack';
import BrandLogo from './BrandLogo';

const NavItem = ({ item, isActive, onClick }) => (
  <li>
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'group relative flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2 text-left transition-all duration-200',
        isActive
          ? 'bg-indigo-500/10 text-indigo-700 ring-1 ring-indigo-500/25 dark:bg-indigo-400/10 dark:text-indigo-200 dark:ring-indigo-400/20'
          : 'text-slate-600 hover:translate-x-0.5 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800/70 dark:hover:text-white',
      )}
    >
      {/* Glowing gold edge on the active item, like the landing timeline. */}
      {isActive && (
        <span className="absolute top-2 bottom-2 -left-3 w-[3px] rounded-r-full bg-indigo-400 shadow-[0_0_10px_var(--tf-glow),0_0_2px_var(--tf-indigo-400)]" />
      )}
      <span
        className={cn(
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors',
          isActive
            ? 'btn-gold'
            : 'text-slate-400 group-hover:text-indigo-600 dark:text-slate-500 dark:group-hover:text-indigo-300',
        )}
      >
        <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          {item.icon}
        </svg>
      </span>
      <span className="min-w-0 flex-1 text-[13.5px] font-medium">{item.label}</span>
      {isActive && (
        <span className="relative flex h-1.5 w-1.5 shrink-0">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-indigo-400 opacity-60" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-indigo-400" />
        </span>
      )}
    </button>
  </li>
);

/**
 * Sidebar — desktop fixed rail, mobile drawer. Visibility is controlled
 * by AppLayout through `open`/`onClose`.
 */
const Sidebar = ({ open = false, onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { address } = useWeb3();

  // Admin nav appears for the configured admin wallet or any wallet holding
  // the marketplace's on-chain authority role — the same rule the pages enforce.
  const { isAuthority } = useAuthorityRole(address);
  const admin = address?.toLowerCase() === envConfig.adminWalletAddress || isAuthority;

  const { hasBuyBack } = useHasActiveBuyBack(address);

  const go = (path) => {
    navigate(path);
    onClose?.();
  };

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-sm lg:hidden" onClick={onClose} />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-200 bg-white/85 backdrop-blur-xl transition-transform duration-200 ease-out dark:border-[color:var(--tf-hairline)] dark:bg-slate-900/85',
          open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        )}
      >
        <div className="flex items-center justify-between px-5 pt-5 pb-2">
          <a href="/" onClick={() => onClose?.()}>
            <BrandLogo />
          </a>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close navigation"
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 lg:hidden dark:hover:bg-slate-800 dark:hover:text-slate-200"
          >
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
            </svg>
          </button>
        </div>

        <nav className="tf-scroll flex-1 space-y-6 overflow-y-auto px-3 pt-4 pb-6">
          {NAV_GROUPS.filter((group) => !group.adminOnly || admin).map((group) => {
            const items = group.items.filter((item) => !item.requiresActiveBuyBack || hasBuyBack);
            if (items.length === 0) return null;

            return (
              <div key={group.id}>
                <p className="mb-2 px-3 font-mono text-[10.5px] font-medium tracking-[0.16em] text-indigo-600/80 uppercase dark:text-indigo-300/70">
                  {group.label}
                </p>
                <ul className="space-y-1">
                  {items.map((item) => (
                    <NavItem
                      key={item.path}
                      item={item}
                      isActive={location.pathname === item.path}
                      onClick={() => go(item.path)}
                    />
                  ))}
                </ul>
              </div>
            );
          })}
        </nav>

        <div className="space-y-3 border-t border-slate-100 px-3 py-4 dark:border-slate-800">
          <a
            href="/"
            onClick={() => onClose?.()}
            className="flex cursor-pointer items-center justify-between rounded-xl px-3 py-2 text-[13px] font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
          >
            <span className="flex items-center gap-2.5">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m-18.432 0A8.959 8.959 0 0 1 3 12c0-.778.099-1.533.284-2.253"
                />
              </svg>
              Public website
            </span>
            <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M3 10a.75.75 0 0 1 .75-.75h10.638L10.23 5.29a.75.75 0 1 1 1.04-1.08l5.5 5.25a.75.75 0 0 1 0 1.08l-5.5 5.25a.75.75 0 1 1-1.04-1.08l4.158-3.96H3.75A.75.75 0 0 1 3 10Z"
                clipRule="evenodd"
              />
            </svg>
          </a>
          <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2.5 dark:bg-slate-800/60">
            <span className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              Robinhood Testnet
            </span>
            <a
              href={envConfig.robinhoodExplorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] font-semibold text-indigo-600 hover:underline dark:text-indigo-400"
            >
              Explorer ↗
            </a>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
