// src/components/ProjectBubbles.jsx
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link, useNavigate } from 'react-router-dom'
import { Gamepad2 } from 'lucide-react'
import useFadeIn from '../hooks/useFadeIn'
import { accessibility, clashRoyale, convenience, halloween, misc, bubbleProjects } from '../data/projects'
import useIsPhone, { useIsShort } from '../hooks/useIsPhone'

// Hand-placed as two arcs — one above the hero title, one below — plus a pair
// flanking it, so the bubbles gather toward the middle of the page instead of
// hugging the corners. `left`/`top` are the bubble's center point.
//
// The title is the constraint on how far in they can come. It is a fixed pixel
// width, so it takes up a *larger share* of a narrow window: percentage-placed
// entries need their full diameter outside a keep-out of roughly 18%–82%
// across and 40%–60% down. Staying out of that band vertically is what buys
// the freedom to sit near the center horizontally.
//
// `drift` is how far it wanders (px) and `duration` how long one loop takes;
// `delay` is negative so every bubble starts mid-cycle and they never sync up.
//
// Keep at least one entry per project: the lookup wraps, so a project past the
// end of this list would sit exactly on top of an earlier bubble. Entries
// alternate above/below so the staggered fade-in spreads across the screen.
// The bubbles ring the title in an oval. Positions are computed rather than
// hand-placed so the count and the shape stay easy to change.
//
// The horizontal radius is part-percentage, part-pixel: `26% + 140px` puts the
// leftmost and rightmost bubbles just outside the middle of the gutter beside
// the title. The `min(..., 50% - 110px)` caps it on a narrow window, where that
// radius plus the bubble's own size, drift and pulse would otherwise carry it
// past the edge of the screen. On a wide window the cap never binds.
// The reserve grew with the bubbles: it has to cover the largest radius plus
// its pulse plus its drift.
// That matters because the title is a fixed 510px wide — a purely percentage
// radius would shrink into the text as the window narrows, while a purely pixel
// one would not open up on a wide screen.
//
// The vertical radius is a plain percentage of the hero, so the top and bottom
// of the oval land at 18% and 82% down.
const RING_COUNT = 8
const RING_RY = 33            // % of hero height — a wider oval spaces the ring out
const RING_START = -90        // deg — first bubble sits at the top

// Evenly spaced, and left that way. The ring used to carry a fixed nudge per
// bubble — a few degrees round, a percent or two out — to keep it from reading
// as stamped out. The drift below does that job better: it is movement rather
// than an arrangement, so the ring is never caught in one shape, and the even
// spacing underneath it is what the eye settles on.
//
// Sizes still vary. That is not where the bubbles are, and eight of one size
// would read as a diagram.
const SIZES = [116, 103, 121, 108, 99, 116, 105, 112]

// Bigger, faster wander than the original drift — cycled so neighbours never
// move or breathe in step.
const DRIFTS = [[24, -20], [-22, 25], [19, 27], [-26, -18], [28, -22], [-18, 26], [22, 20], [-24, -24]]
const DURATIONS = [13, 11, 15, 10, 14, 12, 16, 11]
const DELAYS = [-2, -6, -9, -4, -11, -1, -7, -3]

// A phone gets the same ring, drawn smaller. It used to get nothing at all —
// at full size the bubbles had to be hidden to keep them off a title that was
// then a fixed 510px wide, which left the opening screen empty. The title
// shrinks with the window now, and the pair that sits level with it is already
// hidden below 900px, so what is left has the length of the screen to spread
// down and room either side of the words.
// Six rather than eight, and spaced for six. A phone cannot show the pair that
// sits level with the title — there is no room beside the words — and dropping
// two out of a ring of eight leaves a gap the width of two at each side, which
// reads as two clusters with the title stranded between them. Six placed for six
// closes evenly around it: one above, one below, and a pair down each side clear
// of the text.
const PHONE_RING_COUNT = 6
const PHONE_SIZE = 0.5          // of each bubble's own size
const PHONE_RING_RY = 36        // % of hero height — a taller oval on a tall screen

