// src/pages/solutions/convenience/BackupCameraWiper.jsx
import { useLayoutEffect, useRef, useState } from 'react'
import useIsPhone from '../../../hooks/useIsPhone'
import PageIntro from '../../../components/PageIntro'
import PhotoSection from '../../../components/PhotoStory'
import ScrollHint from '../../../components/ScrollHint'
import ScrubFrames from '../../../components/ScrubFrames'
import pagePhotos from '../../../data/pagePhotos'
import asset from '../../../lib-asset'
import { describe } from '../../../data/site-copy'

// One line on what this is. Fill it in and the page reads like the finished
// ones; the note stays until the page itself is built out.
const DESCRIPTION = describe('backup-camera-wiper')

// Two pieces of footage, each scrubbed by the scroll: what the camera sees
// while the wiper works, then the wiper seen from outside the car. Unlike the Clash
// Royale pages these frames come from video of the real thing — see
// scripts/make-scroll-frames.py, which takes a recording and writes the
// numbered frames a section reads, and prints the count to put here. A count
// of zero switches its section off rather than showing an empty band.
const OUTSIDE = {
  folder: 'backup-camera-wiper-outside-anim',
  count: 219,
  aspect: 1920 / 1080,
  label: 'The wiper arm sweeping across the camera',
  hint: 'backup-camera-wiper-outside',
}
const CAMERA = {
  folder: 'backup-camera-wiper-anim',
  count: 235,
  aspect: 1374 / 822,
  label: 'The wiper clearing the lens, as the camera sees it',
  hint: 'backup-camera-wiper',
  // and, as the lens comes clear, the words drawn in out of it (TitleThrough, below)
  title: 'Clarity, on demand.',
  // full screen from the start, rather than growing to it as the outside
  // view does
  full: true,
}

// The footage arrives on the page as a rounded rectangle in the middle of the
// screen. When the page locks onto it, the first stretch of scrolling grows it
// to fill the screen, corners squaring off as it goes; only then does the rest
// of the scroll play the footage through. The frame holds still while the box
// grows, so the two motions are never on top of each other.
const RUNWAY = '400vh'         // how far the page scrolls while pinned here
const GROWS_FOR = 0.12         // the share of that spent growing: quick, then the footage
const STARTS_AT = 0.72         // of the screen, on a laptop
const STARTS_AT_PHONE = 0.88   // a phone has no room to spare
const RADIUS = 24              // px, at the start; none at full screen
const WORTH_A_RENDER = 0.02    // how far the hint's progress moves before it is told

const lerp = (a, b, t) => a + (b - a) * t

// A title drawn in out of the footage, as Apple's MacBook Pro page draws its
// chips' names: the words start so large that a single stroke of one letter
// fills the screen — all footage — and shrink to their own size, the page
// closing in round them until the footage shows only through the letters.
//
// Two copies of the words over the footage. The first, white on black and
// multiplied over it, leaves the footage in the letters and black round
// them; the second, black on the page's own colour and lightening, turns
// that black into the page's colour and leaves the letters alone. So it
// sits on the cream page and the navy one alike, where Apple's needs black.
// (The first's letters a shade under white on the light page, --cut-ink, so
// the pale footage in them still stands off the cream.)
const TITLE_FROM = 400              // times its size, at the start
// the section's runway, with a title in it: the words arrive 311vh into its
// 365, and it lets go of the screen about half a screen after
const TITLE_RUNWAY = '465vh'
// The words begin while the footage is still playing — the last of it, the
// lens coming clear, is seen through the letters as they close in — and the
// footage runs on to its end a little after they have arrived
const TITLE_AT = 0.575              // of the runway, where the words begin
const TITLE_FOR = 0.276             // and the share it takes them to arrive
const PLAYS_TO = 0.94               // and where the footage ends, with a title
// how big the words are, on the screen: Apple's weight and spacing
const titleStyle = {
  margin: 0,
  padding: '0 24px',
  fontFamily: 'system-ui, -apple-system, sans-serif',
  fontSize: 'clamp(1.9rem, 8.6vw, 8rem)',   // one line, inside a phone's width too
  fontWeight: 700,
  letterSpacing: '-0.03em',
  lineHeight: 1.05,
  textAlign: 'center',
  whiteSpace: 'nowrap',
}

