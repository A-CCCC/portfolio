# Project page photos

Drop photos into the folder named after the page and they appear on it. The
folder is read when the site is built, so there is no list in the code to keep
up to date — but do restart the dev server (or rebuild) after adding files.

    src/assets/photos/rc-car-repair/          -> the RC Car Repair page
    src/assets/photos/smart-kinesiology-tape/ -> the Smart Kinesiology Tape page

Anything ending .jpg .jpeg .png or .webp is picked up, in filename order.

## RC Car Repair

One gallery, shown in filename order. Prefix to arrange them:

    01-broken-bumper.jpg
    02-printed-replacement.jpg

## Smart Kinesiology Tape

The page has four sections, and the start of the filename decides which one a
photo belongs to:

    finding-01.jpg       -> Finding the Problem
    problem-01.jpg       -> The Problem
    model-render.webp    -> the large image under The Solution heading
    solution-1.jpg       -> beside the solution's first paragraph
    solution-2.jpg       -> beside its second paragraph
    solution-3.jpg       -> beside its third
    prototype-02.jpg     -> The Prototype
    process-sketch.jpg   -> The Process

The Solution is laid out differently from the other sections: the `model-` photo
runs full width straight under the heading (only the first one is used), and the
`solution-` photos are taken one per paragraph in filename order, alternating
sides down the page. A paragraph with no photo yet simply sits centred, so the
section can be filled in as the photos arrive.

Within a section they are ordered by filename, so `prototype-01`, `prototype-02`
and so on. A photo whose name matches none of the four collects in a "More"
section at the foot of the page rather than being dropped.

Vite fingerprints and compresses whatever is in here, which is why these live in
src/ rather than public/.

Not for: pages with a hand-written section list (public/photos/<page>/, as the
Wheelchair Storage page uses), thumbnails (public/thumbnails/) or animation
frames (public/<name>-anim/).
