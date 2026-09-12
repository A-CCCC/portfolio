// src/pages/solutions/accessibility/SmartKinesiologyTape.jsx
import { Fragment } from 'react'
import { TYPE } from '../../../styles/type'
import pagePhotos from '../../../data/pagePhotos'
import useFadeIn from '../../../hooks/useFadeIn'
import PhotoSection, { FeatureImage, SectionTitle, SplitRow } from '../../../components/PhotoStory'
import asset from '../../../lib-asset'
import { describe } from '../../../data/site-copy'

// Every photo in public/photos/smart-kinesiology-tape/, in filename order. The
// folder is read at build time (see scripts/photo-manifest.mjs), so adding a
// photo is a matter of dropping the file in — there is no list here to update.
const PHOTOS = (pagePhotos['smart-kinesiology-tape'] ?? []).map(asset)
const named = (prefix) =>
  PHOTOS.filter((p) => p.split('/').pop().toLowerCase().startsWith(prefix))

// ---- The page's writing. This is the part to edit. --------------------------
// Each section takes the photos whose filename starts with its `prefix`, so
// which band a photo lands in is decided by what it is called:
//
//     problem-01.jpg     -> The Problem
//     solution-worn.jpg  -> The Solution
//     prototype-02.jpg   -> The Prototype
//     process-sketch.jpg -> The Process
//
// A heading with no body becomes a title for what follows; a section with no
// photos becomes a centred statement; a section with neither is skipped, so the
// page can be filled in a piece at a time.
const SECTIONS = [
  {
    // Opens the page: how the problem was found, before the problem itself.
    heading: 'Finding the Problem',
    centred: true,   // heading over text, down the middle
    prefix: 'finding',
    body: [
      'This project came out of the Aspiring Inventor\'s Fellowship Program at George Mason '
        + 'University, where I worked with Yogi Abbineni. We were tasked with developing a '
        + 'novel solution to a real problem. That started with brainstorming to identify an '
        + 'issue worth solving, followed by prior art research to see what products and '
        + 'patents already existed.',
      'This was harder than we expected. We spent weeks on it — most of our early ideas '
        + 'turned out to be already patented or well served by existing products, and '
        + 'finding a gap that wasn\'t already crowded took up most of our time. On the day '
        + 'our proposal was due, we finally landed on an idea without comparable prior art.',
    ],
  },
  {
    heading: 'The Problem',
    prefix: 'problem',
    body: 'Joint injuries and overextension can end a sports career if recovery isn\'t '
      + 'handled properly. Catching problems early — a joint moving past a safe range, '
      + 'too much load too soon, or dehydration during recovery — allows for preventative '
      + 'action before a setback becomes permanent. But athletes and their doctors have '
      + 'few convenient ways to track this outside a clinic, and no simple, easy-to-wear '
      + 'device monitors these continuously during everyday recovery.',
  },
  {
    heading: 'The Solution',
    prefix: 'solution',
    // Each part is a titled piece of the solution, shown with its own photo.
    body: [
      ['Overview',
        'Our solution is a partially disposable combination of tape and sensors that '
        + 'tracks joint movement and hydration. The system has two parts: a disposable '
        + 'kinesiology tape base that adheres to the skin, and reusable electronics that '
        + 'snap into slots in the tape.'],
      ['How It Works',
        'Three Inertial Measurement Unit (IMU) sensors track the angle, velocity, and '
        + 'rotational acceleration of the joint, and a disposable hydration sensor embedded '
        + 'in the tape measures electrolytes in the user\'s sweat. A detachable unit holds '
        + 'the IMUs, a battery, a Bluetooth module, and a custom PCB.'],
      ['Setup and Use',
        'An app transmits the data to both the user and their doctor, allowing consistent '
        + 'monitoring, feedback, and insights. To set it up, the user attaches the tape and '
        + 'calibrates two positions — fully straightened and fully bent — so the data is '
        + 'personalized and accurate for each use.'],
    ],
  },
  {
    // A heading on its own, introducing the three sub-sections under it.
    heading: 'The Prototype',
    title: true,
  },
  {
    heading: 'What We Built',
    prefix: 'built',
    sub: true,
    body: 'During the program, we designed a prototype as our deliverable. It uses a Bend '
      + 'Labs flex sensor in place of the IMUs and a Galvanic Skin Response (GSR) sensor in '
      + 'place of the hydration sensor — parts the professors already had that functioned '
      + 'similarly enough. These connect through a breadboard to an Arduino Nano 33 BLE '
      + 'Sense Rev2, which transmits readings to the Arduino IDE\'s serial plotter several '
      + 'times per second.',
  },
  {
    heading: 'Testing',
    prefix: 'testing',
    sub: true,
    body: 'The flex sensor measured bend angle accurately, but we had no secure way to '
      + 'attach it, so it often got twisted or detached during demonstrations. It also had '
      + 'very small pins that we forced standard jumper wires into, so the wires would touch '
      + 'each other and short out the readings. The GSR performed reliably, though its raw '
      + 'output would need to be translated into something meaningful for the user. The '
      + 'micro-USB port on the Nano also disconnected frequently, cutting readings mid-demo.',
  },
  {
    heading: 'Prototype vs. Design',
    prefix: 'compare',
    sub: true,
    body: 'Most of the prototype\'s limitations come from the substituted parts rather than '
      + 'the design itself. Separate IMUs positioned across the joint measure angle '
      + 'directly, avoiding the alignment and attachment problems of a single flex sensor. '
      + 'A dedicated hydration sensor measuring electrolytes gives a more directly '
      + 'interpretable output than the GSR\'s general skin conductance. And onboard '
      + 'Bluetooth and PCB remove the Nano and its faulty port entirely.',
  },
]

