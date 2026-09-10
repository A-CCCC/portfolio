// src/pages/Projects.jsx
import useFadeIn from '../hooks/useFadeIn'
import { TYPE } from '../styles/type'
import CategoryBand from '../components/CategoryBand'
import { clashRoyale, misc } from '../data/projects'
import asset from '../lib-asset'

const TITLE = 'Projects'
const SUBTITLE = 'Models and builds made for their own sake.'
const NOUN = 'project'

const SECTIONS = [
  {
    label: 'Clash Royale',
    path: '/projects/clash-royale',
    items: clashRoyale,
    // Draft copy — a line on what the category covers.
    blurb: 'Models rebuilt from the game using reference images, where I push my '
      + 'modelling and animation the furthest.',
    cover: asset('/thumbnails/skeleton-barrel.webp'),
    // Clicking the barrel is the only way to the games page. The box is where
    // the barrel actually sits in its render — left, top, width, height, as
    // percentages — so the rest of the frame stays as unclickable as every
    // other cover on the site.
    secret: '/games',
    secretBox: [27.5, 16.5, 45.1, 67.0],
  },
  {
    label: 'Miscellaneous',
    path: '/projects/misc',
    items: misc,
    blurb: 'One-off builds and repairs that belong to no category — cardboard '
      + 'costumes, replacement parts, whatever needed making.',
    cover: asset('/thumbnails/halloween-helmets.webp'),
  },
]

export default function Projects() {
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
