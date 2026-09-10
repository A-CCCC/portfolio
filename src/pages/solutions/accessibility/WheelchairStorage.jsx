// src/pages/solutions/accessibility/WheelchairStorage.jsx
import { useState } from 'react'
import { TYPE } from '../../../styles/type'
import useFadeIn from '../../../hooks/useFadeIn'
import useScrollProgress from '../../../hooks/useScrollProgress'
import PhotoSection, { SectionTitle } from '../../../components/PhotoStory'
import ScrollHint from '../../../components/ScrollHint'

const SLIDE_ASSET = '/wheelchair-storage.webp'

// Fraction of the runway the slide takes to complete. Whatever is left over is
// dead scroll — the section is still pinned but nothing is moving — so this is
// the dial for how long the model sits before the page scrolls on. It pairs
// with the section height below: shorter section, shorter hold.
const SLIDE_END = 0.75
const SECTION_HEIGHT = '170vh'

// Pulls the panel up so it pins sooner after the title scrolls away, closing
// the dead stretch between the two. The panel is blank at rest and paints the
// page background, so overlapping the bottom of the hero is invisible — the
// title sits at the hero's middle, well above this. Raising the animation's
// start any other way would mean scrubbing while the page is still scrolling.
const SECTION_PULL = '-30vh'

// How far off-screen each piece starts, in vw.
const OFFSET = 70

// Ease-out: quick off the mark, settling gently into place.
const easeOut = (t) => 1 - Math.pow(1 - t, 3)

// Photo sections below the animation. Grouped by build stage; edit the copy and
// regroup freely — each entry renders one text-and-photos row, alternating side.
//
// `photos` are filenames inside public/photos/wheelchair-storage/, so renaming a
// file means changing it here and nowhere else.
const PHOTO_DIR = '/photos/wheelchair-storage'

const PHOTO_SECTIONS = [
  {
    heading: 'The Problem',
    centred: true,   // heading over text, down the middle
    body: 'A student at my school is in a wheelchair because of back problems. His backpack, which stores all of his class materials, is mounted on the back of his wheelchair. He has to twist around to reach anything, which is uncomfortable and risks further back injury.',
    // Deliberately no photos: the problem is an action, not an object, so this
    // reads as a full-width opening statement rather than a half-empty row.
    // Drop a "before" shot in here (backpack on the back of the chair, mid-reach)
    // and it becomes a normal side-by-side section automatically.
    photos: [],
  },
  {
    heading: 'The Solution',
    body: "The final product is a U-shaped container that fits under the wheelchair. The body is 3D printed in PETG with straps that route around the wheelchair\u2019s frame. The straps hold the container securely, while the printed body is sturdy but flexible enough to close. TPU mesh panels cover the sides to keep items from sliding out, and a velcro strap at the open end closes the unit and is easy to reach.",
    layout: 'carousel',
    photos: ['final-container.jpeg', 'under-chair-1.jpeg', 'under-chair-2.jpeg'],
  },
  {
    // Opens the process the same way The Problem opens the page — a full-width
    // statement, with the three stages below it as sub-sections.
    heading: 'The Process',
    // No body: this is a title that leads straight into the sub-sections below.
    photos: [],
  },
  {
    heading: 'Starting the Project',
    body: "Beginning the project, I worked with my school\u2019s maker space coordinator to conduct interviews with the student to identify issues in his daily life. A major problem he highlighted was straining his back while reaching for materials in his backpack. After brainstorming solutions, I landed on a container that fits under his wheelchair. This allows him to easily access materials without twisting or obstructing his movement. The first prototypes involved a canvas bag on a plastic backing held on by TPU clips. However, this solution was not nearly sturdy enough to be permanent.",
    sub: true,
    // Sketch sits between the two bag shots so the near-identical photos are
    // not side by side; the two made parts close the second row.
    layout: 'carousel',
    photos: [
      'canvas-bag.jpeg',
      'prototype-sketch.jpeg',
      'canvas-bag-testing.jpeg',
      'prototype-1.jpeg',
      'tpu-clip.jpeg',
    ],
  },
  {
    heading: 'Printed Prototypes',
    body: 'Next, I developed printed prototypes using measurements we took during an interview. In Fusion, I designed a U-shaped container that would sit at an angled position to keep contents from sliding out. Two challenges shaped the process: my original models had issues with the nozzle hitting previous layers (blue TPU prototype), and parts of his wheelchair frame stuck out and interfered with the container. After redesigning a few times and meeting with the student to confirm that the prototypes actually fit, I printed the final container.',
    sub: true,
    layout: 'carousel',
    photos: ['prototype-2.jpeg', 'prototype-3.jpeg', 'prototype-4.jpeg', 'prototype-5.jpeg'],
  },
  {
    heading: 'Final Assembly',
    body: 'Finally, I printed the body out of PETG for a combination of strength and flexibility. My teacher and I landed on using nylon straps to attach the container to the wheelchair. The straps are sturdy and route through slots in the container for a strong attachment. I printed TPU mesh pieces to cover the sides, which were glued on and also routed through the straps. The student also wanted a secure closing system, so I looped a small velcro strip through the straps at the end of the container. After using the container for a while, he noticed that the printed body was cracking along the print lines. To fix this, I cut plastic sheets and glued them across the print lines to provide extra strength. The student now uses the container to hold his computer and folders, and told me it is much more convenient than the backpack.',
    sub: true,
    layout: 'carousel',
    photos: ['prototype-6.jpeg', 'prototype-7.jpeg', 'final-prototype.jpeg'],
  },
]

