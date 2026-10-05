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
uniform vec2 origin;
varying vec2 pxv;
void main() {
  vec2 pixel = box.xy + (p * 0.5 + 0.5) * box.zw;
  pxv = pixel;
  // drawn at the canvas's top-left corner, wherever it is on the page, so
  // the canvas need only be as big as the largest surface
  vec2 local = (pixel - origin) / res;
  gl_Position = vec4(local.x * 2.0 - 1.0, 1.0 - local.y * 2.0, 0.0, 1.0);
}
`

// One lens per draw. Everything is in pixels of the canvas, y down, as the
// page measures things; the shader flips for sampling.
const FRAG = `
precision highp float;
varying vec2 pxv;            // this pixel, in px of the page at the render scale
uniform sampler2D backdrop;
uniform sampler2D image;    // what is in this lens, if it brings its own
uniform sampler2D imageWas; // the picture it had before the theme turned, fading out
uniform float imgMix;       // how far the new picture has come in, 0..1
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
uniform float glowA;        // letters: how much they glow — lit from within, a halo round them
uniform float rowMix;       // letters: how far a block of lines takes its colour across the cloth, on a slant
uniform float sphereA;      // a ball's shading: darker towards the edge away from the light
uniform float sheen;        // the sheen band's place across the surface, 0..1 (<0 none)
uniform vec2 res;           // canvas size, px
uniform vec2 win;           // the window, px (the shared backdrop's size)
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

// Value noise, for the streaks in the letters
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float vnoise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
             mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
}

