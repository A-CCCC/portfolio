// src/components/Resume.jsx
//
// Lays out a résumé. The words are not here — they live in the copy kept off
// the repository, and this draws whatever it is handed, so the public build has
// the layout and nothing to put in it.
//
// Set the way a résumé is set: a name, a line of ways to reach the person, then
// sections of either entries (a place, a role, dates, and what was done) or
// plain lists (awards, skills). Where a heading and a date share a line, they
// sit at either end of it and wrap onto separate lines when there is no room —
// which on a phone is always.
import { TYPE } from '../styles/type'

const RULE = { borderBottom: '1px solid var(--border)', paddingBottom: 6, marginBottom: 14 }

function Entry({ entry }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        gap: '2px 16px',
      }}>
        <span style={{ fontWeight: 600, fontSize: TYPE.body }}>{entry.heading}</span>
        {entry.place && (
          <span style={{ color: 'var(--text-muted)', fontSize: TYPE.small }}>{entry.place}</span>
        )}
      </div>

      {(entry.role || entry.when) && (
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          gap: '2px 16px',
          marginTop: 2,
        }}>
          <span style={{ color: 'var(--text-body)', fontSize: TYPE.small }}>{entry.role}</span>
          {entry.when && (
            <span style={{ color: 'var(--text-muted)', fontSize: TYPE.small }}>{entry.when}</span>
          )}
        </div>
      )}

      {entry.note && (
        <p style={{ margin: '6px 0 0', color: 'var(--text-body)', fontSize: TYPE.small, lineHeight: 1.6 }}>
          {entry.note}
        </p>
      )}

      {entry.points?.length > 0 && (
        <ul style={{
          margin: '8px 0 0',
          paddingLeft: 20,
          color: 'var(--text-body)',
          fontSize: TYPE.small,
          lineHeight: 1.65,
        }}>
          {entry.points.map((point) => <li key={point} style={{ marginBottom: 3 }}>{point}</li>)}
        </ul>
      )}
    </div>
  )
}

export default function Resume({ resume }) {
  if (!resume) return null

  return (
    // Left-aligned inside a page that centres everything else: a résumé read
    // down a centred column is a poster, not a document.
    <div style={{ textAlign: 'left', maxWidth: 760, width: '100%', margin: '0 auto' }}>

      <h2 style={{
        fontSize: TYPE.sub,
        fontWeight: 600,
        letterSpacing: '0.02em',
        margin: '0 0 6px',
      }}>
        {resume.name}
      </h2>

      {resume.links?.length > 0 && (
        <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: TYPE.small }}>
          {resume.links.join('  |  ')}
        </p>
      )}

      {resume.summary && (
        <p style={{
          margin: '10px 0 0',
          color: 'var(--text-body)',
          fontSize: TYPE.body,
          lineHeight: 1.6,
        }}>
          {resume.summary}
        </p>
      )}

      {resume.sections?.map((section) => (
        <section key={section.title} style={{ marginTop: 32 }}>
          <h3 style={{
            fontSize: TYPE.small,
            fontWeight: 600,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'var(--text-muted)',
            margin: 0,
            ...RULE,
          }}>
            {section.title}
          </h3>

          {section.entries?.map((entry) => <Entry key={entry.heading} entry={entry} />)}

          {section.list?.length > 0 && (
            <ul style={{
              margin: 0,
              paddingLeft: 20,
              color: 'var(--text-body)',
              fontSize: TYPE.small,
              lineHeight: 1.7,
            }}>
              {section.list.map((line) => <li key={line} style={{ marginBottom: 2 }}>{line}</li>)}
            </ul>
          )}
        </section>
      ))}
    </div>
  )
}
