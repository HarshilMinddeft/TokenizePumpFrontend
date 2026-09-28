import { useLang } from '../context/LangContext';

const REVEAL_TRANSITION = 'opacity .8s ease, transform .9s cubic-bezier(.2,.75,.2,1)';

export default function OneDistribution() {
  const { t, ledgers } = useLang();

  return (
    <section
      data-zone="overview"
      data-screen-label="One distribution"
      className="box-border flex min-h-screen items-center justify-start px-4 py-[120px] sm:px-8 md:px-12 lg:px-[clamp(16px,6vw,96px)]"
    >
      <div
        data-reveal="1"
        className="panel flex w-[min(460px,100%)] flex-col gap-5 p-6 sm:p-8 lg:p-[clamp(24px,3vw,40px)]"
        style={{ opacity: 0, transform: 'translateY(40px)', transition: REVEAL_TRANSITION }}
      >
        <div className="kicker">{t.combined.kicker}</div>
        <h2 className="font-station-display m-0 text-[clamp(32px,3.6vw,48px)] leading-[1.05] font-bold text-balance">
          {t.combined.title}
        </h2>
        <p className="text-station-body m-0 text-pretty">{t.combined.body}</p>

        <div className="relative grid grid-cols-[minmax(0,1fr)_64px_minmax(0,.9fr)] items-center">
          <div className="flex flex-col gap-2.5">
            <span className="font-station-mono text-station-muted text-[10.5px] tracking-[.08em] uppercase">
              {t.combined.sep}
            </span>
            {ledgers.map((lg, i) => (
              <div key={lg.k} className="tile flex flex-col gap-1.5 px-3 py-2.5">
                <div className="flex items-center gap-2">
                  <span
                    className="font-station-display grid h-6 w-6 shrink-0 place-items-center rounded-md text-[13px] font-extrabold text-[#060b1f]"
                    style={{ background: lg.color }}
                  >
                    {lg.k}
                  </span>
                  <span className="flex min-w-0 flex-col">
                    <strong className="text-[13px] leading-[1.2] font-semibold">{lg.name}</strong>
                    <span className="text-station-muted text-[11px]">{lg.entity}</span>
                  </span>
                </div>
                <span className="relative block h-1 overflow-hidden rounded-full bg-[rgba(255,255,255,.07)]">
                  <span
                    data-ledger={i}
                    className="absolute inset-y-0 right-auto left-0 rounded-full"
                    style={{ width: 0, background: lg.color, boxShadow: `0 0 8px ${lg.color}` }}
                  />
                </span>
              </div>
            ))}
          </div>

          <svg viewBox="0 0 64 240" preserveAspectRatio="none" className="h-full w-16 overflow-visible">
            {ledgers.map((lg, i) => (
              <g key={lg.k}>
                <path d={lg.path} fill="none" stroke={lg.color} strokeWidth="1.5" strokeOpacity=".25" />
                <path
                  data-flow={i}
                  d={lg.path}
                  fill="none"
                  stroke={lg.color}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeDasharray="6 14"
                  style={{ filter: `drop-shadow(0 0 3px ${lg.color})` }}
                />
              </g>
            ))}
          </svg>

          <div
            data-onedist="1"
            className="border-station-gold flex flex-col items-center gap-1.5 rounded-2xl border bg-[rgba(227,183,102,.1)] px-3 py-[18px] text-center"
          >
            <span className="flex gap-[3px]">
              <span className="bg-station-stream-a h-2 w-2 rounded-full" />
              <span className="bg-station-stream-b h-2 w-2 rounded-full" />
              <span className="bg-station-stream-c h-2 w-2 rounded-full" />
            </span>
            <strong className="font-station-display text-base leading-[1.2] font-bold">{t.combined.one}</strong>
          </div>
        </div>
      </div>
    </section>
  );
}
