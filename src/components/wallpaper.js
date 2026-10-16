// src/components/wallpaper.js
//
// The wallpaper under the home page and the hubs (.home-backdrop): one of a
// few hand-laid patterns, as Apple's are — a handful of large shapes
// overlapping at different slants, crisp-edged, smooth colour within and a
// soft shadow of their own colour for depth. A page takes the next in turn
// each visit (remembered for the session), so it changes from one visit to
// the next without ever being a jumble.
//
// Drawn twice from the same shapes: in the light page's colours and in the
// dark page's (--home-wall-light, --home-wall-dark). The page wears the one
// for its theme; a hub's inverted band wears the other, laid exactly over
// where the page's lies (CategoryBand.jsx), so the shapes run on across it.
// Each pattern is laid out on a tall sheet (400 by 800) and drawn to the
// page's own proportions, cropped from the middle as `cover` would.

// The light and dark colours each shape is shaded in, by name
const LIGHT = {
  base: ['#fff6e4', '#ffe6cc'],
  gold: ['#ffd66e', '#ffb648'], cream: ['#fff0bf', '#ffd98c'], coral: ['#ffb26b', '#ff8a96'],
  peach: ['#ffc49a', '#ff9f7a'], apricot: ['#ffd4b0', '#ffc095'], amber: ['#ffdf8a', '#ffab5c'], honey: ['#ffe39a', '#ffc76a'],
  shadows: ['#d9822a', '#d99a3a', '#c8603f', '#c9754a', '#cf8a2e'], shadowA: 0.28,
}
const DARK = {
  base: ['#0a1222', '#0d1a33'],
  gold: ['#2a6fe0', '#1d4aa8'], cream: ['#1f3f86', '#14295c'], coral: ['#1aa7a8', '#4a3bb5'],
  peach: ['#2a4fb8', '#1a2f7a'], apricot: ['#283d8f', '#1a2b6b'], amber: ['#1d7fc2', '#16a0a0'], honey: ['#1fc9c0', '#128a92'],
  shadows: ['#020814'], shadowA: 0.55,
}

// [path, colour, gradient direction x1 y1 x2 y2]
const PATTERNS = [
  // The first: a sheet from the top right, a disc off the upper left, a
  // ribbon at a slant; a bulge from the right by the words, a mound from
  // the lower left; a band across under the cards and a blob at the foot
  [
    ['M 150 -30 C 200 42, 302 30, 430 112 L 430 -30 Z', 'gold', [0.2, 0, 0.8, 1]],
    ['M -120 120 A 110 96 0 1 0 100 120 A 110 96 0 1 0 -120 120 Z', 'cream', [0.3, 0.2, 0.9, 0.9]],
    // (its ribbon falling across the lower part of the title — heroRibbon)
    ['hero', 'coral', [0, 0.3, 1, 0.6], { tilt: -1, at: 0.18, rise: 40 }],
    ['M 430 392 C 336 410, 300 500, 356 566 C 388 600, 418 610, 430 612 Z', 'peach', [1, 0, 0.2, 1]],
    ['M -30 560 C 62 520, 172 592, 252 700 L -30 700 Z', 'apricot', [0, 0, 0.7, 1]],
    ['M -30 664 C 92 622, 202 702, 322 652 C 372 632, 402 642, 430 626 L 430 702 C 380 714, 322 762, 222 742 C 132 724, 62 762, -30 782 Z', 'amber', [0, 0.4, 1, 0.6]],
    ['M 232 830 C 252 742, 332 702, 430 716 L 430 830 Z', 'honey', [0.1, 0, 0.9, 1]],
  ],
  // The second, its mirror turned about: the sheet from the top left, the
  // disc off the upper right, the ribbon leaning the other way, the bulge
  // from the left, the mound from the lower right, the band and the blob
  // likewise
  [
    ['M 250 -30 C 200 42, 98 30, -30 112 L -30 -30 Z', 'amber', [0.8, 0, 0.2, 1]],
    ['M 300 150 A 110 96 0 1 0 520 150 A 110 96 0 1 0 300 150 Z', 'honey', [0.7, 0.2, 0.1, 0.9]],
    // (its ribbon laid across the title itself — see heroRibbon)
    ['hero', 'peach', [1, 0.3, 0, 0.6], { tilt: 1, at: 0.2, rise: 40 }],
    ['M -30 412 C 64 430, 100 520, 44 586 C 12 620, -18 630, -30 632 Z', 'coral', [0, 0, 0.8, 1]],
    ['M 430 570 C 338 530, 228 602, 148 710 L 430 710 Z', 'gold', [1, 0, 0.3, 1]],
    ['M 430 674 C 308 632, 198 712, 78 662 C 28 642, -2 652, -30 636 L -30 712 C 20 724, 78 772, 178 752 C 268 734, 338 772, 430 792 Z', 'cream', [1, 0.4, 0, 0.6]],
    ['M 168 830 C 148 752, 68 712, -30 726 L -30 830 Z', 'apricot', [0.9, 0, 0.1, 1]],
  ],
  // The third: two ribbons crossing the page at gentle slants with a disc
  // between them, a sheet from the top left, and blobs low on either side
  [
    ['M -30 -30 L 260 -30 C 230 30, 120 70, -30 60 Z', 'cream', [0, 0, 0.9, 1]],
    // (its ribbon above the title, its lower edge across the top of the letters)
    ['hero', 'gold', [0, 0.3, 1, 0.7], { tilt: 1, at: 0.84, side: 'above', rise: 40 }],
    ['M 250 430 A 96 90 0 1 0 442 430 A 96 90 0 1 0 250 430 Z', 'coral', [0.2, 0.1, 0.9, 1]],
    ['M -30 470 C 40 450, 110 500, 120 560 C 128 610, 60 640, -30 630 Z', 'peach', [0, 0, 1, 1]],
    ['M -30 690 C 100 650, 210 720, 330 676 C 375 660, 405 666, 430 652 L 430 724 C 380 738, 320 778, 220 760 C 130 744, 60 780, -30 800 Z', 'amber', [0, 0.5, 1, 0.5]],
    ['M 300 830 C 312 776, 370 750, 430 756 L 430 830 Z', 'honey', [0.2, 0, 0.8, 1]],
  ],
  // The fourth, the third's mirror
  [
    ['M 430 -30 L 140 -30 C 170 30, 280 70, 430 60 Z', 'amber', [1, 0, 0.1, 1]],
    // (its ribbon below the title, its upper edge falling across the middle
    // of the letters — heroRibbon)
    ['hero', 'coral', [1, 0.3, 0, 0.7], { tilt: -1, at: 0.16, rise: 40 }],
    ['M -42 430 A 96 90 0 1 0 150 430 A 96 90 0 1 0 -42 430 Z', 'honey', [0.8, 0.1, 0.1, 1]],
    ['M 430 470 C 360 450, 290 500, 280 560 C 272 610, 340 640, 430 630 Z', 'gold', [1, 0, 0, 1]],
    ['M 430 690 C 300 650, 190 720, 70 676 C 25 660, -5 666, -30 652 L -30 724 C 20 738, 80 778, 180 760 C 270 744, 340 780, 430 800 Z', 'peach', [1, 0.5, 0, 0.5]],
    ['M 100 830 C 88 776, 30 750, -30 756 L -30 830 Z', 'cream', [0.8, 0, 0.2, 1]],
  ],
]

