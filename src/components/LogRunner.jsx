// src/components/LogRunner.jsx
//
// A runner hidden at /log: the Log rolls in place while the other Clash Royale
// models come at it. Drawn on a canvas rather than in the DOM — sixty frames a
// second of React state updates for a dozen moving things is a lot of work for
// no benefit, and a canvas keeps the whole loop in one place.
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { TYPE } from '../styles/type'
import drawGrass from './grass'
import drawSky from './sky'
import { playStart, preload } from './sound'
import asset from '../lib-asset'
import { useIsTouch, useIsShort } from '../hooks/useIsPhone'

// The play area's own coordinates. The canvas is scaled to fit its column, so
// everything below can be written in these units and stay put at any size.
const W = 800
const H = 300
const GROUND = 250

const LOG_X = 90
const GRAVITY = 0.62
const JUMP = 12          // gives an apex of about 116px, over a second of air

// Landing gives a good deal back rather than stopping dead. Over half the speed
// it came down at, so a hard landing hops twice before it settles and a gentle
// one barely hops at all — the bounce is the fall's own speed handed back, which
// is what ties the two together. Under a threshold it simply stops, so it cannot
// shiver in place.
// How long a jump pressed in mid-air waits for the ground. Long enough to cover
// a bounce and a little early pressing, short enough that it cannot fire from
// something pressed on the way up.
const BUFFER = 26

const BOUNCE = 0.55
const BOUNCE_FLOOR = 2.4


// The log is drawn smaller than its scale against the other models would put it:
// at full size it crowds a 300px play area and leaves too little daylight to read
// a jump. The jump itself is untouched, so this buys height over every obstacle.
const LOG_SCALE = 0.75

const START_SPIN = Math.PI / 4     // resting on a corner rather than square-on

const START_SPEED = 5
const ACCELERATION = 0.004     // and never stops; there is no top speed

// Past this the run is quick enough that an obstacle is on you before it can be
// read, so the gaps start opening: every unit of speed over it buys this much
// extra room, which hands back in spacing what the speed takes away in warning.
// Without it the game does not get harder so much as it stops being playable.
const SPEED_EASE = 11
const RELIEF = 0.55

// One jump's worth of ground, in frames: take-off to landing under a constant
// pull. Spacing is written in these units, so a gap means the same thing to the
// player whatever the log is traveling at.
const AIR_FRAMES = (2 * JUMP) / GRAVITY

// Obstacles crowd in as the run goes on, measured in jumps rather than seconds:
// better than two jumps' room between them at the start, barely more than one by
// the end. Paced off distance traveled so it does not drift with the frame rate.
const RAMP_DISTANCE = 24000
const GAP_START = 2.4
const GAP_END = 1.35
const GAP_JITTER = 0.7

// Collision runs against a coarse map of each sprite's own shape rather than its
// rectangle. The elixir collector is a thin pipe over a wide base and the barrel
// hangs well under its balloons, so a box around either is mostly air.
const MASK_CELLS = 16
const MASK_ALPHA = 30      // a cell counts as solid at about a tenth covered
const FORGIVENESS = 0.06   // shaves the log's radius so a graze is not a hit

// The log spins, so a circle is the only hitbox that stays honest as it turns.

const SPRITES = {
  log: asset('/game/log.png'),
  'cannon-cart': asset('/game/cannon-cart.png'),
  mortar: asset('/game/mortar.png'),
  'elixir-collector': asset('/game/elixir-collector.png'),
  'skeleton-barrel': asset('/game/skeleton-barrel.png'),
}

// The three that sit on the ground. Sizes are half the sprite's own, which is
// drawn at 2x so it stays sharp on a high-resolution screen.
const GROUNDED = ['cannon-cart', 'mortar', 'elixir-collector']

// The barrel floats, like the birds in the game this borrows from. Low ones have
// to be jumped; high ones have to be run under, so jumping at the wrong moment
// is what catches you out.
//
// A low one rests on the ground rather than hovering. It is the tallest sprite in
// the game, so lifting it as well left an 83ms window to start the jump at
// starting speed — against 150-183ms for everything else, which is the difference
// between hard and impossible. On the ground it matches them.
const FLIGHT = { low: 0, high: 110 }

