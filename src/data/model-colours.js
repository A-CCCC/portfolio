// src/data/model-colours.js
//
// How the snake game shows each model, keyed by its thumbnail's name:
//
//   colour — the one colour that stands for it. The snake grows by a block of
//            this for every model it eats.
//   crop   — where the model sits inside its picture, as fractions of the
//            whole. Thumbnails are cut-outs centred in a generous frame, which
//            is right on a card and a speck on a 40px square, so the game draws
//            this part of the picture rather than all of it.
//
// Written by scripts/model-colours.py from the thumbnails themselves — run that
// again when a render is replaced, rather than editing these by hand.
export const MODEL_LOOK = {
  'backup-camera-wiper': { colour: '#3d3d3d', crop: [0.165, 0.3814, 0.67, 0.2371] },
  'cannon-cart': { colour: '#8e714a', crop: [0.2371, 0.165, 0.525, 0.67] },
  'car-key-holder': { colour: '#3d3d3d', crop: [0.3371, 0.165, 0.325, 0.67] },
  'elixir-collector': { colour: '#b947e0', crop: [0.275, 0.165, 0.4493, 0.67] },
  'halloween-helmets': { colour: '#424337', crop: [0.165, 0.2057, 0.67, 0.5886] },
  'ketchup-extruder': { colour: '#aa110f', crop: [0.3543, 0.165, 0.2914, 0.67] },
  'modular-car-container': { colour: '#3d3d3d', crop: [0.165, 0.3579, 0.67, 0.2843] },
  'mortar': { colour: '#29547a', crop: [0.17, 0.165, 0.66, 0.67] },
  'rc-car-repair': { colour: '#d9283b', crop: [0.1645, 0.1974, 0.6701, 0.6052] },
  'skeleton-barrel': { colour: '#1089ed', crop: [0.2743, 0.165, 0.4514, 0.67] },
  'smart-kinesiology-tape': { colour: '#83c051', crop: [0.165, 0.3843, 0.67, 0.2314] },
  'sunglasses-holder': { colour: '#3d3d3d', crop: [0.365, 0.165, 0.2693, 0.67] },
  'the-log': { colour: '#a28256', crop: [0.165, 0.3204, 0.6699, 0.3592] },
  'wheelchair-storage': { colour: '#bcc0c0', crop: [0.165, 0.3386, 0.67, 0.3229] },
}
