# Page photos

Content images that sit alongside text on a project page — one folder per page,
named after the page's route segment.

    public/photos/wheelchair-storage/   ->  /photos/wheelchair-storage/<file>

Reference them by absolute URL from the page component:

    <img src="/photos/wheelchair-storage/prototype-01.jpg" alt="..." />

Anything under public/ is copied into the build as-is, so the path you write
here is the path that ships. Keep filenames lowercase with hyphens — some hosts
serve on case-sensitive filesystems, where Photo-01.JPG and photo-01.jpg are
different files.

Not for: carousel/bubble thumbnails (public/thumbnails/) or scroll-animation
frame sequences (public/<name>-anim/).
