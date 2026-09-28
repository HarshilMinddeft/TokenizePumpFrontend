# Station 3D scene assets (Phase 1 — iframe embed)

These files back the `StationBackground` iframe (`src/features/landing/three/`)
and are served as-is by Vite from `public/`.

- `Station 3D Blueprint.html` — the three.js scene, embedded via
  `?embed=1`. Exposes `window.STATION_READY` and `window.flyToZone(key, ms)`.
- `three-d-stage.js` — the `<three-d-stage>` viewer web component the scene
  mounts into.
- `assets/logo.webp` — brand logo used on in-scene signage.
- `uploads/*.glb` — **not committed to git** (~82MB, listed in
  `.gitignore`). The scene fetches them at runtime and needs them present
  on disk, whether or not they're tracked in git. There is no longer a
  backup copy anywhere else in the repo (the original prototype export
  folder was deleted once this directory was confirmed working) — if these
  files are ever lost, they need to be re-sourced from wherever the
  original prototype export came from, or regenerated for the Phase 2
  model-compression pass.

This whole directory is a stand-in for the Phase 2 port (native `three` ES
modules + `GLTFLoader`, see the landing-page port plan) and the follow-up
model-compression pass (Draco/Meshopt via `@gltf-transform/cli`), after
which the compressed models are small enough to commit normally.
