import { useEffect, useState } from 'react';

/**
 * `top` for a sticky sidebar that may be taller than the viewport.
 *
 * Fits on screen → sticks `topGap` px below the top. Taller → the top offset
 * goes negative so the sidebar scrolls with the page until its bottom is
 * `bottomGap` px from the viewport's bottom, then sticks there — the whole
 * sidebar stays reachable without an inner scrollbar.
 *
 * The ref is a callback ref, so it also works for an element that mounts
 * later (e.g. after data loads).
 *
 * @returns {[(el: HTMLElement | null) => void, number]} ref for the sticky element, and its `top`
 */
const useStickyOffset = (topGap = 96, bottomGap = 24) => {
  const [el, ref] = useState(null);
  const [top, setTop] = useState(topGap);

  useEffect(() => {
    if (!el) return undefined;
    const update = () => setTop(Math.min(topGap, window.innerHeight - el.offsetHeight - bottomGap));
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    window.addEventListener('resize', update);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', update);
    };
  }, [el, topGap, bottomGap]);

  return [ref, top];
};

export default useStickyOffset;