const HIGH_SCORE_KEY = 'log-runner-best'

// Reduces a sprite to a grid of solid and empty cells by letting the canvas
// average its alpha down: a cell that is mostly transparent falls below the
// threshold and stops counting as something to crash into.
const buildMask = (img) => {
  try {
    const c = document.createElement('canvas')
    c.width = MASK_CELLS
    c.height = MASK_CELLS
    const cx = c.getContext('2d', { willReadFrequently: true })
    cx.drawImage(img, 0, 0, MASK_CELLS, MASK_CELLS)
    const { data } = cx.getImageData(0, 0, MASK_CELLS, MASK_CELLS)
    const cells = new Uint8Array(MASK_CELLS * MASK_CELLS)
    let minX = MASK_CELLS
    let minY = MASK_CELLS
    let maxX = 0
    let maxY = 0
    for (let i = 0; i < cells.length; i += 1) {
      if (data[i * 4 + 3] < MASK_ALPHA) continue
      cells[i] = 1
      const x = i % MASK_CELLS
      const y = Math.floor(i / MASK_CELLS)
      if (x < minX) minX = x
      if (y < minY) minY = y
      if (x + 1 > maxX) maxX = x + 1
      if (y + 1 > maxY) maxY = y + 1
    }
    return maxX === 0 ? null : { cells, minX, minY, maxX, maxY }
  } catch {
    return null      // a game is not worth breaking over a canvas that won't read
  }
}

// Sizes the log's circle from its own pixels: the radius at which 93 per cent of
// them sit, as a fraction of the sprite. That traces the wooden body and leaves
// out the four spikes, whose tips reach a fifth further and would otherwise be
// hitting things the player cannot see themselves hit.
const measureRadius = (img) => {
  try {
    const n = img.naturalWidth
    const c = document.createElement('canvas')
    c.width = n
    c.height = n
    const cx = c.getContext('2d', { willReadFrequently: true })
    cx.drawImage(img, 0, 0)
    const { data } = cx.getImageData(0, 0, n, n)
    const mid = n / 2
    const spread = []
    for (let y = 0; y < n; y += 1) {
      for (let x = 0; x < n; x += 1) {
        if (data[(y * n + x) * 4 + 3] < 40) continue
        spread.push(Math.hypot(x + 0.5 - mid, y + 0.5 - mid))
      }
    }
    if (!spread.length) return 0.5
    spread.sort((a, b) => a - b)
    return spread[Math.floor(spread.length * 0.93)] / n
  } catch {
    return 0.4
  }
}

// Where an obstacle's top edge sits this frame. Drawing and collision both read
// it, so a floating barrel cannot drift away from the thing it is tested against.
const obstacleTop = (o) => GROUND - o.h - o.lift - (o.lift ? Math.sin(o.bob) * 6 : 0)

// Circle against mask: only the cells the circle's own box reaches are looked at,
// which is a handful even at the closest pass.
const hits = (c, o, mask) => {
  const top = obstacleTop(o)
  if (!mask) {
    const inset = 0.14      // a sprite that never yielded a mask keeps its box
    return c.x + c.r > o.x + o.w * inset
      && c.x - c.r < o.x + o.w * (1 - inset)
      && c.y + c.r > top + o.h * inset
      && c.y - c.r < top + o.h * (1 - inset)
  }
  const cw = o.w / MASK_CELLS
  const ch = o.h / MASK_CELLS
  if (c.x + c.r < o.x + mask.minX * cw || c.x - c.r > o.x + mask.maxX * cw) return false
  if (c.y + c.r < top + mask.minY * ch || c.y - c.r > top + mask.maxY * ch) return false

  const fromX = Math.max(mask.minX, Math.floor((c.x - c.r - o.x) / cw))
  const toX = Math.min(mask.maxX - 1, Math.floor((c.x + c.r - o.x) / cw))
  const fromY = Math.max(mask.minY, Math.floor((c.y - c.r - top) / ch))
  const toY = Math.min(mask.maxY - 1, Math.floor((c.y + c.r - top) / ch))
  for (let gy = fromY; gy <= toY; gy += 1) {
    for (let gx = fromX; gx <= toX; gx += 1) {
      if (!mask.cells[gy * MASK_CELLS + gx]) continue
      const rx = o.x + gx * cw
      const ry = top + gy * ch
      const nx = Math.max(rx, Math.min(c.x, rx + cw))
      const ny = Math.max(ry, Math.min(c.y, ry + ch))
      const dx = c.x - nx
      const dy = c.y - ny
      if (dx * dx + dy * dy < c.r * c.r) return true
    }
  }
  return false
}

