// src/components/ProjectBubbles.jsx
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Gamepad2 } from 'lucide-react'
import useFadeIn from '../hooks/useFadeIn'
import { accessibility, clashRoyale, convenience, misc, bubbleProjects } from '../data/projects'
import useIsPhone, { useIsShort } from '../hooks/useIsPhone'

// Hand-placed as two arcs — one above the hero title, one below — plus a pair
// flanking it, so the bubbles gather toward the middle of the page instead of
// hugging the corners. `left`/`top` are the bubble's centre point.
//
// The title is the constraint on how far in they can come. It is a fixed pixel
// width, so it takes up a *larger share* of a narrow window: percentage-placed
// entries need their full diameter outside a keep-out of roughly 18%–82%
// across and 40%–60% down. Staying out of that band vertically is what buys
// the freedom to sit near the centre horizontally.
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

const TINTS = ['var(--card-1)', 'var(--card-2)', 'var(--card-3)', 'var(--card-4)', 'var(--card-5)', 'var(--card-6)']

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
const ALWAYS = bubbleProjects.filter((project) => ALWAYS_PATHS.includes(project.path))

const QUOTAS = [
  { group: accessibility, take: accessibility.length },   // always all of them
  { group: clashRoyale, take: 2 },
  { group: convenience, take: 2 },
  // One Miscellaneous project always appears; which one is random. Its cap below
  // is also 1, so the quota fills that slot and the leftovers cannot add more.
  { group: misc, take: 1 },
]

// Hard ceiling on how many bubbles a group may occupy in total — quota picks
// included, not just the leftover slots. Without a ceiling a group's quota is a
// floor only, since the leftover slots can keep drawing from it.
const GROUP_CAPS = [
  { group: clashRoyale, max: 2 },
  { group: misc, max: 1 },
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
  for (const project of shuffled(eligible([...bubbleProjects, ...misc]))) {
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

  return (
    <div
      className="bubble-layer"
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
              className={project.photo ? 'bubble bubble-photo' : 'bubble'}
              title={project.label}
              aria-label={project.label}
              style={{
                '--drift-x': `${spot.drift[0]}px`,
                '--drift-y': `${spot.drift[1]}px`,
                // Breathe between 8% and 12% larger, cycling at ~0.72x the drift
                // period so the two never stay in step.
                '--pulse': 1.08 + (i % 3) * 0.02,
                animationDuration: `${spot.duration}s, ${(spot.duration * 0.72).toFixed(1)}s`,
                animationDelay: `${spot.delay}s, ${(spot.delay - 2.5).toFixed(1)}s`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100%',
                height: '100%',
                borderRadius: '50%',
                overflow: 'hidden',
                background: TINTS[i % TINTS.length],
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
                      // the model centred, so fitting the whole frame inside a
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
            </Link>
          </div>
        )
      })}
    </div>
  )
}
