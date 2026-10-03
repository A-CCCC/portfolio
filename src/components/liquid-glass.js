// src/components/liquid-glass.js
//
// Liquid glass, the way Apple draws it: not a blur with a highlight on top
// but a lens. Each glass surface is a slab of clear material with a rounded
// profile, and what is behind it is seen *through* it — bent inward at the
// edges where the slab curves, split faintly into colours at the rim where
// the bend is hardest, with the light reflected off the curved face as a
// moving highlight and a thin bright line of it along the rim.
//
// A browser cannot hand a shader the page's pixels. A lens that brings its
// own picture (a bubble's model) has it uploaded once and composited over
// the page's colour in the shader, every frame, at no cost but a draw;
// otherwise the backdrop is a picture of the page painted here, from what is on it: the page's colour,
// and the pictures and words of the elements registered as being behind
// the glass. It is repainted when the page changes and when it scrolls, and
// the lenses are drawn over it on one full-window canvas every frame.
//
// Each surface is registered with the element it stands in for, and its
// shape (a circle, or a rounded rectangle with a corner radius) and
// thickness are read from that element. The CSS glass stays underneath for
// anyone without WebGL, and is the whole of it on pages this is not on.

import { lightNow } from './useLight'

// The quad covers only the surface's own box (px, y down), not the window:
// the shader then runs for the pixels of that box alone.
const VERT = `
attribute vec2 p;
uniform vec4 box;
uniform vec2 res;
varying vec2 uv;
void main() {
  vec2 pixel = box.xy + (p * 0.5 + 0.5) * box.zw;
  uv = vec2(pixel.x / res.x, 1.0 - pixel.y / res.y);
  gl_Position = vec4(uv * 2.0 - 1.0, 0.0, 1.0);
}
`