const W = 400

// A ribbon across a page's title: on a pattern that asks for one ('hero'),
// a broad band whose upper edge runs at a slant through the middle of the
// title's letters, so the glass of the title shows the edge bent through
// it. Placed from where the title is (page px), turned into the sheet's
// units as the page crops it.
function heroRibbon(host, toSheet, o = {}) {
  const h1 = host.querySelector('h1')
  if (!h1) return null
  const { tilt = 1, at = 0.52, side = 'below', rise = 95 } = o
  const hr = host.getBoundingClientRect(), r = h1.getBoundingClientRect()
  const hw = host.offsetWidth
  const cy = r.top - hr.top + r.height * at              // where the edge crosses the title's middle
  // broad enough to lie behind the whole of the title past its edge
  const T = Math.max(190, r.height * 2.8) * (side === 'above' ? -1 : 1)
  const dy = rise * tilt                                  // + : rising to the right
  const P = (x, y) => toSheet(x, y).map((v) => v.toFixed(1)).join(' ')
  return `M ${P(-80, cy + dy)} C ${P(hw * 0.35, cy + dy * 0.44)}, ${P(hw * 0.65, cy - dy * 0.44)}, ${P(hw + 80, cy - dy)} `
    + `L ${P(hw + 80, cy - dy + T * 0.85)} C ${P(hw * 0.65, cy - dy * 0.44 + T * 1.05)}, ${P(hw * 0.35, cy + dy * 0.44 + T * 1.15)}, ${P(-80, cy + dy + T)} Z`
}

function parts(pattern, palette, hero) {
  let defs = `<linearGradient id='bg' x1='0' y1='0' x2='0.3' y2='1'><stop offset='0' stop-color='${palette.base[0]}'/><stop offset='1' stop-color='${palette.base[1]}'/></linearGradient>`
  let body = ''
  pattern.forEach(([shape, colour, [x1, y1, x2, y2]], k) => {
    const d = shape === 'hero' ? hero?.[k] : shape
    if (!d) return
    const [c0, c1] = palette[colour]
    defs += `<linearGradient id='g${k}' x1='${x1}' y1='${y1}' x2='${x2}' y2='${y2}'><stop offset='0' stop-color='${c0}'/><stop offset='1' stop-color='${c1}'/></linearGradient>`
    defs += `<filter id='s${k}' x='-20%' y='-20%' width='140%' height='150%'><feDropShadow dx='0' dy='${2 + (k % 2)}' stdDeviation='${4 + (k % 3)}' flood-color='${palette.shadows[k % palette.shadows.length]}' flood-opacity='${palette.shadowA}'/></filter>`
    body += `<path d='${d}' fill='url(#g${k})' filter='url(#s${k})'/>`
  })
  return { defs, body }
}

