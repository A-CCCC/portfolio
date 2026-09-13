// src/pages/projects/SkeletonBarrel.jsx
import { useEffect, useRef, useState } from 'react'
import { TYPE } from '../../styles/type'
import useFadeIn from '../../hooks/useFadeIn'
import useFadeInOnScroll from '../../hooks/useFadeInOnScroll'
import useScrollFrames from '../../hooks/useScrollFrames'
import useIsPhone from '../../hooks/useIsPhone'
import ScrollHint from '../../components/ScrollHint'
import BuildVideo from '../../components/BuildVideo'
import ContextNote from '../../components/ContextNote'
import ScrubFrames from '../../components/ScrubFrames'
import pagePhotos from '../../data/pagePhotos'
import asset from '../../lib-asset'
import { describe } from '../../data/site-copy'

const TOTAL_FRAMES = 457

// Whatever is in public/photos/skeleton-barrel/, in filename order. One picture
// sits beside the note, several become a stack to turn through, and none leaves
// the note centred on its own.
const INSPIRATION = (pagePhotos['skeleton-barrel'] ?? []).map(asset)

// The animation was rendered across the full 1920-wide frame, so the model
// spends its opening moments outside the window: the frame box is wider than
// the viewport and hangs off the right edge. Scrolling then did nothing visible
// until the model reached the edge of the screen.
//
// The 63 frames rendered before the model appears at all were dropped outright —
// dead at any window size. The rest are all here: they were thinned to two in
// three while the frames were being swapped into an <img>, which could not keep
// up with them, and put back once the canvas could. A copy is kept in
// source-frames/skeleton-barrel-anim-457/.
//
// Where the model first appears depends on the
// window: the wider it is, the more of the frame box is on screen and the
// sooner the model appears, so there is no single frame to start at. This table
// answers that, measured from the frames themselves: for a given share of the
// image that is on screen (index 0 is 0.75, in steps of 0.01) it gives the
// first frame in which the model has come into view.
const ENTRY_STEP = 0.01
const ENTRY_BASE = 0.75
const ENTRY_FRAME = [
   33,  32,  30,  29,  28,  26,  25,  23,  22,  21,  19,  18,  16,
   15,  13,  12,  10,   9,   7,   6,   4,   2,   1,   1,   1,   1,
]

// How the frame box is fitted into the panel that holds it: most of its height,
// and never so wide that the model runs off the panel's left edge.
const BOX_HEIGHT = 0.86         // of the panel's height
const BOX_MAX_WIDTH = 1.70      // of the panel's width
// On a phone the text is above the animation rather than beside it, and the
// overhang has nowhere to hang: the frame is fitted inside the panel and centred
// there, so the model arrives on screen whole instead of off the right edge.
const BOX_MAX_WIDTH_PHONE = 1
const FRAME_RATIO = 1920 / 1080
// The frames as they actually are: cropped to x 648 y 0, 1272x1032 of that
// 1920x1080. A phone is shown this rather than the frame it was cut from —
// there is no room for a box two thirds of which is empty and the model hung
// off the right edge of it.
const CROP_RATIO = 1272 / 1032
// Where the model comes to rest. It rolls in from the right and finishes left
// of middle — measured from the last frame, its content sits at 0.299 across
// and 0.552 down — so a box centred on its own middle leaves the finished model
// off to one side, which is the frame everyone sees longest. The box is hung
// off that point instead: the rest of the animation arrives around it.
const SETTLES_AT = { x: 0.299, y: 0.552 }

