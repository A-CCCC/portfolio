// src/components/LoadingScreen.jsx
//
// A loading bar that is not loading anything. It claims 99% before you have
// read the word, holds its nerve for a moment, then loses it and retreats for
// three seconds — and still finishes on time, which is the joke: the number
// never meant anything. The shape of it is in loading-curve.js.
//
// Shown once a visit on the way into the games, and on demand at /loading.
import { useEffect, useRef, useState } from 'react'
import { TYPE } from '../styles/type'
import { percentAt, TOTAL } from './loading-curve'

// Anyone who has asked for less movement gets the short version: the bar fills
// and is done. The gag is entirely in the motion, and it is not worth making
// someone unwell for.
const CALM_MS = 500

export default function LoadingScreen({ onDone, label = 'Loading' }) {
  const [percent, setPercent] = useState(0)
  const barRef = useRef(null)
  const done = useRef(false)

  useEffect(() => {
    const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const runs = calm ? CALM_MS : TOTAL
    const started = performance.now()
    let frame = 0

    const tick = (now) => {
      const gone = now - started
      const claimed = calm
        ? Math.min(100, (gone / CALM_MS) * 100)
        : percentAt(gone)
      setPercent(claimed)

      if (gone >= runs) {
        if (!done.current) {
          done.current = true
          onDone?.()
        }
        return
      }
      frame = requestAnimationFrame(tick)
    }

    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [onDone])

  const shown = Math.round(percent)

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
      padding: '120px 24px 100px',
    }}>
      <div style={{ width: 'min(420px, 78vw)' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          marginBottom: 12,
          fontSize: TYPE.small,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: 'var(--text-muted)',
        }}>
          <span>{label}</span>
          {/* Tabular figures, so the number does not jitter as it counts */}
          <span style={{ fontVariantNumeric: 'tabular-nums' }}>{shown}%</span>
        </div>

        <div
          role="progressbar"
          aria-valuenow={shown}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={label}
          style={{
            height: 8,
            borderRadius: 999,
            background: 'var(--hover)',
            overflow: 'hidden',
          }}
        >
          {/* Driven every frame, so it carries no transition of its own — one
              would fight the curve rather than smooth it. */}
          <div
            ref={barRef}
            style={{
              width: `${percent}%`,
              height: '100%',
              borderRadius: 999,
              background: 'var(--text)',
            }}
          />
        </div>
      </div>
    </div>
  )
}
