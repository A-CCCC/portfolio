// src/hooks/useScrollFrames.js
import { useEffect, useRef, useState } from 'react'

export default function useScrollFrames(frameCount, startFrame = 1) {
  const ref = useRef(null)
  const [frameIndex, setFrameIndex] = useState(startFrame)
  // How far through the runway the section is, alongside the frame it maps to:
  // the frame number alone cannot say how far a scrub has come without knowing
  // the frame count at the other end.
  const [progress, setProgress] = useState(0)

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

  return [ref, frameIndex, progress]
}