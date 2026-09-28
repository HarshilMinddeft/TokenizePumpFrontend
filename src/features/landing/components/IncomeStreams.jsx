import { useLang } from '../context/LangContext';

const CARD_TRANSITION = 'opacity .6s ease, transform .7s cubic-bezier(.2,.75,.2,1)';

// The pinned/sticky section with the laser transition between income-stream
// cards. `pinH` (computed in LangContext) sizes the scroll runway; the
// sticky inner div stays full-viewport while `useScrollChoreography`'s
// `pinState()`/`laserCheck()` cross-fade cards and fire the laser beam
// (rendered by StationLanding, not here) between the active/previous card.
export default function IncomeStreams() {
  const { pcards, pinH } = useLang();

  return (
    <div data-pin="1" data-screen-label="Income streams" className="relative" style={{ height: pinH }}>
      <div className="sticky top-0 h-screen overflow-hidden">
        {pcards.map((c, i) => (
          <div
            key={`${c.zone}-${i}`}
            data-pcard={c.zone}
            className="panel absolute box-border flex w-[min(420px,calc(100%-32px))] flex-col gap-4 p-[clamp(22px,2.6vw,34px)]"
            style={{
              top: '50%',
              left: c.l,
              right: c.r,
              opacity: 0,
              transform: `translateY(-50%) translateX(${c.off})`,
              transition: CARD_TRANSITION,
            }}
          >
            <div className="flex items-center gap-3.5">
              <span
                className="font-station-display grid h-[52px] w-[52px] shrink-0 place-items-center rounded-2xl text-[28px] font-extrabold text-[#060b1f]"
                style={{ background: c.color }}
              >
                {c.k}
              </span>
              <div className="flex flex-col gap-0.5">
                <span className="font-station-mono text-xs tracking-[.14em] uppercase" style={{ color: c.color }}>
                  {c.kicker}
                </span>
                <h3 className="font-station-display m-0 text-[clamp(24px,2.6vw,34px)] leading-[1.08] font-bold">
                  {c.name}
                </h3>
              </div>
            </div>
            <p className="m-0 text-pretty text-[#dfe4ef]">{c.body}</p>
            <span className="text-station-muted text-[13px]">{c.metric}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
