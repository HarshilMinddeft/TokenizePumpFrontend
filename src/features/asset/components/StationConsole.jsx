import Button from '../../../components/ui/Button';
import Card from '../../../components/ui/Card';
import { toast } from 'react-toastify';
import contractsConfig from '../../../config/contracts.config';
import envConfig from '../../../config/env.config';
import web3Service from '../../../services/web3Service';
import { cn, formatNumber, formatUsd, shortenAddress } from '../../../lib/utils';
import { PRICE_STEP } from '../../../utils/units';

/**
 * One fuel station, ready to be split into shares — laid out like the pump
 * it represents: a dispenser readout (slice size ≈ price per litre,
 * shares ≈ litres, value ≈ total) and grade buttons to pick the slice size.
 */

export const FRACTIONALIZE_STEPS = [
  { key: 'approve', title: 'Approve the station NFT', detail: 'Lets the vault take custody of the NFT' },
  { key: 'lock', title: 'Lock it in the vault', detail: 'The NFT is held while shares exist' },
  { key: 'mint', title: 'Mint the share token', detail: 'Compliant ERC-3643 shares to your wallet' },
];

const PHOTO_BADGE_TONES = {
  success: { dot: 'bg-emerald-400', text: 'text-emerald-300' },
  warning: { dot: 'bg-amber-400', text: 'text-amber-300' },
  info: { dot: 'bg-sky-400', text: 'text-sky-300' },
  danger: { dot: 'bg-red-400', text: 'text-red-300' },
  neutral: { dot: 'bg-slate-300', text: 'text-slate-100' },
};

/**
 * Status pill for use on top of a photo: solid dark backdrop so it stays
 * readable over bright skies (the regular Badge tints are see-through).
 */
export const PhotoBadge = ({ tone = 'neutral', children }) => {
  const t = PHOTO_BADGE_TONES[tone] ?? PHOTO_BADGE_TONES.neutral;
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-black/75 px-2.5 py-1 text-[11px] font-semibold tracking-wide uppercase shadow-sm ring-1 ring-white/10 backdrop-blur-sm">
      <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', t.dot)} />
      <span className={t.text}>{children}</span>
    </span>
  );
};

export const imageOf =(asset) => asset.assetThumbImages?.[0] || asset.assetImages?.[0];


/** One row of the dispenser's display — big digits, small caption. */
export const Readout = ({ label, value, unit, accent = false }) => (
  <div className="flex items-end justify-between gap-4 border-b border-white/5 py-2.5 last:border-0">
    <span className="pb-1 font-mono text-[10px] tracking-[0.2em] text-amber-200/50 uppercase">{label}</span>
    <span
      className={cn(
        'font-mono text-2xl leading-none font-bold tabular-nums sm:text-[28px]',
        accent ? 'text-amber-300 [text-shadow:0_0_14px_rgba(252,211,77,0.45)]' : 'text-emerald-300 [text-shadow:0_0_14px_rgba(110,231,183,0.35)]',
      )}
    >
      {value}
      {unit && <span className="ml-1.5 text-xs font-semibold text-white/40">{unit}</span>}
    </span>
  </div>
);

export const StepRail = ({ stage, steps = FRACTIONALIZE_STEPS }) => {
  const at = steps.findIndex((s) => s.key === stage);
  return (
    <ol className="grid grid-cols-3 gap-2">
      {steps.map((s, i) => {
        const done = stage === 'done' || (at > -1 && i < at);
        const running = i === at;
        return (
          <li
            key={s.key}
            className={cn(
              'rounded-lg border px-2.5 py-2 text-left transition-colors',
              done
                ? 'border-emerald-500/40 bg-emerald-500/10'
                : running
                  ? 'border-amber-400/60 bg-amber-400/10'
                  : 'border-slate-200 dark:border-slate-700/80',
            )}
          >
            <p className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-700 dark:text-slate-200">
              <span
                className={cn(
                  'flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[9px] font-bold',
                  done ? 'bg-emerald-500 text-white' : running ? 'bg-amber-400 text-[#1a140e]' : 'bg-slate-200 text-slate-500 dark:bg-slate-700 dark:text-slate-300',
                )}
              >
                {done ? '✓' : running ? <span className="h-2 w-2 animate-spin rounded-full border border-current border-t-transparent" /> : i + 1}
              </span>
              {s.title}
            </p>
            <p className="mt-0.5 text-[10px] leading-snug text-slate-400 dark:text-slate-500">{s.detail}</p>
          </li>
        );
      })}
    </ol>
  );
};

