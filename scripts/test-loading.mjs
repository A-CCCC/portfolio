// The loading bar's shape, checked at the moments that make it funny.
// node scripts/test-loading.mjs
import { percentAt, estimateAt, ESTIMATES, TOTAL } from '../src/components/loading-curve.js'

let failures = 0
const check = (what, ok, saw) => {
  if (!ok) failures += 1
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${what}${ok ? '' : `  (saw ${saw})`}`)
}

const at = (ms) => Math.round(percentAt(ms))

check('starts at nothing', at(0) === 0, at(0))
check('is at 99 almost at once', at(350) === 99, at(350))
check('holds there for about a second', at(600) === 99 && at(1400) === 99, `${at(600)}, ${at(1400)}`)
check('has begun going backwards by 2.5s', at(2500) < 99, at(2500))
check('is still going backwards at 4s', at(4000) < at(2500), `${at(4000)} after ${at(2500)}`)
check('gives back about a fifth of the bar, no more', at(4500) > 74 && at(4500) < 88, at(4500))
check('reaches 100 exactly at the end', at(TOTAL) === 100, at(TOTAL))
check('and stays there', at(TOTAL + 5000) === 100, at(TOTAL + 5000))
check('takes about five seconds', TOTAL === 5000, TOTAL)

// Nothing should ever leave the bar
let outside = 0
for (let ms = -200; ms <= TOTAL + 200; ms += 7) {
  const p = percentAt(ms)
  if (p < 0 || p > 100) outside += 1
}
check('never leaves the bar', outside === 0, `${outside} readings outside 0-100`)

// The retreat should be gradual rather than a drop
let biggestFall = 0
for (let ms = 1450; ms < 4500; ms += 16) {
  biggestFall = Math.max(biggestFall, percentAt(ms) - percentAt(ms + 16))
}
check('retreats slowly, not in lurches', biggestFall < 0.5, `biggest single-frame fall ${biggestFall.toFixed(2)}%`)

// --- what it reckons is left
check('starts by admitting it does not know', estimateAt(0).startsWith('Estimating'), estimateAt(0))
check('is confident while the bar is at 99', estimateAt(1000) === 'Less than a minute remaining', estimateAt(1000))
check('is talking in hours by 3s', /hour/.test(estimateAt(3000)), estimateAt(3000))
check('is talking in weeks near the bottom', /week/.test(estimateAt(4500)), estimateAt(4500))
check('is back to a minute just before it finishes', /Less than a minute/.test(estimateAt(4800)), estimateAt(4800))
check('says nothing once it is done', estimateAt(TOTAL) === '', `"${estimateAt(TOTAL)}"`)
check('never goes past the end', ESTIMATES.every((line) => line.at <= TOTAL), 'a line starts after the end')

// It should step, not slide: a handful of changes across the whole run
let changes = 0
let said = estimateAt(0)
for (let ms = 0; ms <= TOTAL; ms += 16) {
  const now = estimateAt(ms)
  if (now !== said) { changes += 1; said = now }
}
check('changes a handful of times, not every frame', changes > 4 && changes < 20, `${changes} changes`)

console.log(failures ? `\n${failures} failed` : '\nall good')
process.exit(failures ? 1 : 0)