// The slope of the letters' blurred shape at a point of the mask
vec2 softSlope(sampler2D sm, vec2 t, vec2 st) {
  return vec2(texture2D(sm, t + vec2(st.x, 0.0)).a - texture2D(sm, t - vec2(st.x, 0.0)).a,
              texture2D(sm, t + vec2(0.0, st.y)).a - texture2D(sm, t - vec2(0.0, st.y)).a);
}

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
    if (imgMix < 0.999) c = mix(texture2D(imageWas, t), c, imgMix);
    return mix(bg, c.rgb, c.a);
  }
  // A canvas is uploaded top row first, so the texture's v runs down the
  // page as px.y does: no flip
  vec2 t = px / win;
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
  vec2 px = pxv;
  vec2 q = px - centre;
  float d;          // distance to the edge, px, negative inside
  float edge;       // coverage, antialiased
  float tilt;       // how far the face tilts here, 0 flat .. 1 edge-on
  float ramp = -1.0; // letters: 1 at the outline falling evenly to 0 inside
  float ins = 0.0;   // letters: how far in from the outline, 0..1
  float cap = 0.0;   // letters: how sharply the lines at a set depth turn here — a stroke's end
  vec2 grad;        // outward direction at the edge
  float gw = 1.0;   // how much that direction means: letters, near nothing down a stroke's middle
  vec3 nrm = vec3(0.0, 0.0, 1.0);   // letters: the surface's normal, from the shape as a solid
  if (useMask > 0.5) {
    // The glass is the letters. Their crisp shape is the coverage; the
    // blurred shape is a height field — half way up at the outline, full
    // inside — and its slope is how the face tilts and which way.
    vec2 t = (px - maskRect.xy) / maskRect.zw;
    if (t.x < 0.0 || t.y < 0.0 || t.x > 1.0 || t.y > 1.0) discard;
    edge = texture2D(mask, t).a;
    if (edge <= 0.003) {
      // Outside a letter: its glow, if it has one — the light it gives off,
      // spilling past its edge in its own colour and falling away
      if (glowA <= 0.0) discard;
      float hA = texture2D(soft, t).a;
      for (int i = 0; i < 8; i++) {
        float a = float(i) * 0.785398;
        hA += texture2D(soft, t + vec2(cos(a), sin(a)) * softPx * 2.2 / maskRect.zw).a;
      }
      hA /= 9.0;
      if (hA < 0.01) discard;
      vec3 hc = mix(sampleBackdrop(vec2(px.x, imgRect.y + imgRect.w * 0.5)), vec3(1.0), 0.2);
      float k = clamp(hA * glowA * (0.22 + 0.63 * dark), 0.0, 1.0);   // a haze round them on the light page, which blurred their edges: less of it there
      gl_FragColor = vec4(hc * k, k);
      return;
    }
    float s = texture2D(soft, t).a;
    // The slope, over a reach of a third of the blur rather than a pixel or
    // two: the blurred shape is stored in 8 bits, and at a high resolution
    // a difference across a pixel is mostly rounding, which showed as
    // streaks in the letters. Two reaches, averaged, for a smooth normal.
    vec2 st = vec2(softPx * 0.33) / maskRect.zw;
    vec2 st2 = st * 0.5;
    vec2 g = vec2(texture2D(soft, t + vec2(st.x, 0.0)).a - texture2D(soft, t - vec2(st.x, 0.0)).a,
                  texture2D(soft, t + vec2(0.0, st.y)).a - texture2D(soft, t - vec2(0.0, st.y)).a)
           + 2.0 * vec2(texture2D(soft, t + vec2(st2.x, 0.0)).a - texture2D(soft, t - vec2(st2.x, 0.0)).a,
                  texture2D(soft, t + vec2(0.0, st2.y)).a - texture2D(soft, t - vec2(0.0, st2.y)).a);
    grad = -normalize(g + 1e-5);
    // Down the middle of a stroke the slope is near nothing and its
    // direction flips from one side to the other; a light or a bend keyed to
    // that direction flipped with it, and creased each letter down its
    // middle and into its corners like folded paper. Both fade out where the
    // slope does, so the glass rounds smoothly over the top of a stroke.
    gw = smoothstep(0.03, 0.3, length(g));
    // The letter as a solid: its blurred shape is a height — up on the
    // stroke, down to nothing at the outline — and the surface's normal
    // leans outward as steeply as the height falls, upright on the flat top
    // of the stroke. Continuous everywhere, so nothing creases.
    nrm = normalize(vec3(-g * 3.2, 1.0));
    d = -(s - 0.5) * 2.0 * softPx;
    float inset = clamp((s - 0.5) * 2.0, 0.0, 1.0);
    float h = sqrt(max(0.0, 1.0 - (1.0 - inset) * (1.0 - inset)));
    tilt = 1.0 - h;
    // starts well inside the stroke and eases out to the edge, so the
    // colour and the light shade into each other over the whole stroke
    ramp = 1.0 - smoothstep(-0.15, 1.35, inset);
    ins = inset;
    // How sharply the lines at this depth turn: the slope's direction a
    // little way either side along them. Small down a straight stroke and
    // round the wide bowl of an O, large where the lines turn round the end
    // of a stroke.
    vec2 tg = vec2(-grad.y, grad.x);
    vec2 hT = tg * (softPx * 0.6) / maskRect.zw;
    vec2 ga = normalize(softSlope(soft, t + hT, st) + 1e-5);
    vec2 gb = normalize(softSlope(soft, t - hT, st) + 1e-5);
    cap = abs(ga.x * gb.y - ga.y * gb.x) / 1.2;
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
  vec2 bend = -grad * tilt * depth * gw;
  // Letters take their colour from how far in from their own outline a
  // point is — the cloth read along a line down the word, as the O's bands
  // of colour follow its ring — so the colour runs in bands that follow
  // the shape of every letter, still changing across the word as the cloth
  // does; a slab takes what is behind it, bent.
  vec2 at = px;
  // A heading of several lines also takes its colour by where on the cloth
  // it lies, not only by the depth in the stroke — or every line of it
  // showed the same band, and a large block of thin letters, which never
  // reach deep into a stroke, one colour all over. Across the block the
  // colours mix as they do across the cloth behind a card.
  // On a diagonal, from the block's top left to its bottom right, so the
  // bands cross the lines at a slant rather than each line being one.
  if (useMask > 0.5) {
    vec2 tb = clamp((px - imgRect.xy) / imgRect.zw, 0.0, 1.0);
    float slant = clamp(0.75 * tb.y + 0.65 * tb.x - 0.05, 0.0, 1.0);
    at = vec2(px.x, mix(imgRect.y + imgRect.w * (0.12 + 0.76 * ins), imgRect.y + imgRect.w * slant, rowMix));
  }
  vec3 col;
  col.r = frosted(at + bend * 1.06, frost).r;
  col.g = frosted(at + bend, frost).g;
  col.b = frosted(at + bend * 0.94, frost).b;

  // Streaks in the letters: what the glass bends is drawn out along the
  // stroke, not left in soft blobs — long along the letter's edge, narrow
  // across it, mostly deeper and a few lighter, in the body of the stroke
  // and fading out towards its rim. Measured in the letters' own blur, so
  // they are the same at any resolution.
  if (useMask > 0.5) {
    // Across a streak: the distance in from the outline, which follows the
    // letter's shape everywhere without a turn or a seam. Along it: the
    // page's x, slowly, so a streak runs long and unbroken down a stroke
    // and changes only over the length of a word.
    float along = px.x / (softPx * 26.0);
    // Fine lines: where a smooth field crosses its middle there is one thin
    // line, which wanders as freely as the field does; the field runs
    // slowly along the stroke and quickly across it, so the lines flow down
    // the stroke. Sharp-edged — a pixel soft and no more — but never jagged.
    float f1 = vnoise(vec2(along * 0.9, ins * 7.0));
    float f2 = vnoise(vec2(along * 0.7 + 13.7, ins * 9.0 + 4.1));
    float r1 = 1.0 - abs(f1 * 2.0 - 1.0);
    float r2 = 1.0 - abs(f2 * 2.0 - 1.0);
#ifdef DERIV
    float a1 = fwidth(r1) * 1.1, a2 = fwidth(r2) * 1.1;
#else
    float a1 = 0.04, a2 = 0.04;
#endif
    float n1 = smoothstep(0.9 - a1, 0.9 + a1, r1);
    float n2 = smoothstep(0.93 - a2, 0.93 + a2, r2);
    // At the end of a stroke the streaks stop, as a brush's bristles do —
    // each at its own point — rather than turning round the end
    float bristle = vnoise(vec2(ins * 14.0 + 2.3, along * 3.0));
    float stop = 1.0 - smoothstep(0.18, 0.45, cap + (bristle - 0.5) * 0.25);
    float body = (1.0 - ramp) * stop;
    // the darker streaks only faint where a letter glows: they fight the glow
    col = mix(col, col * 0.62, body * n1 * 0.85 * (1.0 - 0.65 * glowA));
    col += vec3(1.0) * body * n2 * 0.18;
    // Lit from within: the body of the stroke brightened in its own colour,
    // most down the middle, so the letter gives light rather than takes it
    col += col * glowA * (0.32 + 0.12 * dark) * (1.0 - ramp) * (0.35 + 0.65 * dark);
  }

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
  // The light at the edge. On a slab it follows the curve of the rim; on
  // letters it follows an even ramp in from the outline instead, so the
  // colour of the face fades into the light at the edge rather than
  // stopping at a line
  float fres = ramp >= 0.0 ? pow(ramp, 0.9) * 0.78 : pow(tilt, 1.6);
  // the rim facing the light: its outward direction towards the light
  // (toLight runs from the surface to the light). This had the sign the
  // wrong way round, and lit the rim on the side away from the light.
  float lit = 0.5 + 0.5 * dot(grad, toLight) * gw;
  vec3 white = vec3(1.0);
  float slab = 1.0 - useMask;       // the tricks below are a slab's; letters are lit as solids
  // the edge-on brightening too: all round on the dark page, only towards
  // the light on the light page
  col += slab * white * fres * (0.18 * mix(smoothstep(0.3, 0.9, lit), 1.0, dark) + 0.42 * lit) * (0.8 + 0.5 * dark) * rimA;
  // A thin bright line right at the rim, on the lit side
  // The bright line at the rim: all the way round on the dark page, where a
  // faint line on the far side reads as glass; only on the side facing the
  // light on the light page, where it read as a white edge on the shadow side
  float line = smoothstep(2.2, 0.6, -d) * mix(smoothstep(0.35, 0.9, lit), 0.35 + 0.65 * lit, dark) * (ramp >= 0.0 ? 0.25 : 1.0);
  col += slab * white * line * (0.45 + 0.3 * dark) * rimA;
  // The shade on the far side's inner edge, where the slab's thickness darkens the view
  float shade = fres * (1.0 - lit) * 0.22 * (1.0 + 0.6 * dark);
  col -= slab * shade;
  // On the light page a letter reads as glass by what glass does on white:
  // a little of the page seen through the middle of the stroke, its edge
  // deepened and saturated where the glass is thickest to the eye — most on
  // the side away from the light — and a crisp line of light along the side
  // facing it. On the dark page the glow and the rim light do this.
  if (useMask > 0.5) {
    // The letter lit as a solid by the light above and to one side: faces
    // turned to it brighter, faces turned away in shade, a sharp highlight
    // where the curve of the shoulder reflects it to the eye and a broad
    // sheen round that, and the edge seen nearly side-on catching a little
    // of the sky (Fresnel). Glass: the shade is never black, the colour
    // deepens and saturates where it is thick to the eye.
    vec3 Ld = normalize(vec3(toLight * 0.78, 0.62));
    vec3 H = normalize(Ld + vec3(0.0, 0.0, 1.0));
    float diff = dot(nrm, Ld);
    float nh = max(dot(nrm, H), 0.0);
    float shoulder = smoothstep(0.02, 0.6, 1.0 - nrm.z);        // how far the face has turned
    float lightness = 0.68 + 0.5 * clamp(diff, -0.2, 1.0);
    vec3 deep = col * col * 1.2;
    col = mix(col, deep, (1.0 - clamp(diff + 0.35, 0.0, 1.0)) * shoulder * (0.55 - 0.15 * dark));
    col *= lightness;
    float L = 1.0 - dark;
    col = mix(col, bg, 0.05 * L * (1.0 - shoulder));               // the page a little through the flat top
    // On the light page the white light it gives back is held down: white
    // on a pale letter against a white page is what made the words hard to
    // read. The dark page keeps all of it.
    col += white * pow(nh, 60.0) * (0.95 - 0.55 * L);               // the sharp highlight
    col += white * pow(nh, 9.0) * (0.06 + 0.2 * dark) * shoulder;   // the sheen round it
    col += white * pow(1.0 - nrm.z, 3.0) * (0.08 + 0.37 * dark) * rimA;   // the rim, seen side-on
    // and its own light over that: the glow, which the shading above would
    // otherwise take away — the body of the stroke lit from within
    col += col * glowA * (0.42 + 0.18 * dark) * (1.0 - 0.6 * shoulder) * (0.3 + 0.7 * dark);
    // On the light page a glass letter is coloured glass against white: its
    // colour held rich, or it pales into the page
    float luma = dot(col, vec3(0.299, 0.587, 0.114));
    col = mix(col, max(vec3(0.0), luma + (col - luma) * 1.7) * 0.92, L);
  }
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
    // the screen's rate of change in the shader, so a fine line is soft by
    // exactly a pixel at any resolution; without it, a fixed softness
    const deriv = gl.getExtension('OES_standard_derivatives')
    const head = deriv ? '#extension GL_OES_standard_derivatives : enable\n#define DERIV 1\n' : ''
    gl.attachShader(prog, compile(gl, gl.FRAGMENT_SHADER, head + FRAG))
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
  for (const n of ['imageWas', 'imgMix', 'box', 'mask', 'soft', 'useMask', 'maskRect', 'softPx', 'specA', 'rimA', 'glowA', 'rowMix', 'sphereA', 'sheen', 'image', 'useImage', 'imgRect', 'bg', 'backdrop', 'res', 'win', 'origin', 'centre', 'halfSize', 'radius', 'depth', 'rimW', 'light', 'tint', 'tintA', 'frost', 'dark', 'hueA', 'hue']) {
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
  // The letters' rounded shape — their curve, so their light and the bend
  // in them — is read from a blurred copy of them. A canvas blurs with
  // ctx.filter where it can; Safari (and so every browser on an iPhone)
  // has not had it, and drew the copy sharp: no curve, so letters flat and
  // unlit. There the blur is done by hand (blurAlpha, below).
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
    c.fillStyle = '#fff'
    c.textBaseline = 'alphabetic'
    // Letter by letter, each where the page set it. A word drawn whole was
    // spaced by the canvas, which on a phone's browser ignores the title's
    // letter-spacing: the glass letters crept away from the page's along
    // every word, and the shadow the page's text casts sat off them.
    const met = c.measureText('Hg')
    const asc = met.fontBoundingBoxAscent ?? met.actualBoundingBoxAscent
    const desc = met.fontBoundingBoxDescent ?? met.actualBoundingBoxDescent
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT)
    const range = document.createRange()
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      const text = node.textContent
      for (let i = 0; i < text.length;) {
        const ch = String.fromCodePoint(text.codePointAt(i))
        const next = i + ch.length
        if (/\S/.test(ch)) {
          range.setStart(node, i)
          range.setEnd(node, next)
          const r = range.getClientRects()[0]
          if (r) {
            const x = (r.left - box.left) * kx + MARGIN
            const top = (r.top - box.top) * ky
            const y = top + (r.height * ky - (asc + desc)) / 2 + asc + MARGIN
            c.fillText(ch, x, y)
          }
        }
        i = next
      }
    }
    const softPx = Math.max(2.5, parseFloat(cs.fontSize) * 0.07)
    const blurred = document.createElement('canvas'); blurred.width = cw; blurred.height = ch
    const b = blurred.getContext('2d')
    if (canvasBlurs()) {
      b.filter = `blur(${softPx * dpr}px)`
      b.drawImage(crisp, 0, 0)
    } else {
      // By hand, on a copy shrunk until the blur is a few pixels across, then
      // drawn back up smoothly: a blur is soft through and through, so the
      // small copy loses nothing, and it is the difference between a frame's
      // work and the better part of a second's — paid for every title of a
      // page as it arrives, in the middle of the page's own transition.
      const k = Math.max(1, (softPx * dpr) / 2.5)
      const sw = Math.max(1, Math.round(cw / k)), sh = Math.max(1, Math.round(ch / k))
      const small = document.createElement('canvas'); small.width = sw; small.height = sh
      const sc = small.getContext('2d', { willReadFrequently: true })
      sc.imageSmoothingEnabled = true; sc.imageSmoothingQuality = 'high'
      sc.drawImage(crisp, 0, 0, sw, sh)
      blurAlpha(sc, sw, sh, (softPx * dpr) / k)
      b.imageSmoothingEnabled = true; b.imageSmoothingQuality = 'high'
      b.drawImage(small, 0, 0, cw, ch)
    }
    const was = s.mask
    s.mask = { key, crisp: upload(crisp, was?.crisp), soft: upload(blurred, was?.soft), softPx, w, h }
    return s.mask
  }

  const surfaces = new Set()
  let dpr = 1
  let W = 0, H = 0
  let backDirty = true

  // The resolution surfaces are drawn at: the screen's density times any
  // pinch-zoom, so zoomed-in glass is as sharp as the zoomed-in text next to
  // it. In steps, so a pinch rebuilds the letters a few times, not every
  // frame of it.
  const STEPS = [1, 1.5, 2, 3, 4, 5, 6]
  const maxSize = gl.getParameter(gl.MAX_RENDERBUFFER_SIZE) || 4096
  const size = () => {
    const raw = (window.devicePixelRatio || 1) * (window.visualViewport?.scale || 1)
    dpr = STEPS.find((v) => v >= raw - 0.01) ?? STEPS[STEPS.length - 1]
    back.width = Math.round(window.innerWidth * dpr); back.height = Math.round(window.innerHeight * dpr)
    backDirty = true
  }
  size()
  // The GL canvas: as big as the largest surface needs, grown when one needs more
  const fit = (cw, ch) => {
    if (cw <= W && ch <= H) return
    W = Math.min(maxSize, Math.max(W, cw, 256)); H = Math.min(maxSize, Math.max(H, ch, 256))
    canvas.width = W; canvas.height = H
    gl.viewport(0, 0, W, H)
  }

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
  // the theme's fade (--theme-fade), and where the light/dark value is in it
  const FADE = 900
  const theme = { value: null, from: 0, to: null, at: 0 }
  // At rest the glass only changes as the light drifts, which is slow: it is
  // looked at ten times a second then, and every frame only while something
  // is moving — a scroll, the theme's fade, a sheen, a silk's fade.
  let lastLook = 0
  let hotUntil = 0
  const frame = () => {
    if (!alive) return
    const t0 = performance.now()
    // Looked at every frame — the bubbles float and the light drifts, and a
    // glint moving ten times a second stepped visibly — but a surface is
    // drawn again only when what it shows has changed (see below).
    void hotUntil
    // While a bubble's pop dives the page in, everything grows by several
    // times; redrawing each surface at its new size every frame was the
    // heaviest thing on the page, for a page about to be gone. The glass
    // holds still instead, and its last drawing scales with the page.
    if (document.documentElement.classList.contains('diving')) { requestAnimationFrame(frame); return }
    lastLook = t0
    if (backDirty || live) paintBackdrop()
    gl.clearColor(0, 0, 0, 0)
    gl.clear(gl.COLOR_BUFFER_BIT)
    // Light or dark, eased over the theme's own fade rather than flipped
    const darkTo = css('color-scheme') === 'dark' ? 1 : 0
    const now = performance.now()
    if (theme.to === null) { theme.value = darkTo; theme.to = darkTo; theme.at = -1e9; theme.from = darkTo }
    // A switch made under the browser's own cross-fade (html.theme-snap: see
    // ThemeToggle) is turned at once — the cross-fade is the transition
    const snap = document.documentElement.classList.contains('theme-snap')
    if (darkTo !== theme.to) { theme.from = theme.value; theme.to = darkTo; theme.at = snap ? -1e9 : now }
    if (now - theme.at < FADE + 50) hotUntil = now + 120
    const k = Math.min(1, (now - theme.at) / FADE)
    theme.value = theme.from + (theme.to - theme.from) * (k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2)
    const dark = theme.value
    // The light, from the same place the CSS glass has it: above and left
    // of the window, drifting (see useLight.js)
    const lx = lightNow.x
    const ly = lightNow.y
    gl.uniform1i(U.backdrop, 0)
    gl.uniform1i(U.image, 1)
    gl.uniform1i(U.imageWas, 4)
    gl.uniform1f(U.imgMix, 1)
    gl.uniform1i(U.mask, 2)
    gl.uniform1i(U.soft, 3)
    const pageBg = parseColour(css('--bg') || '#ffffff')
    gl.uniform3f(U.bg, pageBg[0], pageBg[1], pageBg[2])
    gl.uniform2f(U.win, back.width, back.height)
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
      // its fading is the page's: the canvas is inside the element, so the
      // element's opacity and its parents' apply to it as to the rest
      const op = 1
      if (s.skip && s.skip(el)) return false
      const circle = cs.borderRadius.includes('%') || s.circle
      const radius = circle ? Math.min(r.width, r.height) / 2 : Math.min(parseFloat(cs.borderRadius) || 0, r.width / 2, r.height / 2)
      const hue = s.hue ? parseColour(cs.getPropertyValue('--lg-hue').trim() || '#ffffff') : null
      gl.uniform2f(U.centre, (r.left + r.width / 2) * dpr, (r.top + r.height / 2) * dpr)
      gl.uniform2f(U.halfSize, (r.width / 2) * dpr, (r.height / 2) * dpr)
      gl.uniform1f(U.radius, radius * dpr)
      gl.uniform1f(U.depth, (s.depth ?? (circle ? 22 : 14)) * dpr)
      gl.uniform1f(U.rimW, (s.rim ?? (circle ? radius * 0.55 : 26)) * dpr)
      const tintCss = typeof s.tint === 'function' ? s.tint(el) : s.tint
      const t = tintCss ? parseColour(tintCss) : [1 - 0.9 * dark, 1 - 0.9 * dark, 1 - 0.89 * dark, 1]
      gl.uniform3f(U.tint, t[0], t[1], t[2])
      const tintA = typeof s.tintA === 'function' ? s.tintA(dark) : s.tintA
      gl.uniform1f(U.tintA, (tintA ?? (0.22 - 0.06 * dark)) * op)
      gl.uniform1f(U.frost, (s.frost ?? 2.5) * dpr)
      gl.uniform1f(U.hueA, hue ? 0.85 : 0)
      gl.uniform3f(U.hue, hue ? hue[0] : 1, hue ? hue[1] : 1, hue ? hue[2] : 1)
      // nothing of the last surface's carries over: a silk's fade left set
      // here once blended a bubble's model with a title's silk mid-fade
      gl.uniform1f(U.imgMix, 1)
      gl.uniform1f(U.specA, s.specA ?? 1)
      gl.uniform1f(U.glowA, s.glow ?? 0)
      // lines in the block: none of the mix for a title on one line, most of
      // it from three lines on
      if (s.letters) {
        const lines = r.height / (parseFloat(getComputedStyle(el).fontSize) * 1.25 || r.height)
        gl.uniform1f(U.rowMix, Math.max(0, Math.min(0.75, (lines - 1.2) * 0.7)))
      } else gl.uniform1f(U.rowMix, 0)
      gl.uniform1f(U.sphereA, s.sphere ? 1 : 0)
      // on a light page white light on pale glass washes it out: less of it there
      gl.uniform1f(U.rimA, (s.rimOnLight ?? 1) + (1 - (s.rimOnLight ?? 1)) * dark)
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
      // The silk. When it changes (the theme turned), the one it had stays
      // and fades out over the theme's fade while the new one comes in; and
      // until the new one has loaded, the old is drawn as it was.
      const silk = s.silk && s.silk(el)
      const fresh = silk && urlTexture(silk)
      if (fresh && (!s.silkNow || s.silkNow.tex !== fresh.tex)) {
        s.silkWas = s.silkNow || fresh
        s.silkNow = fresh
        // At once rather than faded when the cloth changed a while ago — the
        // theme turned while this was off the screen, and fading only now,
        // as it is scrolled to, changed its colour in front of the reader
        const missed = now - (el.__silkSince ?? now) > 400
        s.silkAt = s.silkWas === fresh || missed || document.documentElement.classList.contains('theme-snap') ? -1e9 : now
      }
      const fromUrl = s.silkNow
      if (s.silk && !fromUrl) return false          // nothing loaded yet: the CSS glass shows
      if (fromUrl) {
        const m = Math.min(1, (now - (s.silkAt ?? -1e9)) / FADE)
        gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, fromUrl.tex)
        gl.activeTexture(gl.TEXTURE4); gl.bindTexture(gl.TEXTURE_2D, (s.silkWas || fromUrl).tex)
        gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, tex)
        gl.uniform1f(U.imgMix, m < 0.5 ? 2 * m * m : 1 - Math.pow(-2 * m + 2, 2) / 2)
        gl.uniform1f(U.useImage, 1)
        // the silk is drawn over the element's whole box
        gl.uniform4f(U.imgRect, r.left * dpr, r.top * dpr, r.width * dpr, r.height * dpr)
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
        return true
      }
      // What is round the picture: the page's colour — or, for a lens that
      // asks to be lifted (a near-black model), its own colour mixed in on
      // the dark page, so the model is not lost against it
      if (s.lift && hue) {
        const k = s.lift * dark
        gl.uniform3f(U.bg, pageBg[0] + (hue[0] * 0.45 - pageBg[0]) * k, pageBg[1] + (hue[1] * 0.45 - pageBg[1]) * k, pageBg[2] + (hue[2] * 0.45 - pageBg[2]) * k)
      } else gl.uniform3f(U.bg, pageBg[0], pageBg[1], pageBg[2])
      const img = s.image && s.image(el)
      const itex = img && imageTexture(img)
      if (itex) {
        const ir = img.getBoundingClientRect()
        // object-fit: cover, as the page draws it
        // a lens may draw its picture smaller than the page has it (s.inset),
        // so what is near the picture's edge sits clear of the rim, where the
        // glass bends it outward
        const k = Math.max(ir.width / img.naturalWidth, ir.height / img.naturalHeight) * (s.inset ?? 1)
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
      if (r.bottom < -pad || r.top > window.innerHeight + pad) {
        // Off the screen, nothing is drawn — but a new cloth for it (a change
        // of theme) is fetched now, so it is ready when it is scrolled to,
        // rather than the old colours showing until it arrives
        if (s.silk && s.el.__silkSince !== s.warmed) { s.warmed = s.el.__silkSince; const u = s.silk(s.el); if (u) urlTexture(u) }
        continue
      }
      // Drawn again only when what it shows would change: the light's
      // direction to it, its size (in steps of 2%), the theme's fade, its
      // silk's fade, a sheen crossing, its picture arriving. A lens inside
      // its element does not change as the element moves, so at rest, and
      // as most things scroll, nothing is drawn at all.
      const cx = r.left + r.width / 2, cy = r.top + r.height / 2
      const ang = Math.round(Math.atan2(cy - lightNow.y, cx - lightNow.x) * 57.3 * 4)    // quarter degrees
      const flashing = now - (s.el.__flashAt ?? -1e9) < 1450
      const silkFade = s.silkNow ? Math.min(1, (now - (s.silkAt ?? -1e9)) / FADE) : -1
      if (flashing || (silkFade >= 0 && silkFade < 1)) hotUntil = now + 120
      const pic = s.image ? !!(s.image(s.el)?.complete) : 0
      const key = `${ang}|${Math.round(Math.log(cw) * 50)}|${Math.round(Math.log(ch) * 50)}|${dark.toFixed(2)}|${silkFade.toFixed(2)}|${s.silkNow?.tex ? 1 : 0}|${flashing ? now : 0}|${pic}|${dpr}|${s.skip ? s.skip(s.el) : 0}`
      if (key === s.drawn) continue
      // A surface's first drawing lays out its letters (and in Safari blurs
      // them by hand) — a page arriving with a dozen of them did all of it
      // in one frame, and its transition stalled. Past a few milliseconds'
      // work in a frame, the rest wait for the next.
      if (!s.drawn && performance.now() - t0 > 8) { hotUntil = now + 120; continue }
      // the surface is drawn at the canvas's corner, its box cleared first
      if (cw > maxSize || ch > maxSize) continue
      fit(cw, ch)
      gl.uniform2f(U.res, W, H)
      gl.uniform2f(U.origin, x, y)
      gl.scissor(0, H - ch, cw, ch)
      gl.clear(gl.COLOR_BUFFER_BIT)
      gl.uniform4f(U.box, x - 1, y - 1, cw + 2, ch + 2)
      if (into.width !== cw || into.height !== ch) { into.width = cw; into.height = ch }
      const ctx = into.getContext('2d')
      ctx.clearRect(0, 0, cw, ch)
      s.draws = (s.draws || 0) + 1
      if (draw(s)) { ctx.drawImage(canvas, 0, 0, cw, ch, 0, 0, cw, ch); s.drawn = key } else s.drawn = null
    }
    gl.disable(gl.SCISSOR_TEST)
    requestAnimationFrame(frame)
  }
  requestAnimationFrame(frame)

  const onScroll = () => { backDirty = true; hotUntil = performance.now() + 250 }
  window.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('resize', size)
  window.visualViewport?.addEventListener('resize', size)
  // a pointer over the page can set a hover going (a heading swelling)
  const onPointer = () => { hotUntil = performance.now() + 500 }
  window.addEventListener('pointermove', onPointer, { passive: true })

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
    // where the theme's fade is, and each surface's silk fade, for checking
    draws() { return [...surfaces].map((x) => `${x.el.className.toString().split(' ').slice(0, 2).join('.')}:${x.draws || 0}`) },
    state() { const now = performance.now(); return { theme: theme.value, silk: [...surfaces].filter((x) => x.silkNow).map((x) => Math.min(1, (now - (x.silkAt ?? -1e9)) / FADE)) } },
    stop() {
      alive = false
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', size)
      window.visualViewport?.removeEventListener('resize', size)
      window.removeEventListener('pointermove', onPointer)
      canvas.remove()
    },
  }
}

