// src/components/TanksInvite.jsx
//
// The way into the tank game (TanksGame.jsx, at /tanks), for now: left on
// the home page for ten seconds without the mouse, the keys, a scroll or a
// touch, the page asks whether you would like a game. Asked once a visit to
// the home page, and not while the tab is out of sight, while the page is
// diving into a popped bubble, or while pool is being offered or played.
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'

const IDLE_MS = 10000
const STIRS = ['pointermove', 'pointerdown', 'keydown', 'wheel', 'scroll', 'touchstart']

// the page busy with something else, which the question should not cut across
const busy = () =>
  document.hidden
  || !!document.querySelector('.pool-ask:not(.tanks-ask), .pool')   // (not this question itself, which wears the pool one's look)
  || document.documentElement.classList.contains('diving')

export default function TanksInvite() {
  const [asking, setAsking] = useState(false)
  const asked = useRef(false)
  const navigate = useNavigate()

  // ten seconds of nothing, counted again from every stir
  useEffect(() => {
    let timer = 0
    const wait = () => {
      clearTimeout(timer)
      if (asked.current) return
      timer = setTimeout(() => {
        if (busy()) { wait(); return }
        asked.current = true
        setAsking(true)
      }, IDLE_MS)
    }
    STIRS.forEach((e) => window.addEventListener(e, wait, { passive: true, capture: true }))
    document.addEventListener('visibilitychange', wait)
    wait()
    return () => {
      clearTimeout(timer)
      STIRS.forEach((e) => window.removeEventListener(e, wait, { capture: true }))
      document.removeEventListener('visibilitychange', wait)
    }
  }, [])

  // (pool offered or begun meanwhile: the question steps aside for it)
  useEffect(() => {
    if (!asking) return undefined
    const check = setInterval(() => { if (busy() && !document.hidden) setAsking(false) }, 400)
    return () => clearInterval(check)
  }, [asking])

  if (!asking) return null
  return createPortal(
    <div className="pool-ask tanks-ask glass nav-glass" role="dialog" aria-label="Play tanks?">
      <span>Still there? Want to play tanks?</span>
      <button type="button" className="pool-button pool-button-go" onClick={() => navigate('/tanks')}>Play</button>
      <button type="button" className="pool-button" onClick={() => setAsking(false)}>No thanks</button>
    </div>,
    document.body,
  )
}
