// src/components/PhotoStory.jsx
//
// The photo-and-text bands that make up a project write-up: a heading with a
// paragraph beside its photos, alternating sides down the page. Extracted from
// the Wheelchair Storage page so other project pages tell their story the same
// way rather than each growing its own copy of a carousel.
import { useState } from 'react'
import useFadeInOnScroll from '../hooks/useFadeInOnScroll'
import Reveal from './Reveal'
import { TYPE } from '../styles/type'

// The photos for one section. Kept as its own component so it can be swapped for
// a carousel later without touching the surrounding layout.
export function PhotoGroup({ photos, heading }) {
  return (
    <div style={{
      display: 'grid',
      // Column count chosen so no row is left ragged: four photos sit as a 2x2,
      // three as a single row, and anything larger runs three across.
      gridTemplateColumns: `repeat(${
        photos.length === 1 ? 1 : photos.length === 2 ? 2 : photos.length === 4 ? 2 : 3
      }, 1fr)`,
      gap: 16,
    }}>
      {photos.map((file, i) => (
        <img
          key={file}
          src={file}
          alt={`${heading} — ${i + 1} of ${photos.length}`}
          loading="lazy"
          style={{
            width: '100%',
            // Square cells keep the grid even, and `contain` shows each photo
            // whole — `cover` would fill the cell but crop the overflow, which
            // clipped the edges off these shots. A square suits the mix: a
            // landscape photo fills the width, a portrait one fills the height.
            aspectRatio: '1 / 1',
            objectFit: 'contain',
            display: 'block',
            // No background: with `contain` the leftover space would otherwise
            // show as visible bands around every photo.
          }}
        />
      ))}
    </div>
  )
}

// How tall each band is. A full viewport per section left
// so much air around the content that a section looked like the end of the page
// — the next heading sat entirely below the fold with nothing to suggest it was
// there. These are minimums: a section grows if its content needs the room.
const BAND_HEIGHT = '76vh'          // a row of text beside photos
const STATEMENT_HEIGHT = BAND_HEIGHT     // centred text on its own
const TITLE_HEIGHT = '32vh'         // a heading introducing the sections under it
const BAND_PADDING = '56px 64px'

// A rotating stack: the active photo sits front and centre, its neighbours
// scaled down, angled and tucked behind it. Clicking a neighbour — or an arrow —
// rotates it to the front. Every slide keeps its own aspect ratio, so nothing is
// cropped to fit; a portrait shot is simply narrower than a landscape one.
const STACK_HEIGHT = 400
// How far each neighbour sits from the centre. Applied as a translate rather
// than through `left`: only transform and opacity animate, so positioning a
// slide with `left` (or swapping its transform-origin) makes it jump between
// states instead of gliding across.
const STACK_SPREAD = 90
const STACK_TILT = 28      // deg of rotateY on the neighbours
// Neighbours also sit higher than the active photo, and that lift — not the
// sideways offset — is what keeps them visible: a wide landscape photo in front
// is broad enough to cover a portrait neighbour completely, and the aspect
// ratios here are mixed. With the lift doing that job the sideways offset can
// stay small, which keeps the whole stack inside its column instead of reaching
// across into the text beside it.
const STACK_LIFT = 90
const STACK_BACK_SCALE = 0.78   // how far the neighbours shrink behind the front one

