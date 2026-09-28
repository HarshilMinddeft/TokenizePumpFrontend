import { useLang } from '../context/LangContext';

const REVEAL_TRANSITION = 'opacity .8s ease, transform .9s cubic-bezier(.2,.75,.2,1)';
const ITEM_TRANSITION = 'opacity .6s ease, transform .7s cubic-bezier(.2,.75,.2,1)';

function ListVariant({ f }) {
  return (
    <ol className="m-0 flex list-none flex-col gap-2 p-0">
      {f.items.map((it, i) => (
        <li
          key={it.h}
          data-reveal="1"
          className="tile grid grid-cols-[28px_minmax(0,1fr)] items-start gap-3 px-3.5 py-3"
          style={{
            opacity: 0,
            transform: 'translateY(18px)',
            transition: ITEM_TRANSITION,
            transitionDelay: `${i}00ms`,
          }}
        >
          <span className="font-station-mono text-station-gold pt-[3px] text-xs">{it.n}</span>
          <span className="flex flex-col gap-0.5">
            <strong className="text-[15px] font-semibold">{it.h}</strong>
            <span className="text-station-body text-sm leading-[1.5] text-pretty">{it.b}</span>
          </span>
        </li>
      ))}
    </ol>
  );
}

function TokenVariant({ f }) {
  return (
    <>
      <p className="text-station-body m-0 text-[15px] text-pretty">{f.lead2}</p>
      <div className="flex flex-wrap gap-1.5">
        {f.badges.map((bd) => (
          <span
            key={bd}
            className="font-station-mono text-station-gold rounded-full border border-[rgba(227,183,102,.45)] px-2.5 py-1 text-[11px] tracking-[.08em]"
          >
            {bd}
          </span>
        ))}
      </div>
      <div className="relative grid grid-cols-4 gap-1 py-1.5">
        <span className="absolute inset-x-[12.5%] top-[21px] h-0.5 rounded-sm bg-[rgba(227,183,102,.2)]" />
        <span
          data-pulse="1"
          className="absolute top-[18px] h-2 w-2 rounded-full bg-[#fff3d6] [box-shadow:0_0_10px_#e3b766,0_0_22px_#e3b766]"
          style={{ left: '12.5%', marginLeft: '-4px' }}
        />
        {f.pipe.map((pp, i) => (
          <span key={pp} className="relative flex flex-col items-center gap-2 text-center">
            <span
              data-pnode={i}
              className="border-station-gold text-station-gold grid h-8 w-8 place-items-center rounded-full border bg-[#1a140e] text-[13px]"
            >
              ✓
            </span>
            <span className="text-station-ink text-xs font-semibold">{pp}</span>
          </span>
        ))}
      </div>
      <div className="flex flex-col gap-2">
        {f.pillars.map((pl, i) => (
          <div
            key={pl.h}
            data-reveal="1"
            className="tile grid grid-cols-[10px_minmax(0,1fr)] items-start gap-3 px-3.5 py-3"
            style={{
              opacity: 0,
              transform: 'translateY(14px)',
              transition: ITEM_TRANSITION,
              transitionDelay: `${i}00ms`,
            }}
          >
            <span className="bg-station-gold mt-[7px] h-2 w-2 rounded-full [box-shadow:0_0_8px_#e3b766]" />
            <span className="flex flex-col gap-0.5">
              <strong className="text-[15px] font-semibold">{pl.h}</strong>
              <span className="text-station-body text-sm leading-[1.5]">{pl.b}</span>
            </span>
          </div>
        ))}
      </div>
    </>
  );
}