// A phone on its side is the one shape a ring cannot be drawn in. The title
// takes the middle of a 390px-tall screen and the navbar the top of it, which
// leaves two bands — one above the words, one below — and no room at all at the
// sides of them. So the bubbles line up in those bands instead: three across the
// top, three across the bottom, in an order that keeps the staggered fade from
// sweeping along one row and then the other.
//
// Positions are the share of the ring's own reach across, and of the hero's
// height down.
// Smaller here than a phone held upright, and the two bands pushed further
// apart: the title has a link under it now, and on a 390px screen the navbar,
// the words and two rows of bubbles are all asking for the same height.
const SHORT_SIZE = 0.42
const LANDSCAPE = [
  [-0.78, 0.26], [0.78, 0.78], [0, 0.26],
  [-0.78, 0.78], [0.78, 0.26], [0, 0.78],
]

const lieDown = () => LANDSCAPE.map(([across, down], i) => ({
  // Kept further off the edge than the ring is: these sit at the full reach
  // rather than somewhere round a curve.
  left: `calc(50% + min(26% + 140px, 50% - 80px) * ${across.toFixed(2)})`,
  top: `${(down * 100).toFixed(0)}%`,
  size: Math.round(SIZES[i % SIZES.length] * SHORT_SIZE),
  drift: DRIFTS[i % DRIFTS.length].map((d) => Math.round(d * SHORT_SIZE)),
  duration: DURATIONS[i % DURATIONS.length],
  delay: DELAYS[i % DELAYS.length],
  // Nothing here is level with the title, so nothing has to stand down for it.
  flank: false,
}))

const place = (phone) => Array.from({ length: phone ? PHONE_RING_COUNT : RING_COUNT }, (_, i) => {
  const count = phone ? PHONE_RING_COUNT : RING_COUNT
  const baseDeg = RING_START + (360 / count) * i
  const angle = (baseDeg * Math.PI) / 180
  const cos = Math.cos(angle)
  const sin = Math.sin(angle)

  // The cap on the horizontal radius covers the bubble's own half-width plus
  // the wander and the pulse, so nothing reaches the edge of the screen.
  const reach = phone ? '50% - 46px' : '50% - 110px'
  const scale = phone ? PHONE_SIZE : 1

  return {
    left: `calc(50% + min(26% + 140px, ${reach}) * ${cos.toFixed(4)})`,
    top: `calc(50% + ${phone ? PHONE_RING_RY : RING_RY}% * ${sin.toFixed(4)})`,
    size: Math.round(SIZES[i % SIZES.length] * scale),
    drift: DRIFTS[i % DRIFTS.length].map((d) => Math.round(d * scale)),
    duration: DURATIONS[i % DURATIONS.length],
    delay: DELAYS[i % DELAYS.length],
    // The pair sitting level with the title, which is hidden on a window too
    // narrow to hold both them and the words.
    flank: Math.abs(cos) > 0.9,
  }
})

const PLACEMENTS = place(false)
const PHONE_PLACEMENTS = place(true)
const SHORT_PLACEMENTS = lieDown()

const HUES = ['var(--hue-1)', 'var(--hue-2)', 'var(--hue-3)', 'var(--hue-4)', 'var(--hue-5)', 'var(--hue-6)']

// Which projects get a bubble, re-rolled on every page load.
//
// The cast is not a free-for-all: both Accessibility projects always appear,
// then two at random from Clash Royale and two from Convenience, and whatever
// slots remain are filled from everything left over. The result is shuffled at
// the end so the guaranteed picks do not always land in the same bubbles.
//
// Miscellaneous projects are eligible for those leftover slots but capped at one
// per draw, so they can show up without crowding out the rest.
// Individual projects pinned into every draw. They still count toward their
// group's quota below, so pinning a Convenience project means one guaranteed
// plus one random rather than three Convenience bubbles in total.
// Rationed rather than dropped: a plainer model that the other Clash Royale
// pieces show up better than, so it turns up now and again instead of taking a
// slot every load. Everywhere else it is listed as normal.
// the-log: ['/projects/clash-royale/the-log'] — put the path back to ration a
// project again; the machinery below is unchanged and simply has nothing to
// pick while this is empty.
const RARE_PATHS = []
const RARE_CHANCE = 1 / 8      // roughly one page load in eight
const isRare = (project) => RARE_PATHS.includes(project.path)

