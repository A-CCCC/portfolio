// src/components/ScrubFrames.jsx
//
// Draws a numbered sequence of frames onto a canvas, following a scroll.
//
// It used to be an <img> whose src was swapped as the scroll moved. That asks
// the browser to do three expensive things on the main thread for every frame:
// render React again, swap the element's source, and decode a 1.3 megapixel
// picture — all inside the sixteen milliseconds a frame is allowed. It kept up
// on a fast machine and stuttered everywhere else.
//
// A canvas does none of that. The frames are fetched ahead of time, the scroll
// writes a number into a ref rather than into state, and the canvas redraws
// straight from the scroll event — the same event the browser already limits to
// one per frame. Drawing a loaded image onto a canvas is a copy, not a decode.
import { useEffect, useRef } from 'react'
import asset from '../lib-asset'

const AT_ONCE = 6            // fetches in flight; enough to fill a connection
const NEARBY = '200% 0px'    // start fetching about two screens ahead

export default function ScrubFrames({
  folder, count, start = 1, frameRef, style, label = '', innerRef,
}) {
  const own = useRef(null)
  const canvasRef = innerRef || own
  const framesRef = useRef([])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !folder || !count) return undefined
    const ctx = canvas.getContext('2d')
    const frames = []
    framesRef.current = frames

    let alive = true
    let drawn = -1
    let sized = false

    const draw = () => {
      if (!alive) return
      const wanted = frameRef.current ?? start
      if (wanted === drawn) return
      // The frame asked for if it is here, else the nearest one behind it, so
      // the picture holds instead of blanking while the rest arrive.
      let i = wanted - start
      while (i > 0 && !frames[i]) i -= 1
      const img = frames[i]
      if (!img) return
      if (!sized) {
        // The canvas keeps the frames' own size and is scaled by CSS, exactly as
        // the image was — so nothing looks softer than it did.
        canvas.width = img.naturalWidth
        canvas.height = img.naturalHeight
        sized = true
      }
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(img, 0, 0)
      drawn = wanted
    }

    const fetchAll = () => {
      let next = 0
      const pull = () => {
        if (!alive || next >= count) return
        const at = next
        next += 1
        const img = new Image()
        img.decoding = 'async'
        img.onload = () => {
          if (!alive) return
          frames[at] = img
          drawn = -1                 // a better frame may now be available
          draw()
          pull()
        }
        img.onerror = () => { if (alive) pull() }
        img.src = asset(`/${folder}/${String(start + at).padStart(4, '0')}.webp`)
      }
      for (let i = 0; i < AT_ONCE; i += 1) pull()
    }

    // Nothing is fetched, and nothing is drawn, until the section is close.
    const watcher = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        fetchAll()
        watcher.disconnect()
      }
    }, { rootMargin: NEARBY })
    watcher.observe(canvas)

    // Redrawn straight from the scroll, which browsers already deliver at most
    // once per frame drawn. No loop turning behind three screens of text, and
    // nothing waiting a frame behind the scroll it belongs to.
    window.addEventListener('scroll', draw, { passive: true })
    window.addEventListener('resize', draw)
    draw()

    return () => {
      alive = false
      watcher.disconnect()
      window.removeEventListener('scroll', draw)
      window.removeEventListener('resize', draw)
    }
  }, [folder, count, start, frameRef, canvasRef])

  return <canvas ref={canvasRef} style={style} role="img" aria-label={label} />
}
