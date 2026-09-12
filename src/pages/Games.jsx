// src/pages/Games.jsx
//
// Not in the navbar and not linked from anywhere obvious: the way in is the
// Skeleton Barrel on the projects hub. Anyone who lands here found it.
import { Link } from 'react-router-dom'
import useFadeIn from '../hooks/useFadeIn'
import { TYPE } from '../styles/type'
import asset from '../lib-asset'

const GAMES = [
  {
    title: 'The Log Game',
    path: '/log',
    blurb: 'The Log rolls, everything else comes at it. Jump the ones on the '
      + 'ground, duck the barrels overhead.',
    image: asset('/thumbnails/the-log.webp'),
  },
  {
    title: 'Flappy Barrel',
    path: '/barrel',
    blurb: 'Keep the Skeleton Barrel in the air and thread the columns. '
      + 'Gravity never lets up.',
    image: asset('/game/skeleton-barrel.png'),
  },
]

export default function Games() {
  const titleOpacity = useFadeIn(100)
  const introOpacity = useFadeIn(500)
  const listOpacity = useFadeIn(900)

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
      padding: '140px 24px 100px',
      textAlign: 'center',
    }}>
      <h1 style={{
        fontSize: TYPE.pageTitle,
        fontWeight: 'bold',
        letterSpacing: '-0.01em',
        marginBottom: 16,
        opacity: titleOpacity,
        transition: 'opacity 1.5s ease',
      }}>
        Games
      </h1>

      <p className="page-intro-line" style={{
        fontSize: TYPE.body,
        lineHeight: 1.7,
        color: 'var(--text-muted)',
        marginBottom: 64,
        opacity: introOpacity,
        transition: 'opacity 1.5s ease',
      }}>
        You found an easter egg! Try out these games made with my models.
      </p>

      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 40,
        width: '100%',
        maxWidth: 760,
        opacity: listOpacity,
        transition: 'opacity 1.5s ease',
      }}>
        {GAMES.map((game) => (
          // The whole card is the control here, unlike the hub bands: there is
          // nothing else on it to click, so a picture that navigates is no trap.
          <Link
            key={game.path}
            to={game.path}
            className="game-card"
            style={{ color: 'inherit', textDecoration: 'none', flex: '1 1 300px', maxWidth: 340 }}
          >
            <div style={{
              height: 180,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 20,
            }}>
              <img
                src={game.image}
                alt=""
                style={{ maxHeight: '100%', maxWidth: '60%', display: 'block' }}
              />
            </div>

            <h2 style={{
              fontSize: TYPE.card,
              fontWeight: 400,
              letterSpacing: '-0.01em',
              margin: '0 0 10px',
            }}>
              {game.title}
            </h2>

            <p style={{
              margin: 0,
              fontSize: TYPE.small,
              lineHeight: 1.6,
              color: 'var(--text-body)',
            }}>
              {game.blurb}
            </p>
          </Link>
        ))}
      </div>
    </div>
  )
}
