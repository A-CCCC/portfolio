// src/data/models.js
//
// Which Clash Royale pages have a model to turn around, where it is, and how
// to stand it up. A page not listed here shows no viewer. See
// public/models/README.md for how a file gets made.
//
// `turn` is in degrees about x, y, z, applied before anything else: an export
// that came out lying down (Blender and Fusion count z as up; glTF counts y)
// is stood up here rather than re-exported.
import asset from '../lib-asset'

// `tint` is which of the site's card tints the stage is lit in, picked to
// suit the model — the same numbers the home page's bubbles use.
const MODELS = {
  // From the animation files, via scripts/blend-to-glb.py: already the right way up
  'skeleton-barrel': { file: '/models/skeleton-barrel.glb', turn: [0, 90, 0], tint: 1 },
  'elixir-collector': { file: '/models/elixir-collector.glb', tint: 5 },
  // From a Fusion export, via scripts/fbx-to-glb.py: lying down until turned
  mortar: { file: '/models/mortar.glb', turn: [-90, 0, 0], tint: 6 },
  // 'cannon-cart': no export yet
}

export const modelFor = (page) => {
  const m = MODELS[page]
  return m ? { url: asset(m.file), turn: m.turn ?? [0, 0, 0], tint: m.tint ?? 1 } : null
}
