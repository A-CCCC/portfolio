// src/components/reach-wrap.js
//
// The bar between the address and LinkedIn marks where one ends and the next
// begins, on one line. When the line is too narrow and LinkedIn wraps to the
// next, the bar would start that line on its own, pointing at nothing; so it
// is hidden whenever the pair is on a line below the address. Watched rather
// than set by screen width, since the font size and the zoom move the point
// where it wraps.

export function watchReachWraps() {
  if (typeof window === 'undefined') return
  // and whenever the line they sit on changes size — a font arriving, a
  // column settling to its width — which is neither a resize nor a change
  // to the page's elements
  const sized = new ResizeObserver(() => soon())
  const watched = new WeakSet()
  const check = () => {
    for (const pair of document.querySelectorAll('.reach-pair')) {
      const before = pair.previousElementSibling
      if (!before) continue
      const line = pair.parentElement
      if (line && !watched.has(line)) { watched.add(line); sized.observe(line) }
      // Judged with the bar in place: hiding it can let the pair fit back on
      // the line, which would show the bar, which would wrap it again — so
      // it is measured as it would be with the bar, and if it would wrap it
      // is put on a line of its own, bar hidden, and stays there.
      const was = pair.classList.contains('reach-wrapped')
      if (was) pair.classList.remove('reach-wrapped')
      const wrapped = pair.getBoundingClientRect().top > before.getBoundingClientRect().bottom - 4
      if (wrapped) pair.classList.add('reach-wrapped')
    }
  }
  let queued = false
  const soon = () => { if (queued) return; queued = true; requestAnimationFrame(() => { queued = false; check() }) }
  window.addEventListener('resize', soon)
  // a section fading and rising in as it is scrolled to moves its line
  // about without changing its size: checked again as the page scrolls and
  // when a transition ends (two pairs on a page; it costs nothing)
  window.addEventListener('scroll', soon, { passive: true })
  document.addEventListener('transitionend', soon, true)
  new MutationObserver(soon).observe(document.body, { childList: true, subtree: true })
  document.fonts?.ready.then(soon)
  soon()
}