function VaultVariant({ f }) {
  return (
    <>
      <div className="flex items-center gap-4">
        <div className="relative h-32 w-32 shrink-0">
          <span
            data-spin="1"
            className="absolute inset-0 rounded-full border-2 border-dashed border-[rgba(227,183,102,.5)]"
          />
          <span
            data-spin="-1"
            className="absolute inset-3 rounded-full border border-[rgba(227,183,102,.35)]"
            style={{ borderTopColor: '#e3b766', borderBottomColor: '#e3b766' }}
          />
          <span
            data-vcore="1"
            className="border-station-gold absolute inset-7 flex flex-col items-center justify-center rounded-full border bg-[#1a140e] text-center"
          >
            <span className="text-station-gold text-lg leading-none">🔒︎</span>
            <span className="font-station-mono text-station-gold mt-1 text-[10px]">{f.nftStd}</span>
            <span className="text-station-ink px-1.5 text-[10px] leading-[1.2] font-semibold">{f.nftLabel}</span>
          </span>
        </div>
        <div className="flex min-w-0 flex-col gap-1.5">
          {f.hashes.map((hs, i) => (
            <span
              key={hs}
              data-reveal="1"
              className="tile flex items-center gap-2 px-2.5 py-[7px]"
              style={{
                opacity: 0,
                transform: 'translateX(12px)',
                transition: 'opacity .5s ease, transform .6s ease',
                transitionDelay: `${i}50ms`,
              }}
            >
              <span className="font-station-mono text-station-gold rounded-[5px] border border-[rgba(227,183,102,.4)] px-1.5 py-px text-[10px]">
                #
              </span>
              <span className="text-station-ink text-[13px] font-medium">{hs}</span>
            </span>
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <span className="font-station-mono text-station-muted text-[11px] tracking-[.1em] uppercase">
          ↓ {f.fracLabel}
        </span>
        <div className="grid grid-cols-12 gap-1">
          {f.frac.map((_, i) => (
            <span
              key={i}
              data-frac={i}
              className="aspect-square rounded-[3px] border border-[rgba(227,183,102,.25)] bg-[rgba(227,183,102,.12)]"
            />
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-2 rounded-xl border border-dashed border-[rgba(227,183,102,.4)] px-3.5 py-3">
        <span className="font-station-mono text-station-gold text-[11px] tracking-[.1em] uppercase">{f.release}</span>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-lg bg-[rgba(227,183,102,.1)] px-2.5 py-[5px] text-[13px] font-semibold">
            {f.unlock0}
          </span>
          <span className="text-station-gold font-bold">+</span>
          <span className="rounded-lg bg-[rgba(227,183,102,.1)] px-2.5 py-[5px] text-[13px] font-semibold">
            {f.unlock1}
          </span>
        </div>
      </div>
    </>
  );
}

function CycleVariant({ f }) {
  return (
    <>
      <div className="relative mx-auto mt-2.5 aspect-square w-[min(330px,100%)]">
        <span className="absolute inset-[16%] rounded-full border border-dashed border-[rgba(227,183,102,.4)]" />
        <span data-orbit="1" className="absolute inset-[16%] rounded-full">
          <span className="absolute -top-[5px] left-1/2 -ml-[5px] h-2.5 w-2.5 rounded-full bg-[#fff3d6] [box-shadow:0_0_12px_#e3b766,0_0_26px_#e3b766]" />
        </span>
        <span className="absolute inset-[36%] flex flex-col items-center justify-center rounded-full border border-[rgba(227,183,102,.35)] bg-[rgba(227,183,102,.1)] text-center">
          <span className="font-station-display text-station-gold text-[17px] leading-[1.1] font-extrabold">
            {f.hub0}
          </span>
          <span className="font-station-display text-station-ink text-[17px] leading-[1.1] font-extrabold">
            {f.hub1}
          </span>
        </span>
        {f.cnodes.map((cn, i) => (
          <span
            key={cn.n}
            data-cnode={i}
            className="absolute flex w-[118px] -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-0.5 rounded-xl border border-[rgba(227,183,102,.4)] bg-[#1a140e] px-2 pt-2 pb-[9px] text-center"
            style={{ left: cn.x, top: cn.y }}
          >
            <span className="font-station-mono text-station-gold text-[10px]">{cn.n}</span>
            <strong className="text-station-ink text-sm font-bold">{cn.h}</strong>
            <span className="text-station-body text-[11.5px] leading-[1.3]">{cn.b}</span>
          </span>
        ))}
      </div>
      <span className="text-station-muted text-center text-[13px]">{f.note}</span>
    </>
  );
}

function DashVariant({ dash, setDash }) {
  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-[rgba(227,183,102,.35)] bg-[#120e0a] [box-shadow:0_20px_60px_rgba(0,0,0,.45)]">
      <div className="flex items-center gap-1.5 border-b border-[rgba(227,183,102,.15)] px-3 py-2.5">
        <span className="h-[7px] w-[7px] rounded-full bg-[rgba(227,183,102,.5)]" />
        <span className="h-[7px] w-[7px] rounded-full bg-[rgba(227,183,102,.3)]" />
        <span className="h-[7px] w-[7px] rounded-full bg-[rgba(227,183,102,.2)]" />
        <span className="flex-1" />
        <img src="/station/assets/logo.webp" alt="" className="block h-3.5 w-auto" />
        <span className="font-station-display text-station-gold text-[11px] font-extrabold tracking-[.08em]">
          VARELO
        </span>
        <span className="text-station-muted text-[10px]">· {dash.illus}</span>
      </div>
      <div className="flex gap-0.5 overflow-x-auto p-1.5">
        {dash.tabs.map((tb) => (
          <button
            key={tb.label}
            type="button"
            onClick={() => setDash(tb.tabIndex, true)}
            className="flex-1 rounded-lg px-1 py-1.5 text-center text-[11.5px] font-semibold whitespace-nowrap transition-[background,color] duration-300"
            style={{ color: tb.fg, background: tb.bg }}
          >
            {tb.label}
          </button>
        ))}
      </div>
      <div className="relative mx-3 h-[3px] overflow-hidden rounded-sm bg-[rgba(227,183,102,.1)]">
        <span
          data-dashprog="1"
          className="bg-station-gold absolute inset-y-0 right-auto left-0 [box-shadow:0_0_8px_#e3b766]"
          style={{ width: 0 }}
        />
      </div>
      <div className="flex min-h-[200px] flex-col gap-2.5 p-3.5">
        {dash.t0 && (
          <>
            <div className="grid grid-cols-2 gap-2">
              <div className="tile flex flex-col gap-1 p-3">
                <span className="font-station-mono text-station-muted text-[10.5px] tracking-[.08em] uppercase">
                  {dash.fractions}
                </span>
                <span className="font-station-display text-station-ink text-2xl font-extrabold">—</span>
              </div>
              <div className="tile flex flex-col gap-1 p-3">
                <span className="font-station-mono text-station-muted text-[10.5px] tracking-[.08em] uppercase">
                  {dash.value}
                </span>
                <span className="font-station-display text-station-ink text-2xl font-extrabold">AED —</span>
              </div>
            </div>
            <span className="font-station-mono text-station-muted text-[10.5px] tracking-[.08em] uppercase">
              {dash.history}
            </span>
            <div className="grid h-[70px] grid-cols-12 items-end gap-[5px]">
              {dash.months.map((mo, i) => (
                <span
                  key={i}
                  data-dbar={i}
                  className="[transform-origin:bottom] rounded-t-[3px] rounded-b-[1px]"
                  style={{
                    height: mo.h,
                    background: 'linear-gradient(180deg,#e3b766,rgba(227,183,102,.35))',
                    transform: 'scaleY(0)',
                  }}
                />
              ))}
            </div>
          </>
        )}
        {dash.t1 && (
          <>
            <span className="font-station-mono text-station-muted text-[10.5px] tracking-[.08em] uppercase">
              {dash.monthly}
            </span>
            {dash.srows.map((sr, i) => (
              <div key={sr.k} className="tile grid grid-cols-[26px_minmax(0,1fr)] items-center gap-2.5 px-3 py-2.5">
                <span
                  className="font-station-display grid h-6 w-6 place-items-center rounded-[7px] text-xs font-extrabold text-[#060b1f]"
                  style={{ background: sr.color }}
                >
                  {sr.k}
                </span>
                <span className="flex flex-col gap-1.5">
                  <span className="text-[13px] font-semibold">{sr.name}</span>
                  <span className="relative h-[5px] overflow-hidden rounded-sm bg-[rgba(255,255,255,.07)]">
                    <span
                      data-sbar={i}
                      className="absolute inset-y-0 right-auto left-0 [transform-origin:left] rounded-sm"
                      style={{
                        width: sr.w,
                        background: sr.color,
                        boxShadow: `0 0 8px ${sr.color}`,
                        transform: 'scaleX(0)',
                      }}
                    />
                  </span>
                </span>
              </div>
            ))}
          </>
        )}
        {dash.t2 &&
          dash.mrows.map((mr, i) => (
            <div key={mr.label} className="tile grid grid-cols-[minmax(0,1fr)_110px] items-center gap-2.5 px-3 py-2.5">
              <span className="flex flex-col gap-0.5">
                <span className="font-station-mono text-station-muted text-[10.5px] tracking-[.08em] uppercase">
                  {mr.label}
                </span>
                <span className="font-station-display text-xl font-extrabold">—</span>
              </span>
              <svg viewBox="0 0 110 34" className="h-[34px] w-[110px] overflow-visible">
                <path
                  data-spark={i}
                  d={mr.d}
                  fill="none"
                  stroke="#e3b766"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ filter: 'drop-shadow(0 0 4px #e3b766)' }}
                />
              </svg>
            </div>
          ))}
        {dash.t3 &&
          dash.docs.map((dc, i) => (
            <div
              key={dc}
              data-drow={i}
              className="tile flex items-center gap-2.5 px-3 py-2.5"
              style={{ opacity: 0, transform: 'translateY(8px)' }}
            >
              <span className="font-station-mono text-station-gold grid h-[30px] w-[26px] place-items-center rounded-[5px] border border-[rgba(227,183,102,.45)] text-[8px]">
                PDF
              </span>
              <span className="flex-1 text-[13px] font-semibold">{dc}</span>
              <span className="flex items-center gap-1.5 rounded-full bg-[rgba(92,207,142,.12)] px-2 py-[3px] text-[10.5px] font-semibold whitespace-nowrap text-[#5ccf8e]">
                ✓ {dash.onchain}
              </span>
            </div>
          ))}
        {dash.t4 && (
          <div className="tile flex flex-col items-center gap-3.5 px-3 py-[18px]">
            <div
              data-stmt="1"
              className="flex w-[120px] flex-col gap-1.5 rounded-lg bg-[#f6efe2] p-3 [box-shadow:0_10px_30px_rgba(0,0,0,.4)]"
            >
              <span className="flex items-center gap-1">
                <img src="/station/assets/logo.webp" alt="" className="block h-3 w-auto" />
                <span className="font-station-display text-[10px] font-extrabold text-[#1a140e]">VARELO</span>
              </span>
              <span className="h-1 rounded-sm bg-[#d8cbb3]" />
              <span className="h-1 w-[70%] rounded-sm bg-[#d8cbb3]" />
              <span className="mt-1 flex gap-[3px]">
                <span className="bg-station-stream-a h-3.5 flex-1 rounded-sm" />
                <span className="bg-station-stream-b h-3.5 flex-1 rounded-sm" />
                <span className="bg-station-stream-c h-3.5 flex-1 rounded-sm" />
              </span>
              <span className="h-1 rounded-sm bg-[#d8cbb3]" />
            </div>
            <span className="text-[13px] font-semibold">{dash.stmt}</span>
            <span className="bg-station-gold rounded-full px-4 py-2 text-[12.5px] font-bold text-[#060b1f]">
              ↓ {dash.stmtBtn}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function PlatformFeatures() {
  const { t, dash, setDash } = useLang();

  return (
    <>
      {t.features.map((f) => (
        <section
          key={f.zone}
          data-zone={f.zone}
          data-screen-label="Platform feature"
          className="box-border flex min-h-screen items-center px-4 py-[120px] sm:px-8 md:px-12 lg:px-[clamp(16px,6vw,96px)]"
          style={{ justifyContent: f.just }}
        >
          <div
            data-reveal="1"
            className="panel flex w-[min(460px,100%)] flex-col gap-[18px] p-6 sm:p-8 lg:p-[clamp(24px,3vw,40px)]"
            style={{ opacity: 0, transform: f.from, transition: REVEAL_TRANSITION }}
          >
            <div className="font-station-mono text-station-gold flex items-center gap-3 text-xs tracking-[.14em] uppercase">
              <span>{f.num}</span>
              <span className="h-px flex-1 bg-[rgba(227,183,102,.35)]" />
            </div>
            <h3 className="font-station-display m-0 text-[clamp(28px,3vw,40px)] leading-[1.05] font-bold">{f.title}</h3>
            <p className="text-station-body m-0 text-pretty">{f.lead}</p>

            {f.isList && <ListVariant f={f} />}
            {f.isToken && <TokenVariant f={f} />}
            {f.isVault && <VaultVariant f={f} />}
            {f.isCycle && <CycleVariant f={f} />}
            {f.isDash && <DashVariant dash={dash} setDash={setDash} />}
          </div>
        </section>
      ))}
    </>
  );
}