// One lens per draw. Everything is in pixels of the canvas, y down, as the
// page measures things; the shader flips for sampling.
const FRAG = `
precision highp float;
varying vec2 uv;
uniform sampler2D backdrop;
uniform sampler2D image;    // what is in this lens, if it brings its own
uniform float useImage;     // 1: sample 'image' in imgRect over 'bg'; 0: the shared backdrop
uniform vec4 imgRect;       // x, y, w, h of the image on the canvas, px
uniform vec3 bg;            // the page's colour round the image
uniform sampler2D mask;     // letters: their shapes, crisp (alpha)
uniform sampler2D soft;     // letters: the same, blurred, for the slope of the glass
uniform float useMask;      // 1: the glass is the letters in 'mask'
uniform vec4 maskRect;      // x, y, w, h of the mask on the canvas, px
uniform float softPx;       // the blur of 'soft', px
uniform float specA;        // how much of the broad specular
uniform float rimA;         // how much of the rim light
uniform float sphereA;      // a ball's shading: darker towards the edge away from the light
uniform float sheen;        // the sheen band's place across the surface, 0..1 (<0 none)
uniform vec2 res;           // canvas size, px
uniform vec2 centre;        // lens centre, px
uniform vec2 halfSize;          // halfSize size, px (a circle: both the radius)
uniform float radius;       // corner radius, px (a circle: the radius)
uniform float depth;        // how far the edge bends the view, px
uniform float rimW;         // how far in from the edge the bend runs, px
uniform vec2 light;         // where the light is, px (may be off-canvas)
uniform vec3 tint;          // the glass's own colour, premultiplied by...
uniform float tintA;        // ...how much of it (0 clear, 1 solid)
uniform float frost;        // blur strength behind the glass, px
uniform float dark;         // 1 on the dark page: highlights brighter, shade deeper
uniform float hueA;         // a coloured light on this surface, 0..1
uniform vec3 hue;

// Signed distance to a rounded box, negative inside
float sdBox(vec2 q, vec2 h, float r) {
  vec2 d = abs(q) - (h - vec2(r));
  return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0) - r;
}

vec3 sampleBackdrop(vec2 px) {
  if (useImage > 0.5) {
    vec2 t = (px - imgRect.xy) / imgRect.zw;
    if (t.x < 0.0 || t.y < 0.0 || t.x > 1.0 || t.y > 1.0) return bg;
    vec4 c = texture2D(image, t);
    return mix(bg, c.rgb, c.a);
  }
  // A canvas is uploaded top row first, so the texture's v runs down the
  // page as px.y does: no flip
  vec2 t = px / res;
  return texture2D(backdrop, clamp(t, 0.0, 1.0)).rgb;
}

// A small blur of the backdrop, for the frost: a few taps in a ring
vec3 frosted(vec2 px, float amount) {
  if (amount < 0.5) return sampleBackdrop(px);
  vec3 s = sampleBackdrop(px) * 2.0;
  for (int i = 0; i < 8; i++) {
    float a = float(i) * 0.785398;
    s += sampleBackdrop(px + vec2(cos(a), sin(a)) * amount);
  }
  return s / 10.0;
}

void main() {
  vec2 px = uv * res;
  px.y = res.y - px.y;
  vec2 q = px - centre;
  float d;          // distance to the edge, px, negative inside
  float edge;       // coverage, antialiased
  float tilt;       // how far the face tilts here, 0 flat .. 1 edge-on
  vec2 grad;        // outward direction at the edge
  if (useMask > 0.5) {
    // The glass is the letters. Their crisp shape is the coverage; the
    // blurred shape is a height field — half way up at the outline, full
    // inside — and its slope is how the face tilts and which way.
    vec2 t = (px - maskRect.xy) / maskRect.zw;
    if (t.x < 0.0 || t.y < 0.0 || t.x > 1.0 || t.y > 1.0) discard;
    edge = texture2D(mask, t).a;
    if (edge <= 0.003) discard;
    float s = texture2D(soft, t).a;
    vec2 st = vec2(1.5) / maskRect.zw;
    vec2 g = vec2(texture2D(soft, t + vec2(st.x, 0.0)).a - texture2D(soft, t - vec2(st.x, 0.0)).a,
                  texture2D(soft, t + vec2(0.0, st.y)).a - texture2D(soft, t - vec2(0.0, st.y)).a);
    grad = -normalize(g + 1e-5);
    d = -(s - 0.5) * 2.0 * softPx;
    float inset = clamp((s - 0.5) * 2.0, 0.0, 1.0);
    float h = sqrt(max(0.0, 1.0 - (1.0 - inset) * (1.0 - inset)));
    tilt = 1.0 - h;
  } else {
    d = sdBox(q, halfSize, radius);
    // Antialiased edge of the slab
    edge = 1.0 - smoothstep(-0.75, 0.75, d);
    if (edge <= 0.0) discard;
    // How far in from the rim we are, 0 at the rim, 1 well inside
    float inset = clamp(-d / rimW, 0.0, 1.0);
    // The slab's profile: flat in the middle, falling away at the rim in a
    // circular curve — so the surface normal tilts outward near the edge
    float h = sqrt(max(0.0, 1.0 - (1.0 - inset) * (1.0 - inset)));
    tilt = 1.0 - h;
    // The direction to the rim, from the gradient of the distance field
    vec2 e = vec2(0.5, 0.0);
    grad = normalize(vec2(sdBox(q + e.xy, halfSize, radius) - sdBox(q - e.xy, halfSize, radius),
                          sdBox(q + e.yx, halfSize, radius) - sdBox(q - e.yx, halfSize, radius)) + 1e-5);
  }

  // Refraction: the view through a tilted face is displaced inward, the
  // more the steeper the tilt; red, green and blue by slightly different
  // amounts, so the rim shows a faint fringe of colour
  vec2 bend = -grad * tilt * depth;
  vec3 col;
  col.r = frosted(px + bend * 1.06, frost).r;
  col.g = frosted(px + bend, frost).g;
  col.b = frosted(px + bend * 0.94, frost).b;

  // The glass's own tint over it
  col = mix(col, tint, tintA);
  // A coloured light on it: warms the lit side
  vec2 toLight = normalize(light - centre);
  float side = dot(normalize(q + 1e-5), toLight);     // 1 facing the light, -1 away
  // the coloured light lands as a soft pool on the side facing it, with a
  // faint wash of it over the rest — a glow, not a half cut down the middle
  float R = min(halfSize.x, halfSize.y);
  vec2 pool = centre + toLight * R * 0.5;
  float w = exp(-dot(px - pool, px - pool) / (R * R * 0.55));
  col = mix(col, col * (hue / max(max(hue.r, hue.g), hue.b)), hueA * (0.16 + 0.42 * w));

  // Fresnel: the rim is brighter, seen edge-on, and brighter still on the
  // side facing the light
  float fres = pow(tilt, 1.6);
  float lit = 0.5 + 0.5 * dot(grad, -toLight);         // the rim facing the light
  vec3 white = vec3(1.0);
  col += white * fres * (0.18 + 0.42 * lit) * (0.8 + 0.5 * dark) * rimA;
  // A thin bright line right at the rim, on the lit side
  float line = smoothstep(2.2, 0.6, -d) * (0.35 + 0.65 * lit);
  col += white * line * (0.45 + 0.3 * dark) * rimA;
  // The shade on the far side's inner edge, where the slab's thickness darkens the view
  float shade = fres * (1.0 - lit) * 0.22 * (1.0 + 0.6 * dark);
  col -= shade;
  // A ball is shaded: deeper towards its edge, deepest on the side away from
  // the light — which is what makes a white ball on a white page round
  float out_ = length(q) / R;
  col *= 1.0 - sphereA * smoothstep(0.35, 1.0, out_) * (0.07 + 0.11 * (1.0 - (0.5 + 0.5 * side)));

  // The specular: the light reflected off the curved face, a soft spot that
  // sits on the slab between its centre and the light, and slides as the
  // light moves
  vec2 spot = centre + toLight * min(length(halfSize) * 0.42, 60.0) * 1.0;
  vec2 sq = (px - spot) / (halfSize * 0.9);
  float spec = exp(-dot(sq, sq) * 4.5);
  col += white * spec * (0.22 + 0.25 * dark) * specA;
  // and a smaller, sharper core
  float core = exp(-dot(sq, sq) * 26.0);
  col += white * core * 0.35 * specA;

  // The sheen: a band of light crossing the surface at a slant
  if (sheen > -0.5) {
    vec2 rel = (px - (centre - halfSize)) / (2.0 * halfSize);
    float along = rel.x + (rel.y - 0.5) * 0.25 * (halfSize.y / halfSize.x);
    float band = exp(-pow((along - sheen) / 0.07, 2.0));
    col += white * band * 0.55;
  }

  // The inner glow the frost gives the whole slab
  col += (tint - 0.5) * 0.06;

  // premultiplied, as the page composites it
  gl_FragColor = vec4(clamp(col, 0.0, 1.0) * edge, edge);
}
`

