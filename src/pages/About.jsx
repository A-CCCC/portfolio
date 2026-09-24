// src/pages/About.jsx
//
// Who I am, at length: the portrait and the paragraph from the home page, and
// under them the résumé.
//
// Everything here is published. The page used to say it was not available in
// the public build, from when it was going to hold things that could not be —
// but the paragraph is on the public home page word for word, and the résumé
// is written to be read by people I have not met.
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
        About Me
      </h1>
      <div style={{
        marginBottom: 32,
        opacity: bodyOpacity,
        transition: 'opacity 1.5s ease',
      }}>
        <Portrait size={180} />
      </div>
      <p style={{
        color: 'var(--text-body)',
        fontSize: TYPE.body,
        lineHeight: 1.7,
        maxWidth: 560,
        opacity: bodyOpacity,
        transition: 'opacity 1.5s ease',
      }}>
        Hi, I'm Alex. I design and build solutions to everyday problems, from small annoyances
        to real accessibility challenges. I model most of my projects in Fusion, adding
        electronics where they're needed. I also recreate models from games like Clash Royale,
        which is where I push my modeling and animation abilities the furthest. I'm a junior in
        high school with interests in engineering and science, and outside of school I row.
        I hid some fun easter eggs across this website, so look everywhere!
      </p>

      {/* Behind a rule, because it is a different kind of reading: the
          paragraph above is for anyone, and this is for whoever wants the
          dates. Left-aligned by the component itself — a résumé read down a
          centered column is a poster rather than a document. */}
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