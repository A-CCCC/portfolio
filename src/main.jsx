import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { warmFramesWhenIdle } from './components/frame-store'
import { lightTheGlass } from './components/useLight'
import './index.css'

// The titles are set in the system's own face at half its width — which only
// Apple's system face has; elsewhere (Segoe UI on Windows, Roboto on Android)
// there is no narrow cut, the text came out at its full width and the home
// page's title ran into the bubbles. Where the system face does not narrow,
// the titles take a face that is narrow already (.no-narrow, index.css).
{
  const probe = document.createElement('span')
  probe.textContent = 'Alex\'s Design Portfolio'
  probe.style.cssText = 'position:absolute;visibility:hidden;white-space:nowrap;font:500 100px system-ui'
  document.body.append(probe)
  const full = probe.offsetWidth
  probe.style.fontStretch = '50%'
  const narrow = probe.offsetWidth
  probe.remove()
  if (narrow > full * 0.85) document.documentElement.classList.add('no-narrow')
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

// Once this page has finished loading, fetch the openings of the scrubbed
// animations in the background, and a page's frames further ahead when a link
// to it is pointed at, so those pages play rather than buffer.
warmFramesWhenIdle()

// Everything in glass is lit from one point fixed to the window; as the
// page scrolls past it, each surface's light moves. See components/useLight.js.
lightTheGlass()
// The bar between the address and LinkedIn hidden when LinkedIn wraps below
import('./components/reach-wrap').then((m) => m.watchReachWraps()).catch(() => {})
// The wallpaper under the home page and the hubs, drawn afresh each visit
import('./components/wallpaper').then((m) => m.watchWallpapers()).catch(() => {})
// Links that point onward (→) sweep the page left and bring the next in from
// the right. See components/page-sweep.js.
import('./components/page-sweep').then((m) => m.sweepOnward()).catch(() => {})
// and the titles drawn as lenses of their own letters, where WebGL is (see
// components/glass-titles.js)
import('./components/glass-titles').then((m) => m.startGlassTitles()).catch(() => {})
// The lens behind the navbar's menus (see index.html) is an SVG filter in a
// backdrop-filter, which only Chromium draws; Safari and Firefox would drop
// the blur with it. So it is switched on only where it works.
// Every Chromium browser says Chrome/ (Edge, Brave and Opera too); Chrome on
// iOS is WebKit underneath and says CriOS instead, which is right.
if (/Chrome\//.test(navigator.userAgent)) {
  document.documentElement.setAttribute('data-lens', '')
  // each surface given the lens at its own size (see components/lens-fit.js)
  import('./components/lens-fit').then((m) => m.fitLenses()).catch(() => {})
}
