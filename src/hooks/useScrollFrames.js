// src/hooks/useScrollFrames.js
//
// Turns scrolling through a tall section into a frame number.
//
// The number goes into a ref rather than into state. Scrolling produces an event
// for every frame the screen draws, and re-rendering a whole page that often —
// to change one picture — is most of what made the scrub stutter. Whatever draws
// the frames reads the ref in its own loop; see components/ScrubFrames.jsx.
//
// `progress` is still state, because the scroll hint fades on it, but it is only
// published when it has moved enough to matter.
import { useEffect, useRef, useState } from 'react'

const WORTH_A_RENDER = 0.02   // of the way through, so about fifty updates

export default function useScrollFrames(frameCount, startFrame = 1) {
  const ref = useRef(null)
  const frameRef = useRef(startFrame)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    frameRef.current = startFrame
    let told = -1

    const measure = () => {
      const section = ref.current
      if (!section) return
      const rect = section.getBoundingClientRect()
      const runway = section.offsetHeight - window.innerHeight
      const scrolled = runway > 0 ? Math.max(0, Math.min(1, -rect.top / runway)) : 0
      const frame = startFrame + Math.floor(scrolled * frameCount)
      frameRef.current = Math.min(frame, startFrame + frameCount - 1)

      const step = Math.round(scrolled / WORTH_A_RENDER)
      if (step !== told) {
        told = step
        setProgress(scrolled)
      }
    }

    // Read straight from the scroll event. Browsers already deliver those at
    // most once per frame they draw, so holding the reading back for an
    // animation frame would only make it later than the frame it belongs to —
    // and it is a rectangle and a subtraction, not work worth deferring.
    measure()   // the right frame on mount, e.g. after a refresh part-way down
    window.addEventListener('scroll', measure, { passive: true })
    window.addEventListener('resize', measure)
    return () => {
      window.removeEventListener('scroll', measure)
      window.removeEventListener('resize', measure)
    }
  }, [frameCount, startFrame])

  return [ref, frameRef, progress]
}
