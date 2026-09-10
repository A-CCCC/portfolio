# About photo

The portrait used by both about sections — the band on the home page and the
About Me page:

    public/photos/about/profile.jpg  ->  /photos/about/profile.jpg

It is masked to a circle and cropped from the top, so a head-and-shoulders shot
works even if it is taller than it is wide. Roughly 400px square or larger keeps
it sharp on high-resolution screens.

To swap it, replace the file. To use a different name or shape, change SRC in
src/components/Portrait.jsx — both sections read from there, so they cannot
drift apart. If the file is missing the sections fall back to an initial in a
circle rather than a broken image.
