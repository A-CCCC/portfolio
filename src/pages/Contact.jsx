// src/pages/Contact.jsx
//
// The Services page, at /services (and still at /contact, which is what the
// public build's navbar used to call it).
//
// Two halves, and which of them exists depends on the build. The listings are
// public — being found is the point of them — while the ways to get in touch
// and the résumé come from the copy kept off the repository, so in public they
// are not hidden, they are simply not there.
import useFadeIn from '../hooks/useFadeIn'
import { TYPE } from '../styles/type'
import { resume } from '../data/site-copy'
import { SHOP } from '../data/shop'
import Resume from '../components/Resume'

export default function Contact() {
  const titleOpacity = useFadeIn(100)
  const leadOpacity = useFadeIn(500)
  const shopOpacity = useFadeIn(800)
  const resumeOpacity = useFadeIn(1100)

  return (
    <div style={{
      minHeight: 'var(--screen)',
      background: 'var(--bg)',
      color: 'var(--text)',
      fontFamily: 'system-ui',
      padding: '120px var(--gutter) 96px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      textAlign: 'center',
    }}>
      <h1 style={{
        fontSize: TYPE.pageTitle,
        fontWeight: 'bold',
        letterSpacing: '-0.01em',
        margin: 0,
        opacity: titleOpacity,
        transition: 'opacity 1.5s ease',
      }}>
        Services
      </h1>

      <p className="page-intro-line" style={{
        fontSize: TYPE.lead,
        lineHeight: 1.7,
        color: 'var(--text-body)',
        margin: '16px 0 0',
        opacity: leadOpacity,
        transition: 'opacity 1.5s ease',
      }}>
        Models I have designed and printed, for sale on Etsy.
      </p>

      {/* Each piece on a card of its own, the model sitting in a tinted disc
          the way it does in the bubbles on the home page. The whole card is the
          way through to the listing: there is nothing else on it to press. */}
      {SHOP.length > 0 && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: 24,
          width: '100%',
          maxWidth: 720,
          margin: '56px 0 0',
          opacity: shopOpacity,
          transition: 'opacity 1.5s ease',
        }}>
          {SHOP.map((item) => (
            <a
              key={item.page}
              href={item.url}
              target="_blank"
              rel="noreferrer"
              className="shop-card"
            >
              <span
                className="shop-card-disc"
                style={{ background: `var(--card-${item.tint})` }}
              >
                {item.image && <img src={item.image} alt="" />}
              </span>

              <span style={{
                fontSize: TYPE.card,
                fontWeight: 400,
                letterSpacing: '-0.01em',
                margin: '20px 0 0',
              }}>
                {item.name}
              </span>

              {item.blurb && (
                <span style={{
                  fontSize: TYPE.small,
                  lineHeight: 1.6,
                  color: 'var(--text-body)',
                  margin: '8px 0 0',
                }}>
                  {item.blurb}
                </span>
              )}

              <span className="shop-card-go" style={{ fontSize: TYPE.small }}>
                View on Etsy
                <span className="count-arrow" aria-hidden="true">→</span>
              </span>
            </a>
          ))}
        </div>
      )}

      {/* The résumé, where there is one. Like the address above it, it comes
          from the copy kept off the repository — it carries a phone number and
          a school, which is the sort of thing the public build must not have. */}
      {resume && (
        <div style={{
          width: '100%',
          maxWidth: 760,
          margin: '72px 0 0',
          paddingTop: 56,
          borderTop: '1px solid var(--border)',
          opacity: resumeOpacity,
          transition: 'opacity 1.5s ease',
        }}>
          <Resume resume={resume} />
        </div>
      )}
    </div>
  )
}
