import { useLocation, useNavigate } from 'react-router-dom';
import ThemeToggle from '../ui/ThemeToggle';
import BrandLogo from './BrandLogo';
import { useWeb3 } from '../../context/Web3Context';
import { shortenAddress } from '../../lib/utils';
import { ROUTES } from '../../config/routes';

const WalletIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.9}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M21 12a2.25 2.25 0 0 0-2.25-2.25H15a3 3 0 1 1-6 0H5.25A2.25 2.25 0 0 0 3 12m18 0v6a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 9m18 0V6a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 6v3"
    />
  </svg>
);

/**
 * Minimal top bar for public pages (Marketplace, Property details) — no
 * sidebar, no hamburger menu. Visitors can browse without a wallet; a
 * connected wallet just shows its short address here, it never switches
 * these two pages over to the sidebar app-shell.
 */
const PublicTopBar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { address, isConnected, connectWallet } = useWeb3();

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/75 backdrop-blur-xl dark:border-[color:var(--tf-hairline)] dark:bg-slate-950/70">
      <span key={location.pathname} className="header-beam" aria-hidden="true" />
      <div className="mx-auto flex h-16 w-full max-w-[1180px] items-center gap-3 px-4 sm:px-6 lg:px-8">
        <button type="button" onClick={() => navigate(ROUTES.marketplace)} className="cursor-pointer">
          <BrandLogo />
        </button>

        <div className="ml-auto flex items-center gap-2.5">
          {isConnected && address ? (
            <span className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-[13px] font-semibold text-slate-700 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-70" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
              </span>
              {shortenAddress(address, 5, 4)}
            </span>
          ) : (
            <button
              type="button"
              onClick={connectWallet}
              className="btn-gold inline-flex h-9 cursor-pointer items-center gap-2 rounded-lg px-3.5 text-[13px] font-semibold transition-all duration-150 active:scale-[0.98]"
            >
              <WalletIcon />
              <span className="hidden sm:inline">Connect wallet</span>
            </button>
          )}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
};

export default PublicTopBar;
