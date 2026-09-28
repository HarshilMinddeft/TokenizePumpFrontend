import { useLang } from '../context/LangContext';

export default function Hero() {
  const { t } = useLang();

  return (
    <section
      data-zone="hero"
      data-screen-label="Hero"
      className="box-border flex min-h-screen items-end px-4 pt-[120px] pb-[110px] sm:px-8 md:px-12 lg:px-[clamp(16px,6vw,96px)]"
    >
      <div
        data-reveal="1"
        className="flex max-w-[760px] flex-col gap-[22px]"
        style={{
          opacity: 0,
          transform: 'translateY(30px)',
          transition: 'opacity .8s ease, transform .9s cubic-bezier(.2,.75,.2,1)',
        }}
      >
        <div className="flex">
          <span className="font-station-mono rounded-full border border-[rgba(227,183,102,.4)] bg-[rgba(26,20,14,.82)] px-3.5 py-2 text-[13px] tracking-[.18em] text-[#f2d9a6] uppercase backdrop-blur-[8px]">
            {t.hero.kicker}
          </span>
        </div>
        <h1 className="font-station-display m-0 text-[clamp(44px,7.2vw,104px)] leading-[.98] font-extrabold tracking-[-.02em] text-balance [text-shadow:0_4px_40px_rgba(20,14,8,.7)]">
          {t.hero.title}
        </h1>
        <p className="m-0 max-w-[600px] text-[clamp(17px,1.6vw,20px)] text-pretty text-[#dfe4ef] [text-shadow:0_2px_18px_rgba(20,14,8,.9)]">
          {t.hero.sub}
        </p>
        <div className="mt-1.5 flex flex-wrap gap-3">
          <a
            href="#structure"
            className="bg-station-gold hover:bg-station-sand rounded-full px-[22px] py-3.5 text-[15px] font-semibold text-[#060b1f] hover:text-[#060b1f]"
          >
            {t.hero.cta1}
          </a>
          <a
            href="#streams"
            className="text-station-ink hover:border-station-gold hover:text-station-gold rounded-full border border-[rgba(238,241,247,.5)] bg-[rgba(20,14,8,.5)] px-[22px] py-3.5 text-[15px] font-semibold"
          >
            {t.hero.cta2}
          </a>
        </div>
        <div className="text-station-muted mt-[18px] flex items-center gap-2.5 text-[13px]">
          <span className="animate-sahm-pulse inline-block">↓</span>
          <span>{t.hero.hint}</span>
        </div>
      </div>
    </section>
  );
}
