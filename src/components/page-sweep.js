// src/components/page-sweep.js
//
// A link that points onward — one with a → after it — moves the reader on
// the way it says: the page sweeps away to the left and the next comes in
// from the right, as a step forward does. The bar and the theme switch, which
// are not part of the page, stay where they are. Only for links within the
// site, clicked plainly (a new tab is a new tab), and not at all for anyone
// with motion turned down.
//
// The page is the element under #root that holds the link. The link is let
// go once the page has gone, by clicking it again, so React Router takes it
// from there exactly as it would have; the page that arrives is the one
// added under #root while the sweep is under way, and it comes in from the
// right.

const OUT_MS = 240
const OUT_BACK_MS = 260
const GROW_MS = 560

// Where in the history we are: React Router keeps an index in each entry's
// state, which says whether a pop went back or forward.
const at = () => (window.history.state && typeof window.history.state.idx === 'number' ? window.history.state.idx : null)

export function sweepOnward() {
  if (typeof document === 'undefined') return
  const root = document.getElementById('root')
  if (!root) return
  let arriving = false            // 'onward' | 'back' | 'grow' | false
  let growFrom = null             // the navbar link's box, for 'grow'
  let growGhost = null            // and the picture of the page it left
  let lastIdx = at()
  // Kept up with every move through the history, however it was made — a
  // navbar link, a bubble, an arrow — not only the arrows': a back from a
  // page reached any other way compared against an old place, read it as
  // forward, and swept the wrong way.
  for (const name of ['pushState', 'replaceState']) {
    const orig = window.history[name].bind(window.history)
    window.history[name] = (...args) => { const r = orig(...args); lastIdx = at(); return r }
  }

  // the next page in from the right, as soon as it is put in
  new MutationObserver((changes) => {
    if (!arriving) return
    for (const c of changes) {
      for (const el of c.addedNodes) {
        if (el.nodeType !== 1 || el.classList.contains('page-leave')) continue
        if (arriving === 'grow') { arriving = false; grow(el, growFrom, growGhost); return }
        const cls = arriving === 'back' ? 'page-arrive-back' : 'page-arrive'
        arriving = false
        el.classList.add(cls)
        el.addEventListener('animationend', () => el.classList.remove(cls), { once: true })
        lastIdx = at()
        return
      }
    }
  }).observe(root, { childList: true })

  document.addEventListener('click', (e) => {
    const a = e.target.closest?.('a[href]')
    if (!a || !a.querySelector('.count-arrow')) return
    if (a.dataset.sweptOnce) { delete a.dataset.sweptOnce; return }   // our own second click: let it through
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
    if (a.target && a.target !== '_self') return
    const url = new URL(a.href, location.href)
    if (url.origin !== location.origin) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const page = a.closest('#root > *')
    if (!page) return
    e.preventDefault()
    e.stopPropagation()
    page.classList.add('page-leave')
    setTimeout(() => {
      arriving = 'onward'
      a.dataset.sweptOnce = '1'
      a.click()
      setTimeout(() => { lastIdx = at() }, 0)
      // nothing arrived (the same page): put this one back
      setTimeout(() => { if (page.isConnected) page.classList.remove('page-leave'); arriving = false }, 400)
    }, OUT_MS)
  }, true)

  // A link in the navbar: the next page grows out of the link that was
  // pressed, as a bubble once grew into its project. The page being left
  // stays where it was, as a picture, sinking back a little while the new
  // one opens over it from the link's own pill to the whole screen.
  document.addEventListener('click', (e) => {
    const a = e.target.closest?.('nav a[href]')
    if (!a || a.querySelector('.count-arrow')) return
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
    if (a.target && a.target !== '_self') return
    const url = new URL(a.href, location.href)
    if (url.origin !== location.origin || url.pathname === location.pathname) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const page = pageOf()
    if (!page) return
    const ghost = ghostOf(page)
    ghost.classList.add('page-recede')
    ghost.style.transformOrigin = `${innerWidth / 2 - parseFloat(ghost.style.left)}px ${innerHeight / 2 - parseFloat(ghost.style.top)}px`
    ghost.style.zIndex = '0'
    document.body.appendChild(ghost)
    // gone once the new page has opened over it, or if none comes
    growFrom = a.getBoundingClientRect()
    growGhost = ghost
    arriving = 'grow'
    setTimeout(() => { if (arriving === 'grow') { arriving = false; ghost.remove() } }, 1500)
  }, true)

  // The browser's back and forward buttons. By the time the browser says it
  // has gone, the page it has left is still on screen for a moment (the
  // router has only been told), so a picture of it — its canvases copied
  // across, which a copy leaves blank — is laid over where it was and sent
  // off to the right, and the page that comes in arrives from the left:
  // the onward sweep in reverse. Forward again sweeps onward.
  window.addEventListener('popstate', () => {
    const idx = at()
    const back = lastIdx !== null && idx !== null ? idx < lastIdx : true
    lastIdx = idx
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const page = pageOf()
    if (!page) return
    const ghost = ghostOf(page)
    ghost.classList.add(back ? 'page-leave-back' : 'page-leave')
    document.body.appendChild(ghost)
    setTimeout(() => ghost.remove(), back ? OUT_BACK_MS + 40 : OUT_MS + 40)
    arriving = back ? 'back' : 'onward'
    setTimeout(() => { arriving = false }, 600)
  })

  // the page: the tallest block under #root that is not fixed in place
  // (the bar, the theme switch and the footer are beside it)
  function pageOf() {
    return [...root.children]
      .filter((k) => k.tagName === 'DIV' && getComputedStyle(k).position !== 'fixed')
      .sort((a, b) => b.offsetHeight - a.offsetHeight)[0]
  }

  // A picture of the page, laid over where it is: its canvases copied
  // across, which a copy leaves blank.
  function ghostOf(page) {
    const r = page.getBoundingClientRect()
    const ghost = page.cloneNode(true)
    const from = page.querySelectorAll('canvas'), to = ghost.querySelectorAll('canvas')
    from.forEach((c, i) => { try { to[i].width = c.width; to[i].height = c.height; to[i].getContext('2d').drawImage(c, 0, 0) } catch { /* a WebGL canvas: left blank */ } })
    ghost.classList.add('page-ghost')
    Object.assign(ghost.style, { position: 'fixed', left: `${r.left}px`, top: `${r.top}px`, width: `${r.width}px`, margin: '0', pointerEvents: 'none', zIndex: '1' })
    ghost.removeAttribute('id')
    return ghost
  }
}