function compile(gl, type, src) {
  const sh = gl.createShader(type)
  gl.shaderSource(sh, src)
  gl.compileShader(sh)
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(sh))
  return sh
}

export function mountLiquidGlass({ backdropOf, live = false }) {
  const canvas = document.createElement('canvas')
  canvas.className = 'liquid-glass-layer'
  // Rendered out of sight: every surface is copied into a canvas inside its
  // own element, so the glass scrolls, floats and stretches with it on the
  // compositor rather than trailing it by a frame.
  Object.assign(canvas.style, {
    position: 'fixed', inset: '0', width: '100%', height: '100%',
    pointerEvents: 'none', visibility: 'hidden',
  })
  const gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: true, antialias: false })
  if (!gl) return null
  document.body.appendChild(canvas)

  const prog = gl.createProgram()
  try {
    gl.attachShader(prog, compile(gl, gl.VERTEX_SHADER, VERT))
    gl.attachShader(prog, compile(gl, gl.FRAGMENT_SHADER, FRAG))
    gl.linkProgram(prog)
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog))
  } catch (err) {
    canvas.remove()
    throw err
  }
  gl.useProgram(prog)
  const quad = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, quad)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW)
  const pLoc = gl.getAttribLocation(prog, 'p')
  gl.enableVertexAttribArray(pLoc)
  gl.vertexAttribPointer(pLoc, 2, gl.FLOAT, false, 0, 0)
  const U = {}
  for (const n of ['box', 'mask', 'soft', 'useMask', 'maskRect', 'softPx', 'specA', 'rimA', 'sphereA', 'sheen', 'image', 'useImage', 'imgRect', 'bg', 'backdrop', 'res', 'centre', 'halfSize', 'radius', 'depth', 'rimW', 'light', 'tint', 'tintA', 'frost', 'dark', 'hueA', 'hue']) {
    U[n] = gl.getUniformLocation(prog, n)
  }
  gl.enable(gl.BLEND)
  gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA)

  // The backdrop: painted to a 2D canvas of the window's size, uploaded as
  // a texture when it changes
  const back = document.createElement('canvas')
  const bctx = back.getContext('2d')
  const tex = gl.createTexture()
  gl.bindTexture(gl.TEXTURE_2D, tex)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)

  // Images a lens brings with it, uploaded once each
  const images = new Map()
  const imageTexture = (img) => {
    if (!img.complete || !img.naturalWidth) return null
    let t = images.get(img.currentSrc || img.src)
    if (t) return t
    t = upload(img)
    images.set(img.currentSrc || img.src, t)
    return t
  }

  // An image by its URL (a title's silk), loaded once and uploaded once
  const byUrl = new Map()
  const urlTexture = (url) => {
    let e = byUrl.get(url)
    if (!e) {
      e = { img: new Image(), tex: null }
      e.img.onload = () => { e.tex = imageTexture(e.img) }
      e.img.src = url
      byUrl.set(url, e)
      if (byUrl.size > 80) byUrl.delete(byUrl.keys().next().value)
    }
    return e.tex ? { img: e.img, tex: e.tex } : null
  }
  function upload(source, t = gl.createTexture()) {
    gl.bindTexture(gl.TEXTURE_2D, t)
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    return t
  }

  // The letters of an element as two textures: their shapes, crisp, and
  // the same blurred, which the shader reads as the slope of the glass.
  // Laid out word by word where the page has each word, in the element's
  // own font, so the glass is exactly the text the page set.
  const MARGIN = 14
  const letters = (s) => {
    const el = s.el
    const cs = getComputedStyle(el)
    const w = el.offsetWidth, h = el.offsetHeight
    const key = `${el.textContent}|${cs.font}|${cs.letterSpacing}|${w}x${h}|${dpr}`
    if (s.mask && s.mask.key === key) return s.mask
    const box = el.getBoundingClientRect()
    // the element may be scaled (a hover): the layout is read in its own size
    const kx = w / (box.width || 1), ky = h / (box.height || 1)
    const cw = Math.ceil((w + MARGIN * 2) * dpr), ch = Math.ceil((h + MARGIN * 2) * dpr)
    const crisp = document.createElement('canvas'); crisp.width = cw; crisp.height = ch
    const c = crisp.getContext('2d')
    c.scale(dpr, dpr)
    c.font = cs.font
    if ('letterSpacing' in c) c.letterSpacing = cs.letterSpacing === 'normal' ? '0px' : cs.letterSpacing
    c.fillStyle = '#fff'
    c.textBaseline = 'alphabetic'
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT)
    const range = document.createRange()
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      const text = node.textContent
      const re = /\S+/g
      let m
      while ((m = re.exec(text))) {
        range.setStart(node, m.index)
        range.setEnd(node, m.index + m[0].length)
        const r = range.getClientRects()[0]
        if (!r) continue
        const met = c.measureText(m[0])
        const asc = met.fontBoundingBoxAscent ?? met.actualBoundingBoxAscent
        const desc = met.fontBoundingBoxDescent ?? met.actualBoundingBoxDescent
        const x = (r.left - box.left) * kx + MARGIN
        const top = (r.top - box.top) * ky
        const y = top + (r.height * ky - (asc + desc)) / 2 + asc + MARGIN
        c.fillText(m[0], x, y)
      }
    }
    const softPx = Math.max(2.5, parseFloat(cs.fontSize) * 0.07)
    const blurred = document.createElement('canvas'); blurred.width = cw; blurred.height = ch
    const b = blurred.getContext('2d')
    b.filter = `blur(${softPx * dpr}px)`
    b.drawImage(crisp, 0, 0)
    const was = s.mask
    s.mask = { key, crisp: upload(crisp, was?.crisp), soft: upload(blurred, was?.soft), softPx, w, h }
    return s.mask
  }

  const surfaces = new Set()
  let dpr = 1
  let W = 0, H = 0
  let backDirty = true

  const size = () => {
    dpr = Math.min(window.devicePixelRatio || 1, 2)
    W = Math.round(window.innerWidth * dpr)
    H = Math.round(window.innerHeight * dpr)
    canvas.width = W; canvas.height = H
    back.width = W; back.height = H
    gl.viewport(0, 0, W, H)
    backDirty = true
  }
  size()

  const paintBackdrop = () => {
    if (!backdropOf) { backDirty = false; return }
    bctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    backdropOf(bctx, window.innerWidth, window.innerHeight)
    gl.bindTexture(gl.TEXTURE_2D, tex)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, back)
    backDirty = false
  }

  const css = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  const parseColour = (s) => {
    const m = s.match(/[\d.]+/g)
    if (!m) return [0.5, 0.5, 0.5, 1]
    const [r, g, b, a = 1] = m.map(Number)
    return s.startsWith('#') ? hex(s) : [r / 255, g / 255, b / 255, a]
  }
  const hex = (s) => {
    const n = parseInt(s.slice(1), 16)
    return s.length === 7 ? [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255, 1] : [0.5, 0.5, 0.5, 1]
  }

  let alive = true
  const frame = () => {
    if (!alive) return
    if (backDirty || live) paintBackdrop()
    gl.clearColor(0, 0, 0, 0)
    gl.clear(gl.COLOR_BUFFER_BIT)
    const dark = css('color-scheme') === 'dark' ? 1 : 0
    // The light, from the same place the CSS glass has it: above and left
    // of the window, drifting (see useLight.js)
    const lx = lightNow.x
    const ly = lightNow.y
    gl.uniform1i(U.backdrop, 0)
    gl.uniform1i(U.image, 1)
    gl.uniform1i(U.mask, 2)
    gl.uniform1i(U.soft, 3)
    const page = parseColour(css('--bg') || '#ffffff')
    gl.uniform3f(U.bg, page[0], page[1], page[2])
    gl.uniform2f(U.res, W, H)
    gl.uniform2f(U.light, lx * dpr, ly * dpr)
    gl.uniform1f(U.dark, dark)
    // One surface: drawn into the GL canvas where its element is. True if
    // it drew.
    const draw = (s) => {
      const el = s.el
      if (!el.isConnected) { surfaces.delete(s); return false }
      const r = el.getBoundingClientRect()
      if (r.bottom < 0 || r.top > window.innerHeight || r.width < 2) return false
      const cs = getComputedStyle(el)
      let op = 1
      for (let a = el, k = 0; a && k < 6; a = a.parentElement, k += 1) op *= parseFloat(getComputedStyle(a).opacity)
      if (op < 0.05 || (s.skip && s.skip(el))) return false
      const circle = cs.borderRadius.includes('%') || s.circle
      const radius = circle ? Math.min(r.width, r.height) / 2 : Math.min(parseFloat(cs.borderRadius) || 0, r.width / 2, r.height / 2)
      const hue = s.hue ? parseColour(cs.getPropertyValue('--lg-hue').trim() || '#ffffff') : null
      gl.uniform2f(U.centre, (r.left + r.width / 2) * dpr, (r.top + r.height / 2) * dpr)
      gl.uniform2f(U.halfSize, (r.width / 2) * dpr, (r.height / 2) * dpr)
      gl.uniform1f(U.radius, radius * dpr)
      gl.uniform1f(U.depth, (s.depth ?? (circle ? 22 : 14)) * dpr)
      gl.uniform1f(U.rimW, (s.rim ?? (circle ? radius * 0.55 : 26)) * dpr)
      const tintCss = typeof s.tint === 'function' ? s.tint(el) : s.tint
      const t = tintCss ? parseColour(tintCss) : [dark ? 0.1 : 1, dark ? 0.1 : 1, dark ? 0.11 : 1, 1]
      gl.uniform3f(U.tint, t[0], t[1], t[2])
      const tintA = typeof s.tintA === 'function' ? s.tintA(dark) : s.tintA
      gl.uniform1f(U.tintA, (tintA ?? (dark ? 0.16 : 0.22)) * op)
      gl.uniform1f(U.frost, (s.frost ?? 2.5) * dpr)
      gl.uniform1f(U.hueA, hue ? 0.85 : 0)
      gl.uniform3f(U.hue, hue ? hue[0] : 1, hue ? hue[1] : 1, hue ? hue[2] : 1)
      gl.uniform1f(U.specA, s.specA ?? 1)
      gl.uniform1f(U.sphereA, s.sphere ? 1 : 0)
      // on a light page white light on pale glass washes it out: less of it there
      gl.uniform1f(U.rimA, dark ? 1 : (s.rimOnLight ?? 1))
      gl.uniform1f(U.useMask, 0)
      gl.uniform1f(U.sheen, -1)
      if (s.letters) {
        const mk = letters(s)
        const kx = r.width / mk.w, ky = r.height / mk.h
        gl.activeTexture(gl.TEXTURE2); gl.bindTexture(gl.TEXTURE_2D, mk.crisp)
        gl.activeTexture(gl.TEXTURE3); gl.bindTexture(gl.TEXTURE_2D, mk.soft)
        gl.activeTexture(gl.TEXTURE0)
        gl.uniform1f(U.useMask, 1)
        gl.uniform4f(U.maskRect, (r.left - MARGIN * kx) * dpr, (r.top - MARGIN * ky) * dpr, (r.width + MARGIN * 2 * kx) * dpr, (r.height + MARGIN * 2 * ky) * dpr)
        gl.uniform1f(U.softPx, mk.softPx * dpr)
        // the sheen, run from the flash the light script starts
        const since = performance.now() - (el.__flashAt ?? -1e9)
        if (since >= 0 && since < 1400) {
          const t = since / 1400
          gl.uniform1f(U.sheen, -0.15 + 1.3 * (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2))
        }
      }
      // A lens that brings its own picture: sampled where the page has it
      const silk = s.silk && s.silk(el)
      const fromUrl = silk && urlTexture(silk)
      if (s.silk && !fromUrl) return false          // not loaded yet: the CSS glass shows
      if (fromUrl) {
        gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, fromUrl.tex)
        gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, tex)
        gl.uniform1f(U.useImage, 1)
        // the silk is drawn over the element's whole box
        gl.uniform4f(U.imgRect, r.left * dpr, r.top * dpr, r.width * dpr, r.height * dpr)
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
        return true
      }
      const img = s.image && s.image(el)
      const itex = img && imageTexture(img)
      if (itex) {
        const ir = img.getBoundingClientRect()
        // object-fit: cover, as the page draws it
        const k = Math.max(ir.width / img.naturalWidth, ir.height / img.naturalHeight)
        const iw = img.naturalWidth * k, ih = img.naturalHeight * k
        gl.activeTexture(gl.TEXTURE1)
        gl.bindTexture(gl.TEXTURE_2D, itex)
        gl.activeTexture(gl.TEXTURE0)
        gl.bindTexture(gl.TEXTURE_2D, tex)
        gl.uniform1f(U.useImage, 1)
        gl.uniform4f(U.imgRect, (ir.left + (ir.width - iw) / 2) * dpr, (ir.top + (ir.height - ih) / 2) * dpr, iw * dpr, ih * dpr)
      } else {
        gl.uniform1f(U.useImage, s.image ? 1 : 0)
        gl.uniform4f(U.imgRect, -1e5, -1e5, 1, 1)
      }
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
      return true
    }
    // Surfaces with words over them are drawn first, each alone, and copied
    // into a canvas inside their element under the words (s.into); then the
    // canvas is cleared and the rest drawn over the page.
    gl.enable(gl.SCISSOR_TEST)
    for (const s of surfaces) {
      const r = s.el.getBoundingClientRect()
      // the element's box and a margin round it (letters' glow), as scaled now
      const kx = r.width / (s.el.offsetWidth || 1), ky = r.height / (s.el.offsetHeight || 1)
      const pad = s.pad || 0
      const x = (r.left - pad * kx) * dpr, y = (r.top - pad * ky) * dpr
      const cw = Math.max(1, Math.round((r.width + 2 * pad * kx) * dpr)), ch = Math.max(1, Math.round((r.height + 2 * pad * ky) * dpr))
      const into = s.into
      if (r.bottom < -pad || r.top > window.innerHeight + pad) continue
      // this surface's box, and only it, is cleared and drawn
      gl.scissor(Math.floor(x), Math.floor(H - y - ch), cw + 1, ch + 1)
      gl.clear(gl.COLOR_BUFFER_BIT)
      gl.uniform4f(U.box, x - 1, y - 1, cw + 2, ch + 2)
      if (into.width !== cw || into.height !== ch) { into.width = cw; into.height = ch }
      const ctx = into.getContext('2d')
      ctx.clearRect(0, 0, cw, ch)
      if (draw(s)) ctx.drawImage(canvas, x, y, cw, ch, 0, 0, cw, ch)
    }
    gl.disable(gl.SCISSOR_TEST)
    requestAnimationFrame(frame)
  }
  requestAnimationFrame(frame)

  const onScroll = () => { backDirty = true }
  window.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('resize', size)

  return {
    // A surface stands in for an element: drawn where the element is, in
    // its shape. Options: circle, depth (px), rim (px), tint (css colour),
    // tintA, frost (px), hue (css colour of a coloured light on it).
    add(el, opts = {}) {
      // its canvas, inside it: over its picture for a bubble, under its
      // words for a card (opts.under), level with its letters for a title
      const into = document.createElement('canvas')
      into.className = 'liquid-glass-surface'
      const pad = opts.pad || 0
      Object.assign(into.style, {
        position: 'absolute', left: `${-pad}px`, top: `${-pad}px`,
        width: `calc(100% + ${2 * pad}px)`, height: `calc(100% + ${2 * pad}px)`,
        pointerEvents: 'none', zIndex: opts.under ? 0 : 2, borderRadius: 'inherit',
      })
      if (opts.under) el.prepend(into); else el.append(into)
      const s = { el, into, ...opts }
      surfaces.add(s)
      return () => { surfaces.delete(s); into.remove() }
    },
    repaint() { backDirty = true },
    stop() {
      alive = false
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', size)
      canvas.remove()
    },
  }
}

// One layer for the whole site, made the first time something asks for it.
let shared
export function glassLayer() {
  if (shared === undefined) {
    try { shared = mountLiquidGlass({}) } catch (err) { console.warn('liquid glass:', err); shared = null }
  }
  return shared
}
