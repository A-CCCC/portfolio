// src/pages/Contact.jsx
import useFadeIn from '../hooks/useFadeIn'
import { TYPE } from '../styles/type'
import { contact } from '../data/site-copy'
import { SHOP } from '../data/shop'
import PageIntro from '../components/PageIntro'
import { isFullSite } from '../data/site-copy'

// The address the home page also shows, in one place on each page so the two
// cannot drift apart.
// From the copy kept off the repository, so the address is not compiled into
// the public bundle even though this page is never routed there.
const REACH = contact

export default function Contact() {
  const titleOpacity = useFadeIn(100)
  const bodyOpacity = useFadeIn(600)

  // The tab leads here in public too, but what would be on the page is
  // not in this build — so it says it is coming rather than showing a
  // stripped-out version of itself. Below the hooks, which have to run
  // the same way on every render.
  if (!isFullSite) {
    return <PageIntro title="Contact" description="" comingSoon notice="(Not Available Here)" />
  }

  return (
    <div style={{
      minHeight: 'var(--screen)',
      fontFamily: 'system-ui',
      padding: '120px 24px 80px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      textAlign: 'center',
    }}>
      <h1 style={{
        fontSize: TYPE.pageTitle,
        fontWeight: 'bold',
        marginBottom: 32,
        opacity: titleOpacity,
        transition: 'opacity 1.5s ease',
      }}>
        Services
      </h1>
      <div style={{
        color: 'var(--text-body)',
        fontSize: TYPE.body,
        lineHeight: 1.9,
        opacity: bodyOpacity,
        transition: 'opacity 1.5s ease',
      }}>
        <p style={{ marginBottom: 8 }}>
          <a href={`mailto:${REACH?.email ?? ''}`} style={{ color: 'var(--text-body)' }}>
            {REACH?.email}
          </a>
        </p>
        <p>
          <a href={REACH?.linkedin} target="_blank" rel="noreferrer" style={{ color: 'var(--text-body)' }}>
            LinkedIn
          </a>
        </p>

        {/* What is for sale, gathered in one place. The listings themselves are
            public — it is this page that is not, so they are here as a private
            index of them rather than as something being kept back. Each one is
            also on the page of the piece it belongs to. */}
        {SHOP.length > 0 && (
          <div style={{ marginTop: 40 }}>
            <p style={{ color: 'var(--text-muted)', fontSize: TYPE.small, marginBottom: 12 }}>
              For sale
            </p>
            {SHOP.map((item) => (
              <p key={item.page} style={{ marginBottom: 8 }}>
                <a
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: 'var(--text-body)' }}
                >
                  {item.name}
                </a>
              </p>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}