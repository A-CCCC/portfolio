// Runs the snake's rules through the things that are easy to get wrong.
// node scripts/test-snake.mjs
import {
  COLS, ROWS, newGame, placeFood, ask, step,
} from '../src/components/snake-rules.js'

const models = [
  { label: 'A', colour: '#aa0000' },
  { label: 'B', colour: '#00aa00' },
]
let failures = 0
const check = (what, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want)
  if (!ok) failures += 1
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${what}${ok ? '' : `\n       got ${JSON.stringify(got)}\n      want ${JSON.stringify(want)}`}`)
}

// --- moving
let g = newGame('#base')
const before = g.snake.length
step(g, models)
check('a step keeps its length', g.snake.length, before)
check('a step moves the head one square', g.snake[0], { x: 9, y: 7 })
check('the tail lets go', g.snake.at(-1), { x: 7, y: 7 })

// --- eating
g = newGame('#base')
g.food = { x: 9, y: 7, model: models[0] }
const ate = step(g, models)
check('eating is reported', ate.ate, true)
check('eating grows it by one', g.snake.length, 4)
check('the new band goes on the tail', g.colours, ['#base', '#base', '#base', '#aa0000'])
check('the score counts a model', g.score, 1)
check('another model is put out', Boolean(g.food), true)
check('and it is a different one', g.food.model !== models[0], true)

// --- the bands stay put while the body flows through them
g = newGame('#base')
g.food = { x: 9, y: 7, model: models[0] }
step(g, models)              // eats, tail band is now red
const painted = [...g.colours]
g.food = null
for (let i = 0; i < 3; i += 1) step(g, models)
check('bands do not drift as it moves', g.colours, painted)
check('and none is lost', g.colours.filter((c) => c === '#aa0000').length, 1)

// --- walls
g = newGame('#base')
g.food = null
let died = false
for (let i = 0; i < COLS + 2 && !died; i += 1) died = step(g, models).died
check('it dies at the wall', died, true)

// --- itself
g = newGame('#base')
g.snake = [{ x: 5, y: 5 }, { x: 6, y: 5 }, { x: 6, y: 6 }, { x: 5, y: 6 }, { x: 4, y: 6 }]
g.colours = ['a', 'b', 'c', 'd', 'e']
g.heading = 'down'
check('it dies in its own body', step(g, models).died, true)

// --- but not on the square its tail is leaving
g = newGame('#base')
g.snake = [{ x: 5, y: 5 }, { x: 6, y: 5 }, { x: 6, y: 6 }, { x: 5, y: 6 }]
g.colours = ['a', 'b', 'c', 'd']
g.heading = 'down'
g.food = null
check('the tail square is free to enter', step(g, models).died, false)

// --- turning
g = newGame('#base')
ask(g, 'left')
check('it will not turn back on itself', g.asked, [])
ask(g, 'up')
ask(g, 'left')
check('two turns inside one step are kept in order', g.asked, ['up', 'left'])
ask(g, 'down')
check('and no more than two are taken', g.asked.length, 2)
step(g, models)
check('the first is answered', g.heading, 'up')

// --- where a model may land
g = newGame('#base')
for (let i = 0; i < 200; i += 1) {
  placeFood(g, models)
  const onSnake = g.snake.some((c) => c.x === g.food.x && c.y === g.food.y)
  if (onSnake || g.food.x >= COLS || g.food.y >= ROWS || g.food.x < 0 || g.food.y < 0) {
    check('a model never lands on the snake or off the board', false, true)
    break
  }
}
check('models land somewhere legal, 200 times over', true, true)

console.log(failures ? `\n${failures} failed` : '\nall good')
process.exit(failures ? 1 : 0)
