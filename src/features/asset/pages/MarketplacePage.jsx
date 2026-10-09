import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'motion/react';
import PublicLayout from '../../../components/layout/PublicLayout';
import AppLayout from '../../../components/layout/AppLayout';
import StationTile from '../components/StationTile';
import InvestorDashboard from '../../rent/components/InvestorDashboard';
import PageHeader from '../../../components/ui/PageHeader';
import Skeleton from '../../../components/ui/Skeleton';
import EmptyState from '../../../components/ui/EmptyState';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';
import { getAssetDetailsPath, getAppAssetDetailsPath } from '../../../config/routes';
import web3Service from '../../../services/web3Service';
import assetApi from '../api/assetApi';
import useAssetsFilteredBy from '../hooks/useAssetsFilteredBy';
import { cn, formatNumber } from '../../../lib/utils';
import { formatShares, formatStable } from '../../../utils/units';

// cancelListing sets active = false in the same call that may open a
// buyback, so a listing with a live buyback (holders can still sell back)
// always has active == false too. Keep it visible here — it's still the
// only way holders reach AssetDetailPage to call sellTokensBack — rather
// than filtering strictly on `active`, which would make it unreachable.  
const isActivelyListed = async (asset, marketplaceContract) => {
  const listing = await marketplaceContract.listings(asset.assetId);
  return listing.active || listing.buyBack;
};

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
};

const GridSkeleton = () => (
  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
    {Array.from({ length: 6 }).map((_, i) => (
      <div key={i} className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <Skeleton className="aspect-[16/10] rounded-none" />
        <div className="space-y-3 p-5">
          <Skeleton className="h-4 w-2/3" />
          <div className="grid grid-cols-3 gap-2 border-y border-slate-100 py-3 dark:border-slate-800">
            <Skeleton className="h-6" />
            <Skeleton className="h-6" />
            <Skeleton className="h-6" />
          </div>
          <Skeleton className="h-9 w-full" />
        </div>
      </div>
    ))}
  </div>
);

