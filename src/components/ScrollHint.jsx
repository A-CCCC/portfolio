// src/components/ScrollHint.jsx
import { useEffect, useState } from 'react'
import { TYPE } from '../styles/type'

// A nudge for the scroll-scrubbed sections: they pin the page in place, and the
// first time that happens it reads as the page having stopped rather than as
// something waiting to be scrolled through.
//
// It is meant to teach, so it stops appearing once it has been learnt: it fades
// out as the scrub gets under way, does not come back if the same section is
// scrolled through again, and is only ever offered on the first couple of
// animations a visitor meets. After that the gesture is known and a standing
// instruction would just be clutter.
const STORE_KEY = 'scroll-hints-spent'
const LIMIT = 2          // how many different animations may ever show a hint
// Measured in pixels of scrolling rather than as a share of the section, because
// the sections are wildly different lengths: the skeleton barrel scrubs over
// 300vh and the wheelchair model over 70vh, so the same fraction would be a
// leisurely fade on one page and a blink on the other.
const FADE_PX = 140      // how far the visitor scrolls before it has fully gone
const LEARNT_PX = 420    // ...and how far before it is taken away for good
// Fallbacks for a section shorter than the window, where there is no runway to
// measure against.
const FADE_SHARE = 0.1
const LEARNT_SHARE = 0.3

// localStorage throws in private windows and when storage is full, and a hint is
// never worth failing a page render over — a visitor who cannot be remembered
// simply gets the nudge again.
const readSpent = () => {
  try {
    const raw = JSON.parse(localStorage.getItem(STORE_KEY))
    return Array.isArray(raw) ? raw : []
  } catch {
    return []
  }
}

const markSpent = (id) => {
  try {
    const spent = readSpent()
    if (!spent.includes(id)) {
      localStorage.setItem(STORE_KEY, JSON.stringify([...spent, id]))
    }
  } catch {
    /* nothing to do: the hint just shows again next visit */
  }
}

export default function ScrollHint({ id, progress, label = 'Keep scrolling' }) {
  // Decided once, on mount, rather than on every render: the answer changes as
  // soon as this very hint is marked spent, and it should not vanish mid-fade.
  const [offered] = useState(() => {
    const spent = readSpent()
    return !spent.includes(id) && spent.length < LIMIT
  })
  const [learnt, setLearnt] = useState(false)
  // Thresholds as a share of this particular section's runway, worked out from
  // the pixel budgets above once the section has been measured.
  const [fadeBy, setFadeBy] = useState(FADE_SHARE)
  const [learntAt, setLearntAt] = useState(LEARNT_SHARE)

  // The hint sits inside the pinned panel, whose parent is the tall section the
  // scrub runs on; its runway is the part that scrolls past while pinned.
  const measure = (node) => {
    const section = node?.parentElement?.parentElement
    if (!section) return
    const runway = section.offsetHeight - window.innerHeight
    if (runway <= 0) return
    setFadeBy(FADE_PX / runway)
    setLearntAt(LEARNT_PX / runway)
  }

  // Adjusted while rendering rather than in an effect, so the hint is already
  // gone in the frame that crosses the threshold instead of being painted once
  // more and removed straight after.
  if (offered && !learnt && progress > learntAt) setLearnt(true)

  useEffect(() => {
    if (learnt) markSpent(id)
  }, [learnt, id])

  // Gone for good once scrolled through, so scrolling back up does not bring it
  // back — by then the visitor has already worked out what the section does.
  if (!offered || learnt) return null

  return (
    <div
      className="scroll-hint"
      ref={measure}
      style={{
        position: 'absolute',
        bottom: 40,
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 8,
        color: 'var(--text-muted)',
        fontSize: TYPE.small,
        letterSpacing: '0.02em',
        // Sits over the animation, so it must never swallow a click.
        pointerEvents: 'none',
        opacity: Math.max(0, 1 - progress / fadeBy),
        transition: 'opacity 0.3s ease',
      }}
    >
      {label}
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        style={{ display: 'block' }}
      >
        <polyline points="6 9 12 15 18 9" />
      </svg>
    </div>
  )
}
