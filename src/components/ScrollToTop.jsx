// src/components/ScrollToTop.jsx
//
// Puts a newly opened page at the top, the way following a link should.
//
// Only when the path actually changes, though. This used to run on mount as
// well, which meant a reload — where the browser has just restored where you
// were — was answered by throwing you back to the top of the page. On a long
// page that loses your place entirely.
import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'

export default function ScrollToTop() {
  const { pathname } = useLocation()
  const previous = useRef(pathname)

  useEffect(() => {
    if (previous.current === pathname) return    // the first render: a load, not a move
    previous.current = pathname
    window.scrollTo(0, 0)
  }, [pathname])

  return null
}
