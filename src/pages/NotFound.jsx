// src/pages/NotFound.jsx
import { Link } from 'react-router-dom'
import { TYPE } from '../styles/type'
import useFadeIn from '../hooks/useFadeIn'

// Catches every unmatched URL. Without it, a removed or mistyped path rendered
// the navbar over an empty page, which looks broken rather than missing.
//
// On the site's wallpaper, as the home page, the hubs and the games are
// (.home-backdrop): its title the glass title they have, the line under it
// on a pill of glass (.text-chip), and the ways on the home page's pills
// (.hero-link) — rather than grey words on the bare page colour, under a
// title whose glass had no wallpaper to look through and went to a blur.
export default function NotFound() {
  const titleOpacity = useFadeIn(100)
  const bodyOpacity = useFadeIn(500)
  const linksOpacity = useFadeIn(900)
  const eggOpacity = useFadeIn(2200)

  const pill = (to, label, opacity, extra = {}) => (
    <Link
      to={to}
      className="count-link hero-link"
      style={{
        position: 'relative',
        color: 'var(--text)',
        textDecoration: 'none',
        fontSize: TYPE.small,
        '--count-hover': 'var(--hover)',
        opacity,
        ...extra,
      }}
    >
      {label}
      <i className="glass glass-vivid nav-lit" aria-hidden="true" />
    </Link>
  )

  return (
    <div className="home-backdrop" style={{
      minHeight: 'var(--screen)',
      color: 'var(--text)',
      fontFamily: 'system-ui',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
      padding: '120px var(--gutter) 80px',
    }}>
      <h1 className="glass-title" data-text="Page not found" style={{
        fontSize: TYPE.pageTitle,
        fontWeight: 'bold',
        letterSpacing: '-0.01em',
        marginBottom: 16,
        opacity: titleOpacity,
        transition: 'opacity 1.5s ease',
      }}>
        Page not found
      </h1>
      <p className="page-intro-line text-chip" style={{
        fontSize: TYPE.body,
        lineHeight: 1.6,
        marginBottom: 36,
        opacity: bodyOpacity,
        transition: 'opacity 1.5s ease',
      }}>
        That page does not exist, or it has been taken down.
      </p>
      {/* (each pill reaches 16px past its box each side: .count-link's margin) */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '34px 46px', justifyContent: 'center' }}>
        {pill('/', 'Back to home', linksOpacity)}
        {pill('/games', 'Or play something while you are here', eggOpacity)}
      </div>
    </div>
  )
}
