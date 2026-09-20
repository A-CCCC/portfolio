// The loading bar's shape, checked at the moments that make it funny.
// node scripts/test-loading.mjs
import { percentAt, TOTAL } from '../src/components/loading-curve.js'

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
check('bottoms out somewhere past halfway', at(4500) > 40 && at(4500) < 70, at(4500))
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

console.log(failures ? `\n${failures} failed` : '\nall good')
process.exit(failures ? 1 : 0)
