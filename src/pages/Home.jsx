// src/pages/Home.jsx
import { Link } from 'react-router-dom'
import { contact } from '../data/site-copy'
import { TYPE } from '../styles/type'
import useFadeIn from '../hooks/useFadeIn'
import useFadeInOnScroll from '../hooks/useFadeInOnScroll'
import ProjectBubbles from '../components/ProjectBubbles'
import Portrait from '../components/Portrait'

// The same address and profile the Contact page publishes, kept in one place so
// the two cannot drift apart.
// Absent in public, where the block below is not built at all.
const REACH = contact

export default function Home() {
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
                <a
                  href={`mailto:${REACH.email}`}
                  className="hub-link"
                  style={{ color: 'var(--text-body)', fontSize: TYPE.small }}
                >
                  {REACH.email}
                </a>
                <a
                  href={REACH.linkedin}
                  target="_blank"
                  rel="noreferrer"
                  className="hub-link"
                  style={{ color: 'var(--text-body)', fontSize: TYPE.small }}
                >
                  LinkedIn
                </a>
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

    </div>
  )
}
