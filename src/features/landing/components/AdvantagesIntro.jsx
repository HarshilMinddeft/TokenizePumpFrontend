import { useLang } from '../context/LangContext';

export default function AdvantagesIntro() {
  const { t } = useLang();

  return (
    <section
      id="advantages"
      data-zone="pylon"
      data-screen-label="Advantages intro"
      className="box-border flex min-h-[70vh] items-center px-4 py-[120px] sm:px-8 md:px-12 lg:px-[clamp(16px,6vw,96px)]"
    >
      <div className="flex max-w-[760px] flex-col gap-4">
        <div className="font-station-mono text-station-gold text-xs tracking-[.16em] uppercase [text-shadow:0_2px_12px_rgba(20,14,8,.9)]">
          {t.advIntro.kicker}
        </div>
        <h2 className="font-station-display m-0 text-[clamp(40px,5.6vw,80px)] leading-none font-extrabold tracking-[-.01em] text-balance [text-shadow:0_4px_40px_rgba(20,14,8,.8)]">
          {t.advIntro.title}
        </h2>
      </div>
    </section>
  );
}
