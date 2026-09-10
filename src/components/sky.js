// src/components/sky.js
//
// The backdrop behind both hidden games. Clash Royale's arenas have no sky —
// the board is lit from above and the surround is dark — so this follows the
// promotional art instead, where the sky is a saturated cyan going pale at the
// horizon and the clouds are boxes: cubes with their corners rounded far enough
// to read as soft, stacked into a shape with flat sides and a flat base. Round
// puffs are the wrong game; these are square things drawn softly.
//
// Dark mode takes the same sky down to night rather than switching to some
// other idea, for the same reason the grass does.

// Clouds live on a band that repeats, so the sky can scroll for ever without a
// seam. Positions are fractions: x along the band, y down the sky, and r of the
// play area's width rather than its height — a tall narrow sky is still seen
// through the same width of window, and sizing clouds off its height made them
// swallow the portrait game whole.
const BAND = 1000
const DRIFT = 0.18          // of the world's speed, so the sky sits well back

// `fade` is how solid the whole cloud is. Real skies are not uniform — some of
// what is up there has almost gone — so a few of these are barely there, which
// also stops the repeat of the band from being obvious.
const CLOUDS = [
  { x: 0.04, y: 0.22, r: 0.20, shape: 0, fade: 1 },
  { x: 0.21, y: 0.09, r: 0.13, shape: 1, fade: 0.42 },
  { x: 0.37, y: 0.30, r: 0.16, shape: 2, fade: 0.78 },
  { x: 0.53, y: 0.14, r: 0.22, shape: 1, fade: 1 },
  { x: 0.68, y: 0.34, r: 0.12, shape: 0, fade: 0.22 },
  { x: 0.79, y: 0.17, r: 0.18, shape: 2, fade: 0.62 },
  { x: 0.92, y: 0.27, r: 0.14, shape: 1, fade: 0.34 },
]

// Each cloud is a few boxes sharing one base line: [centre, width, height], in
// units of the cloud's own size. Stacking boxes of different heights on a common
// floor is what gives the blocky, stepped top and the flat underside.
const BASE = 0.55
const ROUND = 0.30          // corner radius, of the shorter side of each box
const SHAPES = [
  [[-0.86, 1.05, 0.72], [0.02, 1.34, 1.16], [0.92, 0.92, 0.60]],
  [[-1.12, 0.86, 0.58], [-0.36, 1.20, 0.98], [0.54, 1.16, 0.78], [1.32, 0.74, 0.50]],
  [[-0.62, 1.16, 0.88], [0.52, 1.28, 1.06]],
]

// One cloud's outline. Every box goes into a single path, so where they overlap
// there is no seam and the whole thing fills as one shape.
const puff = (ctx, cx, cy, r, shape) => {
  ctx.beginPath()
  SHAPES[shape % SHAPES.length].forEach(([dx, bw, bh]) => {
    const w = bw * r
    const h = bh * r
    const x = cx + dx * r - w / 2
    const y = cy + BASE * r - h
    if (ctx.roundRect) ctx.roundRect(x, y, w, h, Math.min(w, h) * ROUND)
    else ctx.rect(x, y, w, h)
  })
  ctx.fill()
}

// A cloud thins out into the sky rather than stopping at a line, so each one is
// drawn softly, with a wider, fainter copy behind it that fades further out.
// Doing that sixty times a second would be wasteful, so each cloud is built once
// into its own little canvas and stamped from then on. There are only a handful
// of sizes and they never change, so the cache stays tiny; the colours are in
// the key, which is what redraws them when the theme turns over.
const cache = new Map()

const stamp = (r, shape, cloud, shade) => {
  const key = `${shape}|${Math.round(r)}|${cloud}|${shade}`
  const had = cache.get(key)
  if (had) return had

  const half = Math.ceil(r * 3.4)
  const canvas = document.createElement('canvas')
  canvas.width = half * 2
  canvas.height = half * 2
  const c = canvas.getContext('2d')
  const soft = 'filter' in c

  // Built outwards in: a wisp thrown wide and nearly gone, a halo inside that,
  // then the shaded underside and a crisp body on top. The body carries almost
  // no blur at all, so the cube stays sharp while the air around it does the
  // fading — which is what a cloud actually looks like at its edge.
  c.fillStyle = cloud
  if (soft) c.filter = `blur(${(r * 0.42).toFixed(2)}px)`
  c.globalAlpha = 0.12
  puff(c, half, half, r * 1.20, shape)

  if (soft) c.filter = `blur(${(r * 0.17).toFixed(2)}px)`
  c.globalAlpha = 0.24
  puff(c, half, half, r * 1.05, shape)

  c.globalAlpha = 1
  if (soft) c.filter = `blur(${(r * 0.015).toFixed(2)}px)`
  c.fillStyle = shade
  puff(c, half, half + r * 0.16, r, shape)
  c.fillStyle = cloud
  puff(c, half, half, r * 0.96, shape)

  if (cache.size > 48) cache.clear()      // a theme flipped back and forth
  const made = { canvas, half }
  cache.set(key, made)
  return made
}

// Fills `top` to `bottom` with sky, then drifts the clouds across it. `offset`
// is the world's own scroll, slowed here so the sky reads as far away.
export default function drawSky(ctx, width, top, bottom, offset, high, low, cloud, shade) {
  const h = bottom - top

  const wash = ctx.createLinearGradient(0, top, 0, bottom)
  wash.addColorStop(0, high)
  wash.addColorStop(1, low)
  ctx.fillStyle = wash
  ctx.fillRect(0, top, width, h)

  // Capped by the sky's own height, so a short wide strip does not get clouds
  // taller than it has room for.
  const scale = Math.min(width * 0.31, h)
  const shift = ((offset * DRIFT) % BAND + BAND) % BAND
  ctx.save()
  ctx.beginPath()
  ctx.rect(0, top, width, h)
  ctx.clip()
  // Two copies of the band, so one is always covering the gap the other leaves.
  for (let copy = -1; copy <= Math.ceil(width / BAND); copy += 1) {
    CLOUDS.forEach((c) => {
      const x = c.x * BAND + copy * BAND - shift
      if (x < -BAND * 0.3 || x > width + BAND * 0.3) return
      const made = stamp(c.r * scale, c.shape, cloud, shade)
      ctx.globalAlpha = c.fade
      ctx.drawImage(made.canvas, x - made.half, top + c.y * h - made.half)
      ctx.globalAlpha = 1
    })
  }
  ctx.restore()
}