// Photo rows alternate sides. Counted across photo-bearing sections only, so a
// full-width statement in the middle does not break the left/right rhythm.
let photoRow = 0
const SECTIONS = PHOTO_SECTIONS.map((section) => ({
  ...section,
  photos: section.photos.map((file) => `${PHOTO_DIR}/${file}`),
  flip: section.photos.length ? photoRow++ % 2 === 1 : false,
}))


export default function WheelchairStorage() {
  const titleOpacity = useFadeIn(100)
  // Second, so the line under the title arrives after it rather than with it.
  const introOpacity = useFadeIn(600)
  const [slideRef, progress] = useScrollProgress()
  const [assetMissing, setAssetMissing] = useState(false)

  const slideIn = easeOut(Math.min(1, progress / SLIDE_END))
  const travel = (1 - slideIn) * OFFSET
  const opacity = Math.min(1, slideIn * 1.6)

  // The model comes in from the left...
  const modelStyle = {
    transform: `translateX(${-travel}vw)`,
    opacity,
  }

  // ...and the caption from the right, meeting it in the middle. The -50%/-50%
  // is the caption's own centring on its anchor point, so the travel has to be
  // folded into the same translate rather than applied as a second one.
  const captionStyle = {
    transform: `translate(calc(-50% + ${travel}vw), -50%)`,
    opacity,
  }

  return (
    <div style={{ background: 'var(--bg)', color: 'var(--text)', fontFamily: 'system-ui' }}>

      {/* ---- SECTION 1: Intro ---- */}
      <div style={{
        height: '100vh',
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
          Wheelchair Storage
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
          A custom container to bring daily materials within reach.
        </p>
      </div>

      {/* ---- SECTION 2: Slide-in model, scrubbed by scroll ---- */}
      <div ref={slideRef} style={{ height: SECTION_HEIGHT, marginTop: SECTION_PULL, position: 'relative' }}>
        <div style={{
          position: 'sticky',
          top: 0,
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          background: 'var(--bg)',
        }}>
          {/* The wrapper stays put and each child carries its own transform, so
              the two can travel in opposite directions and still land in the
              same relationship. The wrapper shrinks to the image's own size,
              which is what lets the caption be positioned as a percentage of
              the render itself. */}
          <div style={{ position: 'relative', display: 'inline-block' }}>
            {assetMissing
              ? <div style={{
                  ...modelStyle,
                  width: 'min(70vw, 700px)',
                  height: '60vh',
                  border: '1px dashed var(--border)',
                  borderRadius: 16,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--text-muted)',
                  fontSize: TYPE.small,
                  textAlign: 'center',
                  padding: 24,
                }}>
                  Drop the render at public{SLIDE_ASSET} to replace this placeholder.
                </div>
              : <img
                  src={SLIDE_ASSET}
                  alt="Wheelchair storage model"
                  onError={() => setAssetMissing(true)}
                  // The render's subject fills only ~45% of its frame height, so
                  // it needs a taller box than the raw number suggests. maxWidth
                  // keeps the very wide 1.84:1 canvas from running off a narrow
                  // window — contain then scales it down by width instead.
                  style={{
                    ...modelStyle,
                    height: '94vh',
                    maxWidth: '94vw',
                    objectFit: 'contain',
                    display: 'block',
                  }}
                />
            }

            {/* Arrives from the right and settles in the open middle of the U,
                so the model's arms end up wrapping it. */}
            <h2 className="slide-caption" style={{
              ...captionStyle,
              position: 'absolute',
              left: '56%',
              top: '50%',
              // Wide enough to hold the caption on one line at the largest font
              // size — the opening is much wider than it is tall, so a wrap to
              // two lines is what would actually crowd the arms.
              width: '58%',
              margin: 0,
              textAlign: 'center',
              fontSize: 'clamp(1.25rem, 2.4vw, 2.1rem)',
              fontWeight: 700,
              lineHeight: 1.2,
              letterSpacing: '-0.01em',
              // colour + shadow come from .slide-caption so they can vary by theme
            }}>
              Custom Wheelchair Storage
            </h2>
          </div>

          {/* First-timer's nudge: the page pins here, which reads as having
              stopped rather than as an animation waiting to be scrubbed. */}
          <ScrollHint id="wheelchair-storage" progress={progress} />
        </div>
      </div>

      {/* ---- SECTION 3+: Build story, text beside photos ---- */}
      {SECTIONS.map((section) => (
        // A heading with nothing of its own introduces the sub-sections under
        // it, and is drawn the same way on every page.
        section.body || section.photos.length
          ? <PhotoSection key={section.heading} {...section} />
          : <SectionTitle key={section.heading}>{section.heading}</SectionTitle>
      ))}

    </div>
  )
}
