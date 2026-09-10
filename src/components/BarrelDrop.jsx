// src/components/BarrelDrop.jsx
//
// Flappy Barrel, hidden at /barrel: the Skeleton Barrel drifts along under its
// balloons while gravity pulls it down, and every press gives it a shove back
// up. Drawn on a canvas for the same reason the runner is — sixty frames a
// second of React state for a dozen moving things is work for no benefit.
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { TYPE } from '../styles/type'
import drawGrass from './grass'
import drawSky from './sky'
import { playOver, preload } from './sound'
import asset from '../lib-asset'

// The play area's own coordinates. Portrait, where the runner is landscape:
// flappy games are about vertical room, not the ground ahead. The canvas is
// scaled to fit its column, so everything below stays put at any size.
const W = 480
const H = 640
const FLOOR = H - 26

const BARREL_X = 120
const BARREL_SCALE = 0.8         // of the sprite's own size, which is drawn at 2x
const GRAVITY = 0.5
const FLAP = 8.6                 // upward, so it is subtracted
const TERMINAL = 11              // stops a long drop from outrunning the tilt

// The whole thing swings as one, hanging from the balloons rather than turning
// about its middle: the pivot sits at row 63 of 160, where the strings gather
// under the balloons. So the balloons barely move and the barrel travels, which
// is how a load on a line behaves.
const PIVOT_ROW = 63 / 160
const PIVOT_X = -0.3 / 87          // the strings gather a hair left of centre

// The lean only ever grows from falling. A flap does not snap the barrel level;
// it takes a fixed bite out of whatever lean has built up, and several in a row
// are what bring it all the way upright. So a long drop recovers over a few
// flaps rather than one, which is where the weight in it comes from.
const TILT_UP = 0                // upright, and as far back as a flap can take it
const TILT_DOWN = 0.5            // the full lean, at terminal velocity
const TILT_RATE = 0.5            // of the way to that lean each frame
const TILT_FLAP = 0.2            // taken off the lean by one flap

// The columns are painted from the same six card colours the project carousels
// use, so the game belongs to the site rather than sitting in its own palette.
// Those tokens are theme-aware, so the columns follow light and dark for free.
const CARD_TONES = 6

const COLUMN_W = 70
const SPACING = 250              // ground between one pair and the next
const GAP_START = 230
const GAP_MIN = 158              // floored, so it never stops being flyable
const GAP_TIGHTEN = 4            // per pair passed
const MARGIN = 70                // keeps a gap off the very top and bottom

const SPEED_START = 3.2
const SPEED_MAX = 5.4
const SPEED_GAIN = 0.07          // per pair passed

// Boxes are shrunk before they are compared, so a near miss reads as a near
// miss. The balloons count: they are what the barrel is hanging from, and a
// barrel that sails through a column its balloons clipped looks broken.
const FORGIVENESS = 0.12

// The hit does not end the run on its own: the barrel blinks where it stands,
// the way an arcade game marks a life lost, and only then drops out of the sky.
//
// The timings are in seconds and the drop is driven by them rather than by
// gravity, because the sound the barrel dies to has two parts — the pop, then a
// second sound 0.98s later — and the landing is meant to fall on the second one.
// Under gravity the drop would take as long as the height it started from, which
// would only line up from one place on the screen. Measured against the clock
// rather than counted in frames, so it holds on a 120Hz screen too.
const DEATH_FLASH = 0.38         // seconds of blinking before it falls
const DEATH_DROP = 0.60          // and seconds falling: 0.98 in all
const DEATH_BLINK = 0.07         // seconds per on and off
const DEATH_TILT = 1.5           // nose down on the way down

const HIGH_SCORE_KEY = 'flappy-barrel-best'

const readBest = () => {
  try {
    return Number(localStorage.getItem(HIGH_SCORE_KEY)) || 0
  } catch {
    return 0      // private windows throw; a high score is not worth a crash
  }
}

const CAP_H = 18                 // the lip at the mouth of each column
const CAP_OUT = 7                 // how far that lip stands proud of the shaft
const COURSE = 46                 // spacing of the seams down the shaft

// Rounded where the canvas supports it, square where it does not — an older
// browser gets a plain column rather than nothing.
const box = (ctx, x, y, w, h, r) => {
  ctx.beginPath()
  if (ctx.roundRect) ctx.roundRect(x, y, w, h, r)
  else ctx.rect(x, y, w, h)
}

