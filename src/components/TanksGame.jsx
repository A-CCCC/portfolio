// src/components/TanksGame.jsx
//
// A tank game in the spirit of Wii Play's: your tank against rounds of
// enemy tanks in an arena seen from above, shells that bounce off the
// walls, and mines. Drive with WASD or the arrow keys, aim with the mouse,
// click to fire, space (or right click) to lay a mine; F for full screen.
// While a game is on the mouse is kept in the arena (the browser's pointer
// lock): Escape lets it go, and pauses. On a touch screen,
// two thumbs, the way mobile shooters like Brawl Stars do it: a stick under
// the left thumb to drive (wherever it goes down on the left half of the
// screen), and one under the right to aim — the shot's path shown, bounce
// and all, while it is held, and fired when it is let go; a quick tap there
// fires at the nearest tank in sight. One hit and a tank is gone, yours included: three lives, and one
// more every fifth round. Ten rounds are made by hand (tanks-rules.js), and
// after them they are made up as they come.
//
// Drawn in the site's own look rather than Wii Play's: the arena floor the
// page's colour, its walls blocks of the bright glass, the tanks the site's
// colours. Its sounds are made as it plays (Web Audio), and can be turned off.
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { TYPE } from '../styles/type'
import { useIsTouch, useIsShort } from '../hooks/useIsPhone'
import * as R from './tanks-rules'

const S = 40                          // px a square, before the screen's own scaling
const W = R.COLS * S, H = R.ROWS * S
const BEST_KEY = 'tanks-best'
const SOUND_KEY = 'tanks-sound'
// A screen taller than it is wide has the arena stood on end, you at the
// bottom, so it is as big as the screen allows (the rules never know: only
// the drawing, and which way the controls point, turn with it)
const TALL = '(max-aspect-ratio: 4/5)'
const LIVES = 3
const MAX_LIVES = 9

const readBest = () => { try { return Number(localStorage.getItem(BEST_KEY)) || 0 } catch { return 0 } }
const saveBest = (n) => { try { localStorage.setItem(BEST_KEY, String(n)) } catch { /* kept for this visit only */ } }

// Any CSS colour the site uses (a hex, an rgb(), a color-mix() or a
// var() resolved to one) as its red, green and blue, read back off a canvas
const probe = typeof document !== 'undefined' ? document.createElement('canvas').getContext('2d', { willReadFrequently: true }) : null
const channels = new Map()
function rgbOf(colour) {
  if (channels.has(colour)) return channels.get(colour)
  probe.canvas.width = 1; probe.canvas.height = 1
  probe.clearRect(0, 0, 1, 1)
  probe.fillStyle = '#888888'
  probe.fillStyle = colour
  probe.fillRect(0, 0, 1, 1)
  const [r, g, b] = probe.getImageData(0, 0, 1, 1).data
  const out = [r, g, b]
  channels.set(colour, out)
  return out
}
// A colour lighter (k > 0) or darker (k < 0), for the tanks' parts
function shade(colour, k) {
  const ch = rgbOf(colour).map((c) => Math.round(k < 0 ? c * (1 + k) : c + (255 - c) * k))
  return `rgb(${ch.join(',')})`
}
const rgba = (colour, a) => `rgba(${rgbOf(colour).join(', ')}, ${a})`

// The sounds, made rather than loaded: a shot's thump, a shell's tick off a
// wall, a mine set down, two shells meeting, and a blast
function makeSounds() {
  let ac = null, noise = null
  const ready = () => {
    if (!ac) {
      const AC = window.AudioContext || window.webkitAudioContext
      if (!AC) return null
      ac = new AC()
      noise = ac.createBuffer(1, ac.sampleRate, ac.sampleRate)
      const d = noise.getChannelData(0)
      for (let i = 0; i < d.length; i += 1) d[i] = Math.random() * 2 - 1
    }
    if (ac.state === 'suspended') ac.resume()
    return ac
  }
  const tone = (freq, to, len, vol, type = 'square') => {
    const a = ready(); if (!a) return
    const o = a.createOscillator(), g = a.createGain(), t = a.currentTime
    o.type = type
    o.frequency.setValueAtTime(freq, t); o.frequency.exponentialRampToValueAtTime(to, t + len)
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + len)
    o.connect(g).connect(a.destination); o.start(t); o.stop(t + len + 0.02)
  }
  const hiss = (len, vol, cut, to = cut) => {
    const a = ready(); if (!a) return
    const n = a.createBufferSource(), f = a.createBiquadFilter(), g = a.createGain(), t = a.currentTime
    n.buffer = noise
    f.type = 'lowpass'; f.frequency.setValueAtTime(cut, t); f.frequency.exponentialRampToValueAtTime(to, t + len)
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + len)
    n.connect(f).connect(g).connect(a.destination); n.start(t); n.stop(t + len + 0.02)
  }
  return {
    wake: ready,
    fire: (fast) => { hiss(0.12, 0.22, fast ? 5000 : 2600, 400); tone(fast ? 420 : 220, 70, 0.12, 0.12, 'triangle') },
    bounce: () => tone(1400, 900, 0.05, 0.05, 'square'),
    clink: () => { tone(2200, 1600, 0.08, 0.06, 'triangle'); hiss(0.06, 0.08, 6000) },
    mine: () => tone(520, 760, 0.1, 0.07, 'sine'),
    boom: () => { hiss(0.7, 0.5, 1800, 60); tone(110, 30, 0.6, 0.35, 'sine') },
    win: () => { [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => tone(f, f, 0.16, 0.08, 'triangle'), i * 110)) },
    lose: () => { [392, 330, 262].forEach((f, i) => setTimeout(() => tone(f, f * 0.97, 0.22, 0.08, 'triangle'), i * 160)) },
  }
}

const AIM_REACH = 6                   // squares: how far from your tank the crosshair goes
const STICK = 52                     // px: how far a thumb pushes a stick to its full
const AIMED = 16                      // px the aiming thumb moves before it is aiming, not tapping

const GAME_KEYS = new Set(['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'])

