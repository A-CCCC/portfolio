// src/components/wallpaper.js
//
// The wallpaper under the home page and the hubs (.home-backdrop): one of a
// few hand-laid patterns, as Apple's are — a handful of large shapes
// overlapping at different slants, crisp-edged, smooth colour within and a
// soft shadow of their own colour for depth. A page takes the next in turn
// each visit (remembered for the session), so it changes from one visit to
// the next without ever being a jumble.
//
// Each pattern is three pages wide and runs on forever: its right edge
// carries on into its left, its foot into its head. A page shows a window
// onto it a page wide — the middle third, when it is opened — at the
// page's own width, the same scale on every page. A page reached by a
// slide (page-sweep.js) takes up the pattern where the page it slid from
// left it: the third beside the one that page showed, from the row of it
// that was at the top of the screen, so the shapes run straight on across
// the seam between the two as they pass.
//
// Drawn twice from the same shapes: in the light page's colours and in the
// dark page's (--home-wall-light, --home-wall-dark). The page wears the one
// for its theme; a hub's inverted band wears the other, laid exactly over
// where the page's lies (CategoryBand.jsx), so the shapes run on across it.

// The light and dark colours each shape is shaded in, by name
// (the ground the page's own colour, --bg, so the pages without the
// wallpaper's shapes are on the same colour as the pages with them)
const LIGHT = {
  ground: '#ffeed8',
  gold: ['#ffd66e', '#ffb648'], cream: ['#fff0bf', '#ffd98c'], coral: ['#ffb26b', '#ff8a96'],
  peach: ['#ffc49a', '#ff9f7a'], apricot: ['#ffd4b0', '#ffc095'], amber: ['#ffdf8a', '#ffab5c'], honey: ['#ffe39a', '#ffc76a'],
  shadows: ['#d9822a', '#d99a3a', '#c8603f', '#c9754a', '#cf8a2e'], shadowA: 0.28,
}
const DARK = {
  ground: '#0c162a',
  gold: ['#2a6fe0', '#1d4aa8'], cream: ['#1f3f86', '#14295c'], coral: ['#1aa7a8', '#4a3bb5'],
  peach: ['#2a4fb8', '#1a2f7a'], apricot: ['#283d8f', '#1a2b6b'], amber: ['#1d7fc2', '#16a0a0'], honey: ['#1fc9c0', '#128a92'],
  shadows: ['#020814'], shadowA: 0.55,
}

// The pattern's units: a page is 400 across; the whole is three pages wide
// (x from -400 to 800, the middle third 0 to 400) and 1000 deep, and both
// ways it repeats.
const W = 400
const WIDE = 1200
const DEEP = 1000

// A shape of a pattern is one of:
//   { d, colour, dir }            a closed outline, drawn as it is
//   { band: [top, foot], ... }    a band right round the pattern: its two
//                                 edges each a smooth curve through the
//                                 points given (x from -400 to 800), joined
//                                 up end to start
//   { hero: true, ... }           the band behind the page's title (below)
// colour by name; dir the run of its shading, x1 y1 x2 y2.

