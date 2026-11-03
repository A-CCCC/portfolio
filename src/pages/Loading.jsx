// src/pages/Loading.jsx
//
// The loading screen with nothing behind it, for anyone who finds the address.
// It runs, it finishes, and then it admits there was nothing to load.
import { useState } from 'react'
import { Link } from 'react-router-dom'
import LoadingScreen from '../components/LoadingScreen'
import { markLoadingSeen, openOutOfBar } from '../components/loading-joke'
import useFadeIn from '../hooks/useFadeIn'
import { TYPE, TITLE_GAP } from '../styles/type'

export default function Loading() {
  // Keyed, so "again" builds a new bar rather than resuming the old one
  const [run, setRun] = useState(0)
  const [done, setDone] = useState(false)

  if (!done) {
    // (and the games, reached from here, do not run the joke a second time)
    return <LoadingScreen key={run} onDone={() => { markLoadingSeen(); openOutOfBar(() => setDone(true)) }} />
  }
  return <Loaded onAgain={() => { setDone(false); setRun((n) => n + 1) }} />
}

// Set as every other page is: on the wallpaper, the title in clear glass
// across its band, the line under it on a chip, and the two ways on as the
// home page's View services is — pills of glass. "Play something instead"
// opens the games out of its pill, as a link in the navbar opens its page.
function Loaded({ onAgain }) {
  const titleOpacity = useFadeIn(80)
  const lineOpacity = useFadeIn(400)
  const linksOpacity = useFadeIn(700)
  const pill = {
    color: 'var(--text)',
    textDecoration: 'none',
    fontSize: TYPE.small,
    '--count-hover': 'var(--hover)',
    margin: 0,
  }

  return (
    <div className="home-backdrop" style={{
      minHeight: 'var(--screen)',
      color: 'var(--text)',
      fontFamily: 'system-ui',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '120px var(--gutter) 100px',
      textAlign: 'center',
    }}>
      <h1 className="glass-title" data-text="Loaded" style={{
        fontSize: TYPE.pageTitle,
        fontWeight: 'bold',
        letterSpacing: '-0.01em',
        margin: `0 0 ${TITLE_GAP}px`,
        opacity: titleOpacity,
        transition: 'opacity 1.5s ease',
      }}>
        Loaded
      </h1>

      <p className="page-intro-line text-chip" style={{
        fontSize: TYPE.body,
        lineHeight: 1.6,
        margin: 0,
        opacity: lineOpacity,
        transition: 'opacity 1.5s ease',
      }}>
        Nothing was loading. There is nothing here to load.
      </p>

      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 14,
        marginTop: 28,
        opacity: linksOpacity,
        transition: 'opacity 1.5s ease',
      }}>
        <button
          type="button"
          onClick={onAgain}
          className="count-link hero-link"
          style={{ ...pill, border: 'none', fontFamily: 'inherit', cursor: 'pointer' }}
        >
          Watch it again
          <i className="glass glass-vivid nav-lit" aria-hidden="true" />
        </button>
        <Link to="/games" className="count-link hero-link" style={pill}>
          Play something instead
          <i className="glass glass-vivid nav-lit" aria-hidden="true" />
        </Link>
      </div>
    </div>
  )
}