// The page opening out of the link it was asked for from: clipped to the
// link's pill at first, the pill widening to the whole screen and its
// corners squaring as it goes. Its edge is drawn by a rim laid over it on
// the same path — tinted like the lit link at first, so the link itself
// seems to open, clearing as it grows — since a page opening over one of
// the same colour has no edge of its own to see. Hidden for the frame
// before, while the scroll is put back to the top, so the box is measured
// where it will be.
function grow(el, from, ghost) {
  if (!from) { ghost?.remove(); return }
  const keep = { clipPath: el.style.clipPath, position: el.style.position, zIndex: el.style.zIndex, background: el.style.background }
  Object.assign(el.style, { clipPath: 'inset(0 0 100% 0)', position: keep.position || 'relative', zIndex: '2', background: keep.background || 'var(--bg)' })
  requestAnimationFrame(() => {
    const r = el.getBoundingClientRect()
    const vw = window.innerWidth, vh = window.innerHeight
    const top = from.top - r.top, left = from.left - r.left
    const right = r.width - (from.right - r.left), bottom = r.height - (from.bottom - r.top)
    // the screen, in the page's own terms: nothing past it needs opening
    const T = Math.max(0, -r.top), B = Math.max(0, r.bottom - vh)
    const R = from.height / 2
    const timing = { duration: GROW_MS, easing: 'cubic-bezier(0.45, 0.05, 0.2, 1)' }
    const a = el.animate([
      { clipPath: `inset(${top}px ${right}px ${bottom}px ${left}px round ${R}px)` },
      { clipPath: `inset(${T}px 0px ${B}px 0px round 0px)` },
    ], timing)
    const rim = document.createElement('div')
    rim.className = 'page-grow-rim'
    document.body.appendChild(rim)
    rim.animate([
      { left: `${from.left}px`, top: `${from.top}px`, width: `${from.width}px`, height: `${from.height}px`, borderRadius: `${R}px`, '--fill': 0.9, opacity: 1 },
      { '--fill': 0, opacity: 1, offset: 0.55 },
      { left: '0px', top: '0px', width: `${vw}px`, height: `${vh}px`, borderRadius: '0px', '--fill': 0, opacity: 0 },
    ], { ...timing, fill: 'forwards' })
    el.style.clipPath = keep.clipPath
    const done = () => { ghost?.remove(); rim.remove(); Object.assign(el.style, { position: keep.position, zIndex: keep.zIndex, background: keep.background }) }
    a.onfinish = done
    a.oncancel = done
  })
}
