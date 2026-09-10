// src/components/CategoryBand.jsx
//
// One category on a hub page: a cover image, the category's name, a line on what
// it covers, and how many things are inside. Deliberately shows no individual
// projects — the hub answers "what kinds of things are here", and the category
// page it leads to answers "which one do I open". Listing the projects in both
// places made the two pages near-identical and left the category pages with
// nothing to do.
import { Link } from 'react-router-dom'
import { TYPE } from '../styles/type'
import useFadeInOnScroll from '../hooks/useFadeInOnScroll'

export default function CategoryBand({
  label, path, blurb, cover, count, noun, flip, alt, secret, secretBox,
}) {
  const [ref, opacity] = useFadeInOnScroll(0)

  const image = (
    <img
      src={cover}
      alt={label}
      loading="lazy"
      style={{ width: '100%', height: 'auto', display: 'block' }}
    />
  )

  return (
    <section
      // Painted the inverse of the page, which the navbar watches for so it can
      // turn over as it crosses one.
      data-inverted={alt ? '' : undefined}
      style={{
        // A little taller than the screen. At exactly 100vh the panel only fills
        // the window from one precise scroll position; the extra gives about
        // 40px of positions that all still cover it, which is the difference
        // between landing it and fighting for it.
        minHeight: 'calc(100vh + 40px)',
        display: 'flex',
        flexDirection: flip ? 'row-reverse' : 'row',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 72,
        padding: '72px 64px',
        // Every other band is the inverse of the page — black on a white page,
        // white on a dark one — so the categories read as separate panels
        // rather than one long scroll.
        background: alt ? 'var(--band-bg)' : 'var(--bg)',
        color: alt ? 'var(--band-ink)' : 'var(--text)',
      }}
    >
      {/* What is watched is this column, not the panel around it. The panel is
          a screenful tall, so its top edge crosses the line the moment it starts
          to appear — the words and the picture would fade while the band was
          still a sliver at the bottom of the window, and be done before it had
          arrived. Its contents sit at the middle of it, and reach that line when
          the band is most of the way on screen. */}
      <div ref={ref} style={{
        flex: '1 1 340px',
        maxWidth: 460,
        opacity,
        transition: 'opacity 1.5s ease',
      }}>
        <Link to={path} className="hub-link" style={{ color: 'inherit' }}>
          <h2 style={{
            fontSize: TYPE.hubCategory,
            fontWeight: 300,
            letterSpacing: '-0.02em',
            margin: 0,
          }}>
            {label}
          </h2>
        </Link>

        <p style={{
          margin: '20px 0 28px',
          fontSize: TYPE.body,
          lineHeight: 1.7,
          color: alt ? 'var(--band-body)' : 'var(--text-body)',
        }}>
          {blurb}
        </p>

        {/* The count is the way in: it says how much is behind the link, which a
            bare "view more" does not. */}
        <Link
          to={path}
          className="count-link"
          style={{
            color: 'inherit',
            textDecoration: 'none',
            fontSize: TYPE.small,
            // The hover tint has to suit whichever colour this band is painted.
            '--count-hover': alt ? 'var(--band-hover)' : 'var(--hover)',
          }}
        >
          {count} {count === 1 ? noun : `${noun}s`}
          <span className="count-arrow" aria-hidden="true">→</span>
        </Link>
      </div>

      <div style={{
        flex: '1 1 380px',
        maxWidth: 560,
        opacity,
        transition: 'opacity 1.5s ease',
      }}>
        {/* Ordinarily not a link: the name and the count are the ways in, and a
            picture that navigates on click without looking like a control is a
            trap. A band given a `secret` is the exception, and there the target
            is the model itself rather than the whole frame — a render is mostly
            empty space, and a hit area covering that would catch clicks aimed at
            nothing. `secretBox` is where the model sits inside its own image, as
            percentages, so the two stay together at any size. */}
        {/* The rise as it fades sits on the wrapper rather than the image, so
            anything positioned over the image travels with it. On the image
            itself, a hit area pinned to the wrapper would sit up to 48px adrift
            for the length of the fade. */}
        <div style={{
          position: 'relative',
          transform: `translateY(${(1 - opacity) * 48}px)`,
          transition: 'transform 1.5s cubic-bezier(0.22, 1, 0.36, 1)',
        }}>
          {image}
          {secret && (
            <Link
              to={secret}
              aria-label={`${label} — hidden`}
              style={{
                position: 'absolute',
                left: `${secretBox[0]}%`,
                top: `${secretBox[1]}%`,
                width: `${secretBox[2]}%`,
                height: `${secretBox[3]}%`,
                cursor: 'pointer',
              }}
            />
          )}
        </div>
      </div>
    </section>
  )
}
