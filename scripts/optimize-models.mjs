/**
 * Optimize the 3D station's GLB models.
 *
 *   npm run models:optimize                      # models-src/station -> public/station/models
 *   node scripts/optimize-models.mjs <in> <out>  # custom directories
 *
 * The station scene (public/station/Station 3D Blueprint.html) parses GLBs
 * with its own hand-written loader, not three's GLTFLoader. That loader reads
 * raw accessor bytes (any component type, including normalized integers) and
 * core `texture.source` images (png/jpeg/webp) — but it has no Draco or
 * Meshopt decoder and ignores EXT_texture_webp. So this pipeline only uses
 * steps whose output stays a plain glTF that loader can read:
 *
 *   dedup / prune / weld   drop duplicate data and merge identical vertices
 *   simplify               meshoptimizer simplification of over-dense meshes
 *                          (the cars ship with 70k–600k vertices but are
 *                          ~150px wide on screen at the closest camera zone)
 *   textureCompress        resize oversized textures, re-encode in the same
 *                          format (no format change, so no new extension)
 *
 * A check at the end fails the run if the output uses anything that loader
 * can't read.
 */
import fs from 'node:fs';
import path from 'node:path';
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { dedup, prune, weld, simplify, textureCompress } from '@gltf-transform/functions';
import { MeshoptSimplifier } from 'meshoptimizer';
import sharp from 'sharp';

const IN_DIR = path.resolve(process.argv[2] || 'models-src/station');
const OUT_DIR = path.resolve(process.argv[3] || 'public/station/models');

/*
 * Per-model settings. `ratio` is the target fraction of vertices to keep;
 * `error` caps how far the simplified surface may deviate (as a fraction of
 * the mesh's size), so simplification stops early wherever it would start to
 * visibly change the shape. `maxTexture` is the largest texture edge in px.
 */
const DEFAULTS = { ratio: 0.12, error: 0.0015, maxTexture: 512 };
const MODELS = {
  'park_facility_asset.glb': { ratio: 0.35, error: 0.001, maxTexture: 1024 }, // seen large in the park zone
  'worker_apl.glb': { ratio: 0.5, error: 0.001, maxTexture: 512 }, // already light geometry
  'EVCar_ready.glb': { ratio: 0.3 },
};

const IMAGE_EXTENSIONS = ['EXT_texture_webp', 'EXT_texture_avif', 'KHR_texture_basisu'];

// Features the scene's custom loader cannot decode.
const UNSUPPORTED = ['EXT_meshopt_compression', 'KHR_draco_mesh_compression', 'EXT_texture_webp', 'KHR_texture_basisu'];

const mb = (n) => (n / 1048576).toFixed(2) + ' MB';

async function main() {
  if (!fs.existsSync(IN_DIR)) {
    console.error(`Source directory not found: ${IN_DIR}`);
    console.error('Put the original (unoptimized) GLB exports there first.');
    process.exit(1);
  }
  // Simplification is lossy: never re-optimize the already-optimized models
  // in place.
  if (IN_DIR === OUT_DIR) {
    console.error('Input and output directories are the same; refusing to re-optimize optimized models.');
    process.exit(1);
  }
  fs.mkdirSync(OUT_DIR, { recursive: true });
  await MeshoptSimplifier.ready;

  const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
  const files = fs.readdirSync(IN_DIR).filter((f) => f.toLowerCase().endsWith('.glb')).sort();
  let totalIn = 0;
  let totalOut = 0;

  for (const file of files) {
    const cfg = { ...DEFAULTS, ...MODELS[file] };
    const src = path.join(IN_DIR, file);
    const dst = path.join(OUT_DIR, file);
    const doc = await io.read(src);

    const vertsBefore = countVertices(doc);
    await doc.transform(
      dedup(),
      prune(),
      weld(),
      simplify({ simplifier: MeshoptSimplifier, ratio: cfg.ratio, error: cfg.error }),
      textureCompress({ encoder: sharp, resize: [cfg.maxTexture, cfg.maxTexture], quality: 82 }),
      prune(),
    );
    // With EXT_texture_webp in use, gltf-transform writes WebP textures into
    // the extension instead of the core `texture.source`, which the station
    // loader never reads. The source files keep WebP in the core field (the
    // loader decodes it by mimeType), so drop the extension before writing
    // to preserve that. (It stays registered above because textureCompress
    // needs it to read WebP image sizes.)
    for (const ext of doc.getRoot().listExtensionsUsed())
      if (IMAGE_EXTENSIONS.includes(ext.extensionName)) ext.dispose();
    const vertsAfter = countVertices(doc);

    await io.write(dst, doc);
    assertLoaderCompatible(dst);

    const sizeIn = fs.statSync(src).size;
    const sizeOut = fs.statSync(dst).size;
    totalIn += sizeIn;
    totalOut += sizeOut;
    console.log(
      `${file.padEnd(52)} ${mb(sizeIn).padStart(9)} -> ${mb(sizeOut).padStart(9)}` +
        `   vertices ${vertsBefore.toLocaleString()} -> ${vertsAfter.toLocaleString()}`,
    );
  }

  console.log(`${'TOTAL'.padEnd(52)} ${mb(totalIn).padStart(9)} -> ${mb(totalOut).padStart(9)}`);
}

function countVertices(doc) {
  let n = 0;
  for (const mesh of doc.getRoot().listMeshes())
    for (const prim of mesh.listPrimitives()) n += prim.getAttribute('POSITION')?.getCount() || 0;
  return n;
}

// Re-read the written GLB's JSON chunk and fail loudly if it relies on
// anything the station scene's loader can't handle.
function assertLoaderCompatible(file) {
  const buf = fs.readFileSync(file);
  const len = buf.readUInt32LE(12);
  const json = JSON.parse(buf.subarray(20, 20 + len).toString('utf8'));
  const used = [...(json.extensionsUsed || []), ...(json.extensionsRequired || [])];
  const bad = used.filter((e) => UNSUPPORTED.includes(e));
  const sourceless = (json.textures || []).filter((t) => t.source == null).length;
  if (bad.length || sourceless) {
    throw new Error(
      `${path.basename(file)} is not readable by the station loader: ` +
        `${bad.length ? 'uses ' + bad.join(', ') : ''}${sourceless ? ` ${sourceless} texture(s) without a core source` : ''}`,
    );
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