// A way into the hidden games, turning up in a project's place now and again.
// Rare enough to be a find rather than a fixture: about one load in twelve, and
// then in whichever bubble the shuffle happens to give it.
const GAMES_BUBBLE = { path: '/games', label: 'Games', icon: true }
const GAMES_CHANCE = 1 / 12

const ALWAYS_PATHS = ['/solutions/convenience/backup-camera-wiper']
// The pop, in two beats: the bubble swells, then bursts — and from the
// burst the page dives into where it was, until the page is the project's.
const SWELL_MS = 150
const DIVE_MS = 580
// Where the shards of the burst fly: a handful, spread round the ring
const SHARDS = Array.from({ length: 10 }, (_, k) => ({ a: k * 36 + (k % 2) * 11, d: 1.3 + (k % 3) * 0.25 }))

const ALWAYS = bubbleProjects.filter((project) => ALWAYS_PATHS.includes(project.path))

// Only projects with a thumbnail can be a bubble. A project listed before its
// render exists shows on its hub as "coming soon" and nowhere here.
const shown = (list) => list.filter((project) => project.image)

const QUOTAS = [
  { group: shown(accessibility), take: shown(accessibility).length },   // always all of them
  { group: shown(clashRoyale), take: 2 },
  { group: shown(convenience), take: 2 },
  // One Miscellaneous project always appears; which one is random. Its cap below
  // is also 1, so the quota fills that slot and the leftovers cannot add more.
  { group: shown([...halloween, ...misc]), take: 1 },
]

// Hard ceiling on how many bubbles a group may occupy in total — quota picks
// included, not just the leftover slots. Without a ceiling a group's quota is a
// floor only, since the leftover slots can keep drawing from it.
const GROUP_CAPS = [
  { group: shown(clashRoyale), max: 2 },
  { group: shown([...halloween, ...misc]), max: 1 },
]