// One column, drawn from the mouth outwards: a lipped cap at the gap, then the
// shaft running away to the edge of the play area. The shading is two strips
// down the sides, which is enough to read as round rather than flat.
const drawColumn = (ctx, x, w, mouth, away, tone, deep, edge) => {
  const down = away > mouth                  // true for the lower half of a pair
  const capY = down ? mouth : mouth - CAP_H
  const shaftY = down ? mouth + CAP_H : away
  const shaftH = down ? away - mouth - CAP_H : mouth - CAP_H - away

  ctx.fillStyle = tone
  ctx.strokeStyle = edge
  ctx.lineWidth = 1.5

  box(ctx, x, shaftY, w, shaftH, 3)
  ctx.fill()
  ctx.stroke()

  // Seams, so a tall shaft does not read as one flat slab
  ctx.save()
  ctx.globalAlpha = 0.55
  ctx.strokeStyle = deep
  ctx.beginPath()
  for (let y = shaftY + COURSE; y < shaftY + shaftH - 4; y += COURSE) {
    ctx.moveTo(x + 1, Math.round(y) + 0.5)
    ctx.lineTo(x + w - 1, Math.round(y) + 0.5)
  }
  ctx.stroke()
  ctx.restore()

  // A darker strip down each side turns the slab into something round
  ctx.save()
  ctx.globalAlpha = 0.85
  ctx.fillStyle = deep
  ctx.fillRect(x + 1, shaftY, 7, shaftH)
  ctx.globalAlpha = 0.45
  ctx.fillRect(x + w - 7, shaftY, 6, shaftH)
  ctx.restore()

  // The cap takes the deeper stop of the pair, so the mouth reads first
  ctx.fillStyle = deep
  box(ctx, x - CAP_OUT, capY, w + CAP_OUT * 2, CAP_H, 4)
  ctx.fill()
  ctx.stroke()
}

// How far the sprite's lowest corner sits below the pivot once it has turned.
// Straight down that is just the part of it under the pivot, but a barrel on its
// way down turns most of the way over, which swings the corners out sideways and
// brings the whole thing much higher — measuring the untilted height instead
// left it stopping in mid-air a body above the grass.
const reachBelow = (w, h, tilt) => {
  const sin = Math.sin(tilt)
  const cos = Math.cos(tilt)
  const left = -w / 2 - w * PIVOT_X
  const right = w / 2 - w * PIVOT_X
  const above = -h * PIVOT_ROW
  const below = h * (1 - PIVOT_ROW)
  return Math.max(
    left * sin + above * cos, right * sin + above * cos,
    left * sin + below * cos, right * sin + below * cos,
  )
}

const fresh = () => ({
  y: H / 2, vy: 0, tilt: 0, columns: [], next: 0, score: 0, bob: 0, hue: 0, scroll: 0,
  dead: null, deadY: 0, deadTilt: 0,
})

