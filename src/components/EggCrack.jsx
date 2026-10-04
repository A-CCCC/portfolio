// src/components/EggCrack.jsx
//
// The way into the games is an easter egg, so it arrives as one. A link to
// the games — the bubble that turns up now and again, the one hidden on the
// Projects hub, the one on the missing page — puts an egg in the middle of
// the screen while the page fades away behind it; the egg wobbles, harder
// and harder, a crack runs round it, and it bursts: the two halves fly apart
// and the games open out from where it was.
//
// Not between the games themselves, which are already inside it, and not for
// anyone with motion turned down: those links simply go.
import { useEffect, useId, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

const GAMES = '/games'
// Pages already inside the egg
const INSIDE = ['/games', '/log', '/barrel', '/snake', '/loading']
const BASE = import.meta.env.BASE_URL.replace(/\/$/, '')

// The beats, from the click (see .egg-* in the stylesheet)
const CRACK_AT = 900      // in (0.3s) and the wobble (0.6s) done
const OPEN_AT = 1050      // the crack drawn; the games put in under the curtain
const DONE_AT = 1750      // the halves gone and the games uncovered

// One egg, cut in two along the crack. The same drawing in each half, each
// clipped to its side of the zigzag.
const SHELL = 'M60 4 C 95 4, 116 62, 116 92 C 116 124, 92 146, 60 146 C 28 146, 4 124, 4 92 C 4 62, 25 4, 60 4 Z'
const ZIGZAG = [[0, 84], [12, 74], [24, 88], [36, 74], [48, 88], [60, 74], [72, 88], [84, 74], [96, 88], [108, 74], [120, 84]]
const zig = ZIGZAG.map((p) => p.join(',')).join(' ')
const TOP = `0,0 120,0 ${[...ZIGZAG].reverse().map((p) => p.join(',')).join(' ')}`
const BOTTOM = `${zig} 120,150 0,150`

function Half({ clip }) {
  return (
    <svg viewBox="0 0 120 150" width="120" height="150" aria-hidden="true">
      <defs>
        <linearGradient id={`egg-paint-${clip}`} x1="0" y1="0" x2="0.4" y2="1">
          <stop offset="0" style={{ stopColor: 'var(--vivid-a)' }} />
          <stop offset="1" style={{ stopColor: 'var(--vivid-b)' }} />
        </linearGradient>
        <clipPath id={`egg-half-${clip}`}>
          <polygon points={clip === 'top' ? TOP : BOTTOM} />
        </clipPath>
        {/* the paint kept on the shell: a band drawn across the box ran
            past the egg's curve on either side */}
        <clipPath id={`egg-shell-${clip}`}>
          <path d={SHELL} />
        </clipPath>
      </defs>
      <g clipPath={`url(#egg-half-${clip})`}>
        <g clipPath={`url(#egg-shell-${clip})`}>
          <path d={SHELL} fill={`url(#egg-paint-${clip})`} />
          {/* painted like an easter egg: a wavy band, a row of dots */}
          <path d="M0 48 C 22 36, 38 60, 60 48 S 98 36, 120 48"
            fill="none" stroke="white" strokeOpacity="0.7" strokeWidth="5" />
          {[22, 41, 60, 79, 98].map((x) => <circle key={x} cx={x} cy={114} r={4.5} fill="white" fillOpacity="0.65" />)}
          {/* and its shine */}
          <ellipse cx="38" cy="34" rx="12" ry="20" transform="rotate(-24 38 34)" fill="white" fillOpacity="0.32" />
        </g>
      </g>
    </svg>
  )
}

export default function EggCrack() {
  // Held in a ref: the router hands out a new navigate whenever the page
  // changes, and an effect keyed on it re-ran mid-egg — clearing the timer
  // that takes the egg away, which left it over the games for good.
  const navigateRef = useRef(useNavigate())
  navigateRef.current = useNavigate()
  const { pathname } = useLocation()
  const here = useRef(pathname)
  here.current = pathname
  const [phase, setPhase] = useState(null)    // 'shake' | 'crack' | 'open' | null
  const timers = useRef([])

  useEffect(() => {
    const onClick = (e) => {
      const a = e.target.closest?.('a[href]')
      if (!a) return
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
      if (a.target && a.target !== '_self') return
      const url = new URL(a.href, window.location.href)
      if (url.origin !== window.location.origin) return
      const path = url.pathname.slice(BASE.length).replace(/\/$/, '') || '/'
      if (path !== GAMES || INSIDE.includes(here.current)) return
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
      // Taken from everything else that would act on it — the bubble's own
      // pop, the page's sweeps — before they see it
      e.preventDefault()
      e.stopImmediatePropagation()
      if (timers.current.length) return
      setPhase('shake')
      timers.current = [
        setTimeout(() => setPhase('crack'), CRACK_AT),
        setTimeout(() => { setPhase('open'); navigateRef.current(GAMES) }, OPEN_AT),
        setTimeout(() => { setPhase(null); timers.current = [] }, DONE_AT),
      ]
    }
    document.addEventListener('click', onClick, true)
    return () => {
      document.removeEventListener('click', onClick, true)
      timers.current.forEach(clearTimeout)
      timers.current = []
    }
  }, [])

  if (!phase) return null
  return (
    <div className={`egg-overlay egg-${phase}`} aria-hidden="true">
      <div className="egg-curtain" />
      <div className="egg-burst" />
      <div className="egg">
        <div className="egg-top"><Half clip="top" /></div>
        <div className="egg-bottom"><Half clip="bottom" /></div>
        <svg className="egg-line" viewBox="0 0 120 150" width="120" height="150">
          <defs><clipPath id="egg-shell-line"><path d={SHELL} /></clipPath></defs>
          <polyline points={zig} fill="none" pathLength="1" strokeLinejoin="round" clipPath="url(#egg-shell-line)" />
        </svg>
      </div>
    </div>
  )
}

// The egg as an icon: painted as the big one is — its colours, the wavy
// band and the dots in white, a shine — for the games' bubble.
export function EggIcon({ size = 24, className, style }) {
  const id = useId()
  return (
    <svg className={className} style={style} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <defs>
        <linearGradient id={`${id}-paint`} x1="0" y1="0" x2="0.4" y2="1">
          <stop offset="0" style={{ stopColor: 'var(--vivid-a)' }} />
          <stop offset="1" style={{ stopColor: 'var(--vivid-b)' }} />
        </linearGradient>
        <clipPath id={`${id}-shell`}><path d={ICON_SHELL} /></clipPath>
      </defs>
      <g clipPath={`url(#${id}-shell)`}>
        <path d={ICON_SHELL} fill={`url(#${id}-paint)`} />
        <path d="M3 10.4 C 6 8.6, 8.6 12, 12 10.4 S 18 8.6, 21 10.4" fill="none" stroke="white" strokeOpacity="0.75" strokeWidth="1.3" />
        {[8.2, 12, 15.8].map((x, k) => <circle key={x} cx={x} cy={k === 1 ? 16.6 : 16} r="0.95" fill="white" fillOpacity="0.75" />)}
        <ellipse cx="9" cy="7" rx="1.6" ry="2.8" transform="rotate(-24 9 7)" fill="white" fillOpacity="0.35" />
      </g>
    </svg>
  )
}

const ICON_SHELL = 'M12 2.5 C 16.6 2.5, 19.5 10, 19.5 14 C 19.5 18.4, 16.2 21.5, 12 21.5 C 7.8 21.5, 4.5 18.4, 4.5 14 C 4.5 10, 7.4 2.5, 12 2.5 Z'
