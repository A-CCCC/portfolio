// src/components/sound.js
//
// The two sounds the hidden games make. Each one plays a recording if there is
// one to play, and falls back to a synthesised stand-in if there is not — so the
// games are never silent, and dropping a file into public/game/ is all it takes
// to replace a beep with the real thing.
//
// Wanted here: Clash Royale's own Log rumble and balloon pop. Name them
//     public/game/log-start.<ext>
//     public/game/barrel-pop.<ext>
// in any of the formats below, and they are picked up on the next load.

import asset from '../lib-asset'

const KINDS = {
  start: 'log-start',
  over: 'barrel-pop',
}
const FORMATS = ['mp3', 'ogg', 'm4a', 'wav']

// One entry per sound: the element once something loaded, or false once every
// candidate has failed, so a missing file is looked for once and not again.
const clips = {}

const find = (kind) => {
  if (kind in clips) return
  clips[kind] = null                        // looking
  const tryNext = (i) => {
    if (i >= FORMATS.length) { clips[kind] = false; return }
    const el = new Audio(asset(`/game/${KINDS[kind]}.${FORMATS[i]}`))
    el.preload = 'auto'
    el.addEventListener('canplaythrough', () => { clips[kind] = el }, { once: true })
    el.addEventListener('error', () => tryNext(i + 1), { once: true })
  }
  tryNext(0)
}

// Called when a game mounts, so a recording is ready by the time it is wanted
// rather than being fetched at the moment it should already be playing.
export const preload = () => {
  Object.keys(KINDS).forEach(find)
}

// ---- the stand-ins ----------------------------------------------------------
//
// Built rather than loaded: a file would be a request and a download for a third
// of a second of beeping. Browsers refuse to start audio until someone has
// interacted with the page, so the context is made on the first sound asked for
// — which in both games follows a key or a click — and resumed if suspended.

let ctx = null

const context = () => {
  if (ctx) {
    if (ctx.state === 'suspended') ctx.resume()
    return ctx
  }
  const Sound = window.AudioContext || window.webkitAudioContext
  if (!Sound) return null                   // no audio here; the games do not mind
  ctx = new Sound()
  return ctx
}

// One note. The gain ramps rather than switching, or the start and end of it
// arrive as clicks louder than the note itself.
const note = (at, freq, seconds, level, shape = 'square') => {
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = shape
  osc.frequency.setValueAtTime(freq, at)
  gain.gain.setValueAtTime(0.0001, at)
  gain.gain.exponentialRampToValueAtTime(level, at + 0.012)
  gain.gain.exponentialRampToValueAtTime(0.0001, at + seconds)
  osc.connect(gain).connect(ctx.destination)
  osc.start(at)
  osc.stop(at + seconds + 0.02)
}

// A rumble for the log: a low tone sliding lower, which is as close as two
// oscillators get to something heavy rolling in.
const rumble = () => {
  const now = ctx.currentTime
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = 'sawtooth'
  osc.frequency.setValueAtTime(150, now)
  osc.frequency.exponentialRampToValueAtTime(46, now + 0.42)
  gain.gain.setValueAtTime(0.0001, now)
  gain.gain.exponentialRampToValueAtTime(0.16, now + 0.05)
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.46)
  osc.connect(gain).connect(ctx.destination)
  osc.start(now)
  osc.stop(now + 0.5)
  note(now + 0.02, 262, 0.10, 0.05, 'triangle')
}

// A pop: a very short burst of noise over a click, which is what a balloon
// going is, shorn of everything that makes it recognisable.
const pop = () => {
  const now = ctx.currentTime
  const length = Math.floor(ctx.sampleRate * 0.09)
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < length; i += 1) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / length) ** 3
  }
  const src = ctx.createBufferSource()
  const gain = ctx.createGain()
  src.buffer = buffer
  gain.gain.setValueAtTime(0.32, now)
  src.connect(gain).connect(ctx.destination)
  src.start(now)
  note(now, 740, 0.045, 0.10, 'triangle')
}

const play = (kind, stand) => {
  const clip = clips[kind]
  if (clip) {
    clip.currentTime = 0
    // A refused play is not worth an unhandled rejection; the beep covers it.
    const started = clip.play()
    if (started && started.catch) started.catch(() => { if (context()) stand() })
    return
  }
  if (context()) stand()
}

export const playStart = () => play('start', rumble)
export const playOver = () => play('over', pop)