export function PhotoCarousel({ photos, heading }) {

  // `turn` counts the steps taken rather than naming the front photo, and it is
  // deliberately not wrapped back into range. The ring has to keep rotating the
  // way the arrow points; a front-photo index would run out at the end of the
  // set and spring back the other way.
  const [turn, setTurn] = useState(0)
  const count = photos.length
  const SPIN = 360 / count               // degrees between neighbouring photos
  // How deep a slide sits when it is one step out. Everything else is measured
  // against it, so the neighbours keep exactly the look they had before and only
  // the photos behind them recede further.
  const NEIGHBOUR_DEPTH = (1 - Math.cos((SPIN * Math.PI) / 180)) / 2

  const step = (d) => setTurn((t) => t + d)

  // Steps from the front, the short way round: clicking a neighbour turns the
  // ring one step rather than unwinding it the long way back.
  const offsetOf = (i) => {
    const raw = (((i - turn) % count) + count) % count
    return raw > count / 2 ? raw - count : raw
  }

  return (
    <div style={{ position: 'relative' }}>
      <div style={{
        position: 'relative',
        height: STACK_HEIGHT,
        // Perspective is what turns the rotateY below into a rotation rather
        // than a flat horizontal squash.
        perspective: 1200,
      }}>
        {photos.map((file, i) => {
          const offset = offsetOf(i)
          const isActive = offset === 0
          const behind = Math.abs(offset) > 1

          // Position comes from the angle around the ring, not from a slot. Slot
          // positions are why photos used to slide sideways across the stack:
          // with only a left, a front and a right to hand out, a photo leaving on
          // the left had to be reassigned to the right, and the trip between them
          // ran straight across the middle. On a ring it simply keeps going the
          // way it was already travelling — around the back and out of sight.
          //
          // The angle is counted in whole steps taken and never wrapped, so the
          // ring turns the same way however many times it is nudged. Every value
          // below is a sine or cosine of it, and those repeat on their own, so
          // nothing has to be reset when the count comes round again.
          const angle = ((i - turn) * SPIN * Math.PI) / 180
          const depth = (1 - Math.cos(angle)) / 2        // 0 at the front, 1 at the back
          const recess = depth / NEIGHBOUR_DEPTH         // 1 for a neighbour, more behind it

          return (
            <img
              key={file}
              src={file}
              alt={`${heading} — ${i + 1} of ${count}`}
              loading="lazy"
              onClick={() => step(offset)}
              style={{
                position: 'absolute',
                top: 0,
                left: '50%',
                height: '100%',
                width: 'auto',
                // Never wider than the column: a 3:2 photo at this height is
                // 600px, which overflows once the window narrows.
                maxWidth: '100%',
                objectFit: 'contain',
                borderRadius: 16,
                display: 'block',
                cursor: isActive ? 'default' : 'pointer',
                // Sideways travel follows the ring, so a photo at the very back
                // sits centred behind the front one rather than out at the edge,
                // and the tilt follows it round in the same way. Both are sines
                // of the angle, which keeps a neighbour at the same offset and
                // angle it had before.
                transform: `translate(calc(-50% + ${(STACK_SPREAD * Math.sin(angle)).toFixed(1)}px),`
                  + ` ${-(STACK_LIFT * Math.min(recess, 1.5)).toFixed(1)}px)`
                  + ` scale(${Math.max(0.3, 1 - (1 - STACK_BACK_SCALE) * recess).toFixed(3)})`
                  + ` rotateY(${(-STACK_TILT * Math.sin(angle)).toFixed(1)}deg)`,
                // Stacking follows depth, so a photo passing behind the front one
                // stays behind it the whole way round.
                zIndex: Math.round(100 * (1 - depth)),
                // Only the front photo and its two neighbours are on show;
                // anything further round the ring has already faded out.
                opacity: behind ? 0 : isActive ? 1 : 0.55,
                pointerEvents: behind ? 'none' : 'auto',
                boxShadow: isActive ? 'var(--card-shadow)' : 'none',
                transition: 'transform 0.55s cubic-bezier(0.22, 1, 0.36, 1),'
                  + ' opacity 0.55s ease, box-shadow 0.55s ease',
              }}
            />
          )
        })}
      </div>

      {/* Arrows: the only keyboard-reachable way to rotate the stack. Hung below
          the stack rather than stacked under it, so the column measures the
          height of the photos alone — counted in, they push the column's centre
          down and the text beside it no longer lines up with the picture. */}
      <div style={{
        position: 'absolute',
        top: '100%',
        left: 0,
        right: 0,
        display: 'flex',
        justifyContent: 'center',
        gap: 12,
        marginTop: 20,
      }}>
        {[['Previous photo', -1], ['Next photo', 1]].map(([label, dir]) => (
          <button
            key={label}
            onClick={() => step(dir)}
            aria-label={label}
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              border: '1px solid var(--border)',
              background: 'transparent',
              color: 'var(--text)',
              cursor: 'pointer',
              // Flex-centre an SVG rather than a text glyph: characters like
              // ‹ and › carry their own font metrics and sit off-centre in a
              // circle no matter what line-height they are given.
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 0,
            }}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
              style={{ display: 'block' }}
            >
              <polyline points={dir === -1 ? '15 5 8 12 15 19' : '9 5 16 12 9 19'} />
            </svg>
          </button>
        ))}
      </div>
    </div>
  )
}

// A body is either a single paragraph or several. Sections that run to more
// than one are set as separate <p>s rather than one block with line breaks, so
// they keep their spacing and read as paragraphs.
// Each paragraph fades on its own. A column of them is taller than the window,
// so faded together the ones at the bottom are long finished by the time they
// are reached and only the first is ever seen arriving.
function Paragraphs({ body, style }) {
  const paragraphs = Array.isArray(body) ? body : [body]
  return paragraphs.map((text, i) => (
    <Reveal key={i} style={{ marginBottom: i < paragraphs.length - 1 ? '1.1em' : 0 }}>
      <p
        style={{
          ...style,
          margin: 0,
          // Pulls a word back from a line of its own at the end of a paragraph.
          // Browsers without it simply wrap as before.
          textWrap: 'pretty',
        }}
      >
        {text}
      </p>
    </Reveal>
  ))
}

