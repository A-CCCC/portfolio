// src/pages/solutions/convenience/ModularCarContainer.jsx
import { useLayoutEffect, useRef, useState } from 'react'
import pagePhotos, { stages } from '../../../data/pagePhotos'
import useFadeInOnScroll from '../../../hooks/useFadeInOnScroll'
import PageIntro from '../../../components/PageIntro'
import PhotoSection, { PhotoGroup } from '../../../components/PhotoStory'
import BuildLog from '../../../components/BuildLog'
import ScrollHint from '../../../components/ScrollHint'
import asset from '../../../lib-asset'
import { describe } from '../../../data/site-copy'

// One line on what this is. The note below it clears itself once there are
// photos in the folder — see src/assets/photos/README.md.
const DESCRIPTION = describe('modular-car-container')

// Every photo in public/photos/modular-car-container/, in filename order. The
// folder is read at build time (see scripts/photo-manifest.mjs), so adding a
// photo is a matter of dropping the file in.
const PHOTOS = (pagePhotos['modular-car-container'] ?? []).map(asset)
// And the work so far, a stage per subfolder — see public/photos/PAGE-PHOTOS.md.
const STAGES = stages['modular-car-container'] ?? []
const EMPTY = PHOTOS.length === 0 && STAGES.length === 0

// The written sections, built the way the Backup Camera Wiper page's are: a
// statement of the problem, the solution beside its photos, and the process.
// Photos
// come from public/photos/modular-car-container/ by the start of the filename
// — problem-, solution-, first-, measure-, grid- — in filename order; a section with none
// reads as a statement on its own. Anything else in the folder shows in the
// gallery at the foot of the page.
const SHOT = (prefix) => (pagePhotos['modular-car-container'] ?? []).filter((f) => f.split('/').pop().startsWith(prefix)).map(asset)
const SECTIONS = [
  {
    heading: 'The Problem',
    centered: true,
    body: "A small pocket underneath the screen in my mom\u2019s car is useless. Anything put inside will just fall out while accelerating, which is distracting: the driver has to search for and pick up whatever gets lost. The compartment is an irregular shape, so no normal container fits well. Additionally, the rest of the center console isn\u2019t suited to store items like a small key or loose sunglasses.",
    photos: SHOT('problem-'),
  },
  {
    heading: 'The Solution',
    body: "The final product is a 3D-printed container with an integrated grid to accommodate custom attachments for multiple items (and save filament). I designed a key \u201cparking space\u201d and some parts to hold a pair of sunglasses that fit into the grid. I intended for magnets attached to the back of the pocket to keep the container in place, but the warped shape of the cavity holds it in place with friction. The small semicircle cutout on the front allows for easy access, and the vertical panels add visual interest and reinforce the thin walls.",
    layout: 'carousel',
    photos: SHOT('solution-'),
  },
  // The process as a title with its stages under it, as the wiper page has it
  { heading: 'The Process', photos: [] },
  { heading: 'First Attempts', sub: true, layout: 'carousel', aspect: '4 / 3', body: "I began this project by measuring the opening with a tape measure and designing an initial model with the general shape. I added magnets to the back to secure the container in place. However, I wasn\u2019t able to test this method, because the two prototypes I printed didn\u2019t fit at all. After adjusting the size, I realized that the opening\u2019s shape was much more complex than it appeared.", photos: SHOT('first-') },
  { heading: 'New Measurements', sub: true, layout: 'carousel', aspect: '4 / 3', body: "In fact, everything was angled. My dad helped me take measurements by shoving a piece of paper in the slot and marking the edges of the area (like paper-based LiDAR). I learned that the front is angled, the back is angled, the sides are angled, and the opening narrows towards the back (I never would have guessed). With these enhanced measurements and a little bit of trig, I designed a completely new model.", photos: SHOT('measure-') },
  { heading: 'Modularity', sub: true, layout: 'carousel', aspect: '4 / 3', body: "After getting the shell designed, I figured that this design would use a lot of unnecessary filament. To solve this, I decided to create a pattern of holes on the base of the container. I had planned to incorporate attachments for keys and sunglasses into the container, but I realized that these holes, if shaped and spaced properly, could act as a modular grid that I could keep adding attachments to \u2013 a win-win situation. Fusion\u2019s pattern tool had other plans, though, so the grid is spaced something like 10.50 mm x 11.25 mm. Finally, my dad recommended adding something on the front of the container to make it less ugly, so I added vertical columns that made it look like something from Star Wars, but also came with the perk of added durability.", photos: SHOT('grid-') },
]
// Photo rows alternate sides, counted across photo-bearing sections only
let photoRow = 0
const FLIPPED = SECTIONS.map((section) => ({ ...section, flip: section.photos.length ? photoRow++ % 2 === 1 : false }))
const LOOSE = PHOTOS.filter((f) => !/\/(problem|solution|first|measure|grid)-[^/]*$/.test(f))

