#!/usr/bin/env python3
"""Reads each thumbnail and writes the one colour that stands for the model.

The snake game grows by a block per model eaten, painted the model's own
colour, so the answer has to be the colour someone would name if asked what the
model looks like. Neither of the obvious methods gives that: the average of a
picture is always mud, and the most common exact shade splits a red car between
a dozen near-identical reds and loses to a smaller patch of one flat blue.

So: gather what has colour in it at all, group that by hue — every red in one
pile — and weigh each pile by how much of the model it covers and how strong
the colour is. A model with almost no colour anywhere is genuinely a grey or a
black one, and keeps its own shade rather than being given a hue it hasn't got.
"""
from PIL import Image
from collections import defaultdict
import colorsys
import glob
import os

MIN_ALPHA = 160
HUE_BINS = 18            # 20 degrees each — near enough that one red is one pile
HAS_COLOUR = 0.22        # saturation at which a pixel counts as coloured
COLOURED_ENOUGH = 0.08   # of the model, below which it is a neutral thing

# Where the eye disagrees with the arithmetic. Keep this short, and say why.
OVERRIDES = {}

def stands_for(path):
    im = Image.open(path).convert('RGBA')
    im.thumbnail((200, 200))
    piles = defaultdict(lambda: [0.0, 0.0, 0.0, 0.0])   # weight, r, g, b
    neutral = [0.0, 0.0, 0.0, 0.0]
    opaque = 0

    for r, g, b, a in im.getdata():
        if a < MIN_ALPHA:
            continue
        opaque += 1
        h, l, s = colorsys.rgb_to_hls(r / 255, g / 255, b / 255)
        if s >= HAS_COLOUR and 0.12 < l < 0.88:
            pile = piles[int(h * HUE_BINS) % HUE_BINS]
            weight = s                      # stronger colour speaks louder
            pile[0] += weight
            pile[1] += r * weight
            pile[2] += g * weight
            pile[3] += b * weight
        elif l < 0.9:                       # not the paper behind it
            neutral[0] += 1
            neutral[1] += r
            neutral[2] += g
            neutral[3] += b

    coloured = sum(p[0] for p in piles.values())
    if opaque and coloured / opaque >= COLOURED_ENOUGH and piles:
        weight, r, g, b = max(piles.values(), key=lambda p: p[0])
    elif neutral[0]:
        weight, r, g, b = neutral
    else:
        return '#888888'

    r, g, b = r / weight / 255, g / weight / 255, b / weight / 255
    h, l, s = colorsys.rgb_to_hls(r, g, b)
    if s > 0.12:
        # Lifted where it is flat, so a block of it reads against the grass
        s = min(1, s * 1.3)
        l = min(0.68, max(0.32, l))
    else:
        # A black or a white model stays one, but not so dark that a block of it
        # disappears into the shadow under the snake
        l = min(0.8, max(0.24, l))
    r, g, b = colorsys.hls_to_rgb(h, l, s)
    return '#%02x%02x%02x' % (round(r * 255), round(g * 255), round(b * 255))

rows = []
for path in sorted(glob.glob('public/thumbnails/*.webp')):
    name = os.path.basename(path)[:-5]
    if name.endswith('-small'):
        continue
    rows.append((name, OVERRIDES.get(name) or stands_for(path)))

with open('src/data/model-colours.js', 'w') as out:
    out.write("""// src/data/model-colours.js
//
// The colour that stands for each model, keyed by its thumbnail's name.
// Written by scripts/model-colours.py from the thumbnails themselves — run that
// again when a render is replaced, rather than editing these by hand.
//
// The snake game grows by a block of this colour for every model it eats.
export const MODEL_COLOUR = {
""")
    for name, colour in rows:
        out.write(f"  '{name}': '{colour}',\n")
    out.write("}\n")

for name, colour in rows:
    print(f'{name:26} {colour}')
