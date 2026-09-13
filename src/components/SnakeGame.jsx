// src/components/SnakeGame.jsx
//
// Snake, played on Google's chequerboard, eating the models on this site. Each
// one swallowed adds a block to the tail in that model's own colour — so the
// snake ends up a record of what it has been fed, and a long one is a tour of
// the portfolio.
//
// The colours are not guessed at here: scripts/model-colours.py reads them off
// the thumbnails, so a re-rendered model brings its new colour with it.
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { TYPE } from '../styles/type'
import { useIsTouch, useIsShort } from '../hooks/useIsPhone'
import { clashRoyale, accessibility, convenience, misc } from '../data/projects'
import { MODEL_LOOK } from '../data/model-colours'
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

// Everything with a thumbnail, which is everything the snake can eat.
const MODELS = [...clashRoyale, ...accessibility, ...convenience, ...misc].map((project) => {
  // '/thumbnails/mortar.webp' -> 'mortar', which is how the two are keyed
  const look = MODEL_LOOK[project.image.split('/').pop().replace('.webp', '')]
  return {
    ...project,
    colour: look?.colour || '#888888',
    crop: look?.crop || [0, 0, 1, 1],
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

    const colour = (name, fallback) =>
      getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback

    const centre = (cell) => ({ x: cell.x * CELL + CELL / 2, y: cell.y * CELL + CELL / 2 })

    const drawSnake = (g, hidden) => {
      if (hidden) return
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.lineWidth = CELL * BODY

      // Drawn from the tail forward, so each square's colour laps over the one
      // behind it and the head finishes on top.
      const bandOf = (i) => (i === 0 ? HEAD : g.colours[i] || BASE)
      for (let i = g.snake.length - 1; i >= 0; i -= 1) {
        const here = centre(g.snake[i])
        const ahead = i > 0 ? centre(g.snake[i - 1]) : null
        ctx.strokeStyle = bandOf(i)
        ctx.beginPath()
        ctx.moveTo(here.x, here.y)
        ctx.lineTo(ahead ? (here.x + ahead.x) / 2 : here.x, ahead ? (here.y + ahead.y) / 2 : here.y)
        ctx.stroke()
        if (ahead) {
          // The half nearer the head wears the head-ward colour, so the join
          // between two models falls between their squares rather than across one.
          ctx.strokeStyle = bandOf(i - 1)
          ctx.beginPath()
          ctx.moveTo((here.x + ahead.x) / 2, (here.y + ahead.y) / 2)
          ctx.lineTo(ahead.x, ahead.y)
          ctx.stroke()
        }
      }

      // Eyes, looking where it is going
      const head = centre(g.snake[0])
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

    const drawFood = (g) => {
      if (!g.food) return
      const img = images.current[g.food.model.image]
      const { x, y } = centre(g.food)
      const room = CELL * 0.95
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
        ctx.save()
        ctx.shadowColor = 'rgba(0, 0, 0, 0.25)'
        ctx.shadowBlur = 6
        ctx.shadowOffsetY = 2
        ctx.drawImage(img, sx, sy, sw, sh, x - w / 2, y - h / 2, w, h)
        ctx.restore()
      } else {
        // Until the picture is here, its colour stands in for it
        ctx.fillStyle = g.food.model.colour
        ctx.beginPath()
        ctx.arc(x, y, room / 2, 0, Math.PI * 2)
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
          const pace = Math.max(QUICKEST, FIRST_STEP - g.score * QUICKENS_BY)
          while (g.since >= pace && g.dying === 0) {
            g.since -= pace
            const what = step(g, MODELS)
            if (what.died) g.dying = DEATH_FLASH
            else if (what.ate) setScore(g.score)
          }
        }
      }

      drawGrass(ctx, W, 0, H, 0, colour('--grass-a', '#7cc242'), colour('--grass-b', '#6cb139'), CELL)
      drawFood(g)
      // Blinking on the way out, the way a game of this age would
      drawSnake(g, g.dying > 0 && Math.floor(g.dying / DEATH_BLINK) % 2 === 1)

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
  const onDown = (e) => {
    swipe.current = { x: e.clientX, y: e.clientY }
  }
  const onUp = (e) => {
    const from = swipe.current
    swipe.current = null
    if (!from) return
    const dx = e.clientX - from.x
    const dy = e.clientY - from.y
    if (Math.abs(dx) < 24 && Math.abs(dy) < 24) {
      if (state !== 'running') restart()
      return
    }
    if (state !== 'running') return
    turn(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up'))
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
          onPointerUp={onUp}
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
