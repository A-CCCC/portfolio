// src/pages/projects/Mortar.jsx
import { TYPE } from '../../styles/type'
import useFadeInOnScroll from '../../hooks/useFadeInOnScroll'
import useScrollFrames from '../../hooks/useScrollFrames'
import PageIntro from '../../components/PageIntro'
import BuildVideo from '../../components/BuildVideo'
import ContextNote from '../../components/ContextNote'
import ModelStage from '../../components/ModelStage'
import ScrollHint from '../../components/ScrollHint'
import asset from '../../lib-asset'
import { modelFor } from '../../data/models'
import ScrubFrames from '../../components/ScrubFrames'
import { describe } from '../../data/site-copy'

const DESCRIPTION = describe('mortar')

// The scroll-scrubbed animation is written but switched off: set this to the
// number of frames in public/mortar-anim/ and the section below appears. At zero
// the page skips it entirely rather than showing an empty band.
const FRAME_COUNT = 0

export default function Mortar() {
  const [sectionRef, frameRef, scrubProgress] = useScrollFrames(Math.max(FRAME_COUNT, 1), 1)
  const [buildRef, buildOpacity] = useFadeInOnScroll(0)

  return (
    <div style={{ background: 'var(--bg)', color: 'var(--text)', fontFamily: 'system-ui' }}>

      <PageIntro title="Mortar" description={DESCRIPTION} />

      {/* ---- Scroll-scrubbed animation, once there are frames to scrub ---- */}
      {FRAME_COUNT > 0 && (
        <div ref={sectionRef} style={{ height: '400vh', position: 'relative' }}>
          <div className="split" style={{
            position: 'sticky',
            top: 0,
            height: 'var(--screen)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 64,
            padding: '0 var(--gutter)',
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
              <ScrubFrames
                folder="mortar-anim"
                count={Math.max(FRAME_COUNT, 1)}
                start={1}
                frameRef={frameRef}
                label="Mortar model, assembling"
                style={{ height: '86%', maxWidth: '100%', objectFit: 'contain' }}
              />
            </div>

            <ScrollHint id="mortar" progress={scrubProgress} />
          </div>
        </div>
      )}


{/* TODO: why this model was made, as on the Skeleton Barrel page. */}
      <ContextNote></ContextNote>

      {/* ---- Build video ---- */}
      <div className="split" style={{
        minHeight: 'var(--screen)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 64,
        padding: '80px var(--gutter)',
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

      {/* The model itself, where there is a file for it — see data/models.js */}
      <ModelStage model={modelFor('mortar')} label="Mortar model, to turn around" />

    </div>
  )
}
