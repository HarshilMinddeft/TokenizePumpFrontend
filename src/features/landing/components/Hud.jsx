import { useLang } from '../context/LangContext';
import { useStation } from '../three/StationContext';

// Bottom-right location pill. Shows "Loading 3D station…" until the iframe
// scene signals ready, then the current zone's label.
export default function Hud() {
  const { ar, hudLabel } = useLang();
  const { ready } = useStation();

  const label = !ready ? (ar ? 'جارٍ تحميل المحطة ثلاثية الأبعاد…' : 'Loading 3D station…') : hudLabel;

  return (
    <aside className="bg-station-panel font-station-mono text-station-body fixed end-4 bottom-[22px] z-[15] flex items-center gap-3 rounded-full border border-[rgba(227,183,102,.28)] px-4 py-2.5 text-xs tracking-[.06em] backdrop-blur-[10px] sm:end-8 md:end-12 lg:end-[clamp(16px,4vw,48px)]">
      <img src="/station/assets/logo.webp" alt="" className="block h-4 w-auto" />
      <span>{label}</span>
    </aside>
  );
}
