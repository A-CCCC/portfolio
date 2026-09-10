#!/usr/bin/env python3
"""Turn a Fusion screen recording into a build video for a project page.

    python3 scripts/make-build-video.py "mortar build/Screen Recording ….mov" \
        public/videos/mortar-build.mp4 [seconds]

The optional third argument is how long the finished clip should run; it defaults
to eleven seconds. A short build sped into the same eleven seconds as a long one
plays more slowly and feels longer to watch, so the shorter recordings are given
shorter targets.

It does what was previously done by hand for each one, so every build video is
framed and paced the same way:

  * finds where the model sits across the clip, ignoring the frames at the end
    where the screen recorder's selection outline appears
  * trims the clip before that outline — as an input-side trim, since the
    speed-up below makes an output-side one silently do nothing
  * frames the model at 81% of the height on a 1.283 aspect, padding with the
    recording's own background when the source is too tight to crop
  * matches the pad colour to what the video's white encodes to, which is not
    the colour it started as
  * speeds it up to about eleven seconds at 30fps
"""
import subprocess, sys, tempfile, os, glob
from pathlib import Path
import numpy as np
from PIL import Image

FILL = 0.81          # how much of the frame height the model takes
ASPECT = 1.283       # matches the other build videos
TARGET_SECONDS = 11
# Extra background along the bottom for the play button and scrubber to sit in.
# Given as a share of the frame's width because that is what fixes how large it
# lands on screen: every build video is shown at the same column width, so the
# same share renders the same number of pixels whatever the source resolution.
# Enough to keep the controls clear of the model without a band of empty
# background under it.
CONTROL_ROOM = 0.07
# The screen recorder draws a dashed border round the captured region at the end
# of a clip. Cutting the clip before it appears also threw away whatever was done
# in those last seconds, so the border is cropped off instead and the footage
# kept. It sits within about a dozen pixels of the edge.
OUTLINE_INSET = 20

def probe(path, *fields):
    out = subprocess.run(['ffprobe', '-v', 'error', '-select_streams', 'v:0',
                          '-show_entries', f'stream={",".join(fields)}',
                          '-of', 'default=nw=1:nk=1', str(path)],
                         capture_output=True, text=True).stdout.split()
    return [float(x) for x in out]

SAMPLE_FPS = 4       # dense enough to see when the picture stops changing

def sample(path, work):
    subprocess.run(['ffmpeg', '-v', 'error', '-i', str(path),
                    '-vf', f'fps={SAMPLE_FPS},scale=720:-1', '-y', f'{work}/f%04d.png'], check=True)
    return sorted(glob.glob(f'{work}/*.png'))

def ink_box(a, inset=0):
    if inset:
        a = a[inset:-inset, inset:-inset]
    mask = (a.max(axis=2) < 238)
    ys, xs = np.where(mask)
    return None if not len(xs) else (xs.min(), ys.min(), xs.max(), ys.max())

def has_outline(a):
    """The recorder draws a dashed border round the captured region at the end."""
    return min(a[0, :, 0].min(), a[-1, :, 0].min(), a[:, 0, 0].min(), a[:, -1, 0].min()) < 240

