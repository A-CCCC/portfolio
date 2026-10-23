// src/components/frame-store.js
//
// One place to fetch a scrubbed animation's frames, and one place to keep them.
//
// Those sequences are the heaviest thing on the site — the Skeleton Barrel is
// 457 frames on its own — and a page that only starts fetching them when you
// arrive spends its first seconds chasing your scroll. So once the page you
// actually opened has everything it needs, the opening of each is fetched
// quietly in the background; and the moment a link to one of those pages is
// pointed at or touched, that page's frames are fetched further ahead — so by
// the time you reach it they are already here, and someone who only reads the
// About page has not spent seventeen megabytes on animations they never see.
//
// The sweep and the pages both ask through this, so a frame is fetched once
// however many times it is wanted, and a page opened mid-sweep is handed what
// has already landed rather than asking for it again.
import asset from '../lib-asset'

// Every sequence on the site. Listed here rather than gathered from the pages,
// because the whole point is to have them before those pages are built.
// Each with the page it plays on.
export const SEQUENCES = [
  { folder: 'skeleton-barrel-anim', start: 1, count: 457, page: '/projects/clash-royale/skeleton-barrel' },
  { folder: 'elixir-collector-anim', start: 0, count: 201, page: '/projects/clash-royale/elixir-collector' },
  { folder: 'backup-camera-wiper-outside-anim', start: 1, count: 219, page: '/solutions/convenience/backup-camera-wiper' },
  { folder: 'backup-camera-wiper-anim', start: 1, count: 235, page: '/solutions/convenience/backup-camera-wiper' },
]

export const frameSrc = (folder, n) =>
  asset(`/${folder}/${String(n).padStart(4, '0')}.webp`)

const AT_ONCE = 6          // fetches in flight; enough to fill a connection

// How much of each sequence to fetch ahead of being asked for it. The opening
// is what a scroll reaches first, and by the time it has been scrubbed that far
// the rest has arrived behind it. In the background, for every page, a tenth —
// a few megabytes in all; once a link to its page is pointed at, half, which
// buys most of the smoothness for half of the page's frames.
const OPENING = 0.1
const AHEAD = 0.5

const kept = new Map()     // src -> the image, loaded
const going = new Map()    // src -> the promise for one already asked for
const soon = []            // wanted by the page on screen
const next = []            // wanted for a page a link to it was pointed at
const later = []           // wanted by the background sweep
let busy = 0

// The image if it is already here, so a page can draw without waiting a tick.
export const held = (src) => kept.get(src)

function pump() {
  while (busy < AT_ONCE && (soon.length || next.length || later.length)) {
    // Anything a page is waiting on goes first: the sweep can wait, a scroll
    // that is happening now cannot. Then the page about to be opened.
    const job = soon.length ? soon.shift() : next.length ? next.shift() : later.shift()
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
// (`urgent` may also be 'next': a page about to be opened, ahead of the sweep.)
export function want(src, urgent = false) {
  const have = kept.get(src)
  if (have) return Promise.resolve(have)

  const already = going.get(src)
  if (already) {
    // Queued by the sweep and now wanted by a page: move it to the front of
    // the line. Already in flight, and there is nothing to move.
    if (urgent) {
      const to = urgent === 'next' ? next : soon
      for (const from of urgent === 'next' ? [later] : [next, later]) {
        const at = from.findIndex((job) => job.src === src)
        if (at >= 0) { to.push(from.splice(at, 1)[0]); break }
      }
    }
    return already
  }

  let settle
  const promise = new Promise((resolve) => { settle = resolve })
  going.set(src, promise)
  ;(urgent === 'next' ? next : urgent ? soon : later).push({ src, settle })
  pump()
  return promise
}

// Whether to spend someone's data on this. A phone asked to save data, or on a
// connection that would take minutes over eight megabytes, is left alone —
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
    const ahead = Math.ceil(seq.count * OPENING)
    for (let i = 0; i < ahead; i += 1) want(frameSrc(seq.folder, seq.start + i))
  }
}

// A link to a page with frames, pointed at, touched or tabbed to: that page's
// frames fetched half way ahead, before anything else the sweep has queued.
const warmedFor = new Set()
function warmFor(link) {
  const path = link.pathname?.replace(/\/+$/, '') || ''
  for (const seq of SEQUENCES) {
    if (warmedFor.has(seq.folder) || !path.endsWith(seq.page)) continue
    warmedFor.add(seq.folder)
    const ahead = Math.ceil(seq.count * AHEAD)
    for (let i = 0; i < ahead; i += 1) want(frameSrc(seq.folder, seq.start + i), 'next')
  }
}
function watchIntent() {
  if (!worthIt()) return
  const look = (e) => {
    const link = e.target?.closest?.('a[href]')
    if (link) warmFor(link)
  }
  for (const type of ['pointerover', 'touchstart', 'focusin']) {
    document.addEventListener(type, look, { passive: true, capture: true })
  }
}

// Not while the page you opened is still loading: its own pictures, its fonts
// and its scripts come first. Then, in whatever gap the browser has spare.
const SETTLE = 1200

export function warmFramesWhenIdle() {
  watchIntent()
  const begin = () => {
    const whenFree = window.requestIdleCallback || ((fn) => setTimeout(fn, 1))
    setTimeout(() => whenFree(() => warmFrames(), { timeout: 4000 }), SETTLE)
  }
  if (document.readyState === 'complete') begin()
  else window.addEventListener('load', begin, { once: true })
}
