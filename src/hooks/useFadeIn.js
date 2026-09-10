// src/hooks/useFadeIn.js
import { useEffect, useState } from 'react'

export default function useFadeIn(delay = 0) {
  const [opacity, setOpacity] = useState(0)

  useEffect(() => {
    const timer = setTimeout(() => setOpacity(1), delay)
    return () => clearTimeout(timer)
  }, [delay])

  return opacity
}