// src/components/Carousel.jsx
import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { TYPE } from '../styles/type'
import useIsPhone, { useIsShort } from '../hooks/useIsPhone'

// Card tints cycle through these, so each item in a carousel reads distinctly.
const TINTS = ['var(--card-1)', 'var(--card-2)', 'var(--card-3)', 'var(--card-4)', 'var(--card-5)', 'var(--card-6)']

// Breathing room at both ends of the track. Carried as margins on the first and
// last cards rather than as container padding: padding-right on a horizontally
// scrolling flex container is dropped by some engines (notably WebKit), which
// makes the end gap collapse to 0 while the start gap keeps its full width.
// Item margins are always counted in scrollWidth, so the two ends stay equal.
const EDGE = 32

export default function Carousel({ items }) {
  const phone = useIsPhone()
  const short = useIsShort()
  const trackRef = useRef(null)
  const barRef = useRef(null)
  const railRef = useRef(null)
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
      const through = track.scrollLeft / hidden
      thumb.style.transform = `translateX(${(through * room).toFixed(2)}%)`
      bar.setAttribute('aria-valuenow', String(Math.round(through * 100)))
    }

    // Dragging it moves the row. The whole rail answers, not just the thumb:
    // a three-pixel target is a poor thing to ask anyone to hit, so a press
    // anywhere along it jumps there and carries on from wherever it is taken.
    const rail = railRef.current
    const scrollTo = (clientX) => {
      const box = rail.getBoundingClientRect()
      const thumbWidth = thumb.getBoundingClientRect().width
      const travel = box.width - thumbWidth
      if (travel <= 0) return
      const at = (clientX - box.left - thumbWidth / 2) / travel
      track.scrollLeft = Math.max(0, Math.min(1, at)) * (track.scrollWidth - track.clientWidth)
      // Drawn from here rather than waiting for the row's own scroll event: the
      // thumb should be under the finger that is dragging it, not a moment
      // behind wherever the row reports itself to be.
      update()
    }

    let dragging = false
    const onDown = (e) => {
      if (bar.style.visibility === 'hidden') return
      dragging = true
      bar.classList.add('is-dragging')
      // The row snaps to whichever card is nearest, which is right when someone
      // flicks it and wrong under a finger: every pixel of a drag gets tugged
      // toward a card edge and the whole thing moves in steps. Off while
      // dragging, so it follows exactly, and back on when let go so it still
      // settles on a card.
      track.style.scrollSnapType = 'none'
      try { bar.setPointerCapture(e.pointerId) } catch { /* synthetic pointers have none */ }
      scrollTo(e.clientX)
      e.preventDefault()
    }
    const onMove = (e) => { if (dragging) scrollTo(e.clientX) }
    const onUp = () => {
      if (!dragging) return
      dragging = false
      bar.classList.remove('is-dragging')
      track.style.scrollSnapType = 'x proximity'
    }

    bar.addEventListener('pointerdown', onDown)
    bar.addEventListener('pointermove', onMove)
    bar.addEventListener('pointerup', onUp)
    bar.addEventListener('pointercancel', onUp)

    // And by keyboard, since it is a control now
    const onKey = (e) => {
      const step = track.clientWidth * 0.6
      if (e.key === 'ArrowRight') track.scrollLeft += step
      else if (e.key === 'ArrowLeft') track.scrollLeft -= step
      else if (e.key === 'Home') track.scrollLeft = 0
      else if (e.key === 'End') track.scrollLeft = track.scrollWidth
      else return
      update()
      e.preventDefault()
    }
    bar.addEventListener('keydown', onKey)

    update()
    track.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    // Cards arriving, or the column changing width, both change what fits
    const watcher = new ResizeObserver(update)
    watcher.observe(track)

    return () => {
      track.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
      bar.removeEventListener('pointerdown', onDown)
      bar.removeEventListener('pointermove', onMove)
      bar.removeEventListener('pointerup', onUp)
      bar.removeEventListener('pointercancel', onUp)
      bar.removeEventListener('keydown', onKey)
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
            // A card narrower than the screen on a phone, so the edge of the
            // next one shows and the row reads as something to swipe.
            width: phone ? 'min(78vw, 340px)' : 340,
            // Held sideways, a 460px card is taller than the screen it is on.
            height: short ? 'min(460px, 74vh)' : 460,
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
          <div style={{
          padding: phone ? '26px 22px 0' : '36px 32px 0',
          // A card is most of the screen wide on a phone; its name sits over the
          // middle of the picture below it rather than off to one side.
          textAlign: phone ? 'center' : 'left',
        }}>
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

      {/* Shows how far the row runs, and moves it when dragged. The padded
          outer box is the part that answers to a pointer; the thin rail inside
          is what can be seen. */}
      <div
        ref={barRef}
        className="carousel-bar"
        role="scrollbar"
        aria-orientation="horizontal"
        aria-label="Scroll the projects"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={0}
        tabIndex={0}
      >
        <div ref={railRef} className="carousel-bar-rail">
          <div ref={thumbRef} className="carousel-bar-thumb" />
        </div>
      </div>
    </div>
  )
}
