import { useState } from 'react';
import Button from '../../../components/ui/Button';
import Card from '../../../components/ui/Card';
import Input from '../../../components/ui/Input';
import { cn, formatNumber, formatUsd } from '../../../lib/utils';
import { PRICE_TIERS, parseStablePrice } from '../../../utils/units';
import { NftFact, PhotoBadge, Readout, StepRail, imageOf } from './StationConsole';

/**
 * One live listing on the station's price sign: current price, the new
 * price, and what the change means for the shares still on sale.
 */

const STEPS = [{ key: 'update', title: 'Update the price on-chain', detail: 'New price applies to unsold shares only' }];

const pct = (from, to) => (from ? ((to - from) / from) * 100 : 0);

const RepriceConsole = ({ asset, listing, sliceValue, onUpdate }) => {
  const image = imageOf(asset);
  const current = Number(listing.pricePerToken) || 0;
  const [price, setPrice] = useState(current);
  const [custom, setCustom] = useState(''); // typed price; empty when a grade button is used
  const [stage, setStage] = useState(null);

  const customValid = custom === '' || parseStablePrice(custom) !== null;
  const onCustom = (value) => {
    setCustom(value);
    if (parseStablePrice(value) !== null) setPrice(Number(value));
  };

  const unsold = Number(listing.remainingTokens) || 0;
  const total = Number(listing.totalTokens) || 0;
  const sold = Math.max(0, total - unsold);
  const change = pct(current, price);
  const unchanged = price === current;
  const vsSlice = sliceValue ? pct(sliceValue, price) : null;

  const submit = async () => {
    setStage('update');
    try {
      await onUpdate(price);
    } finally {
      setStage(null);
    }
  };

  return (
    <Card className="overflow-hidden">
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
        {/* ── The station */}
        <div className="flex flex-col">
          <div className="relative aspect-[16/10] overflow-hidden bg-slate-100 lg:aspect-auto lg:min-h-[240px] lg:flex-1 dark:bg-slate-800">
            {image && <img src={image} alt={asset.assetName} className="absolute inset-0 h-full w-full object-cover" />}
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />
            <div className="absolute top-3 left-3">
              <PhotoBadge tone={listing.buyBack ? 'warning' : 'info'}>
                {listing.buyBack ? 'Buyback active' : `Live at $${current}/share`}
              </PhotoBadge>
            </div>
            <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
              <p className="font-mono text-[10px] tracking-[0.2em] text-amber-200/80 uppercase">Station #{asset.assetId}</p>
              <h3 className="mt-1 text-lg leading-tight font-bold text-white sm:text-xl">{asset.assetName}</h3>
              {asset.locationDetails && <p className="mt-1 line-clamp-1 text-xs text-white/70">{asset.locationDetails.trim()}</p>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 p-4 sm:p-5">
            <NftFact label="Unsold shares" value={formatNumber(unsold, 0)} />
            <NftFact label="Sold so far" value={formatNumber(sold, 0)} />
          </div>
        </div>

        {/* ── The price sign */}
        <div className="flex flex-col gap-4 border-t border-slate-100 p-4 sm:p-5 lg:border-t-0 lg:border-l dark:border-slate-800">
          <div className="rounded-2xl bg-gradient-to-b from-[#16120c] to-[#0b0906] p-1.5 shadow-inner ring-1 ring-black/40">
            <div className="flex items-center justify-between px-3 pt-2 pb-1">
              <span className="font-mono text-[10px] tracking-[0.25em] text-white/40 uppercase">Price sign</span>
              <span className={cn('h-1.5 w-1.5 rounded-full', stage ? 'animate-pulse bg-amber-400' : 'bg-emerald-400/70')} />
            </div>
            <div className="rounded-xl bg-black/50 px-4 py-1.5">
              <Readout label="Now" value={`$${current}`} />
              <Readout label="New" value={`$${price}`} accent />
              <div className="flex items-end justify-between gap-4 py-2.5">
                <span className="pb-1 font-mono text-[10px] tracking-[0.2em] text-amber-200/50 uppercase">Change</span>
                <span
                  className={cn(
                    'font-mono text-xl leading-none font-bold tabular-nums',
                    unchanged ? 'text-white/40' : change > 0 ? 'text-emerald-300' : 'text-red-300',
                  )}
                >
                  {unchanged ? '—' : `${change > 0 ? '▲ +' : '▼ '}${change.toFixed(0)}%`}
                </span>
              </div>
            </div>
            <p className="px-3 py-2 text-center font-mono text-[10px] text-white/35">
              Unsold shares at new price: {formatUsd(unsold * price, 0)}
            </p>
          </div>

          {listing.buyBack ? (
            <p className="rounded-xl bg-amber-50 p-4 text-[13px] leading-relaxed text-amber-800 dark:bg-amber-500/10 dark:text-amber-200">
              A buyback is active on this listing. Its price was fixed against the current listing price when it was
              funded, so the price can’t change until the buyback settles.
            </p>
          ) : (
            <>
              <div>
                <p className="mb-2 text-[13px] font-medium text-slate-700 dark:text-slate-300">New price per share</p>
                <div role="radiogroup" aria-label="New price per share" className="grid grid-cols-5 gap-1.5">
                  {PRICE_TIERS.map((t) => {
                    const active = custom === '' && price === t;
                    const isCurrent = current === t;
                    return (
                      <button
                        key={t}
                        type="button"
                        role="radio"
                        aria-checked={active}
                        disabled={Boolean(stage)}
                        onClick={() => {
                          setPrice(t);
                          setCustom('');
                        }}
                        className={cn(
                          'relative cursor-pointer rounded-lg border py-2 text-sm font-bold tabular-nums transition-all disabled:cursor-not-allowed disabled:opacity-60',
                          active
                            ? 'border-amber-400 bg-amber-400/15 text-amber-600 shadow-[0_0_0_1px_rgba(251,191,36,0.5)] dark:text-amber-300'
                            : 'border-slate-200 text-slate-700 hover:border-amber-300 dark:border-slate-700 dark:text-slate-200 dark:hover:border-amber-400/60',
                        )}
                      >
                        ${t}
                        {isCurrent && (
                          <span className="absolute -top-1.5 right-1 rounded bg-slate-700 px-1 text-[8px] font-semibold tracking-wide text-white uppercase">
                            now
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
                <div className="mt-2.5">
                  <Input
                    label="Or enter a price"
                    prefix="$"
                    inputMode="decimal"
                    placeholder="e.g. 57.50"
                    value={custom}
                    disabled={Boolean(stage)}
                    onChange={(e) => onCustom(e.target.value.trim())}
                    error={customValid ? undefined : 'Enter a price above 0, with at most 6 decimals.'}
                  />
                </div>
              </div>

              {vsSlice !== null && (
                <p
                  className={cn(
                    'rounded-lg px-3 py-2 text-[11px] leading-snug',
                    Math.abs(vsSlice) < 0.5
                      ? 'bg-slate-50 text-slate-500 dark:bg-slate-800/50 dark:text-slate-400'
                      : 'bg-amber-50 text-amber-800 dark:bg-amber-500/10 dark:text-amber-200',
                  )}
                >
                  Slice size is ${formatNumber(sliceValue, 2)} (station value ÷ shares).{' '}
                  {Math.abs(vsSlice) < 0.5
                    ? 'At this price the shares together equal the station’s value.'
                    : `$${price} is a ${Math.abs(vsSlice).toFixed(0)}% ${vsSlice > 0 ? 'premium on' : 'discount to'} the station’s value.`}
                </p>
              )}

              <StepRail stage={stage} steps={STEPS} />

              <Button fullWidth loading={Boolean(stage)} disabled={Boolean(stage) || unchanged || !customValid} onClick={submit}>
                {stage ? 'Updating…' : unchanged ? 'Pick a new price' : `Change price $${current} → $${price}`}
              </Button>
              <p className="text-center text-[11px] text-slate-400 dark:text-slate-500">
                Applies to the {formatNumber(unsold, 0)} shares still on sale — shares already bought are unaffected.
              </p>
            </>
          )}
        </div>
      </div>
    </Card>
  );
};

export default RepriceConsole;
