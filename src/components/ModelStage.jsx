// src/components/ModelStage.jsx
//
// The model itself, at the foot of a Clash Royale page, to be turned around by
// hand. The pictures above it show one angle at a time; this shows whichever
// angle the reader wants.
//
// Renders nothing without a model to show, so every page can carry the slot
// and only the pages with a file in public/models/ get a viewer. The 3D code
// is a chunk of its own, fetched when the section is a screen away — see
// model-scene.js — so a page costs nothing extra until its foot is near.
import { useEffect, useRef, useState } from 'react'
import { Minus, Plus, Rotate3d } from 'lucide-react'
import useFadeInOnScroll from '../hooks/useFadeInOnScroll'
import { TYPE } from '../styles/type'

const NEARBY = '100% 0px'      // start loading about a screen ahead

export default function ModelStage({ model, label }) {
  const [ref, opacity] = useFadeInOnScroll(0)
  const canvasRef = useRef(null)
  const sceneRef = useRef(null)          // what the scene hands back once mounted
  const [state, setState] = useState('waiting')   // waiting | loading | ready | failed
  const [held, setHeld] = useState(false)          // has anyone taken hold of it yet

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !model) return undefined
    let alive = true
    let scene = null

    const begin = async () => {
      setState('loading')
      try {
        const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches
        const { mount } = await import('./model-scene')
        if (!alive) return
        scene = await mount(canvas, model.url, { still, turn: model.turn, onHold: () => setHeld(true) })
        if (!alive) { scene.stop(); return }
        sceneRef.current = scene
        setState('ready')
      } catch (err) {
        // No WebGL, or a file that did not arrive. The page goes on without
        // the viewer rather than with a blank box.
        console.warn('model viewer:', err)
        if (alive) setState('failed')
      }
    }

    const watcher = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        watcher.disconnect()
        begin()
      }
    }, { rootMargin: NEARBY })
    watcher.observe(canvas)

    return () => {
      alive = false
      watcher.disconnect()
      if (scene) scene.stop()
      sceneRef.current = null
    }
  }, [model?.url])

  if (!model || state === 'failed') return null

  return (
    <div
      ref={ref}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '80px var(--gutter) 96px',
        background: 'var(--bg)',
        textAlign: 'center',
        opacity,
        transition: 'opacity 1.5s ease',
      }}
    >
      <h2 className="glass-title" data-text="The Model" style={{
        fontSize: TYPE.section,
        fontWeight: 300,
        margin: '0 0 28px',
      }}>
        The Model
      </h2>

      {/* The stage: lit in the model's own tint, the way the home page floats
          each project in a disc of it, with the site's card shadow under it.
          The canvas is transparent, so the model stands on this, and the
          scene throws its shadow onto it. */}
      <div
        className="glass model-stage"
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: 960,
          height: 'clamp(320px, 62vh, 640px)',
          borderRadius: 32,
          '--lg-tint': `var(--glass-${model.tint})`,
          overflow: 'hidden',
        }}
      >
        <canvas
          ref={canvasRef}
          role="img"
          aria-label={label}
          style={{
            display: 'block',
            width: '100%',
            height: '100%',
            cursor: state === 'ready' ? 'grab' : 'default',
            touchAction: 'pan-y',   // a finger can still scroll past it
            opacity: state === 'ready' ? 1 : 0,
            transition: 'opacity 0.8s ease',
          }}
        />

        {/* What to do with it, said once. It fades the moment someone does. */}
        <div
          className="glass model-hint"
          aria-hidden={held || state !== 'ready'}
          style={{ opacity: state === 'ready' && !held ? 1 : 0 }}
        >
          <Rotate3d size={16} strokeWidth={1.8} aria-hidden="true" />
          Drag to turn · pinch to zoom
        </div>

        {/* Closer and further, for anyone without a wheel or a second
            finger — and a way to know it zooms at all. */}
        {state === 'ready' && (
          <div className="model-zoom">
            <button type="button" className="glass" aria-label="Zoom in" onClick={() => sceneRef.current?.zoomBy(0.8)}>
              <Plus size={16} strokeWidth={2} aria-hidden="true" />
            </button>
            <button type="button" className="glass" aria-label="Zoom out" onClick={() => sceneRef.current?.zoomBy(1.25)}>
              <Minus size={16} strokeWidth={2} aria-hidden="true" />
            </button>
          </div>
        )}

        {state !== 'ready' && (
          <p
            aria-live="polite"
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: 0,
              fontSize: TYPE.small,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: 'var(--text-muted)',
            }}
          >
            {state === 'loading' ? 'Loading the model' : ''}
          </p>
        )}
      </div>
    </div>
  )
}
