// src/components/Navbar.jsx
import { useEffect, useRef, useState } from 'react'
import { ArrowUp } from 'lucide-react'
import { isFullSite } from '../data/site-copy'
import { TYPE } from '../styles/type'
import { Link, useLocation } from 'react-router-dom'

// The way back up appears once the end of a page is in sight — near the bottom,
// where the walk back is longest and there is nothing below to go on to.
const NEAR_BOTTOM = 1        // screens left to scroll

// The tints hang this far below the bar, where they fade out. They are therefore
// taller than the bar, and a clip meant for the bar leaves exactly this much of
// them behind — which showed as a permanent strip of the wrong gradient across
// the top of the navbar.
const TINT_TAIL = 32


// Only on the pages that are read rather than chosen from. A hub is a short
// stack of panels meant to be scrolled through and picked from, and its bottom
// is a destination — the way on is the next panel, not the way back. The pages
// underneath them are long and are read to the end, which is where a walk back
// to the top is worth having.
//
// Told apart by depth: /solutions and /solutions/accessibility are hubs, while
// /solutions/accessibility/wheelchair-storage is a page about something. Home,
// About, Contact and the games sit at the top level and are hubs by this rule
// too, which is right — none of them is long enough to strand anyone.
const isContentPage = (path) => path.split('/').filter(Boolean).length >= 3
const RIDE = 620             // ms to get back up, whatever the distance

// Fast, but travelled rather than jumped: the page keeps everything it has
// faded in on the way past, which a reload or a hard jump to the top would not.
// Eased out, so it arrives rather than stops. The same time from anywhere, so a
// long page is not a long wait.
const rideToTop = () => {
  const from = window.scrollY
  if (!from) return
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    window.scrollTo(0, 0)
    return
  }
  const started = performance.now()
  const step = (now) => {
    const t = Math.min(1, (now - started) / RIDE)
    const eased = 1 - (1 - t) ** 3
    window.scrollTo(0, Math.round(from * (1 - eased)))
    if (t < 1) requestAnimationFrame(step)
  }
  requestAnimationFrame(step)
}

const tabs = [
  {
    label: 'Solutions',
    path: '/solutions',
    categories: [
      {
        label: 'Accessibility',
        path: '/solutions/accessibility',
        items: [
          { label: 'Wheelchair Storage', path: '/solutions/accessibility/wheelchair-storage' },
          { label: 'Smart Kinesiology Tape', path: '/solutions/accessibility/smart-kinesiology-tape' },
        ],
      },
      {
        label: 'Convenience',
        path: '/solutions/convenience',
        items: [
          { label: 'Backup Camera Wiper', path: '/solutions/convenience/backup-camera-wiper' },
          { label: 'Modular Car Container', path: '/solutions/convenience/modular-car-container' },
          { label: 'Sunglasses Holder', path: '/solutions/convenience/sunglasses-holder' },
          { label: 'Car Key Holder', path: '/solutions/convenience/car-key-holder' },
          { label: 'Ketchup Extruder', path: '/solutions/convenience/ketchup-extruder' },
        ],
      },
    ],
  },
  {
    label: 'Projects',
    path: '/projects',
    categories: [
      {
        label: 'Clash Royale',
        path: '/projects/clash-royale',
        items: [
          { label: 'Skeleton Barrel', path: '/projects/clash-royale/skeleton-barrel' },
          { label: 'Elixir Collector', path: '/projects/clash-royale/elixir-collector' },
          { label: 'Cannon Cart', path: '/projects/clash-royale/cannon-cart' },
          { label: 'Mortar', path: '/projects/clash-royale/mortar' },
          // the-log: { label: 'The Log', path: '/projects/clash-royale/the-log' },
        ],
      },
      {
        label: 'Miscellaneous',
        path: '/projects/misc',
        items: [
          { label: 'Halloween Helmets', path: '/projects/misc/halloween-helmets' },
          { label: 'RC Car Repair', path: '/projects/misc/rc-car-repair' },
        ],
      },
    ],
  },
]

const linkStyle = {
  color: 'var(--text)',
  textDecoration: 'none',
  fontSize: TYPE.small,
}

const hoverStyle = (isHovered) => ({
  fontWeight: isHovered ? 600 : 400,
  background: isHovered ? 'var(--hover)' : 'transparent',
  borderRadius: 8,
  transition: 'background 0.2s ease, font-weight 0.2s ease',
})

const dropdownStyle = {
  position: 'absolute',
  background: 'var(--panel)',
  backdropFilter: 'blur(10px)',
  boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
  borderRadius: 8,
  padding: 4,
  minWidth: 180,
}

