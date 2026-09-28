// src/components/BuildLog.jsx
//
// The work so far, in groups, for a project still being made. Each group is a
// subfolder of the page's photo folder — its number sets the order, its
// note.txt is the words if there are any, its photos the pictures — so
// documenting a build is a matter of dropping files in as it goes. No
// headings: the photos speak, and a note is there when there is something
// to say. See public/photos/PAGE-PHOTOS.md.
//
// Renders nothing without a stage to show, so a page can carry the slot before
// the work has begun.
import useFadeInOnScroll from '../hooks/useFadeInOnScroll'
import { PhotoGroup } from './PhotoStory'
import asset from '../lib-asset'
import { TYPE } from '../styles/type'

function Stage({ stage, index, heading }) {
  const [ref, opacity] = useFadeInOnScroll(0)
  const photos = stage.photos.map(asset)

  return (
    <section
      ref={ref}
      style={{
        maxWidth: 1100,
        margin: '0 auto',
        padding: '32px 0',
        borderTop: index === 0 ? 0 : '1px solid var(--border)',
        opacity,
        transition: 'opacity 1.5s ease',
      }}
    >
      {/* Words only where there is a note.txt: the photos are the point, and
          a group of them needs no title to be looked at. */}
      {stage.note && (
        <p style={{
          margin: '0 0 24px',
          maxWidth: 640,
          fontSize: TYPE.body,
          lineHeight: 1.7,
          color: 'var(--text-body)',
          textWrap: 'pretty',
          whiteSpace: 'pre-line',   // a blank line in note.txt is a paragraph break
        }}>
          {stage.note}
        </p>
      )}
      {photos.length > 0 && (
        /* The build photos are cut to 4:3 on the way in, so the cells are too */
        <PhotoGroup photos={photos} heading={heading} aspect="4 / 3" />
      )}
    </section>
  )
}

export default function BuildLog({ stages = [], heading }) {
  if (!stages.length) return null

  return (
    <div style={{ padding: '0 var(--gutter) 96px' }}>
      <p style={{
        maxWidth: 1100,
        margin: '0 auto 8px',
        fontSize: TYPE.caption,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        color: 'var(--text-muted)',
      }}>
        Work in progress
      </p>
      {stages.map((stage, i) => (
        <Stage key={stage.slug} stage={stage} index={i} heading={heading} />
      ))}
    </div>
  )
}
