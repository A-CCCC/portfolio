// src/components/BuildLog.jsx
//
// The work so far, stage by stage, for a project still being made. Each stage
// is a subfolder of the page's photo folder — its name is the heading, its
// note.txt the words, its photos the pictures — so documenting a build is a
// matter of dropping files in as it goes. See public/photos/PAGE-PHOTOS.md.
//
// Renders nothing without a stage to show, so a page can carry the slot before
// the work has begun.
import useFadeInOnScroll from '../hooks/useFadeInOnScroll'
import { PhotoGroup } from './PhotoStory'
import asset from '../lib-asset'
import { TYPE } from '../styles/type'

function Stage({ stage, index, count, heading }) {
  const [ref, opacity] = useFadeInOnScroll(0)
  const photos = stage.photos.map(asset)

  return (
    <section
      ref={ref}
      style={{
        maxWidth: 1100,
        margin: '0 auto',
        padding: '40px 0',
        borderTop: index === 0 ? 0 : '1px solid var(--border)',
        opacity,
        transition: 'opacity 1.5s ease',
      }}
    >
      <p style={{
        margin: 0,
        fontSize: TYPE.caption,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        color: 'var(--text-muted)',
      }}>
        Stage {index + 1} of {count}
      </p>
      <h2 style={{
        fontSize: TYPE.sub,
        fontWeight: 300,
        letterSpacing: '-0.01em',
        margin: '6px 0 0',
      }}>
        {stage.title}
      </h2>
      {stage.note && (
        <p style={{
          margin: '14px 0 0',
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
        <div style={{ marginTop: 24 }}>
          <PhotoGroup photos={photos} heading={`${heading} — ${stage.title}`} />
        </div>
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
        <Stage key={stage.slug} stage={stage} index={i} count={stages.length} heading={heading} />
      ))}
    </div>
  )
}
