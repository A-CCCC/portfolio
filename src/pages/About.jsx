// src/pages/About.jsx
//
// Who I am, at length: the portrait and the paragraph from the home page, and
// under them the résumé. Published: the paragraph is on the public home page
// word for word, and the résumé's public copy leaves out the phone number.
import useFadeIn from '../hooks/useFadeIn'
import { TYPE } from '../styles/type'
import Portrait from '../components/Portrait'
import Resume from '../components/Resume'
import { resume } from '../data/site-copy'

export default function About() {
  const titleOpacity = useFadeIn(100)
  const bodyOpacity = useFadeIn(600)
  const resumeOpacity = useFadeIn(1000)

  return (
    // on the site's wallpaper, as the home page is (.home-backdrop)
    <div className="home-backdrop" style={{
      minHeight: 'var(--screen)',
      fontFamily: 'system-ui',
      padding: '120px 24px 80px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      textAlign: 'center',
    }}>
      <h1 className="glass-title" data-text="About Me" style={{
        fontSize: TYPE.pageTitle,
        fontWeight: 'bold',
        marginBottom: 32,
        opacity: titleOpacity,
        transition: 'opacity 1.5s ease',
      }}>
        About Me
      </h1>
      <div style={{
        marginBottom: 32,
        opacity: bodyOpacity,
        transition: 'opacity 1.5s ease',
      }}>
        <Portrait size={180} />
      </div>
      <p className="prose-phone glass glass-vivid nav-glass text-panel" style={{
        color: 'var(--text-body)',
        fontSize: TYPE.body,
        lineHeight: 1.7,
        maxWidth: 620,
        opacity: bodyOpacity,
        transition: 'opacity 1.5s ease',
      }}>
        I’m Alex, a junior at the Bullis School. I design and build solutions to a wide range of
        problems, ranging from daily annoyances to long-term problems. I also make cool
        projects, like models from Clash Royale, a working lightsaber (still in progress!), and
        Halloween costumes and accessories. On this website, I try to present these projects and
        solutions in a fun and visually engaging way, so I added some fun Easter eggs too! I’m
        interested in engineering and science and I row outside of school.
      </p>

      {/* Behind a rule, because it is a different kind of reading: the
          paragraph above is for anyone, and this is for whoever wants the
          dates. Left-aligned by the component itself — a résumé read down a
          centered column is a poster rather than a document. */}
      {/* As the home page does from the words about me down, the wallpaper
          held still once the résumé reaches the top of the screen, and the
          résumé going on up over it (.wall-lock, wallpaper.js): its part of
          the page the page's whole width and down to its foot, for the
          wallpaper held under it to cover */}
      {resume && (
        <div className="wall-lock-zone" style={{
          alignSelf: 'stretch',
          margin: '0 -24px -80px',
          padding: '56px 24px 80px',
        }}>
          <div className="wall-lock" aria-hidden="true"><i /></div>
          <div className="glass glass-vivid nav-glass text-panel" style={{
            width: '100%',
            maxWidth: 820,
            margin: '0 auto',
            opacity: resumeOpacity,
            transition: 'opacity 1.5s ease',
          }}>
            <Resume resume={resume} />
          </div>
        </div>
      )}
    </div>
  )
}