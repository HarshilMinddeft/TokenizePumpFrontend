import { useEffect, useMemo, useState } from 'react';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';
import Textarea from '../../../components/ui/Textarea';
import AssetPicker from './AssetPicker';
import MonthPicker from './MonthPicker';
import HoldersPreview from './HoldersPreview';
import StreamAmounts, { parseAmount, sumAmounts } from './StreamAmounts';
import StreamSettingsDialog from './StreamSettingsDialog';
import { LAND_MODELS, streamLabel } from '../../../config/incomeStreams';
import { formatMonth, recentMonths } from '../utils/format';

const currentMonth = () => new Date().toISOString().slice(0, 7);

/**
 * New monthly distribution: asset, month, the net profit of each income
 * stream the asset shares, issuer toggle. Submitting asks the backend to
 * calculate the split and save it as a draft. The streams' sum is the rent.
 */
const DistributionForm = ({
  assets,
  allowCurrentMonth,
  feeBps,
  symbol,
  decimals = 6,
  onCreate,
  creating,
  loadHolders,
  loadDistributions,
  loadStreams,
  saveStreams,
  onStreamsSaved,
  adminAddress,
}) => {
  const months = useMemo(() => recentMonths(12), []);
  const thisMonth = currentMonth();

  const [tokenId, setTokenId] = useState('');
  const [month, setMonth] = useState(() => months.find((m) => m < thisMonth) ?? months[0]);
  const [amounts, setAmounts] = useState({}); // stream key → net profit entered
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [excludeIssuer, setExcludeIssuer] = useState(false);
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  const asset = assets.find((p) => p.id === tokenId);
  // null = the asset isn't registered in the backend, so its streams are unknown.
  const streamKeys = asset ? asset.incomeStreams : null;

  // Amounts (and any validation error) belong to one asset's streams; start
  // fresh when another is picked.
  useEffect(() => {
    setAmounts({});
    setError('');
  }, [tokenId]);

  // A month before the asset launched can't be distributed: when the
  // chosen asset launched after the selected month, move to its launch
  // month (if that month can be distributed yet).
  useEffect(() => {
    if (!asset?.fractionalizedAt) return;
    const launched = new Date(Number(asset.fractionalizedAt) * 1000);
    const launchMonth = `${launched.getUTCFullYear()}-${String(launched.getUTCMonth() + 1).padStart(2, '0')}`;
    const available = launchMonth < thisMonth || (launchMonth === thisMonth && allowCurrentMonth);
    if (month < launchMonth && available) setMonth(launchMonth);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [asset?.id]);

  const [holders, setHolders] = useState([]);
  const [holdersLoading, setHoldersLoading] = useState(false);
  // 'YYYY-MM' → status of this asset's existing (non-cancelled)
  // distributions, so the month picker can mark months already paid.
  const [statusByMonth, setStatusByMonth] = useState({});

  useEffect(() => {
    setStatusByMonth({});
    if (!tokenId || !loadDistributions) return undefined;
    let cancelled = false;
    loadDistributions(tokenId).then((data) => {
      if (cancelled || !data) return;
      setStatusByMonth(
        Object.fromEntries(data.items.filter((d) => d.status !== 'CANCELLED').map((d) => [d.month, d.status])),
      );
    });
    return () => {
      cancelled = true;
    };
  }, [tokenId, loadDistributions]);

  useEffect(() => {
    if (!tokenId || !loadHolders) return undefined;
    let cancelled = false;
    setHoldersLoading(true);
    loadHolders(tokenId)
      .then((data) => !cancelled && setHolders(data?.holders ?? []))
      .finally(() => !cancelled && setHoldersLoading(false));
    return () => {
      cancelled = true;
    };
  }, [tokenId, loadHolders]);
  const monthInProgress = month === thisMonth;

  const submit = (e) => {
    e.preventDefault();
    setError('');
    if (!tokenId) return setError('Choose an asset.');
    if (streamKeys === null) return setError('This asset isn’t registered in the backend, so its income streams are unknown.');
    if (streamKeys.length === 0) return setError('No income streams are shared for this asset — edit its streams first.');
    for (const key of streamKeys) {
      if (parseAmount(amounts[key], decimals) === null) {
        return setError(`Enter the net profit for ${streamLabel(key)} as an amount, e.g. 1200 or 1200.50 (0 if it earned nothing).`);
      }
    }
    if (sumAmounts(amounts, streamKeys, decimals).isZero()) return setError('The total to distribute must be greater than 0.');
    onCreate({
      tokenId,
      month,
      streams: Object.fromEntries(streamKeys.map((key) => [key, amounts[key]])),
      excludeIssuer,
      note: note.trim() || undefined,
    });
  };

  return (
    <Card className="p-5 sm:p-6">
      <h2 className="text-[15px] font-semibold text-slate-900 dark:text-white">New monthly distribution</h2>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        Enter the net profit each income stream earned this month, after operating costs. Their total is split
        across holders: each share earns the same amount per day held, so holders who bought or sold mid-month are
        paid only for their days — nothing is sent for days before launch.
      </p>

      <form onSubmit={submit} className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
        <AssetPicker label="Asset" assets={assets} value={tokenId} onChange={setTokenId} />

        <MonthPicker
          label="Month (UTC)"
          value={month}
          onChange={setMonth}
          allowCurrentMonth={allowCurrentMonth}
          launchedAt={asset ? Number(asset.fractionalizedAt) : undefined}
          statusByMonth={statusByMonth}
        />

        {asset && (
          <div className="md:col-span-2">
            <HoldersPreview
              asset={asset}
              holders={holders}
              loading={holdersLoading}
              adminAddress={adminAddress}
              excludeIssuer={excludeIssuer}
            />
          </div>
        )}

        {asset && (
          <div className="md:col-span-2">
            <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-[13px] font-medium text-slate-700 dark:text-slate-300">Income streams</h3>
                {asset.landModel && <Badge tone="info">{LAND_MODELS[asset.landModel]?.short ?? asset.landModel}</Badge>}
              </div>
              {loadStreams && streamKeys !== null && (
                <Button type="button" size="sm" variant="soft" onClick={() => setSettingsOpen(true)}>
                  Edit streams
                </Button>
              )}
            </div>

            {streamKeys === null ? (
              <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
                This asset isn’t registered in the backend, so its income streams are unknown. Register it first.
              </p>
            ) : streamKeys.length === 0 ? (
              <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
                The owner shares no income streams for this asset, so there is no monthly rent to distribute (holders
                gain only if the asset price rises). Use “Edit streams” if that changes.
              </p>
            ) : (
              <StreamAmounts
                keys={streamKeys}
                values={amounts}
                onChange={(key, value) => setAmounts((prev) => ({ ...prev, [key]: value }))}
                symbol={symbol}
                decimals={decimals}
                feeBps={feeBps}
              />
            )}
          </div>
        )}

        <div className="flex flex-col justify-center gap-1.5">
          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 p-3 dark:border-slate-700">
            <input
              type="checkbox"
              className="mt-0.5 h-4 w-4 cursor-pointer accent-indigo-600"
              checked={excludeIssuer}
              onChange={(e) => setExcludeIssuer(e.target.checked)}
            />
            <span>
              <span className="block text-[13px] font-medium text-slate-700 dark:text-slate-200">Exclude the issuer</span>
              <span className="block text-xs text-slate-500 dark:text-slate-400">
                Don’t pay rent on shares the issuer still holds, including unsold listing inventory. Investors’
                amounts don’t change.
              </span>
            </span>
          </label>
        </div>

        <div className="md:col-span-2">
          <Textarea label="Note (optional)" rows={2} maxLength={500} value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Includes late payment from tenant" />
        </div>

        {monthInProgress && allowCurrentMonth && (
          <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700 md:col-span-2 dark:bg-amber-500/10 dark:text-amber-300">
            Testnet mode: {formatMonth(month)} hasn’t ended, so holders are paid only up to the latest indexed block.
            This month can’t be distributed again once it ends.
          </p>
        )}
        {asset && asset.redeemed && (
          <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700 md:col-span-2 dark:bg-amber-500/10 dark:text-amber-300">
            This asset has been redeemed; only the days before redemption can earn rent.
          </p>
        )}
        {error && <p className="text-sm font-medium text-red-500 md:col-span-2">{error}</p>}

        <div className="md:col-span-2">
          <Button type="submit" loading={creating}>
            {creating ? 'Calculating…' : 'Calculate distribution'}
          </Button>
        </div>
      </form>

      <StreamSettingsDialog
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        asset={asset}
        loadStreams={loadStreams}
        saveStreams={saveStreams}
        onSaved={onStreamsSaved}
      />
    </Card>
  );
};

export default DistributionForm;
