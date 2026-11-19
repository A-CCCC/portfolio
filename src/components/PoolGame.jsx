// src/components/PoolGame.jsx
//
// The easter egg behind the home page's bubbles (ProjectBubbles.jsx): knock
// one bubble into another and the page offers a game of pool. Taken up, the
// screen becomes a table in the site's own look (its wallpaper the cloth,
// its glass the rails) with six pockets, one in each corner and one in the
// middle of each long side, and the bubbles roll into the rack as the balls,
// still the home page's bubbles: clear glass, the table seen through them
// bent, the project inside, a rim of light in the bubble's colour. The one
// that was thrown is the cue ball.
//
// The stroke: point at the spot on the white ball you want to hit (the cue
// comes round to that side of it, a mark where its tip will meet it), press
// there and pull back, the cue drawn back with you, further for a harder
// shot and swinging round with you to set the line; let go and it goes
// through, and hits. A guide (the line of the shot, where it meets the
// first ball, and how hard) can be turned on.
//
// The table is laid out in its own units, the bed 200 long and 100 wide,
// and put on the screen however it fits best: lying down on a wide screen,
// stood on end on a tall one. The table and the balls are drawn upright on
// the screen either way; the cue and the guide in the table's own units.
//
// Two games: on your own, clearing ten balls in as few shots as you can;
// or 8-ball for two players taking turns, fifteen balls, seven solid and
// seven striped (a band of the ball's colour behind its project), the
// 8-ball black, the Darth Vader helmet on it where the 8 would be. The
// first to sink one of a kind has that kind; clear yours, then sink the
// 8-ball to win. A foul (the white ball in, the wrong ball hit first, or
// nothing hit) gives the other player the white ball, to put down anywhere.
import { useEffect, useRef, useState } from 'react'

const TW = 200, TH = 100              // the bed
const RAIL = 10                       // the glass round it, and the cushions
const CUSHION = 3.2
const R = 3.5                         // a ball's radius (bigger than a pool ball's, so the project in each can be made out)
const CORNER = { r: 6.4, mouth: 7.4 } // a corner pocket, and how far along each rail its mouth runs
const SIDE = { r: 5.6, mouth: 5.5 }   // a middle pocket
const POCKETS = [
  { x: -1, y: -1, ...CORNER }, { x: TW / 2, y: -3.1, ...SIDE }, { x: TW + 1, y: -1, ...CORNER },
  { x: -1, y: TH + 1, ...CORNER }, { x: TW / 2, y: TH + 3.1, ...SIDE }, { x: TW + 1, y: TH + 1, ...CORNER },
]
const HEAD = { x: 50, y: 50 }         // where the cue ball is placed
const FOOT = { x: 148, y: 50 }        // the rack's apex
const MAX_V = 320                     // units a second, the hardest shot
const MAX_PULL = 30                   // how far the cue can be drawn back
const STRIKE_MS = 90                  // the cue going through, once let go
const DECEL = 26                      // rolling friction, units a second a second
const DRAG = 0.35                     // and a little more at speed
const E_BALL = 0.95, E_RAIL = 0.72
const BALLS = 10                      // on your own
const EIGHT_HUE = '#26262d'           // the 8-ball's glass
const GUIDE_KEY = 'pool-guide'

// the rack: a triangle of four rows (five for 8-ball), its apex towards the head
function rack(rows = 4) {
  const spots = []
  for (let row = 0; row < rows; row += 1) {
    for (let j = 0; j <= row; j += 1) {
      spots.push({ x: FOOT.x + row * R * Math.sqrt(3) * 1.01, y: FOOT.y + (j - row / 2) * R * 2.02 })
    }
  }
  return spots
}

// Any CSS colour as its red, green and blue, for gradients that fade it out
const probe = typeof document !== 'undefined' ? document.createElement('canvas').getContext('2d', { willReadFrequently: true }) : null
const rgbCache = new Map()
function rgbOf(colour) {
  if (rgbCache.has(colour)) return rgbCache.get(colour)
  probe.canvas.width = 1; probe.canvas.height = 1
  probe.clearRect(0, 0, 1, 1)
  probe.fillStyle = '#fff'
  probe.fillStyle = colour
  probe.fillRect(0, 0, 1, 1)
  const [r, g, b] = probe.getImageData(0, 0, 1, 1).data
  const out = `${r}, ${g}, ${b}`
  rgbCache.set(colour, out)
  return out
}

const ease = (k) => 1 - Math.pow(1 - Math.min(1, Math.max(0, k)), 3)

const isDark = () => {
  const root = document.documentElement
  return root.dataset.theme === 'dark' || ((root.dataset.theme === 'auto' || !root.dataset.theme) && matchMedia('(prefers-color-scheme: dark)').matches)
}

const touchFirst = () => typeof window !== 'undefined' && matchMedia('(pointer: coarse)').matches
const HINT = touchFirst()
  ? 'Touch the white ball where you want to hit it, pull back, then let go.'
  : 'Click the white ball where you want to hit it, pull back, then let go.'
const PLACE = touchFirst() ? 'tap where it goes' : 'click where it goes'

// 8-ball: which kind a ball is, by its number (0 the white ball)
const kindOf = (n) => (n === 0 ? 'cue' : n === 8 ? 'eight' : n < 8 ? 'solids' : 'stripes')
const player = (p) => `Player ${p + 1}`
const freshHud = (mode, note = HINT) => ({
  shots: 0, potted: 0, note, won: false,
  turn: 0, groups: [null, null], left: [null, null], winner: '', why: '', mode,
})

