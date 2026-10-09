import { useState } from 'react';
import Badge from '../../../components/ui/Badge';
import Skeleton from '../../../components/ui/Skeleton';
import { cn } from '../../../lib/utils';
import ChainLink from './ChainLink';
import { formatDate, formatShares } from '../utils/format';

const COLLAPSED = 6;

const Stat = ({ label, value }) => (
  <div className="min-w-0">
    <p className="text-[11px] font-semibold tracking-wide text-slate-400 uppercase dark:text-slate-500">{label}</p>
    <p className="mt-0.5 truncate text-sm font-semibold text-slate-900 tabular-nums dark:text-white">{value}</p>
  </div>
);

/**
 * Current holders of the selected asset, so the admin can see who the
 * rent will be split between before calculating. Balances are beneficial:
 * shares in an open sell order or unsold in a listing count for their owner.
 */
const HoldersPreview = ({ asset, holders, loading, adminAddress, excludeIssuer }) => {
  const [expanded, setExpanded] = useState(false);
  if (!asset) return null;

  const supply = Number(asset.currentSupply) || 0;
  const issuer = asset.issuer?.toLowerCase();
  const admin = adminAddress?.toLowerCase();
  const shown = expanded ? holders : holders.slice(0, COLLAPSED);
  const investorShares = holders.filter((h) => h.holder !== issuer).reduce((a, h) => a + Number(h.balance), 0);

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
      <div className="grid grid-cols-2 gap-4 border-b border-slate-200 bg-slate-50 px-4 py-3 sm:grid-cols-4 dark:border-slate-700 dark:bg-slate-900">
        <Stat label="Total shares" value={formatShares(asset.totalShares)} />
        <Stat label="In circulation" value={formatShares(asset.currentSupply)} />
        <Stat label="Holders" value={loading ? '…' : holders.length} />
        <Stat
          label="Held by investors"
          value={supply ? `${((investorShares / supply) * 100).toFixed(2)}%` : '—'}
        />
      </div>

      <ul className="divide-y divide-slate-100 dark:divide-slate-800">
        {loading
          ? Array.from({ length: 3 }).map((_, i) => (
              <li key={i} className="px-4 py-3">
                <Skeleton className="h-5 w-full" />
              </li>
            ))
          : shown.map((h, i) => {
              const pct = supply ? (Number(h.balance) / supply) * 100 : 0;
              const isIssuer = h.holder === issuer;
              const isAdmin = h.holder === admin;
              const muted = (isIssuer && excludeIssuer) || isAdmin;
              return (
                <li key={h.holder} className={cn('px-4 py-2.5', muted && 'opacity-60')}>
                  <div className="flex items-center gap-3">
                    <span className="w-5 shrink-0 text-right font-mono text-xs text-slate-400">{i + 1}</span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <ChainLink address={h.holder} />
                        {isIssuer && <Badge tone="brand">Issuer</Badge>}
                        {isAdmin && <Badge tone="info">Your wallet</Badge>}
                        {isIssuer && excludeIssuer && <Badge tone="neutral">Excluded</Badge>}
                      </div>
                      <div className="mt-1.5 flex items-center gap-2">
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500"
                            style={{ width: `${Math.max(pct, 0.5)}%` }}
                          />
                        </div>
                        <span className="w-16 shrink-0 text-right text-xs font-semibold text-slate-600 tabular-nums dark:text-slate-300">
                          {pct < 0.01 ? '<0.01' : pct.toFixed(2)}%
                        </span>
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-sm font-semibold text-slate-900 tabular-nums dark:text-white">
                        {formatShares(h.balance)}
                      </p>
                      <p className="text-[11px] text-slate-400">since {formatDate(h.firstAcquiredAt)}</p>
                    </div>
                  </div>
                </li>
              );
            })}
        {!loading && holders.length === 0 && (
          <li className="px-4 py-6 text-center text-sm text-slate-500">No one holds shares of this asset yet.</li>
        )}
      </ul>

      {!loading && holders.length > COLLAPSED && (
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          className="w-full cursor-pointer border-t border-slate-100 py-2 text-xs font-semibold text-indigo-600 hover:bg-slate-50 dark:border-slate-800 dark:text-indigo-400 dark:hover:bg-slate-800/50"
        >
          {expanded ? 'Show fewer' : `Show all ${holders.length} holders`}
        </button>
      )}
    </div>
  );
};

export default HoldersPreview;
