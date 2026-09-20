// src/pages/Loading.jsx
//
// The loading screen with nothing behind it, for anyone who finds the address.
// It runs, it finishes, and then it admits there was nothing to load.
import { useState } from 'react'
import { Link } from 'react-router-dom'
import LoadingScreen from '../components/LoadingScreen'
import useFadeIn from '../hooks/useFadeIn'
import { TYPE } from '../styles/type'

export default function Loading() {
  // Keyed, so "again" builds a new bar rather than resuming the old one
  const [run, setRun] = useState(0)
  const [done, setDone] = useState(false)

  if (!done) {
    return <LoadingScreen key={run} onDone={() => setDone(true)} />
  }
  return <Loaded onAgain={() => { setDone(false); setRun((n) => n + 1) }} />
}

function Loaded({ onAgain }) {
  const opacity = useFadeIn(80)

  return (
    <div style={{
      minHeight: 'var(--screen)',
      background: 'var(--bg)',
      color: 'var(--text)',
      fontFamily: 'system-ui',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '120px 24px 100px',
      textAlign: 'center',
      opacity,
      transition: 'opacity 1.2s ease',
    }}>
      <h1 style={{
        fontSize: TYPE.pageTitle,
        fontWeight: 'bold',
        letterSpacing: '-0.01em',
        margin: 0,
      }}>
        Loaded
      </h1>

      <p className="page-intro-line" style={{
        fontSize: TYPE.body,
        lineHeight: 1.7,
        color: 'var(--text-muted)',
        margin: '16px 0 0',
      }}>
        Nothing was loading. There is nothing here to load.
      </p>

      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 10, marginTop: 28 }}>
        <button
          type="button"
          onClick={onAgain}
          className="reach-link reach-button"
          style={{ fontSize: TYPE.small }}
        >
          Watch it again
        </button>
        <Link to="/games" className="reach-link" style={{ fontSize: TYPE.small }}>
          Play something instead
        </Link>
      </div>
    </div>
  )
}
