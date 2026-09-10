// src/pages/projects/ElixirCollector.jsx
import useFadeIn from '../../hooks/useFadeIn'
import { TYPE } from '../../styles/type'
import useScrollFrames from '../../hooks/useScrollFrames'
import useFadeInOnScroll from '../../hooks/useFadeInOnScroll'
import ScrollHint from '../../components/ScrollHint'
import BuildVideo from '../../components/BuildVideo'
import ContextNote from '../../components/ContextNote'

export default function ElixirCollector() {
  const [sectionRef, frameIndex, scrubProgress] = useScrollFrames(201, 0)
  const titleOpacity = useFadeIn(100)
  // Second, so the line under the title arrives after it rather than with it.
  const introOpacity = useFadeIn(600)
  const [textRef, textOpacity] = useFadeInOnScroll(0)
  const [buildRef, buildOpacity] = useFadeInOnScroll(0)
  const [buildBodyRef, buildBodyOpacity] = useFadeInOnScroll(0)

  return (
    <div style={{ background: 'var(--bg)', color: 'var(--text)', fontFamily: 'system-ui' }}>

      {/* ---- SECTION 1: Intro ---- */}
      <div style={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <h1 style={{
          fontSize: TYPE.pageTitle,
          fontWeight: 'bold',
          letterSpacing: '0.01em',
          color: 'var(--text)',
          marginBottom: 24,
          opacity: titleOpacity,
          transition: 'opacity 1.5s ease',
        }}>
          Elixir Collector
        </h1>
        <p className="page-intro-line" style={{
          fontSize: TYPE.lead,
          lineHeight: 1.7,
          color: 'var(--text-body)',
          textAlign: 'center',
          padding: '0 24px',
          opacity: introOpacity,
          transition: 'opacity 1.5s ease',
        }}>
          A multi-part model built around a sweep following a 3D path.
        </p>
      </div>

      {/* ---- SECTION 2: Scroll-scrubbed animation (left) + text (right) ---- */}
      <div ref={sectionRef} style={{ height: '200vh', position: 'relative' }}>
        <div style={{
          position: 'sticky',
          top: 0,
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 64,
          padding: '0 64px',
          background: 'var(--bg)',
        }}>

          {/* Left: animation */}
          <div style={{
            flex: '1 1 0',
            minWidth: 320,
            display: 'flex',
            justifyContent: 'center',
          }}>
            <img
              src={`/elixir-collector-anim/${String(frameIndex).padStart(4, '0')}.webp`}
              style={{ height: '77vh', maxWidth: '100%', objectFit: 'contain' }}
              alt=""
            />
          </div>

          {/* Right: text */}
          <div
            ref={textRef}
            style={{
              flex: '1 1 0',
              maxWidth: 480,
              opacity: textOpacity,
              transition: 'opacity 1.5s ease',
            }}
          >
            <h2 style={{ fontSize: TYPE.section, fontWeight: '300', marginBottom: 24 }}>
              Meet the Elixir Collector,
              Starring the Sweep Tool
            </h2>
          </div>


          {/* First-timer's nudge: the page pins here, which reads as having
              stopped rather than as an animation waiting to be scrubbed. */}
          <ScrollHint id="elixir-collector" progress={scrubProgress} />
        </div>
      </div>

{/* TODO: why this model was made, as on the Skeleton Barrel page. */}
      <ContextNote></ContextNote>

      {/* ---- SECTION 3: Build video (plays when scrolled to) ---- */}
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 64,
        padding: '80px 64px',
        background: 'var(--bg)',
      }}>


      {/* Left: text */}
        <div style={{ flex: '1 1 0', maxWidth: 480 }}>
          <h2
            ref={buildRef}
            style={{
              fontSize: TYPE.section,
              fontWeight: '300',
              marginBottom: 24,
              opacity: buildOpacity,
              transition: 'opacity 1.5s ease',
            }}
          >
            Building the Model
          </h2>
          <p
            ref={buildBodyRef}
            style={{
              fontSize: TYPE.body,
              lineHeight: 1.7,
              color: 'var(--text-body)',
              textWrap: 'pretty',
              opacity: buildBodyOpacity,
              transition: 'opacity 1.5s ease',
            }}
          >
            I started by sketching a top-down view of the model, beginning with the concrete base
            and the bottom of the collector. From there, I worked upward, adding and editing shapes
            as I went — the original sketch started simple and grew more complex with each pass.
            After building the main body of the collector, I moved on to the tube. I tested a few
            different angles against reference images, and the second one lined up well enough to
            build from. I used multiple perpendicular construction planes for each segment of the
            tube, projecting geometry so the pieces met cleanly. The last steps were filleting and
            chamfering the edges and building the wheel.
          </p>
        </div>

        <BuildVideo src="/videos/elixir-collector-build.mp4" label="Elixir Collector build" />
      </div>

    </div>
  )
}