// src/pages/projects/halloween/Lightsaber.jsx
import pagePhotos, { stages } from '../../../data/pagePhotos'
import useFadeInOnScroll from '../../../hooks/useFadeInOnScroll'
import PageIntro from '../../../components/PageIntro'
import { PhotoGroup } from '../../../components/PhotoStory'
import BuildLog from '../../../components/BuildLog'
import asset from '../../../lib-asset'
import { describe } from '../../../data/site-copy'

// One line on what this is. The note below it clears itself once there are
// photos in the folder — see public/photos/lightsaber/README.md.
const DESCRIPTION = describe('lightsaber')

// Every photo in public/photos/lightsaber/, in filename order. The folder is
// read at build time (see scripts/photo-manifest.mjs), so adding a photo is a
// matter of dropping the file in.
const PHOTOS = (pagePhotos['lightsaber'] ?? []).map(asset)
// And the work so far, a stage per subfolder — see public/photos/PAGE-PHOTOS.md.
const STAGES = stages['lightsaber'] ?? []
const EMPTY = PHOTOS.length === 0 && STAGES.length === 0

export default function Lightsaber() {
  const [photosRef, photosOpacity] = useFadeInOnScroll(0)

  return (
    <div style={{ background: 'var(--bg)', color: 'var(--text)', fontFamily: 'system-ui' }}>
      <PageIntro
        title="Lightsaber"
        description={DESCRIPTION}
        comingSoon={EMPTY}
        full={EMPTY}
      />

      <BuildLog stages={STAGES} heading="Lightsaber" />

      {/* Renders nothing until there are photos in the folder, so the page reads
          as a stub rather than as a gallery with a hole in it. */}
      {PHOTOS.length > 0 && (
        <div
          ref={photosRef}
          style={{
            padding: '0 var(--gutter) 96px',
            maxWidth: 1100,
            margin: '0 auto',
            opacity: photosOpacity,
            transition: 'opacity 1.5s ease',
          }}
        >
          <PhotoGroup photos={PHOTOS} heading="Lightsaber" />
        </div>
      )}
    </div>
  )
}
