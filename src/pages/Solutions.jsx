// src/pages/Solutions.jsx
import useFadeIn from '../hooks/useFadeIn'
import { TYPE } from '../styles/type'
import CategoryBand from '../components/CategoryBand'
import { accessibility, convenience } from '../data/projects'

const TITLE = 'Solutions'
const SUBTITLE = 'Problems worth solving, in two kinds.'
const NOUN = 'solution'

const SECTIONS = [
  {
    label: 'Accessibility',
    path: '/solutions/accessibility',
    items: accessibility,
    // Draft copy — a line on what the category covers.
    blurb: 'Designs for people whose daily routines are made harder by injury or '
      + 'disability, built around how the person actually moves.',
    cover: '/thumbnails/wheelchair-storage.webp',
  },
  {
    label: 'Convenience',
    path: '/solutions/convenience',
    items: convenience,
    blurb: 'Small fixes for the everyday annoyances most people simply put up with — '
      + 'a wiper, a holder, a container that finally fits.',
    cover: '/thumbnails/backup-camera-wiper.webp',
  },
]

export default function Solutions() {
  const titleOpacity = useFadeIn(100)
  const introOpacity = useFadeIn(600)

  return (
    <div style={{ background: 'var(--bg)', color: 'var(--text)', fontFamily: 'system-ui' }}>

      <div style={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 24px',
        textAlign: 'center',
      }}>
        <h1 style={{
          fontSize: TYPE.hubTitle,
          fontWeight: 'bold',
          letterSpacing: '-0.02em',
          marginBottom: 24,
          opacity: titleOpacity,
          transition: 'opacity 1.5s ease',
        }}>
          {TITLE}
        </h1>
        <p className="page-intro-line" style={{
          fontSize: TYPE.lead,
          lineHeight: 1.7,
          color: 'var(--text-body)',
          opacity: introOpacity,
          transition: 'opacity 1.5s ease',
        }}>
          {SUBTITLE}
        </p>
      </div>

      {SECTIONS.map((section, i) => (
        <CategoryBand key={section.label} {...section} count={section.items.length} noun={NOUN} flip={i % 2 === 1} alt={i % 2 === 0} />
      ))}

    </div>
  )
}
