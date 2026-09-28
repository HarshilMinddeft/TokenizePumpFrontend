import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

const StationContext = createContext(null);

const STATION_SRC = '/station/Station 3D Blueprint.html?embed=1';

/**
 * Phase 1 of the 3D scene port: the scene still runs as a same-origin
 * iframe (`Station 3D Blueprint.html`, copied verbatim into
 * `public/station/`), exactly as the prototype embedded it. This component
 * polls for `window.STATION_READY` / `window.flyToZone` inside the iframe
 * (same polling the prototype's `componentDidMount` did) and re-exposes
 * `flyTo` / `setTimeOfDay` through React context so section components can
 * call them without reaching into the iframe directly.
 *
 * Phase 2 (a separate, later effort) replaces this iframe with a native
 * <canvas> scene built from the npm `three` package.
 */
export function StationBackgroundProvider({ children }) {
  const frameRef = useRef(null);
  const [ready, setReady] = useState(false);
  const flyTimerRef = useRef(null);

  useEffect(() => {
    const poll = setInterval(() => {
      const w = frameRef.current && frameRef.current.contentWindow;
      if (w && w.STATION_READY && w.flyToZone) {
        clearInterval(poll);
        setReady(true);
      }
    }, 400);
    return () => clearInterval(poll);
  }, []);

  const flyTo = useCallback((zoneKey, ms) => {
    const w = frameRef.current && frameRef.current.contentWindow;
    if (w && typeof w.flyToZone === 'function') {
      try {
        w.flyToZone(zoneKey, ms ?? 2200);
      } catch {
        // The iframe's scene may not be fully booted yet; ignore, the next
        // scroll tick will retry.
      }
    }
  }, []);

  // The prototype's Station 3D Blueprint.html never actually implements
  // `window.setTimeOfDay` (confirmed by inspection — it's not defined
  // anywhere in that file). This is guarded so the context has a stable API
  // to call today, and it will start working for free once the scene adds
  // that function (Phase 2 candidate), without callers needing to change.
  const setTimeOfDay = useCallback((mode) => {
    const w = frameRef.current && frameRef.current.contentWindow;
    if (w && typeof w.setTimeOfDay === 'function') {
      try {
        w.setTimeOfDay(mode);
      } catch {
        // ignore
      }
    }
  }, []);

  const value = { ready, flyTo, setTimeOfDay, frameRef, flyTimerRef };

  return <StationContext.Provider value={value}>{children}</StationContext.Provider>;
}

export function useStation() {
  const ctx = useContext(StationContext);
  if (!ctx) throw new Error('useStation must be used within a StationBackgroundProvider');
  return ctx;
}

export { STATION_SRC };