// A striped ball's picture (a band of its colour across it, the project in
// front), or the 8-ball's (black, its picture on a white disc), drawn once
// and handed to the glass as its image, so the glass bends it as it bends
// the others'
function paintBall(look, done) {
  const pic = new Image()
  const paint = (ok) => {
    const n = 320, cv = document.createElement('canvas')
    cv.width = n; cv.height = n
    const x = cv.getContext('2d')
    if (look.kind === 'eight') {
      x.fillStyle = '#141419'; x.fillRect(0, 0, n, n)
      const sheen = x.createRadialGradient(n * 0.35, n * 0.3, 0, n * 0.35, n * 0.3, n * 0.6)
      sheen.addColorStop(0, 'rgba(255, 255, 255, 0.16)'); sheen.addColorStop(1, 'rgba(255, 255, 255, 0)')
      x.fillStyle = sheen; x.fillRect(0, 0, n, n)
      x.fillStyle = '#ffffff'
      x.beginPath(); x.arc(n / 2, n / 2, n * 0.31, 0, Math.PI * 2); x.fill()
      x.save()
      x.beginPath(); x.arc(n / 2, n / 2, n * 0.31, 0, Math.PI * 2); x.clip()
      if (ok) x.drawImage(pic, n * 0.19, n * 0.2, n * 0.62, n * 0.62)
      else {
        x.fillStyle = '#141419'; x.font = `bold ${n * 0.36}px system-ui`; x.textAlign = 'center'; x.textBaseline = 'middle'
        x.fillText('8', n / 2, n / 2 + n * 0.02)
      }
      x.restore()
    } else {
      // the band, a little lighter along its top edge, white at its edges
      const top = n * 0.24, h = n * 0.52
      const band = x.createLinearGradient(0, top, 0, top + h)
      band.addColorStop(0, look.hue); band.addColorStop(0.5, look.hue); band.addColorStop(1, look.hue)
      x.globalAlpha = 0.88
      x.fillStyle = band; x.fillRect(0, top, n, h)
      x.globalAlpha = 1
      const lit = x.createLinearGradient(0, top, 0, top + h)
      lit.addColorStop(0, 'rgba(255, 255, 255, 0.35)'); lit.addColorStop(0.35, 'rgba(255, 255, 255, 0)')
      lit.addColorStop(0.8, 'rgba(0, 0, 0, 0)'); lit.addColorStop(1, 'rgba(0, 0, 0, 0.14)')
      x.fillStyle = lit; x.fillRect(0, top, n, h)
      x.fillStyle = 'rgba(255, 255, 255, 0.85)'
      x.fillRect(0, top - n * 0.012, n, n * 0.012); x.fillRect(0, top + h, n, n * 0.012)
      if (ok) x.drawImage(pic, 0, 0, n, n)
    }
    done(cv.toDataURL('image/png'))
  }
  if (!look.src) { paint(false); return }
  pic.onload = () => paint(true)
  pic.onerror = () => paint(false)
  pic.src = look.src
}

