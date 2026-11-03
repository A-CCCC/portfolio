// src/components/loading-joke.js
//
// The loading screen's joke (LoadingScreen.jsx), its two ends: whether it has
// run in this tab (Loads.jsx), so the games do not run it again — also when it
// was watched on its own, at /loading — remembered for the tab rather than
// for ever, so it is there again tomorrow for whoever liked it; and the page
// that follows it opening out of the full bar.
import { flushSync } from 'react-dom'

const REMEMBERS = 'games-loading-seen'

export const seenAlready = () => {
  try {
    return sessionStorage.getItem(REMEMBERS) === 'yes'
  } catch {
    return false      // a private window throws; the joke is not worth a crash
  }
}

export const markLoadingSeen = () => {
  try { sessionStorage.setItem(REMEMBERS, 'yes') } catch { /* fine */ }
}

// The page that follows — the games, or /loading's own admission — opening
// out of the full bar: the bar's track widening and deepening until it is the
// whole screen, the page inside it, the loading screen sinking back behind —
// the way a page opens out of the navbar's link (page-sweep.js), through the
// browser's own page transitions. Where there are none, or less movement is
// asked for, the page simply takes the bar's place.
const OPEN_MS = 760
export function openOutOfBar(show) {
  const html = document.documentElement
  const bar = document.querySelector('[role="progressbar"]')
  const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (!document.startViewTransition || !bar || calm) { show(); return }
  const vw = window.innerWidth, vh = window.innerHeight
  const b = bar.getBoundingClientRect()
  const from = `inset(${b.top.toFixed(1)}px ${(vw - b.right).toFixed(1)}px ${(vh - b.bottom).toFixed(1)}px ${b.left.toFixed(1)}px round ${(b.height / 2).toFixed(1)}px)`
  // the first frame cut by the stylesheet, before the animation has it
  html.style.setProperty('--grow-from', from)
  html.classList.add('vt-grow')
  const turn = document.startViewTransition(() => { flushSync(show) })
  const timing = { duration: OPEN_MS, easing: 'cubic-bezier(0.45, 0, 0.2, 1)', fill: 'forwards' }
  turn.ready.then(() => {
    html.animate([
      { clipPath: from },
      { clipPath: 'inset(0px 0px 0px 0px round 0px)' },
    ], { ...timing, pseudoElement: '::view-transition-new(root)' })
    // the loading screen sinking back, as a page left by a link does
    html.animate([
      { filter: 'none' },
      { filter: 'brightness(0.85) blur(3px)' },
    ], { ...timing, pseudoElement: '::view-transition-old(root)' })
  }).catch(() => {})
  turn.finished.finally(() => { html.classList.remove('vt-grow'); html.style.removeProperty('--grow-from') })
}
