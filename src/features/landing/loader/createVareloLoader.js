/* VARELO loader controller (framework-free).
 * Three bars = three real milestones. Each bar "creeps" to 86% while waiting,
 * then snaps to 100% once its milestone() returns true (min 1.1 s per bar).
 * All motion = WAAPI transforms → runs on the compositor, so heavy model parsing can't stutter it.
 *
 * Usage:
 *   const loader = createVareloLoader(document.querySelector('.vl'), {
 *     milestones: [() => sceneBuilt, () => carsLoaded, () => parkLoaded],
 *     onDone: () => {...},           // called after the fade-out
 *     timeout: 45000                 // safety: force-complete after this
 *   });
 *   loader.force();                  // complete immediately
 */
export function createVareloLoader(root, { milestones, onDone, timeout = 45000 } = {}) {
  const bars = [...root.querySelectorAll('.vl-bar')], rows = [...root.querySelectorAll('.vl-row')];
  const tank = root.querySelector('.vl-tank'), pct = root.querySelector('.vl-pct'), tok = root.querySelector('.vl-tok');
  const CREEP = [2500, 9000, 6000], MIN_SEG = 1100;
  let seg = 0, segT = performance.now(), busy = false, forced = false, closing = false, raf = 0, fr = 0, lastTxt = '';

  const anim = (el, kind, from, to, dur, ease) => {
    if (!el) return null;
    el['_a' + kind]?.cancel();
    const f = kind === 's' ? v => `scaleX(${v})` : v => `translateY(${(1 - v) * 100}%)`;
    return (el['_a' + kind] = el.animate([{ transform: f(from) }, { transform: f(to) }], { duration: dur, easing: ease, fill: 'forwards' }));
  };
  const scaleOf = el => { const m = getComputedStyle(el).transform; return !m || m === 'none' ? 0 : parseFloat(m.slice(7)) || 0; };
  const fillOf = () => { const m = getComputedStyle(tank).transform, h = tank.offsetHeight || 1; const ty = m && m !== 'none' ? parseFloat(m.split(',')[5]) : h; return Math.max(0, Math.min(1, 1 - ty / h)); };
  const creep = i => { anim(bars[i], 's', 0, 0.86, CREEP[i], 'cubic-bezier(.2,.7,.3,1)'); anim(tank, 't', fillOf(), (i + 0.86) / 3, CREEP[i], 'cubic-bezier(.2,.7,.3,1)'); };
  const ready = i => { if (forced) return true; try { return !!milestones?.[i]?.(); } catch { return true; } };

  const close = () => {
    if (closing) return; closing = true; clearTimeout(safety);
    const finish = () => { cancelAnimationFrame(raf); root.style.opacity = '0'; root.style.pointerEvents = 'none'; document.documentElement.style.overflow = ''; requestAnimationFrame(() => requestAnimationFrame(() => onDone?.())); };
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return finish();
    root.style.pointerEvents = 'none';
    root.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 700, easing: 'cubic-bezier(.4,0,.2,1)', fill: 'forwards' }).onfinish = finish;
  };
  const step = () => {
    if (seg >= 3 || busy || performance.now() - segT < MIN_SEG || !ready(seg)) return;
    busy = true;
    const a = anim(bars[seg], 's', scaleOf(bars[seg]), 1, 650, 'cubic-bezier(.4,0,.2,1)');
    anim(tank, 't', fillOf(), (seg + 1) / 3, 650, 'cubic-bezier(.4,0,.2,1)');
    const next = () => {
      rows[seg]?.classList.add('is-done');
      seg++; busy = false; segT = performance.now();
      if (seg < 3) return creep(seg);
      root.classList.add('is-merged');
      setTimeout(close, 650);
    };
    a ? (a.onfinish = next) : next();
  };
  const tick = () => {
    if (closing) return;
    step();
    if (++fr % 2 === 0) { // text every other frame: cheap
      const t = (fillOf() * 100).toFixed(1).padStart(5, '0');
      if (t !== lastTxt) { pct.textContent = t; lastTxt = t; }
      tok.textContent = `${seg} / 3`;
    }
    raf = requestAnimationFrame(tick);
  };

  document.documentElement.style.overflow = 'hidden';
  creep(0);
  raf = requestAnimationFrame(tick);
  const safety = setTimeout(() => (forced = true), timeout);
  return { force: () => (forced = true), destroy: () => { cancelAnimationFrame(raf); clearTimeout(safety); document.documentElement.style.overflow = ''; } };
}
