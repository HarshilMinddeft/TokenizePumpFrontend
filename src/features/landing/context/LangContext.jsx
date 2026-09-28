import { createContext, useContext, useMemo, useState } from 'react';
import { EN } from '../content/en';
import { AR } from '../content/ar';
import { ZONES } from '../content/zones';
import { A, B, C } from '../content/colors';

const LangContext = createContext(null);

// side()/alt() reproduce the original DCLogic.renderVals() card-alternation
// logic verbatim: cards alternate which side of the viewport they sit on,
// and the `from` transform they animate in from is mirrored in RTL.
const alt = (start) => (i) => ((i % 2 === 0) === (start === 'R') ? 'R' : 'L');

function withSides(list, seq, ar) {
  return list.map((x, i) => {
    const R = seq(i) === 'R';
    return {
      ...x,
      just: R ? 'flex-end' : 'flex-start',
      from: 'translate3d(' + (R !== ar ? 70 : -70) + 'px,0,0)',
    };
  });
}

function buildAdv(t0, ar) {
  return withSides(t0.adv, alt('R'), ar).map((g) => ({
    ...g,
    isPlatform: g.variant === 'platform',
    rep: (g.rep || []).map((l, i, all) => {
      const y = 14 + (i * 142) / Math.max(1, all.length - 1);
      return {
        label: l,
        top: ((y / 170) * 100).toFixed(1) + '%',
        dot: i === all.length - 1 ? '#5ccf8e' : '#e3b766',
        path: 'M90,85 C140,85 130,' + y.toFixed(1) + ' 168,' + y.toFixed(1),
      };
    }),
    fees: g.fees || [],
    items: g.items.map((it, j, all) => ({
      ...it,
      n: String(j + 1).padStart(2, '0'),
      conn: j === all.length - 1 ? 'none' : 'block',
    })),
  }));
}

function buildFeatures(t0, ar) {
  return withSides(t0.features, alt('R'), ar).map((f) => ({
    ...f,
    isList: !f.variant,
    isToken: f.variant === 'token',
    isCycle: f.variant === 'cycle',
    isVault: f.variant === 'vault',
    isDash: f.variant === 'dash',
    frac: f.variant === 'vault' ? Array.from({ length: 36 }, (_, i) => i) : [],
    unlock0: f.unlock ? f.unlock[0] : '',
    unlock1: f.unlock ? f.unlock[1] : '',
    hub0: f.hub ? f.hub[0] : '',
    hub1: f.hub ? f.hub[1] : '',
    cnodes: (f.nodes || []).map((n, i) => {
      const a = -Math.PI / 2 + (i * 2 * Math.PI) / 3;
      return { ...n, x: (50 + 40 * Math.cos(a)).toFixed(1) + '%', y: (50 + 40 * Math.sin(a)).toFixed(1) + '%' };
    }),
  }));
}

function buildPcards(t0, ar) {
  return [...t0.streams.map((x) => ({ ...x, metric: '' })), ...t0.cParts.map((x) => ({ ...x, k: 'C', color: C }))].map(
    (x, i) => {
      const R = i % 2 === 0;
      const G = 'clamp(16px,6vw,96px)';
      const onRight = R !== ar;
      return {
        ...x,
        l: onRight ? 'auto' : G,
        r: onRight ? G : 'auto',
        off: (onRight ? 40 : -40) + 'px',
        side: R ? 'R' : 'L',
      };
    },
  );
}

function buildDash(t0, dashTab) {
  const fd = (t0.features.find((f) => f.variant === 'dash') || {}).d || {
    tabs: [],
    streams: [],
    metrics: [],
    docs: [],
  };
  const k = dashTab;
  const spark = (i) => {
    const pts = [0, 1, 2, 3, 4, 5, 6, 7].map((j) => [j * 15.5, 26 - (Math.sin(j * 0.9 + i * 1.7) * 8 + j * 1.6)]);
    return 'M' + pts.map((p) => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' L');
  };
  return {
    ...fd,
    t0: k === 0,
    t1: k === 1,
    t2: k === 2,
    t3: k === 3,
    t4: k === 4,
    tabs: fd.tabs.map((l, i) => ({
      label: l,
      fg: i === k ? '#060b1f' : '#cfd6e6',
      bg: i === k ? '#e3b766' : 'transparent',
      tabIndex: i,
    })),
    months: Array.from({ length: 12 }, (_, i) => ({
      h: (55 + 30 * Math.abs(Math.sin(i * 1.3 + 0.4))).toFixed(0) + '%',
    })),
    srows: fd.streams.map((n, i) => ({ k: 'ABC'[i], name: n, color: [A, B, C][i], w: ['92%', '68%', '46%'][i] })),
    mrows: fd.metrics.map((l, i) => ({ label: l, d: spark(i) })),
  };
}

export function LangProvider({ children, initialLang = 'en' }) {
  const [lang, setLang] = useState(initialLang);
  const [zone, setZone] = useState('hero');
  const [dashTab, setDashTabState] = useState(0);
  const [dashPauseUntil, setDashPauseUntil] = useState(0);

  const ar = lang === 'ar';
  const dir = ar ? 'rtl' : 'ltr';

  const value = useMemo(() => {
    const t0 = ar ? AR : EN;
    const t = {
      ...t0,
      adv: buildAdv(t0, ar),
      features: buildFeatures(t0, ar),
    };
    const z = ZONES[zone];
    const pcards = buildPcards(t0, ar);
    const pinH = (t0.streams.length + t0.cParts.length) * 100 + 'vh';
    const dash = buildDash(t0, dashTab);
    const legs = t0.streamsIntro.legs.map((l, i) => ({ ...l, color: [A, B, C][i] }));
    const ledgers = t0.combined.ledgers.map((l, i) => ({
      ...l,
      color: [A, B, C][i],
      path: 'M0,' + [52, 128, 204][i] + ' C34,' + [52, 128, 204][i] + ' 30,120 64,120',
    }));

    return {
      lang,
      dir,
      ar,
      t,
      pcards,
      pinH,
      dash,
      legs,
      ledgers,
      zone,
      setZone,
      hudLabel: z ? z[ar ? 1 : 0] : '',
      dashTab,
      dashPauseUntil,
      setDash: (i, manual) => {
        setDashTabState(i);
        if (manual) setDashPauseUntil(Date.now() + 9000);
      },
      // Pauses the 3.2s auto-advance without changing the active tab —
      // mirrors the original `this._dashPause = Date.now() + 3000` writes
      // that happen independently of `setDash()`.
      pauseDash: (ms) => setDashPauseUntil(Date.now() + ms),
      toggleLang: () => setLang((prev) => (prev === 'ar' ? 'en' : 'ar')),
    };
  }, [lang, ar, dir, zone, dashTab, dashPauseUntil]);

  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export function useLang() {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error('useLang must be used within a LangProvider');
  return ctx;
}
