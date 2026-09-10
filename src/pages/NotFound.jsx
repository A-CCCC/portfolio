// src/pages/NotFound.jsx
import { Link } from 'react-router-dom'
import { TYPE } from '../styles/type'
import useFadeIn from '../hooks/useFadeIn'

// Catches every unmatched URL. Without it, a removed or mistyped path rendered
// the navbar over an empty page, which looks broken rather than missing.
export default function NotFound() {
  const titleOpacity = useFadeIn(100)
  const bodyOpacity = useFadeIn(600)
  const eggOpacity = useFadeIn(2200)

  return (
    <div style={{
      minHeight: '100vh',
      fontFamily: 'system-ui',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
      padding: '0 24px',
    }}>
      <h1 style={{
        fontSize: TYPE.pageTitle,
        fontWeight: 'bold',
        letterSpacing: '-0.01em',
        marginBottom: 16,
        opacity: titleOpacity,
        transition: 'opacity 1.5s ease',
      }}>
        Page not found
      </h1>
      <p style={{
        fontSize: TYPE.body,
        color: 'var(--text-muted)',
        marginBottom: 32,
        opacity: bodyOpacity,
        transition: 'opacity 1.5s ease',
      }}>
        That page does not exist, or it has been taken down.
      </p>
      <Link
        to="/"
        className="hub-link"
        style={{
          color: 'var(--text)',
          fontSize: TYPE.body,
          opacity: bodyOpacity,
          transition: 'opacity 1.5s ease',
        }}
      >
        Back to home
      </Link>
      <Link
        to="/games"
        className="hub-link"
        style={{
          marginTop: 40,
          color: 'var(--text-muted)',
          fontSize: TYPE.small,
          opacity: eggOpacity,
          transition: 'opacity 1.5s ease',
        }}
      >
        Or play something while you are here
      </Link>
    </div>
  )
}
