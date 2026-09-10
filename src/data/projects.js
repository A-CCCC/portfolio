// src/data/projects.js
//
// Single source of truth for every project's label, route and thumbnail.
// The category carousels and the home-page bubbles both read from here, so a
// thumbnail added below shows up in both places — set `image` once.
//
// Add `photo: true` when a thumbnail is a photograph with its background still
// in place. The bubble then fades the image out at the edges instead of cutting
// a hard disc out of it. Cut-out renders should leave the flag off.

export const clashRoyale = [
  { label: 'Skeleton Barrel', path: '/projects/clash-royale/skeleton-barrel', image: '/thumbnails/skeleton-barrel.webp' },
  { label: 'Elixir Collector', path: '/projects/clash-royale/elixir-collector', image: '/thumbnails/elixir-collector.webp' },
  { label: 'Cannon Cart', path: '/projects/clash-royale/cannon-cart', image: '/thumbnails/cannon-cart.webp' },
  { label: 'Mortar', path: '/projects/clash-royale/mortar', image: '/thumbnails/mortar.webp' },
  /* The Log is held back for now — a simple model that is hard to present
   alongside the others. Everything it needs is still here: uncomment the four
   lines marked "the-log" (here, App.jsx, Navbar.jsx and ProjectBubbles.jsx) and
   it is back, page, thumbnail and description included.
  the-log: */
  // { label: 'The Log', path: '/projects/clash-royale/the-log', image: '/thumbnails/the-log.webp' },
]

export const accessibility = [
  { label: 'Wheelchair Storage', path: '/solutions/accessibility/wheelchair-storage', image: '/thumbnails/wheelchair-storage.webp' },
  { label: 'Smart Kinesiology Tape', path: '/solutions/accessibility/smart-kinesiology-tape', image: '/thumbnails/smart-kinesiology-tape.webp' },
]

export const convenience = [
  { label: 'Backup Camera Wiper', path: '/solutions/convenience/backup-camera-wiper', image: '/thumbnails/backup-camera-wiper.webp' },
  { label: 'Modular Car Container', path: '/solutions/convenience/modular-car-container', image: '/thumbnails/modular-car-container.webp' },
  { label: 'Sunglasses Holder', path: '/solutions/convenience/sunglasses-holder', image: '/thumbnails/sunglasses-holder.webp' },
  { label: 'Car Key Holder', path: '/solutions/convenience/car-key-holder', image: '/thumbnails/car-key-holder.webp' },
  { label: 'Ketchup Extruder', path: '/solutions/convenience/ketchup-extruder', image: '/thumbnails/ketchup-extruder.webp' },
]

export const misc = [
  { label: 'Halloween Helmets', path: '/projects/misc/halloween-helmets', image: '/thumbnails/halloween-helmets.webp' },
  { label: 'RC Car Repair', path: '/projects/misc/rc-car-repair', image: '/thumbnails/rc-car-repair.webp' },
]

// The projects the home-page bubbles draw on by quota. Miscellaneous is not in
// here because it has no quota — ProjectBubbles adds it to the leftover slots
// separately, capped at one per draw.
export const bubbleProjects = [...clashRoyale, ...accessibility, ...convenience]