// The first: a sheet from the top right, a disc off the upper left, a
// ribbon at a slant; a bulge from the right by the words, a mound from the
// lower left; a band across under the cards and a blob at the foot — and
// beyond them, the sheet running on to the right and over the top, a bulge
// and a disc in the third to the right, a blob and a pebble in the third to
// the left
const FIRST = [
  { d: 'M 150 -30 C 200 42, 302 30, 430 112 C 540 180, 640 150, 690 70 C 730 0, 700 -90, 610 -130 C 480 -185, 260 -170, 175 -100 C 140 -72, 135 -50, 150 -30 Z', colour: 'gold', dir: [0.2, 0, 0.8, 1] },
  { d: 'M -120 120 A 110 96 0 1 0 100 120 A 110 96 0 1 0 -120 120 Z', colour: 'cream', dir: [0.3, 0.2, 0.9, 0.9] },
  { d: 'M -370 300 C -300 240, -170 260, -140 360 C -115 450, -200 520, -300 500 C -390 482, -440 360, -370 300 Z', colour: 'gold', dir: [0.2, 0, 0.8, 1] },
  { d: 'M 550 330 A 90 84 0 1 0 730 330 A 90 84 0 1 0 550 330 Z', colour: 'apricot', dir: [0.3, 0.2, 0.9, 0.9] },
  { hero: true, colour: 'coral', dir: [0, 0.3, 1, 0.6] },
  { d: 'M 430 392 C 336 410, 300 500, 356 566 C 388 600, 418 610, 460 612 C 540 612, 600 560, 590 490 C 580 420, 510 380, 430 392 Z', colour: 'peach', dir: [1, 0, 0.2, 1] },
  { d: 'M -30 560 C 62 520, 172 592, 252 700 L -260 700 C -250 640, -104 592, -30 560 Z', colour: 'apricot', dir: [0, 0, 0.7, 1] },
  { d: 'M -330 880 C -280 820, -150 830, -120 900 C -95 960, -180 1010, -260 990 C -340 970, -370 920, -330 880 Z', colour: 'peach', dir: [1, 0, 0.2, 1] },
  { band: [
    [[-400, 700], [-260, 650], [-120, 672], [-30, 664], [92, 640], [202, 672], [322, 652], [430, 626], [560, 640], [690, 690]],
    [[-400, 805], [-250, 770], [-120, 795], [-30, 782], [62, 752], [222, 742], [322, 728], [430, 702], [560, 730], [690, 800]],
  ], colour: 'amber', dir: [0, 0.4, 1, 0.6] },
  { d: 'M 232 830 C 252 742, 332 702, 430 716 C 520 728, 600 790, 600 860 C 600 930, 520 960, 420 950 C 320 940, 225 900, 232 830 Z', colour: 'honey', dir: [0.1, 0, 0.9, 1] },
]

// The third: two ribbons crossing the page at gentle slants with a disc
// between them, a sheet from the top left, and blobs low on either side —
// and beyond them, the sheet running on to the left and over the top, a
// pebble high and a blob low in the third to the right, a disc in the
// third to the left
const THIRD = [
  { d: 'M 260 -30 C 230 30, 120 70, -30 60 C -150 52, -260 20, -300 -50 C -330 -110, -260 -170, -130 -170 C 20 -170, 290 -140, 290 -90 C 290 -65, 275 -55, 260 -30 Z', colour: 'cream', dir: [0, 0, 0.9, 1] },
  { d: 'M 520 120 C 580 60, 720 70, 760 150 C 795 225, 730 300, 640 290 C 550 280, 460 180, 520 120 Z', colour: 'apricot', dir: [0, 0, 0.9, 1] },
  { d: 'M -330 330 A 80 76 0 1 0 -170 330 A 80 76 0 1 0 -330 330 Z', colour: 'honey', dir: [0.2, 0.1, 0.9, 1] },
  { hero: true, colour: 'gold', dir: [0, 0.3, 1, 0.7] },
  { d: 'M 250 430 A 96 90 0 1 0 442 430 A 96 90 0 1 0 250 430 Z', colour: 'coral', dir: [0.2, 0.1, 0.9, 1] },
  { d: 'M 560 470 C 620 430, 740 450, 760 530 C 780 600, 700 650, 620 630 C 540 612, 500 510, 560 470 Z', colour: 'gold', dir: [1, 0, 0, 1] },
  { d: 'M -30 470 C 40 450, 110 500, 120 560 C 128 610, 60 640, -30 630 C -110 622, -170 580, -165 540 C -160 495, -100 490, -30 470 Z', colour: 'peach', dir: [0, 0, 1, 1] },
  { band: [
    [[-400, 650], [-250, 700], [-120, 676], [-30, 690], [100, 664], [210, 700], [330, 676], [430, 652], [560, 630], [690, 640]],
    [[-400, 760], [-250, 812], [-120, 790], [-30, 800], [60, 772], [220, 760], [320, 760], [430, 724], [560, 712], [690, 735]],
  ], colour: 'amber', dir: [0, 0.5, 1, 0.5] },
  { d: 'M 300 830 C 312 776, 370 750, 430 756 C 510 764, 560 820, 545 880 C 530 940, 450 960, 380 935 C 320 915, 292 870, 300 830 Z', colour: 'honey', dir: [0.2, 0, 0.8, 1] },
]

