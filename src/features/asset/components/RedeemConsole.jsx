import Button from '../../../components/ui/Button';
import Card from '../../../components/ui/Card';
import { toast } from 'react-toastify';
import contractsConfig from '../../../config/contracts.config';
import envConfig from '../../../config/env.config';
import web3Service from '../../../services/web3Service';
import { cn, formatNumber, formatUsd, shortenAddress } from '../../../lib/utils';
import { NftFact, PhotoBadge, Readout, StepRail, addNftToWallet, imageOf, nftUrl } from './StationConsole';

/**
 * One fractionalized station the owner can take back — the reverse of the
 * share dispenser: who holds the station's shares now, which route the
 * owner is on, and the three on-chain steps that return the NFT.
 */

export const REDEEM_STEPS = [
  { key: 'approve', title: 'Approve your shares', detail: 'Lets the vault take the shares you hold' },
  { key: 'burn', title: 'Burn & reclaim NFT', detail: 'Shares are burned, the station NFT returns' },
  { key: 'unbind', title: 'Unbind compliance', detail: 'Releases the share token from compliance' },
];

const ROUTES_COPY = {
  full: {
    tone: 'success',
    badge: 'You hold 100% of shares',
    text: 'No other investor holds a share, so you can redeem straight away — no listing or buyback needed.',
  },
  cancelled: {
    tone: 'warning',
    badge: 'Listing cancelled',
    text: 'Investors were offered a buyback when the listing was cancelled. Shares they never sold back stay with them after you redeem.',
  },
};

const EXPLORER = (envConfig.robinhoodExplorerUrl || 'https://explorer.testnet.chain.robinhood.com').replace(/\/$/, '');
export const tokenUrl = (address) => `${EXPLORER}/token/${address}`;

/**
 * Adds the station's share token (ERC-3643 = ERC-20, 0 decimals) to the
 * wallet. Wallets without wallet_watchAsset get the address copied instead.
 */
export const addShareTokenToWallet = async (address, symbol) => {
  try {
    const added = await web3Service.watchToken({ address, symbol, decimals: 0 });
    if (added) toast.success('Share token added to your wallet');
    else toast.info('Not added — you can import it any time.');
  } catch (err) {
    if (err?.code === 4001) return toast.info('Not added — you can import it any time.');
    try {
      await navigator.clipboard.writeText(address);
    } catch {
      // Clipboard blocked — the toast still shows the address.
    }
    toast.info(
      `Your wallet couldn’t add it automatically. In your wallet choose Import tokens, then use address ${address} (copied), decimals 0.`,
      { autoClose: 9000 },
    );
  }
};

/** Your share of the supply vs. everyone else's, as one bar. */
const HoldersGauge = ({ balance, supply }) => {
  const pct = supply > 0 ? (balance / supply) * 100 : 0;
  return (
    <div>
      <div className="flex items-baseline justify-between text-[11px]">
        <span className="font-semibold text-slate-600 dark:text-slate-300">Who holds the shares</span>
        <span className="font-mono text-slate-500 tabular-nums dark:text-slate-400">{pct.toFixed(pct === 100 ? 0 : 2)}% you</span>
      </div>
      <div
        className="mt-1.5 flex h-3 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800"
        role="img"
        aria-label={`You hold ${pct.toFixed(2)}% of the shares`}
      >
        <div className="h-full bg-gradient-to-r from-amber-400 to-amber-300 transition-[width] duration-700" style={{ width: `${pct}%` }} />
        {pct < 100 && <div className="h-full flex-1 bg-sky-400/70" />}
      </div>
      <div className="mt-1.5 flex justify-between text-[10px] text-slate-400 dark:text-slate-500">
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-amber-400" /> You · {formatNumber(balance, 0)}
        </span>
        <span className="flex items-center gap-1">
          Investors · {formatNumber(Math.max(0, supply - balance), 0)} <span className="h-2 w-2 rounded-full bg-sky-400/70" />
        </span>
      </div>
    </div>
  );
};