const MarketplacePage = ({ isPublic = false }) => {
  const Layout = isPublic ? PublicLayout : AppLayout;
  const detailPath = isPublic ? getAssetDetailsPath : getAppAssetDetailsPath;

  const navigate = useNavigate();
  // Tab lives in the URL (?tab=dashboard) so it survives reloads and can be linked to
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get('tab') === 'dashboard' ? 'dashboard' : 'assets';
  const setTab = (next) => setSearchParams(next === 'dashboard' ? { tab: 'dashboard' } : {}, { replace: true });

  const [query, setQuery] = useState('');
  const [sort, setSort] = useState('newest');

  const { assets, loading } = useAssetsFilteredBy(
    assetApi.getAllMarketplaceAssets,
    isActivelyListed,
    web3Service.getReadOnlyMarketplaceContract,
  );

  // Each station's on-chain listing: price per share, shares on sale, and
  // whether it's actually a cancelled listing with a still-open buyback
  // (isActivelyListed keeps those so holders can reach the sell-back page) —
  // the tile must not read as "buy now" for those.
  const [listings, setListings] = useState({});

  useEffect(() => {
    if (assets.length === 0) return;
    let cancelled = false;

    (async () => {
      const marketplace = web3Service.getReadOnlyMarketplaceContract();
      const next = {};
      for (const prop of assets) {
        try {
          const l = await marketplace.listings(prop.assetId);
          next[prop.assetId] = {
            active: l.active,
            buyBack: l.buyBack,
            price: Number(formatStable(l.pricePerToken)),
            buyBackPrice: l.buyBack ? Number(formatStable(l.buyBackPrice)) : null,
            total: Number(formatShares(l.totalTokens)),
            remaining: Number(formatShares(l.remainingTokens)),
          };
        } catch (err) {
          console.error(`Error reading listing for asset ${prop.assetId}:`, err);
        }
      }
      if (!cancelled) setListings(next);
    })();

    return () => {
      cancelled = true;
    };
  }, [assets]);

  const filtered = useMemo(() => {
    if (!query.trim()) return assets;
    const q = query.trim().toLowerCase();
    return assets.filter(
      (p) =>
        String(p.assetName || '').toLowerCase().includes(q) ||
        String(p.locationDetails || '').toLowerCase().includes(q) ||
        String(p.assetId).includes(q),
    );
  }, [assets, query]);

  const sorted = useMemo(() => {
    const list = [...filtered];
    // Price = price per share (what an investor pays), falling back to the
    // station value until the listing has loaded.
    const priceOf = (p) => listings[p.assetId]?.price ?? Number(p.assetPrice);
    if (sort === 'price-high') list.sort((a, b) => priceOf(b) - priceOf(a));
    if (sort === 'price-low') list.sort((a, b) => priceOf(a) - priceOf(b));
    if (sort === 'size-high') list.sort((a, b) => Number(b.assetSize) - Number(a.assetSize));
    return list;
  }, [filtered, sort, listings]);

  const totals = useMemo(() => {
    const totalValue = assets.reduce((sum, p) => sum + (Number(p.assetPrice) || 0), 0);
    const live = assets.map((p) => listings[p.assetId]).filter((l) => l && l.active);
    const sharesOnSale = live.reduce((sum, l) => sum + l.remaining, 0);
    const prices = live.map((l) => l.price).filter((v) => v > 0);
    return { totalValue, sharesOnSale, entry: prices.length ? Math.min(...prices) : null, ready: live.length > 0 };
  }, [assets, listings]);

  return (
    <Layout>
      <PageHeader
        eyebrow="Explore"
        title={tab === 'dashboard' ? 'My Portfolio' : 'Marketplace'}
        description={
          tab === 'dashboard'
            ? 'The shares you hold, the income they earn and every trade you make.'
            : 'Own a slice of a working fuel station — from one share, earning monthly.'
        }
        actions={<MarketTabs tab={tab} onChange={setTab} assetCount={loading ? null : assets.length} />}
        icon={
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3.75 21V9.349m0 0a3.001 3.001 0 0 0 3.75-.615A2.993 2.993 0 0 0 9.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 0 0 2.25 1.016c.896 0 1.7-.393 2.25-1.015a3.001 3.001 0 0 0 3.75.614m-16.5 0a3.004 3.004 0 0 1-.621-4.72l1.189-1.19A1.5 1.5 0 0 1 5.378 3h13.243a1.5 1.5 0 0 1 1.06.44l1.19 1.189a3 3 0 0 1-.621 4.72M6.75 18h3.75a.75.75 0 0 0 .75-.75V13.5a.75.75 0 0 0-.75-.75H6.75a.75.75 0 0 0-.75.75v3.75c0 .414.336.75.75.75Z"
          />
        }
      />

      {tab === 'dashboard' ? (
        <InvestorDashboard detailPath={detailPath} onBrowse={() => setTab('assets')} />
      ) : (
        <>
          {/* Market board: the numbers and the controls in one panel */}
          <section className="mb-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
            <dl className="grid grid-cols-2 divide-slate-100 lg:grid-cols-4 lg:divide-x dark:divide-slate-800">
              <BoardStat label="Live stations" value={loading ? '…' : formatNumber(assets.length, 0)} />
              <BoardStat
                label="Value on-chain"
                value={loading ? '…' : `$${formatNumber(totals.totalValue, 0)}`}
              />
              <BoardStat
                label="Shares on sale"
                value={loading || !totals.ready ? '…' : formatNumber(totals.sharesOnSale, 0)}
              />
              <BoardStat
                label="Entry from"
                value={loading || !totals.ready ? '…' : totals.entry ? `$${formatNumber(totals.entry, 2)}` : '—'}
                sub="/ share"
                highlight
              />
            </dl>

            <div className="flex flex-col gap-3 border-t border-slate-100 bg-slate-50/60 px-4 py-3 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800 dark:bg-black/20">
              <div className="relative w-full sm:max-w-sm">
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search by name, location or ID…"
                  aria-label="Search assets"
                  leadingIcon={
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
                      />
                    </svg>
                  }
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="hidden text-xs font-medium text-slate-400 sm:block dark:text-slate-500">
                  {loading ? 'Syncing…' : `${sorted.length} of ${assets.length} stations`}
                </span>
                <SortPills sort={sort} onChange={setSort} />
              </div>
            </div>
          </section>

          {loading ? (
            <GridSkeleton />
          ) : sorted.length > 0 ? (
            <motion.div
              key={`${sort}-${filtered.length}`}
              variants={container}
              initial="hidden"
              animate="show"
              className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3"
            >
              {sorted.map((prop) => (
                <motion.div key={prop.assetId} variants={item} className="h-full">
                  <StationTile
                    asset={prop}
                    listing={listings[prop.assetId]}
                    onOpen={() => navigate(detailPath(prop.assetId))}
                  />
                </motion.div>
              ))}
            </motion.div>
          ) : query ? (
            <EmptyState
              title="No matching assets"
              icon={<SearchIcon />}
              action={
                <Button variant="secondary" size="sm" onClick={() => setQuery('')}>
                  Clear search
                </Button>
              }
            >
              Nothing matched “{query}”. Try a different name, location or asset ID.
            </EmptyState>
          ) : (
            <EmptyState
              title="No assets are currently listed"
              action={
                <Button
                  variant="soft"
                  size="sm"
                  onClick={() => navigate('/fractionalize-asset')}
                >
                  Go to your assets
                </Button>
              }
            >
              When an asset owner lists shares on the marketplace they will appear here. Check back soon.
            </EmptyState>
          )}
        </>
      )}
    </Layout>
  );
};

