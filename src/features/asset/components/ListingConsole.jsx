import Button from '../../../components/ui/Button';
import Card from '../../../components/ui/Card';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import { cn, formatNumber, formatUsd, shortenAddress } from '../../../lib/utils';
import { NftFact, PhotoBadge, Readout, StepRail, imageOf } from './StationConsole';
import { addShareTokenToWallet, tokenUrl } from './RedeemConsole';

/**
 * One fractionalized station whose shares can go on sale — a "listing
 * board": price per share, how many shares go on sale, what that sale is
 * worth, and how much of the owner's stake stays with them.
 */

export const LISTING_STEPS = [
  { key: 'approve', title: 'Approve your shares', detail: 'Lets the marketplace hold the shares on sale' },
  { key: 'list', title: 'Go live', detail: 'Shares are on sale to verified investors' },
];

const QUICK = [
  { label: '25%', f: 0.25 },
  { label: '50%', f: 0.5 },
  { label: '75%', f: 0.75 },
  { label: 'All', f: 1 },
];

/**
 * The chosen price per share against the slice size (station value ÷ shares).
 * At the slice size the shares add up to the station's value exactly; any
 * other price is a premium or discount on it.
 */
const PriceVsSlice = ({ price, sliceValue }) => {
  if (!sliceValue || !price) return null;
  const diff = ((price - sliceValue) / sliceValue) * 100;
  const same = Math.abs(diff) < 0.005;
  return (
    <p
      className={cn(
        'rounded-lg px-3 py-2 text-[11px] leading-snug',
        same
          ? 'bg-slate-50 text-slate-500 dark:bg-slate-800/50 dark:text-slate-400'
          : 'bg-amber-50 text-amber-800 dark:bg-amber-500/10 dark:text-amber-200',
      )}
    >
      Slice size is ${sliceValue} (station value ÷ shares).{' '}
      {same
        ? 'At this price your shares together equal the station’s value.'
        : `$${price} is a ${Math.abs(diff).toFixed(0)}% ${diff > 0 ? 'premium on' : 'discount to'} the station’s value.`}
    </p>
  );
};

/** What goes on sale vs. what the owner keeps, as one bar. */
const SplitGauge = ({ listing, balance }) => {
  const pct = balance > 0 ? Math.min(100, (listing / balance) * 100) : 0;
  return (
    <div>
      <div className="flex h-3 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800" role="img" aria-label={`Listing ${pct.toFixed(1)}% of your shares`}>
        <div className="h-full bg-gradient-to-r from-amber-400 to-amber-300 transition-[width] duration-500" style={{ width: `${pct}%` }} />
        {pct < 100 && <div className="h-full flex-1 bg-emerald-500/60" />}
      </div>
      <div className="mt-1.5 flex justify-between text-[10px] text-slate-400 dark:text-slate-500">
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-amber-400" /> On sale · {formatNumber(listing, 0)}
        </span>
        <span className="flex items-center gap-1">
          You keep · {formatNumber(Math.max(0, balance - listing), 0)} <span className="h-2 w-2 rounded-full bg-emerald-500/60" />
        </span>
      </div>
    </div>
  );
};

