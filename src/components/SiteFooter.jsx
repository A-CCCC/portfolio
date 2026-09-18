// src/components/SiteFooter.jsx
//
// The foot of every page: a way to get in touch, wherever you have got to.
//
// Built only where there is an address to put in it. The address lives in the
// copy kept off the repository, so in public this is not a footer with the
// details stripped out — there is no footer at all, and nothing to find in the
// markup either.
//
// The games are the exception. They are a screen to be played on rather than a
// page to be read to the end of, and a strip of contact details under the board
// is an invitation to stop playing.
import { useLocation } from 'react-router-dom'
import { contact } from '../data/site-copy'
import EmailLink from './EmailLink'
import { TYPE } from '../styles/type'

const PLAYFIELDS = ['/log', '/barrel', '/snake']

export default function SiteFooter() {
  const { pathname } = useLocation()
  if (!contact || PLAYFIELDS.includes(pathname)) return null

  return (
    <footer style={{
      borderTop: '1px solid var(--border)',
      background: 'var(--bg)',
      padding: '24px var(--gutter) 28px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      textAlign: 'center',
      fontFamily: 'system-ui',
    }}>
      <p style={{
        fontSize: TYPE.caption,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        color: 'var(--text-muted)',
        margin: '0 0 6px',
      }}>
        Get in touch
      </p>

      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 8 }}>
        <EmailLink
          email={contact.email}
          className="reach-link"
          style={{ fontSize: TYPE.small }}
        />
        <a
          href={contact.linkedin}
          target="_blank"
          rel="noreferrer"
          className="reach-link"
          style={{ fontSize: TYPE.small }}
        >
          LinkedIn
        </a>
      </div>
    </footer>
  )
}