export default function PoolGame({ bubbles, extras = [], mode: startMode = 'solo', eight = null, onClose }) {
  const canvasRef = useRef(null)
  const underRef = useRef(null)
  const ballsRef = useRef(null)
  const railRefs = useRef([])
  const [mode, setMode] = useState(startMode)
  const [hud, setHud] = useState(() => freshHud(startMode))
  const [closing, setClosing] = useState(false)
  const [guide, setGuide] = useState(() => { try { return localStorage.getItem(GUIDE_KEY) === 'on' } catch { return false } })
  const game = useRef(null)
  // how many bubbles the rack has: the screen's, less the cue ball, and the
  // site's others to make up ten (as the game counts them, below)
  const cueAt = bubbles.findIndex((b) => b.thrown)
  const total = Math.min(BALLS, bubbles.filter((b, i) => i !== cueAt && (b.src || b.label)).length + extras.length)

  const leave = () => {
    if (closing) return
    setClosing(true)
    setTimeout(onClose, 380)
  }
  const toggleGuide = () => setGuide((on) => {
    try { localStorage.setItem(GUIDE_KEY, on ? 'off' : 'on') } catch { /* kept for this game only */ }
    return !on
  })
  useEffect(() => { if (game.current) game.current.guide = guide }, [guide])
  const switchMode = () => {
    const next = mode === 'eight' ? 'solo' : 'eight'
    setHud(freshHud(next))
    setMode(next)
  }

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const bg = underRef.current                     // the table's cushions, sights and pockets, under the balls
    const bx = bg.getContext('2d')
    const holder = ballsRef.current                 // the balls
    const eightBall = mode === 'eight'
    const g = {
      balls: [], state: 'intro', t0: performance.now(), shots: 0,
      turn: 0, groups: [null, null], breakShot: true, firstHit: null, target: 'open',
      aim: { x: 1, y: 0 }, pointer: null, view: null, pottedThisShot: [],
      stroke: null, follow: null, speed: 0, guide: false,
    }
    game.current = g
    if (import.meta.env.DEV) window.__pool = g      // (for trying shots out by hand while working on it)
    g.guide = (() => { try { return localStorage.getItem(GUIDE_KEY) === 'on' } catch { return false } })()

    // The site's colours, for the theme it is in
    const css = getComputedStyle(document.documentElement)
    const dark = isDark()
    const theme = {
      dark,
      bg: css.getPropertyValue('--bg').trim() || (dark ? '#0c162a' : '#ffeed8'),
      a: css.getPropertyValue('--vivid-a').trim() || (dark ? '#4f94ff' : '#ffd23f'),
      b: css.getPropertyValue('--vivid-b').trim() || (dark ? '#3ccf78' : '#ff8c5a'),
      shadow: dark ? '0, 0, 0' : '120, 60, 20',
    }

    // What each ball is: the cue ball clear glass; the rest the projects on
    // the screen's bubbles, then others from the site to make up the rack
    const cueFrom = bubbles.findIndex((b) => b.thrown)
    // (for 8-ball, the Darth Vader helmet the 8: its bubble, if one of the
    // screen's, and not one of the others)
    const eightFrom = eightBall && eight ? bubbles.findIndex((b, i) => i !== cueFrom && b.label === eight.label) : -1
    const pool = [
      ...bubbles.map((b, i) => ({ ...b, i })).filter((b) => b.i !== cueFrom && b.i !== eightFrom && (b.src || b.label)),
      ...extras.filter((x) => !eightBall || !eight || x.label !== eight.label),
      // (8-ball wants fourteen: the thrown bubble's project, too, as a ball
      // of its own, before any come round again)
      ...(eightBall && cueFrom >= 0 && bubbles[cueFrom].label !== eight?.label ? [{ ...bubbles[cueFrom], thrown: false }] : []),
    ]
    let objects
    if (eightBall) {
      // seven solid and seven striped; with fewer than fourteen projects,
      // some come round again (as the other kind)
      const others = []
      for (let k = 0; k < 14 && pool.length; k += 1) others.push(k < pool.length ? pool[k] : { ...pool[k % pool.length], i: undefined })
      const theEight = eightFrom >= 0 ? { ...bubbles[eightFrom], i: eightFrom } : { src: eight?.src, label: eight?.label || 'the 8-ball' }
      objects = [
        ...others.slice(0, 7).map((o) => ({ ...o, kind: 'solids' })),
        { ...theEight, kind: 'eight', hue: EIGHT_HUE },
        ...others.slice(7).map((o) => ({ ...o, kind: 'stripes' })),
      ]
    } else objects = pool.slice(0, BALLS)
    const looks = [
      { cue: true, hue: dark ? '#cfe0ff' : '#ffffff', label: 'the white ball', i: cueFrom },
      ...objects.map((o) => ({ src: o.src, hue: o.hue || theme.a, label: o.label, i: o.i, kind: o.kind })),
    ]
    const eightName = eightBall ? looks[8]?.label || 'the 8-ball' : ''
    // The cloth is the home page itself, its wallpaper left showing; the
    // balls see it through them, as the home page's bubbles do
    const host = document.querySelector('.home-backdrop')
    const wallFor = () => {
      const m = host && getComputedStyle(host).getPropertyValue('--home-wall').trim().match(/^url\("(.*)"\)$/)
      return m ? { url: m[1], host } : null
    }

    // How the table sits on the screen
    const layout = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1)
      const w = window.innerWidth, h = window.innerHeight
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr)
      bg.width = canvas.width; bg.height = canvas.height
      const top = w < 620 ? 96 : 60, pad = 14
      const aw = w - pad * 2, ah = h - top - pad
      const upright = ah > aw * 1.05
      const long = TW + RAIL * 2, short = TH + RAIL * 2
      const s = upright ? Math.min(aw / short, ah / long) : Math.min(aw / long, ah / short)
      const cx = w / 2, cy = top + ah / 2
      g.view = { dpr, s, cx, cy, upright }
      drawTable()
    }
    // the table's units to the screen's, and back
    const toScreen = (x, y) => {
      const { s, cx, cy, upright } = g.view
      return upright ? { x: cx - (y - TH / 2) * s, y: cy + (x - TW / 2) * s } : { x: cx + (x - TW / 2) * s, y: cy + (y - TH / 2) * s }
    }
    const toTable = (sx, sy) => {
      const { s, cx, cy, upright } = g.view
      return upright ? { x: (sy - cy) / s + TW / 2, y: TH / 2 - (sx - cx) / s } : { x: (sx - cx) / s + TW / 2, y: (sy - cy) / s + TH / 2 }
    }
    const setView = () => {
      const { dpr, s, cx, cy, upright } = g.view
      if (upright) ctx.setTransform(0, s * dpr, -s * dpr, 0, (cx + (TH / 2) * s) * dpr, (cy - (TW / 2) * s) * dpr)
      else ctx.setTransform(s * dpr, 0, 0, s * dpr, (cx - (TW / 2) * s) * dpr, (cy - (TH / 2) * s) * dpr)
    }
    // a box of the table's (x, y, width, height in its units) on the screen
    const screenBox = (x, y, w, h) => {
      const a = toScreen(x, y), b = toScreen(x + w, y + h)
      return { x: Math.min(a.x, b.x), y: Math.min(a.y, b.y), w: Math.abs(b.x - a.x), h: Math.abs(b.y - a.y) }
    }

    // The table on the home page: its rails the site's glass (the rails
    // below, placed here), and on the canvas the cushions, the sights, a
    // shade in under the cushions and the pockets — the cloth between them
    // the page's own wallpaper, left showing. Drawn once into bg, and again
    // only when the screen changes.
    function drawTable() {
      const { dpr, s } = g.view
      const outer = screenBox(-RAIL, -RAIL, TW + RAIL * 2, TH + RAIL * 2)
      const felt = screenBox(0, 0, TW, TH)
      const cush = screenBox(-CUSHION, -CUSHION, TW + CUSHION * 2, TH + CUSHION * 2)
      // the rails: top and bottom the whole width, the sides between them
      const [top, bottom, left, right] = railRefs.current
      const place = (el, x, y, w, h) => { if (el) Object.assign(el.style, { left: `${x}px`, top: `${y}px`, width: `${w}px`, height: `${h}px` }) }
      const rw = cush.x - outer.x
      place(top, outer.x, outer.y, outer.w, cush.y - outer.y)
      place(bottom, outer.x, cush.y + cush.h, outer.w, outer.y + outer.h - cush.y - cush.h)
      place(left, outer.x, cush.y, rw, cush.h)
      place(right, cush.x + cush.w, cush.y, outer.x + outer.w - cush.x - cush.w, cush.h)
      bx.setTransform(dpr, 0, 0, dpr, 0, 0)
      bx.clearRect(0, 0, bg.width, bg.height)
      // the sights along the rails, little lights in the theme's colour
      const sight = (x, y) => {
        const p = toScreen(x, y), r = Math.max(2, s * 0.75)
        const gl = bx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r * 2.2)
        gl.addColorStop(0, '#ffffff'); gl.addColorStop(0.35, theme.a); gl.addColorStop(1, `rgba(${rgbOf(theme.a)}, 0)`)
        bx.fillStyle = gl
        bx.beginPath(); bx.arc(p.x, p.y, r * 2.2, 0, Math.PI * 2); bx.fill()
      }
      for (let i = 1; i < 8; i += 1) { if (i !== 4) { sight((TW / 8) * i, -RAIL / 2 - 1.5); sight((TW / 8) * i, TH + RAIL / 2 + 1.5) } }
      for (let i = 1; i < 4; i += 1) { sight(-RAIL / 2 - 1.5, (TH / 4) * i); sight(TW + RAIL / 2 + 1.5, (TH / 4) * i) }
      // the cushions: a band of glass in the theme's colour, its edge lit
      bx.save()
      bx.beginPath(); bx.rect(cush.x, cush.y, cush.w, cush.h); bx.rect(felt.x, felt.y, felt.w, felt.h); bx.clip('evenodd')
      bx.fillStyle = `rgba(${rgbOf(theme.a)}, ${dark ? 0.4 : 0.5})`
      bx.fillRect(cush.x, cush.y, cush.w, cush.h)
      bx.restore()
      bx.strokeStyle = 'rgba(255, 255, 255, 0.75)'; bx.lineWidth = 1
      bx.strokeRect(felt.x - 0.5, felt.y - 0.5, felt.w + 1, felt.h + 1)
      // shaded in under the cushions, and the head string and spots, faint
      bx.save()
      bx.beginPath(); bx.rect(felt.x, felt.y, felt.w, felt.h); bx.clip()
      const inset = 5 * s
      const shade = (x0, y0, x1, y1) => {
        const gr = bx.createLinearGradient(x0, y0, x1, y1)
        gr.addColorStop(0, `rgba(${theme.shadow}, ${dark ? 0.4 : 0.18})`); gr.addColorStop(1, `rgba(${theme.shadow}, 0)`)
        bx.fillStyle = gr
        bx.fillRect(felt.x, felt.y, felt.w, felt.h)
      }
      shade(felt.x, 0, felt.x + inset, 0); shade(felt.x + felt.w, 0, felt.x + felt.w - inset, 0)
      shade(0, felt.y, 0, felt.y + inset); shade(0, felt.y + felt.h, 0, felt.y + felt.h - inset)
      bx.strokeStyle = 'rgba(255, 255, 255, 0.35)'; bx.lineWidth = 1
      const h0 = toScreen(HEAD.x, 0), h1 = toScreen(HEAD.x, TH)
      bx.beginPath(); bx.moveTo(h0.x, h0.y); bx.lineTo(h1.x, h1.y); bx.stroke()
      bx.fillStyle = 'rgba(255, 255, 255, 0.6)'
      for (const sp of [HEAD, FOOT]) { const p = toScreen(sp.x, sp.y); bx.beginPath(); bx.arc(p.x, p.y, 2.5, 0, Math.PI * 2); bx.fill() }
      bx.restore()
      // the pockets: deep holes through it, a lit lip of glass round each
      for (const pk of POCKETS) {
        const p = toScreen(pk.x, pk.y), r = pk.r * s
        const hole = bx.createRadialGradient(p.x - r * 0.15, p.y - r * 0.2, r * 0.1, p.x, p.y, r)
        hole.addColorStop(0, dark ? '#01040c' : '#2a1208'); hole.addColorStop(0.7, dark ? '#050b1c' : '#3e1c0e')
        hole.addColorStop(1, dark ? '#13234a' : '#7a3a1c')
        bx.fillStyle = hole
        bx.beginPath(); bx.arc(p.x, p.y, r, 0, Math.PI * 2); bx.fill()
        bx.strokeStyle = 'rgba(255, 255, 255, 0.7)'; bx.lineWidth = 1.2
        bx.beginPath(); bx.arc(p.x, p.y, r - 0.6, Math.PI * 0.8, Math.PI * 1.7); bx.stroke()
        bx.strokeStyle = `rgba(${rgbOf(theme.a)}, 0.6)`
        bx.beginPath(); bx.arc(p.x, p.y, r - 0.6, Math.PI * 1.8, Math.PI * 2.7); bx.stroke()
      }
      // and what the bubbles see: the wallpaper where the page has it, the table over it
      // the balls' size
      const size = R * s * 2
      for (const el of holder.children) { el.style.width = `${size}px`; el.style.height = `${size}px` }
    }

    // The balls: the home page's bubbles, each an element of its own over
    // the table, drawn by the same WebGL glass as they are there
    // (liquid-glass.js, with the same settings as ProjectBubbles.jsx): clear
    // glass, the wallpaper bent through it, the project inside and a rim of
    // light in its colour. Where there is no WebGL, the CSS glass a bubble
    // has without it.
    const lensOff = []
    let glass = null
    const lens = (el) => {
      if (!glass || glass.lost) return
      lensOff.push(glass.add(el, {
        circle: true, sphere: true, hue: true, wall: wallFor, lift: 0.32, inset: 0.86, frost: 0,
        depth: el.offsetWidth * 0.08, rim: el.offsetWidth * 0.22, tintA: 0, specA: 0.45, rimOnLight: 0.7,
        image: (e) => e.querySelector('img'),
      }))
    }
    const ballEl = (look) => {
      const el = document.createElement('div')
      el.className = 'glass bubble pool-ball'
      el.style.setProperty('--lg-hue', look.hue)
      el.style.opacity = '0'
      if (look.kind === 'stripes' || look.kind === 'eight') {
        el.classList.add(`pool-ball-${look.kind}`)
        const img = document.createElement('img')
        img.alt = ''; img.draggable = false
        el.appendChild(img)
        paintBall(look, (url) => { img.src = url })
      } else if (look.src) {
        const img = document.createElement('img')
        img.src = look.src; img.alt = ''; img.draggable = false
        el.appendChild(img)
      }
      holder.appendChild(el)
      return el
    }
    for (const look of looks) look.el = ballEl(look)
    // (and the cue ball's beginning: the bubble that was thrown)
    const thrown = cueFrom >= 0 ? bubbles[cueFrom] : null
    const wasEl = thrown ? ballEl({ src: thrown.src, hue: thrown.hue || theme.a }) : null
    import('./liquid-glass').then(({ glassLayer }) => {
      glass = glassLayer()
      if (!glass || glass.lost || !holder.isConnected) return
      for (const el of holder.children) lens(el)
    }).catch(() => {})
    // a ball's element, centred at (x, y) on the screen at a scale of its size
    const put = (el, x, y, scale = 1, opacity = 1) => {
      const half = R * g.view.s
      el.style.transform = `translate3d(${(x - half).toFixed(2)}px, ${(y - half).toFixed(2)}px, 0) scale(${scale.toFixed(4)})`
      el.style.opacity = opacity >= 0.999 ? '' : String(Math.max(0, opacity))
      el.style.display = opacity <= 0 ? 'none' : ''
    }

    layout()

    // The balls, each from where its bubble was: the thrown one the cue
    // ball, the others in the rack; more than the screen had come up in it
    const shuffle = (a) => a.sort(() => Math.random() - 0.5)
    const setUp = (fromBubbles) => {
      // where each ball goes in the rack: for 8-ball, the 8 in the middle
      // of the third row, a solid and a stripe in the back corners
      let spot
      if (eightBall) {
        const spots = rack(5)
        const solids = shuffle([1, 2, 3, 4, 5, 6, 7]), stripes = shuffle([9, 10, 11, 12, 13, 14, 15])
        const order = new Array(15).fill(null)
        order[4] = 8
        const flip = Math.random() < 0.5
        order[10] = (flip ? solids : stripes).pop()
        order[14] = (flip ? stripes : solids).pop()
        const rest = shuffle([...solids, ...stripes])
        for (let k = 0; k < 15; k += 1) if (order[k] == null) order[k] = rest.pop()
        spot = []
        order.forEach((n, k) => { spot[n] = spots[k] })
      } else spot = [null, ...shuffle(rack())]
      const make = (n, to) => {
        const look = looks[n]
        const b = fromBubbles && look.i != null && look.i >= 0 ? bubbles[look.i] : null
        // (the cue ball: what the thrown bubble was, clearing as it goes)
        return { n, look, x: to.x, y: to.y, vx: 0, vy: 0, in: false, sink: null, from: b, delay: Math.random() * 140 }
      }
      g.balls = [make(0, HEAD), ...looks.slice(1).map((l, k) => make(k + 1, spot[k + 1]))]
      if (!fromBubbles && wasEl) wasEl.style.display = 'none'
      g.state = fromBubbles ? 'intro' : 'aim'
      g.t0 = performance.now()
      g.shots = 0
      g.stroke = null; g.follow = null
      g.turn = 0; g.groups = [null, null]; g.breakShot = true; g.firstHit = null
    }
    setUp(true)

    const moving = () => g.balls.some((b) => !b.in && (b.vx || b.vy))
    const cue = () => g.balls[0]
    const potted = () => g.balls.filter((b) => b.n > 0 && b.in).length
    const total = looks.length - 1
    // 8-ball: how many of a kind are still on the table; what a player has
    // to hit first; and the score, as the bar shows it
    const leftOf = (kind) => g.balls.filter((b) => kindOf(b.n) === kind && !b.in).length
    const targetFor = (p) => (g.groups[p] ? (leftOf(g.groups[p]) === 0 ? 'eight' : g.groups[p]) : 'open')
    const tally = () => ({
      potted: potted(),
      turn: g.turn,
      groups: [...g.groups],
      left: g.groups.map((k) => (k ? leftOf(k) : null)),
    })
    // a ball put back on a spot, or the nearest place along the table's
    // middle line that is clear of the others
    const respot = (ball, at) => {
      let x = at.x
      for (let k = 0; k < 60; k += 1) {
        const tryX = at.x + (k % 2 ? 1 : -1) * Math.ceil(k / 2) * R * 2.1
        if (tryX < R || tryX > TW - R) continue
        if (g.balls.every((b) => b === ball || b.in || Math.hypot(b.x - tryX, b.y - at.y) > R * 2.1)) { x = tryX; break }
      }
      Object.assign(ball, { x, y: at.y, vx: 0, vy: 0, in: false, sink: null })
    }

    // Physics, in small steps so a fast ball cannot pass through another
    const physics = (dt) => {
      const steps = 10, h = dt / steps
      for (let k = 0; k < steps; k += 1) {
        for (const b of g.balls) {
          if (b.in || b.sink) continue
          const v = Math.hypot(b.vx, b.vy)
          if (!v) continue
          const nv = Math.max(0, v - (DECEL + DRAG * v) * h)
          if (nv < 0.6) { b.vx = 0; b.vy = 0; continue }
          b.vx *= nv / v; b.vy *= nv / v
          b.x += b.vx * h; b.y += b.vy * h
        }
        for (let i = 0; i < g.balls.length; i += 1) {
          const a = g.balls[i]
          if (a.in || a.sink) continue
          for (let j = i + 1; j < g.balls.length; j += 1) {
            const c = g.balls[j]
            if (c.in || c.sink) continue
            let nx = c.x - a.x, ny = c.y - a.y
            const d = Math.hypot(nx, ny)
            if (d >= R * 2 || d === 0) continue
            nx /= d; ny /= d
            // (the first ball the white ball meets, for 8-ball's rules)
            if (!g.firstHit && (a.n === 0 || c.n === 0)) g.firstHit = a.n === 0 ? c : a
            const push = (R * 2 - d) / 2
            a.x -= nx * push; a.y -= ny * push; c.x += nx * push; c.y += ny * push
            const vrel = (c.vx - a.vx) * nx + (c.vy - a.vy) * ny
            if (vrel < 0) {
              const imp = ((1 + E_BALL) * vrel) / 2
              a.vx += imp * nx; a.vy += imp * ny; c.vx -= imp * nx; c.vy -= imp * ny
            }
          }
        }
        // the cushions, open at the pockets' mouths; and the pockets
        for (const b of g.balls) {
          if (b.in || b.sink) continue
          const nearCornerX = b.x < CORNER.mouth || b.x > TW - CORNER.mouth
          const nearCornerY = b.y < CORNER.mouth || b.y > TH - CORNER.mouth
          const nearSide = Math.abs(b.x - TW / 2) < SIDE.mouth
          if (b.x < R && !nearCornerY) { b.x = R; b.vx = Math.abs(b.vx) * E_RAIL }
          if (b.x > TW - R && !nearCornerY) { b.x = TW - R; b.vx = -Math.abs(b.vx) * E_RAIL }
          if (b.y < R && !nearCornerX && !nearSide) { b.y = R; b.vy = Math.abs(b.vy) * E_RAIL }
          if (b.y > TH - R && !nearCornerX && !nearSide) { b.y = TH - R; b.vy = -Math.abs(b.vy) * E_RAIL }
          let into = POCKETS.find((p) => Math.hypot(b.x - p.x, b.y - p.y) < p.r)
          // (gone over the edge in a mouth without quite meeting the
          // pocket's middle: into the nearest)
          if (!into && (b.x < -R || b.x > TW + R || b.y < -R || b.y > TH + R)) {
            into = POCKETS.reduce((m, p) => (Math.hypot(b.x - p.x, b.y - p.y) < Math.hypot(b.x - m.x, b.y - m.y) ? p : m))
          }
          if (into) {
            b.sink = { t0: performance.now(), x: b.x, y: b.y, p: into }
            b.vx = 0; b.vy = 0
            g.pottedThisShot.push(b)
          }
        }
      }
    }

    // The guide: where the cue ball would meet the first ball (or the
    // cushion), which way that ball would go, and which way the cue ball
    const aimLine = () => {
      const c = cue(), d = g.aim
      let best = Infinity, hit = null
      for (const b of g.balls) {
        if (b === c || b.in || b.sink) continue
        const fx = b.x - c.x, fy = b.y - c.y
        const t = fx * d.x + fy * d.y
        if (t <= 0) continue
        const reach = (R * 2) ** 2 - (fx * fx + fy * fy - t * t)
        if (reach < 0) continue
        const at = t - Math.sqrt(reach)
        if (at < best) { best = at; hit = b }
      }
      const wall = Math.min(
        d.x > 0 ? (TW - R - c.x) / d.x : d.x < 0 ? (R - c.x) / d.x : Infinity,
        d.y > 0 ? (TH - R - c.y) / d.y : d.y < 0 ? (R - c.y) / d.y : Infinity,
      )
      if (wall < best) return { x: c.x + d.x * wall, y: c.y + d.y * wall, ball: null }
      const gx = c.x + d.x * best, gy = c.y + d.y * best
      const ox = (hit.x - gx) / (R * 2), oy = (hit.y - gy) / (R * 2)
      // the cue ball goes off at right angles to the object ball's line
      const dot = d.x * ox + d.y * oy
      return { x: gx, y: gy, ball: hit, ox, oy, cx: d.x - dot * ox, cy: d.y - dot * oy }
    }
    const drawGuide = () => {
      const c = cue(), gd = aimLine()
      ctx.save()
      ctx.lineWidth = 0.35
      ctx.setLineDash([1.6, 1.4])
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)'
      ctx.beginPath(); ctx.moveTo(c.x + g.aim.x * R, c.y + g.aim.y * R); ctx.lineTo(gd.x, gd.y); ctx.stroke()
      ctx.setLineDash([])
      ctx.beginPath(); ctx.arc(gd.x, gd.y, R, 0, Math.PI * 2); ctx.stroke()
      if (gd.ball) {
        ctx.strokeStyle = `rgba(${rgbOf(gd.ball.look.hue)}, 0.9)`; ctx.lineWidth = 0.5
        ctx.beginPath(); ctx.moveTo(gd.ball.x, gd.ball.y); ctx.lineTo(gd.ball.x + gd.ox * 16, gd.ball.y + gd.oy * 16); ctx.stroke()
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)'; ctx.lineWidth = 0.3
        ctx.beginPath(); ctx.moveTo(gd.x, gd.y); ctx.lineTo(gd.x + gd.cx * 10, gd.y + gd.cy * 10); ctx.stroke()
      }
      ctx.restore()
    }

    // The cue, in the theme's colours: a pale shaft, its butt in the
    // site's two bright colours, a white ferrule and a coloured tip, with a
    // line of light along it. `back` is how far its tip is from the ball.
    const drawCue = (back, alpha = 1) => {
      const c = cue(), d = g.aim
      const len = 118
      const tx = c.x - d.x * (R + 0.6 + back), ty = c.y - d.y * (R + 0.6 + back)
      const ex = tx - d.x * len, ey = ty - d.y * len
      const nx = -d.y, ny = d.x
      const tipW = 0.55, buttW = 1.35
      ctx.save()
      ctx.globalAlpha = alpha
      // its shadow (down and to the right on the screen, whichever way the table lies)
      const off = g.view.upright ? { x: 1.8, y: -1.2 } : { x: 1.2, y: 1.8 }
      ctx.fillStyle = `rgba(${theme.shadow}, ${dark ? 0.4 : 0.22})`
      ctx.beginPath()
      ctx.moveTo(tx + nx * tipW + off.x, ty + ny * tipW + off.y); ctx.lineTo(ex + nx * buttW + off.x, ey + ny * buttW + off.y)
      ctx.lineTo(ex - nx * buttW + off.x, ey - ny * buttW + off.y); ctx.lineTo(tx - nx * tipW + off.x, ty - ny * tipW + off.y)
      ctx.fill()
      const piece = (from, to, fill) => {
        const w = (k) => tipW + (buttW - tipW) * k
        const ax = tx - d.x * len * from, ay = ty - d.y * len * from
        const zx = tx - d.x * len * to, zy = ty - d.y * len * to
        ctx.fillStyle = fill
        ctx.beginPath()
        ctx.moveTo(ax + nx * w(from), ay + ny * w(from)); ctx.lineTo(zx + nx * w(to), zy + ny * w(to))
        ctx.lineTo(zx - nx * w(to), zy - ny * w(to)); ctx.lineTo(ax - nx * w(from), ay - ny * w(from))
        ctx.fill()
      }
      const butt = ctx.createLinearGradient(tx - d.x * len * 0.6, ty - d.y * len * 0.6, ex, ey)
      butt.addColorStop(0, theme.a); butt.addColorStop(1, theme.b)
      piece(0, 0.012, theme.b)                                  // the tip
      piece(0.012, 0.035, '#ffffff')                            // the ferrule
      piece(0.035, 0.6, dark ? '#dfe8ff' : '#fff3dc')           // the shaft
      piece(0.6, 0.62, '#ffffff')                               // the joint
      piece(0.62, 1, butt)                                      // the butt
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)'; ctx.lineWidth = 0.22
      ctx.beginPath(); ctx.moveTo(tx + nx * tipW * 0.35, ty + ny * tipW * 0.35); ctx.lineTo(ex + nx * buttW * 0.35, ey + ny * buttW * 0.35); ctx.stroke()
      ctx.restore()
    }

    // The stroke's speed, while it is played (with the guide on)
    const drawMeter = () => {
      if (!g.guide || !g.stroke) return
      const k = Math.min(1, g.stroke.pull / MAX_PULL)
      ctx.save()
      ctx.setTransform(g.view.dpr, 0, 0, g.view.dpr, 0, 0)
      const w = 160, x = window.innerWidth / 2 - w / 2, y = window.innerHeight - 12
      ctx.fillStyle = 'rgba(255, 255, 255, 0.35)'
      ctx.beginPath(); ctx.roundRect(x, y, w, 6, 3); ctx.fill()
      const grad = ctx.createLinearGradient(x, 0, x + w, 0)
      grad.addColorStop(0, theme.b); grad.addColorStop(1, theme.a)
      ctx.fillStyle = grad
      ctx.beginPath(); ctx.roundRect(x, y, Math.max(6, w * k), 6, 3); ctx.fill()
      ctx.restore()
    }

    const endOfShot = () => {
      const c = cue()
      const names = g.pottedThisShot.filter((b) => b.n > 0).map((b) => b.look.label || 'a bubble')
      let note = names.length > 2 ? `${names.length} in one shot!`
        : names.length === 2 ? `${names[0]} and ${names[1]}!`
        : names.length === 1 ? `${names[0]}!` : ''
      if (c.in) {
        // back on the spot, or the nearest place along the line clear of the others
        g.shots += 1
        respot(c, HEAD)
        note = 'Scratch! +1 shot'
      }
      g.pottedThisShot = []
      const done = potted() === total
      g.state = done ? 'won' : 'aim'
      setHud((h) => ({ ...h, shots: g.shots, potted: potted(), note: done ? '' : note, won: done }))
    }

    // 8-ball, once everything has stopped: was it a foul, did the 8 go
    // down, who has which kind, and whose turn it is now
    const endOfTurn = () => {
      const c = cue(), me = g.turn, you = 1 - me
      const pots = g.pottedThisShot.filter((b) => b.n > 0)
      g.pottedThisShot = []
      const eightIn = pots.some((b) => b.n === 8)
      const wasBreak = g.breakShot
      g.breakShot = false
      let foul = ''
      // (what the player did, said without them: "missed everything")
      if (!g.firstHit) foul = 'missed everything'
      else {
        const k = kindOf(g.firstHit.n), t = g.target
        if (t === 'open' ? k === 'eight' : k !== t) foul = `hit ${k === 'eight' ? eightName : k === 'solids' ? 'a solid' : 'a stripe'} first`
      }
      if (c.in) foul = 'put the white ball in'
      if (eightIn && !wasBreak) {
        const won = !foul && g.target === 'eight'
        g.state = 'won'
        const why = won ? `${player(me)} sank ${eightName}.`
          : foul && kindOf(g.firstHit?.n) !== 'eight' ? `${player(me)} sank ${eightName} but ${foul}.`
          : `${player(me)} sank ${eightName} too early.`
        setHud((h) => ({ ...h, ...tally(), won: true, winner: `${player(won ? me : you)} wins!`, why, note: '' }))
        return
      }
      const said = []
      if (eightIn) { respot(g.balls[8], FOOT); said.push(`${eightName} went in on the break, and back on its spot.`) }
      // the first to sink one (without a foul) has that kind
      if (!g.groups[me] && !foul) {
        const first = pots.find((b) => b.n !== 8)
        if (first) {
          const k = kindOf(first.n)
          g.groups[me] = k; g.groups[you] = k === 'solids' ? 'stripes' : 'solids'
          said.push(`${player(me)} has ${k}.`)
        }
      }
      const mine = g.groups[me]
      const scored = !foul && pots.some((b) => b.n !== 8 && kindOf(b.n) === mine)
      if (!scored) g.turn = you
      if (foul) {
        // the other player has the white ball, to put down anywhere
        if (c.in) respot(c, HEAD)
        g.state = 'place'
        said.unshift(`Foul, ${player(me)} ${foul}.`)
        said.push(`${player(g.turn)}, the white ball is yours: ${PLACE}.`)
      } else {
        g.state = 'aim'
        const names = pots.filter((b) => b.n !== 8).map((b) => b.look.label || 'a ball')
        if (names.length) said.unshift(names.length > 2 ? `${names.length} in!` : `${names.join(' and ')} in.`)
        said.push(scored ? `${player(me)} again.` : `${player(g.turn)}'s turn.`)
      }
      setHud((h) => ({ ...h, ...tally(), note: said.join(' ') }))
    }
    // the white ball in hand, put down where the pointer is, if it fits there
    const placeCue = (p) => {
      const c = cue()
      const x = Math.max(R, Math.min(TW - R, p.x)), y = Math.max(R, Math.min(TH - R, p.y))
      if (g.balls.every((b) => b === c || b.in || b.sink || Math.hypot(b.x - x, b.y - y) > R * 2.05)) { c.x = x; c.y = y }
    }

    const shoot = (pull) => {
      const c = cue(), v = MAX_V * Math.pow(Math.min(1, pull / MAX_PULL), 1.15)
      c.vx = g.aim.x * v; c.vy = g.aim.y * v
      g.shots += 1
      g.state = 'rolling'
      g.follow = { t0: performance.now() }
      g.stroke = null
      g.firstHit = null
      g.target = eightBall ? targetFor(g.turn) : 'open'
      setHud((h) => ({ ...h, shots: g.shots, note: '' }))
    }

    let raf = 0, last = performance.now()
    const frame = (t) => {
      raf = requestAnimationFrame(frame)
      const dt = Math.min(0.033, (t - last) / 1000)
      last = t
      const { s } = g.view
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      // the table comes up out of the page
      const intro = Math.min(1, (t - g.t0) / 1300)
      // (the cushions and pockets come up as the rails arrive)
      bg.style.opacity = g.state === 'intro' ? String(ease((t - g.t0 - 350) / 450)) : ''

      if (g.state === 'rolling') {
        physics(dt)
        if (!moving() && g.balls.every((b) => !b.sink)) { if (eightBall) endOfTurn(); else endOfShot() }
      }
      // the cue on the pointer's side of the ball, pointing through it
      if ((g.state === 'aim' && !g.nudged) || g.state === 'stroke') aimFrom(g.pointer)
      // let go: the cue goes through and hits
      if (g.state === 'strike' && t - g.stroke.at >= STRIKE_MS) shoot(g.stroke.pull)
      if (g.guide && (g.state === 'aim' || g.state === 'stroke')) { setView(); drawGuide() }

      const full = R * s
      for (const b of g.balls) {
        const el = b.look.el
        if (b.in) { put(el, 0, 0, 1, 0); continue }
        const at = toScreen(b.x, b.y)
        if (g.state === 'intro' && b.from) {
          // rolling from where its bubble was into its place on the table
          const k = ease((t - g.t0 - 250 - b.delay) / 1000)
          const x = b.from.x + (at.x - b.from.x) * k, y = b.from.y + (at.y - b.from.y) * k
          const scale = (b.from.r + (full - b.from.r) * k) / full
          if (b.n === 0 && wasEl) {
            // the thrown bubble clearing into the white ball as it goes
            put(wasEl, x, y, scale, 1 - k)
            put(el, x, y, scale, k)
          } else put(el, x, y, scale)
          continue
        }
        if (g.state === 'intro') {
          // one no bubble became: there in the rack, coming up with the table
          put(el, at.x, at.y, 1, ease((t - g.t0 - 700) / 600))
          continue
        }
        if (b.sink) {
          const k = Math.min(1, (t - b.sink.t0) / 220)
          const p = toScreen(b.sink.x + (b.sink.p.x - b.sink.x) * k, b.sink.y + (b.sink.p.y - b.sink.y) * k)
          put(el, p.x, p.y, 1 - k * 0.45, 1 - k)
          if (k >= 1) { b.in = true; b.sink = null; if (b.n > 0) setHud((h) => ({ ...h, ...tally() })) }
          continue
        }
        // (the white ball in hand: lifted a little, until it is put down)
        if (g.state === 'place' && b.n === 0) put(el, at.x, at.y, 1.08, 0.8)
        else put(el, at.x, at.y)
      }
      const cursor = g.state === 'place' ? 'grab' : ''
      if (canvas.style.cursor !== cursor) canvas.style.cursor = cursor
      if (g.state !== 'intro' && wasEl && wasEl.style.display !== 'none') wasEl.style.display = 'none'
      if (g.state === 'intro' && intro >= 1) g.state = 'aim'
      setView()
      if (g.state === 'aim') drawCue(1.2)
      if (g.state === 'stroke') drawCue(1.2 + g.stroke.pull)
      if (g.state === 'strike') {
        const k = Math.min(1, (t - g.stroke.at) / STRIKE_MS)
        drawCue((1.2 + g.stroke.pull) * (1 - k * k))
      }
      // where the tip will meet the white ball
      if (g.state === 'aim' || g.state === 'stroke') {
        const c = cue()
        ctx.fillStyle = theme.b
        ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 0.3
        ctx.beginPath(); ctx.arc(c.x - g.aim.x * R * 0.82, c.y - g.aim.y * R * 0.82, 0.55, 0, Math.PI * 2); ctx.fill(); ctx.stroke()
      }
      if (g.follow) {
        // through the ball and away
        const k = Math.min(1, (t - g.follow.t0) / 260)
        drawCue(-4 * ease(k * 2), 1 - k)
        if (k >= 1) g.follow = null
      }
      drawMeter()
    }
    raf = requestAnimationFrame(frame)

    // Aiming and the stroke
    const at = (e) => toTable(e.clientX, e.clientY)
    // the line of the shot: from the pointer through the white ball
    function aimFrom(p) {
      if (!p) return
      const c = cue(), dx = c.x - p.x, dy = c.y - p.y, d = Math.hypot(dx, dy)
      if (d > 0.3) g.aim = { x: dx / d, y: dy / d }
    }
    // While the cue is drawn back, the pointer is followed by how far the
    // mouse moves rather than where the cursor is, so it can be drawn on
    // past the edge of the screen: the cursor stops there, the mouse does
    // not. The browser only reports the mouse's movement past that point
    // with the pointer locked, so it is locked when the cursor reaches the
    // edge mid-stroke (the cursor hidden, the cue showing where it is), and
    // let go with the shot.
    const atEdge = (e) => {
      const s = window.screen, l = s.availLeft ?? 0, t = s.availTop ?? 0
      return e.screenX <= l + 1 || e.screenX >= l + s.width - 2 || e.screenY <= t + 1 || e.screenY >= t + s.height - 2
    }
    const unlock = () => { if (document.pointerLockElement === canvas) document.exitPointerLock?.() }
    const onMove = (e) => {
      const locked = document.pointerLockElement === canvas
      let p
      if (g.state === 'stroke' && g.drag) {
        // the cursor's own movement while it can move, the mouse's once it
        // cannot (locked, or held against the edge)
        const d = g.drag
        const mx = e.movementX || 0, my = e.movementY || 0
        const dx = locked || e.clientX === d.cx ? mx : e.clientX - d.cx
        const dy = locked || e.clientY === d.cy ? my : e.clientY - d.cy
        d.x += dx; d.y += dy
        if (!locked) { d.cx = e.clientX; d.cy = e.clientY }
        p = toTable(d.x, d.y)
        if (!locked && !d.asked && e.pointerType === 'mouse' && atEdge(e) && canvas.requestPointerLock) {
          d.asked = true
          try { canvas.requestPointerLock()?.catch?.(() => {}) } catch { /* not allowed: the edge holds */ }
        }
      } else {
        if (locked) return
        p = at(e)
        if (g.state === 'place') { placeCue(p); return }
      }
      if (g.nudged && g.pointer && Math.hypot(p.x - g.pointer.x, p.y - g.pointer.y) > 0.8) g.nudged = false
      if (!g.nudged || !g.pointer) g.pointer = p
      if (g.state !== 'stroke') return
      // drawn back: how much further from the ball the pointer is than
      // where it pressed
      const c = cue()
      g.stroke.pull = Math.max(0, Math.min(MAX_PULL, Math.hypot(p.x - c.x, p.y - c.y) - g.stroke.base))
    }
    const onDown = (e) => {
      if (e.button === 0 && g.state === 'place') {
        // put down: aimed from here on
        placeCue(at(e))
        g.pointer = null
        g.state = 'aim'
        return
      }
      if (e.button !== 0 || g.state !== 'aim') return
      canvas.setPointerCapture(e.pointerId)
      const p = at(e)
      const c = cue()
      g.pointer = p
      g.nudged = false
      g.drag = { x: e.clientX, y: e.clientY, cx: e.clientX, cy: e.clientY }
      aimFrom(p)
      g.stroke = { base: Math.max(R, Math.hypot(p.x - c.x, p.y - c.y)), pull: 0 }
      g.state = 'stroke'
    }
    const onUp = () => {
      unlock()
      g.drag = null
      if (g.state !== 'stroke') return
      // hardly drawn back at all: no shot, the cue back at rest
      if (g.stroke.pull < 0.8) { g.stroke = null; g.state = 'aim'; return }
      g.stroke.at = performance.now()
      g.state = 'strike'
    }
    // fine aim, a quarter of a degree at a time
    const onKey = (e) => {
      if (g.state !== 'aim' || !['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) return
      e.preventDefault()
      const turn = (e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 1) * (e.shiftKey ? 2 : 0.25) * (Math.PI / 180)
      const { x, y } = g.aim
      g.aim = { x: x * Math.cos(turn) - y * Math.sin(turn), y: x * Math.sin(turn) + y * Math.cos(turn) }
      g.nudged = true
    }
    // (the move and the let-go on the window: once the pointer is locked,
    // or the lock is given up with Escape, the canvas no longer holds it)
    window.addEventListener('pointermove', onMove)
    canvas.addEventListener('pointerdown', onDown)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)
    window.addEventListener('keydown', onKey)
    window.addEventListener('resize', layout)
    g.rerack = () => {
      setUp(false)
      g.pottedThisShot = []
      setHud(freshHud(mode, 'New rack'))
    }
    return () => {
      cancelAnimationFrame(raf)
      lensOff.forEach((off) => off())
      holder.replaceChildren()
      unlock()
      window.removeEventListener('pointermove', onMove)
      canvas.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('resize', layout)
    }
  }, [bubbles, extras, mode, eight])

  // The home page's title and the bar step aside while the table is up
  useEffect(() => {
    const root = document.documentElement
    root.classList.add('pool-fading')
    return () => root.classList.remove('pool-fading', 'pool-playing')
  }, [])
  useEffect(() => {
    document.documentElement.classList.toggle('pool-playing', !closing)
  }, [closing])

  // Escape leaves; the page does not scroll under the table
  useEffect(() => {
    // (not the Escape that gives up a locked pointer mid-stroke)
    const key = (e) => { if (e.key === 'Escape' && !document.pointerLockElement) leave() }
    window.addEventListener('keydown', key)
    const root = document.documentElement
    const was = root.style.overflow
    root.style.overflow = 'hidden'
    return () => { window.removeEventListener('keydown', key); root.style.overflow = was }
  })

  return (
    <div className={`pool${closing ? ' pool-closing' : ''}`} role="dialog" aria-label="Pool">
      {['top', 'bottom', 'left', 'right'].map((side, i) => (
        <div key={side} ref={(el) => { railRefs.current[i] = el }} className={`glass glass-vivid nav-glass pool-rail pool-rail-${side}`} aria-hidden="true" />
      ))}
      <canvas ref={underRef} className="pool-under" />
      <div ref={ballsRef} className="pool-balls" aria-hidden="true" />
      <canvas ref={canvasRef} className="pool-table" />
      <div className="pool-hud">
        {mode === 'eight' ? (
          <span className="pool-score pool-players">
            {[0, 1].map((p) => (
              <span key={p} className={`pool-player${hud.turn === p && !hud.won ? ' pool-player-up' : ''}`}>
                {player(p)}
                {hud.groups[p] && <> · {hud.left[p] ? <>{hud.groups[p]} <b>{hud.left[p]}</b></> : 'on the 8'}</>}
              </span>
            ))}
          </span>
        ) : (
          <span className="pool-score">Shots <b>{hud.shots}</b> · <b>{hud.potted}</b>/{total} in</span>
        )}
        <span className="pool-note" aria-live="polite">{hud.note}</span>
        <span className="pool-buttons">
          <button type="button" className={`pool-button${guide ? ' pool-button-on' : ''}`} aria-pressed={guide} onClick={toggleGuide}>
            Guide {guide ? 'on' : 'off'}
          </button>
          <button type="button" className="pool-button" onClick={() => game.current?.rerack()}>Restart</button>
          <button type="button" className="pool-button" onClick={leave}>Quit</button>
        </span>
      </div>
      {hud.won && (
        <div className="pool-won glass nav-glass">
          <h2>{mode === 'eight' ? hud.winner : 'You cleared the table!'}</h2>
          <p>{mode === 'eight' ? hud.why : `${hud.shots} ${hud.shots === 1 ? 'shot' : 'shots'}`}</p>
          <div className="pool-buttons">
            <button type="button" className="pool-button" onClick={() => game.current?.rerack()}>Play again</button>
            <button type="button" className="pool-button" onClick={switchMode}>{mode === 'eight' ? 'Play solo' : 'Play 2 players'}</button>
            <button type="button" className="pool-button" onClick={leave}>Back</button>
          </div>
        </div>
      )}
    </div>
  )
}
