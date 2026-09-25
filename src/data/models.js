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

const MODELS = {
  'skeleton-barrel': { file: '/models/skeleton-barrel.glb', turn: [-90, 0, 0] },
  mortar: { file: '/models/mortar.glb', turn: [-90, 0, 0] },
  // 'elixir-collector' and 'cannon-cart': no export yet
}

export const modelFor = (page) => {
  const m = MODELS[page]
  return m ? { url: asset(m.file), turn: m.turn ?? [0, 0, 0] } : null
}