// Nothing here fades as a whole any more: a band is taller than the window, so
// one fade for all of it finishes before its lower half is reached. The heading,
// each paragraph and the pictures each wait for their own moment instead.
export default function PhotoSection({ heading, body, photos, flip, layout, sub, centred }) {

  // A section with no photos sets its heading against its text rather than
  // stacking both down the middle. Two of these in a row — which is how a page
  // opens — read as one undifferentiated column when centred, and a page with
  // several is flattest exactly where it should be drawing someone in. Set
  // across two columns they keep the same left-right rhythm as the bands with
  // photos, so the page has one structure throughout instead of two.
  if (!photos.length) {
    // A heading with no body is a title for what follows, so it takes a shorter
    // band, stays centred, and sits close to the next section.
    if (!body) {
      return (
        <div
          style={{
            minHeight: TITLE_HEIGHT,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            padding: BAND_PADDING,
            background: 'var(--bg)',
          }}
        >
          <Reveal>
            <h2 style={{ fontSize: sub ? TYPE.sub : TYPE.section, fontWeight: '300', maxWidth: 900 }}>
              {heading}
            </h2>
          </Reveal>
        </div>
      )
    }

    // A section marked `centred` keeps the older treatment: heading over text,
    // both down the middle. It suits a short, declarative section — a statement
    // of the problem — where two columns read as reference material.
    if (centred) {
      return (
        <div
          style={{
            minHeight: STATEMENT_HEIGHT,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            padding: BAND_PADDING,
            background: 'var(--bg)',
          }}
        >
          <Reveal style={{ marginBottom: sub ? 24 : 32 }}>
            <h2 style={{
              fontSize: sub ? TYPE.sub : TYPE.section,
              fontWeight: '300',
              margin: 0,
              maxWidth: 900,
            }}>
              {heading}
            </h2>
          </Reveal>
          <div style={{ maxWidth: 720 }}>
            <Paragraphs
              body={body}
              style={{ fontSize: TYPE.body, lineHeight: 1.7, color: 'var(--text-body)' }}
            />
          </div>
        </div>
      )
    }

    return (
      <div
        style={{
          minHeight: STATEMENT_HEIGHT,
          display: 'flex',
          flexWrap: 'wrap',
          // Centred in the band like every other section, so the room left over
          // falls evenly above and below rather than all of it below.
          alignItems: 'center',
          justifyContent: 'center',
          gap: 64,
          padding: BAND_PADDING,
          background: 'var(--bg)',
        }}
      >
        {/* The heading holds the left column on its own, the way a chapter
            opening does, so the eye has somewhere to land before the prose. */}
        <Reveal style={{ flex: '0 1 360px', maxWidth: 360 }}>
          <h2 style={{
            fontSize: sub ? TYPE.sub : TYPE.section,
            fontWeight: '300',
            lineHeight: 1.1,
            margin: 0,
          }}>
            {heading}
          </h2>
        </Reveal>

        <div style={{ flex: '1 1 420px', maxWidth: 620 }}>
          <Paragraphs
            body={body}
            style={{ fontSize: TYPE.body, lineHeight: 1.7, color: 'var(--text-body)' }}
          />
        </div>
      </div>
    )
  }

  return (
    <div
      style={{
        minHeight: BAND_HEIGHT,
        display: 'flex',
        flexDirection: flip ? 'row-reverse' : 'row',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 64,
        padding: BAND_PADDING,
        background: 'var(--bg)',
      }}
    >
      <div style={{ flex: '1 1 360px', maxWidth: 480 }}>
        <Reveal style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: sub ? TYPE.sub : TYPE.section, fontWeight: '300', margin: 0 }}>
            {heading}
          </h2>
        </Reveal>
        {body && (
          <Paragraphs
            body={body}
            style={{ fontSize: TYPE.body, lineHeight: 1.7, color: 'var(--text-body)' }}
          />
        )}
      </div>

      <Reveal style={{ flex: '1 1 420px', maxWidth: 620 }} rise={photos.length === 1 ? 48 : 0}>
        {photos.length === 1
          // A carousel of one is just a picture: no stack behind it, nothing to
          // rotate, and arrows that would do nothing.
          ? (
            <img
              src={photos[0]}
              alt={heading}
              loading="lazy"
              style={{ width: '100%', height: 'auto', borderRadius: 16, display: 'block' }}
            />
          )
          : layout === 'carousel'
            ? <PhotoCarousel photos={photos} heading={heading} />
            : <PhotoGroup photos={photos} heading={heading} />}
      </Reveal>
    </div>
  )
}

