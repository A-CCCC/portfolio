// src/components/grass.js
//
// The ground under both hidden games: Clash Royale's chequered grass. The board
// there is three-dimensional and the squares are diamonds; seen flat on, as
// these games are, the pattern is squares in two greens and nothing more.
//
// Shared because the two games want the same ground and neither owns it.

export const SQUARE = 25          // one tile, in play-area units

// Draws the band from `top` down to `bottom`, scrolled left by `offset` so the
// ground moves with the world. Two rows minimum, or the alternation only runs
// one way and reads as stripes rather than a chequerboard.
export default function drawGrass(ctx, width, top, bottom, offset, a, b, square = SQUARE) {
  const rows = Math.max(2, Math.ceil((bottom - top) / square))
  const size = (bottom - top) / rows
  // Whole tiles either side of the edges, so nothing pops as it scrolls in.
  const shift = ((offset % (square * 2)) + square * 2) % (square * 2)

  for (let row = 0; row < rows; row += 1) {
    const y = top + row * size
    const h = Math.min(size, bottom - y)
    for (let i = -2; i * square - shift < width + square; i += 1) {
      const x = i * square - shift
      ctx.fillStyle = (i + row) % 2 === 0 ? a : b
      ctx.fillRect(x, y, square + 1, h + 1)      // the extra pixel closes seams
    }
  }
}