export default function TanksGame() {
  const touch = useIsTouch()
  const short = useIsShort()
  const [upright, setUpright] = useState(() => typeof window !== 'undefined' && window.matchMedia(TALL).matches)
  const uprightRef = useRef(upright)
  const fullRef = useRef(false)
  useEffect(() => {
    const mq = window.matchMedia(TALL)
    const look = () => setUpright(mq.matches)
    mq.addEventListener('change', look)
    return () => mq.removeEventListener('change', look)
  }, [])
  const canvasRef = useRef(null)
  const game = useRef(null)
  const input = useRef({ keys: new Set(), pointer: null, fire: false, mine: false, move: null, aim: null, aimAngle: null })
  const pageRef = useRef(null)
  const stageRef = useRef(null)
  // Full screen: the browser's own where it has it, or else (an iPhone, which
  // keeps it for video) the game laid over the whole window
  const [full, setFull] = useState(false)
  useEffect(() => {
    const on = () => setFull(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', on)
    return () => document.removeEventListener('fullscreenchange', on)
  }, [])
  const toggleFull = () => {
    if (full) {
      if (document.fullscreenElement) document.exitFullscreen?.()
      else setFull(false)
      return
    }
    const el = stageRef.current
    if (el?.requestFullscreen && document.fullscreenEnabled) el.requestFullscreen({ navigationUI: 'hide' }).catch(() => setFull(true))
    else setFull(true)
  }
  // F, for full screen, either way
  const toggleRef = useRef(toggleFull)
  useEffect(() => { toggleRef.current = toggleFull })
  useEffect(() => {
    const key = (e) => {
      if (e.code !== 'KeyF' || e.repeat || e.metaKey || e.ctrlKey || e.altKey) return
      e.preventDefault()
      toggleRef.current()
    }
    window.addEventListener('keydown', key)
    return () => window.removeEventListener('keydown', key)
  }, [])
  useEffect(() => {
    if (!full || document.fullscreenElement) return undefined
    // (laid over the window: the page held still under it, and Escape to leave)
    const root = document.documentElement, was = root.style.overflow
    root.style.overflow = 'hidden'
    const key = (e) => { if (e.code === 'Escape') setFull(false) }
    window.addEventListener('keydown', key)
    return () => { root.style.overflow = was; window.removeEventListener('keydown', key) }
  }, [full])
  const stickRefs = useRef({ move: null, aim: null })
  const [hud, setHud] = useState({ phase: 'ready', round: 1, lives: LIVES, left: 1, kinds: [], extra: false, kills: 0 })
  const [best, setBest] = useState(readBest)
  const [sound, setSound] = useState(() => { try { return localStorage.getItem(SOUND_KEY) !== 'off' } catch { return true } })
  const soundOn = useRef(sound)
  useEffect(() => { soundOn.current = sound }, [sound])
  const toggleSound = () => setSound((on) => {
    try { localStorage.setItem(SOUND_KEY, on ? 'off' : 'on') } catch { /* this visit only */ }
    return !on
  })

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    let pal = null
    const hues = new Map()
    const palette = () => {
      const css = getComputedStyle(document.documentElement)
      const v = (n, f) => css.getPropertyValue(n).trim() || f
      const root = document.documentElement
      const dark = root.dataset.theme === 'dark' || ((root.dataset.theme === 'auto' || !root.dataset.theme) && matchMedia('(prefers-color-scheme: dark)').matches)
      hues.clear()
      channels.clear()
      return {
        dark,
        bg: v('--bg', dark ? '#0c162a' : '#ffeed8'),
        text: v('--text', dark ? '#e8eefc' : '#222222'),
        a: v('--vivid-a', dark ? '#4f94ff' : '#ffd23f'),
        b: v('--vivid-b', dark ? '#3ccf78' : '#ff8c5a'),
        shadow: dark ? '#000000' : '#78401a',
        resolve: (h) => {
          if (!hues.has(h)) { const m = /^var\((--[\w-]+)\)$/.exec(h); hues.set(h, m ? v(m[1], '#888888') : h) }
          return hues.get(h)
        },
      }
    }
    const fit = () => {
      const up = uprightRef.current
      // drawn at the size it is shown (bigger in full screen), at the
      // screen's own pixel density
      const shown = canvas.getBoundingClientRect().width || (up ? H : W)
      const r = Math.min(3, (window.devicePixelRatio || 1) * Math.max(1, shown / (up ? H : W)))
      canvas.width = (up ? H : W) * r; canvas.height = (up ? W : H) * r
      ctx.setTransform(r, 0, 0, r, 0, 0)
      pal = palette()
    }
    fit()
    window.addEventListener('resize', fit)
    // (the theme switched while playing: the colours again)
    const themeWatch = new MutationObserver(() => { pal = palette() })
    themeWatch.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })

    // --- the game around the rules: rounds, lives, and what is shown ---
    const G = {
      phase: 'ready', round: 1, lives: LIVES, timer: 0, extra: false, kills: 0,
      rows: R.layoutFor(1), world: null, was: null,
    }
    G.world = R.newRound(G.rows)
    game.current = G
    const sfx = makeSounds()
    const play = (name, ...a) => { if (soundOn.current) sfx[name](...a) }
    // the enemies still in the round, by kind, for the banner that starts it
    const kinds = () => {
      const by = new Map()
      for (const t of G.world.tanks) {
        if (t.player || !t.alive) continue
        const k = by.get(t.type) || { name: t.kind.name, hue: t.kind.hue, n: 0 }
        k.n += 1
        by.set(t.type, k)
      }
      return [...by.values()]
    }
    const show = () => setHud({
      phase: G.phase, round: G.round, lives: G.lives, extra: G.extra, kills: G.kills,
      left: R.enemiesLeft(G.world), kinds: kinds(),
    })
    const begin = (round, fresh) => {
      G.round = round
      if (fresh) G.rows = R.layoutFor(round)
      G.world = R.newRound(G.rows, fresh ? new Set() : G.world.down)
      G.phase = 'intro'
      G.timer = 2
      G.extra = false
      show()
    }
    G.refit = () => { fit(); draw() }
    G.start = () => { G.lives = LIVES; G.kills = 0; begin(1, true) }
    if (import.meta.env.DEV) { window.__tanks = G; G.begin = begin; G.input = input.current }   // (for trying rounds out while working on it)
    G.pause = (on) => {
      if (on) unlock()
      if (on && G.phase !== 'paused' && G.phase !== 'ready' && G.phase !== 'over') { G.was = G.phase; G.phase = 'paused'; show() }
      else if (!on && G.phase === 'paused') { G.phase = G.was; show() }
    }

    const toWorld = (p) => {
      const r = canvas.getBoundingClientRect()
      const u = (p.x - r.left) / r.width, v = (p.y - r.top) / r.height
      return uprightRef.current ? { x: R.COLS - v * R.COLS, y: u * R.ROWS } : { x: u * R.COLS, y: v * R.ROWS }
    }
    const readInput = () => {
      const I = input.current, k = I.keys
      let x = (k.has('KeyD') || k.has('ArrowRight') ? 1 : 0) - (k.has('KeyA') || k.has('ArrowLeft') ? 1 : 0)
      let y = (k.has('KeyS') || k.has('ArrowDown') ? 1 : 0) - (k.has('KeyW') || k.has('ArrowUp') ? 1 : 0)
      if (I.move) { x = I.move.x; y = I.move.y }
      // (up the screen is along the arena, stood on end)
      if (uprightRef.current) [x, y] = [-y, x]
      // aimed by the thumb (an angle) or the mouse (a point)
      let aim = I.pointer && !touchNow ? toWorld(I.pointer) : null
      const P = R.playerOf(G.world)
      if (I.aimAngle != null && P) aim = { x: P.x + Math.cos(I.aimAngle) * 4, y: P.y + Math.sin(I.aimAngle) * 4 }
      const out = { move: { x, y }, aim, fire: I.fire, mine: I.mine }
      I.fire = false; I.mine = false
      return out
    }

    let touchNow = false                 // (the last press a finger's: no aiming line)

    // The mouse kept in the arena while a game is on: the pointer locked to
    // the canvas, and a pointer of the game's own moved by the mouse's
    // movement, held inside the arena's edges (where it is, as a share of
    // the arena across and down, so a resize keeps it in place)
    const clamp01 = (v) => Math.max(0, Math.min(1, v))
    const locked = () => document.pointerLockElement === canvas
    let freed = 0                          // when the lock was last let go
    const lock = () => {
      if (touchNow || locked() || !canvas.requestPointerLock) return
      try { canvas.requestPointerLock()?.catch?.(() => {}) } catch { /* not allowed now: the mouse stays free */ }
    }
    const unlock = () => { if (locked()) document.exitPointerLock?.() }
    const onLockChange = () => {
      const I = input.current
      if (locked()) {
        const r = canvas.getBoundingClientRect()
        const p = I.pointer || { x: r.left + r.width / 2, y: r.top + r.height / 2 }
        I.held = { u: clamp01((p.x - r.left) / r.width), v: clamp01((p.y - r.top) / r.height) }
      } else {
        I.held = null
        freed = performance.now()
        // (let go with Escape mid-game: paused)
        if (G.phase === 'play' || G.phase === 'intro' || G.phase === 'hit' || G.phase === 'clear') G.pause(true)
      }
    }
    const heldPointer = () => {
      const I = input.current
      if (!I.held) return
      const r = canvas.getBoundingClientRect()
      I.pointer = { x: r.left + I.held.u * r.width, y: r.top + I.held.v * r.height }
    }
    // the line round the blocks and the arena, where shells bounce
    const rim = () => (pal.dark ? 'rgba(235, 242, 255, 0.92)' : shade(pal.a, -0.5))
    // which way a shadow falls in the arena for it to fall down and to the
    // right on the screen, however the arena is turned
    const fall = (k) => (uprightRef.current ? { x: -0.18 * k, y: 0.12 * k } : { x: 0.12 * k, y: 0.18 * k })

    // --- drawing ---
    const drawFloor = (w) => {
      ctx.fillStyle = pal.bg
      ctx.fillRect(0, 0, R.COLS, R.ROWS)
      ctx.fillStyle = rgba(pal.a, pal.dark ? 0.07 : 0.16)
      ctx.fillRect(0, 0, R.COLS, R.ROWS)
      // its edge, a line of the bright colour inside the rounded corners
      // (its edge a wall too: drawn in the blocks' rim)
      ctx.strokeStyle = rim(); ctx.lineWidth = 0.09
      ctx.beginPath(); ctx.roundRect(0.045, 0.045, R.COLS - 0.09, R.ROWS - 0.09, 0.32); ctx.stroke()
      ctx.fillStyle = rgba(pal.text, 0.07)
      for (let y = 1; y < R.ROWS; y += 1) for (let x = 1; x < R.COLS; x += 1) ctx.fillRect(x - 0.03, y - 0.03, 0.06, 0.06)
      // tread marks, fading
      for (const m of w.marks) {
        const k = 1 - (w.t - m.t) / 12
        if (k <= 0) continue
        ctx.save()
        ctx.translate(m.x, m.y); ctx.rotate(m.a)
        ctx.fillStyle = rgba(pal.shadow, (pal.dark ? 0.3 : 0.14) * k)
        ctx.fillRect(-0.05, -0.36, 0.1, 0.09); ctx.fillRect(-0.05, 0.27, 0.1, 0.09)
        ctx.restore()
      }
      // where tanks were hit
      for (const s of w.scorch) {
        const g = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.r)
        g.addColorStop(0, rgba(pal.shadow, pal.dark ? 0.5 : 0.3)); g.addColorStop(1, rgba(pal.shadow, 0))
        ctx.fillStyle = g
        ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2); ctx.fill()
        ctx.strokeStyle = rgba(pal.resolve(s.hue), 0.5); ctx.lineWidth = 0.06
        ctx.beginPath(); ctx.moveTo(s.x - 0.18, s.y - 0.18); ctx.lineTo(s.x + 0.18, s.y + 0.18)
        ctx.moveTo(s.x + 0.18, s.y - 0.18); ctx.lineTo(s.x - 0.18, s.y + 0.18); ctx.stroke()
      }
    }
    const drawBlocks = (w) => {
      const g = w.grid
      const at = (x, y) => R.cellAt(g, x, y)
      // holes: pits in the floor
      for (let y = 0; y < R.ROWS; y += 1) {
        for (let x = 0; x < R.COLS; x += 1) {
          if (g[y][x] !== R.HOLE) continue
          const pit = ctx.createRadialGradient(x + 0.45, y + 0.4, 0.05, x + 0.5, y + 0.5, 0.6)
          pit.addColorStop(0, pal.dark ? '#01040c' : '#2a1208'); pit.addColorStop(1, pal.dark ? '#13234a' : '#7a3a1c')
          ctx.fillStyle = pit
          ctx.beginPath(); ctx.roundRect(x + 0.08, y + 0.08, 0.84, 0.84, 0.28); ctx.fill()
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)'; ctx.lineWidth = 0.04
          ctx.beginPath(); ctx.roundRect(x + 0.1, y + 0.1, 0.8, 0.8, 0.26); ctx.stroke()
        }
      }
      // The blocks. A shell turns back exactly at a block's edge where it
      // meets the floor, so that edge is drawn as a crisp rim, all the way
      // round each run of blocks; each block raised by a bevel (lit on the
      // side towards the light on the screen) with a faint seam between
      // neighbours, so the squares, and their corners, can be counted
      const solid = (x, y) => { const c = at(x, y); return c === R.WALL || c === R.SOFT }
      const SIDES = [[0, -1], [-1, 0], [0, 1], [1, 0]]
      const lit = ([dx, dy]) => { const [sx, sy] = uprightRef.current ? [dy, -dx] : [dx, dy]; return sx < 0 || sy < 0 }
      // a strip along one side of a square, `inset` in from its edge
      const strip = (x, y, [dx, dy], inset, width) => {
        if (dx === 0) ctx.fillRect(x, dy < 0 ? y + inset : y + 1 - inset - width, 1, width)
        else ctx.fillRect(dx < 0 ? x + inset : x + 1 - inset - width, y, width, 1)
      }
      ctx.fillStyle = rgba(pal.shadow, pal.dark ? 0.45 : 0.2)
      const f = fall(1)
      for (let y = 0; y < R.ROWS; y += 1) for (let x = 0; x < R.COLS; x += 1) if (solid(x, y)) ctx.fillRect(x + f.x, y + f.y, 1, 1)
      const glass = ctx.createLinearGradient(0, 0, R.COLS, R.ROWS)
      glass.addColorStop(0, rgba(pal.a, 0.95)); glass.addColorStop(1, rgba(pal.b, 0.95))
      for (let y = 0; y < R.ROWS; y += 1) {
        for (let x = 0; x < R.COLS; x += 1) {
          const c = g[y][x]
          if (c !== R.WALL && c !== R.SOFT) continue
          if (c === R.WALL) {
            ctx.fillStyle = glass
            ctx.fillRect(x, y, 1, 1)
          } else {
            // a soft block (a mine clears it): frosted, finely lined
            ctx.fillStyle = pal.dark ? 'rgba(255, 255, 255, 0.16)' : 'rgba(255, 255, 255, 0.82)'
            ctx.fillRect(x, y, 1, 1)
            ctx.fillStyle = rgba(pal.b, pal.dark ? 0.22 : 0.16)
            ctx.fillRect(x, y, 1, 1)
            ctx.save()
            ctx.beginPath(); ctx.rect(x, y, 1, 1); ctx.clip()
            ctx.strokeStyle = rgba(pal.b, pal.dark ? 0.5 : 0.4); ctx.lineWidth = 0.03
            ctx.beginPath()
            for (let k = -1; k < 2; k += 0.2) { ctx.moveTo(x + k, y + 1); ctx.lineTo(x + k + 1, y) }
            ctx.stroke()
            ctx.restore()
          }
          for (const side of SIDES) {
            if (solid(x + side[0], y + side[1])) continue
            ctx.fillStyle = lit(side) ? 'rgba(255, 255, 255, 0.6)' : rgba(pal.shadow, pal.dark ? 0.4 : 0.22)
            strip(x, y, side, 0.04, 0.1)
          }
          ctx.fillStyle = 'rgba(255, 255, 255, 0.35)'
          if (solid(x + 1, y) && x + 1 < R.COLS) ctx.fillRect(x + 1 - 0.015, y + 0.14, 0.03, 0.72)
          if (solid(x, y + 1) && y + 1 < R.ROWS) ctx.fillRect(x + 0.14, y + 1 - 0.015, 0.72, 0.03)
        }
      }
      // the rims: the edges a shell bounces off
      ctx.lineWidth = 0.075
      ctx.lineCap = 'square'
      for (const kind of [R.WALL, R.SOFT]) {
        ctx.strokeStyle = kind === R.WALL ? rim() : (pal.dark ? rgba(pal.b, 0.95) : shade(pal.b, -0.35))
        ctx.beginPath()
        for (let y = 0; y < R.ROWS; y += 1) {
          for (let x = 0; x < R.COLS; x += 1) {
            if (g[y][x] !== kind) continue
            if (!solid(x, y - 1)) { ctx.moveTo(x, y); ctx.lineTo(x + 1, y) }
            if (!solid(x, y + 1)) { ctx.moveTo(x, y + 1); ctx.lineTo(x + 1, y + 1) }
            if (!solid(x - 1, y)) { ctx.moveTo(x, y); ctx.lineTo(x, y + 1) }
            if (!solid(x + 1, y)) { ctx.moveTo(x + 1, y); ctx.lineTo(x + 1, y + 1) }
          }
        }
        ctx.stroke()
      }
    }
    const drawTank = (t) => {
      const hue = pal.resolve(t.kind.hue)
      ctx.save()
      ctx.translate(t.x, t.y)
      ctx.fillStyle = rgba(pal.shadow, pal.dark ? 0.45 : 0.22)
      const f = fall(0.66)
      ctx.beginPath(); ctx.ellipse(f.x, f.y, 0.46, 0.4, 0, 0, Math.PI * 2); ctx.fill()
      ctx.save()
      ctx.rotate(t.body)
      // treads, their links moving as it drives
      const tread = shade(hue, -0.55)
      for (const side of [-1, 1]) {
        ctx.fillStyle = tread
        ctx.beginPath(); ctx.roundRect(-0.43, side > 0 ? 0.22 : -0.4, 0.86, 0.18, 0.06); ctx.fill()
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)'; ctx.lineWidth = 0.03
        ctx.beginPath()
        const off = (t.travel * 1.6) % 0.14
        for (let x = -0.43 + off; x < 0.43; x += 0.14) { ctx.moveTo(x, side > 0 ? 0.23 : -0.39); ctx.lineTo(x, side > 0 ? 0.39 : -0.23) }
        ctx.stroke()
      }
      const body = ctx.createLinearGradient(0, -0.28, 0, 0.28)
      body.addColorStop(0, shade(hue, 0.25)); body.addColorStop(1, shade(hue, -0.15))
      ctx.fillStyle = body
      ctx.beginPath(); ctx.roundRect(-0.37, -0.26, 0.74, 0.52, 0.1); ctx.fill()
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)'; ctx.lineWidth = 0.035
      ctx.beginPath(); ctx.roundRect(-0.35, -0.24, 0.7, 0.48, 0.09); ctx.stroke()
      ctx.restore()
      // the turret and its barrel
      ctx.rotate(t.turret)
      ctx.fillStyle = shade(hue, -0.3)
      ctx.beginPath(); ctx.roundRect(0, -0.07, 0.56, 0.14, 0.04); ctx.fill()
      ctx.fillStyle = shade(hue, -0.45)
      ctx.fillRect(0.48, -0.085, 0.09, 0.17)
      const top = ctx.createRadialGradient(-0.06, -0.07, 0.02, 0, 0, 0.22)
      top.addColorStop(0, shade(hue, 0.45)); top.addColorStop(1, shade(hue, -0.05))
      ctx.fillStyle = top
      ctx.beginPath(); ctx.arc(0, 0, 0.21, 0, Math.PI * 2); ctx.fill()
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)'; ctx.lineWidth = 0.03
      ctx.stroke()
      if (t.player) { ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(0, 0, 0.065, 0, Math.PI * 2); ctx.fill() }
      ctx.restore()
    }
    // Your shots ready, under your tank: five pips, one emptied for each of
    // your shells still out, filled again as each one goes (and the mines
    // you have left beside them)
    const drawReady = (w) => {
      const P = R.playerOf(w)
      if (!P?.alive || (G.phase !== 'play' && G.phase !== 'intro' && G.phase !== 'paused')) return
      const out = w.shells.filter((s) => s.owner === P.id).length
      const mines = w.mines.filter((m) => m.owner === P.id).length
      // (below the tank on the screen, however the arena is turned)
      const at = (sx, sy) => (uprightRef.current ? { x: P.x - sy, y: P.y + sx } : { x: P.x + sx, y: P.y + sy })
      const n = P.kind.maxShells, gap = 0.21
      for (let i = 0; i < n; i += 1) {
        const q = at((i - (n - 1) / 2) * gap, 0.7)
        const ready = i < n - out
        ctx.beginPath(); ctx.arc(q.x, q.y, 0.075, 0, Math.PI * 2)
        ctx.fillStyle = ready ? (pal.dark ? '#ffffff' : pal.resolve(P.kind.hue)) : rgba(pal.text, 0.15)
        ctx.fill()
        if (ready) { ctx.strokeStyle = pal.dark ? rgba(pal.resolve(P.kind.hue), 0.9) : 'rgba(255, 255, 255, 0.9)'; ctx.lineWidth = 0.03; ctx.stroke() }
      }
      for (let i = 0; i < P.kind.mines; i += 1) {
        const q = at(((n - 1) / 2) * gap + 0.3 + i * 0.2, 0.7)
        ctx.beginPath(); ctx.arc(q.x, q.y, 0.065, 0, Math.PI * 2)
        ctx.fillStyle = i < P.kind.mines - mines ? (pal.dark ? '#ffe27a' : '#c98a00') : rgba(pal.text, 0.15)
        ctx.fill()
      }
    }
    const drawMine = (m) => {
      const left = R.mineFuse - m.age
      const blink = left < 3 ? 7 : 1.6
      const on = (m.age * blink) % 1 < 0.5
      ctx.fillStyle = rgba(pal.shadow, 0.25)
      const f = fall(0.33)
      ctx.beginPath(); ctx.arc(m.x + f.x, m.y + f.y, 0.24, 0, Math.PI * 2); ctx.fill()
      ctx.fillStyle = pal.dark ? '#2a3350' : '#4a4038'
      ctx.beginPath(); ctx.arc(m.x, m.y, 0.22, 0, Math.PI * 2); ctx.fill()
      ctx.strokeStyle = pal.resolve(m.hue); ctx.lineWidth = 0.06
      ctx.beginPath(); ctx.arc(m.x, m.y, 0.19, 0, Math.PI * 2); ctx.stroke()
      if (on) {
        const glow = ctx.createRadialGradient(m.x, m.y, 0, m.x, m.y, 0.3)
        glow.addColorStop(0, left < 3 ? '#ff5b4a' : '#ffe27a'); glow.addColorStop(1, 'rgba(255, 200, 80, 0)')
        ctx.fillStyle = glow
        ctx.beginPath(); ctx.arc(m.x, m.y, 0.3, 0, Math.PI * 2); ctx.fill()
      }
    }
    const drawShells = (w) => {
      for (const p of w.smoke) {
        const k = p.age / 0.45
        ctx.fillStyle = pal.dark ? `rgba(200, 215, 255, ${0.28 * (1 - k)})` : `rgba(255, 255, 255, ${0.6 * (1 - k)})`
        ctx.beginPath(); ctx.arc(p.x, p.y, 0.05 + k * 0.12, 0, Math.PI * 2); ctx.fill()
      }
      for (const s of w.shells) {
        const a = Math.atan2(s.vy, s.vx)
        const f = fall(0.35)
        ctx.fillStyle = rgba(pal.shadow, 0.25)
        ctx.beginPath(); ctx.ellipse(s.x + f.x, s.y + f.y, 0.15, 0.07, a, 0, Math.PI * 2); ctx.fill()
        ctx.save()
        ctx.translate(s.x, s.y); ctx.rotate(a)
        if (s.fast) {
          // a rocket's flame behind it
          const f = ctx.createLinearGradient(-0.45, 0, -0.1, 0)
          f.addColorStop(0, 'rgba(255, 140, 60, 0)'); f.addColorStop(1, 'rgba(255, 220, 120, 0.9)')
          ctx.fillStyle = f
          ctx.beginPath(); ctx.moveTo(-0.45, 0); ctx.lineTo(-0.1, -0.06); ctx.lineTo(-0.1, 0.06); ctx.fill()
        }
        ctx.fillStyle = '#ffffff'
        ctx.beginPath(); ctx.roundRect(-0.14, -0.065, 0.28, 0.13, 0.065); ctx.fill()
        ctx.fillStyle = pal.resolve(s.hue)
        ctx.beginPath(); ctx.roundRect(-0.14, -0.065, 0.1, 0.13, [0.065, 0, 0, 0.065]); ctx.fill()
        ctx.restore()
      }
    }
    const drawAir = (w) => {
      for (const b of w.bits) {
        const k = b.age / b.life
        ctx.fillStyle = b.hot ? `rgba(255, ${Math.round(220 - k * 140)}, 90, ${1 - k})` : rgba(pal.text, 0.35 * (1 - k))
        ctx.beginPath(); ctx.arc(b.x, b.y, (b.hot ? 0.09 : 0.05) * (1 - k * 0.5), 0, Math.PI * 2); ctx.fill()
      }
      for (const b of w.blasts) {
        const k = b.age / 0.6, r = b.r * (0.35 + 0.65 * (1 - Math.pow(1 - Math.min(1, k * 1.6), 3)))
        const g = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, r)
        g.addColorStop(0, `rgba(255, 255, 240, ${0.95 * (1 - k)})`)
        g.addColorStop(0.45, rgba(pal.b, 0.75 * (1 - k)))
        g.addColorStop(1, rgba(pal.b, 0))
        ctx.fillStyle = g
        ctx.beginPath(); ctx.arc(b.x, b.y, r, 0, Math.PI * 2); ctx.fill()
        ctx.strokeStyle = `rgba(255, 255, 255, ${0.8 * (1 - k)})`; ctx.lineWidth = 0.05
        ctx.beginPath(); ctx.arc(b.x, b.y, r, 0, Math.PI * 2); ctx.stroke()
      }
    }
    // where you are aiming: a line of dots from the barrel to the pointer
    const drawAim = (w) => {
      const I = input.current
      const P = R.playerOf(w)
      if (!P?.alive || G.phase !== 'play') return
      // the aiming thumb: where the shot would go, off the walls and all
      if (I.aim?.aiming) {
        const path = R.traceShot(w, P, P.turret, P.kind.bounces, 30).path
        ctx.save()
        ctx.strokeStyle = rgba(pal.text, 0.5); ctx.lineWidth = 0.09; ctx.lineCap = 'round'
        ctx.setLineDash([0.01, 0.3])
        ctx.beginPath(); ctx.moveTo(path[0].x, path[0].y)
        for (const q of path.slice(1)) ctx.lineTo(q.x, q.y)
        ctx.stroke()
        ctx.restore()
        return
      }
      if (!I.pointer || touchNow) return
      // the crosshair goes only so far from the tank, however far off the
      // pointer is: on the line towards it, at most AIM_REACH squares out
      // (and never past the arena's edge)
      let to = toWorld(I.pointer)
      const mouse = to
      const m = 0.35, dx = to.x - P.x, dy = to.y - P.y
      let k = Math.min(1, AIM_REACH / (Math.hypot(dx, dy) || 1))
      if (dx > 0) k = Math.min(k, (R.COLS - m - P.x) / dx)
      if (dx < 0) k = Math.min(k, (m - P.x) / dx)
      if (dy > 0) k = Math.min(k, (R.ROWS - m - P.y) / dy)
      if (dy < 0) k = Math.min(k, (m - P.y) / dy)
      to = { x: P.x + dx * Math.max(0, k), y: P.y + dy * Math.max(0, k) }
      const d = Math.hypot(to.x - P.x, to.y - P.y)
      ctx.fillStyle = rgba(pal.text, 0.35)
      for (let s = 0.75; s < d - 0.2; s += 0.38) {
        ctx.beginPath(); ctx.arc(P.x + Math.cos(P.turret) * s, P.y + Math.sin(P.turret) * s, 0.045, 0, Math.PI * 2); ctx.fill()
      }
      ctx.strokeStyle = rgba(pal.text, 0.7); ctx.lineWidth = 0.05
      ctx.beginPath(); ctx.arc(to.x, to.y, 0.22, 0, Math.PI * 2); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(to.x - 0.34, to.y); ctx.lineTo(to.x - 0.12, to.y); ctx.moveTo(to.x + 0.12, to.y); ctx.lineTo(to.x + 0.34, to.y)
      ctx.moveTo(to.x, to.y - 0.34); ctx.lineTo(to.x, to.y - 0.12); ctx.moveTo(to.x, to.y + 0.12); ctx.lineTo(to.x, to.y + 0.34); ctx.stroke()
      // (the mouse itself hidden, held in the arena: a faint mark where it
      // is, only while it is pushed out past the arena's edge, where the
      // cursor would have left it; and not in full screen)
      const { u, v } = I.held || {}
      if (I.held && !fullRef.current && (u <= 0 || u >= 1 || v <= 0 || v >= 1) && Math.hypot(mouse.x - to.x, mouse.y - to.y) > 0.4) {
        ctx.fillStyle = rgba(pal.text, 0.35)
        const mx = Math.max(0.35, Math.min(R.COLS - 0.35, mouse.x)), my = Math.max(0.35, Math.min(R.ROWS - 0.35, mouse.y))
        ctx.beginPath(); ctx.arc(mx, my, 0.11, 0, Math.PI * 2); ctx.fill()
      }
    }
    const draw = () => {
      const w = G.world
      ctx.save()
      ctx.scale(S, S)
      if (uprightRef.current) { ctx.translate(0, R.COLS); ctx.rotate(-Math.PI / 2) }
      drawFloor(w)
      drawBlocks(w)
      for (const m of w.mines) drawMine(m)
      for (const t of w.tanks) if (t.alive) drawTank(t)
      drawReady(w)
      drawShells(w)
      drawAir(w)
      drawAim(w)
      ctx.restore()
    }

    // --- the loop ---
    let raf = 0, last = performance.now()
    const loop = (now) => {
      raf = requestAnimationFrame(loop)
      const dt = Math.min(0.033, (now - last) / 1000)
      last = now
      heldPointer()
      // (a click or a mine asked for between rounds is not saved for the next)
      if (G.phase !== 'play') { input.current.fire = false; input.current.mine = false }
      if (G.phase === 'play' || G.phase === 'hit' || G.phase === 'clear') {
        const ev = R.step(G.world, dt, G.phase === 'play' ? readInput() : { move: { x: 0, y: 0 }, aim: null, fire: false, mine: false })
        let killed = false
        for (const e of ev) {
          if (e.type === 'fire') play('fire', e.tank.kind.shellSpeed > 7)
          else if (e.type === 'bounce') play('bounce')
          else if (e.type === 'clink') play('clink')
          else if (e.type === 'mine') play('mine')
          else if (e.type === 'boom') play('boom')
          else if (e.type === 'kill') {
            killed = true
            play('boom')
            if (!e.tank.player) G.kills += 1
          }
        }
        if (killed) show()
      }
      if (G.phase === 'play') {
        if (!R.playerOf(G.world).alive) {
          G.phase = 'hit'; G.timer = 2.2; G.lives -= 1; show()
          setTimeout(() => play('lose'), 500)
        } else if (R.enemiesLeft(G.world) === 0) {
          G.phase = 'clear'; G.timer = 2.4
          if (G.round % 5 === 0 && G.lives < MAX_LIVES) { G.lives += 1; G.extra = true }
          show()
          play('win')
        }
      } else if (G.phase === 'intro' || G.phase === 'hit' || G.phase === 'clear') {
        G.timer -= dt
        if (G.timer <= 0) {
          if (G.phase === 'intro') { G.phase = 'play'; show() }
          else if (G.phase === 'clear') begin(G.round + 1, true)
          else if (G.lives <= 0) {
            G.phase = 'over'
            unlock()
            // (the best: the furthest round reached, as the game over says)
            setBest((b) => { if (G.round > b) { saveBest(G.round); return G.round } return b })
            show()
          }
          else begin(G.round, false)
        }
      }
      draw()
    }
    raf = requestAnimationFrame(loop)

    // --- input ---
    const go = () => {
      if (soundOn.current) sfx.wake()
      if (G.phase === 'ready' || G.phase === 'over') { G.start(); return true }
      if (G.phase === 'paused') { G.pause(false); return true }
      return false
    }
    const onKey = (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      if (e.code === 'Escape' && performance.now() - freed < 400) return   // (the Escape that let the mouse go)
      if (e.code === 'Escape' && fullRef.current && !document.fullscreenElement) return   // (the Escape that leaves the window-filling full screen)
      if (e.code === 'Escape' || e.code === 'KeyP') { G.pause(G.phase !== 'paused'); return }
      if (GAME_KEYS.has(e.code) || e.code === 'Enter') e.preventDefault()
      if (e.code === 'Enter' || e.code === 'Space') { if (go()) { lock(); return } }
      if (e.code === 'Space' && !e.repeat) input.current.mine = true
      if (GAME_KEYS.has(e.code)) input.current.keys.add(e.code)
    }
    const onKeyUp = (e) => input.current.keys.delete(e.code)
    const onBlur = () => {
      const I = input.current
      I.keys.clear(); I.move = null; I.aim = null; I.aimAngle = null
      showStick('move', null); showStick('aim', null)
      G.pause(true)
    }
    const onHidden = () => { if (document.hidden) onBlur() }
    const onDown = (e) => {
      const I = input.current
      if (e.pointerType === 'touch') return          // (the thumbs: onTouchDown)
      touchNow = false
      canvas.focus({ preventScroll: true })
      if (!locked()) I.pointer = { x: e.clientX, y: e.clientY }
      if (go()) { lock(); return }
      if (G.phase !== 'play') return
      lock()
      if (e.button === 2) I.mine = true
      else if (e.button === 0) I.fire = true
    }
    // --- the two thumbs, on a touch screen ---
    // (a stick drawn where its thumb went down: a ring, and the knob pushed)
    const showStick = (which, st) => {
      const el = stickRefs.current[which]
      if (!el) return
      if (!st) { el.style.display = 'none'; return }
      el.style.display = ''
      el.style.left = `${st.ox}px`; el.style.top = `${st.oy}px`
      el.firstChild.style.transform = `translate(${(st.x * STICK).toFixed(1)}px, ${(st.y * STICK).toFixed(1)}px)`
    }
    // a thumb's push, as a share of the stick's reach
    const push = (st, e) => {
      const dx = e.clientX - st.ox, dy = e.clientY - st.oy, d = Math.hypot(dx, dy)
      const k = d > STICK ? STICK / d : 1
      st.x = (dx * k) / STICK; st.y = (dy * k) / STICK
      return d
    }
    // the angle in the arena a push on the screen points (turned with it)
    const screenToArena = (x, y) => (uprightRef.current ? Math.atan2(x, -y) : Math.atan2(y, x))
    // a tap: the nearest enemy a shell would reach straight, or else the nearest
    const nearestAim = () => {
      const w = G.world, P = R.playerOf(w)
      let best = null
      for (const t of w.tanks) {
        if (t.player || !t.alive) continue
        const a = Math.atan2(t.y - P.y, t.x - P.x), d = Math.hypot(t.x - P.x, t.y - P.y)
        const clear = R.traceShot(w, P, a, 0).tank === t
        const score = d + (clear ? 0 : 100)
        if (!best || score < best.score) best = { a, score }
      }
      return best ? best.a : P.turret
    }
    const onTouchDown = (e) => {
      if (e.pointerType !== 'touch' || e.target.closest('button, a')) return
      touchNow = true
      e.preventDefault()
      if (go()) return
      if (G.phase !== 'play') return
      const I = input.current
      const st = { id: e.pointerId, ox: e.clientX, oy: e.clientY, x: 0, y: 0, t0: performance.now(), aiming: false }
      if (e.clientX < window.innerWidth / 2) { if (!I.move) { I.move = st; showStick('move', st) } }
      else if (!I.aim) { I.aim = st; showStick('aim', st) }
    }
    const onMove = (e) => {
      const I = input.current
      if (e.pointerType === 'touch') {
        if (I.move?.id === e.pointerId) { push(I.move, e); showStick('move', I.move) }
        else if (I.aim?.id === e.pointerId) {
          const d = push(I.aim, e)
          if (d > AIMED) I.aim.aiming = true
          if (I.aim.aiming) I.aimAngle = screenToArena(I.aim.x, I.aim.y)
          showStick('aim', I.aim)
        }
        return
      }
      touchNow = false
      if (I.held) {
        const r = canvas.getBoundingClientRect()
        I.held.u = clamp01(I.held.u + (e.movementX || 0) / r.width)
        I.held.v = clamp01(I.held.v + (e.movementY || 0) / r.height)
        heldPointer()
        return
      }
      I.pointer = { x: e.clientX, y: e.clientY }
    }
    const onUp = (e) => {
      const I = input.current
      if (I.move?.id === e.pointerId) { I.move = null; showStick('move', null); return }
      if (I.aim?.id !== e.pointerId) return
      const st = I.aim
      I.aim = null
      showStick('aim', null)
      if (e.type === 'pointerup' && G.phase === 'play') {
        // let go aimed: fired that way; tapped: at the nearest tank
        if (!st.aiming) I.aimAngle = nearestAim()
        else I.aimAngle = screenToArena(st.x, st.y)
        I.fire = true
        // (the angle held for the frame that fires, then given back)
        requestAnimationFrame(() => requestAnimationFrame(() => { if (!input.current.aim) input.current.aimAngle = null }))
      } else I.aimAngle = null
    }
    const noMenu = (e) => e.preventDefault()
    G.layMine = () => { if (G.phase === 'play') input.current.mine = true }

    window.addEventListener('keydown', onKey)
    document.addEventListener('pointerlockchange', onLockChange)
    window.addEventListener('keyup', onKeyUp)
    window.addEventListener('blur', onBlur)
    document.addEventListener('visibilitychange', onHidden)
    canvas.addEventListener('pointerdown', onDown)
    const page = pageRef.current
    page.addEventListener('pointerdown', onTouchDown)
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)
    canvas.addEventListener('contextmenu', noMenu)
    return () => {
      cancelAnimationFrame(raf)
      document.removeEventListener('pointerlockchange', onLockChange)
      unlock()
      themeWatch.disconnect()
      window.removeEventListener('resize', fit)
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('keyup', onKeyUp)
      window.removeEventListener('blur', onBlur)
      document.removeEventListener('visibilitychange', onHidden)
      canvas.removeEventListener('pointerdown', onDown)
      page.removeEventListener('pointerdown', onTouchDown)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
      canvas.removeEventListener('contextmenu', noMenu)
    }
  }, [])

  // (turned: the canvas sized again, and drawn the new way round)
  useEffect(() => { uprightRef.current = upright; fullRef.current = full; game.current?.refit() }, [upright, full])

  const AW = upright ? H : W, AH = upright ? W : H
  const tap = touch ? 'Tap' : 'Click'
  const tanks = (n) => `${n} enemy ${n === 1 ? 'tank' : 'tanks'}`
  const banner = {
    ready: { big: 'Glass Tanks', small: `${tap} to start` },
    intro: { big: `Round ${hud.round}`, small: tanks(hud.left), kinds: hud.kinds },
    clear: { big: 'Round clear!', small: hud.extra ? 'Extra life!' : `On to round ${hud.round + 1}` },
    hit: { big: 'Hit!', small: hud.lives > 0 ? `${hud.lives} ${hud.lives === 1 ? 'life' : 'lives'} left` : 'No lives left' },
    over: {
      big: 'Game over',
      small: `You reached round ${hud.round} and took out ${hud.kills} ${hud.kills === 1 ? 'tank' : 'tanks'}. ${tap} to play again`,
    },
    paused: { big: 'Paused', small: `${tap} or press P to carry on` },
  }[hud.phase]
  const how = touch
    ? 'Left thumb drives. Right thumb aims, and fires when you let go (or tap to fire at the nearest tank).'
    : 'WASD or the arrow keys to drive, the mouse to aim, click to fire, space for a mine. Esc frees the mouse; F for full screen.'

  return (
    <div ref={pageRef} style={{
      // (the thumbs hold the page still while a round is on, and only then)
      touchAction: touch && hud.phase !== 'ready' && hud.phase !== 'over' ? 'none' : undefined,
      minHeight: 'var(--screen)',
      background: 'var(--bg)',
      color: 'var(--text)',
      fontFamily: 'system-ui',
      display: 'flex',
      flexDirection: short ? 'row' : 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: short ? '70px 24px 20px' : '110px 16px 60px',
    }}>
      <div ref={stageRef} className={`tanks-stage${full ? ' tanks-full' : ''}`} style={{
        display: 'flex',
        flexDirection: short && !full ? 'row' : 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: full ? 10 : short ? 24 : 14,
        width: '100%',
      }}>
      <div style={{
        width: full
          ? `min(100%, calc((100dvh - ${touch ? 96 : 84}px) * ${(AW / AH).toFixed(4)}))`
          : short
            ? `min(${AW}px, calc((var(--screen) - 150px) * ${(AW / AH).toFixed(4)}))`
            : `min(${AW}px, calc((var(--screen) - 250px) * ${(AW / AH).toFixed(4)}))`,
        maxWidth: '100%',
      }}>
        <div style={{
          display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'baseline', gap: '4px 12px',
          marginBottom: 8, fontSize: TYPE.small, color: 'var(--text-muted)', letterSpacing: '0.08em',
        }}>
          <span>GLASS TANKS</span>
          <span style={{ whiteSpace: 'nowrap' }}>
            ROUND {hud.round}{'   '}·{'   '}LIVES {Math.max(0, hud.lives)}{'   '}·{'   '}{hud.left} LEFT{best > 0 ? `   ·   BEST ${best}` : ''}
          </span>
        </div>
        <div style={{ position: 'relative' }}>
          <canvas
            ref={canvasRef}
            tabIndex={-1}
            className="tanks-arena"
            style={{
              width: '100%', height: 'auto', aspectRatio: `${AW} / ${AH}`, display: 'block',
              borderRadius: 14, touchAction: 'none', outline: 'none',
              cursor: hud.phase === 'play' && !touch ? 'none' : 'pointer',
            }}
          />
          {/* the thumbs' sticks, shown where each went down */}
          {['move', 'aim'].map((which) => (
            <div key={which} ref={(el) => { stickRefs.current[which] = el }} className={`tanks-stick tanks-stick-${which}`} style={{ display: 'none' }} aria-hidden="true">
              <i />
            </div>
          ))}
          {banner && (
            <div className="tanks-banner" aria-live="polite">
              <div className="tanks-banner-card glass nav-glass">
                <strong>{banner.big}</strong>
                <span>{banner.small}</span>
                {banner.kinds?.length > 0 && (
                  <span className="tanks-kinds">
                    {banner.kinds.map((k) => (
                      <span key={k.name}><i style={{ background: k.hue }} />{k.n > 1 ? `${k.n} ` : ''}{k.name}{k.n > 1 ? 's' : ''}</span>
                    ))}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <div style={{ textAlign: short && !full ? 'left' : 'center', maxWidth: short && !full ? 220 : 560 }}>
        {!full && <p style={{ margin: 0, fontSize: TYPE.small, color: 'var(--text-muted)' }}>{how}</p>}
        <div style={{ display: 'flex', gap: 8, justifyContent: short && !full ? 'flex-start' : 'center', marginTop: full ? 0 : 12, flexWrap: 'wrap' }}>
          {touch && (
            <button type="button" className="pool-button"
              onPointerDown={(e) => { e.preventDefault(); game.current?.layMine() }}>
              Lay a mine
            </button>
          )}
          <button type="button" className={`pool-button${sound ? ' pool-button-on' : ''}`} aria-pressed={sound} onClick={toggleSound}>
            Sound {sound ? 'on' : 'off'}
          </button>
          <button type="button" className="pool-button" aria-pressed={full} onClick={toggleFull}>
            {full ? 'Exit full screen' : 'Full screen'}{touch ? '' : ' (F)'}
          </button>
        </div>
        {!full && (
          <p style={{ marginTop: short ? 14 : 20 }}>
            <Link to="/games" className="hub-link" style={{ color: 'var(--text-muted)', fontSize: TYPE.small }}>
              Back to games
            </Link>
          </p>
        )}
      </div>
      </div>
    </div>
  )
}