function draw(pattern, height, palette, hero) {
  const { defs, body } = parts(pattern, palette, hero)
  // the tall sheet, drawn to the page's proportions and cropped from its
  // middle (slice), as `cover` would crop it
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${W}' height='${Math.round(height)}' viewBox='0 0 400 800' preserveAspectRatio='xMidYMid slice'><defs>${defs}</defs><rect x='-400' y='-800' width='1200' height='2400' fill='url(#bg)'/>${body}</svg>`
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`
}

// The next pattern in turn for this visit: each page load moves one on
// (remembered for the tab), so it changes every time and never repeats twice
// running; a page where storage is shut out starts somewhere at random.
let chosen = null
function nextPattern() {
  if (chosen !== null) return chosen
  let i
  try {
    const last = Number(sessionStorage.getItem('wallpaper'))
    i = Number.isInteger(last) && sessionStorage.getItem('wallpaper') !== null ? (last + 1) % PATTERNS.length : Math.floor(Math.random() * PATTERNS.length)
    sessionStorage.setItem('wallpaper', String(i))
  } catch {
    i = Math.floor(Math.random() * PATTERNS.length)
  }
  chosen = i
  return i
}

function paper(host) {
  const pattern = host.__pattern || PATTERNS[nextPattern()]
  let drawnH = 0
  return () => {
    const hw = host.offsetWidth || 1, hh = host.offsetHeight || 1
    const height = (W * hh) / hw
    if (Math.abs(height - drawnH) < 6) return
    drawnH = height
    // page px to the sheet's units, as the page crops it (slice, centred)
    const unit = W / hw, Hs = hh * unit, s = Math.max(1, Hs / 800)
    const ox = (W - W * s) / 2, oy = (Hs - 800 * s) / 2
    const toSheet = (x, y) => [(x * unit - ox) / s, (y * unit - oy) / s]
    // each ribbon laid across the title, by its own options
    host.__hero = {}
    pattern.forEach(([d, , , o], k) => { if (d === 'hero') host.__hero[k] = heroRibbon(host, toSheet, o) })
    host.style.setProperty('--home-wall-light', draw(pattern, height, LIGHT, host.__hero))
    host.style.setProperty('--home-wall-dark', draw(pattern, height, DARK, host.__hero))
    host.__wallKey = `${host.__wallSeq = (host.__wallSeq || 0) + 1}`
  }
}

// A part of a page's wallpaper, drawn sharp at a given size: the box x, y,
// w, h (px, from the page's top left) of the sheet as the page lays it —
// cropped from its middle to the page's proportions — for the glass of a
// title on it to see through (liquid-glass.js). Its own small drawing, not
// the page-sized one cut down, so it is crisp at any screen density.
function region(host, pattern, x, y, w, h, wPx, hPx, dark, hero) {
  const hw = host.offsetWidth || 1, hh = host.offsetHeight || 1
  const unit = W / hw                         // page px to the sheet's units
  const Hs = hh * unit
  const s = Math.max(1, Hs / 800)              // the sheet's scale, sliced
  const ox = (W - W * s) / 2, oy = (Hs - 800 * s) / 2
  const qx = (x * unit - ox) / s, qy = (y * unit - oy) / s
  const qw = (w * unit) / s, qh = (h * unit) / s
  const { defs, body } = parts(pattern, dark ? DARK : LIGHT, hero)
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${Math.round(wPx)}' height='${Math.round(hPx)}' viewBox='${qx.toFixed(2)} ${qy.toFixed(2)} ${qw.toFixed(2)} ${qh.toFixed(2)}' preserveAspectRatio='none'><defs>${defs}</defs><rect x='-400' y='-800' width='1200' height='2400' fill='url(#bg)'/>${body}</svg>`
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}
export function wallRegion(host, x, y, w, h, wPx, hPx, dark) {
  if (!host.__pattern) return null
  return region(host, host.__pattern, x, y, w, h, wPx, hPx, dark, host.__hero)
}

export function watchWallpapers() {
  if (typeof document === 'undefined') return
  const seen = new WeakSet()
  const sizes = new ResizeObserver((entries) => {
    for (const e of entries) e.target.__paint?.()
  })
  const scan = () => {
    for (const host of document.querySelectorAll('.home-backdrop')) {
      if (seen.has(host)) continue
      seen.add(host)
      host.__pattern = PATTERNS[nextPattern()]
      host.__paint = paper(host)
      host.__paint()
      sizes.observe(host)
    }
  }
  new MutationObserver(scan).observe(document.body, { childList: true, subtree: true })
  scan()
}
