#!/usr/bin/env python3
"""Scale the Log Runner sprites so their sizes relate to each other.

    python3 scripts/make-sprites.py

The models were each built at whatever size suited them, so the renders carry no
relative scale: the log arrives larger than the mortar. This sets each sprite's
height from what the thing is in Clash Royale, then compresses that range so the
game stays playable — at true proportions the elixir collector would be twice
the log's height and impossible to clear in a 300px play area.

Heights below are in rough metres, judged from the game's own art. The exponent
keeps the ordering while pulling the extremes together.
"""
import os, shutil
from pathlib import Path
import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage

REAL_HEIGHT = {          # metres, roughly, relative to each other
    'log': 1.2,
    'cannon-cart': 1.5,
    'skeleton-barrel': 2.0,     # the barrel plus its balloons
    'mortar': 2.0,
    'elixir-collector': 2.5,
}
COMPRESS = 0.7           # 1.0 = true proportions, lower = flatter range
LOG_HEIGHT = 112         # the log's height in the sprite, at 2x its drawn size
SMOOTH = 6               # a step this small between neighbours reads as backdrop
BACKDROP = 26            # how close to the backdrop colour a leftover edge may be
FLAT = 8                 # tighter, for a backdrop that is all one colour


def keyed(im):
    """Give a flat-backed screenshot the transparency the crop below needs.

    A render exported as PNG arrives with its background already cut out, but a
    screenshot arrives opaque, and cropping that to its alpha bounds keeps the
    whole window. So the backdrop is lifted instead — by where it stops rather
    than by its colour, since a pale spike on a white backdrop is the same colour
    and a gradient backdrop is several. Anywhere neighbouring pixels step by
    almost nothing is smooth; the model's outline is not, so the smooth region
    joined to the frame's edge is the backdrop and nothing else is.
    """
    a = np.array(im).astype(int)[:, :, :3]
    step = np.zeros(a.shape[:2])
    for axis, roll in ((0, 1), (0, -1), (1, 1), (1, -1)):
        step = np.maximum(step, np.abs(a - np.roll(a, roll, axis=axis)).max(axis=2))
    smooth = step <= SMOOTH

    labels, count = ndimage.label(smooth)
    edge = set(labels[0]) | set(labels[-1]) | set(labels[:, 0]) | set(labels[:, -1])
    backdrop = np.isin(labels, [i for i in edge if i]) if count else np.zeros_like(smooth)

    tolerance = BACKDROP
    if backdrop.any():
        rim = np.median(a[backdrop], axis=0)
        # A backdrop of one flat colour cannot be walked into by mistake, so its
        # colour is allowed to have the final say: a pale part of the model on a
        # white background steps too gently to stop the pass above, and this is
        # what keeps it. A graded backdrop is several colours and cannot.
        if a[backdrop].std(axis=0).max() < 4:
            tolerance = FLAT
            backdrop &= np.abs(a - rim).max(axis=2) <= tolerance

        # The outline itself is a step, so it survives as a rim of backdrop
        # coloured pixels. Anything touching the backdrop and still close to its
        # colour goes too, which leaves the model's own edge behind.
        near = np.abs(a - rim).max(axis=2) <= tolerance
        for _ in range(2):
            backdrop |= ndimage.binary_dilation(backdrop) & near

    # Where the model's own colour meets the backdrop's, the step between them
    # vanishes and the pass above walks straight in. So anything plainly not the
    # backdrop colour is put back, and whatever that encloses with it.
    subject = ~backdrop
    if backdrop.any():
        subject |= np.abs(a - rim).max(axis=2) > BACKDROP
        subject = ndimage.binary_fill_holes(subject)

    keep_frac = subject.mean()

    # A hard cut leaves a stair-stepped silhouette at sprite size, so the edge is
    # softened by about a pixel on the way out.
    keep = Image.fromarray((subject * 255).astype(np.uint8))
    keep = keep.filter(ImageFilter.GaussianBlur(0.8))
    out = np.array(im)
    out[:, :, 3] = (out[:, :, 3] * (np.array(keep) / 255)).clip(0, 255).astype(np.uint8)
    return Image.fromarray(out), 1 - keep_frac


def main():
    Path('source-game').mkdir(exist_ok=True)
    base = REAL_HEIGHT['log']
    print(f'{"sprite":20}{"real":>6}{"scaled":>8}{"height":>8}   file')
    for slug, real in REAL_HEIGHT.items():
        src = f'public/game/{slug}-2D.png'
        if not os.path.exists(src):
            print(f'{slug:20} missing {src}')
            continue
        # Keep every render that comes through, rather than letting a re-run
        # overwrite the one already filed: these are the only copies.
        archive = Path(f'source-game/{slug}-2D.png')
        if archive.exists():
            spare = next(f'source-game/{slug}-2D-{i}.png' for i in range(2, 99)
                         if not os.path.exists(f'source-game/{slug}-2D-{i}.png'))
            archive = Path(spare)
        shutil.copy(src, archive)

        im = Image.open(src).convert('RGBA')
        if (np.array(im)[:, :, 3] > 250).mean() > 0.98:
            im, lifted = keyed(im)
            print(f'{slug:20} screenshot: lifted {lifted*100:.0f}% of it as backdrop '
                  f'(a backdrop the model has no colour in common with keys best)')
        a = np.array(im)
        ys, xs = np.where(a[:, :, 3] > 8)
        subject = im.crop((xs.min(), ys.min(), xs.max() + 1, ys.max() + 1))

        ratio = (real / base) ** COMPRESS
        height = round(LOG_HEIGHT * ratio)
        width = max(1, round(subject.size[0] * height / subject.size[1]))
        out = f'public/game/{slug}.png'
        subject.resize((width, height), Image.LANCZOS).save(out, optimize=True)
        os.remove(src)      # the copy above is the one that is kept
        print(f'{slug:20}{real:6.1f}{ratio:8.2f}{height:8}   {width}x{height}, '
              f'{os.path.getsize(out)/1024:.0f} KB')

if __name__ == '__main__':
    main()