const readBest = () => {
  try {
    return Number(localStorage.getItem(HIGH_SCORE_KEY)) || 0
  } catch {
    return 0      // private windows throw; a high score is not worth a crash
  }
}

export default function LogRunner() {
  const touch = useIsTouch()
  const short = useIsShort()
  const canvasRef = useRef(null)
  const [state, setState] = useState('ready')     // ready | running | over
  const [score, setScore] = useState(0)
  const [best, setBest] = useState(readBest)

  // Everything the loop touches lives in a ref: a frame should not cause React
  // to re-render, only the score and the state around it should.
  const game = useRef({
    y: 0, vy: 0, spin: START_SPIN, speed: START_SPEED, distance: 0,
    obstacles: [], nextSpawn: 600, score: 0, over: false, buffered: 0, recent: [],
  })
  const sprites = useRef({})
  const masks = useRef({})
  const logRadius = useRef(0.4)
  // The loop runs outside React, so it reads the phase from a ref rather than
  // from the state it closes over. Kept in step in an effect: writing a ref
  // while rendering is not allowed.
  const stateRef = useRef(state)
  useEffect(() => { stateRef.current = state }, [state])

  useEffect(() => {
    preload()
    Object.entries(SPRITES).forEach(([name, src]) => {
      const img = new Image()
      // Shapes can only be read once the pixels are there, and a cached image is
      // already complete by the time the handler is attached.
      const measure = () => {
        if (name === 'log') logRadius.current = measureRadius(img)
        else masks.current[name] = buildMask(img)
      }
      img.onload = measure
      img.src = src
      if (img.complete && img.naturalWidth) measure()
      sprites.current[name] = img
    })
  }, [])

  const reset = () => {
    game.current = {
      y: 0, vy: 0, spin: START_SPIN, speed: START_SPEED, distance: 0,
      obstacles: [], nextSpawn: 600, score: 0, over: false, buffered: 0, recent: [],
    }
    setScore(0)
  }

  const jump = () => {
    const g = game.current
    if (stateRef.current === 'ready' || stateRef.current === 'over') {
      reset()
      playStart()
      setState('running')
      return
    }
    // Jumps leave from the ground and nowhere else, so every one of them clears
    // the same height. A press made in the air is not thrown away though — it is
    // held, and spent the moment the log next touches down, which is what the
    // player meant by it. Hopping after a landing would otherwise swallow presses
    // for a third of a second at a time.
    if (g.y === 0) g.vy = -JUMP
    else g.buffered = BUFFER
  }

  // The listener is bound once and calls through a ref, so it never has to be
  // torn down and rebuilt as the component re-renders.
  const jumpRef = useRef(jump)
  useEffect(() => { jumpRef.current = jump })

  useEffect(() => {
    const onKey = (e) => {
      if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'Enter') {
        e.preventDefault()
        jumpRef.current()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return undefined
    const ctx = canvas.getContext('2d')
    let frame
    let running = true

    // Sizing is done here rather than in the markup so the canvas matches the
    // screen's pixel density and the drawing stays crisp.
    const fit = () => {
      const ratio = window.devicePixelRatio || 1
      canvas.width = W * ratio
      canvas.height = H * ratio
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0)
    }
    fit()
    window.addEventListener('resize', fit)

    const paused = () => document.hidden
    // Sprites are drawn at half their own size, so they stay sharp on a
    // high-resolution screen. The crop is not quite square, hence both.
    //
    // A rolling log rides on its own radius, not on the corner of a sprite the
    // spikes have padded out, so it sits that difference lower and its wood meets
    // the ground rather than hovering a few pixels over it.
    const logBody = (lift) => {
      const w = ((sprites.current.log?.naturalWidth || 112) / 2) * LOG_SCALE
      const h = ((sprites.current.log?.naturalHeight || 112) / 2) * LOG_SCALE
      const wood = w * logRadius.current
      return { w, h, x: LOG_X + w / 2, y: GROUND - wood + lift, r: wood * (1 - FORGIVENESS) }
    }
    const color = (name, fallback) =>
      getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback

    const spawn = () => {
      const g = game.current
      const reach = g.speed * AIR_FRAMES        // ground covered by a single jump
      const previous = g.obstacles[g.obstacles.length - 1]
      const room = previous ? W + 40 - (previous.x + previous.w) : Infinity

      // Whatever has just come twice cannot come a third time. Three of the
      // same in a row reads as the game having run out of ideas, and it is the
      // one repeat a player notices — two of a kind passes for chance.
      const [before, last] = g.recent.slice(-2)
      const spent = before && before === last ? before : null

      const flying = spent !== 'skeleton-barrel' && Math.random() < 0.3
      // A barrel at head height has to be run under, which cannot be done if the
      // log is still in the air over the obstacle before it. Close behind
      // something, the barrel comes in low instead.
      const high = flying && room > reach * 1.6 && Math.random() < 0.5
      const ground = GROUNDED.filter((one) => one !== spent)
      const name = flying ? 'skeleton-barrel'
        : ground[Math.floor(Math.random() * ground.length)]
      const img = sprites.current[name]
      const w = (img?.naturalWidth || 80) / 2
      const h = (img?.naturalHeight || 80) / 2
      const lift = flying ? (high ? FLIGHT.high : FLIGHT.low) : 0
      g.obstacles.push({ name, x: W + 40, w, h, lift, bob: Math.random() * Math.PI * 2 })
      g.recent = [...g.recent, name].slice(-2)

      // The gap is this obstacle's own width plus a stretch of clear ground, and
      // that stretch shrinks from well over two jumps to a shade over one. Since
      // it is scaled by the current speed, it stays clearable throughout.
      const run = Math.min(1, g.distance / RAMP_DISTANCE)
      const relief = 1 + Math.max(0, (g.speed - SPEED_EASE) / SPEED_EASE) * RELIEF
      const gap = (GAP_START + (GAP_END - GAP_START) * run) * relief
      const jitter = GAP_JITTER * (1 - 0.65 * run)
      g.nextSpawn = w + reach * (gap + Math.random() * jitter)
    }

    // `tick` is how many sixtieths of a second have passed since the last
    // frame. Everything below moves by that much rather than by a fixed step,
    // because a screen that refreshes 120 times a second gets twice as many
    // frames and the whole game ran at double speed on one.
    const step = (tick) => {
      const g = game.current
      if (stateRef.current !== 'running') return

      g.speed += ACCELERATION * tick
      g.spin += g.speed * 0.05 * tick
      g.distance += g.speed * tick

      if (g.buffered > 0) g.buffered -= tick
      g.vy += GRAVITY * tick
      g.y += g.vy * tick                 // 0 is the ground; up is negative
      if (g.y >= 0) {
        const landed = g.vy
        g.y = 0
        if (g.buffered > 0) {
          g.buffered = 0                 // a press made in the air, spent here
          g.vy = -JUMP
        } else if (landed > BOUNCE_FLOOR) {
          g.vy = -landed * BOUNCE        // enough speed to be worth a rebound
        } else {
          g.vy = 0                       // or it settles
        }
      }

      g.nextSpawn -= g.speed * tick
      if (g.nextSpawn <= 0) spawn()
      g.obstacles.forEach((o) => { o.x -= g.speed * tick; o.bob += 0.06 * tick })
      g.obstacles = g.obstacles.filter((o) => o.x + o.w > -40)

      const log = logBody(g.y)
      for (const o of g.obstacles) {
        if (hits(log, o, masks.current[o.name])) {
          g.over = true
          setState('over')
          setScore(Math.floor(g.score))
          setBest((prev) => {
            const next = Math.max(prev, Math.floor(g.score))
            try { localStorage.setItem(HIGH_SCORE_KEY, String(next)) } catch { /* fine */ }
            return next
          })
          return
        }
      }

      const earned = g.speed * 0.06 * tick
      g.score += earned
      if (Math.floor(g.score) !== Math.floor(g.score - earned)) setScore(Math.floor(g.score))
    }

    const draw = () => {
      const g = game.current
      ctx.clearRect(0, 0, W, H)

      drawSky(ctx, W, 0, GROUND, g.distance,
        color('--sky-high', '#3fa4dd'), color('--sky-low', '#b3e2f6'),
        color('--cloud', 'rgba(255,255,255,0.95)'),
        color('--cloud-shade', 'rgba(186,214,236,0.95)'))

      // Scrolled by distance traveled, so the ground runs under the log
      drawGrass(ctx, W, GROUND, H, g.distance,
        color('--grass-a', '#7cc242'), color('--grass-b', '#6cb139'))

      const logImg = sprites.current.log
      const { w: lw, h: lh, x: lx, y: ly } = logBody(g.y)
      ctx.save()
      ctx.translate(lx, ly)
      ctx.rotate(g.spin)
      if (logImg?.complete && logImg.naturalWidth) {
        ctx.drawImage(logImg, -lw / 2, -lh / 2, lw, lh)
      } else {
        ctx.fillStyle = color('--text', '#000')
        ctx.fillRect(-lw / 2, -lh / 2, lw, lh)
      }
      ctx.restore()

      g.obstacles.forEach((o) => {
        const img = sprites.current[o.name]
        const y = obstacleTop(o)
        if (img?.complete && img.naturalWidth) ctx.drawImage(img, o.x, y, o.w, o.h)
        else { ctx.fillStyle = color('--text-muted', '#888'); ctx.fillRect(o.x, y, o.w, o.h) }
      })
    }

    let last = 0
    const loop = (now) => {
      if (!running) return
      if (paused()) {
        last = 0                         // a hidden tab is not time the log spent running
      } else {
        // Capped: coming back to a tab left open for a minute should not advance
        // the game by a minute in one step.
        const tick = last ? Math.min(3, ((now - last) * 60) / 1000) : 1
        last = now
        step(tick)
        draw()
      }
      frame = requestAnimationFrame(loop)
    }
    draw()
    frame = requestAnimationFrame(loop)

    return () => {
      running = false
      cancelAnimationFrame(frame)
      window.removeEventListener('resize', fit)
    }
  }, [])

  const prompt = state === 'ready'
    ? (touch ? 'Tap to start' : 'Press space to start')
    : state === 'over'
      ? (touch ? 'Tap to run again' : 'Press space to run again')
      : ''

  return (
    <div style={{
      minHeight: 'var(--screen)',
      background: 'var(--bg)',
      color: 'var(--text)',
      fontFamily: 'system-ui',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      // A phone on its side has width to spare and none of the height the
      // chrome above and below the game was sized against.
      padding: short ? '74px 24px 20px' : '120px 24px 80px',
      gap: 16,
    }}>
      {/* Wide enough to play, and never taller than the screen it is on: in
          landscape the height is what runs out, and a play area sized only by
          width pushed the prompt and the way back off the bottom. */}
      <div style={{
        width: short ? `min(${W}px, calc((var(--screen) - 205px) * ${(W / H).toFixed(3)}))` : W,
        maxWidth: '100%',
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          marginBottom: 8,
          fontSize: TYPE.small,
          color: 'var(--text-muted)',
          letterSpacing: '0.08em',
        }}>
          <span>THE LOG GAME</span>
          <span>{best > 0 && `BEST ${String(best).padStart(5, '0')}   `}{String(score).padStart(5, '0')}</span>
        </div>

        <canvas
          ref={canvasRef}
          onPointerDown={(e) => { e.preventDefault(); jump() }}
          style={{ width: '100%', height: 'auto', display: 'block', touchAction: 'manipulation', cursor: 'pointer' }}
        />

        <p style={{
          marginTop: 12,
          textAlign: 'center',
          fontSize: TYPE.small,
          color: 'var(--text-muted)',
          minHeight: '1.4em',
        }}>
          {prompt}
        </p>

        {/* The way back out. Both games are reached from the same page, so that
            is where this returns to rather than the site at large. */}
        <p style={{ textAlign: 'center', marginTop: 28 }}>
          <Link
            to="/games"
            className="hub-link"
            style={{ color: 'var(--text-muted)', fontSize: TYPE.small }}
          >
            Back to games
          </Link>
        </p>
      </div>
    </div>
  )
}
