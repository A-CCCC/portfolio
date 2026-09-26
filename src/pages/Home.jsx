// src/pages/Home.jsx
import { Link } from 'react-router-dom'
import { contact } from '../data/site-copy'
import { TYPE } from '../styles/type'
import useFadeIn from '../hooks/useFadeIn'
import useFadeInOnScroll from '../hooks/useFadeInOnScroll'
import ProjectBubbles from '../components/ProjectBubbles'
import Portrait from '../components/Portrait'
import { featured, current } from '../data/projects'
import { describe } from '../data/site-copy'
import EmailLink from '../components/EmailLink'

// The same address and profile the Contact page publishes, kept in one place so
// the two cannot drift apart.
// Absent in public, where the block below is not built at all.
const REACH = contact

// The line under the featured project's name; nothing until it is written.
const FEATURED_LINE = describe(featured.page)

export default function Home() {
  const [featuredRef, featuredOpacity] = useFadeInOnScroll(0)
  const [currentRef, currentOpacity] = useFadeInOnScroll(0)
  const titleOpacity = useFadeIn(100)
  // Last of everything on the opening screen. The bubbles begin at 1.2s and
  // arrive one after another over half a second more, so this waits for the
  // screen to be finished before offering somewhere to go.
  const servicesOpacity = useFadeIn(2200)
  const [aboutRef, aboutOpacity] = useFadeInOnScroll(0)

  return (
    <div style={{ background: 'var(--bg)', color: 'var(--text)', fontFamily: 'system-ui' }}>

      {/* ---- Hero: fades in on page load ---- */}
      <div style={{
        position: 'relative',
        height: 'var(--screen)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <ProjectBubbles />
        <h1 style={{
          position: 'relative',
          zIndex: 1,
          // Sits above the bubbles visually without stealing their clicks.
          pointerEvents: 'none',
          fontSize: TYPE.pageTitle,
          fontWeight: 'bold',
          letterSpacing: '0.01em',
          color: 'var(--text)',
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
            marginTop: 10,
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
        </Link>
      </div>

      {/* ---- About + contact: fades in when scrolled into view ---- */}
      <div
        ref={aboutRef}
        style={{
          // Sized by its padding rather than a share of the viewport: a short
          // section that fills the screen reads as another page to scroll past,
          // and this one is meant to sit at the foot of the hero.
          padding: '72px 24px 96px',
          opacity: aboutOpacity,
          transition: 'opacity 1.5s ease',
        }}
      >
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 40,
          maxWidth: 800,
          margin: '0 auto',
        }}>
          <Portrait />

          <div style={{ flex: '1 1 320px', minWidth: 0 }}>
            <h2 style={{ fontSize: TYPE.sub, fontWeight: 300, marginBottom: 12 }}>
              About me
            </h2>
            <p style={{
              fontSize: TYPE.body,
              lineHeight: 1.65,
              color: 'var(--text-body)',
              marginBottom: 20,
            }}>
              Hi, I'm Alex. I design and build solutions to everyday problems, from small
              annoyances to real accessibility challenges. I model most of my projects in
              Fusion, adding electronics where they're needed. I also recreate models from
              games like Clash Royale, which is where I push my modeling and animation
              abilities the furthest. I'm a junior in high school with interests in
              engineering and science, and outside of school I row. I hid some fun easter
              eggs across this website, so look everywhere!
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
                    className="hub-link"
                    style={{ color: 'var(--text-body)', fontSize: TYPE.small }}
                  />
                  <span className="reach-pair" style={{ '--pair-gap': '20px' }}>
                    <span className="reach-sep" aria-hidden="true">|</span>
                    <a
                      href={REACH.linkedin}
                      target="_blank"
                      rel="noreferrer"
                      className="hub-link"
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
        ref={featuredRef}
        style={{
          padding: '0 var(--gutter) 96px',
          display: 'flex',
          justifyContent: 'center',
          opacity: featuredOpacity,
          transition: 'opacity 1.5s ease',
        }}
      >
        <Link to={featured.path} className="shop-card feature-card">
          <span
            className="shop-card-disc"
            style={{ background: `var(--card-${featured.tint})` }}
          >
            {featured.image
              ? <img src={featured.image} alt="" />
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
          ref={currentRef}
          style={{
            padding: '0 var(--gutter) 96px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            opacity: currentOpacity,
            transition: 'opacity 1.5s ease',
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
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 224px))',
            justifyContent: 'center',
            gap: 16,
            width: '100%',
            maxWidth: 720,
          }}>
            {current.map((item) => (
              <Link key={item.path} to={item.path} className="shop-card current-card">
                <span
                  className="shop-card-disc"
                  style={{ background: `var(--card-${item.tint})` }}
                >
                  {item.image
                    ? <img src={item.image} alt="" />
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

    </div>
  )
}
