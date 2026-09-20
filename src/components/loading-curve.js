// src/components/loading-curve.js
//
// How far along a loading bar claims to be, at a given moment. It is lying.
//
// Real progress bars are optimistic and then stall; this one is optimistic,
// stalls, and then thinks better of it — 99% before you have read the word
// "loading", a moment of confidence, then a long slow retreat, and finally the
// snap to 100% that makes the whole thing pointless. Five seconds either way.
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
  { at: 2200, claims: 96 },       // ...
  { at: 4500, claims: 58 },       // the long apology
  { at: 4700, claims: 61 },       // a stumble on the way back
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
