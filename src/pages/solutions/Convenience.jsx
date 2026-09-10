// src/pages/solutions/Convenience.jsx
import useFadeIn from '../../hooks/useFadeIn'
import { TYPE } from '../../styles/type'
import Carousel from '../../components/Carousel'
import { convenience as solutions } from '../../data/projects'

export default function Convenience() {
  const titleOpacity = useFadeIn(100)
  const carouselOpacity = useFadeIn(600)

  return (
    <div style={{
      minHeight: '100vh',
      fontFamily: 'system-ui',
      padding: '120px 0 80px',
      textAlign: 'center',
    }}>
      <h1 style={{
        fontSize: TYPE.pageTitle,
        fontWeight: 'bold',
        marginBottom: 48,
        opacity: titleOpacity,
        transition: 'opacity 1.5s ease',
      }}>
        Convenience Solutions
      </h1>
      <div style={{
        opacity: carouselOpacity,
        transition: 'opacity 1.5s ease',
      }}>
        <Carousel items={solutions} />
      </div>
    </div>
  )
}