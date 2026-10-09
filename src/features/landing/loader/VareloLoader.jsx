import { useEffect, useRef } from 'react';
import { createVareloLoader } from './createVareloLoader';
import './loader.css';

const ROWS = [
  { k: 'A', label: 'Land rent' },
  { k: 'B', label: 'Fuel income' },
  { k: 'C', label: 'Non-fuel profit' },
];

/**
 * The "fuelling" preloader shown over the landing page while the 3D station
 * loads (ported from the Claude Design handoff, markup and class names kept).
 * Its three bars track the iframe scene's own globals:
 *   A — STATION_READY: the station scene is built
 *   B — CARS_LOADED:   car models loaded (-1 = failed, still counts)
 *   C — PARK_LOADED:   workers + park loaded (skipped if the cars failed)
 * @param {{ current: HTMLIFrameElement | null }} frameRef the scene iframe
 * @param {() => void} onDone called once the loader has faded out
 */
const VareloLoader = ({ frameRef, onDone }) => {
  const rootRef = useRef(null);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  useEffect(() => {
    const scene = () => frameRef.current?.contentWindow;
    const loader = createVareloLoader(rootRef.current, {
      milestones: [
        () => scene()?.STATION_READY,
        () => scene()?.CARS_LOADED !== undefined,
        () => scene()?.PARK_LOADED !== undefined || scene()?.CARS_LOADED === -1,
      ],
      onDone: () => onDoneRef.current?.(),
    });
    return () => loader.destroy();
  }, [frameRef]);

  return (
    <div ref={rootRef} className="vl" role="status" aria-live="polite" aria-label="Loading VARELO">
      <div className="vl-grid" />
      <div className="vl-tank">
        <div className="vl-wave" />
        <div className="vl-surface" />
      </div>
      <div className="vl-card">
        <div className="vl-head">
          <div className="vl-brand">
            <img src="/logo.webp" alt="VARELO" />
            <span className="vl-word">VARELO</span>
          </div>
          <span className="vl-live vl-mono">
            <i />
            Live
          </span>
        </div>
        <div className="vl-pump">
          <div className="vl-pump-labels vl-mono">
            <span>Fuelling station</span>
            <span>% loaded</span>
          </div>
          <div className="vl-pump-row">
            <span className="vl-pct">000.0</span>
            <span className="vl-tok">0 / 3</span>
          </div>
        </div>
        <div className="vl-streams">
          {ROWS.map((r) => (
            <div key={r.k} className="vl-row" data-k={r.k}>
              <span className="vl-badge">{r.k}</span>
              <div className="vl-col">
                <span className="vl-label vl-mono">{r.label}</span>
                <div className="vl-track">
                  <div className="vl-bar" />
                </div>
              </div>
              <span className="vl-tick">✓</span>
            </div>
          ))}
        </div>
        <div className="vl-foot">
          <div className="vl-merge" />
          <span className="vl-one vl-mono">One distribution</span>
        </div>
      </div>
      <span className="vl-kicker vl-mono">The world&apos;s first tokenized fuel station</span>
    </div>
  );
};

export default VareloLoader;
