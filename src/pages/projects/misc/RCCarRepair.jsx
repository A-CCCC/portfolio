// src/pages/projects/misc/RCCarRepair.jsx
import pagePhotos, { stages } from '../../../data/pagePhotos'
import useFadeInOnScroll from '../../../hooks/useFadeInOnScroll'
import PageIntro from '../../../components/PageIntro'
import { PhotoGroup } from '../../../components/PhotoStory'
import BuildLog from '../../../components/BuildLog'
import asset from '../../../lib-asset'
import { describe } from '../../../data/site-copy'

// One line on what this is. The note below it clears itself once there are
// photos in the folder — see src/assets/photos/README.md.
const DESCRIPTION = describe('rc-car-repair')

// Every photo in public/photos/rc-car-repair/, in filename order. The folder is
// read at build time (see scripts/photo-manifest.mjs), so adding a photo is a
// matter of dropping the file in.
const PHOTOS = (pagePhotos['rc-car-repair'] ?? []).map(asset)
// And the work so far, a stage per subfolder — see public/photos/PAGE-PHOTOS.md.
const STAGES = stages['rc-car-repair'] ?? []
const EMPTY = PHOTOS.length === 0 && STAGES.length === 0

export default function RCCarRepair() {
  const [photosRef, photosOpacity] = useFadeInOnScroll(0)

  return (
    <div style={{ background: 'var(--bg)', color: 'var(--text)', fontFamily: 'system-ui' }}>
      <PageIntro
        title="RC Car Repair"
        description={DESCRIPTION}
        comingSoon={EMPTY}
        full={EMPTY}
      />

      <BuildLog stages={STAGES} heading="RC Car Repair" />

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
          <PhotoGroup photos={PHOTOS} heading="RC Car Repair" />
        </div>
      )}
    </div>
  )
}
