// src/components/ThemeToggle.jsx
import { useState, useEffect } from 'react'
import { flushSync } from 'react-dom'
import { Sun, Moon } from 'lucide-react'

const options = [
  { value: 'auto',  symbol: '◐',   label: 'Auto'  },
  { value: 'light', Icon: Sun,     label: 'Light', fill: 'currentColor' },
  { value: 'dark',  Icon: Moon,    label: 'Dark',  fill: 'none' },
]

const ITEM = 36   // button height
const GAP = 4     // gap between buttons
// How long the menu takes to fold back into the circle (.theme-menu-leaving);
// it is kept on the page that long after the pointer has gone.
const FOLD_MS = 200

// Kept in step with the snippet in index.html, which reads the same key before
// the page is painted.
const STORE_KEY = 'theme'

const savedTheme = () => {
  // Storage throws in private windows and when it is full, and a theme is not
  // worth a blank page.
  try {
    const saved = localStorage.getItem(STORE_KEY)
    if (saved === 'light' || saved === 'dark' || saved === 'auto') return saved
  } catch { /* fall through to auto */ }
  return 'auto'
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState(savedTheme)
  const [open, setOpen] = useState(false)
  // Still on the page while it folds away, after `open` has gone false
  const [shown, setShown] = useState(false)
  // Whether a theme has been chosen here: the icon turns in for a choice,
  // not for every page that loads
  const [chosen, setChosen] = useState(false)
  const [hoverIndex, setHoverIndex] = useState(null)
  const [circleHover, setCircleHover] = useState(false)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    try {
      localStorage.setItem(STORE_KEY, theme)
    } catch { /* the choice simply will not survive a reload */ }
  }, [theme])

  useEffect(() => {
    if (open) { setShown(true); return undefined }
    const timer = setTimeout(() => setShown(false), FOLD_MS)
    return () => clearTimeout(timer)
  }, [open])

  // A new theme, under the browser's own cross-fade where there is one: a
  // picture of the page as it was fading into the page as it is, drawn by
  // the graphics chip. Easing forty colours across every element instead,
  // a frame at a time — and the glass redrawn with them — was more than a
  // phone could keep up with. Under it the page turns at once
  // (html.theme-snap). Where there is no such fade, the colours ease as before.
  const choose = (value) => {
    const root = document.documentElement
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (value === theme || !document.startViewTransition || still) { setTheme(value); return }
    root.classList.add('theme-snap')
    const turn = document.startViewTransition(() => {
      flushSync(() => setTheme(value))
      root.setAttribute('data-theme', value)
    })
    turn.finished.finally(() => root.classList.remove('theme-snap'))
  }

  const current = options.find((o) => o.value === theme)

  return (
    <div
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => { setOpen(false); setHoverIndex(null) }}
      style={{
        position: 'fixed',
        bottom: 24,
        left: 24,
        zIndex: 200,
        display: 'flex',
        flexDirection: 'column-reverse',
        alignItems: 'center',
        gap: 8,
      }}
    >

      {/* Collapsed circle — always visible */}
      <div
        className="glass glass-vivid"
        onMouseEnter={() => setCircleHover(true)}
        onMouseLeave={() => setCircleHover(false)}
        style={{
          width: 44,
          height: 44,
          borderRadius: '50%',
          '--lg-tint': circleHover ? 'var(--hover)' : undefined,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.1rem',
          color: 'var(--text)',
          cursor: 'pointer',
          transition: 'background 0.2s ease',
        }}
      >
        {/* Keyed by the theme, so a new choice is a new icon and turns in
            (.theme-icon) rather than simply replacing the old one */}
        <span key={theme} className={chosen ? 'theme-icon' : undefined} style={{ display: 'inline-flex' }}>
          {current.Icon
            ? <current.Icon size={20} strokeWidth={2} fill={current.fill} />
            : <span style={{ fontSize: '1.1rem' }}>{current.symbol}</span>
          }
        </span>
      </div>

      {/* Expanded menu — opens up out of the circle on hover, its choices
          arriving from the bottom up, and folds back down when left */}
      {shown && (
        <div className={`glass glass-vivid theme-menu${open ? '' : ' theme-menu-leaving'}`} style={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          gap: GAP,
          padding: 4,
          borderRadius: 22,
        }}>

          {/* Sliding highlight */}
          <div style={{
            position: 'absolute',
            top: 4,
            left: 4,
            right: 4,
            height: ITEM,
            borderRadius: '50%',
            background: 'var(--hover)',
            opacity: hoverIndex === null ? 0 : 1,
            transform: `translateY(${(hoverIndex ?? 0) * (ITEM + GAP)}px)`,
            transition: 'transform 0.25s ease, opacity 0.2s ease',
            pointerEvents: 'none',
          }} />

          {options.map((option, index) => (
            <button
              key={option.value}
              onClick={() => { if (option.value !== theme) setChosen(true); choose(option.value); setOpen(false) }}
              onMouseEnter={() => setHoverIndex(index)}
              aria-label={option.label}
              className="theme-option"
              style={{
                '--from-bottom': options.length - 1 - index,
                position: 'relative',
                width: ITEM,
                height: ITEM,
                borderRadius: '50%',
                border: 'none',
                cursor: 'pointer',
                fontSize: '1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text)',
                background: 'transparent',
                zIndex: 1,
              }}
            >
              {option.Icon
                ? <option.Icon size={18} strokeWidth={2} fill={option.fill} />
                : <span style={{ fontSize: '1rem' }}>{option.symbol}</span>
              }
            </button>
          ))}
        </div>
      )}
    </div>
  )
}