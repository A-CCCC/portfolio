// src/components/useLight.js
//
// The light that everything in glass is lit by is fixed to the room, not to
// the page: a point above and to the left of the window, drifting slowly
// round its place. As the page scrolls a surface moves past that point, and
// the angle the light reaches it from changes — the glint slides, the rim's
// bright side turns, the shadow swings; and as the light drifts, the whole
// page's glass shifts gently together. This writes that angle onto every
// glass element, from where it is on screen, every time either moves.
//
// Per element, three numbers: --light-angle (the direction light travels
// across it, for the rim and the ink), and --shadow-dx / --shadow-dy (where
// its shadow falls, away from the light). Everything else in the stylesheet
// reads those. Nothing is re-rendered: this touches style properties only,
// on the frame after a scroll, so the page keeps its 60.
//
// Every write costs a repaint of a blurred surface, which is the dearest
// paint there is — so a value is written only when it has moved by a step
// the eye could tell, and the list of surfaces is gathered once per change
// to the page rather than on every pass.

// Where the light is, as shares of the window: above the top, left of the
// left edge. Matches the stylesheet's resting values, which stand in until
// the first measurement and for anyone with motion turned down.
const LIGHT = { x: -0.12, y: -0.3 }
// And it drifts: the point wanders slowly round its place — a few percent of
// the window, on two periods that never line up, like the bubbles' float —
// so the glints, edges and shadows across the page shift gently together
// even when nothing is scrolling. Slow, so it is felt rather than watched.
const DRIFT = { x: 0.045, y: 0.06 }       // of the window
const DRIFT_PERIOD = { x: 23, y: 17 }    // seconds; coprime, so the path never repeats quickly
const DRIFT_FPS = 8                      // passes a second while idle; most write nothing
// A shadow's reach, in px, for a surface at the far corner from the light
const SHADOW_REACH = 12
// The smallest change worth a repaint: a degree of angle, a pixel of
// shadow — under a pixel on any rim or edge there is. The drift crosses
// these about once every few seconds per surface.
const ANGLE_STEP = 1
const SHADOW_STEP = 1

let armed = false
// Where the light is now, in px of the window, for anything else lit by it
// (the WebGL glass reads it each frame; a style write would restyle the page)
export const lightNow = { x: -0.12 * 1280, y: -0.3 * 800 }
let pending = false
let drifting = false

// The surfaces, and the last values written to each, so an unchanged value
// is not written again (a write of the same value still repaints).
let surfaces = []
let stale = true
const last = new WeakMap()

// A title's sheen crosses it the moment it is in view, not on a clock
// started at page load: each title is watched until it is on screen and
// then marked, and the stylesheet starts its sweep from the mark.
// Each flash is a short animation started by setting data-flash and
// cleared when it ends, so between flashes nothing on the title animates
// (which matters: see .glass-title[data-flash] in the stylesheet). The
// first flash comes half a second after the title is seen, the rest every
// eleven seconds while the tab is showing.
const FLASH_EVERY = 11000
function flash(el) {
  if (document.hidden) return
  el.removeAttribute('data-flash')
  void el.offsetWidth                 // so the next set starts the animation afresh
  el.setAttribute('data-flash', '')
  el.__flashAt = performance.now()    // for the WebGL letters, which draw their own sheen
}
function keepFlashing(el) {
  if (el.__flashing) return
  el.__flashing = true
  el.addEventListener('animationend', (e) => { if (e.animationName === 'glass-sheen') el.removeAttribute('data-flash') })
  setTimeout(() => flash(el), 500)
  const timer = setInterval(() => { if (el.isConnected) flash(el); else clearInterval(timer) }, FLASH_EVERY)
}
const seeing = typeof IntersectionObserver === 'undefined' ? null : new IntersectionObserver((entries) => {
  for (const e of entries) {
    if (!e.isIntersecting) continue
    e.target.setAttribute('data-lit', '')
    keepFlashing(e.target)
    seeing.unobserve(e.target)
  }
}, { threshold: 0.6 })