// Where to zoom from: a point well inside a stroke near the middle of the
// words, so that at full size every pixel of the screen is inside a letter.
// The middle of the line itself is as likely to fall in a gap as a stroke.
function strokeNear(el) {
  const cs = getComputedStyle(el)
  // its own size, not the size it is drawn at (up to 400 times over)
  const w = Math.ceil(el.offsetWidth), h = Math.ceil(el.offsetHeight)
  if (!w || !h) return { x: 0, y: 0 }
  const cv = document.createElement('canvas')
  cv.width = w; cv.height = h
  const c = cv.getContext('2d', { willReadFrequently: true })
  c.font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`
  c.letterSpacing = cs.letterSpacing
  c.textAlign = 'center'
  c.textBaseline = 'middle'
  c.fillText(el.textContent, w / 2, h / 2)
  const a = c.getImageData(0, 0, w, h).data
  const solid = (x, y) => x >= 0 && y >= 0 && x < w && y < h && a[(y * w + x) * 4 + 3] > 250
  // the deepest point in a stroke (furthest from any edge, by a few
  // directions) among those nearest the middle
  const reach = (x, y) => {
    let d = 0
    while (d < 60 && solid(x + d, y) && solid(x - d, y) && solid(x, y + d) && solid(x, y - d)
      && solid(x + d, y + d) && solid(x - d, y - d) && solid(x + d, y - d) && solid(x - d, y + d)) d += 1
    return d
  }
  let best = { x: w / 2, y: h / 2, score: -1 }
  for (let y = 0; y < h; y += 2) {
    for (let x = 0; x < w; x += 2) {
      if (!solid(x, y)) continue
      const score = reach(x, y) * 4 - Math.hypot(x - w / 2, y - h / 2) * 0.15
      if (score > best.score) best = { x, y, score }
    }
  }
  return best
}

// The second copy's ground is the page's own wallpaper, laid where the page
// lays it (the scroll handler keeps it there, .title-ground): so round the
// letters it is the wallpaper that shows, as it does round the footage.
function TitleThrough({ text, cutRef, fillRef }) {
  const layer = (ref, mode, ink, ground) => (
    <div className={ground ? undefined : 'title-ground'} style={{
      position: 'absolute',
      inset: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: ground,
      mixBlendMode: mode,
      overflow: 'hidden',
      pointerEvents: 'none',
    }}>
      <p ref={ref} aria-hidden="true" style={{ ...titleStyle, color: ink }}>{text}</p>
    </div>
  )
  return (
    <>
      {layer(cutRef, 'multiply', 'var(--cut-ink, #fff)', '#000')}
      {layer(fillRef, 'lighten', '#000', null)}
      <h2 style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>{text}</h2>
    </>
  )
}

function Scrub({ folder, count, aspect, label, hint, title, full }) {
  const phone = useIsPhone()
  const sectionRef = useRef(null)
  const boxRef = useRef(null)
  const frameRef = useRef(1)
  const cutRef = useRef(null)
  const fillRef = useRef(null)
  const [progress, setProgress] = useState(0)

  // Everything here answers the scroll directly, and writes to the box and the
  // frame ref rather than to state: scrolling delivers an event per screen
  // refresh, and re-rendering the page that often is what made the Clash
  // Royale scrubs stutter before they were built this way.
  //
  // Registered in a layout effect so it is in the list before the canvas's own
  // scroll listener, which reads the frame ref: the ref is set, then the frame
  // is drawn, in the same event.
  useLayoutEffect(() => {
    const section = sectionRef.current
    const box = boxRef.current
    if (!section || !box) return undefined
    const starts = phone ? STARTS_AT_PHONE : STARTS_AT
    let told = -1
    // where in the words to zoom from, found once they are laid out
    let origin = null
    const findOrigin = () => {
      const el = cutRef.current
      if (!el) return
      const o = strokeNear(el)
      origin = `${o.x}px ${o.y}px`
      for (const t of [cutRef.current, fillRef.current]) t.style.transformOrigin = origin
    }

    const place = () => {
      const vw = window.innerWidth
      const vh = window.innerHeight
      const rect = section.getBoundingClientRect()
      const runway = section.offsetHeight - vh
      const t = runway > 0 ? Math.max(0, Math.min(1, -rect.top / runway)) : 0

      // The largest rectangle of the footage's own shape that fits the share
      // of the screen it starts at, growing to the whole screen.
      let w0 = vw * starts
      let h0 = w0 / aspect
      if (h0 > vh * starts) { h0 = vh * starts; w0 = h0 * aspect }
      // (none of the growing for a section that starts at full screen)
      const grows = full ? 0 : GROWS_FOR
      const grown = full ? 1 : Math.min(1, t / GROWS_FOR)
      box.style.width = `${lerp(w0, vw, grown).toFixed(1)}px`
      box.style.height = `${lerp(h0, vh, grown).toFixed(1)}px`
      box.style.borderRadius = `${lerp(RADIUS, 0, grown).toFixed(1)}px`

      // The footage plays over what is left of the runway — or, with a title
      // drawn in over the end of it, to a little after the title has come
      const playsTo = title ? PLAYS_TO : 1
      const played = Math.max(0, Math.min(1, (t - grows) / (playsTo - grows)))
      frameRef.current = Math.min(count, 1 + Math.floor(played * count))

      if (title && cutRef.current) {
        if (!origin) findOrigin()
        // the wallpaper round the words, where the page has it
        const ground = fillRef.current.parentElement
        const host = section.closest('.home-backdrop')
        // (held still with the panel it is on: the stretch of the wallpaper
        // where the section begins, as the panel wears it)
        if (host) {
          const hr = host.getBoundingClientRect(), sr = section.getBoundingClientRect()
          ground.style.backgroundSize = `${host.offsetWidth}px ${host.offsetHeight}px`
          ground.style.backgroundPosition = `${(hr.left - sr.left).toFixed(1)}px ${(hr.top - sr.top).toFixed(1)}px`
        }
        // its size falling evenly as a share of what it is (so each stretch of
        // the scroll divides it by about as much), easing in, as Apple's does
        const u = Math.max(0, Math.min(1, (t - TITLE_AT) / TITLE_FOR))
        const k = Math.pow(TITLE_FROM, 1 - Math.pow(u, 1.5))
        const show = t >= TITLE_AT ? '1' : '0'
        for (const el of [cutRef.current, fillRef.current]) {
          el.style.transform = `scale(${k.toFixed(4)})`
          el.parentElement.style.opacity = show
        }
        // the shade the letters take on the light page (--cut-ink) comes in
        // as they close in, so the footage does not darken all at once the
        // moment they begin, while it still fills the screen
        cutRef.current.style.color = `color-mix(in srgb, var(--cut-ink, #fff) ${(u * 100).toFixed(1)}%, #fff)`
      }

      const step = Math.round(t / WORTH_A_RENDER)
      if (step !== told) { told = step; setProgress(t) }
    }

    const resized = () => { origin = null; place() }
    place()
    // the words measured again once the font has arrived
    document.fonts?.ready.then(() => { origin = null; place() })
    window.addEventListener('scroll', place, { passive: true })
    window.addEventListener('resize', resized)
    return () => {
      window.removeEventListener('scroll', place)
      window.removeEventListener('resize', resized)
    }
  }, [count, aspect, phone, title, full])

  return (
    <div ref={sectionRef} style={{ height: title ? TITLE_RUNWAY : RUNWAY, position: 'relative' }}>
      <div style={{
        position: 'sticky',
        top: 0,
        height: 'var(--screen)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg)',
        overflow: 'hidden',
      }}>
        {/* Sized by the scroll handler above; the footage fills whatever size
            that is, cropping a little at the edges at full screen rather than
            leaving bars. */}
        <div ref={boxRef} style={{ overflow: 'hidden', flex: '0 0 auto' }}>
          <ScrubFrames
            folder={folder}
            count={count}
            start={1}
            frameRef={frameRef}
            label={label}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        </div>

        {title && <TitleThrough text={title} cutRef={cutRef} fillRef={fillRef} />}

        {/* The page pins here, which reads as having stopped rather than as
            something waiting to be scrubbed. */}
        <ScrollHint id={hint} progress={progress} />
      </div>
    </div>
  )
}

