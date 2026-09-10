// src/hooks/useFadeInOnScroll.js
//
// Fades an element in once, when scrolling brings it far enough up the screen.
//
// "Far enough" used to mean a fifth of it had appeared, which fires the moment
// its top edge clears the bottom of the window — so the fade ran while the
// element was still off in the corner of your eye and was over by the time you
// looked at it. The bottom of the watched area is pulled up instead, so an
// element has to reach well inside the window before it starts.
//
// This only moves *when* the fade begins. How long it takes is the transition on
// the element itself, which is untouched, as is the timed fade used on first
// paint — see useFadeIn.
import { useEffect, useRef, useState } from 'react'

// How much of the window's lower edge does not count. At 0.26 an element starts
// its fade when its top edge has climbed about a quarter of the way up the
// screen — the same moment whatever its size, which is the point of measuring it
// this way rather than as a share of the element.
const LATE = 0.26

export default function useFadeInOnScroll(delay = 500) {
  const ref = useRef(null)
  const [opacity, setOpacity] = useState(0)

  useEffect(() => {
    const el = ref.current
    if (!el) return undefined

    let timer
    let done = false

    const reveal = () => {
      if (done) return
      done = true
      timer = setTimeout(() => setOpacity(1), delay)
    }

    const watcher = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          reveal()
          watcher.disconnect()
          safety.disconnect()
        }
      },
      // Nothing but the margin decides this. Asking for a share of the element
      // as well would mean a section taller than the window it is watched in
      // could never show enough of itself, and would sit invisible for good.
      { threshold: 0, rootMargin: `0px 0px -${Math.round(LATE * 100)}% 0px` },
    )

    // Anything sitting in that ignored strip at the very bottom of the page can
    // never climb out of it, and without this would stay invisible for good. So
    // a second watcher, on the window as it really is, releases anything that is
    // fully on screen regardless.
    const safety = new IntersectionObserver(
      ([entry]) => {
        if (entry.intersectionRatio >= 0.99) {
          reveal()
          watcher.disconnect()
          safety.disconnect()
        }
      },
      { threshold: [0.99] },
    )

    watcher.observe(el)
    safety.observe(el)

    return () => {
      watcher.disconnect()
      safety.disconnect()
      clearTimeout(timer)
    }
  }, [delay])

  return [ref, opacity]
}
