#!/usr/bin/env python3
"""Normalise a render into a project thumbnail.

    python3 scripts/make-thumbnail.py public/thumbnails/Cannon-cart-new.png cannon-cart

Cuts the subject out of its background, scales it so it fills the same share of
the frame as every other thumbnail, centres it on a transparent square and
writes <slug>.webp. The original is kept in source-thumbnails/full-size/ so a
later change of size does not need a fresh export.
"""
import sys, os, shutil
from pathlib import Path
import numpy as np
from PIL import Image

# Two sizes of each thumbnail. The cards and hub covers show them large — up to
# 560px, which is 1120 real pixels on a high-resolution screen — while the home
# page's bubbles never exceed about 280. One file for both meant either a blurry
# cover or eight needlessly heavy bubbles.
BIG = 1400           # the ceiling; the render's own resolution usually decides
SMALL = 420          # bubbles reach about 140px, so this is comfortably past
                     # what a high-resolution screen asks for
FILL = 0.67          # share of the canvas the subject takes, matching the rest

def main(src, slug):
    Path('source-thumbnails/full-size').mkdir(parents=True, exist_ok=True)
    kept = f'source-thumbnails/full-size/{slug}.png'
    # re-running from the archive itself is normal when the sizes change
    if os.path.abspath(src) != os.path.abspath(kept):
        shutil.copy(src, kept)

    im = Image.open(src).convert('RGBA')
    a = np.array(im)
    if a[:, :, 3].min() == 255:                  # opaque: drop the white ground
        nonwhite = (a[:, :, :3] < 245).any(axis=2)
        im.putalpha(Image.fromarray((nonwhite * 255).astype('uint8')))
        a = np.array(im)
        print('  removed the opaque white background')

    ys, xs = np.where(a[:, :, 3] > 8)
    subject = im.crop((xs.min(), ys.min(), xs.max() + 1, ys.max() + 1))
    print(f'  subject {subject.size[0]}x{subject.size[1]} of {im.size[0]}x{im.size[1]}')

    # Never scaled up: past its own resolution a render only gets softer, so the
    # large size stops at whatever the subject actually contains.
    native = round(max(subject.size) / FILL)
    big = min(BIG, native)
    if big < BIG:
        print(f'  render allows {big}px; a larger export would allow up to {BIG}px')

    def write(canvas_size, suffix):
        scale = canvas_size * FILL / max(subject.size)
        s2 = subject.resize((max(1, round(subject.size[0] * scale)),
                             max(1, round(subject.size[1] * scale))), Image.LANCZOS)
        canvas = Image.new('RGBA', (canvas_size, canvas_size), (0, 0, 0, 0))
        canvas.paste(s2, ((canvas_size - s2.size[0]) // 2,
                          (canvas_size - s2.size[1]) // 2), s2)
        out = f'public/thumbnails/{slug}{suffix}.webp'
        canvas.save(out, 'WEBP', quality=90, method=6)
        print(f'  -> {out} {canvas_size}x{canvas_size}, {os.path.getsize(out)/1024:.0f} KB')
        return out

    out = write(big, '')
    write(SMALL, '-small')
    # Only a render dropped into public/thumbnails is cleared away. Anything
    # else — in particular the archived original this may have been re-run
    # from — is left alone. Deleting it once cost the full-size copies.
    if Path(src).resolve().parent == Path('public/thumbnails').resolve():
        os.remove(src)

if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2])
