import { useEffect, useMemo, useRef, useState } from 'react';
import Badge from '../../../components/ui/Badge';
import { cn } from '../../../lib/utils';
import { formatMonth } from '../utils/format';

const Thumb = ({ asset, size = 'h-10 w-10' }) =>
  asset.thumbnail ? (
    <img src={asset.thumbnail} alt="" className={cn(size, 'shrink-0 rounded-lg object-cover')} />
  ) : (
    <span
      className={cn(
        size,
        'flex shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-xs font-bold text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300',
      )}
    >
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Z"
        />
      </svg>
    </span>
  );

const HoldersIcon = () => (
  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z"
    />
  </svg>
);

/** One line of asset facts: id, holders, last paid month, status. */
const AssetMeta = ({ asset }) => (
  <span className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
    <span className="font-mono">#{asset.id}</span>
    <span className="flex items-center gap-1">
      <HoldersIcon />
      {asset.holderCount} holder{asset.holderCount === 1 ? '' : 's'}
    </span>
    {asset.lastDistributedMonth ? (
      // Latest non-cancelled distribution — may still be a draft, so not "paid".
      <span>Latest distribution {formatMonth(asset.lastDistributedMonth)}</span>
    ) : (
      <span>Never distributed</span>
    )}
    {asset.redeemed && <Badge tone="warning">Redeemed</Badge>}
  </span>
);

/**
 * Searchable asset picker: thumbnail, name, id, holder count and last
 * distributed month per option. Keyboard: ↑/↓ to move, Enter to pick, Esc to
 * close.
 */
const AssetPicker = ({ label, assets, value, onChange }) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const rootRef = useRef(null);
  const searchRef = useRef(null);
  const listRef = useRef(null);

  const selected = assets.find((p) => p.id === value);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return assets;
    return assets.filter(
      (p) => (p.assetName || '').toLowerCase().includes(q) || p.id === q.replace(/^#/, ''),
    );
  }, [assets, query]);

  useEffect(() => {
    if (!open) return undefined;
    setActive(Math.max(0, filtered.findIndex((p) => p.id === value)));
    searchRef.current?.focus();
    const onDown = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    listRef.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  const pick = (asset) => {
    onChange(asset.id);
    setOpen(false);
    setQuery('');
  };

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((i) => Math.min(filtered.length - 1, i + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => Math.max(0, i - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered[active]) pick(filtered[active]);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  return (
    <div ref={rootRef} className="relative">
      <span className="mb-1.5 block text-[13px] font-medium text-slate-700 dark:text-slate-300">{label}</span>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={cn(
          'flex min-h-10 w-full cursor-pointer items-center gap-3 rounded-lg border bg-white px-3 py-2 text-left shadow-sm transition-all duration-150 dark:bg-slate-950',
          open
            ? 'border-indigo-500 ring-4 ring-indigo-500/15 dark:border-indigo-400'
            : 'border-slate-300 hover:border-slate-400 dark:border-slate-700 dark:hover:border-slate-600',
        )}
      >
        {selected ? (
          <>
            <Thumb asset={selected} size="h-9 w-9" />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold text-slate-900 dark:text-white">
                {selected.assetName || `Asset #${selected.id}`}
              </span>
              <AssetMeta asset={selected} />
            </span>
          </>
        ) : (
          <span className="flex-1 text-sm text-slate-400">Select an asset…</span>
        )}
        <svg
          className={cn('h-4 w-4 shrink-0 text-slate-400 transition-transform', open && 'rotate-180')}
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {open && (
        <div className="animate-scale-in absolute top-full right-0 left-0 z-40 mt-2 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900">
          <div className="border-b border-slate-100 p-2 dark:border-slate-800">
            <input
              ref={searchRef}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setActive(0);
              }}
              onKeyDown={onKeyDown}
              placeholder="Search by name or #id…"
              className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-indigo-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            />
          </div>
          <ul ref={listRef} role="listbox" className="tf-scroll max-h-80 overflow-y-auto p-1.5">
            {filtered.length === 0 && <li className="px-3 py-6 text-center text-sm text-slate-500">No matching asset</li>}
            {filtered.map((p, i) => (
              <li key={p.id} data-index={i} role="option" aria-selected={p.id === value}>
                <button
                  type="button"
                  onMouseEnter={() => setActive(i)}
                  onClick={() => pick(p)}
                  className={cn(
                    'flex w-full cursor-pointer items-center gap-3 rounded-lg px-2.5 py-2 text-left transition-colors',
                    i === active ? 'bg-indigo-50 dark:bg-indigo-500/10' : 'hover:bg-slate-50 dark:hover:bg-slate-800',
                  )}
                >
                  <Thumb asset={p} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-slate-900 dark:text-white">
                      {p.assetName || `Asset #${p.id}`}
                    </span>
                    <AssetMeta asset={p} />
                  </span>
                  {p.id === value && (
                    <svg className="h-4 w-4 shrink-0 text-indigo-500" viewBox="0 0 20 20" fill="currentColor">
                      <path
                        fillRule="evenodd"
                        d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default AssetPicker;
