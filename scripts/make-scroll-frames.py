#!/usr/bin/env python3
"""Turn a video into the numbered frames a scroll-scrubbed section reads.

    python3 scripts/make-scroll-frames.py <slug>
    python3 scripts/make-scroll-frames.py <video> <slug> [seconds]

With just a slug it goes looking in public/ for the recording — any video file
whose name mentions the slug, or failing that the only video sitting there. So
dropping the clip into public/ and naming the page is the whole of it.

Writes public/<slug>-anim/0001.webp … and prints the frame count to put in that
page's FRAME_COUNT.

The Clash Royale pages scrub through renders exported from Fusion. This does the
same job for footage of a real thing: the video is sampled into stills, because
scrubbing a <video> by setting currentTime is at the mercy of where its keyframes
happen to fall and stutters badly on the way back up.

The work is split: ffmpeg samples the clip and scales it, and Pillow writes the
webp — the ffmpeg on this machine has no webp encoder, and the frames would fail
at the last step if it were asked to.
"""
import os
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

from PIL import Image

# What the scroll runway can show: the section gives three screens of scrolling,
# about 2,400px on a laptop, and a frame every ten pixels reads as continuous.
MOST_FRAMES = 240
WIDTH = 1280             # plenty for a half-screen panel on a dense display
QUALITY = 72             # the frames are photographs, not flat renders


def probe(video, field):
    out = subprocess.run(
        ['ffprobe', '-v', 'error', '-select_streams', 'v:0',
         '-show_entries', field, '-of', 'default=nw=1:nk=1', video],
        capture_output=True, text=True, check=True)
    return out.stdout.strip().split('\n')[0]


VIDEO_TYPES = ('.mp4', '.mov', '.m4v', '.webm', '.avi')


def find_video(slug):
    """The clip for this page, wherever in public/ it was dropped."""
    here = [p for p in Path('public').rglob('*')
            if p.suffix.lower() in VIDEO_TYPES and '-anim' not in str(p)]
    named = [p for p in here if slug.replace('-', '') in p.stem.lower().replace('-', '').replace('_', '')]
    if len(named) == 1:
        return named[0]
    if named:
        print('several look like it — name the one you want:')
        for p in named:
            print(f'  {p}')
        return None
    loose = [p for p in here if p.parent == Path('public')]
    if len(loose) == 1:
        return loose[0]
    print(f'no video in public/ mentioning "{slug}". Found:')
    for p in here:
        print(f'  {p}')
    return None


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        return

    if len(sys.argv) == 2:
        slug = sys.argv[1]
        found = find_video(slug)
        if not found:
            return
        video = str(found)
        print(f'using {video}')
    else:
        video, slug = sys.argv[1], sys.argv[2]

    if not os.path.exists(video):
        print(f'no such video: {video}')
        return

    length = float(sys.argv[3]) if len(sys.argv) > 3 else float(probe(video, 'format=duration'))
    rate = probe(video, 'stream=avg_frame_rate')
    top, bottom = (rate.split('/') + ['1'])[:2]
    source_fps = float(top) / float(bottom or 1)

    # Never more frames than the clip actually has: sampling a 30fps video at 34
    # would write the same picture twice and call it two frames.
    wanted = min(MOST_FRAMES, max(1, int(length * source_fps)))
    fps = wanted / length

    out = Path(f'public/{slug}-anim')
    out.mkdir(parents=True, exist_ok=True)
    for old in out.glob('*.webp'):
        old.unlink()

    stage = tempfile.mkdtemp()
    try:
        subprocess.run([
            'ffmpeg', '-hide_banner', '-loglevel', 'error', '-y',
            '-t', str(length), '-i', video,
            '-vf', f'fps={fps:.6f},scale={WIDTH}:-2:flags=lanczos',
            '-frames:v', str(wanted),
            f'{stage}/%04d.png',
        ], check=True)

        stills = sorted(Path(stage).glob('*.png'))
        for i, still in enumerate(stills, 1):
            Image.open(still).convert('RGB').save(
                out / f'{i:04d}.webp', quality=QUALITY, method=4)
    finally:
        shutil.rmtree(stage, ignore_errors=True)

    made = sorted(out.glob('*.webp'))
    size = sum(f.stat().st_size for f in made)
    print(f'{len(made)} frames in {out}, {size/1024/1024:.1f}MB '
          f'({size/max(len(made), 1)/1024:.0f}KB each)')
    print(f'sampled {length:.1f}s of {source_fps:.0f}fps footage at {fps:.2f} a second')
    print(f'\nset FRAME_COUNT = {len(made)}')


if __name__ == '__main__':
    main()