// Each pattern: its shapes, turned about (the second and fourth are the
// first and third in a mirror, the middle of the page staying where it is),
// what each colour becomes in it, and the band behind the title — where its
// upper edge crosses the middle of the pattern (y), which way it leans
// (tilt, +1 rising to the right), and which side of that edge it lies and
// where on the title the edge falls (at, from the title's top to its foot).
const SAME = (c) => c
const PATTERNS = [
  { shapes: FIRST, mirror: false, colour: SAME,
    hero: { y: 150, tilt: -1, at: 0.18, side: 'below' } },
  { shapes: FIRST, mirror: true,
    colour: (c) => ({ gold: 'amber', cream: 'honey', coral: 'peach', peach: 'coral', apricot: 'gold', amber: 'cream', honey: 'apricot' })[c],
    hero: { y: 150, tilt: 1, at: 0.2, side: 'below' } },
  { shapes: THIRD, mirror: false, colour: SAME,
    hero: { y: 200, tilt: 1, at: 0.84, side: 'above' } },
  { shapes: THIRD, mirror: true,
    colour: (c) => ({ cream: 'amber', gold: 'coral', coral: 'honey', peach: 'gold', amber: 'peach', honey: 'cream', apricot: 'apricot' })[c],
    hero: { y: 170, tilt: -1, at: 0.16, side: 'below' } },
]

// halfway between two colours (#rrggbb)
const mix = (a, b) => '#' + [1, 3, 5].map((i) => Math.round((parseInt(a.slice(i, i + 2), 16) + parseInt(b.slice(i, i + 2), 16)) / 2).toString(16).padStart(2, '0')).join('')

const fmt = (p) => p.map((v) => v.toFixed(1)).join(' ')

// A smooth curve through points (a Catmull-Rom spline as cubic Béziers),
// from the second point to the second last, as path commands after a move
// to the second
const smooth = (pts) => {
  let d = ''
  for (let i = 1; i < pts.length - 2; i += 1) {
    const [p0, p1, p2, p3] = [pts[i - 1], pts[i], pts[i + 1], pts[i + 2]]
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6]
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6]
    d += ` C ${fmt(c1)}, ${fmt(c2)}, ${fmt(p2)}`
  }
  return d
}
// One edge of a band, the pattern's points repeated a whole width each way
// so it runs on round the pattern, covering x0 to x1 with a point to spare
// each side
const edge = (pts, x0, x1) => {
  const all = []
  for (let k = Math.floor((x0 + 400) / WIDE) - 1; k <= Math.floor((x1 + 400) / WIDE) + 1; k += 1) {
    for (const [x, y] of pts) all.push([x + k * WIDE, y])
  }
  const i0 = Math.max(0, all.findIndex(([x]) => x > x0) - 3)
  const i1 = Math.min(all.length - 1, all.findIndex(([x]) => x > x1) + 2)
  return all.slice(i0, i1 + 1)
}
// A closed band between two smooth edges
const between = (top, foot) => `M ${fmt(top[1])}${smooth(top)} L ${fmt(foot[1])}${smooth(foot)} Z`
const bandPath = ([top, foot], x0, x1) => between(edge(top, x0, x1), edge(foot, x0, x1).reverse())

// The band behind the title of the page opened afresh, laid right round
// the pattern, so the pages that carry on from it carry it on too
let bands = []

// A band behind a title, for a page `unit` pattern units to the pixel with
// titles `fs` pixels high: its upper edge a long, gentle wave right round
// the pattern, crossing the title at y where the title's middle is (x = c),
// leaning there as the pattern asks, and as broad as it was when it was
// laid across each title in pixels
function heroPath(hero, band, unit, fs, x0, x1) {
  const lean = (40 * unit * hero.tilt) / 0.866
  const T = Math.max(190, fs * 1.1 * 2.8) * unit * (hero.side === 'above' ? -1 : 1)
  const at = (x) => band.y - lean * Math.sin((2 * Math.PI * (x - band.c)) / WIDE)
  const top = [], foot = []
  for (let x = Math.floor(x0 / 50) * 50 - 100; x <= x1 + 100; x += 50) {
    top.push([x, at(x)])
    foot.push([x, at(x) + T * (1 + 0.06 * Math.sin((2 * Math.PI * (x + 100)) / WIDE))])
  }
  return between(top, foot.reverse())
}

