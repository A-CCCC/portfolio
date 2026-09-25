// src/pages/Games.jsx
//
// Not in the navbar and not linked from anywhere obvious: the way in is the
// Skeleton Barrel on the projects hub. Anyone who lands here found it.
//
// The three games sit on the same cards as the listings on the Services page:
// the model in a tinted disc, a name, a line, and the way on. Each one also
// shows what the person at this browser has managed, which is the only thing
// a hub for games can say that a list of names cannot.
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import useFadeIn from '../hooks/useFadeIn'
import { useIsShort } from '../hooks/useIsPhone'
import { TYPE } from '../styles/type'
import asset from '../lib-asset'

const GAMES = [
  {
    title: 'The Log Game',
    path: '/log',
    blurb: 'The Log rolls, everything else comes at it. Jump what is on the '
      + 'ground, duck the barrels overhead.',
    image: asset('/thumbnails/the-log.webp'),
    // Warm, like the wood
    tint: 2,
    best: 'log-runner-best',
    counts: 'meters',
  },
  {
    title: 'Flappy Barrel',
    path: '/barrel',
    blurb: 'Keep the Skeleton Barrel in the air and thread the columns. '
      + 'Gravity never lets up.',
    image: asset('/game/skeleton-barrel.png'),
    // Blue, like its balloons
    tint: 1,
    best: 'flappy-barrel-best',
    counts: 'columns',
  },
  {
    title: 'Model Snake',
    path: '/snake',
    blurb: 'Snake, fed on everything else in this portfolio. Each model eaten '
      + 'adds a block of its own color.',
    image: asset('/thumbnails/smart-kinesiology-tape.webp'),
    // Green, like the board it is played on
    tint: 3,
    best: 'model-snake-best',
    counts: 'models',
  },
]

// What this browser has managed. Read after mounting rather than while
// rendering: a private window throws on the way in, and a high score is not
// worth a blank page.
const useBests = () => {
  const [bests, setBests] = useState({})
  useEffect(() => {
    try {
      const found = {}
      GAMES.forEach((game) => {
        const score = Number(localStorage.getItem(game.best)) || 0
        if (score > 0) found[game.best] = score
      })
      setBests(found)
    } catch { /* fine — the cards simply say nothing */ }
  }, [])
  return bests
}

export default function Games() {
  const titleOpacity = useFadeIn(100)
  const introOpacity = useFadeIn(500)
  const listOpacity = useFadeIn(900)
  const bests = useBests()
  // A phone held sideways has about 390px of height for all three cards, the
  // title and the line under it, so everything gives up a little.
  const short = useIsShort()

  return (
    <div style={{
      minHeight: 'var(--screen)',
      background: 'var(--bg)',
      color: 'var(--text)',
      fontFamily: 'system-ui',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      // Narrower margins sideways too: at 64px a side the three cards cannot
      // sit in a row and fall to two, which leaves one of them orphaned.
      padding: short ? '70px 24px 18px' : '120px var(--gutter) 80px',
      textAlign: 'center',
    }}>
      <h1 style={{
        fontSize: TYPE.pageTitle,
        fontWeight: 'bold',
        letterSpacing: '-0.01em',
        marginBottom: short ? 6 : 16,
        opacity: titleOpacity,
        transition: 'opacity 1.5s ease',
      }}>
        Games
      </h1>

      <p className="page-intro-line" style={{
        fontSize: TYPE.body,
        lineHeight: 1.7,
        color: 'var(--text-muted)',
        marginBottom: short ? 18 : 48,
        opacity: introOpacity,
        transition: 'opacity 1.5s ease',
      }}>
        You found an easter egg! Try out these games made with my models.
      </p>

      {/* Three across where there is room, one under another where there is
          not — the cards decide for themselves rather than at a breakpoint. */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: short ? 14 : 24,
        width: '100%',
        maxWidth: 980,
        opacity: listOpacity,
        transition: 'opacity 1.5s ease',
      }}>
        {GAMES.map((game) => (
          // The whole card is the control, as on Services: there is nothing
          // else on it to press, so a picture that navigates is no trap.
          <Link
            key={game.path}
            to={game.path}
            className="shop-card"
            // Everything gives up a little sideways on a phone: the card's own
            // padding, and the disc, which is sized for a page with height.
            style={short ? { padding: '14px 16px 12px' } : undefined}
          >
            <span
              className="shop-card-disc"
              style={{
                background: `var(--card-${game.tint})`,
                ...(short ? { width: 68, height: 68 } : {}),
              }}
            >
              <img src={game.image} alt="" />
            </span>

            <span style={{
              fontSize: TYPE.card,
              fontWeight: 400,
              letterSpacing: '-0.01em',
              margin: short ? '10px 0 0' : '20px 0 0',
            }}>
              {game.title}
            </span>

            {/* Held back on a screen with no height for it. The name and the
                model between them say which game this is, and the game itself
                says the rest. */}
            {!short && (
              <span style={{
                fontSize: TYPE.small,
                lineHeight: 1.6,
                color: 'var(--text-body)',
                margin: '8px 0 0',
              }}>
                {game.blurb}
              </span>
            )}

            {/* Only where there is something to say. A game not yet played says
                nothing rather than boasting a nought. */}
            <span style={{
              margin: short ? '6px 0 0' : '12px 0 0',
              fontSize: TYPE.caption,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: 'var(--text-muted)',
              minHeight: '1.2em',
            }}>
              {bests[game.best] ? `Best ${bests[game.best]} ${game.counts}` : ''}
            </span>

            <span
              className="shop-card-go"
              style={{ fontSize: TYPE.small, ...(short ? { marginTop: 8 } : {}) }}
            >
              Play
              <span className="count-arrow" aria-hidden="true">→</span>
            </span>
          </Link>
        ))}
      </div>
    </div>
  )
}