def main(src, dst, seconds=TARGET_SECONDS):
    w, h, dur = probe(src, 'width', 'height', 'duration')
    w, h = int(w), int(h)
    with tempfile.TemporaryDirectory() as work:
        frames = sample(src, work)
        arrays = [np.array(Image.open(f).convert('RGB')).astype(int) for f in frames]
        sw, sh = arrays[0].shape[1], arrays[0].shape[0]

        # The border is cropped away below rather than cut around, so the only
        # thing that ends the clip is the model coming to rest.
        outlined = any(has_outline(a) for a in arrays)
        cut = dur

        # A recording usually ends with the finished model sitting still while
        # the recorder is stopped. That reads as the video having stalled, so it
        # is cut a moment after the last thing that actually moves.
        # Counted by how many pixels changed, not by how much the picture changed
        # on average: adding a small part moves few pixels but moves them a lot,
        # and an average over the whole frame hides it. A mean-based rule cut the
        # last two moves off one of these videos.
        grey = [a.mean(axis=2) for a in arrays]
        moved = [i for i in range(1, len(grey))
                 if (np.abs(grey[i] - grey[i - 1]) > 12).mean() > 0.0005]
        if moved:
            settle = (moved[-1] + 1) / SAMPLE_FPS + 0.5
            if settle < cut:
                print(f'  trimming {cut - settle:.1f}s where nothing moves')
                cut = settle
        skin = round(OUTLINE_INSET * sw / w) if outlined else 0
        boxes = [ink_box(a, skin) for a in arrays]
        boxes = [(b[0] + skin, b[1] + skin, b[2] + skin, b[3] + skin) for b in boxes if b]

        # Framed on the finished model — the last frame — rather than on
        # every frame together. Sketch planes and half-built parts sit elsewhere
        # in the frame, and centring on all of them together left the finished
        # model visibly off-centre.
        model = boxes[-1]
        sx, sy = w / sw, h / sh
        model_h = (model[3] - model[1]) * sy
        cx = (model[0] + model[2]) / 2 * sx
        cy = (model[1] + model[3]) / 2 * sy

        frame_h = round(model_h / FILL / 2) * 2
        frame_w = round(frame_h * ASPECT / 2) * 2

        # Nothing from any frame may fall outside, so the frame grows if an
        # earlier step reached further out than the finished model does.
        left = min(b[0] for b in boxes) * sx
        right = max(b[2] for b in boxes) * sx
        top = min(b[1] for b in boxes) * sy
        bottom = max(b[3] for b in boxes) * sy
        need_w = 2 * max(cx - left, right - cx)
        need_h = 2 * max(cy - top, bottom - cy)
        if need_w > frame_w or need_h > frame_h:
            scale = max(need_w / frame_w, need_h / frame_h)
            frame_w = round(frame_w * scale / 2) * 2
            frame_h = round(frame_h * scale / 2) * 2

        x0, y0 = round(cx - frame_w / 2), round(cy - frame_h / 2)
        # the model stays centred in the frame above; the extra height is added
        # underneath it, where the controls go
        frame_h += round(frame_w * CONTROL_ROOM / 2) * 2

        # crop what is available inside the border, pad the rest
        edge = OUTLINE_INSET if outlined else 0
        cx0, cy0 = max(edge, x0), max(edge, y0)
        cw = min(w - edge - cx0, frame_w - (cx0 - x0)) // 2 * 2
        ch = min(h - edge - cy0, frame_h - (cy0 - y0)) // 2 * 2
        px, py = max(0, cx0 - x0), max(0, cy0 - y0)

        speed = max(1.0, (cut / seconds))
        vf = (f'crop={cw}:{ch}:{cx0}:{cy0},format=rgb24,'
              f'pad={frame_w}:{frame_h}:{px}:{py}:0xFDFDFD,setpts=PTS/{speed:.3f},fps=30')
        print(f'  source {w}x{h}, {dur:.1f}s; usable to {cut:.1f}s')
        print(f'  model {model_h:.0f}px tall -> frame {frame_w}x{frame_h}, sped up {speed:.2f}x')
        subprocess.run(['ffmpeg', '-v', 'error', '-t', f'{cut:.2f}', '-i', str(src),
                        '-vf', vf, '-c:v', 'libx264', '-crf', '26', '-preset', 'slow',
                        '-pix_fmt', 'yuv420p', '-an', '-movflags', '+faststart',
                        '-y', str(dst)], check=True)
        ow, oh, od = probe(dst, 'width', 'height', 'duration')
        print(f'  -> {dst} {int(ow)}x{int(oh)}, {od:.1f}s, {os.path.getsize(dst)/1024:.0f} KB')

if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2], float(sys.argv[3]) if len(sys.argv) > 3 else TARGET_SECONDS)