const TABS = [
  {
    value: 'assets',
    label: 'Explore',
    icon: 'M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21',
  },
  {
    value: 'dashboard',
    label: 'My Portfolio',
    icon: 'M10.5 6a7.5 7.5 0 1 0 7.5 7.5h-7.5V6Z M13.5 10.5H21A7.5 7.5 0 0 0 13.5 3v7.5Z',
  },
];

const MarketTabs = ({ tab, onChange, assetCount }) => (
  <div
    role="tablist"
    aria-label="Marketplace view"
    className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-sm dark:border-slate-800 dark:bg-slate-900"
  >
    {TABS.map((t) => {
      const active = tab === t.value;
      return (
        <button
          key={t.value}
          type="button"
          role="tab"
          aria-selected={active}
          onClick={() => onChange(t.value)}
          className={cn(
            'relative flex cursor-pointer items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors',
            active ? 'text-white' : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200',
          )}
        >
          {active && (
            <motion.span
              layoutId="market-tab"
              className="absolute inset-0 rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 shadow-md shadow-indigo-600/25"
              transition={{ type: 'spring', stiffness: 420, damping: 34 }}
            />
          )}
          <svg className="relative h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d={t.icon} />
          </svg>
          <span className="relative">{t.label}</span>
          {t.value === 'assets' && assetCount !== null && (
            <span
              className={cn(
                'relative rounded-full px-1.5 py-px text-[11px] font-bold tabular-nums',
                active
                  ? 'bg-white text-indigo-700'
                  : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
              )}
            >
              {assetCount}
            </span>
          )}
        </button>
      );
    })}
  </div>
);

/** One cell of the market board — a ticker-style figure. */
const BoardStat = ({ label, value, sub, highlight = false }) => (
  <div className="border-slate-100 px-5 py-4 odd:border-r [&:nth-child(-n+2)]:border-b lg:border-0 dark:border-slate-800">
    <dt className="font-mono text-[10px] tracking-[0.18em] text-slate-400 uppercase dark:text-slate-500">{label}</dt>
    <dd
      className={cn(
        'mt-1.5 text-2xl font-bold tracking-tight tabular-nums',
        highlight
          ? 'text-amber-600 dark:text-amber-300 dark:[text-shadow:0_0_14px_rgba(252,211,77,0.35)]'
          : 'text-slate-900 dark:text-white',
      )}
    >
      {value}
      {sub && <span className="ml-1 text-xs font-medium text-slate-400 dark:text-slate-500">{sub}</span>}
    </dd>
  </div>
);

const SortPills = ({ sort, onChange }) => {
  const options = [
    { value: 'newest', label: 'Newest' },
    { value: 'price-high', label: 'Price ↑' },
    { value: 'price-low', label: 'Price ↓' },
  ];
  return (
    <div className="flex items-center rounded-lg border border-slate-200 bg-white p-0.5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={cn(
            'cursor-pointer rounded-md px-2.5 py-1.5 text-xs font-semibold transition-colors',
            sort === opt.value
              ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300'
              : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200',
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
};

const SearchIcon = () => (
  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
    />
  </svg>
);

export default MarketplacePage;
