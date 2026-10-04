// src/pages/projects/Misc.jsx
import useFadeIn from '../../hooks/useFadeIn'
import useFadeInOnScroll from '../../hooks/useFadeInOnScroll'
import { TYPE, HERO_TOP } from '../../styles/type'
import Carousel from '../../components/Carousel'
import { misc as projects } from '../../data/projects'

export default function Misc() {
  const titleOpacity = useFadeIn(100)
  const [carouselRef, carouselOpacity] = useFadeInOnScroll(0)

  return (
    <div style={{ fontFamily: 'system-ui' }}>

      {/* The title gets a screen to itself, centered, the way every other
          page on the site opens — the hubs above these and the project
          pages below them both. */}
      <div style={{
        height: 'var(--screen)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        padding: `${HERO_TOP} 24px 0`,
        textAlign: 'center',
      }}>
        <h1 className="glass-title" data-text="Miscellaneous Projects" style={{
          fontSize: TYPE.pageTitle,
          fontWeight: 'bold',
          opacity: titleOpacity,
          transition: 'opacity 1.5s ease',
        }}>
          Miscellaneous Projects
        </h1>
      </div>

      <div ref={carouselRef} style={{
        padding: '0 0 80px',
        textAlign: 'center',
        opacity: carouselOpacity,
        transition: 'opacity 1.5s ease',
      }}>
        <Carousel items={projects} />
      </div>
    </div>
  )
}
