// src/components/BuildVideo.jsx
//
// A build timelapse with the small controls the project pages use: a round
// play/pause/replay button and a hairline scrubber along the bottom. Shared
// rather than written per page — the playback state, the observer that starts
// it, and the seeking logic are the same wherever a build video appears.
import { useEffect, useRef, useState } from 'react'
import { Pause, Play, RotateCcw } from 'lucide-react'

// The round button's size sets where the whole control row sits: the scrubber is
// centred on the button, so a smaller button brings both closer to the edge.
const BUTTON = 32
// One inset all round. The videos are encoded with a strip of background along
// the bottom for this row to sit in (see scripts/make-build-video.py), so 32px
// from every edge puts the controls under the model rather than over it.
const INSET = 32
const ICON = 15   // one size for play, pause and replay

export default function BuildVideo({ src, label = 'Build timelapse' }) {
  const videoRef = useRef(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [hasEnded, setHasEnded] = useState(false)
  // How far through the clip is, 0 to 1: drawn as the scrubber's fill, and
  // written back to the video when the scrubber is dragged.
  const [played, setPlayed] = useState(0)

  // Play once it has been scrolled to, rather than on load.
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          video.play().catch(() => {})   // the browser may block it; no matter
          observer.unobserve(video)
        }
      },
      { threshold: 0.5 },
    )

    observer.observe(video)
    return () => observer.disconnect()
  }, [])

  // `timeupdate` fires roughly four times a second, so the bar advanced in
  // visible steps. While the video is playing the position is read every frame
  // instead; timeupdate still covers seeking and pausing.
  useEffect(() => {
    if (!isPlaying) return undefined
    let frame
    const follow = () => {
      const video = videoRef.current
      if (video && video.duration) setPlayed(video.currentTime / video.duration)
      frame = requestAnimationFrame(follow)
    }
    frame = requestAnimationFrame(follow)
    return () => cancelAnimationFrame(frame)
  }, [isPlaying])

  const toggle = () => {
    const video = videoRef.current
    if (!video) return
    if (hasEnded) {
      video.currentTime = 0
      video.play().catch(() => {})
    } else if (video.paused) {
      video.play().catch(() => {})
    } else {
      video.pause()
    }
  }

  const scrubTo = (fraction) => {
    const video = videoRef.current
    if (!video || !video.duration) return
    video.currentTime = fraction * video.duration
    setPlayed(fraction)
    if (fraction < 1) setHasEnded(false)   // scrubbing back means it is not finished
  }

  return (
    <div style={{
      flex: '1 1 0',
      minWidth: 320,
      display: 'flex',
      justifyContent: 'center',
      position: 'relative',
    }}>
      {/* The rounding lives on this, not on the video. A <video> is painted by
          the browser's own decoder, and several of them ignore a radius set on
          the element itself and hand back square corners — which is what the
          hosted site was showing. A wrapper that clips its contents is obeyed,
          and the isolation makes sure it gets its own layer to clip within
          rather than being flattened into the page. */}
      <div style={{
        position: 'relative',
        width: '100%',
        display: 'flex',
        justifyContent: 'center',
        borderRadius: 16,
        overflow: 'hidden',
        isolation: 'isolate',
      }}>
      <video
        ref={videoRef}
        src={src}
        muted
        playsInline
        preload="auto"
        onPlay={() => { setIsPlaying(true); setHasEnded(false) }}
        onPause={() => setIsPlaying(false)}
        onEnded={() => { setIsPlaying(false); setHasEnded(true); setPlayed(1) }}
        onTimeUpdate={(e) => {
          const { currentTime, duration } = e.currentTarget
          if (duration) setPlayed(currentTime / duration)
        }}
        style={{ width: '100%', maxHeight: '80vh', objectFit: 'contain', borderRadius: 16 }}
      />
      </div>

      {/* A range input, so dragging, clicking along it and arrow keys all work
          and it is announced properly. The styling that makes it a hairline is
          in index.css. */}
      <input
        type="range"
        className="video-scrubber"
        min={0}
        max={1000}
        value={Math.round(played * 1000)}
        onChange={(e) => scrubTo(Number(e.target.value) / 1000)}
        aria-label={`${label} position`}
        style={{
          position: 'absolute',
          // Centred on the button: the input is 16px tall for hit area while the
          // bar it draws is 4px, so its own offset sits 8px lower than the bar
          // appears.
          bottom: INSET + BUTTON / 2 - 8,
          left: INSET,
          // The same gap to the button as the bar keeps from the left edge, so
          // it sits evenly between the two.
          right: INSET * 2 + BUTTON,
          width: 'auto',
          '--played': played,
        }}
      />

      <button
        onClick={toggle}
        aria-label={hasEnded ? 'Replay' : isPlaying ? 'Pause' : 'Play'}
        className="video-button"
        style={{
          position: 'absolute',
          bottom: INSET,
          right: INSET,
          width: BUTTON,
          height: BUTTON,
          borderRadius: '50%',
          border: 'none',
          cursor: 'pointer',
          backdropFilter: 'blur(6px)',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          lineHeight: 1,
        }}
      >
        {/* Drawn icons rather than text glyphs: ▶ ❚❚ ↻ come from three different
            parts of the font, so they sat at different sizes and weights and
            had square corners. These are one set, one size, rounded. */}
        {hasEnded
          ? <RotateCcw size={ICON} strokeWidth={2.25} />
          : isPlaying
            ? <Pause size={ICON} strokeWidth={2.25} fill="currentColor" />
            : <Play size={ICON} strokeWidth={2.25} fill="currentColor" style={{ marginLeft: 1 }} />}
      </button>
    </div>
  )
}