export default function SkeletonBarrel() {
  const phone = useIsPhone()
  const panelRef = useRef(null)
  const frameBoxRef = useRef(null)
  const [box, setBox] = useState(null)
  const [startFrame, setStartFrame] = useState(1)

  // Worked out here rather than in CSS. Height and width pull against each other
  // — tall enough to fill the panel, narrow enough to stay inside it — and CSS
  // cannot compare the two axes: `aspect-ratio` beside an explicit height gives
  // up the ratio when `max-width` bites instead of giving back the height, which
  // squashes the frame rather than shrinking it.
  useEffect(() => {
    const fit = () => {
      const panel = panelRef.current
      if (!panel || !panel.clientHeight) return
      const ratio = phone ? CROP_RATIO : FRAME_RATIO
      let height = panel.clientHeight * BOX_HEIGHT
      let width = height * ratio
      const widest = panel.clientWidth * (phone ? BOX_MAX_WIDTH_PHONE : BOX_MAX_WIDTH)
      if (width > widest) {
        width = widest
        height = width / ratio
      }
      setBox({ width, height })
    }
    fit()
    window.addEventListener('resize', fit)
    return () => window.removeEventListener('resize', fit)
  }, [phone])

  // Which frame the model first appears in depends on how much of the box is on
  // screen, so this waits for the size above to settle.
  useEffect(() => {
    const image = frameBoxRef.current
    if (!image) return
    const { left, width } = image.getBoundingClientRect()
    if (!width) return
    const onScreen = (window.innerWidth - left) / width
    const step = Math.round((onScreen - ENTRY_BASE) / ENTRY_STEP)
    setStartFrame(ENTRY_FRAME[Math.max(0, Math.min(ENTRY_FRAME.length - 1, step))])
  }, [box])

  const [sectionRef, frameRef, scrubProgress] =
    useScrollFrames(TOTAL_FRAMES - startFrame + 1, startFrame)

  const [titleOpacity, setTitleOpacity] = useState(0)
  // Second, so the line under the title arrives after it rather than with it.
  const introOpacity = useFadeIn(600)
  const [headingRef, headingOpacity] = useFadeInOnScroll(300)
  const [bodyRef, bodyOpacity] = useFadeInOnScroll(900)
  const [scrubTextRef, scrubTextOpacity] = useFadeInOnScroll(0)

  useEffect(() => {
    const timer = setTimeout(() => setTitleOpacity(1), 100)
    return () => clearTimeout(timer)
  }, [])



  return (
    <div style={{ background: 'var(--bg)', color: 'var(--text)', fontFamily: 'system-ui' }}>

      {/* ---- SECTION 1: Intro ---- */}
      <div style={{
        height: 'var(--screen)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
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
          Skeleton Barrel
        </h1>
        <p className="page-intro-line" style={{
          fontSize: TYPE.lead,
          lineHeight: 1.7,
          color: 'var(--text-body)',
          textAlign: 'center',
          padding: '0 24px',
          opacity: introOpacity,
          transition: 'opacity 1.5s ease',
        }}>
          {describe('skeleton-barrel')
            || <span style={{ color: 'var(--text-muted)' }}>(Page Coming Soon!)</span>}
        </p>
      </div>

      {/* ---- SECTION 2: Scroll-scrubbed animation (right) + text (left) ---- */}
      <div ref={sectionRef} style={{ height: '400vh', position: 'relative' }}>
        <div style={{
          position: 'sticky',
          top: 0,
          height: 'var(--screen)',
          display: 'flex',
          flexDirection: phone ? 'column' : 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: phone ? 22 : 64,
          padding: phone ? '86px var(--gutter) 22px' : '0 var(--gutter)',
          background: 'var(--bg)',
          // Nothing leaves this panel. The animation is deliberately wider than
          // the window, and without this the overhang widened the page itself:
          // every window size scrolled sideways, and a page scrolled sideways
          // shifts everything left, which is what made the model look cropped
          // on its left. Clipped here, the overhang costs nothing.
          overflow: 'hidden',
        }}>

          {/* Left: text */}
          <div
            ref={scrubTextRef}
            style={{
              flex: phone ? '0 0 auto' : '0 1 1',
              maxWidth: phone ? '100%' : 540,
              textAlign: phone ? 'center' : 'left',
              opacity: scrubTextOpacity,
              transition: 'opacity 1.5s ease',
            }}
          >
            <h2 style={{ fontSize: TYPE.section, fontWeight: '300', marginBottom: 24 }}>
              Presenting the Skeleton Barrel,
              Featuring the Pattern Tool
            </h2>
          </div>

          {/* Right: scroll-scrubbed animation */}
          <div ref={panelRef} style={{
            flex: '1 1 0',
            minWidth: phone ? 0 : 400,
            width: phone ? '100%' : undefined,
            position: 'relative',
            alignSelf: 'stretch',
            // Its own window onto the animation: the model runs off the right of
            // it, and is cut there rather than at the edge of the page. The
            // negative margin takes that edge out to the window's own, so the
            // overhang still reaches the side of the screen.
            overflow: 'hidden',
            marginRight: phone ? 0 : -64,
          }}>
            {/* Stands in for the original uncropped 1920x1080 frame box. The
                frames are now cropped to just the model to save bandwidth, so
                this box restores the layout the full frame used to occupy —
                including the model running past the right edge, which is the
                intended look.
                
                Sized from the panel's own height rather than in vh, and hung off
                its right edge: vh is the window's height whether or not the
                window is showing all of it, so on anything with browser chrome
                the box stood taller than the space it had and the model lost its
                top and bottom. 86% leaves a margin at both. */}
            <div style={{
              position: 'absolute',
              top: '50%',
              ...(phone
                ? {
                  left: '50%',
                  // Percentages in a translate are of the box itself, which is
                  // what makes this the model's resting place rather than the
                  // box's middle.
                  transform: `translate(${(SETTLES_AT.x * -100).toFixed(1)}%,`
                    + ` ${(SETTLES_AT.y * -100).toFixed(1)}%)`,
                }
                : { right: '-12%', transform: 'translateY(-50%)' }),
              // Until the panel has been measured, the ratio alone will do
              ...(box ? { width: box.width, height: box.height }
                      : { height: '86%', aspectRatio: phone ? '1272 / 1032' : '1920 / 1080' }),
            }}>
              <ScrubFrames
                innerRef={frameBoxRef}
                folder="skeleton-barrel-anim"
                count={TOTAL_FRAMES - startFrame + 1}
                start={startFrame}
                frameRef={frameRef}
                label="Skeleton Barrel model, assembling"
                /* As shares of the frame box, so the model sits where it did in
                   the full frame however the box is sized. The crop is
                   x 648 y 0, 1272x1032 of 1920x1080. */
                style={phone
                  // The box is the crop itself here, so the frames simply fill
                  // it: centred, whole, and inside the panel.
                  ? { position: 'absolute', inset: 0, width: '100%', height: '100%' }
                  : {
                    position: 'absolute',
                    left: '33.750%',
                    top: '0.000%',
                    width: '66.250%',
                    height: '95.556%',
                  }}
              />
            </div>
          </div>


          {/* First-timer's nudge: the page pins here, which reads as having
              stopped rather than as an animation waiting to be scrubbed. */}
          <ScrollHint id="skeleton-barrel" progress={scrubProgress} />
        </div>
      </div>

      <ContextNote title="Inspiration" images={INSPIRATION} alt="">
        I built this model as my final project for a 3D printing class. The skeleton barrel was an
        obvious choice — I had just learned to use the pattern tool effectively, and the paneled
        barrel was the perfect opportunity to apply it. I worked from multiple online images
        throughout the process, both for detail and for getting the proportions right.
      </ContextNote>

      {/* ---- SECTION 3: Build video (auto-plays on scroll into view) ---- */}
      <div className="split" style={{
        minHeight: 'var(--screen)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 64,
        padding: '80px var(--gutter)',
        background: 'var(--bg)',
      }}>


      {/* Left: text */}
        <div style={{ flex: '1 1 0', maxWidth: 480 }}>
          <h2
            ref={headingRef}
            style={{
              fontSize: TYPE.section,
              fontWeight: '300',
              marginBottom: 24,
              opacity: headingOpacity,
              transition: 'opacity 1.5s ease',
            }}
          >
            Building the Model
          </h2>
          <p
            ref={bodyRef}
            style={{
              fontSize: TYPE.body,
              lineHeight: 1.7,
              color: 'var(--text-body)',
              opacity: bodyOpacity,
              transition: 'opacity 1.5s ease',
            }}
          >
 I began this project by sketching out one of the panel pieces of the barrel, then extruded it,
 lofted the spikes, and finalized the panel. From there, the pattern tool created an accurate number
 of panels. After cleaning up the model, I duplicated it to complete the barrel. Next came the
 balloons, which required multiple construction planes for accurate placement. I revolved each one
 and swept and rotated the ropes. The last step was sketching the skull and embossing it onto the
 faces of the barrel. The video shows the main build steps, but not the constant small adjustments I
 made along the way to get each part looking right.
          </p>
        </div>

        <BuildVideo src={asset("/videos/skeleton-barrel-build.mp4")} label="Skeleton Barrel build" />
      </div>
    </div>
  )
}