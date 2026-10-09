import { LAND_MODELS, STREAMS, streamLabel, withLandModel, withToggledStream } from '../../../config/incomeStreams';
import { cn } from '../../../lib/utils';

/**
 * Chooses how the pump's land works and which income streams are shared with
 * token holders. A stream that is not ticked is not shared: its monthly
 * amount is fixed at 0 and the owner keeps it.
 *
 * Controlled: `onChange({ landModel, incomeStreams })`.
 */
const StreamPicker = ({ landModel, incomeStreams, onChange, disabled = false, wide = false }) => {
  const selected = new Set(incomeStreams);

  const setLandModel = (next) => {
    if (next !== landModel) onChange(withLandModel({ landModel, incomeStreams }, next));
  };

  const toggle = (key) => onChange(withToggledStream({ landModel, incomeStreams }, key));

  const visible = STREAMS.filter((s) => s.key !== 'LAND_RENT' || landModel === 'RENT');
  const sharedLabels = incomeStreams.map(streamLabel);

  return (
    <div className="space-y-5">
      <fieldset disabled={disabled}>
        <legend className="mb-2 text-[13px] font-medium text-slate-700 dark:text-slate-300">Land</legend>
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          {Object.entries(LAND_MODELS).map(([value, meta]) => {
            const active = landModel === value;
            return (
              <label
                key={value}
                className={cn(
                  'flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-colors',
                  active
                    ? 'border-indigo-500 bg-indigo-50/60 dark:border-indigo-400 dark:bg-indigo-500/10'
                    : 'border-slate-200 hover:border-slate-300 dark:border-slate-700 dark:hover:border-slate-600',
                  disabled && 'cursor-not-allowed opacity-60',
                )}
              >
                <input
                  type="radio"
                  name="landModel"
                  value={value}
                  checked={active}
                  onChange={() => setLandModel(value)}
                  className="mt-0.5 h-4 w-4 cursor-pointer accent-indigo-600"
                />
                <span>
                  <span className="block text-[13px] font-medium text-slate-800 dark:text-slate-100">{meta.label}</span>
                  <span className="mt-0.5 block text-xs text-slate-500 dark:text-slate-400">{meta.hint}</span>
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>

      <fieldset disabled={disabled}>
        <legend className="mb-1 text-[13px] font-medium text-slate-700 dark:text-slate-300">
          Income shared with token holders
        </legend>
        <p className="mb-2.5 text-xs text-slate-500 dark:text-slate-400">
          Tick what the owner shares each month. Anything not ticked is not shared — it stays with the owner and is
          fixed at 0 in the monthly rent.
        </p>
        <div className={cn('grid grid-cols-1 gap-2 sm:grid-cols-2', wide && 'xl:grid-cols-3')}>
          {visible.map((s) => (
            <label
              key={s.key}
              className={cn(
                'flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-colors',
                selected.has(s.key)
                  ? 'border-indigo-500 bg-indigo-50/60 dark:border-indigo-400 dark:bg-indigo-500/10'
                  : 'border-slate-200 hover:border-slate-300 dark:border-slate-700 dark:hover:border-slate-600',
                disabled && 'cursor-not-allowed opacity-60',
              )}
            >
              <input
                type="checkbox"
                checked={selected.has(s.key)}
                onChange={() => toggle(s.key)}
                className="mt-0.5 h-4 w-4 cursor-pointer accent-indigo-600"
              />
              <span>
                <span className="block text-[13px] font-medium text-slate-800 dark:text-slate-100">{s.label}</span>
                <span className="mt-0.5 block text-xs text-slate-500 dark:text-slate-400">{s.hint}</span>
              </span>
            </label>
          ))}
        </div>
        <p className="mt-2.5 text-xs text-slate-500 dark:text-slate-400" aria-live="polite">
          {sharedLabels.length > 0
            ? `Holders are paid monthly from: ${sharedLabels.join(' + ')}.`
            : 'Nothing is shared, so there will be no monthly rent — holders gain only if the asset price rises.'}
        </p>
      </fieldset>
    </div>
  );
};

export default StreamPicker;
