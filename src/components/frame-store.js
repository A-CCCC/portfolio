// src/components/frame-store.js
//
// One place to fetch a scrubbed animation's frames, and one place to keep them.
//
// Those sequences are the heaviest thing on the site — the Skeleton Barrel is
// 457 frames on its own — and a page that only starts fetching them when you
// arrive spends its first seconds chasing your scroll. So once the page you
// actually opened has everything it needs, the whole lot is fetched quietly in
// the background, and by the time you reach one of those pages the frames are
// already here.
//
// The sweep and the pages both ask through this, so a frame is fetched once
// however many times it is wanted, and a page opened mid-sweep is handed what
// has already landed rather than asking for it again.
import asset from '../lib-asset'

// Every sequence on the site. Listed here rather than gathered from the pages,
// because the whole point is to have them before those pages are built.
export const SEQUENCES = [
  { folder: 'skeleton-barrel-anim', start: 1, count: 457 },
  { folder: 'elixir-collector-anim', start: 0, count: 201 },
]

export const frameSrc = (folder, n) =>
  asset(`/${folder}/${String(n).padStart(4, '0')}.webp`)

const AT_ONCE = 6          // fetches in flight; enough to fill a connection

const kept = new Map()     // src -> the image, loaded
const going = new Map()    // src -> the promise for one already asked for
const soon = []            // wanted by the page on screen
const later = []           // wanted by the background sweep
let busy = 0

// The image if it is already here, so a page can draw without waiting a tick.
export const held = (src) => kept.get(src)

function pump() {
  while (busy < AT_ONCE && (soon.length || later.length)) {
    // Anything a page is waiting on goes first: the sweep can wait, a scroll
    // that is happening now cannot.
    const job = soon.length ? soon.shift() : later.shift()
    const img = new Image()
    img.decoding = 'async'
    busy += 1

    const done = (ok) => {
      busy -= 1
      going.delete(job.src)
      if (ok) kept.set(job.src, img)
      job.settle(ok ? img : null)
      pump()
    }
    img.onload = () => done(true)
    // A gap in the numbering, or a frame that did not ship. The sequence goes
    // on without it; whatever wanted it holds the frame before instead.
    img.onerror = () => done(false)
    img.src = job.src
  }
}

// The frame, once it is here — or null if it never will be. `urgent` is for a
// page on screen; without it the frame waits behind everything a page wants.
export function want(src, urgent = false) {
  const have = kept.get(src)
  if (have) return Promise.resolve(have)

  const already = going.get(src)
  if (already) {
    // Queued by the sweep and now wanted by a page: move it to the front of
    // the line. Already in flight, and there is nothing to move.
    if (urgent) {
      const at = later.findIndex((job) => job.src === src)
      if (at >= 0) soon.push(later.splice(at, 1)[0])
    }
    return already
  }

  let settle
  const promise = new Promise((resolve) => { settle = resolve })
  going.set(src, promise)
  ;(urgent ? soon : later).push({ src, settle })
  pump()
  return promise
}

// Whether to spend someone's data on this. A phone asked to save data, or on a
// connection that would take minutes over sixteen megabytes, is left alone —
// the pages still fetch their own frames when opened, exactly as before.
function worthIt() {
  const link = navigator.connection
  if (!link) return true
  if (link.saveData) return false
  return !/2g/.test(link.effectiveType || '')
}

let swept = false

export function warmFrames() {
  if (swept || !worthIt()) return
  swept = true
  for (const seq of SEQUENCES) {
    for (let i = 0; i < seq.count; i += 1) want(frameSrc(seq.folder, seq.start + i))
  }
}

// Not while the page you opened is still loading: its own pictures, its fonts
// and its scripts come first. Then, in whatever gap the browser has spare.
const SETTLE = 1200

export function warmFramesWhenIdle() {
  const begin = () => {
    const whenFree = window.requestIdleCallback || ((fn) => setTimeout(fn, 1))
    setTimeout(() => whenFree(() => warmFrames(), { timeout: 4000 }), SETTLE)
  }
  if (document.readyState === 'complete') begin()
  else window.addEventListener('load', begin, { once: true })
}
