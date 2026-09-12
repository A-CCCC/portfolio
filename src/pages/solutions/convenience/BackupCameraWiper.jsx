// src/pages/solutions/convenience/BackupCameraWiper.jsx
import { TYPE } from '../../../styles/type'
import useFadeInOnScroll from '../../../hooks/useFadeInOnScroll'
import useScrollFrames from '../../../hooks/useScrollFrames'
import PageIntro from '../../../components/PageIntro'
import ScrollHint from '../../../components/ScrollHint'
import ScrubFrames from '../../../components/ScrubFrames'
import { describe } from '../../../data/site-copy'

// One line on what this is. Fill it in and the page reads like the finished
// ones; the note stays until the page itself is built out.
const DESCRIPTION = describe('backup-camera-wiper')

// The scroll-scrubbed section is written but switched off: set this to the
// number of frames in public/backup-camera-wiper-anim/ and it appears. At zero
// the page skips it entirely rather than showing an empty band.
//
// Unlike the Clash Royale pages, these frames come from a video of the thing
// working rather than from a render — see scripts/make-scroll-frames.py, which
// takes the recording and writes the numbered frames this reads, and prints the
// count to put here.
const FRAME_COUNT = 0

const HEADING = 'Wiping the Lens'

export default function BackupCameraWiper() {
  const [sectionRef, frameRef, scrubProgress] = useScrollFrames(Math.max(FRAME_COUNT, 1), 1)
  const [headingRef, headingOpacity] = useFadeInOnScroll(0)

  return (
    <div style={{ background: 'var(--bg)', color: 'var(--text)', fontFamily: 'system-ui' }}>

      <PageIntro title="Backup Camera Wiper" description={DESCRIPTION} comingSoon />

      {/* ---- Scroll-scrubbed footage, once there are frames to scrub ---- */}
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

            {/* Left: what is being watched */}
            <div
              ref={headingRef}
              style={{
                flex: '0 1 360px',
                maxWidth: 360,
                opacity: headingOpacity,
                transition: 'opacity 1.5s ease',
              }}
            >
              <h2 style={{
                fontSize: TYPE.section,
                fontWeight: '300',
                lineHeight: 1.1,
                margin: 0,
              }}>
                {HEADING}
              </h2>
            </div>

            {/* Right: the footage, a frame at a time */}
            <div style={{
              flex: '1 1 0',
              minWidth: 320,
              alignSelf: 'stretch',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              // Sized against the panel rather than the window, and clipped to
              // it: vh is the window's height whether or not it is all on
              // screen, so with browser chrome a frame stands taller than the
              // room it has and loses its top and bottom.
              overflow: 'hidden',
            }}>
              <ScrubFrames
                folder="backup-camera-wiper-anim"
                count={Math.max(FRAME_COUNT, 1)}
                start={1}
                frameRef={frameRef}
                label="The wiper clearing the lens"
                style={{
                  height: '86%',
                  maxWidth: '100%',
                  objectFit: 'contain',
                  // Footage of a real thing, not a cut-out model: it wants an
                  // edge the way the photographs elsewhere on the site have one.
                  borderRadius: 16,
                }}
              />
            </div>

            {/* The page pins here, which reads as having stopped rather than as
                something waiting to be scrubbed. */}
            <ScrollHint id="backup-camera-wiper" progress={scrubProgress} />
          </div>
        </div>
      )}

    </div>
  )
}
