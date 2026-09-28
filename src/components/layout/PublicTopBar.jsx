import { useNavigate } from 'react-router-dom';
import ThemeToggle from '../ui/ThemeToggle';
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

const Logo = () => (
  <div className="flex items-center gap-2.5">
    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 p-1 ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700">
      <img src="/logoD.webp" className="h-7 w-7 object-contain" alt="TrueFraction logo" />
    </span>
    <span className="text-[17px] font-bold tracking-tight text-slate-900 dark:text-white">
      True<span className="text-gradient">Fraction</span>
    </span>
  </div>
);

/**
 * Minimal top bar for public pages (Marketplace, Property details) — no
 * sidebar, no hamburger menu. Visitors can browse without a wallet; a
 * connected wallet just shows its short address here, it never switches
 * these two pages over to the sidebar app-shell.
 */
const PublicTopBar = () => {
  const navigate = useNavigate();
  const { address, isConnected, connectWallet } = useWeb3();

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/80 backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-950/70">
      <div className="mx-auto flex h-16 w-full max-w-[1180px] items-center gap-3 px-4 sm:px-6 lg:px-8">
        <button type="button" onClick={() => navigate(ROUTES.marketplace)} className="cursor-pointer">
          <Logo />
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
              className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 px-3.5 text-[13px] font-semibold text-white shadow-sm shadow-indigo-600/30 transition-all duration-150 hover:shadow-md hover:shadow-indigo-600/40 hover:brightness-110 active:scale-[0.98]"
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
