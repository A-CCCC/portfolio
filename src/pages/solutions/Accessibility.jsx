// src/pages/solutions/Accessibility.jsx
import useFadeIn from '../../hooks/useFadeIn'
import useFadeInOnScroll from '../../hooks/useFadeInOnScroll'
import { TYPE } from '../../styles/type'
import Carousel from '../../components/Carousel'
import { accessibility as solutions } from '../../data/projects'

export default function Accessibility() {
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
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 24px',
        textAlign: 'center',
      }}>
        <h1 style={{
          fontSize: TYPE.pageTitle,
          fontWeight: 'bold',
          opacity: titleOpacity,
          transition: 'opacity 1.5s ease',
        }}>
          Accessibility Solutions
        </h1>
      </div>

      <div ref={carouselRef} style={{
        padding: '0 0 80px',
        textAlign: 'center',
        opacity: carouselOpacity,
        transition: 'opacity 1.5s ease',
      }}>
        <Carousel items={solutions} />
      </div>
    </div>
  )
}