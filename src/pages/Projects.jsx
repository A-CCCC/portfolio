// src/pages/Projects.jsx
import useFadeIn from '../hooks/useFadeIn'
import { TYPE, HERO_TOP, TITLE_GAP } from '../styles/type'
import CategoryBand from '../components/CategoryBand'
import { clashRoyale, halloween, misc } from '../data/projects'
import asset from '../lib-asset'

const TITLE = 'Projects'
const SUBTITLE = 'Models, repairs, and everything else.'
const NOUN = 'project'

const SECTIONS = [
  {
    label: 'Clash Royale',
    path: '/projects/clash-royale',
    items: clashRoyale,
    blurb: 'Highly detailed models I built using reference images from the video game Clash Royale.',
    cover: asset('/thumbnails/skeleton-barrel.webp'),
    // Clicking the barrel is the only way to the games page. The box is where
    // the barrel actually sits in its render — left, top, width, height, as
    // percentages — so the rest of the frame stays as unclickable as every
    // other cover on the site.
    secret: '/games',
    secretBox: [27.5, 16.5, 45.1, 67.0],
  },
  {
    label: 'Halloween',
    path: '/projects/halloween',
    items: halloween,
    blurb: 'Helmets and props built almost every year, made out of cardboard and whatever else we had lying around.',
    cover: asset('/thumbnails/darth-vader.webp'),
  },
  {
    label: 'Miscellaneous',
    path: '/projects/misc',
    items: misc,
    blurb: "Right now it's just a repair for an old RC car, but hopefully more stuff will be here.",
    cover: asset('/thumbnails/rc-car-repair.webp'),
  },
]

export default function Projects() {
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
