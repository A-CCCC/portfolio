// src/components/Portrait.jsx
import { useState } from 'react'
import asset from '../lib-asset'

const SRC = asset('/photos/about/profile.jpg')

// Shown in place of the photo if it ever fails to load, so neither about section
// can end up rendering a broken image.
const INITIAL = 'A'

export default function Portrait({ size = 150 }) {
  const [missing, setMissing] = useState(false)

  const frame = {
    width: size,
    height: size,
    borderRadius: '50%',
    flex: '0 0 auto',
    display: 'block',
    boxShadow: 'var(--card-shadow)',
  }

  if (missing) {
    return (
      <div
        style={{
          ...frame,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--card-2)',
          color: 'var(--text)',
          fontSize: size / 3.5,
          fontWeight: 300,
        }}
        aria-hidden="true"
      >
        {INITIAL}
      </div>
    )
  }

  return (
    <img
      src={SRC}
      alt="Alex"
      width={size}
      height={size}
      style={{
        ...frame,
        objectFit: 'cover',
        // Anchored to the top rather than the middle: the photo is taller than
        // it is wide and the head sits high in it, so a centered crop would take
        // the top off it and fill the bottom of the circle with shirt.
        objectPosition: '50% 0%',
      }}
      onError={() => setMissing(true)}
    />
  )
}
