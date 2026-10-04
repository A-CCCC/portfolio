// src/lib-page.js
//
// A page fetched when it is needed rather than with the site: the first
// visit downloads the page it lands on (and the front page, which is most
// of them), not every page and every game behind it. The rest are fetched
// quietly once the first page has settled (preloadPages), so by the time
// anyone clicks through, the next page is already here and appears at once
// — which the page transitions count on: they wait for the next page to be
// put in, and a page still being fetched would leave a blank moment.
import { createElement, lazy, useRef } from 'react'

const loaders = []
let started = false

export function page(load) {
  let loaded = null
  const fetched = () => load().then((m) => { loaded = m.default; return m })
  const Lazy = lazy(fetched)
  loaders.push(fetched)
  function Page(props) {
    // Whichever it was when it first appeared — swapping the waiting form
    // for the loaded one under a page already showing would start it over
    const kind = useRef(null)
    if (!kind.current) kind.current = loaded || Lazy
    return createElement(kind.current, props)
  }
  return Page
}

// Every page fetched, one after another, when the browser has a moment
export function preloadPages() {
  if (started) return
  started = true
  const idle = window.requestIdleCallback || ((fn) => setTimeout(fn, 200))
  let i = 0
  const next = () => {
    if (i >= loaders.length) return
    loaders[i++]().catch(() => {}).finally(() => idle(next))
  }
  const start = () => setTimeout(() => idle(next), 1500)
  if (document.readyState === 'complete') start()
  else window.addEventListener('load', start, { once: true })
}
