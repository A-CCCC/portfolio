// src/components/loading-curve.js
//
// How far along a loading bar claims to be, at a given moment. It is lying.
//
// Real progress bars are optimistic and then stall; this one is optimistic,
// stalls, and then thinks better of it — 99% before you have read the word
// "loading", a moment of confidence, then a slow retreat, and finally the snap
// to 100% that makes the whole thing pointless. Five seconds either way.
//
// The retreat gives back about a fifth of the bar. Further than that and it
// stops reading as a bar losing confidence and starts reading as one that was
// reset — and the joke is the losing of confidence.
//
// Kept apart from the component that draws it because the shape is the joke,
// and a shape can be checked: scripts/test-loading.mjs does.
//
// Each point is a time in milliseconds and the percentage claimed at it; in
// between, the bar moves evenly from one to the next.
export const CURVE = [
  { at: 0, claims: 0 },
  { at: 320, claims: 99 },        // straight there, as if it were already done
  { at: 1450, claims: 99 },       // and a beat of standing very still
  { at: 2200, claims: 97 },       // ...
  { at: 4500, claims: 81 },       // the long apology, though only as far as 81
  { at: 4700, claims: 83 },       // a stumble on the way back
  { at: 5000, claims: 100 },      // and then, without explanation, done
]

export const TOTAL = CURVE[CURVE.length - 1].at

// The first leg is the only one with any hurry in it, so it is the only one
// eased: it arrives at 99 rather than running into it.
const easeOut = (t) => 1 - (1 - t) ** 3

export const percentAt = (ms) => {
  if (!(ms > 0)) return 0
  if (ms >= TOTAL) return 100

  for (let i = 1; i < CURVE.length; i += 1) {
    const from = CURVE[i - 1]
    const to = CURVE[i]
    if (ms > to.at) continue
    const span = to.at - from.at
    const t = span > 0 ? (ms - from.at) / span : 1
    const eased = i === 1 ? easeOut(t) : t
    return from.claims + (to.claims - from.claims) * eased
  }
  return 100
}

// What it reckons is left, which is the other half of the lie. Real estimates
// do this — a minute, then an hour, then a minute again — because they divide
// what is left by how fast the last moment went, and a moment that went
// backwards divides badly. This one just says so out loud, and swells while the
// bar retreats: by the time it is at its lowest it is talking about weeks.
//
// Each line is the time it starts being said. Steps rather than a slide: an
// estimate that counted smoothly down would be an estimate somebody trusted.
export const ESTIMATES = [
  { at: 0, says: 'Estimating time remaining' },
  { at: 500, says: 'Less than a minute remaining' },
  { at: 1450, says: 'About 2 minutes remaining' },
  { at: 1950, says: 'About 17 minutes remaining' },
  { at: 2450, says: 'About 1 hour remaining' },
  { at: 2950, says: 'About 4 hours remaining' },
  { at: 3300, says: 'About 40 minutes remaining' },   // a moment of hope
  { at: 3650, says: 'About 11 hours remaining' },
  { at: 4050, says: 'About 3 days remaining' },
  { at: 4400, says: 'About 6 weeks remaining' },
  { at: 4750, says: 'Less than a minute remaining' },
  { at: TOTAL, says: '' },
]

export const estimateAt = (ms) => {
  let says = ESTIMATES[0].says
  for (const line of ESTIMATES) {
    if (ms >= line.at) says = line.says
    else break
  }
  return says
}
