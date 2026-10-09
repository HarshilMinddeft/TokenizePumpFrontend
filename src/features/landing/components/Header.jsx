import { Link } from 'react-router-dom';
import { useLang } from '../context/LangContext';
import { ROUTES } from '../../../config/routes';

export default function Header() {
  const { t, toggleLang } = useLang();

  return (
    <header className="fixed inset-x-0 top-0 z-20 flex items-center justify-between gap-6 bg-[linear-gradient(180deg,rgba(20,14,8,.85),rgba(20,14,8,0))] px-4 py-[18px] sm:px-8 md:px-12 lg:px-[clamp(16px,4vw,48px)]">
      <a href="#top" className="text-station-ink flex items-center gap-2.5">
        <img src="/station/assets/logo.webp" alt="VARELO" className="block h-[34px] w-auto" />
        <span className="font-station-display text-[22px] font-extrabold tracking-[.06em]">VARELO</span>
        <span className="font-station-sans text-station-sand text-lg font-semibold">فاريلو</span>
      </a>
      <nav className="flex flex-wrap items-center justify-end gap-3 sm:gap-[clamp(12px,2.2vw,28px)]">
        {t.nav.map((n) => (
          <a key={n.href} href={n.href} className="text-station-body hover:text-station-gold text-sm font-medium">
            {n.label}
          </a>
        ))}
        <button
          type="button"
          onClick={toggleLang}
          className="font-station-mono text-station-sand flex items-center gap-2 rounded-full border border-[rgba(232,211,166,.45)] px-3.5 py-[7px] text-[13px] font-semibold hover:bg-[rgba(232,211,166,.12)]"
        >
          {t.langBtn}
        </button>
        <Link
          to={ROUTES.marketplace}
          className="bg-station-gold hover:bg-station-sand rounded-full px-4 py-[7px] text-[13px] font-semibold text-[#060b1f] hover:text-[#060b1f]"
        >
          {t.hero.cta1}
        </Link>
      </nav>
    </header>
  );
}