const ListingConsole = ({
  asset,
  balance,
  shareToken,
  price,
  sliceValue,
  priceOptions,
  onPickPrice,
  listedPrice,
  blocked,
  amount,
  onAmount,
  onList,
  stage,
  done,
  onWithdraw,
  onView,
}) => {
  const image = imageOf(asset);
  const bal = Number(balance) || 0;
  const amt = /^\d+$/.test(String(amount ?? '')) ? Math.min(Number(amount), Number.MAX_SAFE_INTEGER) : 0;
  const perShare = Number(listedPrice || price) || 0;
  const busy = Boolean(stage) && stage !== 'done';
  const tooMany = amt > bal;

  const badge = done
    ? { tone: 'success', text: 'Live on marketplace' }
    : blocked
      ? { tone: 'warning', text: 'Buyback still open' }
      : listedPrice
        ? { tone: 'info', text: `Listed at $${listedPrice}/share` }
        : { tone: 'warning', text: 'Ready to list' };

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
          <div className="flex flex-col gap-3 p-4 sm:p-5">
            <div className="grid grid-cols-[minmax(0,0.6fr)_minmax(0,1.4fr)] gap-3">
              <NftFact label="Your shares" value={formatNumber(bal, 0)} />
              <NftFact label="Share token" value={shareToken ? shortenAddress(shareToken, 6, 4) : '—'} copy={shareToken} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Button
                fullWidth
                variant="secondary"
                disabled={!shareToken}
                onClick={() => addShareTokenToWallet(shareToken, asset.assetName)}
              >
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
        </div>

        {/* ── The listing board */}
        <div className="flex flex-col gap-4 border-t border-slate-100 p-4 sm:p-5 lg:border-t-0 lg:border-l dark:border-slate-800">
          <div className="rounded-2xl bg-gradient-to-b from-[#16120c] to-[#0b0906] p-1.5 shadow-inner ring-1 ring-black/40">
            <div className="flex items-center justify-between px-3 pt-2 pb-1">
              <span className="font-mono text-[10px] tracking-[0.25em] text-white/40 uppercase">Listing board</span>
              <span className={cn('h-1.5 w-1.5 rounded-full', busy ? 'animate-pulse bg-amber-400' : done ? 'bg-emerald-400' : 'bg-emerald-400/70')} />
            </div>
            <div className="rounded-xl bg-black/50 px-4 py-1.5">
              <Readout label="Price / share" value={perShare ? `$${perShare}` : '—'} accent />
              <Readout
                label={done ? 'Shares on sale' : 'Shares to list'}
                value={formatNumber(done ? Number(done.remainingTokens) : amt, 0)}
                unit="sh"
              />
              <Readout
                label="Listing value"
                value={formatUsd((done ? Number(done.remainingTokens) : amt) * perShare, 0)}
              />
            </div>
            <p className="px-3 py-2 text-center font-mono text-[10px] text-white/35">Buyers pay in USDC · shares are whole units</p>
          </div>

          {done ? (
            <div className="space-y-3">
              <StepRail stage="done" steps={LISTING_STEPS} />
              <div className="rounded-xl border border-emerald-200/70 bg-emerald-50/60 p-3.5 text-xs dark:border-emerald-900/60 dark:bg-emerald-950/30">
                <p className="font-semibold text-emerald-800 dark:text-emerald-200">
                  {formatNumber(done.remainingTokens)} shares are live at ${done.pricePerToken} each
                </p>
                <p className="mt-1 leading-relaxed text-emerald-700/80 dark:text-emerald-300/70">
                  Verified investors can now buy them on the marketplace. Unsold shares stay yours.
                </p>
              </div>
              {onView && (
                <Button fullWidth onClick={onView}>
                  View the listing
                </Button>
              )}
            </div>
          ) : blocked ? (
            <div className="space-y-3 rounded-xl bg-amber-50 p-4 text-[13px] leading-relaxed text-amber-800 dark:bg-amber-500/10 dark:text-amber-200">
              <p>
                A buyback from this station’s last listing is still open. Investors can still sell their shares back to
                you, so it has to be withdrawn before you can list again.
              </p>
              <Button fullWidth variant="secondary" onClick={onWithdraw}>
                Go to Withdraw Buyback
              </Button>
            </div>
          ) : (
            <>
              <div>
                <Input
                  label={listedPrice ? 'Shares to add to the listing' : 'Shares to list'}
                  inputMode="numeric"
                  placeholder={bal ? `Up to ${formatNumber(bal, 0)}` : '0'}
                  value={amount ?? ''}
                  disabled={busy || !bal}
                  onChange={(e) => onAmount(e.target.value.trim())}
                  error={tooMany ? `You only hold ${formatNumber(bal, 0)} shares.` : undefined}
                />
                <div className="mt-2 grid grid-cols-4 gap-1.5">
                  {QUICK.map((q) => (
                    <button
                      key={q.label}
                      type="button"
                      disabled={busy || !bal}
                      onClick={() => onAmount(String(Math.max(1, Math.floor(bal * q.f))))}
                      className="cursor-pointer rounded-lg border border-slate-200 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:border-amber-300 hover:text-amber-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:border-amber-400/60 dark:hover:text-amber-300"
                    >
                      {q.label}
                    </button>
                  ))}
                </div>
              </div>

              <SplitGauge listing={Math.min(amt, bal)} balance={bal} />

              {listedPrice ? (
                <p className="rounded-lg bg-sky-50 px-3 py-2 text-[11px] leading-snug text-sky-800 dark:bg-sky-500/10 dark:text-sky-200">
                  This station is already on the marketplace at ${listedPrice} per share — these shares are added to that
                  listing at the same price.
                </p>
              ) : (
                <div className="space-y-2">
                  <Select label="Price per share (USDC)" value={price} disabled={busy} onChange={(e) => onPickPrice(e.target.value)}>
                    {priceOptions.map((tier) => (
                      <option key={tier} value={tier}>
                        ${tier}
                        {Number(sliceValue) === tier ? ' — slice size' : ''}
                      </option>
                    ))}
                  </Select>
                  <PriceVsSlice price={Number(price)} sliceValue={Number(sliceValue)} />
                </div>
              )}

              <StepRail stage={stage} steps={LISTING_STEPS} />

              <Button fullWidth loading={busy} disabled={busy || !bal || !amt || tooMany} onClick={onList}>
                {busy
                  ? 'Listing…'
                  : amt
                    ? `${listedPrice ? 'Add' : 'List'} ${formatNumber(amt, 0)} shares · ${formatUsd(amt * perShare, 0)}`
                    : listedPrice
                      ? 'Add to listing'
                      : 'List shares'}
              </Button>
            </>
          )}
        </div>
      </div>
    </Card>
  );
};

export default ListingConsole;
