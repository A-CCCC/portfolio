// src/components/PageIntro.jsx
//
// The opening of a project page: the title centred on a screen of its own with
// a line beneath it. Shared so a page that is still a stub looks like one that
// is finished — the same title, in the same place, with a note that there is
// more to come rather than a page that reads as broken.
import useFadeIn from '../hooks/useFadeIn'
import { isFullSite } from '../data/site-copy'
import { TYPE } from '../styles/type'

export default function PageIntro({
  title, description, comingSoon = false, full = true, notice = '(Coming Soon!)',
}) {
  // A page with nothing to say about itself says it is coming instead — which in
  // public is every project still being kept back. One that has a description
  // does not need the note as well.
  const pending = comingSoon || (!isFullSite && !description)
  const titleOpacity = useFadeIn(100)
  // Second, so the line under the title arrives after it rather than with it.
  const introOpacity = useFadeIn(600)

  return (
    <div style={{
      // A stub fills the screen; a page with content below it takes only the
      // room it needs, so the next section is not pushed out of sight.
      height: full ? '100vh' : 'auto',
      padding: full ? '0 24px' : '120px 24px 40px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
    }}>
      <h1 style={{
        fontSize: TYPE.pageTitle,
        fontWeight: 'bold',
        letterSpacing: '0.01em',
        color: 'var(--text)',
        marginBottom: 24,
        opacity: titleOpacity,
        transition: 'opacity 1.5s ease',
      }}>
        {title}
      </h1>

      {(description || pending) && (
        <p className="page-intro-line" style={{
          fontSize: TYPE.lead,
          lineHeight: 1.7,
          color: 'var(--text-body)',
          opacity: introOpacity,
          transition: 'opacity 1.5s ease',
        }}>
          {description}
          {pending && (
            <>
              {description ? ' ' : ''}
              {/* Quieter than the description, so it reads as a note about the
                  page rather than as part of what the project is.

                  What it says depends on why there is nothing here. A project
                  that has not been built yet is coming; a page that is finished
                  but kept off this version of the site is not available *here*,
                  which says it is this site that lacks it rather than the work
                  being unfinished. */}
              <span style={{ color: 'var(--text-muted)' }}>{notice}</span>
            </>
          )}
        </p>
      )}
    </div>
  )
}