const StationConsole = ({ asset, tiers, sliceValue, onPick, onFractionalize, stage, result, onList }) => {
  const image = imageOf(asset);
  const price = Number(asset.assetPrice) || 0;
  const perShare = Number(sliceValue) || 0;
  const shares = perShare > 0 ? Math.floor(price / perShare) : 0;
  const busy = stage && stage !== 'done';

  return (
    <Card className="overflow-hidden">
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
        {/* ── The station */}
        <div className="flex flex-col">
          <div className="relative aspect-[16/10] overflow-hidden bg-slate-100 lg:aspect-auto lg:min-h-[260px] lg:flex-1 dark:bg-slate-800">
            {image && <img src={image} alt={asset.assetName} className="absolute inset-0 h-full w-full object-cover" />}
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />
            <div className="absolute top-3 left-3 flex gap-2">
            </div>
            <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
              <p className="font-mono text-[10px] tracking-[0.2em] text-amber-200/80 uppercase">Station #{asset.assetId}</p>
              <h3 className="mt-1 text-lg leading-tight font-bold text-white sm:text-xl">{asset.assetName}</h3>
              {asset.locationDetails && <p className="mt-1 line-clamp-1 text-xs text-white/70">{asset.locationDetails.trim()}</p>}
            </div>
          </div>
          <div className="flex flex-col gap-3 p-4 sm:p-5">
            <div className="grid grid-cols-[minmax(0,0.6fr)_minmax(0,1.4fr)] gap-3">
              <NftFact label="NFT ID" value={`#${asset.assetId}`} />
              <NftFact
                label="NFT address"
                value={shortenAddress(contractsConfig.assetNft.address, 6, 4)}
                copy={contractsConfig.assetNft.address}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Button fullWidth variant="secondary" onClick={() => addNftToWallet(asset.assetId)}>
                Add to wallet
              </Button>
              <Button
                fullWidth
                variant="soft"
                onClick={() => window.open(nftUrl(asset.assetId), '_blank', 'noopener,noreferrer')}
              >
                See NFT ↗
              </Button>
            </div>
          </div>
        </div>

        {/* ── The dispenser */}
        <div className="flex flex-col gap-4 border-t border-slate-100 p-4 sm:p-5 lg:border-t-0 lg:border-l dark:border-slate-800">
          <div className="rounded-2xl bg-gradient-to-b from-[#16120c] to-[#0b0906] p-1.5 shadow-inner ring-1 ring-black/40">
            <div className="flex items-center justify-between px-3 pt-2 pb-1">
              <span className="font-mono text-[10px] tracking-[0.25em] text-white/40 uppercase">Share dispenser</span>
              <span className={cn('h-1.5 w-1.5 rounded-full', busy ? 'animate-pulse bg-amber-400' : result ? 'bg-emerald-400' : 'bg-emerald-400/70')} />
            </div>
            <div className="rounded-xl bg-black/50 px-4 py-1.5">
              <Readout label="Total value" value={formatUsd(price, 0)} accent />
              <Readout label="Shares" value={formatNumber(result ? Number(result.totalShares) : shares, 0)} unit="sh" />
              <Readout label="Slice size" value={perShare ? String(perShare) : '—'} />
            </div>
            <p className="px-3 py-2 text-center font-mono text-[10px] text-white/35">
              1 share = {shares ? `${(100 / shares).toPrecision(2)}%` : '—'} of the station
            </p>
          </div>

          {result ? (
            <div className="space-y-3">
              <StepRail stage="done" />
              <div className="rounded-xl border border-emerald-200/70 bg-emerald-50/60 p-3.5 text-xs dark:border-emerald-900/60 dark:bg-emerald-950/30">
                <p className="font-semibold text-emerald-800 dark:text-emerald-200">
                  {formatNumber(result.totalShares)} shares minted to your wallet
                </p>
                <p className="mt-1 font-mono text-[11px] break-all text-emerald-700/80 dark:text-emerald-300/70">
                  Share token {shortenAddress(result.shareToken, 10, 6)}
                </p>
              </div>
              {onList && (
                <Button fullWidth onClick={onList}>
                  List shares on the marketplace
                </Button>
              )}
            </div>
          ) : tiers.length === 0 ? (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600 dark:bg-red-500/10 dark:text-red-300">
              No ${PRICE_STEP}-multiple slice size divides {formatUsd(price, 0)} evenly, so this station can’t be split
              into whole shares.
            </p>
          ) : (
            <>
              <div>
                <p className="mb-2 text-[13px] font-medium text-slate-700 dark:text-slate-300">Choose a slice size (value per share)</p>
                <div role="radiogroup" aria-label="Slice size" className="grid grid-cols-5 gap-1.5">
                  {tiers.map((t) => {
                    const active = Number(sliceValue) === t;
                    return (
                      <button
                        key={t}
                        type="button"
                        role="radio"
                        aria-checked={active}
                        disabled={busy}
                        onClick={() => onPick(String(t))}
                        className={cn(
                          'flex cursor-pointer flex-col items-center rounded-lg border px-1 py-1.5 transition-all disabled:cursor-not-allowed disabled:opacity-60',
                          active
                            ? 'border-amber-400 bg-amber-400/15 shadow-[0_0_0_1px_rgba(251,191,36,0.5)]'
                            : 'border-slate-200 hover:border-amber-300 dark:border-slate-700 dark:hover:border-amber-400/60',
                        )}
                      >
                        <span className={cn('text-sm font-bold tabular-nums', active ? 'text-amber-600 dark:text-amber-300' : 'text-slate-700 dark:text-slate-200')}>
                          {t}
                        </span>
                      </button>
                    );
                  })}
                </div>
                <div className="mt-2 space-y-1 rounded-lg bg-slate-50 px-3 py-2 text-[11px] leading-snug text-slate-500 dark:bg-slate-800/50 dark:text-slate-400">
                  <p className="font-mono text-slate-700 tabular-nums dark:text-slate-200">
                    {formatUsd(price, 0)} ÷ {perShare || '—'} = {formatNumber(shares, 0)} shares
                  </p>
                  <p>
                    The slice size is how much of the station’s value one share represents. Shares are whole units (no
                    decimals), so only slices from {PRICE_STEP} to {PRICE_STEP * 10} that divide the value exactly
                    are offered — nothing is lost to rounding.
                  </p>
                  <p>
                    It is not a sale price: you set the price per share when you list on the marketplace (it starts at
                    the slice size). Smaller slice = more, smaller shares — easier for investors to buy in.
                  </p>
                </div>
              </div>

              <StepRail stage={stage} />

              <Button fullWidth loading={busy} disabled={shares === 0 || busy} onClick={onFractionalize}>
                {busy ? 'Fractionalizing…' : `Fractionalize into ${formatNumber(shares, 0)} shares`}
              </Button>
            </>
          )}
        </div>
      </div>
    </Card>
  );
};

