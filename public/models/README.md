# Models for the viewers

One file per Clash Royale page, named after the page, which the viewer at the
foot of that page loads:

    public/models/<page>.glb    e.g. skeleton-barrel.glb, mortar.glb

A page with no file here shows no viewer at all.

## From the animation's Blender file (the best source)

Where a model was animated in Blender — the Skeleton Barrel and the Elixir
Collector — the .blend at the root of the project already has the look of the
rendered animation: the wood grain, the painted skull, the elixir. That comes
out with one command, which freezes the parts at the last frame, bakes the
procedural materials into an image, and exports:

    /Applications/Blender.app/Contents/MacOS/Blender -b \
      --python scripts/blend-to-glb.py -- "Skeleton Barrel Fly.blend" source-models/skeleton-barrel-full.glb

then step 3 below, with `--texture-compress webp` added. These arrive the
right way up; `turn` in src/data/models.js is only for facing the camera.

## From a Fusion export

To add one:

1. In Fusion, give each body a colour appearance (Modify → Appearance), then
   File → Export → FBX into source-models/. Fusion's own woods and metals are
   procedural and export as a single flat colour — black, for the woods — so
   the next step recolours them by name.
2. Make the GLB with Blender, which keeps the appearances:

       /Applications/Blender.app/Contents/MacOS/Blender -b \
         --python scripts/fbx-to-glb.py -- source-models/<export>.fbx source-models/<page>-full.glb

   The colours it substitutes are the LOOKS table at the top of that script.
3. Shrink it for the site — the Skeleton Barrel is 6 MB out of Blender and
   half a megabyte here, with every triangle kept:

       npx @gltf-transform/cli optimize source-models/<page>-full.glb public/models/<page>.glb \
         --compress draco --simplify false

   Add `--simplify true --simplify-ratio 0.5` for a model that is still too big.
4. Fusion exports lie on their side (z up). Set `turn: [-90, 0, 0]` for the
   page in src/data/models.js, and check it stands the right way up.

The Draco decoder the browser needs for those files lives in public/draco/,
copied from node_modules/three/examples/jsm/libs/draco/gltf/. Keep it in step
with the three version in package.json when that changes.

Originals are kept in source-models/ (not committed).
