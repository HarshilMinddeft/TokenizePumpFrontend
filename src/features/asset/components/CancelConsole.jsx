import Button from '../../../components/ui/Button';
import Card from '../../../components/ui/Card';
import Input from '../../../components/ui/Input';
import { cn, formatNumber, formatUsd, shortenAddress } from '../../../lib/utils';
import { NftFact, PhotoBadge, Readout, StepRail, imageOf } from './StationConsole';
import { addShareTokenToWallet, tokenUrl } from './RedeemConsole';

/**
 * One live listing the owner can take down — a "delist console": what's on
 * sale, what comes back to the owner, what investors keep, and (when
 * investors hold shares) the buyback the owner must fund so they can sell
 * back.
 */

const STEPS_WITH_BUYBACK = [
  { key: 'approve', title: 'Approve USDC deposit', detail: 'Escrow for investors who sell back' },
  { key: 'cancel', title: 'Delist & open buyback', detail: 'Unsold shares return to you' },
];
const STEPS_PLAIN = [{ key: 'cancel', title: 'Delist & return shares', detail: 'Unsold shares come back to your wallet' }];

const PREMIUMS = [
  { label: '+10%', f: 1.1 },
  { label: '+15%', f: 1.15 },
  { label: '+25%', f: 1.25 },
];

const formatDeadline = (timestamp) =>
  new Date(Number(timestamp) * 1000).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });

/** Unsold shares that come back vs. shares investors keep, as one bar. */
const ReturnGauge = ({ unsold, outstanding }) => {
  const total = unsold + outstanding;
  const pct = total > 0 ? (unsold / total) * 100 : 0;
  return (
    <div>
      <div className="flex items-baseline justify-between text-[11px]">
        <span className="font-semibold text-slate-600 dark:text-slate-300">After delisting</span>
      </div>
      <div className="mt-1.5 flex h-3 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800" role="img" aria-label={`${pct.toFixed(1)}% of listed shares return to you`}>
        <div className="h-full bg-gradient-to-r from-amber-400 to-amber-300 transition-[width] duration-500" style={{ width: `${pct}%` }} />
        {pct < 100 && <div className="h-full flex-1 bg-sky-400/70" />}
      </div>
      <div className="mt-1.5 flex justify-between text-[10px] text-slate-400 dark:text-slate-500">
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-amber-400" /> Back to you · {formatNumber(unsold, 0)}
        </span>
        <span className="flex items-center gap-1">
          Investors keep · {formatNumber(outstanding, 0)} <span className="h-2 w-2 rounded-full bg-sky-400/70" />
        </span>
      </div>
    </div>
  );
};

