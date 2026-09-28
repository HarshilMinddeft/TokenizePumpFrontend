import { useStation, STATION_SRC } from './StationContext';

// Fixed full-screen 3D backdrop. Same iframe approach and same
// `pointer-events:none` + gradient-vignette overlay as the original
// prototype markup (`VARELO Tokenized Station.dc.html` lines 25-26).
export default function StationBackground() {
  const { frameRef } = useStation();

  return (
    <>
      <iframe
        ref={frameRef}
        src={STATION_SRC}
        title="3D fuel station"
        className="pointer-events-none fixed inset-0 z-0 h-full w-full border-0 bg-[#060b1f]"
      />
      <div className="pointer-events-none fixed inset-0 z-0 bg-[linear-gradient(180deg,rgba(20,14,8,.55)_0%,rgba(20,14,8,0)_18%,rgba(20,14,8,0)_72%,rgba(20,14,8,.7)_100%)]" />
    </>
  );
}
