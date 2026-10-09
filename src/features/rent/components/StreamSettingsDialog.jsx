import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import Dialog from '../../../components/ui/Dialog';
import Button from '../../../components/ui/Button';
import Textarea from '../../../components/ui/Textarea';
import Skeleton from '../../../components/ui/Skeleton';
import { LAND_MODELS, sortStreams, streamLabel } from '../../../config/incomeStreams';
import { shortenAddress } from '../../../lib/utils';
import { formatDate } from '../utils/format';
import StreamPicker from './StreamPicker';

/** Plain-English list of what a settings change did. */
export const describeChange = (before, after) => {
  const parts = [];
  if (before.landModel !== after.landModel) {
    parts.push(`Land: ${LAND_MODELS[before.landModel]?.short ?? before.landModel} → ${LAND_MODELS[after.landModel]?.short ?? after.landModel}`);
  }
  const was = new Set(before.incomeStreams);
  const now = new Set(after.incomeStreams);
  const added = after.incomeStreams.filter((k) => !was.has(k));
  const removed = before.incomeStreams.filter((k) => !now.has(k));
  if (added.length) parts.push(`Now shared: ${added.map(streamLabel).join(', ')}`);
  if (removed.length) parts.push(`No longer shared: ${removed.map(streamLabel).join(', ')}`);
  return parts;
};

const sameSettings = (a, b) =>
  a.landModel === b.landModel && sortStreams(a.incomeStreams).join() === sortStreams(b.incomeStreams).join();

/**
 * Admin editor for an asset's income-stream settings. Editable at any time;
 * every save is written to a change log shown here. Months already
 * calculated keep the streams they were made with.
 */
const StreamSettingsDialog = ({ open, onClose, asset, loadStreams, saveStreams, onSaved }) => {
  const [saved, setSaved] = useState(null); // what the backend has: { landModel, incomeStreams, log }
  const [draft, setDraft] = useState(null); // what the admin is editing
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open || !asset) return undefined;
    let cancelled = false;
    setSaved(null);
    setDraft(null);
    setNote('');
    setLoading(true);
    loadStreams(asset.id)
      .then((data) => {
        if (cancelled || !data) return;
        setSaved(data);
        setDraft({ landModel: data.landModel, incomeStreams: data.incomeStreams });
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [open, asset?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const changed = saved && draft && !sameSettings(saved, draft);

  const save = async () => {
    setSaving(true);
    const updated = await saveStreams(asset.id, { ...draft, note: note.trim() || undefined });
    setSaving(false);
    if (!updated) return; // the page already showed the error
    setSaved(updated);
    setDraft({ landModel: updated.landModel, incomeStreams: updated.incomeStreams });
    setNote('');
    toast.success('Income streams updated');
    onSaved?.(updated);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      size="xl"
      title="Income streams"
      description={asset ? `${asset.assetName || `Asset #${asset.id}`} — what the owner shares with token holders.` : undefined}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
          <Button onClick={save} loading={saving} disabled={!changed || saving}>
            Save changes
          </Button>
        </>
      }
    >
      <div className="tf-scroll max-h-[min(70vh,640px)] overflow-y-auto pr-1">
        {loading || !draft ? (
          <div className="space-y-3">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
            <StreamPicker {...draft} onChange={setDraft} disabled={saving} wide />

            <div className="space-y-4 lg:border-l lg:border-slate-100 lg:pl-6 dark:lg:border-slate-800">
            <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
              This changes what holders earn from the <strong>next</strong> distribution. Months already calculated
              keep the streams they were made with. Every change is logged.
            </p>

            {changed && (
              <Textarea
                label="Reason (optional, saved in the log)"
                rows={2}
                maxLength={500}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. Owner agreed to share the new car wash"
              />
            )}

            <div>
              <h3 className="text-[13px] font-semibold text-slate-800 dark:text-slate-100">Change log</h3>
              {saved.log.length === 0 ? (
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  No changes since this asset was registered.
                </p>
              ) : (
                <ul className="mt-2 divide-y divide-slate-100 rounded-xl border border-slate-200 dark:divide-slate-800 dark:border-slate-700">
                  {saved.log.map((entry) => (
                    <li key={entry._id} className="px-3 py-2.5 text-xs">
                      <p className="flex flex-wrap items-center justify-between gap-2 text-slate-500 dark:text-slate-400">
                        <span>{formatDate(entry.createdAt, true)}</span>
                        <span className="font-mono">{shortenAddress(entry.changedBy, 6, 4)}</span>
                      </p>
                      <p className="mt-1 text-slate-700 dark:text-slate-200">
                        {describeChange(entry.before, entry.after).join(' · ') || 'Settings saved'}
                      </p>
                      {entry.note && <p className="mt-0.5 text-slate-500 italic dark:text-slate-400">“{entry.note}”</p>}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            </div>
          </div>
        )}
      </div>
    </Dialog>
  );
};

export default StreamSettingsDialog;
