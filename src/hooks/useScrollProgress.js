// src/hooks/useScrollProgress.js
import { useEffect, useRef, useState } from 'react'

// Same runway maths as useScrollFrames, but returns a continuous 0–1 value
// instead of a frame number — for scrubbing a transform rather than a sprite
// sequence. Attach the ref to a tall section holding a sticky child; progress
// is how far that section has travelled through the viewport.
//
// Progress stays at 0 until the section pins, so the scrub only ever runs while
// the panel is held still — never while the page is scrolling normally beneath
// it. To start the animation sooner, pull the section up (see SECTION_PULL on
// the page) rather than starting the scrub early.
export default function useScrollProgress() {
  const ref = useRef(null)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      const section = ref.current
      if (!section) return
      const runway = section.offsetHeight - window.innerHeight
      if (runway <= 0) {
        setProgress(1)
        return
      }
      const rect = section.getBoundingClientRect()
      setProgress(Math.max(0, Math.min(1, -rect.top / runway)))
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    // Runway depends on viewport height, so recompute when it changes.
    window.addEventListener('resize', handleScroll)
    handleScroll()   // set the right value on mount (e.g. after a refresh)

    return () => {
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', handleScroll)
    }
  }, [])

  return [ref, progress]
}
