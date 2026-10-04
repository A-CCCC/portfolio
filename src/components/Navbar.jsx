// src/components/Navbar.jsx
import { useEffect, useRef, useState } from 'react'
import { ArrowUp, Menu, X } from 'lucide-react'
import { TYPE } from '../styles/type'
import { Link, useLocation } from 'react-router-dom'
import useIsPhone from '../hooks/useIsPhone'
import { PENDING } from '../data/pending'

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

// Fast, but traveled rather than jumped: the page keeps everything it has
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
          { label: 'Moth Trap', path: '/solutions/convenience/moth-trap' },
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
        label: 'Halloween',
        path: '/projects/halloween',
        items: [
          { label: 'Darth Vader', path: '/projects/halloween/darth-vader' },
          { label: 'Stormtrooper', path: '/projects/halloween/stormtrooper' },
          { label: 'Scout Trooper', path: '/projects/halloween/scout-trooper' },
          { label: 'Electrobinoculars', path: '/projects/halloween/electrobinoculars' },
          { label: 'Lightsaber', path: '/projects/halloween/lightsaber' },
          { label: 'Minecraft', path: '/projects/halloween/minecraft' },
        ],
      },
      {
        label: 'Miscellaneous',
        path: '/projects/misc',
        items: [
          { label: 'RC Car Repair', path: '/projects/misc/rc-car-repair' },
        ],
      },
    ],
  },
]

// What is for sale, and — where the copy for it exists — the ways to get in
// touch as well. Both sites have the page: the listings on it are public
// already, which is the point of them.
const REACH = { path: '/services', label: 'Services' }

const linkStyle = {
  color: 'var(--text)',
  textDecoration: 'none',
  fontSize: TYPE.small,
}

// The bold comes on at once, not over a transition: a weight that
// animates is laid out and painted afresh on every frame, the whole page
// with it, and every other animation on the page stuttered for the 200ms
// of it. The label reserves its bold width (see .nav-label), so nothing
// moves when it switches.
const hoverStyle = (isHovered) => ({
  fontWeight: isHovered ? 600 : 400,
  borderRadius: 8,
  position: 'relative',
  isolation: 'isolate',
})

// The highlight under a hovered link: a pill of glass, always there under the
// text and shown only while the pointer rests on it. A glass surface cannot
// fade in by changing its background, so it is its own layer, and only its
// opacity moves.
const Lit = ({ on }) => <i className="glass glass-vivid nav-lit" aria-hidden="true" style={{ opacity: on ? 1 : 0 }} />

// A small star after the name of a page that is not finished, and — for a
// pointer that rests on it — the reason, fading in beneath. Said in words for
// a screen reader too, since a star is not a word.
function Star() {
  return (
    <span className="nav-star" aria-hidden="false">
      <span aria-hidden="true">*</span>
      <span className="sr-only"> (under construction)</span>
    </span>
  )
}

// How long the phone's sheet takes to leave; the stylesheet's exit animation
// is the same length, so the element is removed as it finishes.
const SHEET_OUT = 220

const dropdownStyle = {
  position: 'absolute',
  borderRadius: 12,
  padding: 4,
  minWidth: 180,
}

