// src/pages/Home.jsx
import { Link } from 'react-router-dom'
import { contact } from '../data/site-copy'
import { TYPE, HERO_TOP, TITLE_GAP } from '../styles/type'
import useFadeIn from '../hooks/useFadeIn'
import ProjectBubbles from '../components/ProjectBubbles'
import Portrait from '../components/Portrait'
import { featured, current, completed } from '../data/projects'
import { describe } from '../data/site-copy'
import EmailLink from '../components/EmailLink'

// The same address and profile the Contact page publishes, kept in one place so
// the two cannot drift apart.
// Absent in public, where the block below is not built at all.
const REACH = contact

// The pictures in the cards' discs, at the size the bubbles use: the full
// thumbnails are 1400 pixels across for a disc under 100, and the browser,
// which decodes a picture only as it comes on screen, showed a card empty
// while it worked through one
const small = (src) => src.replace('.webp', '-small.webp')

// The line under the featured project's name; nothing until it is written.
const FEATURED_LINE = describe(featured.page)

export default function Home() {
  const titleOpacity = useFadeIn(100)
  // Last of everything on the opening screen. The bubbles begin at 0.7s and
  // arrive one after another over half a second more, so this waits for the
  // screen to be finished before offering somewhere to go.
  const servicesOpacity = useFadeIn(2200)

  return (
    <div style={{ background: 'var(--bg)', color: 'var(--text)', fontFamily: 'system-ui' }}>

      {/* The whole page on its wallpaper (.home-backdrop) — the bubbles too */}
      <div className="home-backdrop">

      {/* ---- Hero: fades in on page load ---- */}
      <div style={{
        position: 'relative',
        height: 'var(--screen)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        // the title where every page has it (HERO_TOP)
        paddingTop: HERO_TOP,
      }}>
        <ProjectBubbles />
        <h1 className="glass-title" data-text="Alex's Design Portfolio" style={{
          position: 'relative',
          zIndex: 1,
          // Sits above the bubbles visually without stealing their clicks.
          pointerEvents: 'none',
          fontSize: TYPE.pageTitle,
          fontWeight: 'bold',
          letterSpacing: '0.01em',
          // On a phone the title wraps, and a wrapped line needs somewhere to
          // wrap to: without these it sets flush against both edges of the glass.
          padding: '0 24px',
          textAlign: 'center',
          opacity: titleOpacity,
          transition: 'opacity 1.5s ease',
        }}>
          Alex's Design Portfolio
        </h1>

        {/* Under the name of the site, where the first thing anyone sees can
            lead somewhere. Above the bubbles, and unlike the title it takes
            its own clicks. No arrow: the ones elsewhere point along a trail of
            hubs, and this is a single door off the front page. */}
        <Link
          to="/services"
          className="count-link hero-link"
          style={{
            position: 'relative',
            zIndex: 1,
            marginTop: TITLE_GAP,
            color: 'var(--text)',
            textDecoration: 'none',
            fontSize: TYPE.small,
            '--count-hover': 'var(--hover)',
            opacity: servicesOpacity,
            // Both of this one's transitions are in .hero-link, since writing
            // either here would drop the other.
          }}
        >
          View services
          {/* The same pill of glass the navbar's links light up with */}
          <i className="glass glass-vivid nav-lit" aria-hidden="true" />
        </Link>
      </div>

      {/* From the words about me down, the wallpaper held still: once the
          opening screen has scrolled away, the panels and cards go on up
          over the wallpaper as it stood then (.wall-lock, wallpaper.js) */}
      <div className="wall-lock-zone">
      <div className="wall-lock" aria-hidden="true"><i /></div>

      {/* ---- About + contact ---- */}
      <div
        style={{
          // Sized by its padding rather than a share of the viewport: a short
          // section that fills the screen reads as another page to scroll past,
          // and this one is meant to sit at the foot of the hero.
          padding: '72px 24px 96px',
        }}
      >
        {/* On a panel of the navbar's glass, so the words read clear of the
            wallpaper behind them (.about-panel) */}
        <div className="glass glass-vivid nav-glass about-panel" style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 40,
          maxWidth: 860,
          margin: '0 auto',
        }}>
          <Portrait />

          <div style={{ flex: '1 1 320px', minWidth: 0 }}>
            <h2 className="glass-title" data-text="About me" style={{ fontSize: TYPE.sub, fontWeight: 300, marginBottom: 12 }}>
              About me
            </h2>
            <p style={{
              fontSize: TYPE.body,
              lineHeight: 1.65,
              color: 'var(--text-body)',
              marginBottom: 20,
            }}>
              I’m Alex, a junior at the Bullis School. I design and build solutions to a
              wide range of problems, ranging from daily annoyances to long-term problems. I
              also make cool projects, like models from Clash Royale, a working lightsaber
              (still in progress!), and Halloween costumes and accessories. On this website,
              I try to present these projects and solutions in a fun and visually engaging
              way, so I added some fun Easter eggs too! I’m interested in engineering and
              science and I row outside of school.
            </p>

            {/* Not rendered at all without somewhere to point: hiding it
                with styling would still publish the address. */}
            {REACH && (
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', gap: '10px 20px' }}>
                {/* Labels the two links beside it. Muted and not a link itself, so
                    the arrow reads as pointing at them rather than leading away. */}
                <span style={{ color: 'var(--text-muted)', fontSize: TYPE.small }}>
                  Contact <span aria-hidden="true">→</span>
                </span>
                {/* The two together, so a narrow screen wraps them away from
                    the label rather than away from each other. See the footer
                    for the bar between them. */}
                <span className="reach-group" style={{ '--pair-gap': '20px' }}>
                  <EmailLink
                    email={REACH.email}
                    className="under-link"
                    style={{ color: 'var(--text-body)', fontSize: TYPE.small }}
                  />
                  <span className="reach-pair" style={{ '--pair-gap': '20px' }}>
                    <span className="reach-sep" aria-hidden="true">|</span>
                    <a
                      href={REACH.linkedin}
                      target="_blank"
                      rel="noreferrer"
                      className="under-link"
                      style={{ color: 'var(--text-body)', fontSize: TYPE.small }}
                    >
                      LinkedIn
                    </a>
                  </span>
                </span>
              </div>
            )}

            <div style={{ marginTop: 18, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              <Link
                to="/about"
                className="count-link"
                style={{
                  color: 'var(--text)',
                  textDecoration: 'none',
                  fontSize: TYPE.small,
                  '--count-hover': 'var(--hover)',
                  margin: '-10px 0 -10px -16px',
                }}
              >
                More about me
                <span className="count-arrow" aria-hidden="true">→</span>
                <i className="glass glass-vivid nav-lit" aria-hidden="true" />
              </Link>

            </div>
          </div>
        </div>
      </div>

      {/* ---- Featured project ---- */}
      {/* One project put forward, on the same card the listings and the games
          use, laid on its side: the model in its disc, the words beside it,
          and the whole card the way through. */}
      <div
        style={{
          padding: '0 var(--gutter) 96px',
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        <Link to={featured.path} className="glass glass-vivid nav-glass shop-card feature-card">
          <span
            className="glass shop-card-disc"
            style={{ '--lg-hue': `var(--hue-${featured.tint})` }}
          >
            {featured.image
              ? <img src={small(featured.image)} alt="" />
              : <span style={{
                  fontSize: TYPE.caption,
                  letterSpacing: '0.02em',
                  color: 'var(--text-body)',
                  opacity: 0.7,
                }}>
                  Coming soon
                </span>}
          </span>

          <span className="feature-card-words">
            <span style={{
              display: 'block',
              fontSize: TYPE.caption,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: 'var(--text-muted)',
            }}>
              Featured project
            </span>
            <span style={{
              display: 'block',
              fontSize: TYPE.card,
              fontWeight: 400,
              letterSpacing: '-0.01em',
              margin: '6px 0 0',
            }}>
              {featured.label}
            </span>
            {FEATURED_LINE && (
              <span style={{
                display: 'block',
                fontSize: TYPE.small,
                lineHeight: 1.6,
                color: 'var(--text-body)',
                margin: '8px 0 0',
              }}>
                {FEATURED_LINE}
              </span>
            )}
            <span className="shop-card-go" style={{ fontSize: TYPE.small, marginTop: 14 }}>
              See the project
              <span className="count-arrow" aria-hidden="true">→</span>
            </span>
          </span>
        </Link>
      </div>

      {/* ---- Current projects ---- */}
      {/* What is on the bench right now, under the one put forward: the same
          card again, smaller, three across where there is room. */}
      {current.length > 0 && (
        <div
          style={{
            padding: '0 var(--gutter) 96px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <h2 style={{
            margin: '0 0 20px',
            fontSize: TYPE.caption,
            fontWeight: 400,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'var(--text-muted)',
          }}>
            {current.length > 1 ? 'Current projects' : 'Current project'}
          </h2>
          {/* Cards of a fixed size, centred: three fill the row, and one on
              its own is a card rather than a band. */}
          {/* (laid out as the completed pages are, below, card for card the
              same size) */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: 16,
            width: '100%',
            maxWidth: 720,
          }}>
            {current.map((item) => (
              <Link key={item.path} to={item.path} className="glass glass-vivid nav-glass shop-card current-card completed-card">
                <span
                  className="glass shop-card-disc"
                  style={{ '--lg-hue': `var(--hue-${item.tint})` }}
                >
                  {item.image
                    ? <img src={small(item.image)} alt="" />
                    : <span style={{ fontSize: TYPE.caption, color: 'var(--text-body)', opacity: 0.7 }}>Coming soon</span>}
                </span>
                <span style={{
                  fontSize: TYPE.small,
                  fontWeight: 400,
                  letterSpacing: '-0.01em',
                  margin: '14px 0 0',
                  textAlign: 'center',
                }}>
                  {item.label}
                </span>
                <span className="shop-card-go" style={{ fontSize: TYPE.caption, marginTop: 10 }}>
                  See the project
                  <span className="count-arrow" aria-hidden="true">→</span>
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ---- Completed pages ---- */}
      {/* The pages that are finished, last: the same cards again, three
          across where there is room. */}
      {completed.length > 0 && (
        <div
          style={{
            padding: '0 var(--gutter) 96px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <h2 style={{
            margin: '0 0 20px',
            fontSize: TYPE.caption,
            fontWeight: 400,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'var(--text-muted)',
          }}>
            Completed pages
          </h2>
          {/* (wrapped and centred row by row, so a last row of fewer than
              the others sits in the middle rather than at the left) */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: 16,
            width: '100%',
            maxWidth: 720,
            // (two across on a phone: each card half the row, its text
            // wrapping rather than holding the card wide)
          }}>
            {completed.map((item) => (
              <Link key={item.path} to={item.path} className="glass glass-vivid nav-glass shop-card current-card completed-card">
                <span
                  className="glass shop-card-disc"
                  style={{ '--lg-hue': `var(--hue-${item.tint})` }}
                >
                  <img src={small(item.image)} alt="" />
                </span>
                <span style={{
                  fontSize: TYPE.small,
                  fontWeight: 400,
                  letterSpacing: '-0.01em',
                  margin: '14px 0 0',
                  textAlign: 'center',
                }}>
                  {item.label}
                </span>
                <span className="shop-card-go" style={{ fontSize: TYPE.caption, marginTop: 10 }}>
                  See the project
                  <span className="count-arrow" aria-hidden="true">→</span>
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      </div>

      </div>
    </div>
  )
}
