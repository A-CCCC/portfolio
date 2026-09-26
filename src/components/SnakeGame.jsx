// src/components/SnakeGame.jsx
//
// Snake, played on Google's chequerboard, eating the models on this site. Each
// one swallowed adds a block to the tail in that model's own color — so the
// snake ends up a record of what it has been fed, and a long one is a tour of
// the portfolio.
//
// The colors are not guessed at here: scripts/model-colors.py reads them off
// the thumbnails, so a re-rendered model brings its new color with it.
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { TYPE } from '../styles/type'
import { useIsTouch, useIsShort } from '../hooks/useIsPhone'
import { clashRoyale, accessibility, convenience, misc } from '../data/projects'
import { MODEL_LOOK } from '../data/model-colors'
import drawGrass from './grass'
import {
  COLS, ROWS, HEADINGS, newGame, placeFood, ask, step,
} from './snake-rules'

// The size of a square on the board Google uses; the board itself is COLS by
// ROWS, and both come from the rules beside this.
const CELL = 40
const W = COLS * CELL
const H = ROWS * CELL

// A step is a whole square, so the pace is how often one is taken rather than
// how fast anything moves. It quickens as the snake grows, to a floor — past
// which the board is crossed faster than anyone can answer.
const FIRST_STEP = 150           // ms between steps at the start
const QUICKEST = 88
const QUICKENS_BY = 3            // ms off each step per model eaten

const BODY = 0.82                // of a square: the thickness of the snake
const BASE = '#3f7bd8'           // the three squares it starts as
const HEAD = '#3568c0'

const DEATH_FLASH = 0.6          // seconds of blinking before the board rests
const DEATH_BLINK = 0.1


const HIGH_SCORE_KEY = 'model-snake-best'

const readBest = () => {
  try {
    return Number(localStorage.getItem(HIGH_SCORE_KEY)) || 0
  } catch {
    return 0      // private windows throw; a high score is not worth a crash
  }
}

// Everything with a thumbnail, which is everything the snake can eat. A
// project listed before its render exists is simply not on the menu yet.
const MODELS = [...clashRoyale, ...accessibility, ...convenience, ...misc]
  .filter((project) => project.image)
  .map((project, i) => {
  // '/thumbnails/mortar.webp' -> 'mortar', which is how the two are keyed
  const look = MODEL_LOOK[project.image.split('/').pop().replace('.webp', '')]
  return {
    ...project,
    color: look?.color || '#888888',
    crop: look?.crop || [0, 0, 1, 1],
    // One of the six card tints the carousels and the home page bubbles use, so
    // a model sits on the board the way it sits everywhere else on the site.
    tint: (i % 6) + 1,
  }
})

const KEYS = {
  ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
  KeyW: 'up', KeyS: 'down', KeyA: 'left', KeyD: 'right',
}