export default function Navbar() {
  const [openTab, setOpenTab] = useState(null)
  // A phone gets the same links behind a button. Hover is what opens the
  // menus here, and a touch screen never hovers, so the tabs would be a row
  // of dead ends even if they fitted.
  const phone = useIsPhone()
  const [menuOpen, setMenuOpen] = useState(false)
  // The sheet stays in the tree for a moment after it is told to close, so it
  // can slide away rather than vanish; `shown` is what is actually rendered.
  const [shown, setShown] = useState(false)
  useEffect(() => {
    if (menuOpen) { setShown(true); return undefined }
    const t = setTimeout(() => setShown(false), SHEET_OUT)
    return () => clearTimeout(t)
  }, [menuOpen])
  const [openCategory, setOpenCategory] = useState(null)
  // Leaving a row or its submenu closes the submenu only after a moment:
  // the pointer crossing from the row into the submenu leaves the row for
  // a frame or two on the way (the two are siblings, with a seam between),
  // and a close on the instant cut the crossing off. Arriving anywhere
  // that keeps it open cancels the close.
  const closing = useRef(null)
  const dropping = useRef(false)
  // the open one, as of now — not as of the last render, which a pointer
  // already over the next row can be ahead of
  const current = useRef(null)
  const holdCategory = (label) => { clearTimeout(closing.current); dropping.current = false; current.current = label; setOpenCategory(label) }
  const dropCategory = () => { clearTimeout(closing.current); dropping.current = true; closing.current = setTimeout(() => { dropping.current = false; setOpenCategory(null) }, 220) }
  // and a backstop for that: while a submenu is open, a pointer anywhere but
  // its row or the submenu itself lets it go. A quick move (a trackpad's
  // flick, most of all) could leave the row without the browser saying so,
  // and the submenu then stayed open under a pointer long gone from it.
  useEffect(() => {
    if (!openCategory) return undefined
    const check = (e) => {
      const t = e.target
      if (t.closest?.('.nav-submenu') || t.closest?.('.nav-group')?.dataset.category === current.current) return
      // Off the menus altogether — back up to the bar's own label, say — it
      // goes at once: the moment's grace is for crossing the seam into the
      // submenu, and held for a pointer heading the other way, the row stayed
      // lit for half a second after it had gone.
      if (!t.closest?.('.nav-menu')) {
        clearTimeout(closing.current)
        dropping.current = false
        current.current = null
        setOpenCategory(null)
        return
      }
      if (!dropping.current) dropCategory()
    }
    document.addEventListener('pointermove', check, { passive: true })
    return () => document.removeEventListener('pointermove', check)
  }, [openCategory !== null])
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

  // A menu that is open is about where you are. Arriving somewhere new answers
  // it, so it closes itself rather than hanging over the page you asked for.
  useEffect(() => { setMenuOpen(false) }, [pathname])
  useEffect(() => { if (!phone) setMenuOpen(false) }, [phone])

  useEffect(() => {
    if (!menuOpen) return undefined
    const onKey = (e) => { if (e.key === 'Escape') setMenuOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [menuOpen])

  // The bar is drawn twice. The one underneath is the real thing — links,
  // menus, the lot. The one on top is the same bar in the panel's colors,
  // clipped to exactly the part of the navbar that the panel is behind. As the
  // edge of a panel travels up through the bar, the clip travels with it, so the
  // bar turns over a line rather than all at once.
  const links = (ghost) => (
    <>
        {/* Left side */}
        <Link
          to="/"
          className={`nav-label${phone ? ' nav-home-phone' : ''}`}
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
          <Lit on={hovered === 'home'} />
        </Link>

        {/* Centered between the two sides, and positioned rather than placed in the
            row: as a flex item it would push the links off center every time it
            came and went. */}
        <button
          type="button"
          onClick={rideToTop}
          aria-label="Back to the top"
          title="Back to the top"
          className="glass glass-vivid nav-top"
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

        {/* Right side. On a phone the whole of it folds into one button, and
            the links are listed under the bar instead. */}
        {phone ? (
          <button
            type="button"
            className="nav-toggle"
            aria-label={menuOpen ? 'Close the menu' : 'Open the menu'}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((was) => !was)}
            style={{ marginRight: -10 }}
          >
            {menuOpen
              ? <X size={22} strokeWidth={2} aria-hidden="true" />
              : <Menu size={22} strokeWidth={2} aria-hidden="true" />}
          </button>
        ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>

          {tabs.map((tab) => (
            <div
              key={tab.label}
              style={{ position: 'relative' }}
              onMouseEnter={() => setOpenTab(tab.label)}
              onMouseLeave={() => { setOpenTab(null); clearTimeout(closing.current); setOpenCategory(null) }}
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
                <Lit on={openTab === tab.label} />
              </Link>

              {!ghost && openTab === tab.label && (
                <div
                  className="glass glass-vivid nav-menu"
                  ref={(el) => { if (el) el.parentElement.style.setProperty('--menu-w', `${el.offsetWidth - 1}px`) }}
                  style={{ ...dropdownStyle, top: '100%', left: 0, minWidth: 140 }}
                >
                  {tab.categories.map((category, row) => (
                    <div
                      key={category.label}
                      className="nav-group"
                      data-category={category.label}
                      onMouseEnter={() => holdCategory(category.label)}
                      onMouseLeave={dropCategory}
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
                        <Lit on={openCategory === category.label} />
                      </Link>

                    </div>
                  ))}
                </div>
              )}

              {/* The submenu: beside the menu rather than inside it. A glass
                  surface sees only through its nearest ancestor that is
                  glass itself, so a submenu inside the menu blurred the
                  menu's blur and not the page; out here it sees the page.
                  Level with the row it opens from, its left edge on the
                  menu's right edge, the corners on that side square. The
                  menu's width is measured, since the submenu is no longer
                  laid out against it. */}
              {!ghost && openTab === tab.label && (() => {
                const row = tab.categories.findIndex((c) => c.label === openCategory)
                const category = row >= 0 ? tab.categories[row] : null
                if (!category || category.items.length === 0) return null
                return (
                  <div
                    // Keyed by its category: moving to another row hands this a
                    // new element, so its open plays again; without the key the
                    // one element is kept and only its rows change.
                    key={category.label}
                    className="glass glass-vivid nav-menu nav-submenu"
                    onMouseEnter={() => holdCategory(category.label)}
                    onMouseLeave={dropCategory}
                    style={{
                      ...dropdownStyle,
                      top: `calc(100% + ${row} * var(--nav-row))`,
                      left: 'var(--menu-w, 140px)',
                      minWidth: 150,
                      '--rows': category.items.length,
                    }}
                  >
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
                        {PENDING.has(item.path) && <Star />}
                        <Lit on={hovered === item.label} />
                      </Link>
                    ))}
                    {/* The note for a starred page, under the whole menu rather
                        than under its row — a row's note printed over the row
                        below it — shown while a starred row is pointed at. */}
                    <span
                      className="nav-star-tip"
                      aria-hidden="true"
                      style={{ opacity: category.items.some((it) => it.label === hovered && PENDING.has(it.path)) ? 1 : 0 }}
                    >
                      This page is under construction
                    </span>
                  </div>
                )
              })()}
            </div>
          ))}

          <Link
            to={REACH.path}
            className="nav-label"
            data-label={REACH.label}
            onMouseEnter={() => setHovered('contact')}
            onMouseLeave={() => setHovered(null)}
            style={{
              ...linkStyle,
              ...hoverStyle(hovered === 'contact'),
              padding: '8px 14px',
            }}
          >
            {REACH.label}
            <Lit on={hovered === 'contact'} />
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
            <Lit on={hovered === 'about'} />
          </Link>

        </div>
        )}
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
      // On the dark page the alternate band is only a shade off the page,
      // and the bar turning over as it crosses one made more of the edge
      // than there is; it turns over only on the light page, where the
      // band is the dark page's own colour.
      const dark = getComputedStyle(document.documentElement).colorScheme === 'dark'
      for (const panel of dark ? [] : document.querySelectorAll('[data-inverted]')) {
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
    // and when the theme turns over, since the bar turns only on the light page
    const themed = new MutationObserver(measure)
    themed.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
    return () => {
      themed.disconnect()
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
      padding: phone ? '12px 20px' : '12px 32px',
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
            padding: phone ? '12px 20px' : '12px 32px',
            pointerEvents: 'none',
            // Always here, and showing nothing until there is something to show:
            // mounting it on the way past would cost a render exactly when the
            // scroll can least afford one.
            clipPath: HIDDEN,
            // The panel's own colors, handed to the same styles the real bar
            // uses — nothing below needs to know it is being inverted. Its
            // glass too (data-glass-inverted, which the stylesheet treats as
            // an inverted panel; not data-inverted, which the bar looks for
            // to know when to turn over).
            '--text': 'var(--band-ink)',
            '--text-body': 'var(--band-body)',
            '--text-muted': 'var(--band-body)',
            '--border': 'var(--band-body)',
            '--hover': 'var(--band-hover)',
          }}
          data-glass-inverted=""
        >
        {links(true)}
      </div>

      {/* The links, listed. Only the real bar has it — the inverted copy is a
          picture of the bar and has nothing to open. */}
      {phone && shown && (
        <>
          {/* Anywhere else on the page closes it. Starts below the bar so the
              button that opened it can still be pressed to shut it, and lies at
              the same depth as the sheet — which is written after it, and so
              covers it wherever the two meet, leaving the links pressable. */}
          <div
            onClick={() => setMenuOpen(false)}
            className={`nav-veil${menuOpen ? '' : ' nav-veil-leaving'}`}
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              height: 'var(--screen)',
              zIndex: -1,
            }}
          />

          <div className={`glass glass-vivid nav-sheet${menuOpen ? '' : ' nav-sheet-leaving'}`} aria-hidden={!menuOpen}>
            {/* No Home here: the bar's own Home, which the sheet paints under,
                is the first item of this list — see .nav-home-phone. */}

            {/* Each link arrives a beat after the one above it — its place in
                the list sets the delay. */}
            {(() => { let n = 0; const at = () => ({ '--i': n++ }); return (
              <>
                {tabs.map((tab) => (
                  <div key={tab.label}>
                    <Link to={tab.path} className="nav-sheet-link" style={at()}>{tab.label}</Link>
                    {tab.categories.map((category) => (
                      <Link
                        key={category.label}
                        to={category.path}
                        className="nav-sheet-link nav-sheet-sub"
                        style={at()}
                      >
                        {category.label}
                      </Link>
                    ))}
                  </div>
                ))}

                <Link to={REACH.path} className="nav-sheet-link" style={at()}>{REACH.label}</Link>
                <Link to="/about" className="nav-sheet-link" style={at()}>About Me</Link>
              </>
            ) })()}
          </div>
        </>
      )}

    </nav>
  )
}
