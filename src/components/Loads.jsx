// src/components/Loads.jsx
//
// Wraps a page in the loading screen that is not loading it.
//
// Once a visit, not once a page: the games are worth a five-second joke on the
// way in, and are not worth it again every time someone comes back for another
// go. Remembered for the tab rather than for ever, so it is there again
// tomorrow for whoever liked it.
import { useState } from 'react'
import LoadingScreen from './LoadingScreen'

const REMEMBERS = 'games-loading-seen'

const seenAlready = () => {
  try {
    return sessionStorage.getItem(REMEMBERS) === 'yes'
  } catch {
    return false      // a private window throws; the joke is not worth a crash
  }
}

export default function Loads({ children }) {
  const [waiting, setWaiting] = useState(() => !seenAlready())

  const finish = () => {
    try { sessionStorage.setItem(REMEMBERS, 'yes') } catch { /* fine */ }
    setWaiting(false)
  }

  if (waiting) return <LoadingScreen onDone={finish} />
  return children
}
