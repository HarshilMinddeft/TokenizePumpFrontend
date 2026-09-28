import { useLang } from '../context/LangContext';

const REVEAL_TRANSITION = 'opacity .8s ease, transform .9s cubic-bezier(.2,.75,.2,1)';
const REVEAL_TRANSITION_FAST = 'opacity .6s ease, transform .7s cubic-bezier(.2,.75,.2,1)';

export default function Concept() {
  const { t } = useLang();

  return (
    <section
      data-zone="overview"
      data-screen-label="Concept"
      className="box-border flex min-h-screen items-center justify-start px-4 py-[120px] sm:px-8 md:px-12 lg:px-[clamp(16px,6vw,96px)]"
    >
      <div
        data-reveal="1"
        className="panel flex w-[min(460px,100%)] flex-col gap-[22px] p-6 sm:p-8 lg:p-[clamp(24px,3vw,40px)]"
        style={{ opacity: 0, transform: 'translateY(40px)', transition: REVEAL_TRANSITION }}
      >
        <div className="kicker">{t.concept.kicker}</div>
        <h2 className="font-station-display m-0 text-[clamp(32px,3.6vw,48px)] leading-[1.05] font-bold text-balance">
          {t.concept.title}
        </h2>
        <p className="text-station-body m-0 text-pretty">{t.concept.body}</p>
        <div className="grid grid-cols-3 gap-2">
          {t.concept.items.map((c, i) => (
            <div
              key={c.k}
              data-reveal="1"
              className="tile flex flex-col gap-1.5 p-4"
              style={{
                opacity: 0,
                transform: 'translateY(18px)',
                transition: REVEAL_TRANSITION_FAST,
                transitionDelay: `${i}00ms`,
              }}
            >
              <span className="font-station-display text-[22px] font-extrabold" style={{ color: c.color }}>
                {c.k}
              </span>
              <span className="text-sm leading-[1.35] font-semibold">{c.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