// The container put together, scrubbed by the scroll: the empty container
// rises into view from the foot of the screen, then each part arrives on it
// in turn. The frames are photos from a fixed camera, cropped to the
// container and lined up (public/modular-car-container-anim/, made from the
// originals in source-photos/), so one fading into the next shows only the
// part that is new. The empty container first; then the oval holder, the two
// pegs, the hook, the key fob and the sunglasses.
const FRAMES = 7
const FRAME_SRC = (i) => asset(`/modular-car-container-anim/${String(i).padStart(2, '0')}.webp`)
const RATIO = 1400 / 989        // the frames' own shape (scripts/make-container-frames.py)
const RUNWAY = '420vh'           // how far the page scrolls while it is pinned
const RISES_FOR = 0.22           // the share of that spent rising into view
const BUILT_BY = 0.9             // and where the last part has arrived

// Eased out, as a thing set down settles
const ease = (t) => 1 - Math.pow(1 - t, 3)
const clamp = (t) => Math.max(0, Math.min(1, t))

function Assembly() {
  const sectionRef = useRef(null)
  const boxRef = useRef(null)
  const framesRef = useRef([])
  const hintRef = useRef(null)

  // Answered straight from the scroll, writing to the elements rather than
  // to state, as the other scrubbed sections do
  useLayoutEffect(() => {
    const section = sectionRef.current
    if (!section) return undefined
    const place = () => {
      const vh = window.innerHeight
      const runway = section.offsetHeight - vh
      const t = runway > 0 ? clamp(-section.getBoundingClientRect().top / runway) : 0
      // up from below the foot of the screen to the middle of it
      const rise = ease(clamp(t / RISES_FOR))
      if (boxRef.current) boxRef.current.style.transform = `translateY(${((1 - rise) * vh * 0.9).toFixed(1)}px)`
      // then each part in turn, each over an equal share of what is left
      const step = (BUILT_BY - RISES_FOR) / (FRAMES - 1)
      framesRef.current.forEach((img, i) => {
        if (!img || i === 0) return
        const start = RISES_FOR + (i - 1) * step
        img.style.opacity = ease(clamp((t - start) / (step * 0.8))).toFixed(3)
      })
      if (hintRef.current) hintRef.current(t)
    }
    place()
    window.addEventListener('scroll', place, { passive: true })
    window.addEventListener('resize', place)
    return () => {
      window.removeEventListener('scroll', place)
      window.removeEventListener('resize', place)
    }
  }, [])

  return (
    <div ref={sectionRef} style={{ height: RUNWAY, position: 'relative' }}>
      <div style={{
        position: 'sticky',
        top: 0,
        height: 'var(--screen)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        background: 'var(--bg)',
      }}>
        <div ref={boxRef} style={{
          position: 'relative',
          width: `min(90vw, calc(var(--screen) * 0.72 * ${RATIO}), 980px)`,
          aspectRatio: `${RATIO}`,
          // (the frames are cut to the container's own outline, which is not
          // a rectangle — wider at the top, where its walls lean out — so its
          // shadow follows that outline, and nothing clips it to a box)
          filter: 'drop-shadow(0 18px 28px rgba(0, 0, 0, 0.28)) drop-shadow(0 4px 8px rgba(0, 0, 0, 0.18))',
          transform: 'translateY(90vh)',
          willChange: 'transform',
        }}>
          {Array.from({ length: FRAMES }, (_, i) => (
            <img
              key={i}
              ref={(el) => { framesRef.current[i] = el }}
              src={FRAME_SRC(i + 1)}
              alt={i === 0 ? 'The modular car container, its parts added one by one' : ''}
              aria-hidden={i === 0 ? undefined : 'true'}
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                display: 'block',
                opacity: i === 0 ? 1 : 0,
              }}
            />
          ))}
        </div>
        <Hint hintRef={hintRef} />
      </div>
    </div>
  )
}

// The "keep scrolling" note, told how far along the section is
function Hint({ hintRef }) {
  const [progress] = useStateRef(hintRef)
  return <ScrollHint id="modular-car-container" progress={progress} />
}
// (a state the scroll handler can set, but only in steps, so the page is not
// drawn again on every scroll event)
function useStateRef(ref) {
  const [v, setV] = useState(0)
  const last = useRef(-1)
  ref.current = (t) => {
    const step = Math.round(t * 50)
    if (step !== last.current) { last.current = step; setV(t) }
  }
  return [v, setV]
}

export default function ModularCarContainer() {
  const [photosRef, photosOpacity] = useFadeInOnScroll(0)

  return (
    <div className="home-backdrop wall-page" style={{ color: 'var(--text)', fontFamily: 'system-ui' }}>
      <PageIntro
        title="Modular Car Container"
        description={DESCRIPTION}
        comingSoon={EMPTY}
        full
      />

      <Assembly />

      {FLIPPED.map((section) => <PhotoSection key={section.heading} {...section} />)}

      <BuildLog stages={STAGES} heading="Modular Car Container" />

      {/* Renders nothing until there are photos in the folder, so the page reads
          as a stub rather than as a gallery with a hole in it. */}
      {LOOSE.length > 0 && (
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
          <PhotoGroup photos={LOOSE} heading="Modular Car Container" />
        </div>
      )}
    </div>
  )
}
