// src/pages/About.jsx
import useFadeIn from '../hooks/useFadeIn'
import { TYPE } from '../styles/type'
import Portrait from '../components/Portrait'

export default function About() {
  const titleOpacity = useFadeIn(100)
  const bodyOpacity = useFadeIn(600)

  return (
    <div style={{
      minHeight: '100vh',
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
    </div>
  )
}