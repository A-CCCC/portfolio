// src/pages/Solutions.jsx
import useFadeIn from '../hooks/useFadeIn'
import { TYPE, HERO_TOP, TITLE_GAP } from '../styles/type'
import CategoryBand from '../components/CategoryBand'
import { accessibility, convenience } from '../data/projects'
import asset from '../lib-asset'

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
    cover: asset('/thumbnails/wheelchair-storage.webp'),
  },
  {
    label: 'Convenience',
    path: '/solutions/convenience',
    items: convenience,
    blurb: 'Small fixes for the everyday annoyances most people simply put up with — '
      + 'a wiper, a holder, a container that finally fits.',
    cover: asset('/thumbnails/backup-camera-wiper.webp'),
  },
]

export default function Solutions() {
  const titleOpacity = useFadeIn(100)
  const introOpacity = useFadeIn(600)

  return (
    // on the site's wallpaper, as the home page is (.home-backdrop)
    <div className="home-backdrop" style={{ color: 'var(--text)', fontFamily: 'system-ui' }}>

      <div style={{
        height: 'var(--screen)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        padding: `${HERO_TOP} 24px 0`,
        textAlign: 'center',
      }}>
        <h1 className="glass-title" data-text={TITLE} style={{
          // Same size as every other page's title, the home page included.
          // It was TYPE.hubTitle, a tier larger — put that back here to
          // return to it; the size itself is still in the scale.
          fontSize: TYPE.pageTitle,
          fontWeight: 'bold',
          letterSpacing: '-0.02em',
          marginBottom: TITLE_GAP,
          opacity: titleOpacity,
          transition: 'opacity 1.5s ease',
        }}>
          {TITLE}
        </h1>
        {/* on a pill of glass, as Services' line is (.text-chip) */}
        <p className="page-intro-line text-chip" style={{
          fontSize: TYPE.lead,
          lineHeight: 1.6,
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