const RedeemConsole = ({ asset, info, stage, done, onRedeem }) => {
  const image = imageOf(asset);
  const price = Number(asset.assetPrice) || 0;
  const supply = Number(info?.supply ?? 0);
  const balance = Number(info?.balance ?? 0);
  const busy = Boolean(stage) && stage !== 'done';
  const route = info?.holdsAll ? ROUTES_COPY.full : ROUTES_COPY.cancelled;

  return (
    <Card className="overflow-hidden">
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
        {/* ── The station */}
        <div className="flex flex-col">
          <div className="relative aspect-[16/10] overflow-hidden bg-slate-100 lg:aspect-auto lg:min-h-[260px] lg:flex-1 dark:bg-slate-800">
            {image && <img src={image} alt={asset.assetName} className="absolute inset-0 h-full w-full object-cover" />}
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />
            <div className="absolute top-3 left-3">
              <PhotoBadge tone={done ? 'success' : route.tone}>{done ? 'Back in your wallet' : route.badge}</PhotoBadge>
            </div>
            <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
              <p className="font-mono text-[10px] tracking-[0.2em] text-amber-200/80 uppercase">Station #{asset.assetId}</p>
              <h3 className="mt-1 text-lg leading-tight font-bold text-white sm:text-xl">{asset.assetName}</h3>
              {asset.locationDetails && <p className="mt-1 line-clamp-1 text-xs text-white/70">{asset.locationDetails.trim()}</p>}
            </div>
          </div>
          <div className="flex flex-col gap-3 p-4 sm:p-5">
            {done ? (
              // Redeemed: the NFT is back in the owner's wallet.
              <>
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
                    Add NFT to wallet
                  </Button>
                  <Button fullWidth variant="soft" onClick={() => window.open(nftUrl(asset.assetId), '_blank', 'noopener,noreferrer')}>
                    See NFT ↗
                  </Button>
                </div>
              </>
            ) : (
              // Still fractionalized: the NFT is locked in the vault — what the
              // owner holds is the share token.
              <>
                <div className="grid grid-cols-[minmax(0,0.6fr)_minmax(0,1.4fr)] gap-3">
                  <NftFact label="Your shares" value={formatNumber(balance, 0)} />
                  <NftFact
                    label="Share token"
                    value={info?.shareToken ? shortenAddress(info.shareToken, 6, 4) : '—'}
                    copy={info?.shareToken}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    fullWidth
                    variant="secondary"
                    disabled={!info?.shareToken}
                    onClick={() => addShareTokenToWallet(info.shareToken, info.symbol)}
                  >
                    Add token to wallet
                  </Button>
                  <Button
                    fullWidth
                    variant="soft"
                    disabled={!info?.shareToken}
                    onClick={() => window.open(tokenUrl(info.shareToken), '_blank', 'noopener,noreferrer')}
                  >
                    See token ↗
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* ── The reclaim console */}
        <div className="flex flex-col gap-4 border-t border-slate-100 p-4 sm:p-5 lg:border-t-0 lg:border-l dark:border-slate-800">
          <div className="rounded-2xl bg-gradient-to-b from-[#16120c] to-[#0b0906] p-1.5 shadow-inner ring-1 ring-black/40">
            <div className="flex items-center justify-between px-3 pt-2 pb-1">
              <span className="font-mono text-[10px] tracking-[0.25em] text-white/40 uppercase">Reclaim console</span>
              <span className={cn('h-1.5 w-1.5 rounded-full', busy ? 'animate-pulse bg-amber-400' : 'bg-emerald-400/70')} />
            </div>
            <div className="rounded-xl bg-black/50 px-4 py-1.5">
              <Readout label="Station value" value={formatUsd(price, 0)} accent />
              <Readout label={done ? 'Shares burned' : 'Shares to burn'} value={formatNumber(done ? done.burned : balance, 0)} unit="sh" />
              <Readout label="Investors keep" value={formatNumber(done ? done.othersKeep : Math.max(0, supply - balance), 0)} unit="sh" />
            </div>
            <p className="px-3 py-2 text-center font-mono text-[10px] text-white/35">
              {supply ? `${formatNumber(supply, 0)} shares in circulation` : 'Reading share supply…'}
            </p>
          </div>

          {done ? (
            <div className="space-y-3">
              <StepRail stage="done" steps={REDEEM_STEPS} />
              <div className="rounded-xl border border-emerald-200/70 bg-emerald-50/60 p-3.5 text-xs dark:border-emerald-900/60 dark:bg-emerald-950/30">
                <p className="font-semibold text-emerald-800 dark:text-emerald-200">
                  Station NFT #{asset.assetId} is back in your wallet
                </p>
                <p className="mt-1 leading-relaxed text-emerald-700/80 dark:text-emerald-300/70">
                  Your shares were burned and the share token released from compliance. Use “Add to wallet” to see the
                  NFT in MetaMask.
                </p>
              </div>
            </div>
          ) : (
            <>
              <HoldersGauge balance={balance} supply={supply} />
              <p
                className={cn(
                  'rounded-lg px-3 py-2 text-[11px] leading-snug',
                  info?.holdsAll
                    ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-200'
                    : 'bg-amber-50 text-amber-800 dark:bg-amber-500/10 dark:text-amber-200',
                )}
              >
                {route.text}
              </p>
              <StepRail stage={stage} steps={REDEEM_STEPS} />
              <Button fullWidth loading={busy} disabled={!balance || busy} onClick={onRedeem}>
                {busy ? 'Reclaiming…' : `Burn ${formatNumber(balance, 0)} shares & reclaim station`}
              </Button>
            </>
          )}
        </div>
      </div>
    </Card>
  );
};

export default RedeemConsole;
