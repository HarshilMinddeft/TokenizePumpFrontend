import { useEffect, useRef, useState } from 'react';
// landing.css is loaded globally via src/app/index.css (`@import
// '../features/landing/landing.css'`) so the Tailwind compiler actually
// processes its @theme/@utility blocks — see the comment there. No local
// import needed here.
import { LangProvider, useLang } from './context/LangContext';
import { StationBackgroundProvider, useStation } from './three/StationContext';
import StationBackground from './three/StationBackground';
import { useScrollChoreography } from './hooks/useScrollChoreography';
import Header from './components/Header';
import Hero from './components/Hero';
import Concept from './components/Concept';
import Structure from './components/Structure';
import StreamsIntro from './components/StreamsIntro';
import IncomeStreams from './components/IncomeStreams';
import OneDistribution from './components/OneDistribution';
import AdvantagesIntro from './components/AdvantagesIntro';
import Advantages from './components/Advantages';
import PlatformIntro from './components/PlatformIntro';
import PlatformFeatures from './components/PlatformFeatures';
import Footer from './components/Footer';
import Hud from './components/Hud';
import VareloLoader from './loader/VareloLoader';

function StationLandingInner() {
  const rootRef = useRef(null);
  const laserRef = useRef(null);
  const ringRef = useRef(null);
  const { lang, dir, zone, setZone, dashTab, setDash, dashPauseUntil, pauseDash } = useLang();
  const { ready, flyTo, frameRef } = useStation();
  // Preloader over the page until the 3D station's models are in.
  const [loading, setLoading] = useState(true);

  useScrollChoreography({
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
  });

  // Mirrors the original componentDidMount poll: once the iframe scene
  // signals ready, snap the camera to whatever zone we're currently on
  // (near-instant, ms=10) instead of waiting for the next scroll tick.
  useEffect(() => {
    if (ready) flyTo(zone, 10);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  return (
    <div ref={rootRef} dir={dir} lang={lang} className="station-landing">
      {loading && <VareloLoader frameRef={frameRef} onDone={() => setLoading(false)} />}
      <StationBackground />

      <div
        ref={laserRef}
        className="pointer-events-none fixed top-1/2 left-0 z-[4] h-0.5 rounded-sm"
        style={{ width: 0, transform: 'scaleX(0)', opacity: 0.95 }}
      >
        <span data-head="1" className="absolute -top-[3px] h-2 w-2 rounded-full bg-white" />
      </div>
      <div
        ref={ringRef}
        className="pointer-events-none fixed top-0 left-0 z-[4] h-[34px] w-[34px] rounded-full opacity-0"
        style={{ margin: '-17px 0 0 -17px' }}
      />

      <Header />
      <Hud />

      <main id="top" className="relative z-[5]">
        <Hero />
        <Concept />
        <Structure />
        <StreamsIntro />
        <IncomeStreams />
        <OneDistribution />
        <AdvantagesIntro />
        <Advantages />
        <PlatformIntro />
        <PlatformFeatures />
        <Footer />
      </main>
    </div>
  );
}

export default function StationLanding() {
  return (
    <StationBackgroundProvider>
      <LangProvider>
        <StationLandingInner />
      </LangProvider>
    </StationBackgroundProvider>
  );
}