// The solution's paragraphs each take one photo beside them, in filename order:
// solution-1 goes with the first paragraph, solution-2 with the second, and so
// on. A paragraph with no photo yet simply sits centred.
// Keyed by the number in the filename rather than by position, so solution-2
// sits beside the second paragraph whether or not solution-1 exists yet.
const SOLUTION_PHOTOS = Object.fromEntries(
  named('solution').map((photo) => [Number(photo.split('/').pop().match(/solution-(\d+)/i)?.[1]), photo]),
)

// The render of the model itself, shown large under the heading rather than
// tucked in beside a paragraph. Name it `model-…` to put it here.
const MODEL = named('model')[0]

// ---- Assembly ---------------------------------------------------------------
const claimed = new Set([...SECTIONS.flatMap(({ prefix }) => named(prefix)), ...named('model')])

// Photos whose names match no section still have somewhere to go, rather than
// being dropped silently for the sake of a tidy rule.
const spare = PHOTOS.filter((p) => !claimed.has(p))

let photoRow = 0
const BANDS = [
  ...SECTIONS.map((section) => ({
    ...section,
    // the solution lays its own photos out one per paragraph, below
    photos: section.heading === 'The Solution' || section.title ? [] : named(section.prefix),
    layout: 'carousel',
  })),
  ...(spare.length ? [{ heading: 'More', body: '', photos: spare, layout: 'carousel' }] : []),
]
  // A heading introduces the sub-sections beneath it, so it is dropped along
  // with them while they are still empty — otherwise an unwritten section
  // announces itself with a heading and then nothing.
  .filter((section, i, all) => {
    if (!section.title) return section.photos.length || section.body
    return all.slice(i + 1)
      .filter((next) => next.sub)
      .some((next) => next.photos.length || next.body)
  })
  .map((section) => ({
    ...section,
    flip: section.photos.length ? photoRow++ % 2 === 1 : false,
  }))

export default function SmartKinesiologyTape() {
  const titleOpacity = useFadeIn(100)
  const introOpacity = useFadeIn(600)

  return (
    <div style={{ background: 'var(--bg)', color: 'var(--text)', fontFamily: 'system-ui' }}>

      {/* ---- Title ---- */}
      <div style={{
        height: 'var(--screen)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '0 24px',
      }}>
        <h1 style={{
          fontSize: TYPE.pageTitle,
          fontWeight: 'bold',
          letterSpacing: '0.01em',
          marginBottom: 24,
          opacity: titleOpacity,
          transition: 'opacity 1.5s ease',
        }}>
          Smart Kinesiology Tape
        </h1>
        <p className="page-intro-line" style={{
          fontSize: TYPE.lead,
          lineHeight: 1.7,
          color: 'var(--text-body)',
          opacity: introOpacity,
          transition: 'opacity 1.5s ease',
        }}>
          {describe('smart-kinesiology-tape')
            || <span style={{ color: 'var(--text-muted)' }}>(Coming Soon!)</span>}
        </p>
      </div>

      {BANDS.map((section) => {
        // The solution is the one section that shows the finished thing, so it
        // is laid out by hand: the render straight under the heading, then each
        // paragraph with its own photo alongside, sides alternating.
        if (section.heading === 'The Solution') {
          return (
            <Fragment key={section.heading}>
              <SectionTitle tight>{section.heading}</SectionTitle>
              {MODEL && <FeatureImage src={MODEL} alt="The smart kinesiology tape model" />}
              {section.body.map(([heading, paragraph], i) => (
                <SplitRow
                  key={heading}
                  heading={heading}
                  body={paragraph}
                  photo={SOLUTION_PHOTOS[i + 1]}
                  alt={`The solution — ${i + 1} of ${section.body.length}`}
                  flip={i % 2 === 1}
                />
              ))}
            </Fragment>
          )
        }
        if (section.title) return <SectionTitle key={section.heading}>{section.heading}</SectionTitle>
        return <PhotoSection key={section.heading} {...section} />
      })}

    </div>
  )
}