// A heading for a section that is laid out by hand below it. The heading-only
// band from PhotoSection centres itself in a tall band, which leaves a gap under
// the words; this one sits close to whatever follows.
export function SectionTitle({ children, tight }) {
  const [ref, opacity] = useFadeInOnScroll(0)

  return (
    <div
      ref={ref}
      style={{
        // Generous above, tight below: the room goes outside the heading-and-image
        // pair rather than between them, so scrolling can rest on the two alone
        // with the sections either side out of frame. Scales with the window,
        // since how much clear space that takes depends on its height.
        // `tight` is for a heading with an image directly under it, which should
        // read as one unit. Otherwise the sub-sections below need room to
        // breathe, or the first one crowds the heading it belongs to.
        padding: `min(30vh, 300px) 64px ${tight ? '28px' : '56px'}`,
        textAlign: 'center',
        background: 'var(--bg)',
        opacity,
        transition: 'opacity 1.5s ease',
      }}
    >
      <h2 style={{ fontSize: TYPE.umbrella, fontWeight: '300' }}>{children}</h2>
    </div>
  )
}

// One image standing on its own, full width, fading in as it is reached — for
// showing the thing itself after the text that describes it, rather than as one
// of a set beside a paragraph.
export function FeatureImage({ src, alt }) {
  const [ref, opacity] = useFadeInOnScroll(0)
  // Rises as it fades: the same trigger drives both, so the two stay in step.
  const RISE = 48

  return (
    <div
      ref={ref}
      style={{
        display: 'flex',
        justifyContent: 'center',
        // Matches the room above the heading, for the same reason.
        padding: '0 64px min(26vh, 270px)',
        background: 'var(--bg)',
        opacity,
        transition: 'opacity 1.5s ease',
      }}
    >
      <img
        src={src}
        alt={alt}
        loading="lazy"
        style={{
          width: '100%',
          maxWidth: 900,
          height: 'auto',
          borderRadius: 16,
          display: 'block',
          transform: `translateY(${(1 - opacity) * RISE}px)`,
          transition: 'transform 1.5s cubic-bezier(0.22, 1, 0.36, 1)',
        }}
      />
    </div>
  )
}


// One paragraph with a single photo beside it, sides alternating down the page.
// Used where a section is a sequence of points rather than one block of text: the
// paragraph explains a part, the photo shows it. With no photo yet, the paragraph
// simply sits centred, so the section reads properly before its photos arrive.
export function SplitRow({ heading, body, photo, alt, flip }) {
  const [ref, opacity] = useFadeInOnScroll(0)
  const RISE = 48   // matches the feature image, so the page moves one way

  const text = (
    <>
      {/* Matched to the sub-section headings elsewhere, so a page reads the same
          however its sections happen to be built. */}
      {heading && (
        <h2 style={{ fontSize: TYPE.sub, fontWeight: '300', marginBottom: 24 }}>{heading}</h2>
      )}
      <Paragraphs
        body={body}
        style={{ fontSize: TYPE.body, lineHeight: 1.7, color: 'var(--text-body)' }}
      />
    </>
  )

  // The band metrics below are PhotoSection's, so a run of these reads with the
  // same rhythm as a run of sub-sections built the other way — the two were
  // visibly different heights before.
  if (!photo) {
    return (
      <div
        ref={ref}
        style={{
          minHeight: STATEMENT_HEIGHT,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: BAND_PADDING,
          opacity,
          transition: 'opacity 1.5s ease',
        }}
      >
        <div style={{ maxWidth: 720 }}>{text}</div>
      </div>
    )
  }

  return (
    <div
      ref={ref}
      style={{
        minHeight: BAND_HEIGHT,
        display: 'flex',
        flexDirection: flip ? 'row-reverse' : 'row',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 64,
        padding: BAND_PADDING,
        opacity,
        transition: 'opacity 1.5s ease',
      }}
    >
      <div style={{ flex: '1 1 360px', maxWidth: 480 }}>{text}</div>
      <div style={{ flex: '1 1 420px', maxWidth: 620 }}>
        <img
          src={photo}
          alt={alt}
          loading="lazy"
          style={{
            width: '100%',
            height: 'auto',
            borderRadius: 16,
            display: 'block',
            transform: `translateY(${(1 - opacity) * RISE}px)`,
            transition: 'transform 1.5s cubic-bezier(0.22, 1, 0.36, 1)',
          }}
        />
      </div>
    </div>
  )
}
