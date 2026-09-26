// src/data/projects.js
//
// Single source of truth for every project's label, route and thumbnail.
// The category carousels and the home-page bubbles both read from here, so a
// thumbnail added below shows up in both places — set `image` once.
//
// Add `photo: true` when a thumbnail is a photograph with its background still
// in place. The bubble then fades the image out at the edges instead of cutting
// a hard disc out of it. Cut-out renders should leave the flag off.

import asset from '../lib-asset'

export const clashRoyale = [
  { label: 'Skeleton Barrel', path: '/projects/clash-royale/skeleton-barrel', image: asset('/thumbnails/skeleton-barrel.webp') },
  { label: 'Elixir Collector', path: '/projects/clash-royale/elixir-collector', image: asset('/thumbnails/elixir-collector.webp') },
  { label: 'Cannon Cart', path: '/projects/clash-royale/cannon-cart', image: asset('/thumbnails/cannon-cart.webp') },
  { label: 'Mortar', path: '/projects/clash-royale/mortar', image: asset('/thumbnails/mortar.webp') },
  /* The Log is held back for now — a simple model that is hard to present
   alongside the others. Everything it needs is still here: uncomment the four
   lines marked "the-log" (here, App.jsx, Navbar.jsx and ProjectBubbles.jsx) and
   it is back, page, thumbnail and description included.
  the-log: */
  // { label: 'The Log', path: '/projects/clash-royale/the-log', image: asset('/thumbnails/the-log.webp') },
]

export const accessibility = [
  { label: 'Wheelchair Storage', path: '/solutions/accessibility/wheelchair-storage', image: asset('/thumbnails/wheelchair-storage.webp') },
  { label: 'Smart Kinesiology Tape', path: '/solutions/accessibility/smart-kinesiology-tape', image: asset('/thumbnails/smart-kinesiology-tape.webp') },
]

export const convenience = [
  { label: 'Backup Camera Wiper', path: '/solutions/convenience/backup-camera-wiper', image: asset('/thumbnails/backup-camera-wiper.webp') },
  { label: 'Modular Car Container', path: '/solutions/convenience/modular-car-container', image: asset('/thumbnails/modular-car-container.webp') },
  { label: 'Sunglasses Holder', path: '/solutions/convenience/sunglasses-holder', image: asset('/thumbnails/sunglasses-holder.webp') },
  { label: 'Car Key Holder', path: '/solutions/convenience/car-key-holder', image: asset('/thumbnails/car-key-holder.webp') },
  { label: 'Ketchup Extruder', path: '/solutions/convenience/ketchup-extruder', image: asset('/thumbnails/ketchup-extruder.webp') },
]

export const halloween = [
  { label: 'Darth Vader', path: '/projects/halloween/darth-vader', image: asset('/thumbnails/darth-vader.webp') },
  // No thumbnails yet: the cards say so. When there is a render, run
  // scripts/make-thumbnail.py on it and put the path here.
  { label: 'Stormtrooper', path: '/projects/halloween/stormtrooper', image: undefined },
  { label: 'Scout Trooper', path: '/projects/halloween/scout-trooper', image: undefined },
  { label: 'Electrobinoculars', path: '/projects/halloween/electrobinoculars', image: undefined },
  { label: 'Lightsaber', path: '/projects/halloween/lightsaber', image: undefined },
  { label: 'Minecraft', path: '/projects/halloween/minecraft', image: undefined },
]

export const misc = [
  { label: 'RC Car Repair', path: '/projects/misc/rc-car-repair', image: asset('/thumbnails/rc-car-repair.webp') },
]

// The projects the home-page bubbles draw on by quota. Halloween and
// Miscellaneous are not in here because they have no quota — ProjectBubbles
// adds them to the leftover slots separately, capped at one per draw.
export const bubbleProjects = [...clashRoyale, ...accessibility, ...convenience]

// The project the home page puts forward, under the paragraph about me. One
// at a time; change it here and the home page follows. `page` is the key the
// line under its name is written against in the copy.
export const featured = {
  label: 'Darth Vader',
  page: 'darth-vader',
  path: '/projects/halloween/darth-vader',
  image: asset('/thumbnails/darth-vader.webp'),
  tint: 2,
}

// The projects underway, shown under the featured one on the home page. Add
// and remove freely; the section disappears when the list is empty. The
// featured project is not repeated here.
export const current = [
  // No thumbnails yet: the cards say so until there are renders
  { label: 'Lightsaber', path: '/projects/halloween/lightsaber', image: undefined, tint: 4 },
  { label: 'Scout Trooper Helmet', path: '/projects/halloween/scout-trooper', image: undefined, tint: 6 },
]
