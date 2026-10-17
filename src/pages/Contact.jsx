// src/pages/Contact.jsx
//
// The Services page, at /services (and still at /contact, which is what the
// public build's navbar used to call it).
//
// What can be had: something made to order, and the ways to ask for it; then
// the models listed on Etsy, each on a card that is nothing but the way
// through to its listing.
//
// The résumé used to sit under these. It reads as who I am rather than what is
// for sale, so it lives on About Me now.
import useFadeIn from '../hooks/useFadeIn'
import { TYPE, HERO_TOP, TITLE_GAP } from '../styles/type'
import { SHOP } from '../data/shop'
import { contact } from '../data/site-copy'
import EmailLink from '../components/EmailLink'

// The address and the profile the footer and About me give, from the one
// place; absent in a build that does not publish them, where the links are
// not built at all
const REACH = contact

export default function Contact() {
  const titleOpacity = useFadeIn(100)
  const customOpacity = useFadeIn(500)
  const leadOpacity = useFadeIn(900)
  const shopOpacity = useFadeIn(1100)

  return (
    // on the site's wallpaper, as the home page is (.home-backdrop)
    <div className="home-backdrop" style={{
      minHeight: 'var(--screen)',
      color: 'var(--text)',
      fontFamily: 'system-ui',
      // the title where every page has it (HERO_TOP)
      padding: `${HERO_TOP} var(--gutter) 96px`,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      textAlign: 'center',
    }}>
      <h1 className="glass-title" data-text="Services" style={{
        fontSize: TYPE.pageTitle,
        fontWeight: 'bold',
        letterSpacing: '-0.01em',
        margin: 0,
        opacity: titleOpacity,
        transition: 'opacity 1.5s ease',
      }}>
        Services
      </h1>

      {/* First, something made to order: the offer and the ways to ask, on
          one panel of the same glass as the lines under the titles */}
      <div className="page-intro-line text-chip contact-panel" style={{
        margin: `${TITLE_GAP}px 0 0`,
        opacity: customOpacity,
        transition: 'opacity 1.5s ease',
      }}>
        <p style={{ fontSize: TYPE.lead, lineHeight: 1.6 }}>
          If you want something custom-built, message me at the addresses below!
        </p>

        {/* The addresses, lit with the navbar's glass when pointed at, as
            the links in About me are */}
        {REACH && (
          <div className="contact-links">
            <EmailLink
              email={REACH.email}
              boxClassName="count-link reach-pill"
              className="reach-address"
              style={{ fontSize: TYPE.small }}
            />
            <span className="reach-sep" aria-hidden="true">|</span>
            <a
              href={REACH.linkedin}
              target="_blank"
              rel="noreferrer"
              className="count-link reach-pill"
              style={{ color: 'var(--text)', textDecoration: 'none', fontSize: TYPE.small }}
            >
              LinkedIn
              <span className="count-arrow" aria-hidden="true">→</span>
              <i className="glass glass-vivid nav-lit" aria-hidden="true" />
            </a>
          </div>
        )}
      </div>

      {/* Then what is for sale */}
      <p className="page-intro-line text-chip" style={{
        fontSize: TYPE.lead,
        lineHeight: 1.6,
        margin: '56px 0 0',
        opacity: leadOpacity,
        transition: 'opacity 1.5s ease',
      }}>
        Or buy this stuff for your Hyundai Ioniq 5 (N)!
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
          margin: '24px 0 0',
          opacity: shopOpacity,
          transition: 'opacity 1.5s ease',
        }}>
          {SHOP.map((item) => (
            <a
              key={item.page}
              href={item.url}
              target="_blank"
              rel="noreferrer"
              className={`glass glass-vivid glass-panel panel-bright panel-hue-${item.tint} shop-card`}
            >
              <span
                className="glass shop-card-disc"
                style={{ '--lg-tint': `var(--glass-${item.tint})` }}
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
