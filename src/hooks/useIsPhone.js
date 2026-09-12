// src/hooks/useIsPhone.js
//
// A phone is not a narrow desktop window: the navbar's menus open on hover,
// which a touch screen has no way to ask for, and five links across a 375px
// screen do not fit however small the type gets. Layout that only needs to
// reflow is left to CSS; this is for the places that need to be a different
// thing, not the same thing narrower.
import { useEffect, useState } from 'react'

// The width the navbar's links stop fitting at, with room to spare. Kept in
// step with the breakpoint in index.css by name — PHONE there, this here.
export const PHONE = 700

export default function useIsPhone() {
  const query = `(max-width: ${PHONE}px)`
  const [phone, setPhone] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(query).matches,
  )

  useEffect(() => {
    const mq = window.matchMedia(query)
    const look = (e) => setPhone(e.matches)
    mq.addEventListener('change', look)
    setPhone(mq.matches)      // in case it changed before this ran
    return () => mq.removeEventListener('change', look)
  }, [query])

  return phone
}

// Whether the thing being played on is touched rather than pointed at. The
// games take both — a tap does what the space bar does — but the line telling
// you how to start has to pick one, and telling a phone to press space is
// telling it to do something it cannot.
export function useIsTouch() {
  const [touch, setTouch] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(hover: none)').matches,
  )

  useEffect(() => {
    const mq = window.matchMedia('(hover: none)')
    const look = (e) => setTouch(e.matches)
    mq.addEventListener('change', look)
    setTouch(mq.matches)
    return () => mq.removeEventListener('change', look)
  }, [])

  return touch
}
