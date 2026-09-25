# Models for the viewers

One file per Clash Royale page, named after the page, which the viewer at the
foot of that page loads:

    public/models/<page>.glb    e.g. skeleton-barrel.glb, mortar.glb

A page with no file here shows no viewer at all. To add one, export the model
as glTF/GLB (Fusion: File → Export; or Blender), then shrink it — the Skeleton
Barrel came out of the exporter at 37 MB and goes on the site at 1 MB:

    npx @gltf-transform/cli optimize in.glb public/models/<page>.glb \
      --compress draco --simplify true --simplify-ratio 0.5 --simplify-error 0.001

The Draco decoder the browser needs for those files lives in public/draco/,
copied from node_modules/three/examples/jsm/libs/draco/gltf/. Keep it in step
with the three version in package.json when that changes.

Originals are kept in source-models/ (not committed).