const CancelConsole = ({
  asset,
  isOwner,
  balance,
  shareToken,
  symbol,
  listed,
  unsold,
  outstanding,
  listingPrice,
  minBuyBackPrice,
  locked,
  deadline,
  buyBackPrice,
  onBuyBackPrice,
  onCancel,
  stage,
  done,
  onWithdraw,
}) => {
  const image = imageOf(asset);
  const busy = Boolean(stage) && stage !== 'done';
  const needsBuyBack = outstanding > 0;
  const price = Number(buyBackPrice) || 0;
  const tooLow = needsBuyBack && buyBackPrice !== '' && price < minBuyBackPrice;
  const deposit = needsBuyBack && price > 0 ? outstanding * price : 0;

  const badge = done
    ? { tone: 'success', text: done.buyBackActivated ? 'Delisted · buyback open' : 'Delisted' }
    : !isOwner
      ? { tone: 'neutral', text: 'Listed by another wallet' }
      : locked
        ? { tone: 'warning', text: 'Buyback still open' }
        : { tone: 'info', text: `Live at $${listingPrice}/share` };

  return (
    <Card className="overflow-hidden">
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
        {/* ── The station */}
        <div className="flex flex-col">
          <div className="relative aspect-[16/10] overflow-hidden bg-slate-100 lg:aspect-auto lg:min-h-[260px] lg:flex-1 dark:bg-slate-800">
            {image && <img src={image} alt={asset.assetName} className="absolute inset-0 h-full w-full object-cover" />}
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />
            <div className="absolute top-3 left-3">
              <PhotoBadge tone={badge.tone}>{badge.text}</PhotoBadge>
            </div>
            <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
              <p className="font-mono text-[10px] tracking-[0.2em] text-amber-200/80 uppercase">Station #{asset.assetId}</p>
              <h3 className="mt-1 text-lg leading-tight font-bold text-white sm:text-xl">{asset.assetName}</h3>
              {asset.locationDetails && <p className="mt-1 line-clamp-1 text-xs text-white/70">{asset.locationDetails.trim()}</p>}
            </div>
          </div>
          {isOwner && (
            <div className="flex flex-col gap-3 p-4 sm:p-5">
              <div className="grid grid-cols-[minmax(0,0.6fr)_minmax(0,1.4fr)] gap-3">
                <NftFact label="Your shares" value={formatNumber(Number(balance) || 0, 0)} />
                <NftFact label="Share token" value={shareToken ? shortenAddress(shareToken, 6, 4) : '—'} copy={shareToken} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Button fullWidth variant="secondary" disabled={!shareToken} onClick={() => addShareTokenToWallet(shareToken, symbol)}>
                  Add token to wallet
                </Button>
                <Button
                  fullWidth
                  variant="soft"
                  disabled={!shareToken}
                  onClick={() => window.open(tokenUrl(shareToken), '_blank', 'noopener,noreferrer')}
                >
                  See token ↗
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* ── The delist console */}
        <div className="flex flex-col gap-4 border-t border-slate-100 p-4 sm:p-5 lg:border-t-0 lg:border-l dark:border-slate-800">
          <div className="rounded-2xl bg-gradient-to-b from-[#16120c] to-[#0b0906] p-1.5 shadow-inner ring-1 ring-black/40">
            <div className="flex items-center justify-between px-3 pt-2 pb-1">
              <span className="font-mono text-[10px] tracking-[0.25em] text-white/40 uppercase">Delist console</span>
              <span className={cn('h-1.5 w-1.5 rounded-full', busy ? 'animate-pulse bg-amber-400' : done ? 'bg-emerald-400' : 'bg-red-400/80')} />
            </div>
            <div className="rounded-xl bg-black/50 px-4 py-1.5">
              <Readout label="Listed at" value={listingPrice ? `$${listingPrice}` : '—'} accent />
              <Readout label="Unsold · back to you" value={formatNumber(unsold, 0)} unit="sh" />
              <Readout label="Held by investors" value={formatNumber(outstanding, 0)} unit="sh" />
            </div>
            <p className="px-3 py-2 text-center font-mono text-[10px] text-white/35">{formatNumber(listed, 0)} shares listed in total</p>
          </div>

          {done ? (
            <div className="space-y-3">
              <StepRail stage="done" steps={done.buyBackActivated ? STEPS_WITH_BUYBACK : STEPS_PLAIN} />
              <div className="rounded-xl border border-emerald-200/70 bg-emerald-50/60 p-3.5 text-xs dark:border-emerald-900/60 dark:bg-emerald-950/30">
                <p className="font-semibold text-emerald-800 dark:text-emerald-200">Listing closed</p>
                <p className="mt-1 leading-relaxed text-emerald-700/80 dark:text-emerald-300/70">
                  {done.buyBackActivated
                    ? 'Unsold shares are back in your wallet, and investors can now sell their shares back to you from the escrowed USDC.'
                    : 'Unsold shares are back in your wallet. You can relist, or reclaim the station on Redeem Asset.'}
                </p>
                {done.buyBackActivated && done.buyBackDeadline && (
                  <p className="mt-2 flex items-center justify-between rounded-lg bg-white/60 px-3 py-2 font-semibold text-emerald-800 dark:bg-slate-900/40 dark:text-emerald-300">
                    <span>Leftover escrow withdrawable from</span>
                    <span className="tabular-nums">{formatDeadline(done.buyBackDeadline)}</span>
                  </p>
                )}
              </div>
              {done.buyBackActivated && (
                <Button fullWidth variant="secondary" onClick={onWithdraw}>
                  Go to Withdraw Buyback
                </Button>
              )}
            </div>
          ) : !isOwner ? (
            <p className="rounded-xl bg-slate-50 px-4 py-6 text-center text-[13px] text-slate-500 dark:bg-slate-800/50 dark:text-slate-400">
              This station was listed by another wallet — only the listing owner can delist it.
            </p>
          ) : locked ? (
            <div className="space-y-3 rounded-xl bg-amber-50 p-4 text-[13px] leading-relaxed text-amber-800 dark:bg-amber-500/10 dark:text-amber-200">
              <p>
                A funded buyback is still open. Investors can sell back until the claim window closes; after that,
                withdraw the leftover escrow and you can delist again.
              </p>
              {deadline && (
                <p className="flex items-center justify-between rounded-lg bg-white/60 px-3 py-2 font-semibold dark:bg-slate-900/40">
                  <span>Withdrawable from</span>
                  <span className="tabular-nums">{formatDeadline(deadline)}</span>
                </p>
              )}
              <Button fullWidth variant="secondary" onClick={onWithdraw}>
                Go to Withdraw Buyback
              </Button>
            </div>
          ) : (
            <>
              <ReturnGauge unsold={unsold} outstanding={outstanding} />

              {needsBuyBack ? (
                <div className="space-y-2.5 rounded-xl border border-amber-200 bg-amber-50/60 p-3.5 dark:border-amber-900/60 dark:bg-amber-950/20">
                  <p className="text-[12px] leading-relaxed text-amber-800 dark:text-amber-200">
                    Investors hold {formatNumber(outstanding, 0)} shares. To delist you must offer to buy them back —
                    at least 10% above the ${listingPrice} listing price. The full amount is escrowed in USDC up front.
                  </p>
                  <Input
                    label="Buyback price per share (USDC)"
                    inputMode="decimal"
                    prefix="$"
                    placeholder={`Min ${minBuyBackPrice.toFixed(2)}`}
                    value={buyBackPrice}
                    disabled={busy}
                    onChange={(e) => onBuyBackPrice(e.target.value.trim())}
                    error={tooLow ? `At least $${minBuyBackPrice.toFixed(2)} (10% above $${listingPrice})` : undefined}
                  />
                  <div className="grid grid-cols-3 gap-1.5">
                    {PREMIUMS.map((p) => (
                      <button
                        key={p.label}
                        type="button"
                        disabled={busy}
                        onClick={() => onBuyBackPrice((Math.ceil(listingPrice * p.f * 100) / 100).toFixed(2))}
                        className="cursor-pointer rounded-lg border border-amber-200 bg-white/60 py-1.5 text-xs font-semibold text-amber-800 transition-colors hover:border-amber-400 disabled:cursor-not-allowed disabled:opacity-50 dark:border-amber-900/60 dark:bg-slate-900/40 dark:text-amber-200"
                      >
                        {p.label} · ${(Math.ceil(listingPrice * p.f * 100) / 100).toFixed(2)}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-white/70 px-3 py-2 text-[12.5px] dark:bg-slate-900/50">
                    <span className="font-medium text-amber-800 dark:text-amber-300">USDC escrowed from your wallet</span>
                    <span className="font-bold text-amber-900 tabular-nums dark:text-amber-200">
                      {deposit ? formatUsd(deposit) : '—'}
                    </span>
                  </div>
                </div>
              ) : (
                <p className="rounded-lg bg-emerald-50 px-3 py-2 text-[11px] leading-snug text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-200">
                  No investor holds a share from this listing, so no buyback or USDC is needed — delisting just returns
                  your unsold shares.
                </p>
              )}

              <StepRail stage={stage} steps={needsBuyBack ? STEPS_WITH_BUYBACK : STEPS_PLAIN} />

              <Button
                fullWidth
                variant="danger"
                loading={busy}
                disabled={busy || (needsBuyBack && !(price >= minBuyBackPrice))}
                onClick={onCancel}
              >
                {busy
                  ? 'Delisting…'
                  : needsBuyBack
                    ? `Escrow ${deposit ? formatUsd(deposit) : 'USDC'} & delist`
                    : `Delist & return ${formatNumber(unsold, 0)} shares`}
              </Button>
            </>
          )}
        </div>
      </div>
    </Card>
  );
};

export default CancelConsole;
