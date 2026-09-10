Frames for the scroll-scrubbed section on the Backup Camera Wiper page.

These come from a video rather than a render. Drop the recording anywhere in
public/ with "backup-camera-wiper" somewhere in its name, then run:

    python3 scripts/make-scroll-frames.py backup-camera-wiper

It finds the clip, writes 0001.webp, 0002.webp … here, and prints the number of
frames. Put that number in FRAME_COUNT at the top of
src/pages/solutions/convenience/BackupCameraWiper.jsx and the section appears.

Then delete the video itself from public/ — everything in public/ is published,
and the frames are what the page reads.

Shooting notes: use a tripod, since each frame is scrubbed one at a time and a
wobble that passes unnoticed at speed becomes a jitter under someone's thumb.
Eight to ten seconds is the sweet spot — a longer clip is sampled more sparsely
rather than turned into more frames.
