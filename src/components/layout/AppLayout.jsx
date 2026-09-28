import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import { useTheme } from '../../context/ThemeContext';
import { getPageMeta } from '../../config/navigation';

const AppLayout = ({ children, maxWidth = '1180px' }) => {
  const { theme } = useTheme();
  const location = useLocation();
  const [navOpen, setNavOpen] = useState(false);

  useEffect(() => {
    setNavOpen(false);
    const meta = getPageMeta(location.pathname);
    document.title = `${meta.title} · VARELO`;
  }, [location.pathname]);

  return (
    <div className="isolate min-h-screen bg-page text-slate-950 dark:bg-slate-950 dark:text-slate-100">
      <div className="app-ambient" aria-hidden="true">
        <div className="app-ambient-grid" />
      </div>

      <Sidebar open={navOpen} onClose={() => setNavOpen(false)} />

      <div className="flex min-h-screen flex-col lg:pl-64">
        <TopBar onMenuOpen={() => setNavOpen(true)} />

        <main className="flex-1">
          {/* Keyed on the route so each page fades up as it arrives. */}
          <div
            key={location.pathname}
            className="animate-page-in mx-auto w-full px-4 py-6 sm:px-6 sm:py-8 lg:px-8"
            style={{ maxWidth }}
          >
            {children}
          </div>
        </main>

        <footer className="border-t border-slate-200/70 py-5 dark:border-slate-800/70">
          <p className="px-4 text-center text-xs text-slate-400 dark:text-slate-500">
            VARELO — fractionalized real-world assets on Robinhood · Demo environment
          </p>
        </footer>
      </div>

      <ToastContainer position="top-right" autoClose={2600} closeOnClick theme={theme} limit={3} />
    </div>
  );
};

export default AppLayout;
