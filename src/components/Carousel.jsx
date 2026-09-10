// src/components/Carousel.jsx
import { Link } from 'react-router-dom'
import { TYPE } from '../styles/type'

// Card tints cycle through these, so each item in a carousel reads distinctly.
const TINTS = ['var(--card-1)', 'var(--card-2)', 'var(--card-3)', 'var(--card-4)', 'var(--card-5)', 'var(--card-6)']

// Breathing room at both ends of the track. Carried as margins on the first and
// last cards rather than as container padding: padding-right on a horizontally
// scrolling flex container is dropped by some engines (notably WebKit), which
// makes the end gap collapse to 0 while the start gap keeps its full width.
// Item margins are always counted in scrollWidth, so the two ends stay equal.
const EDGE = 32

export default function Carousel({ items }) {
  return (
    <div
      className="carousel-track"
      style={{
        display: 'flex',
        gap: 20,
        overflowX: 'auto',
        scrollSnapType: 'x proximity',
        // Centers the row when it fits; falls back to flex-start (keeping the
        // first card reachable) once the cards overflow.
        justifyContent: 'safe center',
        // Room for the hover lift and its shadow so neither gets clipped.
        padding: '24px 0 56px',
        scrollPadding: EDGE,
        scrollbarWidth: 'none',
        WebkitOverflowScrolling: 'touch',
      }}
    >
      {items.map((item, i) => (
        <Link
          key={item.label}
          to={item.path}
          className="carousel-card"
          style={{
            scrollSnapAlign: 'center',
            flex: '0 0 auto',
            display: 'flex',
            flexDirection: 'column',
            width: 340,
            height: 460,
            marginLeft: i === 0 ? EDGE : 0,
            marginRight: i === items.length - 1 ? EDGE : 0,
            textDecoration: 'none',
            color: 'var(--text)',
            borderRadius: 28,
            overflow: 'hidden',
            background: TINTS[i % TINTS.length],
          }}
        >
          {/* Title block — sits above the image, Apple-style */}
          <div style={{ padding: '36px 32px 0', textAlign: 'left' }}>
            <h3 style={{
              margin: 0,
              fontSize: TYPE.card,
              fontWeight: 600,
              lineHeight: 1.15,
              letterSpacing: '-0.02em',
            }}>
              {item.label}
            </h3>
          </div>

          {/* Image bleeds into the bottom corners */}
          <div style={{
            flex: 1,
            marginTop: 28,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
          }}>
            {item.image
              ? <img src={item.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <span style={{
                  color: 'var(--text-body)',
                  fontSize: TYPE.caption,
                  letterSpacing: '0.02em',
                  opacity: 0.7,
                }}>
                  Coming soon
                </span>
            }
          </div>
        </Link>
      ))}
    </div>
  )
}