// The written sections, built the way the Wheelchair Storage page is: a
// statement of the problem, the solution beside its photos, then the process
// as a title with its stages under it. Photos come from
// public/photos/backup-camera-wiper/ by the start of the filename — problem-,
// solution-, start-, early-, challenge-, final- —
// in filename order; a section with none reads as a statement on its own.
const PHOTOS = pagePhotos['backup-camera-wiper'] ?? []
const withPrefix = (prefix) => PHOTOS.filter((f) => f.split('/').pop().startsWith(prefix)).map(asset)

const PROBLEM = {
  heading: 'The Problem',
  centered: true,
  body: "The backup camera on our car becomes unusable in the rain, especially at highway speeds. That\u2019s a safety problem, not just an inconvenience \u2014 we use it to check blind spots and see other cars when changing lanes. Existing solutions spray washer fluid onto the lens, which only clears it for a moment before the water beads right back up.",
  photos: withPrefix('problem-'),
}
const SOLUTION = {
  heading: 'The Solution',
  body: "The final product is a wiper arm with a microfiber cloth driven by a servo motor. It is attached to the license plate screws with a custom-designed bracket that also positions the arm to reach the camera. The wires for the servo run through the car\u2019s interior panels to a USB-A breakout board, which powers an Arduino Nano and an RF receiver. Triggered by a remote, the arm wipes once in each direction to clear the lens.",
  // Two shots of the wiper on the car, turned through like the Wheelchair
  // Storage page's photos; cut to 4:3, which is the shape the ring suits
  layout: 'carousel',
  aspect: '4 / 3',
  photos: withPrefix('solution-'),
}
const PROCESS = [
  { heading: 'The Process', photos: [] },
  { heading: 'Starting the Project', sub: true, layout: 'carousel', aspect: '4 / 3', body: "I began this project as the final assignment for a maker class. My mom wanted a way to clear water off the backup camera during rain, especially on long trips on the highway. My first idea was to have a complete shield surrounding the camera with a wiper over that, but it was going to be too clunky and might have trapped dirt, so I scrapped that idea. Next, I considered just having a wiper arm like a windshield wiper. However, I wasn\u2019t sure that just plastic would be soft or effective enough to clear the curved lens. Finally, I landed on adding a small piece of microfiber cloth to have a good combination of give and absorption for the job.", photos: withPrefix('start-') },
  { heading: 'Early Steps', sub: true, layout: 'carousel', body: "Next, I began work on designing a way to hold a wiping mechanism to the car. I decided to use a micro servo motor due to its small size and attach it to the screws on the license plate. I took measurements and designed a fitted bracket for the servo. I eyeballed the position of the servo relative to the screws, and after a few iterations got the position right. To control and power the servo, with help from my teacher, I decided to use an Arduino board. This was my first ever project using electronics, so I learned all of it from scratch.", photos: withPrefix('early-') },
  { heading: 'Challenges', sub: true, layout: 'carousel', body: "I chose to use an RF trigger to control the wiper, which required connecting an input from the remote to the servo. Using Claude, I tried for a month to work out the electronics and the code, but nothing would work. The servo motor would twitch unexpectedly or stop working entirely. The remote would activate the receiver but not trigger anything. The Nano would randomly power off or short itself when wires were connected. Finally, I decided to try switching to new hardware. I replaced the Nano and the servo (twice), which finally resulted in a clean wipe.", photos: withPrefix('challenge-') },
  { heading: 'Final Product', sub: true, layout: 'carousel', body: "Once this was all working, I designed a casing in Fusion for each of the components, with an acrylic viewport, to manage the wires. I soldered the connections and then began the installation process. We removed the inner trim pieces and routed wires through the license plate lights to the servo. Lastly, I heatshrink-wrapped and soldered the connections to waterproof them. Now, we use it when driving anywhere in the rain and it\u2019s very satisfying. We might have to use a waterproof servo if the current one fails from water damage, though.", photos: withPrefix('final-') },
]

// Photo rows alternate sides, counted across photo-bearing sections only.
let photoRow = 0
const flipped = (section) => ({ ...section, flip: section.photos.length ? photoRow++ % 2 === 1 : false })

export default function BackupCameraWiper() {
  return (
    <div className="home-backdrop wall-page" style={{ color: 'var(--text)', fontFamily: 'system-ui' }}>

      <PageIntro title="Backup Camera Wiper" description={DESCRIPTION} />

      {/* What the camera sees while the wiper works, and the words drawn in
          out of it */}
      {CAMERA.count > 0 && <Scrub {...CAMERA} />}

      <PhotoSection {...flipped(PROBLEM)} />
      <PhotoSection {...flipped(SOLUTION)} />

      {/* And the wiper itself, seen from outside */}
      {OUTSIDE.count > 0 && <Scrub {...OUTSIDE} />}

      {PROCESS.map((section) => <PhotoSection key={section.heading} {...flipped(section)} />)}

    </div>
  )
}
