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
const seeing = typeof IntersectionObserver === 'undefined' ? null : new IntersectionObserver((entries) => {
  for (const e of entries) {
    if (!e.isIntersecting) continue
    e.target.setAttribute('data-lit', '')
    seeing.unobserve(e.target)
  }
}, { threshold: 0.6 })

// The wave of colour behind a title (see .glass-title::after) and under a
// panel (.glass-panel::before): six pools,
// evenly spaced across the width and alternately low and high, each drawn
// a little off its place and a little off its size, so every title's wave
// is its own and all of them still read as the one pattern.
const POOLS = 6
const between = (lo, hi) => lo + Math.random() * (hi - lo)
// A panel is a shorter box than a title's line, so its pools are set wider
// and far taller — the same pools as shares of a different box — or they
// come out as round spots instead of overlapping into a ribbon.
function wave(el, panel) {
  for (let k = 0; k < POOLS; k += 1) {
    const x = -2 + k * 23 + between(-5, 5)
    const y = (k % 2 === 0 ? between(70, 84) : between(18, 32))
    const w = panel ? between(36, 46) : between(23, 32)
    const h = panel ? between(150, 190) : between(58, 74)
    el.style.setProperty(`--w${k + 1}p`, `${x.toFixed(0)}% ${y.toFixed(0)}%`)
    el.style.setProperty(`--w${k + 1}s`, `${w.toFixed(0)}% ${h.toFixed(0)}%`)
  }
  el.setAttribute('data-wave', '')
}

function gather() {
  surfaces = Array.from(document.querySelectorAll('.glass, .glass-title'))
  stale = false
  for (const el of surfaces) {
    const title = el.classList.contains('glass-title')
    const panel = el.classList.contains('glass-panel')
    if ((title || panel) && !el.hasAttribute('data-wave')) wave(el, panel)
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
