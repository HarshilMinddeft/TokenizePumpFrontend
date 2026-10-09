import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'react-toastify';
import { useWeb3 } from '../../context/Web3Context';
import { getPageMeta } from '../../config/navigation';
import { shortenAddress } from '../../lib/utils';
import envConfig from '../../config/env.config';

const WalletIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.9}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M21 12a2.25 2.25 0 0 0-2.25-2.25H15a3 3 0 1 1-6 0H5.25A2.25 2.25 0 0 0 3 12m18 0v6a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 9m18 0V6a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 6v3"
    />
  </svg>
);

const ChevronDown = () => (
  <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
    <path
      fillRule="evenodd"
      d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z"
      clipRule="evenodd"
    />
  </svg>
);

const ConnectPill = ({ onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="btn-gold inline-flex h-9 cursor-pointer items-center gap-2 rounded-lg px-3.5 text-[13px] font-semibold transition-all duration-150 active:scale-[0.98]"
  >
    <WalletIcon />
    <span className="hidden sm:inline">Connect wallet</span>
  </button>
);

const CopyIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.9}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M8 7.5V6a2.25 2.25 0 0 1 2.25-2.25h7.5A2.25 2.25 0 0 1 20 6v7.5a2.25 2.25 0 0 1-2.25 2.25H16.5M8 7.5h-.75A2.25 2.25 0 0 0 5 9.75v8A2.25 2.25 0 0 0 7.25 20h7.5a2.25 2.25 0 0 0 2.25-2.25V16.5M8 7.5h6.5a2.25 2.25 0 0 1 2.25 2.25v6.5"
    />
  </svg>
);

const ExplorerIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.9}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-9 4.5L20.25 3.75M20.25 3.75h-6M20.25 3.75v6"
    />
  </svg>
);

const DisconnectIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.9}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M8.25 9V5.25A2.25 2.25 0 0 1 10.5 3h6a2.25 2.25 0 0 1 2.25 2.25v13.5A2.25 2.25 0 0 1 16.5 21h-6a2.25 2.25 0 0 1-2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75"
    />
  </svg>
);

// Also used by PublicTopBar, so wallet actions match on public pages.
export const ConnectedPill = ({ address, onDisconnect }) => {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const handlePointerDown = (event) => {
      if (rootRef.current && !rootRef.current.contains(event.target)) setOpen(false);
    };
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(address);
      toast.success('Address copied');
    } catch {
      toast.error('Could not copy address');
    }
    setOpen(false);
  };

  const handleViewExplorer = () => {
    setOpen(false);
    if (!envConfig.robinhoodExplorerUrl) {
      toast.info('Explorer link is not configured');
      return;
    }
    window.open(
      `${envConfig.robinhoodExplorerUrl.replace(/\/$/, '')}/address/${address}`,
      '_blank',
      'noopener,noreferrer',
    );
  };

  const handleDisconnect = () => {
    setOpen(false);
    onDisconnect();
  };

  return (
    <div ref={rootRef} className="relative">
      <motion.button
        type="button"
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="group inline-flex h-9 cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white py-0 pr-2 pl-1.5 shadow-sm transition-all duration-150 hover:border-slate-300 active:scale-[0.98] dark:border-slate-700 dark:bg-slate-900 dark:hover:border-slate-600"
        title="Manage wallet"
      >
        <span className="btn-gold flex h-6 w-6 items-center justify-center rounded-md font-mono text-[10px] font-semibold">
          {address.slice(2, 4).toUpperCase()}
        </span>
        <span className="hidden items-center gap-1.5 text-[13px] font-semibold text-slate-700 sm:flex dark:text-slate-200">
          {shortenAddress(address, 5, 4)}
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-70" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
          </span>
        </span>
        <span
          className={`text-slate-300 transition-transform duration-150 group-hover:text-slate-500 dark:text-slate-600 dark:group-hover:text-slate-400 ${open ? 'rotate-180' : ''}`}
        >
          <ChevronDown />
        </span>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.12 }}
            role="menu"
            className="absolute top-11 right-0 z-40 w-56 overflow-hidden rounded-xl border border-slate-200 bg-white py-1.5 shadow-lg shadow-slate-900/10 dark:border-slate-700 dark:bg-slate-900 dark:shadow-black/30"
          >
            <div className="border-b border-slate-100 px-3 py-2 dark:border-slate-800">
              <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500">Connected wallet</p>
              <p className="truncate text-[13px] font-semibold text-slate-700 dark:text-slate-200">
                {shortenAddress(address, 8, 6)}
              </p>
            </div>
            <button
              type="button"
              role="menuitem"
              onClick={handleCopy}
              className="flex w-full cursor-pointer items-center gap-2.5 px-3 py-2 text-left text-[13px] font-medium text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <CopyIcon />
              Copy address
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={handleViewExplorer}
              className="flex w-full cursor-pointer items-center gap-2.5 px-3 py-2 text-left text-[13px] font-medium text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <ExplorerIcon />
              View on explorer
            </button>
            <div className="my-1 border-t border-slate-100 dark:border-slate-800" />
            <button
              type="button"
              role="menuitem"
              onClick={handleDisconnect}
              className="flex w-full cursor-pointer items-center gap-2.5 px-3 py-2 text-left text-[13px] font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10"
            >
              <DisconnectIcon />
              Disconnect
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const TopBar = ({ onMenuOpen }) => {
  const location = useLocation();
  const { address, isConnected, connectWallet, disconnectWallet } = useWeb3();
  const meta = getPageMeta(location.pathname);

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/75 backdrop-blur-xl dark:border-[color:var(--tf-hairline)] dark:bg-slate-950/70">
      <span key={location.pathname} className="header-beam" aria-hidden="true" />
      <div className="mx-auto flex h-16 w-full max-w-[1180px] items-center gap-3 px-4 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={onMenuOpen}
          aria-label="Open navigation"
          className="-ml-1 flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 lg:hidden dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
        >
          <svg className="h-5.5 w-5.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path
              fillRule="evenodd"
              d="M2 4.75A.75.75 0 0 1 2.75 4h14.5a.75.75 0 0 1 0 1.5H2.75A.75.75 0 0 1 2 4.75Zm0 10.5a.75.75 0 0 1 .75-.75h7.5a.75.75 0 0 1 0 1.5h-7.5a.75.75 0 0 1-.75-.75ZM2 10a.75.75 0 0 1 .75-.75h14.5a.75.75 0 0 1 0 1.5H2.75A.75.75 0 0 1 2 10Z"
              clipRule="evenodd"
            />
          </svg>
        </button>

        <div className="hidden items-center gap-1.5 text-sm lg:flex">
          <span className="font-display font-bold tracking-[0.06em] text-slate-400 dark:text-slate-500">VARELO</span>
          <svg className="h-3.5 w-3.5 text-slate-300 dark:text-slate-600" viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M7.21 14.77a.75.75 0 0 1 .02-1.06L11.168 10 7.23 6.29a.75.75 0 1 1 1.04-1.08l4.5 4.25a.75.75 0 0 1 0 1.08l-4.5 4.25a.75.75 0 0 1-1.06-.02Z"
              clipRule="evenodd"
            />
          </svg>
          <span className="font-semibold text-slate-700 dark:text-slate-200">{meta.title}</span>
        </div>

        <div className="ml-auto flex items-center gap-2.5">
          {isConnected && address ? (
            <ConnectedPill address={address} onDisconnect={disconnectWallet} />
          ) : (
            <ConnectPill onClick={connectWallet} />
          )}
        </div>
      </div>
    </header>
  );
};

export default TopBar;
