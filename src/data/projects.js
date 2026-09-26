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

export const misc = [
  { label: 'Halloween Helmets', path: '/projects/misc/halloween-helmets', image: asset('/thumbnails/halloween-helmets.webp') },
  { label: 'RC Car Repair', path: '/projects/misc/rc-car-repair', image: asset('/thumbnails/rc-car-repair.webp') },
  // No thumbnail yet: the card says so. When there is a render, run
  // scripts/make-thumbnail.py on it and put the path here.
  { label: 'Lightsaber', path: '/projects/misc/lightsaber', image: undefined },
]

// The projects the home-page bubbles draw on by quota. Miscellaneous is not in
// here because it has no quota — ProjectBubbles adds it to the leftover slots
// separately, capped at one per draw.
export const bubbleProjects = [...clashRoyale, ...accessibility, ...convenience]

// The project the home page puts forward, under the paragraph about me. One
// at a time; change it here and the home page follows. `page` is the key the
// line under its name is written against in the copy.
export const featured = {
  label: 'Lightsaber',
  page: 'lightsaber',
  path: '/projects/misc/lightsaber',
  image: undefined,          // as above: the thumbnail, once there is one
  tint: 4,
}

// The projects underway, shown under the featured one on the home page. Add
// and remove freely; the section disappears when the list is empty. The
// featured project is not repeated here.
export const current = [
  { label: 'RC Car Repair', path: '/projects/misc/rc-car-repair', image: asset('/thumbnails/rc-car-repair.webp'), tint: 3 },
  { label: 'Halloween Helmets', path: '/projects/misc/halloween-helmets', image: asset('/thumbnails/halloween-helmets.webp'), tint: 2 },
  { label: 'Backup Camera Wiper', path: '/solutions/convenience/backup-camera-wiper', image: asset('/thumbnails/backup-camera-wiper.webp'), tint: 6 },
]
