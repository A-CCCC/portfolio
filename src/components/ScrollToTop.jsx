// src/components/ScrollToTop.jsx
//
// Two jobs, both about where a page starts.
//
// Following a link puts you at the top, the way opening a page should.
//
// Reloading puts you back where you were — and this is why the browser is not
// left to do it. A browser restores the scroll the moment the document is
// parsed, before the photographs and the animation frames below have arrived to
// give it its height. Ask for 4,000 pixels down a page that is currently 1,500
// tall and it can only give you the bottom of what exists, which on a page
// whose content is mostly images is somewhere near the top. So the position is
// kept and put back once the page is actually tall enough to hold it.
import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'

const KEY = 'scroll-position'
const PATIENCE = 3000     // ms to wait for the page to reach its full height
const LOOK = 50           // ms between attempts

export default function ScrollToTop() {
  const { pathname } = useLocation()
  const previous = useRef(pathname)

  // Following a link, not arriving: on the first render the browser has just
  // put you where you were, and throwing you to the top would undo it.
  useEffect(() => {
    if (previous.current === pathname) return
    previous.current = pathname
    window.scrollTo(0, 0)
  }, [pathname])

  useEffect(() => {
    if (!('scrollRestoration' in window.history)) return undefined
    window.history.scrollRestoration = 'manual'

    const remember = () => {
      try {
        sessionStorage.setItem(KEY, JSON.stringify({
          path: window.location.pathname,
          y: Math.round(window.scrollY),
        }))
      } catch { /* a private window refuses; the page simply opens at the top */ }
    }
    // pagehide rather than beforeunload: a beforeunload listener stops some
    // browsers keeping the page in their back/forward cache, which would make
    // going back slower to save a scroll position nobody asked for.
    window.addEventListener('pagehide', remember)

    let saved = null
    try { saved = JSON.parse(sessionStorage.getItem(KEY) || 'null') } catch { saved = null }

    let timer = 0
    if (saved && saved.path === window.location.pathname && saved.y > 0) {
      const giveUp = Date.now() + PATIENCE
      // Their own scrolling wins: if they have started reading somewhere else,
      // being moved by the page they just opened is worse than losing the place.
      const theyMoved = () => { clearTimeout(timer); timer = 0 }
      window.addEventListener('wheel', theyMoved, { once: true, passive: true })
      window.addEventListener('touchstart', theyMoved, { once: true, passive: true })
      window.addEventListener('keydown', theyMoved, { once: true })

      const put = () => {
        const room = document.documentElement.scrollHeight - window.innerHeight
        if (room >= saved.y) {
          window.scrollTo(0, saved.y)
          return
        }
        // Not tall enough yet. Go as far as it does reach, so a slow page still
        // opens near the right place rather than at the top.
        if (room > 0) window.scrollTo(0, room)
        if (Date.now() < giveUp) timer = setTimeout(put, LOOK)
      }
      timer = setTimeout(put, 0)
    }

    return () => {
      window.removeEventListener('pagehide', remember)
      if (timer) clearTimeout(timer)
    }
  }, [])

  return null
}