// The pattern behind a window onto it — x, y, w, h in pattern units — in a
// palette: the ground, then each shape in turn, as many times over as it
// takes to fill the window both ways
function scene(host, palette, x, y, w, h) {
  const pat = host.__pattern
  // the window as the unmirrored shapes see it
  const sx0 = pat.mirror ? W - (x + w) : x, sx1 = sx0 + w
  const flip = pat.mirror ? ` transform='matrix(-1 0 0 1 ${W} 0)'` : ''
  let defs = ''
  let body = `<rect x='${(x - 2).toFixed(2)}' y='${(y - 2).toFixed(2)}' width='${(w + 4).toFixed(2)}' height='${(h + 4).toFixed(2)}' fill='${palette.ground}'/>`
  // the rows of the pattern the window reaches (no shape reaches more than
  // a quarter of the depth past its own row)
  const r0 = Math.floor((y - 300) / DEEP), r1 = Math.floor((y + h + 300) / DEEP)
  pat.shapes.forEach((s, k) => {
    const [c0, c1] = palette[pat.colour(s.colour)]
    const [x1, y1, x2, y2] = s.dir
    if (s.band || s.hero) {
      // a band right round the pattern is shaded by where on the pattern it
      // is, not by the piece of it a page draws (that started over at every
      // seam): across the middle third as it always was, and back again
      // through the thirds either side, so its two ends meet in one colour
      const [a, b] = s.hero && pat.mirror === (x1 < x2) ? [c1, c0] : [c0, c1]
      const m = mix(a, b)
      defs += `<linearGradient id='g${k}' gradientUnits='userSpaceOnUse' x1='-400' y1='0' x2='800' y2='0'>`
        + `<stop offset='0' stop-color='${m}'/><stop offset='0.3333' stop-color='${a}'/><stop offset='0.6667' stop-color='${b}'/><stop offset='1' stop-color='${m}'/></linearGradient>`
    } else {
      defs += `<linearGradient id='g${k}' x1='${x1}' y1='${y1}' x2='${x2}' y2='${y2}'><stop offset='0' stop-color='${c0}'/><stop offset='1' stop-color='${c1}'/></linearGradient>`
    }
    defs += `<filter id='s${k}' x='-20%' y='-20%' width='140%' height='150%'><feDropShadow dx='0' dy='${2 + (k % 2)}' stdDeviation='${4 + (k % 3)}' flood-color='${palette.shadows[k % palette.shadows.length]}' flood-opacity='${palette.shadowA}'/></filter>`
    const lay = (id, d, across, turn) => {
      defs += `<path id='${id}' d='${d}'/>`
      for (let r = r0; r <= r1; r += 1) {
        for (const dx of across) {
          body += `<use href='#${id}'${turn} x='${dx}' y='${r * DEEP}' fill='url(#g${k})' filter='url(#s${k})'/>`
        }
      }
    }
    if (s.hero) {
      // the titles' bands: not mirrored with the shapes, and drawn just over
      // the window, which each crosses whole
      bands.forEach((b, i) => lay(`p${k}-${i}`, heroPath(pat.hero, b, host.__unit, host.__fs, x - 20, x + w + 20), [0], ''))
    } else if (s.band) {
      lay(`p${k}`, bandPath(s.band, sx0 - 20, sx1 + 20), [0], flip)
    } else {
      // an outline near either end of the pattern shows again at the other
      lay(`p${k}`, s.d, [-WIDE, 0, WIDE], flip)
    }
  })
  return { defs, body }
}

