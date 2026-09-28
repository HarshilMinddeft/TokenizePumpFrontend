import { useLang } from '../context/LangContext';

const REVEAL_TRANSITION = 'opacity .8s ease, transform .9s cubic-bezier(.2,.75,.2,1)';
const ITEM_TRANSITION = 'opacity .6s ease, transform .7s cubic-bezier(.2,.75,.2,1)';

// The glowing auto-stepping numbered timeline, one section per `t.adv`
// entry, plus (for the platform-variant entry) the "one template, reused"
// fan-out visual.
export default function Advantages() {
  const { t } = useLang();

  return (
    <>
      {t.adv.map((g) => (
        <section
          key={g.zone}
          data-zone={g.zone}
          data-screen-label="Advantages"
          className="box-border flex min-h-screen items-center px-4 py-[120px] sm:px-8 md:px-12 lg:px-[clamp(16px,6vw,96px)]"
          style={{ justifyContent: g.just }}
        >
          <div
            data-reveal="1"
            className="panel flex w-[min(470px,100%)] flex-col gap-5 p-6 sm:p-8 lg:p-[clamp(24px,3vw,40px)]"
            style={{ opacity: 0, transform: g.from, transition: REVEAL_TRANSITION }}
          >
            <div className="kicker">{g.kicker}</div>
            <h3 className="font-station-display m-0 text-[clamp(30px,3.2vw,42px)] leading-[1.05] font-bold">
              {g.title}
            </h3>

            <ol className="m-0 flex list-none flex-col p-0">
              {g.items.map((it, i) => (
                <li
                  key={it.h}
                  data-reveal="1"
                  className="grid grid-cols-[34px_minmax(0,1fr)] gap-3.5"
                  style={{
                    opacity: 0,
                    transform: 'translateY(18px)',
                    transition: ITEM_TRANSITION,
                    transitionDelay: `${i}00ms`,
                  }}
                >
                  <span className="flex flex-col items-center">
                    <span
                      data-dot="1"
                      className="border-station-gold font-station-mono text-station-gold grid h-8 w-8 shrink-0 place-items-center rounded-full border text-[11px] transition-[border-color,color,box-shadow] duration-[.25s,.25s,.3s]"
                    >
                      {it.n}
                    </span>
                    <span
                      data-conn="1"
                      className="relative my-1 min-h-3 w-0.5 rounded-sm bg-[rgba(227,183,102,.2)]"
                      style={{ flex: '1', display: it.conn }}
                    >
                      <span
                        className="absolute top-0 left-0 h-0 w-full rounded-sm [box-shadow:0_0_8px_#e3b766,0_0_16px_rgba(227,183,102,.6)] transition-[height] duration-200 ease-linear"
                        style={{ background: 'linear-gradient(180deg,#fff3d6,#e3b766)' }}
                      />
                    </span>
                  </span>
                  <span className="flex flex-col gap-0.5 py-1 pb-4">
                    <strong className="text-station-ink text-[15px] font-semibold">{it.h}</strong>
                    <span className="text-station-body text-sm leading-[1.5] text-pretty">{it.b}</span>
                  </span>
                </li>
              ))}
            </ol>

            {g.isPlatform && (
              <div className="tile flex flex-col gap-2.5 p-3.5">
                <span className="font-station-mono text-station-muted text-[10.5px] tracking-[.1em] uppercase">
                  {g.repLabel}
                </span>
                <div className="relative h-[170px]">
                  <svg
                    viewBox="0 0 300 170"
                    preserveAspectRatio="none"
                    className="absolute inset-0 h-full w-full overflow-visible"
                  >
                    {g.rep.map((n, i) => (
                      <g key={n.label}>
                        <path d={n.path} fill="none" stroke="rgba(227,183,102,.22)" strokeWidth="1.2" />
                        <path
                          data-repline={i}
                          d={n.path}
                          fill="none"
                          stroke="#e3b766"
                          strokeWidth="1.6"
                          strokeDasharray="4 8"
                          style={{ opacity: 0, filter: 'drop-shadow(0 0 3px #e3b766)' }}
                        />
                      </g>
                    ))}
                  </svg>
                  <div
                    data-reporigin="1"
                    className="border-station-gold absolute top-1/2 left-0 flex w-[30%] -translate-y-1/2 flex-col items-center gap-1.5 rounded-2xl border bg-[#1a140e] px-2 py-3 text-center"
                  >
                    <img src="/station/assets/logo.webp" alt="" className="block h-[30px] w-auto" />
                    <strong className="text-[12.5px] leading-[1.2] font-bold">{g.origin}</strong>
                  </div>
                  {g.rep.map((n, i) => (
                    <div
                      key={n.label}
                      data-repnode={i}
                      className="absolute right-0 flex w-[44%] -translate-y-1/2 items-center gap-2 rounded-xl border border-[rgba(227,183,102,.35)] bg-[#1a140e] px-2.5 py-1.5"
                      style={{ top: n.top, opacity: 0 }}
                    >
                      <span
                        className="h-2 w-2 shrink-0 rounded-full"
                        style={{ background: n.dot, boxShadow: `0 0 8px ${n.dot}` }}
                      />
                      <span className="text-station-ink text-xs leading-[1.2] font-semibold">{n.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      ))}
    </>
  );
}
