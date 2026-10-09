import Card from '../../../components/ui/Card';
import { sortStreams, streamLabel } from '../../../config/incomeStreams';
import { cn, formatNumber, formatUsd } from '../../../lib/utils';
import { PhotoBadge, imageOf } from './StationConsole';

/**
 * A station on the marketplace floor: the photo, a pump-style price strip
 * (price per share), how many shares are still on sale and what the station
 * earns from.
 */
const StationTile = ({ asset, listing, onOpen }) => {
  const image = imageOf(asset);
  const price = listing?.price ?? null;
  const total = listing?.total ?? 0;
  const remaining = listing?.remaining ?? 0;
  const soldPct = total > 0 ? ((total - remaining) / total) * 100 : 0;
  const buyBackOnly = listing && !listing.active && listing.buyBack;
  const soldOut = listing && listing.active === false && !listing.buyBack;
  const streams = asset.incomeStreams ? sortStreams(asset.incomeStreams) : [];

  const badge = buyBackOnly
    ? { tone: 'warning', text: 'Buyback open' }
    : soldOut
      ? { tone: 'neutral', text: 'Sold out' }
      : { tone: 'success', text: 'Selling now' };

  return (
    <Card
      hover
      onClick={onOpen}
      className="group flex h-full cursor-pointer flex-col overflow-hidden"
    >
      <div className="relative aspect-[16/10] shrink-0 overflow-hidden bg-slate-100 dark:bg-slate-800">
        {image && (
          <img
            src={image}
            alt={asset.assetName}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.05]"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
        <div className="absolute top-3 left-3">
          <PhotoBadge tone={badge.tone}>{badge.text}</PhotoBadge>
        </div>
        <div className="absolute right-3 bottom-3 left-3 flex items-end justify-between gap-2">
          <span className="rounded-lg bg-black/70 px-2.5 py-1 text-[13px] font-bold text-white tabular-nums backdrop-blur-sm">
            {formatUsd(asset.assetPrice, 0)}
          </span>
          <span className="rounded-md bg-black/60 px-1.5 py-0.5 font-mono text-[10px] text-white/80">#{asset.assetId}</span>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3.5 p-4 sm:p-5">
        <div className="min-w-0">
          <h3 className="truncate text-[15px] font-bold text-slate-900 dark:text-white">{asset.assetName}</h3>
          {asset.locationDetails && (
            <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">{asset.locationDetails.trim()}</p>
          )}
        </div>

        {/* Pump-style price strip */}
        <div className="flex items-center justify-between rounded-xl bg-gradient-to-b from-[#16120c] to-[#0b0906] px-4 py-3 ring-1 ring-black/40">
          <div>
            <p className="font-mono text-[9px] tracking-[0.22em] text-amber-200/50 uppercase">
              {buyBackOnly ? 'Buyback / share' : 'Price / share'}
            </p>
            <p className="mt-1 font-mono text-2xl leading-none font-bold text-amber-300 tabular-nums [text-shadow:0_0_14px_rgba(252,211,77,0.4)]">
              {buyBackOnly && listing.buyBackPrice
                ? `$${formatNumber(listing.buyBackPrice, 2)}`
                : price !== null
                  ? `$${formatNumber(price, 2)}`
                  : '…'}
            </p>
          </div>
          <div className="text-right">
            <p className="font-mono text-[9px] tracking-[0.22em] text-amber-200/50 uppercase">Available</p>
            <p className="mt-1 font-mono text-lg leading-none font-bold text-emerald-300 tabular-nums">
              {listing ? formatNumber(remaining, 0) : '…'}
              <span className="ml-1 text-[10px] text-white/40">sh</span>
            </p>
          </div>
        </div>

        {/* Sold progress */}
        {listing && !buyBackOnly && total > 0 && (
          <div>
            <div className="h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-400 to-emerald-400 transition-[width] duration-700"
                style={{ width: `${Math.max(soldPct, soldPct > 0 ? 2 : 0)}%` }}
              />
            </div>
            <p className="mt-1 flex justify-between text-[10px] text-slate-400 dark:text-slate-500">
              <span>{soldPct < 0.01 && soldPct > 0 ? '<0.01' : formatNumber(soldPct, 2)}% sold</span>
              <span>
                {formatNumber(total - remaining, 0)} of {formatNumber(total, 0)} shares
              </span>
            </p>
          </div>
        )}

        {/* What it earns from */}
        {streams.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {streams.slice(0, 3).map((k) => (
              <span
                key={k}
                className="rounded-full border border-slate-200 px-2 py-0.5 text-[10px] font-medium text-slate-600 dark:border-slate-700 dark:text-slate-300"
              >
                {streamLabel(k)}
              </span>
            ))}
            {streams.length > 3 && (
              <span className="rounded-full px-1.5 py-0.5 text-[10px] font-medium text-slate-400">+{streams.length - 3} more</span>
            )}
          </div>
        )}

        <div className="mt-auto flex items-center justify-between border-t border-slate-100 pt-3 dark:border-slate-800">
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            {buyBackOnly
              ? 'Holders can sell back'
              : price !== null
                ? `Own a slice from $${formatNumber(price, 2)}`
                : ' '}
          </span>
          <span
            className={cn(
              'flex items-center gap-1 text-xs font-semibold text-amber-600 transition-transform group-hover:translate-x-0.5 dark:text-amber-300',
            )}
          >
            View station
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
            </svg>
          </span>
        </div>
      </div>
    </Card>
  );
};

export default StationTile;