const svgOf = (host, palette, x, y, w, h, wPx, hPx) => {
  const { defs, body } = scene(host, palette, x, y, w, h)
  return `<svg xmlns='http://www.w3.org/2000/svg' width='${Math.round(wPx)}' height='${Math.round(hPx)}' viewBox='${x.toFixed(2)} ${y.toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)}' preserveAspectRatio='none'><defs>${defs}</defs>${body}</svg>`
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

// The band across a page's title: where on the pattern its edge crosses the
// title's middle, from the page's window onto it
function ownBand(host) {
  const h1 = host.querySelector('h1')
  if (!h1) return null
  const hr = host.getBoundingClientRect(), r = h1.getBoundingClientRect()
  return {
    y: host.__offY + (r.top - hr.top + r.height * host.__pattern.hero.at) * host.__unit,
    c: host.__phase * W + W / 2,
  }
}

// The page's wallpaper as drawn now, in both themes' colours
function drawn(host) {
  const Hs = host.offsetHeight * host.__unit
  const x = host.__phase * W, y = host.__offY
  return [LIGHT, DARK].map((pal) => `url("data:image/svg+xml,${encodeURIComponent(svgOf(host, pal, x, y, W, Hs, W, Hs))}")`)
}
function wear(host, [light, dark]) {
  host.style.setProperty('--home-wall-light', light)
  host.style.setProperty('--home-wall-dark', dark)
  host.__wallKey = `${host.__wallSeq = (host.__wallSeq || 0) + 1}`
}

function paper(host) {
  let drawnH = 0, drawnW = 0
  return () => {
    const hw = host.offsetWidth || 1, hh = host.offsetHeight || 1
    const unit = W / hw, Hs = hh * unit
    if (hw === drawnW && Math.abs(Hs - drawnH) < 6) return
    drawnH = Hs; drawnW = hw
    host.__unit = unit
    const h1 = host.querySelector('h1')
    host.__fs = h1 ? parseFloat(getComputedStyle(h1).fontSize) || 96 : 96
    if (!host.__banded) {
      host.__banded = true
      if (host.__offY === undefined) {
        // A page opened afresh: the middle third, from the row that puts
        // the pattern's band across its title where the pattern asks; and
        // the band laid there
        host.__phase = 0
        host.__offY = 0
        if (h1) {
          const hr = host.getBoundingClientRect(), r = h1.getBoundingClientRect()
          host.__offY = host.__pattern.hero.y - (r.top - hr.top + r.height * host.__pattern.hero.at) * unit
        }
        const b = ownBand(host)
        bands = b ? [b] : []
      }
      // (a page come in carrying on from the one before keeps the pattern
      // as it found it, the last page's band and all)
    }
    wear(host, drawn(host))
  }
}

// A part of a page's wallpaper, drawn sharp at a given size: the box x, y,
// w, h (px, from the page's top left), for the glass of a title on it to
// see through (liquid-glass.js). Its own small drawing, not the page-sized
// one cut down, so it is crisp at any screen density.
export function wallRegion(host, x, y, w, h, wPx, hPx, dark) {
  if (!host.__pattern || host.__unit === undefined) return null
  const u = host.__unit
  const svg = svgOf(host, dark ? DARK : LIGHT, host.__phase * W + x * u, host.__offY + y * u, w * u, h * u, wPx, hPx)
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}

// Called as a page slides away (page-sweep.js), `way` +1 onward and -1
// back, or as the next grows over it (0): where the next page is to take
// the pattern up — the third beside this one, on the side the next comes
// in from, or this same one for a page growing over it — from the row of
// it at the top of the screen, so the two meet at the seam.
export function handWallOn(page, way) {
  const host = page && (page.matches('.home-backdrop') ? page : page.querySelector('.home-backdrop'))
  if (!host || !host.__pattern || host.__unit === undefined) { window.__wallNext = null; return }
  window.__wallNext = {
    offY: host.__offY - host.getBoundingClientRect().top * host.__unit,
    phase: ((host.__phase + way + 4) % 3) - 1,
    at: performance.now(),
  }
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
      // (a picture of a page sliding away keeps the drawing it was taken with)
      if (host.closest('.page-ghost')) continue
      host.__pattern = PATTERNS[nextPattern()]
      // reached by a slide: the pattern taken up where the last page left it
      const next = window.__wallNext
      if (next && performance.now() - next.at < 4000) {
        host.__offY = next.offY
        host.__phase = next.phase
        window.__wallNext = null
      }
      host.__paint = paper(host)
      host.__paint()
      sizes.observe(host)
    }
  }
  new MutationObserver(scan).observe(document.body, { childList: true, subtree: true })
  scan()
}
