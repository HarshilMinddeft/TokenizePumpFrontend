import { useLang } from '../context/LangContext';

export default function Footer() {
  const { t } = useLang();

  return (
    <footer
      data-zone="hero"
      data-screen-label="Footer"
      className="box-border flex min-h-screen items-end px-4 pt-[120px] pb-[90px] sm:px-8 md:px-12 lg:px-[clamp(16px,6vw,96px)]"
      style={{ marginTop: '30vh' }}
    >
      <div className="flex w-[min(760px,100%)] flex-col gap-[18px]">
        <div className="flex items-center gap-3.5">
          <span className="font-station-display text-[40px] font-extrabold tracking-[.06em]">VARELO</span>
          <span className="font-station-sans text-station-sand text-[32px] font-bold">فاريلو</span>
        </div>
        <p className="font-station-display m-0 text-[clamp(24px,2.6vw,34px)] leading-[1.15] font-bold text-balance [text-shadow:0_2px_24px_rgba(20,14,8,.9)]">
          {t.footer.line}
        </p>
        <p className="panel text-station-muted m-0 max-w-[620px] px-4 py-3.5 text-[13px]">{t.footer.legal}</p>
      </div>
    </footer>
  );
}
