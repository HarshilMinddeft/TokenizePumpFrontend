import { useLang } from '../context/LangContext';

const REVEAL_TRANSITION = 'opacity .8s ease, transform .9s cubic-bezier(.2,.75,.2,1)';

export default function StreamsIntro() {
  const { t, legs } = useLang();

  return (
    <section
      id="streams"
      data-zone="plot"
      data-screen-label="Streams intro"
      className="box-border flex min-h-[80vh] items-center justify-start px-4 py-[120px] sm:px-8 md:px-12 lg:px-[clamp(16px,6vw,96px)]"
    >
      <div
        data-reveal="1"
        className="panel flex w-[min(440px,100%)] flex-col gap-[18px] p-6 sm:p-8 lg:p-[clamp(24px,3vw,40px)]"
        style={{ opacity: 0, transform: 'translateY(40px)', transition: REVEAL_TRANSITION }}
      >
        <div className="kicker">{t.streamsIntro.kicker}</div>
        <h2 className="font-station-display m-0 text-[clamp(32px,3.6vw,48px)] leading-[1.05] font-bold text-balance">
          {t.streamsIntro.title}
        </h2>
        <p className="text-station-body m-0 text-pretty">{t.streamsIntro.body}</p>

        <div className="flex flex-col gap-0 px-1 pt-1.5">
          <div
            data-plat="1"
            className="border-station-gold flex items-center justify-center gap-2 rounded-xl border bg-[rgba(227,183,102,.12)] px-3 py-2.5 text-sm font-semibold"
          >
            <span className="flex gap-[3px]">
              <span className="bg-station-stream-a h-[7px] w-[7px] rounded-full" />
              <span className="bg-station-stream-b h-[7px] w-[7px] rounded-full" />
              <span className="bg-station-stream-c h-[7px] w-[7px] rounded-full" />
            </span>
            <span>{t.streamsIntro.top}</span>
          </div>

          <div className="grid h-[120px] grid-cols-3 gap-3.5 px-[10%]">
            {legs.map((lg, i) => (
              <span key={lg.k} className="flex h-full items-end justify-center">
                <span
                  data-leg={i}
                  className="block h-full w-3.5 [transform-origin:bottom] rounded-b"
                  style={{
                    background: `linear-gradient(180deg,${lg.color},rgba(227,183,102,.15))`,
                    boxShadow: `0 0 14px ${lg.color}66`,
                    transform: 'scaleY(0)',
                  }}
                />
              </span>
            ))}
          </div>

          <div className="h-0.5 rounded-full bg-[rgba(227,183,102,.35)]" />

          <div className="grid grid-cols-3 gap-2 pt-2.5">
            {legs.map((lg) => (
              <span key={lg.k} className="flex flex-col items-center gap-[3px] text-center">
                <span
                  className="font-station-display grid h-7 w-7 place-items-center rounded-lg text-sm font-extrabold text-[#060b1f]"
                  style={{ background: lg.color }}
                >
                  {lg.k}
                </span>
                <strong className="text-[13px] leading-[1.2] font-semibold">{lg.name}</strong>
                <span className="font-station-mono text-[10px] tracking-[.06em] uppercase" style={{ color: lg.color }}>
                  {lg.type}
                </span>
              </span>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-1 rounded-xl border border-[rgba(92,207,142,.3)] bg-[rgba(92,207,142,.08)] px-3.5 py-3">
          <strong className="text-station-ink text-[15px] font-bold">✓ {t.streamsIntro.safe}</strong>
          <span className="text-station-body text-[13.5px]">{t.streamsIntro.dip}</span>
        </div>
      </div>
    </section>
  );
}
