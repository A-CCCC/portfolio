// src/hooks/useScrollFrames.js
//
// Turns scrolling through a tall section into a frame number, and makes sure
// there is a frame there to show.
//
// The frames are hundreds of separate files. Served from the same machine they
// arrive the instant they are asked for, so simply pointing an <img> at the
// current one looked fine — but over a network each one is a fresh request, and
// scrolling asks for a new one every few pixels. Most never arrived in time and
// the animation played a handful of frames.
//
// So they are fetched ahead, a few at a time, once the section is near enough to
// matter; and until a frame has arrived the last one that did is shown instead
// of an empty box.
import { useEffect, useMemo, useRef, useState } from 'react'
import asset from '../lib-asset'

const AT_ONCE = 6          // requests in flight; enough to fill a connection
const NEARBY = '200% 0px'  // start fetching about two screens ahead

const nameOf = (folder, frame) => asset(`/${folder}/${String(frame).padStart(4, '0')}.webp`)

export default function useScrollFrames(frameCount, startFrame = 1, folder = null) {
  const ref = useRef(null)
  const [frameIndex, setFrameIndex] = useState(startFrame)
  // How far through the runway the section is, alongside the frame it maps to:
  // the frame number alone cannot say how far a scrub has come without knowing
  // the frame count at the other end.
  const [progress, setProgress] = useState(0)
  // What has arrived is collected in a ref, which the loading effect may write
  // freely, and published to state now and then. Rendering reads the state: a
  // ref read while rendering is not tracked, so the picture would not change
  // when a frame turned up.
  const landed = useRef(new Set())
  const [here, setHere] = useState(() => new Set())

  useEffect(() => {
    const handleScroll = () => {
      const section = ref.current
      if (!section) return
      const rect = section.getBoundingClientRect()
      const runway = section.offsetHeight - window.innerHeight
      const scrolled = Math.max(0, Math.min(1, -rect.top / runway))
      const frame = startFrame + Math.floor(scrolled * frameCount)
      setFrameIndex(Math.min(frame, startFrame + frameCount - 1))
      setProgress(scrolled)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()   // set the right frame on mount (e.g. after a refresh)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [frameCount, startFrame])

  useEffect(() => {
    const section = ref.current
    if (!folder || !section || !frameCount) return undefined

    let stop = false
    let begun = false
    const fetchAll = () => {
      if (begun) return
      begun = true
      let next = 0
      const pull = () => {
        if (stop || next >= frameCount) {
          setHere(new Set(landed.current))
          return
        }
        const offset = next
        next += 1
        const img = new Image()
        const done = () => {
          if (stop) return
          landed.current.add(startFrame + offset)
          // Publishing on every one of several hundred arrivals is a great deal
          // of rendering to show the same picture; every eighth keeps the frame
          // on screen in step with what has landed.
          if (offset % 8 === 0) setHere(new Set(landed.current))
          pull()
        }
        img.onload = done
        img.onerror = done
        img.src = nameOf(folder, startFrame + offset)
      }
      for (let i = 0; i < AT_ONCE; i += 1) pull()
    }

    const watcher = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        fetchAll()
        watcher.disconnect()
      }
    }, { rootMargin: NEARBY })
    watcher.observe(section)

    return () => {
      stop = true
      watcher.disconnect()
    }
  }, [folder, frameCount, startFrame])

  // The frame asked for if it is here, otherwise the nearest one behind it that
  // is — so the picture holds rather than blanking while the next one loads.
  const frameSrc = useMemo(() => {
    if (!folder) return null
    let frame = frameIndex
    while (frame > startFrame && !here.has(frame)) frame -= 1
    return nameOf(folder, frame)
  }, [folder, frameIndex, startFrame, here])

  return [ref, frameIndex, progress, frameSrc]
}
