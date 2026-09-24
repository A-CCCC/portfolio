// src/pages/Contact.jsx
//
// The Services page, at /services (and still at /contact, which is what the
// public build's navbar used to call it).
//
// What can be bought: the models listed on Etsy, each on a card that is
// nothing but the way through to its listing.
//
// The résumé used to sit under these. It reads as who I am rather than what is
// for sale, so it lives on About Me now.
import useFadeIn from '../hooks/useFadeIn'
import { TYPE } from '../styles/type'
import { SHOP } from '../data/shop'

export default function Contact() {
  const titleOpacity = useFadeIn(100)
  const leadOpacity = useFadeIn(500)
  const shopOpacity = useFadeIn(800)

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
    </div>
  )
}
