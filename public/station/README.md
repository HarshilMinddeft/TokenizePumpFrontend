# Station 3D scene assets (Phase 1 — iframe embed)

These files back the `StationBackground` iframe (`src/features/landing/three/`)
and are served as-is by Vite from `public/`.

- `Station 3D Blueprint.html` — the three.js scene, embedded via
  `?embed=1`. Exposes `window.STATION_READY` and `window.flyToZone(key, ms)`.
- `three-d-stage.js` — the `<three-d-stage>` viewer web component the scene
  mounts into.
- `assets/logo.webp` — brand logo used on in-scene signage.
- `models/*.glb` — the models the scene fetches at runtime (~27MB). These
  are the optimized versions and are committed; the original exports
  (~81MB) are not kept in the repo.

  To add or replace a model, put the original export in `models-src/station/`
  (git-ignored) and run

      npm run models:optimize

  which writes the optimized copy into `models/` (`scripts/optimize-models.mjs`).
  Don't re-run the optimizer on files already in `models/` — simplification
  is lossy, so it would degrade them a second time.

## Model optimization

The scene parses GLBs with its own loader (`loadGLB` in the HTML), not
three's `GLTFLoader`, and that loader has no Draco or Meshopt decoder. So the
optimizer only uses steps whose output stays a plain GLB it can read: merge
duplicate data and vertices, simplify the over-dense car meshes within a
small error bound, and shrink oversized textures (same image formats). The
script fails if its output would need anything that loader can't decode.

Measured against the originals (same scene, same camera zones, software
WebGL): models load ~38% faster, JS memory drops from 178MB to 132MB, and
triangles per frame fall 30–55% depending on the zone, with no visible
change in screenshots of any zone.

Draco/Meshopt would shrink the files further, but needs a decoder in the
loader — that's the Phase 2 port (native `three` ES modules + `GLTFLoader`).
