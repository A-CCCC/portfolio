// src/components/snake-rules.js
//
// The rules of the snake, with nothing drawn and nothing on screen: a board, a
// snake, a model sitting on a square, and what happens on the step after that.
// Separate from the component because a game loop runs on animation frames,
// which do not run in a headless browser — so this is the part that can be
// tested, and scripts/test-snake.mjs does.
//
// The blocks and their colours are kept apart on purpose. The blocks travel and
// the colours do not: a colour belongs to a place along the snake's length —
// the head, the one behind it, and so on to the tail — so a model eaten adds a
// band at the tail and the bands stay put as the body flows through them.
// Carried on the blocks themselves, each step would hand every colour back one
// place and the oldest would fall off the end.
export const COLS = 17
export const ROWS = 15

export const HEADINGS = {
  up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0],
}
export const OPPOSITE = { up: 'down', down: 'up', left: 'right', right: 'left' }

export const newSnake = () => [{ x: 8, y: 7 }, { x: 7, y: 7 }, { x: 6, y: 7 }]

export const newGame = (base, way) => ({
  snake: newSnake(),
  colours: [base, base, base],
  // Left is ignored when starting: the snake lies along that line already and
  // would set off through itself.
  heading: way && way !== 'left' ? way : 'right',
  asked: [],
  food: null,
  score: 0,
  since: 0,
  dying: 0,
  over: false,
})

// Somewhere free to put the next model, and a different model from the one just
// eaten. Counting the empty squares first means never guessing repeatedly on a
// crowded board.
export const placeFood = (game, models, random = Math.random) => {
  const taken = new Set(game.snake.map((cell) => `${cell.x},${cell.y}`))
  const free = []
  for (let y = 0; y < ROWS; y += 1) {
    for (let x = 0; x < COLS; x += 1) if (!taken.has(`${x},${y}`)) free.push({ x, y })
  }
  if (!free.length) return
  const spot = free[Math.floor(random() * free.length)]
  const choices = models.filter((model) => model !== game.food?.model)
  const model = choices[Math.floor(random() * choices.length)] ?? models[0]
  game.food = { ...spot, model }
}

// A turn asked for, which is answered on the next step. Queued rather than
// applied: two keys inside one step would otherwise let the snake double back
// through its own neck.
export const ask = (game, way) => {
  const last = game.asked.length ? game.asked[game.asked.length - 1] : game.heading
  if (way === last || way === OPPOSITE[last]) return
  if (game.asked.length < 2) game.asked.push(way)
}

// One square forward. Returns what happened, so the caller can count a score,
// start a death, or put out another model.
export const step = (game, models, random = Math.random) => {
  if (game.asked.length) game.heading = game.asked.shift()
  const [dx, dy] = HEADINGS[game.heading]
  const head = game.snake[0]
  const next = { x: head.x + dx, y: head.y + dy }

  const offBoard = next.x < 0 || next.y < 0 || next.x >= COLS || next.y >= ROWS
  const eating = Boolean(game.food && next.x === game.food.x && next.y === game.food.y)
  // The square the tail is leaving is free by the time the head arrives, unless
  // the snake is about to grow into it.
  const body = eating ? game.snake : game.snake.slice(0, -1)
  const intoItself = body.some((cell) => cell.x === next.x && cell.y === next.y)

  if (offBoard || intoItself) return { died: true, ate: false }

  if (eating) {
    game.snake.unshift(next)
    game.colours.push(game.food.model.colour)
    game.score += 1
    placeFood(game, models, random)
    return { died: false, ate: true }
  }

  game.snake.unshift(next)
  game.snake.pop()
  return { died: false, ate: false }
}
