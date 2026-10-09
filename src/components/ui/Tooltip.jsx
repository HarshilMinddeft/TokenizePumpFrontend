import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../../lib/utils';

const GAP = 8;
const MARGIN = 8;

/**
 * Tooltip — shows `content` on hover or keyboard focus of `children`.
 *
 * Rendered into document.body with fixed positioning, so it isn't clipped by
 * scrolling containers (tables) or cards with overflow hidden. Prefers above
 * the trigger, flips below when there's no room, and stays inside the viewport.
 */
const Tooltip = ({ content, children, className = '', width = 280 }) => {
  const triggerRef = useRef(null);
  const tipRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState(null);

  const place = useCallback(() => {
    const trigger = triggerRef.current;
    const tip = tipRef.current;
    if (!trigger || !tip) return;
    const t = trigger.getBoundingClientRect();
    const h = tip.offsetHeight;
    const w = tip.offsetWidth;
    let top = t.top - h - GAP;
    if (top < MARGIN) top = t.bottom + GAP;
    let left = t.left + t.width / 2 - w / 2;
    left = Math.max(MARGIN, Math.min(left, window.innerWidth - w - MARGIN));
    setPos({ top, left });
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    place();
    window.addEventListener('scroll', place, true);
    window.addEventListener('resize', place);
    return () => {
      window.removeEventListener('scroll', place, true);
      window.removeEventListener('resize', place);
    };
  }, [open, place]);

  if (!content) return children;

  return (
    <>
      <span
        ref={triggerRef}
        tabIndex={0}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        className={cn('inline-flex cursor-help items-center outline-none', className)}
      >
        {children}
      </span>
      {open &&
        createPortal(
          <div
            ref={tipRef}
            role="tooltip"
            style={{ top: pos?.top ?? -9999, left: pos?.left ?? -9999, maxWidth: width }}
            className="animate-fade-in pointer-events-none fixed z-[100] rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2.5 text-left text-xs leading-relaxed font-normal tracking-normal whitespace-normal text-slate-200 normal-case shadow-xl dark:border-slate-600 dark:bg-slate-800"
          >
            {content}
          </div>,
          document.body,
        )}
    </>
  );
};

/** A small "?" that explains the field next to it. */
export const InfoTip = ({ content, className = '' }) => (
  <Tooltip content={content} className={cn('ml-1 align-middle', className)}>
    <span
      aria-label="How this is calculated"
      className="flex h-3.5 w-3.5 items-center justify-center rounded-full border border-slate-300 text-[9px] leading-none font-bold text-slate-400 transition-colors hover:border-indigo-400 hover:text-indigo-500 dark:border-slate-600 dark:text-slate-500 dark:hover:border-indigo-400 dark:hover:text-indigo-300"
    >
      ?
    </span>
  </Tooltip>
);

export default Tooltip;