export default function BarrelDrop() {
  const canvasRef = useRef(null)
  const [state, setState] = useState('ready')     // ready | running | over
  const [score, setScore] = useState(0)
  const [best, setBest] = useState(readBest)

  // Everything the loop touches lives in a ref: a frame should not cause React
  // to re-render, only the score and the state around it should.
  const game = useRef(fresh())
  const barrel = useRef(null)
  // The loop runs outside React, so it reads the phase from a ref rather than
  // from the state it closes over. Kept in step in an effect, since writing a
  // ref while rendering is not allowed.
  const stateRef = useRef(state)
  useEffect(() => { stateRef.current = state }, [state])

  useEffect(() => {
    preload()
    const img = new Image()
    img.src = asset('/game/skeleton-barrel.png')
    barrel.current = img
  }, [])

  const flap = () => {
    if (stateRef.current === 'running') {
      if (game.current.dead === null) {
        const g = game.current
        g.vy = -FLAP
        g.tilt = Math.max(TILT_UP, g.tilt - TILT_FLAP)
      }
      return        // nothing to be done about it once the barrel is falling
    }
    game.current = fresh()
    setScore(0)
    setState('running')
  }

  // The listener is bound once and calls through a ref, so it never has to be
  // torn down and rebuilt as the component re-renders.
  const flapRef = useRef(flap)
  useEffect(() => { flapRef.current = flap })

  useEffect(() => {
    const onKey = (e) => {
      if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'Enter') {
        e.preventDefault()
        flapRef.current()
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

    const colour = (name, fallback) =>
      getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback

    const size = () => {
      const img = barrel.current
      return {
        w: ((img?.naturalWidth || 87) / 2) * BARREL_SCALE,
        h: ((img?.naturalHeight || 160) / 2) * BARREL_SCALE,
      }
    }

    const gapFor = (passed) => Math.max(GAP_MIN, GAP_START - passed * GAP_TIGHTEN)
    const speedFor = (passed) => Math.min(SPEED_MAX, SPEED_START + passed * SPEED_GAIN)

    const addColumn = () => {
      const g = game.current
      const gap = gapFor(g.score)
      const top = MARGIN + Math.random() * (FLOOR - gap - MARGIN * 2)
      // Runs through the carousel's six card colours in turn, so no two
      // columns in sight of each other are the same.
      g.hue = (g.hue % CARD_TONES) + 1
      g.columns.push({ x: W + COLUMN_W, top, gap, passed: false, hue: g.hue })
      g.next = SPACING
    }

    // Sounded at the hit rather than at the landing: that is the moment the run
    // is over, and the clip is what the fall is timed against.
    const die = () => {
      const g = game.current
      g.dead = performance.now()
      g.deadY = g.y
      g.deadTilt = g.tilt
      playOver()
    }

    const finish = () => {
      const g = game.current
      setState('over')
      setScore(g.score)
      setBest((prev) => {
        const next = Math.max(prev, g.score)
        try { localStorage.setItem(HIGH_SCORE_KEY, String(next)) } catch { /* fine */ }
        return next
      })
    }

    // `tick` is how many sixtieths of a second the last frame took. Everything
    // moves by that rather than by a fixed step, or a 120Hz screen falls twice
    // as fast and the columns come at twice the rate.
    const step = (tick) => {
      const g = game.current
      if (stateRef.current !== 'running') {
        g.bob += 0.05                       // a gentle hover while waiting
        return
      }
      const { w, h } = size()

      // Hit already taken: blink on the spot, then drop, and only call the run
      // over once the barrel is on the ground. The columns stop where they are.
      if (g.dead !== null) {
        const since = (performance.now() - g.dead) / 1000
        if (since > DEATH_FLASH) {
          const fall = Math.min(1, (since - DEATH_FLASH) / DEATH_DROP)
          g.tilt = g.deadTilt + (DEATH_TILT - g.deadTilt) * fall
          // Where it comes to rest: the pivot sits above the middle, so the
          // sprite hangs below it by whatever its turned corners reach.
          const arm = h * (0.5 - PIVOT_ROW)
          const rest = FLOOR - reachBelow(w, h, DEATH_TILT) + arm
          // Squared, so it starts slowly and gathers pace the way a drop does
          g.y = g.deadY + (rest - g.deadY) * fall * fall
          if (fall >= 1) finish()
        }
        return
      }

      const speed = speedFor(g.score)

      g.vy = Math.min(TERMINAL, g.vy + GRAVITY * tick)
      g.y += g.vy * tick

      // The lean follows the fall, and only ever downwards from here: nothing in
      // the loop lifts the nose, which is the flap's job alone.
      const want = TILT_DOWN * Math.min(1, Math.max(0, g.vy) / TERMINAL)
      if (want > g.tilt) g.tilt += (want - g.tilt) * Math.min(1, TILT_RATE * tick)

      g.scroll += speed * tick
      g.next -= speed * tick
      if (g.next <= 0) addColumn()
      g.columns.forEach((c) => { c.x -= speed * tick })
      g.columns = g.columns.filter((c) => c.x + COLUMN_W > -20)

      // Off the top counts, or a barrel could sit above the columns and idle.
      if (g.y - h / 2 < -h || g.y + h / 2 > FLOOR) {
        die()
        return
      }

      // Swinging from a point above its middle carries the barrel sideways, so
      // the box follows it round rather than staying under the balloons.
      const arm = h * (0.5 - PIVOT_ROW)
      const cx = BARREL_X - Math.sin(g.tilt) * arm
      const cy = g.y - arm + Math.cos(g.tilt) * arm

      const box = {
        x: cx - w / 2 + w * FORGIVENESS,
        y: cy - h / 2 + h * FORGIVENESS,
        w: w * (1 - FORGIVENESS * 2),
        h: h * (1 - FORGIVENESS * 2),
      }
      for (const c of g.columns) {
        const within = box.x < c.x + COLUMN_W && box.x + box.w > c.x
        if (within && (box.y < c.top || box.y + box.h > c.top + c.gap)) {
          die()
          return
        }
        if (!c.passed && c.x + COLUMN_W < BARREL_X) {
          c.passed = true
          g.score += 1
          setScore(g.score)
        }
      }
    }

    const draw = () => {
      const g = game.current
      const { w, h } = size()
      ctx.clearRect(0, 0, W, H)

      const line = colour('--border', '#ddd')
      const edge = colour('--text-muted', '#888')

      drawSky(ctx, W, 0, FLOOR, g.scroll,
        colour('--sky-high', '#3fa4dd'), colour('--sky-low', '#b3e2f6'),
        colour('--cloud', 'rgba(255,255,255,0.95)'),
        colour('--cloud-shade', 'rgba(186,214,236,0.95)'))

      g.columns.forEach((c) => {
        const tone = colour(`--card-${c.hue}a`, line)
        const deep = colour(`--card-${c.hue}b`, line)
        drawColumn(ctx, c.x, COLUMN_W, c.top, -6, tone, deep, edge)
        drawColumn(ctx, c.x, COLUMN_W, c.top + c.gap, FLOOR, tone, deep, edge)
      })

      // A shallower band than the runner's, so the tiles are halved to keep
      // two rows of them and stay square.
      drawGrass(ctx, W, FLOOR, H, g.scroll,
        colour('--grass-a', '#7cc242'), colour('--grass-b', '#6cb139'), 13)

      // Blinking: drawn on the even beats, skipped on the odd ones
      if (g.dead !== null) {
        const since = (performance.now() - g.dead) / 1000
        if (since <= DEATH_FLASH && Math.floor(since / DEATH_BLINK) % 2 === 1) return
      }

      const img = barrel.current
      // Only the barrel waiting to start hovers; a dead one lies where it fell
      const hover = stateRef.current === 'ready' ? Math.sin(g.bob) * 6 : 0
      const arm = h * (0.5 - PIVOT_ROW)
      ctx.save()
      ctx.translate(BARREL_X + w * PIVOT_X, g.y + hover - arm)
      ctx.rotate(g.tilt)
      if (img?.complete && img.naturalWidth) {
        ctx.drawImage(img, -w / 2 - w * PIVOT_X, -h * PIVOT_ROW, w, h)
      } else {
        ctx.fillStyle = colour('--text', '#000')
        ctx.fillRect(-w / 2 - w * PIVOT_X, -h * PIVOT_ROW, w, h)
      }
      ctx.restore()
    }

    let last = 0
    const loop = (now) => {
      if (!running) return
      if (document.hidden) {
        last = 0                    // a hidden tab is not time the barrel spent flying
      } else {
        // Capped, so returning to a long-forgotten tab does not advance the
        // whole run in a single frame.
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
    ? 'Click or press space to start'
    : state === 'over'
      ? 'Press space to fly again'
      : ''

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg)',
      color: 'var(--text)',
      fontFamily: 'system-ui',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'flex-start',
      padding: '96px 24px 40px',
      gap: 16,
    }}>
      {/* Portrait play area in a landscape window: sized by the height there is
          rather than a fixed 480, so the score, the prompt and the way back are
          all on screen without scrolling. 0.75 is the play area's own shape. */}
      <div style={{ width: 'min(480px, calc((100vh - 250px) * 0.75))', maxWidth: '100%' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          marginBottom: 8,
          fontSize: TYPE.small,
          color: 'var(--text-muted)',
          letterSpacing: '0.08em',
        }}>
          <span>FLAPPY BARREL</span>
          <span>{best > 0 && `BEST ${String(best).padStart(3, '0')}   `}{String(score).padStart(3, '0')}</span>
        </div>

        <canvas
          ref={canvasRef}
          onPointerDown={(e) => { e.preventDefault(); flap() }}
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
