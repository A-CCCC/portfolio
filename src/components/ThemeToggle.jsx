// src/components/ThemeToggle.jsx
import { useState, useEffect } from 'react'
import { Sun, Moon } from 'lucide-react'

const options = [
  { value: 'auto',  symbol: '◐',   label: 'Auto'  },
  { value: 'light', Icon: Sun,     label: 'Light', fill: 'currentColor' },
  { value: 'dark',  Icon: Moon,    label: 'Dark',  fill: 'none' },
]

const ITEM = 36   // button height
const GAP = 4     // gap between buttons

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
  const [hoverIndex, setHoverIndex] = useState(null)
  const [circleHover, setCircleHover] = useState(false)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    try {
      localStorage.setItem(STORE_KEY, theme)
    } catch { /* the choice simply will not survive a reload */ }
  }, [theme])

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
        onMouseEnter={() => setCircleHover(true)}
        onMouseLeave={() => setCircleHover(false)}
        style={{
          width: 44,
          height: 44,
          borderRadius: '50%',
          background: circleHover ? 'var(--hover)' : 'var(--panel)',
          backdropFilter: 'blur(10px)',
          boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.1rem',
          color: 'var(--text)',
          cursor: 'pointer',
          transition: 'background 0.2s ease',
        }}
      >
        {current.Icon
          ? <current.Icon size={20} strokeWidth={2} fill={current.fill} />
          : <span style={{ fontSize: '1.1rem' }}>{current.symbol}</span>
        }
      </div>

      {/* Expanded menu — appears on hover, above the circle */}
      {open && (
        <div style={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          gap: GAP,
          padding: 4,
          borderRadius: 22,
          background: 'var(--panel)',
          backdropFilter: 'blur(10px)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
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
              onClick={() => { setTheme(option.value); setOpen(false) }}
              onMouseEnter={() => setHoverIndex(index)}
              aria-label={option.label}
              style={{
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