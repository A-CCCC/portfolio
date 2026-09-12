// src/components/ContextNote.jsx
//
// A short paragraph on its own before a section — why a project was made, or
// what surrounded it. On its own it is set centred and narrow, so it reads as an
// aside rather than as the section's own text. Given a `title` it gains a
// heading, and given an `image` it turns into a row with the picture on the left
// and the words beside it, since a centred column beside a picture reads as two
// things rather than one.
//
// Renders nothing when it has no text, so a page can carry the slot before the
// words exist.
import useFadeInOnScroll from '../hooks/useFadeInOnScroll'
import { BAND_PADDING, STATEMENT_HEIGHT } from './PhotoStory'
import { TYPE } from '../styles/type'

// The pictures sit in a row beside the words. Two reference shots are worth
// seeing at once — a stack that has to be turned through hides half of what it
// is showing, for something a reader only glances at.
//
// The row is laid out like the sections either side of it: two columns sharing
// the width inside a 64px margin, with the same 64px between them. So the block
// lines up with its neighbours rather than sitting narrow in the middle of them.
const GUTTER = 64
const WORDS_MAX = 560
// Every picture stands this tall. That only lines them up if each is trimmed to
// its subject — a picture with empty space under it sits high in its own frame
// and reads as smaller than one that fills it, however the frames are matched.
const PHOTO_MAX_HEIGHT = 350

export default function ContextNote({ title, images = [], alt = '', children }) {
  const [ref, opacity] = useFadeInOnScroll(0)

  if (!children) return null

  const picture = images.length ? (
    // Side by side on a laptop; one above the other on a phone, where two of
    // them share 375px and neither is worth looking at.
    <div className="split" style={{
      flex: '1 1 420px',
      display: 'flex',
      alignItems: 'center',
      // Spread across the column rather than huddled in the middle of it, so the
      // pictures reach as wide as the words beside them.
      justifyContent: 'space-evenly',
      gap: GUTTER,
    }}>
      {images.map((photo) => (
        <img
          key={photo}
          src={photo}
          alt={alt}
          loading="lazy"
          // Capped by height, so pictures of different shapes stand the same
          // height as each other instead of the tall one towering.
          // A height, not a ceiling: capped, each picture simply stays its own
          // size and two of different sizes never line up.
          style={{
            height: PHOTO_MAX_HEIGHT,
            width: 'auto',
            maxWidth: `${Math.floor(96 / images.length)}%`,
            // Keeps the shape when a narrow window makes that cap bite
            objectFit: 'contain',
            display: 'block',
          }}
        />
      ))}
    </div>
  ) : null

  const words = (
    <div style={picture ? { flex: '1 1 360px', maxWidth: WORDS_MAX } : { maxWidth: 720 }}>
      {title && (
        <h2 style={{
          fontSize: TYPE.sub,
          fontWeight: 300,
          letterSpacing: '-0.01em',
          margin: '0 0 20px',
          textAlign: picture ? 'left' : 'center',
        }}>
          {title}
        </h2>
      )}
      <p style={{
        margin: 0,
        fontSize: TYPE.body,
        lineHeight: 1.7,
        color: 'var(--text-body)',
        textAlign: picture ? 'left' : 'center',
        textWrap: 'pretty',
      }}>
        {children}
      </p>
    </div>
  )

  return (
    <div
      ref={ref}
      className="split"
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        // Wraps rather than squeezing: below about 900px the picture goes above
        // the words instead of beside them.
        flexWrap: 'wrap',
        gap: picture ? GUTTER : 0,
        // Given the room a section gets on the solutions pages, from the same
        // two numbers: a band of its own to sit in, rather than a paragraph
        // squeezed between the thing above it and the thing below.
        minHeight: STATEMENT_HEIGHT,
        padding: BAND_PADDING,
        background: 'var(--bg)',
        opacity,
        transition: 'opacity 1.5s ease',
      }}
    >
      {picture}
      {words}
    </div>
  )
}