// The colour behind a title (see .glass-title::after) and under a panel
// (.glass-panel::before): folds of silk. Several broad swathes of colour
// lie over one another, each a smooth curve flowing diagonally across,
// each a different colour from the page's few, blurred into each other;
// and along the top of each fold a soft crest of light where the light
// catches it. Drawn afresh for every element, so no two are folded the
// same and all are the one cloth. The colours come from the stylesheet
// (--silk-1..4), so the cloth is sunlit on the light page and cool on the
// dark, and turns over with the theme.
const between = (lo, hi) => lo + Math.random() * (hi - lo)
function silk(el, panel) {
  const colours = [1, 2, 3, 4].map((k) => getComputedStyle(el).getPropertyValue(`--silk-${k}`).trim() || '#888')
  // The cloth is drawn in the element's own proportions — 1000 wide, as
  // tall as the element is wide-to-tall — so a blur is as soft across as
  // down, and a fold on a wide title is not squeezed sideways into blots.
  const r = el.getBoundingClientRect()
  const H = Math.max(120, Math.min(1000, Math.round(1000 * (r.height || 1) / (r.width || 1))))
  // The folds' shapes are drawn once and kept on the element, so a redraw
  // for a change of theme recolours the same cloth rather than refolding it
  if (!el.__silk || Math.abs(el.__silk.H - H) > H * 0.25) {
    // Two or three folds: most of the cloth is a smooth mix, with a
    // sweep or two through it
    const folds = 2 + Math.floor(Math.random() * 2)
    // the second colour (turquoise on the dark page, orange on the light) is
    // one more fold, drawn last, lying across the middle of the cloth — the
    // part the letters' cores take their colour from — so every title
    // carries a touch of it
    const mid = folds
    el.__silk = Array.from({ length: folds + 1 }, (_, f) => {
      const base = f === mid ? H * between(0.4, 0.52) : H * (0.2 + f * (0.6 / Math.max(1, folds - 1))) + between(-0.12, 0.12) * H
      const tilt = (f === mid ? between(-0.22, 0.22) : between(-0.52, 0.52)) * H
      const n = 4
      const pts = []
      for (let k = 0; k <= n; k += 1) {
        const t = k / n
        pts.push([-150 + t * 1300, base + (t - 0.5) * tilt + (k === 0 || k === n ? 0 : between(-0.11, 0.11) * H)])
      }
      // Not every fold runs the whole way across: about half of them turn
      // away before one edge and leave by the top or the bottom instead,
      // the last point carried up or down and off the cloth.
      if (f !== mid && Math.random() < 0.5) {
        const end = Math.random() < 0.5 ? 0 : n
        const off = Math.random() < 0.5 ? -0.4 * H : 1.4 * H
        pts[end][0] = end === 0 ? between(50, 300) : between(700, 950)
        pts[end][1] = off
        // the point before it leans the same way, so the turn is a curve
        const prev = end === 0 ? 1 : n - 1
        pts[prev][1] += (off < 0 ? -1 : 1) * between(0.12, 0.26) * H
      }
      return { pts, crest: between(0.08, 0.16), width: between(60, 120), colour: f === mid ? 1 : 2 + (f % 2) }
    })
    el.__silk.H = H
  }
  // In a 1000 x 1000 box that is stretched to the element, so the folds
  // keep their shape whatever the element's proportions.
  const spline = (list) => {
    let d = ''
    for (let k = 0; k < list.length - 1; k += 1) {
      const p0 = list[Math.max(0, k - 1)], p1 = list[k], p2 = list[k + 1], p3 = list[Math.min(list.length - 1, k + 2)]
      const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6]
      const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6]
      d += ` C ${c1[0].toFixed(0)} ${c1[1].toFixed(0)}, ${c2[0].toFixed(0)} ${c2[1].toFixed(0)}, ${p2[0].toFixed(0)} ${p2[1].toFixed(0)}`
    }
    return d
  }
  // Each fold: a curve from off the left edge to off the right, rising or
  // falling across (the diagonal flow) with a gentle wave in it, filled
  // from the curve down — so each lies over the ones below and only its
  // upper edge shows, as a fold's does — and along that edge a soft crest
  // of light where the light catches the fold.
  let paths = ''
  let crests = ''
  for (const fold of el.__silk) {
    const edge = `M ${fold.pts[0][0]} ${fold.pts[0][1]}` + spline(fold.pts)
    paths += `<path d='${edge} L 1150 ${H * 1.3} L -150 ${H * 1.3} Z' fill='${colours[fold.colour]}'/>`
    crests += `<path d='${edge}' fill='none' stroke='white' stroke-opacity='${fold.crest.toFixed(2)}' stroke-width='${fold.width.toFixed(0)}' stroke-linecap='round'/>`
  }
  // Blurred broadly, so the folds mix into one another and no edge is a line
  // Blurred broadly, so the folds mix into one another and no edge is a
  // line: a share of the width, which is the long way across the cloth
  const blur = panel ? 55 : 70
  // An intrinsic size as well as the viewBox: the WebGL glass uploads this
  // as a texture, and an image with no size of its own uploads as nothing
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='1000' height='${H}' viewBox='0 0 1000 ${H}' preserveAspectRatio='none'>`
    + `<filter id='b' x='-30%' y='-30%' width='160%' height='160%'><feGaussianBlur stdDeviation='${blur}'/></filter>`
    + `<filter id='c' x='-30%' y='-30%' width='160%' height='160%'><feGaussianBlur stdDeviation='${blur * 0.75}'/></filter>`
    + `<rect x='-200' y='${-0.2 * H}' width='1400' height='${1.4 * H}' fill='${colours[0]}'/>`
    + `<g filter='url(#b)'>${paths}</g>`
    + `<g filter='url(#c)'>${crests}</g>`
    + `</svg>`
  const next = `url("data:image/svg+xml,${encodeURIComponent(svg)}")`
  const was = el.style.getPropertyValue('--river')
  // (not under the browser's cross-fade, which is the fade then — and the
  // restart below asks for a layout of every cloth, one by one)
  if (was && was !== next && !document.documentElement.classList.contains('theme-snap')) {
    // The old cloth over the new, fading out: see --river-was in the
    // stylesheet. The fade is the theme's own.
    el.style.setProperty('--river-was', was)
    el.classList.remove('silk-turning')
    void el.offsetWidth                   // restart the fade
    el.classList.add('silk-turning')
  }
  el.style.setProperty('--river', next)
  el.setAttribute('data-wave', '')
}

// When the theme turns over, the silk is recoloured in the new theme's
// colours (its folds kept), once the cross-fade has run.
if (typeof MutationObserver !== 'undefined' && typeof document !== 'undefined') {
  new MutationObserver(() => {
    for (const el of document.querySelectorAll('[data-wave]')) silk(el, el.classList.contains('glass-panel'))
  }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
}

function gather() {
  surfaces = Array.from(document.querySelectorAll('.glass, .glass-title'))
  stale = false
  for (const el of surfaces) {
    const title = el.classList.contains('glass-title')
    const panel = el.classList.contains('glass-panel')
    if ((title || panel) && !el.hasAttribute('data-wave')) silk(el, panel)
    if (title && seeing && !el.hasAttribute('data-lit')) seeing.observe(el)
  }
}

function place() {
  pending = false
  if (stale) gather()
  const w = window.innerWidth
  const h = window.innerHeight
  const t = performance.now() / 1000
  const lx = w * (LIGHT.x + (drifting ? DRIFT.x * Math.sin((t / DRIFT_PERIOD.x) * 2 * Math.PI) : 0))
  const ly = h * (LIGHT.y + (drifting ? DRIFT.y * Math.sin((t / DRIFT_PERIOD.y) * 2 * Math.PI + 1.3) : 0))
  lightNow.x = lx
  lightNow.y = ly
  const far = Math.hypot(w - lx, h - ly)
  for (const el of surfaces) {
    const r = el.getBoundingClientRect()
    if (r.bottom < -200 || r.top > h + 200) continue      // well off screen: leave it
    if (r.width === 0 && r.height === 0) continue         // not laid out
    const cx = r.left + r.width / 2
    const cy = r.top + r.height / 2
    const dx = cx - lx
    const dy = cy - ly
    // CSS gradient angles: 0deg points up, 90deg points right — so the
    // direction the light travels, from the light to the surface, is this.
    const angle = (Math.atan2(dx, -dy) * 180) / Math.PI
    // The shadow falls the same way, further for a surface further from the
    // light (a lower, more oblique ray), capped so it never gets silly.
    const dist = Math.hypot(dx, dy) / far
    const reach = SHADOW_REACH * (0.55 + 0.45 * Math.min(1, dist))
    const len = Math.hypot(dx, dy) || 1
    // Rounded to the step, and written only when the rounded value moved
    const a = Math.round(angle / ANGLE_STEP) * ANGLE_STEP
    const sx = Math.round(((dx / len) * reach) / SHADOW_STEP) * SHADOW_STEP
    const sy = Math.round(((dy / len) * reach) / SHADOW_STEP) * SHADOW_STEP
    const was = last.get(el)
    if (was && was.a === a && was.sx === sx && was.sy === sy) continue
    last.set(el, { a, sx, sy })
    el.style.setProperty('--light-angle', `${a}deg`)
    el.style.setProperty('--shadow-dx', `${sx}px`)
    el.style.setProperty('--shadow-dy', `${sy}px`)
  }
}

function schedule() {
  if (pending) return
  pending = true
  requestAnimationFrame(place)
}

function changed() {
  stale = true
  schedule()
}

// Called once, from the app. Idempotent.
export function lightTheGlass() {
  if (armed || typeof window === 'undefined') return
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  armed = true
  drifting = true
  window.addEventListener('scroll', schedule, { passive: true })
  window.addEventListener('resize', schedule)
  // Elements arrive and leave as pages change; the list is gathered again
  // on the next pass after the tree changes.
  new MutationObserver(changed).observe(document.body, { childList: true, subtree: true })
  changed()
  // The drift: a pass a few times a second, only while the tab is showing.
  let timer = setInterval(schedule, 1000 / DRIFT_FPS)
  document.addEventListener('visibilitychange', () => {
    clearInterval(timer)
    if (!document.hidden) timer = setInterval(schedule, 1000 / DRIFT_FPS)
  })
}