export default function Navbar() {
  const [openTab, setOpenTab] = useState(null)
  const [openCategory, setOpenCategory] = useState(null)
  const [hovered, setHovered] = useState(null)
  const [nearBottom, setNearBottom] = useState(false)
  // The clips are written straight onto these rather than held in state. A
  // scroll event is delivered before the frame it belongs to is painted, so a
  // style set here lands with it; going through React means rendering afterwards
  // and the clip arriving a frame behind the panel it is meant to follow, which
  // shows as the blur sliding out of step while scrolling.
  const navRef = useRef(null)
  const ghostRef = useRef(null)
  const ghostTintRef = useRef(null)
  const lightRef = useRef(null)
  const darkRef = useRef(null)

  // Nothing showing: the whole of it clipped away.
  const HIDDEN = 'inset(100% 0 0 0)'
  const { pathname } = useLocation()
  const offersTop = isContentPage(pathname) && nearBottom

  useEffect(() => {
    const look = () => {
      const left = document.documentElement.scrollHeight - window.scrollY - window.innerHeight
      // Somewhere to come back from, as well as somewhere to go: on a page barely
      // taller than the window the bottom is always in sight and the arrow would
      // simply live there.
      setNearBottom(window.scrollY > window.innerHeight && left < window.innerHeight * NEAR_BOTTOM)
    }
    look()
    window.addEventListener('scroll', look, { passive: true })
    window.addEventListener('resize', look)
    return () => {
      window.removeEventListener('scroll', look)
      window.removeEventListener('resize', look)
    }
  }, [])

  // The bar is drawn twice. The one underneath is the real thing — links,
  // menus, the lot. The one on top is the same bar in the panel's colours,
  // clipped to exactly the part of the navbar that the panel is behind. As the
  // edge of a panel travels up through the bar, the clip travels with it, so the
  // bar turns over a line rather than all at once.
  const links = (ghost) => (
    <>
        {/* Left side */}
        <Link
          to="/"
          className="nav-label"
          data-label="Home"
          onMouseEnter={() => setHovered('home')}
          onMouseLeave={() => setHovered(null)}
          style={{
            ...linkStyle,
            ...hoverStyle(hovered === 'home'),
            padding: '8px 14px',
            marginLeft: -14,
          }}
        >
          Home
        </Link>

        {/* Centred between the two sides, and positioned rather than placed in the
            row: as a flex item it would push the links off centre every time it
            came and went. */}
        <button
          type="button"
          onClick={rideToTop}
          aria-label="Back to the top"
          title="Back to the top"
          className="nav-top"
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            opacity: offersTop ? 1 : 0,
            // Out of reach as well as out of sight when there is nothing to do
            pointerEvents: offersTop ? 'auto' : 'none',
          }}
        >
          <ArrowUp size={17} strokeWidth={2} aria-hidden="true" />
        </button>

        {/* Right side */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>

          {tabs.map((tab) => (
            <div
              key={tab.label}
              style={{ position: 'relative' }}
              onMouseEnter={() => setOpenTab(tab.label)}
              onMouseLeave={() => { setOpenTab(null); setOpenCategory(null) }}
            >
              <Link
                to={tab.path}
                className="nav-label"
                data-label={`${tab.label} ▾`}
                style={{
                  ...linkStyle,
                  ...hoverStyle(openTab === tab.label),
                  display: 'inline-block',
                  padding: '8px 14px',
                }}
              >
                {tab.label} ▾
              </Link>

              {!ghost && openTab === tab.label && (
                <div className="nav-menu" style={{ ...dropdownStyle, top: '100%', left: 0, minWidth: 140 }}>
                  {tab.categories.map((category) => (
                    <div
                      key={category.label}
                      style={{ position: 'relative' }}
                      onMouseEnter={() => setOpenCategory(category.label)}
                      onMouseLeave={() => setOpenCategory(null)}
                    >
                      <Link
                        to={category.path}
                        className="nav-label"
                        data-label={category.label}
                        style={{
                          ...linkStyle,
                          ...hoverStyle(openCategory === category.label),
                          padding: '10px 14px',
                          display: 'block',
                        }}
                      >
                        <span>{category.label}</span>
                      </Link>

                      {!ghost && category.items.length > 0 && openCategory === category.label && (
                        <div className="nav-menu" style={{ ...dropdownStyle, top: -4, left: '100%', minWidth: 150 }}>
                          {category.items.map((item) => (
                            <Link
                              key={item.label}
                              to={item.path}
                              className="nav-label"
                              data-label={item.label}
                              onMouseEnter={() => setHovered(item.label)}
                              onMouseLeave={() => setHovered(null)}
                              style={{
                                ...linkStyle,
                                ...hoverStyle(hovered === item.label),
                                display: 'block',
                                padding: '10px 14px',
                              }}
                            >
                              {item.label}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}

          {isFullSite && (
          <>
  <Link
              to="/contact"
              className="nav-label"
              data-label="Contact"
              onMouseEnter={() => setHovered('contact')}
              onMouseLeave={() => setHovered(null)}
              style={{
                ...linkStyle,
                ...hoverStyle(hovered === 'contact'),
                padding: '8px 14px',
              }}
            >
              Contact
            </Link>

            <Link
              to="/about"
              className="nav-label"
              data-label="About Me"
              onMouseEnter={() => setHovered('about')}
              onMouseLeave={() => setHovered(null)}
              style={{
                ...linkStyle,
                ...hoverStyle(hovered === 'about'),
                padding: '8px 14px',
                marginRight: -14,
              }}
            >
              About Me
            </Link>
          </>
          )}

        </div>
    </>
  )

  // Panels that are painted the inverse of the page announce themselves, and the
  // bar works out how much of itself is over one. Measured straight from the
  // scroll event: browsers already deliver those at most once a frame, so
  // holding the reading back for an animation frame would only make it later
  // than the paint it belongs to. Two rectangles and the bar's own is a cheap
  // enough thing to ask for.
  useEffect(() => {
    const measure = () => {
      const nav = navRef.current
      if (!nav || !ghostRef.current) return
      const bar = nav.getBoundingClientRect()
      let best = null
      for (const panel of document.querySelectorAll('[data-inverted]')) {
        const p = panel.getBoundingClientRect()
        const top = Math.max(bar.top, p.top)
        const bottom = Math.min(bar.bottom, p.bottom)
        if (bottom - top <= 0) continue
        // Whichever covers most of the bar, in case an edge falls inside it and
        // two are behind it at once.
        if (!best || bottom - top > best.bottom - best.top) best = { top, bottom }
      }
      if (!best) {
        ghostRef.current.style.clipPath = HIDDEN
        ghostTintRef.current.style.clipPath = HIDDEN
        lightRef.current.style.clipPath = 'none'
        darkRef.current.style.clipPath = 'none'
        return
      }
      // Insets rather than a single line, so it works the same whether a panel
      // is arriving from below or leaving over the top.
      const above = best.top - bar.top
      const below = bar.bottom - best.bottom
      // The links are clipped in the bar's own space
      ghostRef.current.style.clipPath =
        `inset(${above.toFixed(1)}px 0 ${below.toFixed(1)}px 0)`

      // The tints are clipped in theirs, which runs past the bar's bottom. A
      // panel that carries on below the bar carries on behind the tail as well.
      const tall = bar.height + TINT_TAIL
      const ends = below === 0 ? tall : bar.height - below
      ghostTintRef.current.style.clipPath =
        `inset(${above.toFixed(1)}px 0 ${(tall - ends).toFixed(1)}px 0)`
      // What is left is the strip on the other side. A panel is a screenful tall
      // and the bar is 58px, so one of its edges is always outside the bar and
      // what remains is a single strip; taking the larger of the two covers the
      // odd case where somehow it is not.
      const keep = above >= below
        ? `inset(0 0 ${(tall - above).toFixed(1)}px 0)`
        : `inset(${ends.toFixed(1)}px 0 0 0)`
      lightRef.current.style.clipPath = keep
      darkRef.current.style.clipPath = keep
    }
    measure()
    window.addEventListener('scroll', measure, { passive: true })
    window.addEventListener('resize', measure)
    return () => {
      window.removeEventListener('scroll', measure)
      window.removeEventListener('resize', measure)
    }
  }, [pathname])

  return (
    <nav ref={navRef} style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 100,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '12px 32px',
      fontFamily: 'system-ui',
    }}>

      {/* Blur backing layer — masked, sits behind the links */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: -32,
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        WebkitMaskImage: 'linear-gradient(to bottom, black 0%, transparent 100%)',
        maskImage: 'linear-gradient(to bottom, black 0%, transparent 100%)',
        pointerEvents: 'none',
        zIndex: -1,
      }}>
        {/* Two crossfading gradient tints, cut back to the page's own share of
            the bar whenever a panel has the rest. The blur beneath them is left
            whole — it is the same blur either way. */}
        <div ref={lightRef} className="nav-layer-light" />
        <div ref={darkRef} className="nav-layer-dark" />
      </div>


      {/* The panel's tint, taking over the bar from the page's. A sibling of the
          blur rather than a child of the clipped copy above: the copy is only as
          tall as the bar, and a tint clipped to that loses the tail it fades out
          along. */}
      <div ref={ghostTintRef} className="nav-ghost-tint" style={{ clipPath: HIDDEN }} />

      {links(false)}

      {/* The inverted copy. Announced to nobody and clickable by nothing: it is
          a picture of the bar, not a second one. */}
      <div
          ref={ghostRef}
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 32px',
            pointerEvents: 'none',
            // Always here, and showing nothing until there is something to show:
            // mounting it on the way past would cost a render exactly when the
            // scroll can least afford one.
            clipPath: HIDDEN,
            // The panel's own colours, handed to the same styles the real bar
            // uses — nothing below needs to know it is being inverted.
            '--text': 'var(--band-ink)',
            '--text-body': 'var(--band-body)',
            '--text-muted': 'var(--band-body)',
            '--border': 'var(--band-body)',
            '--hover': 'var(--band-hover)',
          }}
        >
        {links(true)}
      </div>

    </nav>
  )
}
