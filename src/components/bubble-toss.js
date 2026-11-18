// src/components/bubble-toss.js
//
// The home page's bubbles can be picked up: pressed and moved, a bubble
// follows the pointer; let go, it flies on at the speed it was let go at,
// slowing as it goes, bouncing off the edges of the screen's bubble layer
// and knocking into the others — which fly off in turn, and knock into the
// rest. Wherever each comes to rest it stays, and floats on from there.
//
// A press that does not move (a few pixels' grace) is still a click, and
// pops the bubble (ProjectBubbles.jsx); one that moved is not (__tossed).
//
// Each bubble is moved by its spot's translate (the centring, plus how far it
// has been moved), which the compositor runs; its float (a transform on the
// bubble itself) is paused while it is moving, and played again once it has
// stopped, from where it was — so it carries on without a jump.

const GRACE = 5            // px a press may wander and still be a click
const FRICTION = 1.5       // the speed lost per second, as a share (e^-k t)
const BOUNCE = 0.82        // how much of its speed a bubble keeps off a wall or another
const REST = 12            // px a second under which a bubble has stopped
const MAX_SPEED = 3200     // px a second, however hard it is flung
const SPIN_UP = 90         // ms of the pointer's path its throw is read from

export function tossBubbles(layer, { onKnock } = {}) {
  if (!layer || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return () => {}
  const bodies = [...layer.querySelectorAll('.bubble')].map((el) => ({
    el, spot: el.parentElement, ox: 0, oy: 0, vx: 0, vy: 0, moving: false, held: false,
  }))
  let raf = 0
  let last = 0
  let grab = null            // { body, id, x0, y0, dx, dy, path: [[t, x, y]], live }

  const floats = (b) => b.el.__float || []
  const still = (b) => {
    if (b.moving) return
    b.moving = true
    b.el.__moving = true
    floats(b).forEach((a) => a.pause())
  }
  const rest = (b) => {
    b.moving = false; b.vx = 0; b.vy = 0
    b.el.__moving = false
    b.flung = false
    // floating again, unless the pointer is resting on it (the float stops
    // under the pointer, so it is easy to click: ProjectBubbles.jsx)
    if (!b.el.matches(':hover') && !document.documentElement.classList.contains('diving')) floats(b).forEach((a) => a.play())
  }
  const place = (b) => { b.spot.style.translate = `calc(-50% + ${b.ox.toFixed(1)}px) calc(-50% + ${b.oy.toFixed(1)}px)` }

  const step = (t) => {
    raf = 0
    // the page diving into a popped bubble: everything holds still
    if (layer.classList.contains('bubble-layer-popping')) return
    const dt = Math.min(0.05, (t - (last || t)) / 1000)
    last = t
    const box = layer.getBoundingClientRect()
    // where each is now, and how big (its breath and its swell included)
    for (const b of bodies) {
      const r = b.el.getBoundingClientRect()
      b.on = r.width > 0
      b.r = r.width / 2
      b.x = r.left + r.width / 2
      b.y = r.top + r.height / 2
    }
    // the one held follows the pointer; its speed is the pointer's
    if (grab?.live) {
      const b = grab.body
      const [, px, py] = grab.path[grab.path.length - 1]
      const mx = px + grab.dx - b.x, my = py + grab.dy - b.y
      b.ox += mx; b.oy += my; b.x += mx; b.y += my
      const old = grab.path.find(([pt]) => t - pt <= SPIN_UP) || grab.path[0]
      const span = Math.max(16, t - old[0]) / 1000
      b.vx = (px - old[1]) / span; b.vy = (py - old[2]) / span
    }
    // the rest fly on, slowing
    const slow = Math.exp(-FRICTION * dt)
    for (const b of bodies) {
      if (!b.moving || b.held || !b.on) continue
      b.vx *= slow; b.vy *= slow
      b.ox += b.vx * dt; b.oy += b.vy * dt
      b.x += b.vx * dt; b.y += b.vy * dt
    }
    // knocks: each pair that overlaps, where one of them is on the move —
    // pushed apart, and their speeds along the line between them traded
    // (the held one pushes, and is not pushed)
    for (let i = 0; i < bodies.length; i += 1) {
      for (let j = i + 1; j < bodies.length; j += 1) {
        let a = bodies[i], c = bodies[j]
        if (!a.on || !c.on || (!a.moving && !c.moving)) continue
        let nx = c.x - a.x, ny = c.y - a.y
        const d = Math.hypot(nx, ny) || 0.01
        const overlap = a.r + c.r - d
        if (overlap <= 0) continue
        nx /= d; ny /= d
        if (c.held) { [a, c] = [c, a]; nx = -nx; ny = -ny }
        // one the reader has thrown, or is carrying, knocked into another
        const by = a.held || a.flung ? a : c.held || c.flung ? c : null
        if (by && onKnock) onKnock(by.el)
        still(a); still(c)
        const vrel = (c.vx - a.vx) * nx + (c.vy - a.vy) * ny
        if (a.held) {
          c.ox += nx * overlap; c.oy += ny * overlap; c.x += nx * overlap; c.y += ny * overlap
          if (vrel < 0) { c.vx -= (1 + BOUNCE) * vrel * nx; c.vy -= (1 + BOUNCE) * vrel * ny }
        } else {
          const h = overlap / 2
          a.ox -= nx * h; a.oy -= ny * h; a.x -= nx * h; a.y -= ny * h
          c.ox += nx * h; c.oy += ny * h; c.x += nx * h; c.y += ny * h
          if (vrel < 0) {
            const k = ((1 + BOUNCE) * vrel) / 2
            a.vx += k * nx; a.vy += k * ny
            c.vx -= k * nx; c.vy -= k * ny
          }
        }
      }
    }
    // the edges of the layer: kept inside, and bounced back off
    for (const b of bodies) {
      if (!b.moving || !b.on) continue
      const lo = box.left + b.r, hi = box.right - b.r, top = box.top + b.r, foot = box.bottom - b.r
      if (b.x < lo) { b.ox += lo - b.x; b.vx = Math.abs(b.vx) * BOUNCE }
      else if (b.x > hi) { b.ox -= b.x - hi; b.vx = -Math.abs(b.vx) * BOUNCE }
      if (b.y < top) { b.oy += top - b.y; b.vy = Math.abs(b.vy) * BOUNCE }
      else if (b.y > foot) { b.oy -= b.y - foot; b.vy = -Math.abs(b.vy) * BOUNCE }
      const v = Math.hypot(b.vx, b.vy)
      if (v > MAX_SPEED) { b.vx *= MAX_SPEED / v; b.vy *= MAX_SPEED / v }
      place(b)
      if (!b.held && v < REST) rest(b)
    }
    if (grab?.live || bodies.some((b) => b.moving)) raf = requestAnimationFrame(step)
    else last = 0
  }
  const run = () => { if (!raf) raf = requestAnimationFrame(step) }

  const down = (e) => {
    // the mouse or a pen: on a touch screen a finger on a bubble scrolls
    // the page, as it always has
    if (e.button !== 0 || e.pointerType === 'touch' || grab) return
    const body = bodies.find((b) => b.el === e.currentTarget)
    if (!body || document.documentElement.classList.contains('diving')) return
    const r = body.el.getBoundingClientRect()
    grab = {
      body, id: e.pointerId, x0: e.clientX, y0: e.clientY,
      dx: r.left + r.width / 2 - e.clientX, dy: r.top + r.height / 2 - e.clientY,
      path: [[performance.now(), e.clientX, e.clientY]], live: false,
    }
  }
  const move = (e) => {
    if (!grab || e.pointerId !== grab.id) return
    grab.path.push([performance.now(), e.clientX, e.clientY])
    if (grab.path.length > 24) grab.path.shift()
    if (!grab.live) {
      if (Math.hypot(e.clientX - grab.x0, e.clientY - grab.y0) < GRACE) return
      grab.live = true
      const b = grab.body
      b.held = true
      b.el.__tossed = true
      still(b)
      b.spot.style.zIndex = '7'
      document.documentElement.classList.add('bubble-tossing')
      try { b.el.setPointerCapture(grab.id) } catch { /* gone already */ }
    }
    run()
  }
  const up = (e) => {
    if (!grab || e.pointerId !== grab.id) return
    const g = grab
    grab = null
    if (!g.live) return
    const b = g.body
    b.held = false
    b.spot.style.zIndex = ''
    document.documentElement.classList.remove('bubble-tossing')
    // held still at the end, it is put down, not thrown
    if (performance.now() - g.path[g.path.length - 1][0] > 60) { b.vx = 0; b.vy = 0 }
    // (thrown, until it stops: what it knocks into, it knocked)
    b.flung = Math.hypot(b.vx, b.vy) > 60
    // the click the release makes is not a pop; cleared after it has passed
    setTimeout(() => { b.el.__tossed = false }, 0)
    run()
  }
  const noDrag = (e) => e.preventDefault()   // not the browser's own drag of a link

  for (const b of bodies) {
    b.el.addEventListener('pointerdown', down)
    b.el.addEventListener('dragstart', noDrag)
  }
  window.addEventListener('pointermove', move, { passive: true })
  window.addEventListener('pointerup', up)
  window.addEventListener('pointercancel', up)
  return () => {
    cancelAnimationFrame(raf)
    document.documentElement.classList.remove('bubble-tossing')
    for (const b of bodies) {
      b.el.removeEventListener('pointerdown', down)
      b.el.removeEventListener('dragstart', noDrag)
    }
    window.removeEventListener('pointermove', move)
    window.removeEventListener('pointerup', up)
    window.removeEventListener('pointercancel', up)
  }
}
