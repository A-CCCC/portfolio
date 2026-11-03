// src/components/Loads.jsx
//
// Wraps a page in the loading screen that is not loading it.
//
// Once a visit, not once a page: the games are worth a five-second joke on the
// way in, and are not worth it again every time someone comes back for another
// go. Remembered for the tab rather than for ever, so it is there again
// tomorrow for whoever liked it.
//
// When the bar is full, the page opens out of it (loading-joke.js).
import { useState } from 'react'
import LoadingScreen from './LoadingScreen'
import { seenAlready, markLoadingSeen, openOutOfBar } from './loading-joke'

export default function Loads({ children }) {
  const [waiting, setWaiting] = useState(() => !seenAlready())

  const finish = () => {
    markLoadingSeen()
    openOutOfBar(() => setWaiting(false))
  }

  if (waiting) return <LoadingScreen onDone={finish} />
  return children
}