function shuffled(list) {
  const out = [...list]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

function drawCast(slots) {
  // Settled once per draw rather than per slot, so a rare project is either in
  // the running or it is not — asking separately for each slot would give it
  // several chances at the same page load. Drawn in with the pinned projects
  // when its turn comes up, which makes the odds of seeing it exactly the
  // chance above; leaving it merely eligible would mean also winning a slot
  // against the rest of its group, and it would show up far less often than
  // intended.
  const rationed = RARE_PATHS.length && Math.random() < RARE_CHANCE
    ? bubbleProjects.filter(isRare)
    : []
  const chosen = [...ALWAYS, ...rationed]
  // Out of the running entirely on the loads it does not appear on, so it can
  // reach neither a quota nor a leftover slot.
  const eligible = (list) => (rationed.length ? list : list.filter((p) => !isRare(p)))

  for (const { group, take } of QUOTAS) {
    // A pinned project already fills part of its group's quota, so only top up
    // the difference — otherwise pinning one would add an extra bubble.
    const already = group.filter((p) => chosen.includes(p)).length
    const need = Math.max(0, take - already)
    // Drawn without replacement, so a project can never occupy two bubbles.
    chosen.push(...shuffled(eligible(group)).filter((p) => !chosen.includes(p)).slice(0, need))
  }

  // Leftover slots draw from everything not already picked, Miscellaneous
  // included — subject to the caps above.
  for (const project of shuffled(eligible(shown([...bubbleProjects, ...halloween, ...misc])))) {
    if (chosen.length >= slots) break
    if (chosen.includes(project)) continue

    // Counted against everything already chosen, so a group's quota picks
    // count toward its cap rather than sitting on top of it.
    const cap = GROUP_CAPS.find(({ group }) => group.includes(project))
    if (cap && chosen.filter((p) => cap.group.includes(p)).length >= cap.max) continue

    chosen.push(project)
  }

  const cast = shuffled(chosen).slice(0, slots)

  // Takes a slot rather than adding one, so the ring keeps its shape. Rolled
  // after the draw, so which project it displaces is down to the shuffle.
  if (Math.random() < GAMES_CHANCE) {
    cast[Math.floor(Math.random() * cast.length)] = GAMES_BUBBLE
  }
  return cast
}

// Stand-in shown until a thumbnail is added — "Skeleton Barrel" becomes "SB".
function initials(label) {
  return label
    .split(' ')
    .filter((word) => /[A-Za-z0-9]/.test(word[0]))
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join('')
}

export default function ProjectBubbles() {
  // Starts after the hero title has begun settling, so the text reads first.
  const visible = useFadeIn(1200)
  const phone = useIsPhone()
  const short = useIsShort()
  // Short wins: a phone held sideways is both, and it is the missing height
  // that decides what can go where.
  const placements = short ? SHORT_PLACEMENTS : phone ? PHONE_PLACEMENTS : PLACEMENTS

  // Drawn once and held in state: recomputing on render would reshuffle the
  // bubbles mid-animation every time anything on the page updated. A phone has
  // fewer places to put one, so a window crossing that width is the one thing
  // that draws again — and only then, or a resize would keep reshuffling.
  const slots = placements.length
  const [cast, setCast] = useState(() => drawCast(slots))
  const drawnFor = useRef(slots)

  useEffect(() => {
    if (drawnFor.current === slots) return
    drawnFor.current = slots
    setCast(drawCast(slots))
  }, [slots])

  // A click pops the bubble: the glass bursts, the project inside comes up
  // to the eye and the page fades under it, and then the page is the
  // project's. A modified click (a new tab) and a reader with motion turned
  // down get the link as it is.
  // Each bubble's float and breath, started on the element itself with the
  // numbers written in, so the browser can run them on the compositor and
  // the page is not restyled every frame. Paused while the pointer rests
  // on the bubble, so it is easy to click. Off for anyone with motion
  // turned down.
  const float = (spot, i) => (el) => {
    if (!el || el.__floating) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    el.__floating = true
    const pulse = 1.08 + (i % 3) * 0.02
    // The breath (8–12% larger) rides on the float as one transform
    // animation, at ~0.72x the drift period so the two never stay in step:
    // the drift's cycle is sampled at the breath's beats and the two are
    // written into one set of keyframes. Two animations on one property
    // family can keep each other off the compositor; one cannot.
    const D = spot.duration * 1000
    const B = spot.duration * 720
    const steps = 48
    const frames = []
    for (let k = 0; k <= steps; k += 1) {
      const t = k / steps                       // of one breath cycle
      const ms = t * B
      const dPhase = ((ms + (spot.delay - (spot.delay - 2.5)) * 1000) % D) / D
      const dx = spot.drift[0] * (0.5 - 0.5 * Math.cos(dPhase * 2 * Math.PI))
      const dy = spot.drift[1] * (0.5 - 0.5 * Math.cos(dPhase * 2 * Math.PI))
      const sc = 1 + (pulse - 1) * (0.5 - 0.5 * Math.cos(t * 2 * Math.PI))
      frames.push({ transform: `translate3d(${dx.toFixed(2)}px, ${dy.toFixed(2)}px, 0) scale(${sc.toFixed(4)})` })
    }
    // the breath's cycle and the drift's share a period only every so
    // often; the keyframes cover one breath, and the drift is restated
    // from where it was, which the eye does not catch at this pace
    const motion = el.animate(frames, { duration: B, delay: (spot.delay - 2.5) * 1000, iterations: Infinity, easing: 'linear' })
    el.addEventListener('mouseenter', () => motion.pause())
    el.addEventListener('mouseleave', () => motion.play())
  }

  const navigate = useNavigate()
  const [swelling, setSwelling] = useState(null)
  const [popping, setPopping] = useState(null)
  const [popHue, setPopHue] = useState(null)
  const pop = (e, path, hue) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    e.preventDefault()
    if (swelling) return
    const bubble = e.currentTarget
    setSwelling(path)
    setPopHue(hue)
    setTimeout(() => {
      setPopping(path)
      // The page dives into the bubble: the page's own root element (the
      // one under #root — the bar and the switch are fixed beside it and
      // stay put) scaled up about the bubble's centre.
      const page = bubble.closest('#root > *')
      const r = bubble.getBoundingClientRect()
      const pr = page.getBoundingClientRect()
      const cx = r.left + r.width / 2
      const cy = r.top + r.height / 2
      page.style.setProperty('--dive-x', `${cx - pr.left}px`)
      page.style.setProperty('--dive-y', `${cy - pr.top}px`)
      // and slides so the bubble ends up in the middle of the screen, so
      // what grows in it stays in view
      page.style.setProperty('--dive-dx', `${window.innerWidth / 2 - cx}px`)
      page.style.setProperty('--dive-dy', `${window.innerHeight / 2 - cy}px`)
      page.classList.add('page-diving')
      document.documentElement.classList.add('diving')
    }, SWELL_MS)
    setTimeout(() => {
      document.documentElement.classList.remove('diving')
      // The colour stays over the new page for a moment and clears, so the
      // page arrives out of the bubble's colour rather than cutting from it.
      const after = document.createElement('div')
      after.className = 'bubble-veil-out'
      after.style.setProperty('--pop-hue', hue)
      document.body.appendChild(after)
      setTimeout(() => after.remove(), 500)
      navigate(path)
    }, SWELL_MS + DIVE_MS)
  }

  return (
    <>
    {popping && createPortal(<div className="bubble-veil" aria-hidden="true" style={{ '--pop-hue': popHue }} />, document.body)}
    <div
      className={`bubble-layer${popping ? ' bubble-layer-popping' : ''}`}
      aria-hidden={visible ? undefined : 'true'}
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        zIndex: 0,
        // The layer itself never swallows clicks; only the bubbles do.
        pointerEvents: 'none',
      }}
    >
      {cast.map((project, i) => {
        const spot = placements[i]
        // For the one frame between a layout change and the redraw for it,
        // the cast can be longer than the new set of spots. Nothing to stand
        // on, nothing drawn.
        if (!spot) return null

        return (
          <div
            key={project.path}
            className={spot.flank ? 'bubble-flank' : undefined}
            style={{
              position: 'absolute',
              left: spot.left,
              top: spot.top,
              width: spot.size,
              height: spot.size,
              // Positioning transform lives here so the float animation on the
              // child has the transform property to itself.
              transform: 'translate(-50%, -50%)',
              opacity: visible,
              transition: 'opacity 1.6s ease',
              transitionDelay: `${i * 90}ms`,
            }}
          >
            <Link
              to={project.path}
              onClick={(e) => pop(e, project.path, HUES[i % HUES.length])}
              className={[
                'glass bubble',
                project.photo ? 'bubble-photo' : '',
                swelling === project.path ? 'bubble-swelling' : '',
                popping === project.path ? 'bubble-popping' : '',
              ].filter(Boolean).join(' ')}
              title={project.label}
              aria-label={project.label}
              // The float and the breath, as animations with their values
              // written in (see Float): a keyframe that reads a variable
              // runs on the main thread and recomputes the page's style
              // every frame, and these ran all day on the front page.
              ref={float(spot, i)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100%',
                height: '100%',
                borderRadius: '50%',
                overflow: 'hidden',
                // The tint is handed to the glass — a background set here would
                // paint over it.
                '--lg-hue': HUES[i % HUES.length],
                color: 'var(--text)',
                textDecoration: 'none',
                pointerEvents: 'auto',
              }}
            >
              {project.icon
                ? <Gamepad2
                    size={spot.size * 0.42}
                    strokeWidth={1.5}
                    style={{ opacity: 0.55 }}
                    aria-hidden="true"
                  />
                : project.image
                ? <img
                    // The small variant: a bubble is never wider than about 140px, so the
              // full-size thumbnail would be eight oversized downloads on the
              // page a visitor sees first. See scripts/make-thumbnail.py.
              src={project.image.replace('.webp', '-small.webp')}
                    alt=""
                    style={{
                      width: '100%',
                      height: '100%',
                      // `cover` rather than `contain`: the renders are 5:4 with
                      // the model centered, so fitting the whole frame inside a
                      // circle wastes the space on the empty side margins.
                      // Covering crops those margins and lets the model fill
                      // the bubble; the circle clips the rest.
                      objectFit: 'cover',
                    }}
                  />
                : <span style={{
                    fontSize: spot.size * 0.26,
                    fontWeight: 600,
                    letterSpacing: '-0.02em',
                    opacity: 0.45,
                  }}>
                    {initials(project.label)}
                  </span>
              }
              {popping === project.path && SHARDS.map((sh, k) => (
                <i key={k} className="bubble-shard" aria-hidden="true"
                  style={{ '--a': `${sh.a}deg`, '--r': `${spot.size / 2}px`, '--d': sh.d }} />
              ))}
            </Link>
          </div>
        )
      })}
    </div>
    </>
  )
}
