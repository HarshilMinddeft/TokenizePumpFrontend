import { useLang } from '../context/LangContext';

const REVEAL_TRANSITION = 'opacity .8s ease, transform .9s cubic-bezier(.2,.75,.2,1)';

export default function Structure() {
  const { t } = useLang();
  const s = t.structure;

  return (
    <section
      id="structure"
      data-zone="aerial"
      data-screen-label="Structure"
      className="box-border flex min-h-screen items-center justify-end px-4 py-[120px] sm:px-8 md:px-12 lg:px-[clamp(16px,6vw,96px)]"
    >
      <div
        data-reveal="1"
        className="panel flex w-[min(520px,100%)] flex-col gap-[22px] p-6 sm:p-8 lg:p-[clamp(24px,3vw,40px)]"
        style={{ opacity: 0, transform: 'translateY(40px)', transition: REVEAL_TRANSITION }}
      >
        <div className="kicker">{s.kicker}</div>
        <h2 className="font-station-display m-0 text-[clamp(32px,3.6vw,48px)] leading-[1.05] font-bold text-balance">
          {s.title}
        </h2>

        <div className="flex flex-col gap-2">
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-xl border border-dashed border-[rgba(238,241,247,.3)] px-3.5 py-3 text-sm">
              <strong className="block font-semibold">{s.investors}</strong>
              <span className="text-station-muted text-[13px]">{s.investorsSub}</span>
            </div>
            <div className="rounded-xl border border-dashed border-[rgba(238,241,247,.3)] px-3.5 py-3 text-sm">
              <strong className="block font-semibold">{s.owner}</strong>
              <span className="text-station-muted text-[13px]">{s.ownerSub}</span>
            </div>
          </div>

          <div className="font-station-mono text-station-gold text-center text-[13px]">↓ {s.fractions} ↓</div>

          <div className="rounded-xl border border-[rgba(227,183,102,.45)] bg-[rgba(227,183,102,.1)] px-4 py-3.5">
            <strong className="text-station-gold block font-semibold">{s.vault}</strong>
            <span className="text-station-body text-[13px]">{s.vaultSub}</span>
          </div>

          <div className="text-station-sand text-center text-[13px]">↓</div>

          <div className="rounded-xl border border-[rgba(232,211,166,.5)] bg-[rgba(232,211,166,.12)] px-4 py-3.5">
            <strong className="text-station-sand block font-semibold">{s.holdco}</strong>
            <span className="text-station-body text-[13px]">{s.holdcoSub}</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="tile px-4 py-3.5">
              <strong className="block font-semibold">PropCo</strong>
              <span className="text-station-body text-[13px]">{s.propco}</span>
              <div className="mt-2 flex gap-1.5">
                <span className="bg-station-sand rounded-full px-2.5 py-0.5 text-xs font-bold text-[#060b1f]">A</span>
                <span className="rounded-full bg-[#ffb44a] px-2.5 py-0.5 text-xs font-bold text-[#060b1f]">B</span>
              </div>
            </div>
            <div className="tile px-4 py-3.5">
              <strong className="block font-semibold">OpCo</strong>
              <span className="text-station-body text-[13px]">{s.opco}</span>
              <div className="mt-2 flex gap-1.5">
                <span className="rounded-full bg-[#5ccf8e] px-2.5 py-0.5 text-xs font-bold text-[#060b1f]">C</span>
              </div>
            </div>
          </div>

          <div className="text-station-body rounded-xl border border-dashed border-[rgba(255,180,74,.55)] px-3.5 py-3 text-[13px]">
            <strong className="font-semibold text-[#ffb44a]">{s.fuelco}</strong> — {s.fuelcoSub}
          </div>
        </div>
      </div>
    </section>
  );
}
