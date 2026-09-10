// src/pages/projects/Mortar.jsx
import { TYPE } from '../../styles/type'
import useFadeInOnScroll from '../../hooks/useFadeInOnScroll'
import useScrollFrames from '../../hooks/useScrollFrames'
import PageIntro from '../../components/PageIntro'
import BuildVideo from '../../components/BuildVideo'
import ContextNote from '../../components/ContextNote'
import ScrollHint from '../../components/ScrollHint'
import asset from '../../lib-asset'

const DESCRIPTION = 'A model combining extruded and mirrored geometry around an angled barrel.'

// The scroll-scrubbed animation is written but switched off: set this to the
// number of frames in public/mortar-anim/ and the section below appears. At zero
// the page skips it entirely rather than showing an empty band.
const FRAME_COUNT = 0

export default function Mortar() {
  const [sectionRef, , scrubProgress, frameSrc] = useScrollFrames(Math.max(FRAME_COUNT, 1), 1, 'mortar-anim')
  const [buildRef, buildOpacity] = useFadeInOnScroll(0)

  return (
    <div style={{ background: 'var(--bg)', color: 'var(--text)', fontFamily: 'system-ui' }}>

      <PageIntro title="Mortar" description={DESCRIPTION} />

      {/* ---- Scroll-scrubbed animation, once there are frames to scrub ---- */}
      {FRAME_COUNT > 0 && (
        <div ref={sectionRef} style={{ height: '400vh', position: 'relative' }}>
          <div style={{
            position: 'sticky',
            top: 0,
            height: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 64,
            padding: '0 64px',
            background: 'var(--bg)',
          }}>
            <div style={{
              flex: '1 1 0',
              minWidth: 320,
              alignSelf: 'stretch',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
            }}>
              <img
                src={frameSrc}
                /* Measured against the panel rather than the window: vh is the
                   window's height whether or not it is all on screen, so with
                   any browser chrome the frame stood taller than its room and
                   lost its top and bottom. */
                style={{ height: '86%', maxWidth: '100%', objectFit: 'contain' }}
                alt=""
              />
            </div>

            <ScrollHint id="mortar" progress={scrubProgress} />
          </div>
        </div>
      )}


{/* TODO: why this model was made, as on the Skeleton Barrel page. */}
      <ContextNote></ContextNote>

      {/* ---- Build video ---- */}
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 64,
        padding: '80px 64px',
        background: 'var(--bg)',
      }}>

        <div style={{ flex: '1 1 0', maxWidth: 480 }}>
          <h2
            ref={buildRef}
            style={{
              fontSize: TYPE.section,
              fontWeight: '300',
              marginBottom: 24,
              opacity: buildOpacity,
              transition: 'opacity 1.5s ease',
            }}
          >
            Building the Model
          </h2>
          {/* TODO: how this one was built, as on the Skeleton Barrel page. */}
        </div>

        <BuildVideo src={asset("/videos/mortar-build.mp4")} label="Mortar build" />
      </div>

    </div>
  )
}