// One layer for the whole site, made the first time something asks for it.
let shared
export function glassLayer() {
  if (shared === undefined) {
    try { shared = mountLiquidGlass({}) } catch (err) { console.warn('liquid glass:', err); shared = null }
    // reachable from the console, for looking into it
    if (shared) window.__liquidGlass = shared
  }
  return shared
}

// Whether this browser's 2D canvas blurs (ctx.filter) — asked once, by
// blurring a dot and looking beside it
let blurs = null
function canvasBlurs() {
  if (blurs !== null) return blurs
  try {
    const t = document.createElement('canvas'); t.width = 9; t.height = 9
    const x = t.getContext('2d', { willReadFrequently: true })
    x.filter = 'blur(2px)'
    x.fillStyle = '#fff'
    x.fillRect(4, 4, 1, 1)
    blurs = x.getImageData(1, 4, 1, 1).data[3] > 0
  } catch { blurs = false }
  return blurs
}

// A Gaussian blur of a white mask's coverage, by hand: three box blurs
// across and three down, which come out all but the same as a Gaussian of
// that radius. Only when a title's letters are laid out, not every frame.
function blurAlpha(ctx, w, h, sigma) {
  const img = ctx.getImageData(0, 0, w, h)
  const d = img.data
  let a = new Float32Array(w * h)
  for (let i = 0; i < w * h; i += 1) a[i] = d[i * 4 + 3]
  let tmp = new Float32Array(w * h)
  // box widths for three passes approximating this sigma
  const n = 3
  const ideal = Math.sqrt((12 * sigma * sigma) / n + 1)
  let wl = Math.floor(ideal); if (wl % 2 === 0) wl -= 1
  const wu = wl + 2
  const m = Math.round((12 * sigma * sigma - n * wl * wl - 4 * n * wl - 3 * n) / (-4 * wl - 4))
  const sizes = [0, 1, 2].map((k) => (k < m ? wl : wu))
  const pass = (src, dst, r, across) => {
    const len = across ? w : h, lines = across ? h : w
    const at = across ? (line, k) => line * w + k : (line, k) => k * w + line
    const scale = 1 / (r + r + 1)
    for (let line = 0; line < lines; line += 1) {
      let sum = 0
      for (let k = -r; k <= r; k += 1) sum += src[at(line, Math.min(len - 1, Math.max(0, k)))]
      for (let k = 0; k < len; k += 1) {
        dst[at(line, k)] = sum * scale
        sum += src[at(line, Math.min(len - 1, k + r + 1))] - src[at(line, Math.max(0, k - r))]
      }
    }
  }
  for (const size of sizes) {
    const r = Math.max(0, (size - 1) / 2)
    pass(a, tmp, r, true)
    pass(tmp, a, r, false)
  }
  for (let i = 0; i < w * h; i += 1) { d[i * 4] = 255; d[i * 4 + 1] = 255; d[i * 4 + 2] = 255; d[i * 4 + 3] = a[i] }
  ctx.putImageData(img, 0, 0)
}
