// src/components/Carousel.jsx
import { useEffect, useRef } from 'react'
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
  const trackRef = useRef(null)
  const barRef = useRef(null)
  const thumbRef = useRef(null)

  // A row that scrolls sideways gives no sign that it does: the scrollbar is
  // hidden, and a card cut off at the edge reads as the end of the set. The bar
  // below says otherwise — it appears when there is more to reach, and stays
  // away when the row already fits.
  //
  // Written straight onto the bar rather than held in state, because it follows
  // a scroll and rendering the whole row again for every pixel would be absurd.
  useEffect(() => {
    const track = trackRef.current
    const bar = barRef.current
    const thumb = thumbRef.current
    if (!track || !bar || !thumb) return undefined

    const update = () => {
      const hidden = track.scrollWidth - track.clientWidth
      if (hidden <= 4) {
        bar.style.visibility = 'hidden'
        return
      }
      bar.style.visibility = 'visible'
      const shown = track.clientWidth / track.scrollWidth
      thumb.style.width = `${(shown * 100).toFixed(2)}%`
      // How far the thumb may travel, counted in its own widths
      const room = ((1 - shown) / shown) * 100
      thumb.style.transform = `translateX(${((track.scrollLeft / hidden) * room).toFixed(2)}%)`
    }

    update()
    track.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    // Cards arriving, or the column changing width, both change what fits
    const watcher = new ResizeObserver(update)
    watcher.observe(track)

    return () => {
      track.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
      watcher.disconnect()
    }
  }, [items.length])

  return (
    <div>
      <div
      ref={trackRef}
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

      {/* Not a control: it says the row goes further right, and scrolling is
          how you get there. */}
      <div ref={barRef} className="carousel-bar" aria-hidden="true">
        <div ref={thumbRef} className="carousel-bar-thumb" />
      </div>
    </div>
  )
}
