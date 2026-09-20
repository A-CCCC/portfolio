# About photo

The portrait used by both about sections — the band on the home page and the
About Me page:

    public/photos/about/profile.jpg  ->  /photos/about/profile.jpg

It is masked to a circle and cropped from the top, so a head-and-shoulders shot
works even if it is taller than it is wide. Roughly 400px square or larger keeps
it sharp on high-resolution screens.

The file here is square already, trimmed to exactly what the circle shows. A
browser hands over the whole file when the picture is dragged out of the page,
and the part the crop hides would have gone with it — so the crop is done to the
file rather than only in the page. A taller replacement still works; it will just
carry its own bottom around with it until it is trimmed the same way.

To swap it, replace the file. To use a different name or shape, change SRC in
src/components/Portrait.jsx — both sections read from there, so they cannot
drift apart. If the file is missing the sections fall back to an initial in a
circle rather than a broken image.
