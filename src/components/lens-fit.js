// src/components/lens-fit.js
//
// The lens behind the menus, the home page's cards and the text panels is an
// SVG filter (index.html), and its bend comes from a map laid over the
// surface. Chromium lays that map from the surface's corner but reads a width
// of 100% as the window's, not the surface's — so the bend landed in the
// wrong place, and moved when a menu opening shuffled the page's layers.
//
// Leaving the map to fill the surface on its own put it right, but Chromium
// then drew it again for every surface on every frame, and scrolling fell to
// a few frames a second. So instead each size of surface gets a copy of the
// filter with the map's size written in pixels: right, and as cheap as the
// one filter was. Surfaces of one size (the cards) share a copy; a copy no
// surface uses any more is taken away.

// The surfaces and the filter each looks through, with the custom property
// the stylesheet reads it from (index.css: var(--lens, url(#lg-lens)))
const KINDS = [
  { base: 'lg-lens', prop: '--lens', match: '.nav-menu, .nav-sheet, .glass.nav-glass, .glass.about-panel, .glass.text-panel' },
  { base: 'lg-lens-sm', prop: '--lens-sm', match: '.nav-lit' },
]
const ALL = KINDS.map((k) => k.match).join(', ')

const users = new Map()      // filter id -> how many surfaces look through it
const using = new WeakMap()  // surface -> the filter id it has now

function copyFor(base, w, h) {
  const id = `${base}-${w}x${h}`
  if (!document.getElementById(id)) {
    const template = document.getElementById(base)
    if (!template) return null
    const copy = template.cloneNode(true)
    copy.id = id
    copy.querySelectorAll('feImage').forEach((img) => {
      img.setAttribute('width', w)
      img.setAttribute('height', h)
    })
    template.parentNode.appendChild(copy)
  }
  return id
}

function release(id) {
  const n = (users.get(id) || 1) - 1
  if (n > 0) { users.set(id, n); return }
  users.delete(id)
  document.getElementById(id)?.remove()
}

function fit(el) {
  const kind = KINDS.find((k) => el.matches(k.match))
  if (!kind) return
  // the box as laid out, before any transform: the filter is laid out in it
  const w = el.offsetWidth, h = el.offsetHeight
  if (!w || !h) return
  const id = copyFor(kind.base, w, h)
  const was = using.get(el)
  if (!id || id === was) return
  users.set(id, (users.get(id) || 0) + 1)
  using.set(el, id)
  el.style.setProperty(kind.prop, `url(#${id})`)
  if (was) release(was)
}

function forget(el) {
  const was = using.get(el)
  if (!was) return
  using.delete(el)
  release(was)
}

export function fitLenses() {
  const sizes = new ResizeObserver((entries) => entries.forEach((e) => fit(e.target)))
  const watched = new Set()
  const take = (el) => {
    if (watched.has(el)) return
    watched.add(el)
    sizes.observe(el)
    fit(el)
  }
  const scan = (root) => {
    if (root.nodeType !== 1) return
    if (root.matches(ALL)) take(root)
    root.querySelectorAll(ALL).forEach(take)
  }
  const drop = (root) => {
    if (root.nodeType !== 1) return
    const gone = root.matches(ALL) ? [root, ...root.querySelectorAll(ALL)] : root.querySelectorAll(ALL)
    gone.forEach((el) => {
      if (el.isConnected || !watched.has(el)) return
      watched.delete(el)
      sizes.unobserve(el)
      forget(el)
    })
  }
  scan(document.body)
  new MutationObserver((records) => {
    for (const r of records) {
      r.addedNodes.forEach(scan)
      r.removedNodes.forEach(drop)
      // a class added to something already there (a panel made glass)
      if (r.type === 'attributes' && r.target.nodeType === 1 && r.target.matches(ALL)) take(r.target)
    }
  }).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] })
}
