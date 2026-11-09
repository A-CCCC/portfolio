// src/components/pin-ease.js
//
// Where a page eases into its pinned animation (index.css, pin-glide). The
// whole page, wallpaper and all, slows as the panel's section comes up to
// the top of the screen — never faster than the scrolling, only slower —
// and settles there over a little more scrolling, the animation waiting
// until it has (settled(), read by the scrubbing); and as it lets go, the
// same in reverse, the animation done before the page starts to move. Measured by the page's
// layout (offsetTop), which the easing's own movement does not change, and
// again whenever the page changes height.

// How far either side of the pin, and of its letting go, the easing reaches:
// a sixth of a screen
const SHARE = 0.17

// The glide, written out in pixels for the screen: the page behind where
// the scrolling has it by D·p² up to the pin and D·(1−p)² after it, so its
// speed falls from the scrolling's to nothing, evenly, across the two
const keysFor = { d: 0 }
function writeKeys(d) {
  if (d === keysFor.d) return
  keysFor.d = d
  let el = document.getElementById('pin-glide-keys')
  if (!el) { el = document.createElement('style'); el.id = 'pin-glide-keys'; document.head.appendChild(el) }
  const into = [], out = []
  for (let k = 0; k <= 20; k += 1) {
    const p = k / 20
    const lag = p <= 0.5 ? p * p : (1 - p) * (1 - p)
    into.push(`${k * 5}% { translate: 0 ${(d * lag).toFixed(2)}px; }`)
    // and out again, the same the other way about: from a standstill the
    // page draws on ahead of the pin's letting go, its speed rising evenly
    // to the scrolling's
    out.push(`${k * 5}% { translate: 0 ${(-d * lag).toFixed(2)}px; }`)
  }
  el.textContent = `@keyframes pin-glide { ${into.join(' ')} } @keyframes pin-leave { ${out.join(' ')} }`
}

// Each page's glides, one in and one out for every pinned section on it
// (the wiper's page has two): a list of animations on the page, each on the
// page's scroll over its own stretch of it
const glides = CSS.supports?.('animation-timeline: scroll()')
// How much of its section a pinned panel takes, as the pinning counts it:
// its own height, less the margin it reaches up over the section before
export const pinnedHeight = (panel) => panel.offsetHeight + (parseFloat(getComputedStyle(panel).marginTop) || 0)

function place(page) {
  const d = Math.round(window.innerHeight * SHARE)
  writeKeys(d)
  const names = [], ranges = []
  for (const panel of page.querySelectorAll('[data-ease-pin]')) {
    const section = panel.parentElement
    let y = 0
    for (let e = section; e; e = e.offsetParent) y += e.offsetTop
    // where it lets go: the section's foot reaching the panel's
    const go = y + section.offsetHeight - pinnedHeight(panel)
    names.push('pin-glide', 'pin-leave')
    ranges.push(`${Math.max(0, y - d)}px ${y + d}px`, `${go - d}px ${go + d}px`)
    section.dataset.settle = String(d)
  }
  if (!glides || !names.length) return
  page.style.animation = names.map((n) => `${n} linear none`).join(', ')
  page.style.animationTimeline = names.map(() => 'scroll(root block)').join(', ')
  page.style.animationRange = ranges.join(', ')
  page.setAttribute('data-pin-eased', '')
}
const placeAll = () => {
  const pages = new Set([...document.querySelectorAll('[data-ease-pin]')].map((p) => p.closest('.home-backdrop')).filter(Boolean))
  pages.forEach(place)
}

// How far a pinned section's animation has got, 0 to 1: as the page has it,
// from where the page has settled after its glide in to where it starts to
// glide out, rather than from the pin to its letting go
export function settled(section) {
  const settle = parseFloat(section.dataset.settle) || 0
  // (to where the panel lets go, its margin at the foot and all)
  const panel = section.querySelector(':scope > [data-ease-pin]')
  const runway = section.offsetHeight - (panel ? pinnedHeight(panel) : window.innerHeight) - 2 * settle
  if (runway <= 0) return null
  return Math.max(0, Math.min(1, (-section.getBoundingClientRect().top - settle) / runway))
}

export function easePins() {
  const sizes = new ResizeObserver(placeAll)
  const seen = new WeakSet()
  const scan = () => {
    let fresh = false
    for (const panel of document.querySelectorAll('[data-ease-pin]')) {
      if (seen.has(panel) || panel.closest('.page-ghost')) continue
      seen.add(panel)
      fresh = true
      sizes.observe(panel.closest('.home-backdrop') || panel)
    }
    if (fresh) placeAll()
  }
  new MutationObserver(scan).observe(document.body, { childList: true, subtree: true })
  window.addEventListener('resize', placeAll)
  scan()
}
