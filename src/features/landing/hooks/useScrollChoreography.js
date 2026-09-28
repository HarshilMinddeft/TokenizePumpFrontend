import { useEffect, useRef } from 'react';
import { A, B, C } from '../content/colors';

// Port of the DCLogic class's scroll-driven choreography from
// `VARELO Tokenized Station.dc.html`. Kept as direct DOM mutation against a
// single root ref, exactly like the original — these elements animate every
// scroll frame and are not React-state-driven, to avoid re-render thrashing
// and to preserve the exact Web Animations API code from the prototype.
//
// `laserRef`/`ringRef` are forwarded so the beam element (also inline-styled
// per-frame) can live as normal JSX while still being driven imperatively.
export function useScrollChoreography({
  rootRef,
  laserRef,
  ringRef,
  lang,
  flyTo,
  setZone,
  dashTab,
  setDash,
  dashPauseUntil,
  pauseDash,
}) {
  const pinIdxRef = useRef(undefined);
  const dimTimerRef = useRef(null);
  const dashSeenRef = useRef(false);
  const flyTimerRef = useRef(null);
  const rafRef = useRef(0);
  const pinLangRef = useRef(lang);
  const dashTabRef = useRef(dashTab);
  const setDashRef = useRef(setDash);
  const dashPauseUntilRef = useRef(dashPauseUntil);
  const pauseDashRef = useRef(pauseDash);
  const zoneRef = useRef(null);

  dashTabRef.current = dashTab;
  setDashRef.current = setDash;
  dashPauseUntilRef.current = dashPauseUntil;
  pauseDashRef.current = pauseDash;

  function reveal(r) {
    const vh = window.innerHeight;
    for (const el of r.querySelectorAll('[data-reveal]')) {
      const b = el.getBoundingClientRect();
      if (b.top < vh * 0.88 && b.bottom > vh * 0.08) {
        if (!el._shown) {
          el._shown = true;
          el.style.opacity = '1';
          el.style.transform = 'none';
        }
      } else if (el._shown && (b.top > vh * 1.05 || b.bottom < -vh * 0.05)) {
        el._shown = false;
        el.style.opacity = '';
        el.style.transform = '';
      }
    }
  }

  function pinState(r) {
    const pin = r.querySelector('[data-pin]');
    if (!pin) return null;
    const cards = [...pin.querySelectorAll('[data-pcard]')];
    const b = pin.getBoundingClientRect();
    const vh = window.innerHeight;
    const inside = b.top <= vh * 0.5 && b.bottom > vh * 0.5;
    const idx = inside ? Math.max(0, Math.min(cards.length - 1, Math.floor((vh * 0.5 - b.top) / vh))) : -1;
    return { cards, idx };
  }

  function fireLaser(from, to, prev, idx) {
    const L = laserRef.current;
    const ring = ringRef.current;
    if (!L) return;
    const W = window.innerWidth;
    const fx = from.offsetLeft + from.offsetWidth / 2 > W / 2;
    const tx = to.offsetLeft + to.offsetWidth / 2 > W / 2;
    const x0 = fx ? from.offsetLeft : from.offsetLeft + from.offsetWidth;
    const x1 = tx ? to.offsetLeft : to.offsetLeft + to.offsetWidth;
    const a = Math.min(x0, x1);
    const b = Math.max(x0, x1);
    const toRight = x1 > x0;
    if (b - a < 60) return;
    const y = window.innerHeight * 0.5;
    const cOf = (i) => (i === 0 ? A : i === 1 ? B : C);
    const c0 = cOf(prev);
    const c1 = cOf(idx);
    L.style.left = a + 'px';
    L.style.width = b - a + 'px';
    L.style.top = y + 'px';
    L.style.background = 'linear-gradient(' + (toRight ? 90 : 270) + 'deg,' + c0 + ',#fff8e6 50%,' + c1 + ')';
    L.style.boxShadow = '0 0 14px ' + c1 + ', 0 0 28px ' + c1 + '88';
    const hd = L.querySelector('[data-head]');
    hd.style.left = toRight ? 'auto' : '-4px';
    hd.style.right = toRight ? '-4px' : 'auto';
    hd.style.boxShadow = '0 0 12px ' + c1 + ',0 0 24px ' + c1;
    const o1 = toRight ? 'left' : 'right';
    const o2 = toRight ? 'right' : 'left';
    L.getAnimations().forEach((an) => an.cancel());
    L.animate(
      [
        { transform: 'scaleX(0)', transformOrigin: o1 },
        { transform: 'scaleX(1)', transformOrigin: o1, offset: 0.5 },
        { transform: 'scaleX(1)', transformOrigin: o2, offset: 0.501 },
        { transform: 'scaleX(0)', transformOrigin: o2 },
      ],
      { duration: 1100, easing: 'cubic-bezier(.65,0,.35,1)' },
    );
    if (ring) {
      ring.style.left = x1 + 'px';
      ring.style.top = y + 'px';
      ring.style.border = '1.5px solid ' + c1;
      ring.style.boxShadow = '0 0 16px ' + c1;
      ring.getAnimations().forEach((an) => an.cancel());
      ring.animate(
        [
          { opacity: 0, transform: 'scale(.3)' },
          { opacity: 1, transform: 'scale(1)', offset: 0.35 },
          { opacity: 0, transform: 'scale(1.9)' },
        ],
        { duration: 900, delay: 500, easing: 'ease-out' },
      );
    }
  }

  function laserCheck(r) {
    const ps = pinState(r);
    if (!ps) return;
    const { cards, idx } = ps;
    if (idx === pinIdxRef.current) return;
    const prev = pinIdxRef.current;
    pinIdxRef.current = idx;
    clearTimeout(dimTimerRef.current);
    cards.forEach((el, i) => {
      if (i === idx) {
        el.style.transitionDelay = prev >= 0 ? '.5s' : '0s';
        el.style.opacity = '1';
        el.style.transform = 'translateY(-50%)';
      } else if (i === prev && idx >= 0) {
        el.style.transitionDelay = '0s';
        el.style.opacity = '.28';
        el.style.transform = 'translateY(-50%) scale(.97)';
      } else {
        el.style.transitionDelay = '0s';
        el.style.opacity = '0';
      }
    });
    if (idx >= 0 && prev >= 0) {
      fireLaser(cards[prev], cards[idx], prev, idx);
      dimTimerRef.current = setTimeout(() => {
        if (pinIdxRef.current === idx && cards[prev]) cards[prev].style.opacity = '0';
      }, 1300);
    }
  }

  function steps(r) {
    const vh = window.innerHeight;
    r.querySelectorAll('ol').forEach((ol) => {
      const dots = [...ol.querySelectorAll('[data-dot]')];
      if (!dots.length) return;
      const conns = [...ol.querySelectorAll('[data-conn]')];
      const bb = ol.getBoundingClientRect();
      const vis = bb.top < vh * 0.8 && bb.bottom > vh * 0.2;
      if (vis && !ol._run) {
        ol._run = true;
        ol._t = [];
        const STEP = 200;
        dots.forEach((d, i) => {
          ol._t.push(
            setTimeout(
              () => {
                d.style.borderColor = '#ffe3a8';
                d.style.color = '#fff3d6';
                d.style.boxShadow =
                  '0 0 10px #e3b766, 0 0 22px rgba(227,183,102,.6), inset 0 0 8px rgba(227,183,102,.45)';
              },
              500 + i * 2 * STEP,
            ),
          );
          if (conns[i])
            ol._t.push(
              setTimeout(
                () => {
                  conns[i].firstChild.style.height = '100%';
                },
                500 + (i * 2 + 1) * STEP,
              ),
            );
        });
      } else if (!vis && ol._run) {
        ol._run = false;
        (ol._t || []).forEach(clearTimeout);
        dots.forEach((d) => {
          d.style.borderColor = '';
          d.style.color = '';
          d.style.boxShadow = '';
        });
        conns.forEach((c) => {
          c.firstChild.style.height = '0';
        });
      }
    });
  }

  function loops(r) {
    const glow = [
      { boxShadow: '0 0 0 rgba(227,183,102,0)', borderColor: 'rgba(227,183,102,.4)' },
      { boxShadow: '0 0 16px #e3b766, 0 0 30px rgba(227,183,102,.5)', borderColor: '#ffe3a8', offset: 0.12 },
      { boxShadow: '0 0 0 rgba(227,183,102,0)', borderColor: 'rgba(227,183,102,.4)', offset: 0.3 },
    ];
    r.querySelectorAll('[data-pulse]').forEach((el) => {
      if (el._a) return;
      el._a = el.animate(
        [
          { left: '12.5%', opacity: 0 },
          { opacity: 1, offset: 0.06 },
          { left: '87.5%', opacity: 1, offset: 0.9 },
          { left: '87.5%', opacity: 0 },
        ],
        { duration: 3200, iterations: Infinity, easing: 'linear' },
      );
    });
    r.querySelectorAll('[data-pnode]').forEach((el) => {
      if (el._a) return;
      const i = +el.getAttribute('data-pnode');
      el._a = el.animate(glow, { duration: 3200, iterations: Infinity, delay: 3200 * (0.06 + i * 0.28) });
    });
    r.querySelectorAll('[data-spin]').forEach((el) => {
      if (el._a) return;
      const d = +el.getAttribute('data-spin');
      el._a = el.animate([{ transform: 'rotate(0deg)' }, { transform: 'rotate(' + 360 * d + 'deg)' }], {
        duration: d > 0 ? 18000 : 11000,
        iterations: Infinity,
      });
    });
    r.querySelectorAll('[data-vcore]').forEach((el) => {
      if (el._a) return;
      el._a = el.animate(
        [
          { boxShadow: '0 0 0 rgba(227,183,102,0)' },
          { boxShadow: '0 0 22px rgba(227,183,102,.55)' },
          { boxShadow: '0 0 0 rgba(227,183,102,0)' },
        ],
        { duration: 2800, iterations: Infinity, easing: 'ease-in-out' },
      );
    });
    r.querySelectorAll('[data-flow]').forEach((el) => {
      if (el._a) return;
      el._a = el.animate([{ strokeDashoffset: 40 }, { strokeDashoffset: 0 }], {
        duration: 900,
        iterations: Infinity,
        easing: 'linear',
      });
    });
    r.querySelectorAll('[data-onedist]').forEach((el) => {
      if (el._a) return;
      el._a = el.animate(
        [
          { boxShadow: '0 0 0 rgba(227,183,102,0)' },
          { boxShadow: '0 0 26px rgba(227,183,102,.45)' },
          { boxShadow: '0 0 0 rgba(227,183,102,0)' },
        ],
        { duration: 2400, iterations: Infinity, easing: 'ease-in-out' },
      );
    });
    r.querySelectorAll('[data-orbit]').forEach((el) => {
      if (el._a) return;
      el._a = el.animate([{ transform: 'rotate(0deg)' }, { transform: 'rotate(360deg)' }], {
        duration: 7200,
        iterations: Infinity,
        easing: 'linear',
      });
    });
    r.querySelectorAll('[data-cnode]').forEach((el) => {
      if (el._a) return;
      const i = +el.getAttribute('data-cnode');
      el._a = el.animate(glow, { duration: 7200, iterations: Infinity, delay: (7200 * i) / 3 });
    });
  }

  function once(r) {
    const org = r.querySelector('[data-reporigin]');
    if (org) {
      const b = org.getBoundingClientRect();
      const on = b.top < window.innerHeight * 0.85 && b.bottom > 0;
      if (on && !org._on) {
        org._on = true;
        const e = 'cubic-bezier(.2,.75,.2,1)';
        org.animate(
          [
            { boxShadow: '0 0 0 rgba(227,183,102,0)' },
            { boxShadow: '0 0 24px rgba(227,183,102,.55)' },
            { boxShadow: '0 0 0 rgba(227,183,102,0)' },
          ],
          { duration: 2400, iterations: Infinity },
        );
        r.querySelectorAll('[data-repline]').forEach((el) => {
          const i = +el.getAttribute('data-repline');
          el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 400, delay: 300 + i * 380, fill: 'forwards' });
          el.animate([{ strokeDashoffset: 24 }, { strokeDashoffset: 0 }], { duration: 800, iterations: Infinity });
        });
        r.querySelectorAll('[data-repnode]').forEach((el) => {
          const i = +el.getAttribute('data-repnode');
          el.animate(
            [
              { opacity: 0, transform: 'translate(-24px,-50%) scale(.9)' },
              { opacity: 1, transform: 'translate(0,-50%) scale(1)' },
            ],
            { duration: 500, delay: 550 + i * 380, easing: e, fill: 'forwards' },
          );
        });
        r.querySelectorAll('[data-fee]').forEach((el) => {
          const i = +el.getAttribute('data-fee');
          el.animate(
            [
              { borderColor: 'rgba(227,183,102,.25)', boxShadow: '0 0 0 rgba(227,183,102,0)' },
              { borderColor: '#e3b766', boxShadow: '0 0 14px rgba(227,183,102,.45)', offset: 0.12 },
              { borderColor: 'rgba(227,183,102,.25)', boxShadow: '0 0 0 rgba(227,183,102,0)', offset: 0.3 },
            ],
            { duration: 3600, delay: 2400 + i * 900, iterations: Infinity },
          );
        });
      } else if (!on && org._on) {
        org._on = false;
        [org, ...r.querySelectorAll('[data-repline],[data-repnode],[data-fee]')].forEach((el) =>
          el.getAnimations().forEach((a) => a.cancel()),
        );
      }
    }
    const legs = [...r.querySelectorAll('[data-leg]')];
    if (legs.length) {
      const b = legs[0].getBoundingClientRect();
      const on = b.top < window.innerHeight * 0.9 && b.bottom > 0;
      if (on && !legs[0]._on) {
        legs.forEach((el, i) => {
          el._on = true;
          el.getAnimations().forEach((a) => a.cancel());
          el.animate([{ transform: 'scaleY(0)' }, { transform: 'scaleY(1)' }], {
            duration: 700,
            delay: 200 + i * 220,
            easing: 'cubic-bezier(.2,.75,.2,1)',
            fill: 'forwards',
          })
            .finished.then(() => {
              if (!el._on) return;
              el.animate(
                [
                  { transform: 'scaleY(1)', opacity: 1 },
                  { transform: 'scaleY(1)', opacity: 1, offset: 0.1 },
                  { transform: 'scaleY(.55)', opacity: 0.55, offset: 0.2 },
                  { transform: 'scaleY(.55)', opacity: 0.55, offset: 0.28 },
                  { transform: 'scaleY(1)', opacity: 1, offset: 0.38 },
                  { transform: 'scaleY(1)', opacity: 1 },
                ],
                { duration: 6600, delay: i * 2200, iterations: Infinity, easing: 'ease-in-out' },
              );
            })
            .catch(() => {});
        });
      } else if (!on && legs[0]._on) {
        legs.forEach((el) => {
          el._on = false;
          el.getAnimations().forEach((a) => a.cancel());
          el.style.transform = 'scaleY(0)';
        });
      }
    }
    const pl = r.querySelector('[data-plat]');
    if (pl && !pl._a) {
      pl._a = pl.animate(
        [
          { boxShadow: '0 0 0 rgba(227,183,102,0)' },
          { boxShadow: '0 0 22px rgba(227,183,102,.45)' },
          { boxShadow: '0 0 0 rgba(227,183,102,0)' },
        ],
        { duration: 2200, iterations: Infinity },
      );
    }
    const vh = window.innerHeight;
    const vis = (el) => {
      const b = el.getBoundingClientRect();
      return b.top < vh * 0.85 && b.bottom > vh * 0.15;
    };
    const fr = [...r.querySelectorAll('[data-frac]')];
    if (fr.length) {
      const on = vis(fr[0].parentElement);
      if (on && !fr[0]._on) {
        fr.forEach((el, i) => {
          el._on = true;
          el._t = setTimeout(
            () => {
              el.style.transition = 'background .3s ease, box-shadow .3s ease';
              el.style.background = '#e3b766';
              el.style.boxShadow = '0 0 6px rgba(227,183,102,.7)';
            },
            300 + i * 35,
          );
        });
      } else if (!on && fr[0]._on) {
        fr.forEach((el) => {
          el._on = false;
          clearTimeout(el._t);
          el.style.background = '';
          el.style.boxShadow = '';
        });
      }
    }
    const lg = [...r.querySelectorAll('[data-ledger]')];
    if (lg.length) {
      const on = vis(lg[0].closest('div'));
      lg.forEach((el, i) => {
        if (on && !el._on) {
          el._on = true;
          el.style.transition = 'width 1s cubic-bezier(.2,.75,.2,1) ' + (0.2 + i * 0.25) + 's';
          el.style.width = '100%';
        } else if (!on && el._on) {
          el._on = false;
          el.style.transition = 'none';
          el.style.width = '0';
        }
      });
    }
  }

  function dashAnim(r) {
    const e = 'cubic-bezier(.2,.75,.2,1)';
    r.querySelectorAll('[data-dbar]').forEach((el, i) =>
      el.animate([{ transform: 'scaleY(0)' }, { transform: 'scaleY(1)' }], {
        duration: 600,
        delay: i * 45,
        easing: e,
        fill: 'forwards',
      }),
    );
    r.querySelectorAll('[data-sbar]').forEach((el, i) =>
      el.animate([{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }], {
        duration: 900,
        delay: 100 + i * 180,
        easing: e,
        fill: 'forwards',
      }),
    );
    r.querySelectorAll('[data-spark]').forEach((el, i) => {
      const L = el.getTotalLength();
      el.style.strokeDasharray = L;
      el.animate([{ strokeDashoffset: L }, { strokeDashoffset: 0 }], {
        duration: 1000,
        delay: i * 150,
        easing: e,
        fill: 'forwards',
      });
    });
    r.querySelectorAll('[data-drow]').forEach((el, i) =>
      el.animate(
        [
          { opacity: 0, transform: 'translateY(8px)' },
          { opacity: 1, transform: 'none' },
        ],
        { duration: 450, delay: i * 120, easing: e, fill: 'forwards' },
      ),
    );
    r.querySelectorAll('[data-stmt]').forEach((el) =>
      el.animate(
        [
          { transform: 'translateY(14px) rotate(-4deg)', opacity: 0 },
          { transform: 'none', opacity: 1 },
        ],
        { duration: 600, easing: e, fill: 'forwards' },
      ),
    );
    const pg = r.querySelector('[data-dashprog]');
    if (pg) {
      pg.getAnimations().forEach((a) => a.cancel());
      pg.animate([{ width: '0%' }, { width: '100%' }], { duration: 3200, easing: 'linear', fill: 'forwards' });
    }
  }

  function pick(r, flyToFn) {
    reveal(r);
    laserCheck(r);
    steps(r);
    loops(r);
    once(r);
    {
      const pg = r.querySelector('[data-dashprog]');
      if (pg) {
        const b = pg.getBoundingClientRect();
        const on = b.bottom > 0 && b.top < window.innerHeight * 0.9;
        if (on && !dashSeenRef.current) {
          dashSeenRef.current = true;
          pauseDashRef.current(3000);
          if (dashTabRef.current !== 0) setDashRef.current(0);
          else dashAnim(r);
        } else if (!on && dashSeenRef.current) {
          dashSeenRef.current = false;
        }
      }
    }
    const mid = window.innerHeight * 0.5;
    let k = null;
    for (const el of r.querySelectorAll('[data-zone]')) {
      const b = el.getBoundingClientRect();
      if (b.top <= mid && b.bottom > mid) {
        k = el.dataset.zone;
        break;
      }
    }
    if (!k) {
      const ps = pinState(r);
      if (ps && ps.idx >= 0) k = ps.cards[ps.idx].getAttribute('data-pcard');
    }
    if (!k || k === zoneRef.current) return;
    zoneRef.current = k;
    clearTimeout(flyTimerRef.current);
    flyTimerRef.current = setTimeout(() => flyToFn(k), 120);
  }

  const flyToRef = useRef(flyTo);
  flyToRef.current = flyTo;
  const setZoneRef = useRef(setZone);
  setZoneRef.current = setZone;

  useEffect(() => {
    const r = rootRef.current;
    if (!r) return undefined;

    const onScroll = () => {
      if (rafRef.current) return;
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = 0;
        pick(r, (k) => {
          setZoneRef.current(k);
          flyToRef.current(k);
        });
      });
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    onScroll();
    const settleTimer = setTimeout(onScroll, 900);

    const dashInterval = setInterval(() => {
      if (Date.now() < dashPauseUntilRef.current) return;
      const panel = r.querySelector('[data-dashprog]');
      if (!panel) return;
      const b = panel.getBoundingClientRect();
      if (b.bottom < 0 || b.top > window.innerHeight) return;
      setDashRef.current((dashTabRef.current + 1) % 5);
    }, 3200);

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      clearTimeout(settleTimer);
      clearInterval(dashInterval);
      clearTimeout(flyTimerRef.current);
      clearTimeout(dimTimerRef.current);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rootRef]);

  // Re-run reveal+loops after a language toggle, and reset the laser index so
  // it doesn't fire a spurious beam across the swap (mirrors
  // componentDidUpdate's `_pinLang` guard).
  useEffect(() => {
    const r = rootRef.current;
    if (!r) return;
    requestAnimationFrame(() => {
      reveal(r);
      loops(r);
      if (pinLangRef.current !== lang) {
        pinLangRef.current = lang;
        pinIdxRef.current = undefined;
        laserCheck(r);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  // Re-run the dashboard tab animations whenever the active tab changes
  // (mirrors setDash()'s callback into dashAnim()).
  useEffect(() => {
    const r = rootRef.current;
    if (!r) return;
    dashAnim(r);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dashTab]);
}
