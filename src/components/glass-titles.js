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
import { wallRegion } from './wallpaper'

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
      // (not the titles of a picture of a page going (page-sweep.js): it
      // carries their glass as it was drawn; taken up afresh, with no
      // wallpaper of its own to see through, they were drawn in the cloth's
      // yellow as the page went)
      if (el.closest('.page-ghost')) continue
      layer.add(el, {
        letters: true,
        // on a page with a wallpaper, the wallpaper through the letters — in
        // the other theme's colours inside a band painted the page's inverse
        wallBehind: (el) => {
          const host = el.closest('.home-backdrop')
          if (!host || !host.__pattern) return null
          // (a page's title; and on a project's own page, the headings that
          // stand on the wallpaper by themselves — beside an animation, over
          // a run of sections — set as the title is. Those on a panel are
          // caught above.)
          if (el.tagName !== 'H1' && !(el.tagName === 'H2' && (host.classList.contains('wall-page') || el.closest('.hub-link, .about-panel')))) return null
          // (not on a panel of glass: what is behind it there is the panel,
          // and clear letters showing the wallpaper through it vanished into
          // it — the About me heading — so they keep their coloured glass)
          // (but a hub's category name, at the head of its panel, and the
          // home page's About me are set as the titles are, on purpose)
          if (el.closest('.about-panel, .text-panel, .glass-panel') && !el.closest('.hub-link') && !el.matches('.about-panel h2')) return null
          const root = document.documentElement
          const pageDark = root.dataset.theme === 'dark' || ((root.dataset.theme === 'auto' || !root.dataset.theme) && matchMedia('(prefers-color-scheme: dark)').matches)
          const inverted = !!el.closest('[data-inverted]')
          const dark = inverted ? true : pageDark
          // On a panel pinned to the screen (wallpaper.js, HELD STILL) the
          // wallpaper behind it is the stretch where its section begins: how
          // far the panel has come down its section, to take off
          const held = el.closest('.wall-hold')
          const shift = held ? () => held.getBoundingClientRect().top - held.parentElement.getBoundingClientRect().top : null
          return { host, dark, shift, region: (...a) => wallRegion(host, ...a) }
        },
        glow: 0.6,                // lit from within, with a halo
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
      if (el.closest('.page-ghost')) continue
      // A card that is the whole of what it shows — a carousel's, a game's,
      // a shop listing's — rather than a panel of words: more of the cloth's
      // colour through it, and deeper glass at its edge
      const bright = el.classList.contains('panel-bright')
      // A card on a page with a wallpaper (the category pages' carousels,
      // Services' shop): clear glass — the wallpaper behind it seen through
      // it, bent at its rim, as the bubbles see it — in its own colour
      const host = el.classList.contains('panel-bright') && el.closest('.home-backdrop')
      const behind = host ? {
        wall: () => {
          if (!host.__pattern) return null
          const root = document.documentElement
          const dark = root.dataset.theme === 'dark' || ((root.dataset.theme === 'auto' || !root.dataset.theme) && matchMedia('(prefers-color-scheme: dark)').matches)
          return { host, dark, region: (...a) => wallRegion(host, ...a) }
        },
      } : { silk: silkOf }
      layer.add(el, {
        under: true,              // under the card's words
        ...behind,
        // (what is seen through clear glass softened a little, as a frosted
        // pane's is)
        depth: bright ? 24 : 16, rim: bright ? 44 : 34, frost: host ? 3 : 0, specA: bright ? 0.32 : 0.2, rimOnLight: bright ? 0.75 : 0.6,
        ...(host ? {
          // clear glass keeps the card's own colour, as a bubble does: a
          // light of it on the glass (hue, from --lg-hue: its silk's
          // middle shade, .glass-panel.panel-bright) and a wash of it over
          // what is seen through
          hue: true,
          tint: (e) => getComputedStyle(e).getPropertyValue('--silk-2').trim() || '#ffffff',
          tintA: (dark) => 0.26 + 0.1 * dark,
        } : {
          // the panel's own tone over the silk, most of the way, as the CSS
          // card had it: the words sit on a panel, not on a cloth
          tint: () => getComputedStyle(document.documentElement).getPropertyValue('--panel-a').trim(),
          // less of the tone over the cloth on the light page, where the
          // cloth is the sunset (dark eases 0..1 with the theme)
          tintA: bright ? (dark) => 0.12 + 0.2 * dark : (dark) => 0.3 + 0.32 * dark,
        }),
      })
      el.classList.add('lg-gl-panel')
    }
  }
  new MutationObserver(scan).observe(document.body, { childList: true, subtree: true })
  scan()
}
