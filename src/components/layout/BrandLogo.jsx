/**
 * VARELO lockup shared by the sidebar and the public top bar — the same
 * mark and bilingual wordmark as the landing page header. The mark sits in a
 * slowly turning gold ring, echoing the landing page's vault animation.
 */
const BrandLogo = () => (
  <div className="flex items-center gap-2.5">
    <span className="relative flex h-9 w-9 items-center justify-center">
      <span
        aria-hidden="true"
        className="animate-spin-slow absolute inset-0 rounded-xl bg-[conic-gradient(from_0deg,transparent_0%,var(--tf-indigo-400)_25%,transparent_45%,var(--tf-violet-400)_70%,transparent_90%)] opacity-70"
      />
      <span className="absolute inset-[1.5px] rounded-[10px] bg-white dark:bg-slate-900" />
      <img src="/logoD.webp" className="relative h-6 w-6 object-contain" alt="VARELO logo" />
    </span>
    <span className="flex items-baseline gap-1.5">
      <span className="font-display text-[18px] font-extrabold tracking-[0.06em] text-slate-900 dark:text-white">
        VARELO
      </span>
      <span className="text-[13px] font-semibold text-indigo-600 dark:text-indigo-200">فاريلو</span>
    </span>
  </div>
);

export default BrandLogo;
