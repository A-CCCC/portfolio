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

const PLAYFIELDS = ['/log', '/barrel', '/snake', '/loading']

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
        {/* The pill holds the address and its copy button together, so the
            two sit as close here as they do anywhere else on the site and the
            padding stays on the outside where it belongs. */}
        <EmailLink
          email={contact.email}
          boxClassName="reach-link"
          className="reach-address"
          style={{ fontSize: TYPE.small }}
        />
        {/* The bar marks where one link ends and the next begins, so the two
            read as two things rather than one run of words. Not read aloud: it
            is punctuation for the eye, and the links announce themselves. It
            travels with LinkedIn so a wrap never strands it. */}
        <span className="reach-pair">
          <span className="reach-sep" aria-hidden="true">|</span>
          <a
            href={contact.linkedin}
            target="_blank"
            rel="noreferrer"
            className="reach-link"
            style={{ fontSize: TYPE.small }}
          >
            LinkedIn
          </a>
        </span>
      </div>
    </footer>
  )
}
