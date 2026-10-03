// src/components/glass-titles.js
//
// Every glass title on the site drawn by the WebGL glass (liquid-glass.js)
// as a lens in the shape of its letters: the silk behind it (the cloth the
// light script draws for each title) seen through the letters, bent at
// every edge where the glass curves away, with the rim light, the colour
// fringe and the sheen worked out per pixel. The title's own text stays in
// the page — selectable, read aloud, casting its shadow — and its CSS glass
// stands down (.lg-gl-text) once the lens is drawing it; until then, and
// wherever there is no WebGL, the CSS glass is what shows.
import { glassLayer } from './liquid-glass'

const silkOf = (el) => {
  const v = el.style.getPropertyValue('--river')
  const m = v && v.match(/^url\("(.*)"\)$/)
  return m ? m[1] : null
}

export function startGlassTitles() {
  if (typeof window === 'undefined') return
  const layer = glassLayer()
  if (!layer) return
  const seen = new WeakSet()
  const scan = () => {
    for (const el of document.querySelectorAll('.glass-title')) {
      if (seen.has(el)) continue
      seen.add(el)
      layer.add(el, {
        letters: true,
        pad: 14,                  // the letters' glow reaches past their box
        silk: silkOf,
        specA: 0,                 // no broad spot on letters; the rim and the sheen light them
        rimOnLight: 0.35,
        tintA: 0,
        frost: 0,
        depth: Math.max(4, parseFloat(getComputedStyle(el).fontSize) * 0.12),
      })
      el.classList.add('lg-gl-text')
    }
    for (const el of document.querySelectorAll('.glass-panel')) {
      if (seen.has(el)) continue
      seen.add(el)
      layer.add(el, {
        under: true,              // under the card's words
        silk: silkOf,
        depth: 16, rim: 34, frost: 0, specA: 0.2, rimOnLight: 0.6,
        // the panel's own tone over the silk, most of the way, as the CSS
        // card had it: the words sit on a panel, not on a cloth
        tint: () => getComputedStyle(document.documentElement).getPropertyValue('--panel-a').trim(),
        tintA: (dark) => (dark ? 0.62 : 0.5),
      })
      el.classList.add('lg-gl-panel')
    }
  }
  new MutationObserver(scan).observe(document.body, { childList: true, subtree: true })
  scan()
}