export default function SnakeGame() {
  const touch = useIsTouch()
  const short = useIsShort()
  const canvasRef = useRef(null)
  const [state, setState] = useState('ready')      // ready | running | over
  const [score, setScore] = useState(0)
  const [best, setBest] = useState(readBest)

  // The game itself lives in a ref: a step should not cost a React render, and
  // the loop has to read the state it left behind on the frame before.
  // The game itself lives in a ref: a step should not cost a React render, and
  // the loop has to read the state it left behind on the frame before.
  const game = useRef(newGame(BASE))
  const images = useRef({})

  const restart = (way) => {
    game.current = newGame(BASE, way)
    placeFood(game.current, MODELS)
    setScore(0)
    setState('running')
  }

  const paceNow = () => Math.max(QUICKEST, FIRST_STEP - game.current.score * QUICKENS_BY)

  // Remembered, and taken at the next square the snake reaches. Nothing is
  // hurried along to answer it: a step is a step, every step is the same
  // length, and a snake that sometimes moved early was what made the game look
  // like it was drifting rather than traveling.
  const turn = (way) => ask(game.current, way)

  // The models themselves, loaded once and drawn from then on. One is put out
  // on the board straight away, so the opening screen is a snake with something
  // in front of it rather than a snake alone on a lawn.
  useEffect(() => {
    MODELS.forEach((model) => {
      const img = new Image()
      img.src = model.image
      images.current[model.image] = img
    })
    if (!game.current.food) placeFood(game.current, MODELS)
  }, [])

  useEffect(() => {
    const onKey = (e) => {
      const way = KEYS[e.code]
      if (way) {
        e.preventDefault()
        if (state === 'running') turn(way)
        else restart(way)
        return
      }
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault()
        if (state !== 'running') restart()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [state])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return undefined
    const ctx = canvas.getContext('2d')

    const fit = () => {
      const ratio = window.devicePixelRatio || 1
      canvas.width = W * ratio
      canvas.height = H * ratio
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0)
    }
    fit()
    window.addEventListener('resize', fit)

    const color = (name, fallback) =>
      getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback

    const center = (cell) => ({ x: cell.x * CELL + CELL / 2, y: cell.y * CELL + CELL / 2 })

    // Where block i is partway through the step it is taking. `at` is how far
    // through, so the snake glides from square to square instead of appearing
    // in the next one. A block that has just grown at the tail has nowhere it
    // came from, and simply stays where it is.
    const sliding = (g, i, at) => {
      const now = g.snake[i]
      const was = g.prev?.[i] || now
      return {
        x: (was.x + (now.x - was.x) * at) * CELL + CELL / 2,
        y: (was.y + (now.y - was.y) * at) * CELL + CELL / 2,
      }
    }

    const drawSnake = (g, hidden, at) => {
      if (hidden) return
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.lineWidth = CELL * BODY

      // Drawn from the tail forward, so each square's color laps over the one
      // behind it and the head finishes on top.
      const bandOf = (i) => (i === 0 ? HEAD : g.colors[i] || BASE)
      const halfway = (a, b) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 })

      // A block at a time, from the tail forward so the head finishes on top.
      // Each is drawn as one curve from the edge it shares with the block
      // behind it, bending through its own middle, to the edge it shares with
      // the block ahead — which is a straight line down a straight stretch and
      // a rounded corner wherever the snake turns. Every color gets exactly
      // its own square, since the joins fall on the edges between them.
      for (let i = g.snake.length - 1; i >= 0; i -= 1) {
        const here = sliding(g, i, at)
        const behind = i < g.snake.length - 1 ? halfway(here, sliding(g, i + 1, at)) : here
        const ahead = i > 0 ? halfway(here, sliding(g, i - 1, at)) : here
        ctx.strokeStyle = bandOf(i)
        ctx.beginPath()
        ctx.moveTo(behind.x, behind.y)
        ctx.quadraticCurveTo(here.x, here.y, ahead.x, ahead.y)
        ctx.stroke()
      }

      // Eyes, looking where it is going
      const head = sliding(g, 0, at)
      const [dx, dy] = HEADINGS[g.heading]
      const side = CELL * 0.17
      const out = CELL * 0.1
      for (const flip of [-1, 1]) {
        const ex = head.x + dx * out + (dy !== 0 ? side * flip : 0)
        const ey = head.y + dy * out + (dx !== 0 ? side * flip : 0)
        ctx.fillStyle = '#ffffff'
        ctx.beginPath()
        ctx.arc(ex, ey, CELL * 0.11, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = '#1b1b1b'
        ctx.beginPath()
        ctx.arc(ex + dx * CELL * 0.03, ey + dy * CELL * 0.03, CELL * 0.055, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    // A model sits in a bubble of its own, the way it does on the home page —
    // one of the six card tints, with the same soft shadow under it. Still,
    // though: the ones on the home page drift because there is nothing else on
    // that screen, and a board being played on has movement enough.
    const drawBubble = (model, x, y) => {
      const r = CELL * 0.47
      const wash = ctx.createLinearGradient(x - r * 0.55, y - r, x + r * 0.55, y + r)
      wash.addColorStop(0, color(`--card-${model.tint}a`, '#eef1fb'))
      wash.addColorStop(1, color(`--card-${model.tint}b`, '#dde4f6'))
      ctx.save()
      ctx.shadowColor = 'rgba(0, 0, 0, 0.18)'
      ctx.shadowBlur = 7
      ctx.shadowOffsetY = 3
      ctx.fillStyle = wash
      ctx.beginPath()
      ctx.arc(x, y, r, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
    }

    const drawFood = (g) => {
      if (!g.food) return
      const img = images.current[g.food.model.image]
      const { x, y } = center(g.food)
      drawBubble(g.food.model, x, y)
      // Inside the bubble rather than filling the square, so the tint reads as
      // something the model is sitting in.
      const room = CELL * 0.66
      if (img?.complete && img.naturalWidth) {
        // Only the part of the picture the model is actually in. Drawn whole, a
        // thumbnail's own margins would leave it a speck in the middle of the
        // square; this fills the square with the thing itself.
        const [cx, cy, cw, ch] = g.food.model.crop
        const sx = cx * img.naturalWidth
        const sy = cy * img.naturalHeight
        const sw = cw * img.naturalWidth
        const sh = ch * img.naturalHeight
        const scale = Math.min(room / sw, room / sh)
        const w = sw * scale
        const h = sh * scale
        ctx.drawImage(img, sx, sy, sw, sh, x - w / 2, y - h / 2, w, h)
      } else {
        // Until the picture is here, the model's color stands in for it
        ctx.fillStyle = g.food.model.color
        ctx.beginPath()
        ctx.arc(x, y, room / 2.6, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    let frame = 0
    let last = 0

    const loop = (now) => {
      const g = game.current
      const delta = last ? Math.min(0.2, (now - last) / 1000) : 0
      last = now

      if (!document.hidden) {
        if (g.dying > 0) {
          g.dying -= delta
          if (g.dying <= 0) {
            g.dying = 0
            g.over = true
            setState('over')
            setBest((was) => {
              const next = Math.max(was, g.score)
              try { localStorage.setItem(HIGH_SCORE_KEY, String(next)) } catch { /* fine */ }
              return next
            })
          }
        } else if (state === 'running' && !g.over) {
          g.since += delta * 1000
          while (g.since >= paceNow() && g.dying === 0) {
            g.since -= paceNow()
            const what = step(g, MODELS)
            if (what.died) g.dying = DEATH_FLASH
            else if (what.ate) setScore(g.score)
          }
        }
      }

      drawGrass(ctx, W, 0, H, 0, color('--grass-a', '#7cc242'), color('--grass-b', '#6cb139'), CELL)
      drawFood(g)
      // How far through the current step the snake is. Standing still between
      // games, and at rest where it died, so nothing slides on the last frame.
      const at = state === 'running' && !g.over && g.dying === 0
        ? Math.min(1, g.since / paceNow())
        : 1
      // Blinking on the way out, the way a game of this age would
      drawSnake(g, g.dying > 0 && Math.floor(g.dying / DEATH_BLINK) % 2 === 1, at)

      frame = requestAnimationFrame(loop)
    }

    frame = requestAnimationFrame(loop)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('resize', fit)
    }
  }, [state])

  // A swipe turns it; a tap starts it. Kept on the canvas rather than the page,
  // so scrolling the page around the board still works.
  const swipe = useRef(null)
  const SWIPE = 12                 // px before a drag counts as a swipe

  const onDown = (e) => {
    swipe.current = { x: e.clientX, y: e.clientY, turned: false }
  }

  // Answered while the finger is still moving. Waiting for it to lift put the
  // length of the swipe between asking and being answered, which on a phone is
  // most of what made the game feel slow to respond.
  const onMove = (e) => {
    const from = swipe.current
    if (!from || state !== 'running') return
    const dx = e.clientX - from.x
    const dy = e.clientY - from.y
    if (Math.abs(dx) < SWIPE && Math.abs(dy) < SWIPE) return
    turn(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up'))
    // The finger stays down for the next swipe, measured from here
    swipe.current = { x: e.clientX, y: e.clientY, turned: true }
  }

  const onUp = (e) => {
    const from = swipe.current
    swipe.current = null
    if (!from || from.turned) return
    const dx = e.clientX - from.x
    const dy = e.clientY - from.y
    // A tap rather than a swipe
    if (Math.abs(dx) < SWIPE && Math.abs(dy) < SWIPE && state !== 'running') restart()
  }

  const prompt = state === 'ready'
    ? (touch ? 'Tap to start, then swipe to turn' : 'Press an arrow key to start')
    : state === 'over'
      ? (touch ? 'Tap to play again' : 'Press space to play again')
      : ''

  return (
    <div style={{
      minHeight: 'var(--screen)',
      background: 'var(--bg)',
      color: 'var(--text)',
      fontFamily: 'system-ui',
      display: 'flex',
      // Held sideways there is no height to spare for a line above the board
      // and two more below it, and width doing nothing either side. So the
      // words go beside the board, as they do in the other games.
      flexDirection: short ? 'row' : 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: short ? '70px 24px 20px' : '120px 24px 80px',
      gap: short ? 28 : 16,
    }}>
      {/* Never taller than the screen it is on: held sideways, a board sized by
          width alone pushes the prompt and the way back off the bottom. */}
      <div style={{
        width: short ? `min(${W}px, calc((var(--screen) - 120px) * ${(W / H).toFixed(3)}))` : W,
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
          <span>MODEL SNAKE</span>
          <span>{best > 0 && `BEST ${String(best).padStart(2, '0')}   `}{String(score).padStart(2, '0')}</span>
        </div>

        <canvas
          ref={canvasRef}
          onPointerDown={(e) => { e.preventDefault(); onDown(e) }}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={() => { swipe.current = null }}
          style={{
            width: '100%',
            height: 'auto',
            display: 'block',
            borderRadius: 12,
            touchAction: 'none',
            cursor: 'pointer',
          }}
        />

      </div>

      {/* Under the board, or beside it on a screen with no room underneath. */}
      <div style={{ textAlign: short ? 'left' : 'center', maxWidth: 240 }}>
        <p style={{
          marginTop: short ? 0 : 12,
          fontSize: TYPE.small,
          color: 'var(--text-muted)',
          minHeight: '1.4em',
        }}>
          {prompt}
        </p>

        <p style={{ marginTop: short ? 16 : 28 }}>
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
