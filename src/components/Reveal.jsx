// src/components/Reveal.jsx
//
// Fades its contents in when they reach the point on screen where someone would
// actually be looking at them.
//
// One of these per block, rather than one per section: a section can be taller
// than the window, and fading all of it on the first thing to appear means
// everything below has already finished by the time it is read. Paragraphs down
// a column each get their own, so each arrives as it is come to.
import useFadeInOnScroll from '../hooks/useFadeInOnScroll'

export default function Reveal({ delay = 0, rise = 0, style, children }) {
  const [ref, opacity] = useFadeInOnScroll(delay)

  return (
    <div
      ref={ref}
      style={{
        ...style,
        opacity,
        // Rises as it fades, where asked for — pictures do this on the project
        // pages, text does not.
        transform: rise ? `translateY(${((1 - opacity) * rise).toFixed(1)}px)` : undefined,
        transition: rise
          ? 'opacity 1.5s ease, transform 1.5s cubic-bezier(0.22, 1, 0.36, 1)'
          : 'opacity 1.5s ease',
      }}
    >
      {children}
    </div>
  )
}
