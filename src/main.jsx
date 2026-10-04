import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { warmFramesWhenIdle } from './components/frame-store'
import { lightTheGlass } from './components/useLight'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

// Once this page has finished loading, fetch the frames for the scrubbed
// animations in the background, so those pages play rather than buffer.
warmFramesWhenIdle()

// Everything in glass is lit from one point fixed to the window; as the
// page scrolls past it, each surface's light moves. See components/useLight.js.
lightTheGlass()
// The bar between the address and LinkedIn hidden when LinkedIn wraps below
import('./components/reach-wrap').then((m) => m.watchReachWraps()).catch(() => {})
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
}
