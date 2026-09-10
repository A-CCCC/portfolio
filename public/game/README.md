# Log Runner sprites

Orthographic side-view renders for the hidden mini-game at /log.

Drop them in here with these exact names:

    log.png                 the player — the Log, rolling
    skeleton-barrel.png     obstacle
    elixir-collector.png    obstacle
    cannon-cart.png         obstacle
    mortar.png              obstacle

## What they need to be

**Transparent background.** They sit on the page background, which is white in
light mode and near-black in dark mode, so anything opaque will show as a box.

**Side-on and orthographic**, not the three-quarter view the thumbnails use — a
runner reads as a flat scene, and a perspective render looks wrong scrolling
past.

**One scale across all five.** Render them in the same scene, or at the same
camera distance, so a mortar is larger than a log in-game the way it is in life.
Do not fit each one to its own frame: the game reads their relative sizes from
the files.

**Roughly 600px on the longest side** is plenty; they are drawn at 40-90px.

**The log facing the direction it rolls** (obstacles scroll right to left, so the
log rolls forward to the right).

Anything in public/ ships as-is, so keep them reasonably small — a few hundred KB
each at most. Tell me once they are in and I will size and convert them.