/**
 * Click to add the station NFT to the connected wallet (MetaMask shows an
 * "Add NFT" prompt). Wallets without that feature get the address + ID
 * copied instead, with how to import it by hand.
 */
export const addNftToWallet = async (tokenId) => {
  const address = contractsConfig.assetNft.address;
  try {
    const added = await web3Service.watchNft(address, tokenId);
    if (added) toast.success(`Station NFT #${tokenId} added to your wallet`);
    else toast.info('Not added — you can import it any time.');
  } catch (err) {
    if (err?.code === 4001) return toast.info('Not added — you can import it any time.');
    try {
      await navigator.clipboard.writeText(`${address} ${tokenId}`);
    } catch {
      // Clipboard blocked — the toast still shows both values.
    }
    toast.info(
      `Your wallet couldn’t import it automatically. In your wallet choose NFTs → Import NFT, then use address ${address} and token ID ${tokenId} (copied).`,
      { autoClose: 9000 },
    );
  }
};

// Robinhood Chain testnet explorer (Blockscout) unless the env overrides it.
const EXPLORER = (envConfig.robinhoodExplorerUrl || 'https://explorer.testnet.chain.robinhood.com').replace(/\/$/, '');
export const nftUrl = (tokenId) => `${EXPLORER}/token/${contractsConfig.assetNft.address}/instance/${tokenId}`;

export const NftFact = ({ label, value, copy }) => (
  <div className="min-w-0 rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3 dark:border-slate-700/80 dark:bg-slate-900/60">
    <p className="flex items-center justify-between text-[10px] font-semibold tracking-[0.14em] text-slate-400 uppercase dark:text-slate-500">
      {label}
      {copy && (
        <button
          type="button"
          title="Copy"
          aria-label={`Copy ${label}`}
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(copy);
              toast.success(`${label} copied`);
            } catch {
              toast.info(copy);
            }
          }}
          className="cursor-pointer rounded p-0.5 text-slate-400 hover:text-amber-600 dark:hover:text-amber-300"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 0 0-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 0 1-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 0 0-3.375-3.375h-1.5a1.125 1.125 0 0 1-1.125-1.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H9.75" />
          </svg>
        </button>
      )}
    </p>
    <p className="mt-1.5 truncate font-mono text-xl leading-tight font-bold text-slate-900 sm:text-2xl dark:text-white">
      {value}
    </p>
  </div>
);

export default StationConsole;
