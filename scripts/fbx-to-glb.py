# scripts/fbx-to-glb.py
#
# A Fusion FBX export, made into the GLB the model viewer loads — run inside
# Blender, which does the format conversion with the appearances intact:
#
#     /Applications/Blender.app/Contents/MacOS/Blender -b --python scripts/fbx-to-glb.py \
#         -- source-models/<export>.fbx source-models/<page>-full.glb
#
# then shrink the result for the site (see public/models/README.md).
#
# Fusion's appearances arrive as flat colours only — its woods and metals are
# procedural, and nothing but their base colour survives an export. The woods'
# base colour is black, which is no use, so appearances are recoloured here by
# name. Add a line to LOOKS for any appearance a new model uses.
import sys, os
import bpy

# name prefix -> (base colour, metallic, roughness). Matched against the start
# of the appearance's name, so "Steel - Satin.001" is still steel.
LOOKS = {
    'Oak':       ((0.26, 0.15, 0.06, 1.0), 0.0, 0.8),   # the barrel's panels
    '3D Oak':    ((0.26, 0.15, 0.06, 1.0), 0.0, 0.8),
    'Aluminum':  ((0.26, 0.15, 0.06, 1.0), 0.0, 0.8),   # the skull panels: same wood
    'Steel':     ((0.32, 0.32, 0.34, 1.0), 0.8, 0.5),   # bands and spikes, worn dark
    # '3D Ash' (the rope) and 'ABS' (the balloons) come through as they are
}

src, out = sys.argv[sys.argv.index('--') + 1:][:2]
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.fbx(filepath=src)

for m in bpy.data.materials:
    if not (m.use_nodes and m.node_tree):
        continue
    bsdf = next((n for n in m.node_tree.nodes if n.type == 'BSDF_PRINCIPLED'), None)
    if not bsdf:
        continue
    look = next((v for k, v in LOOKS.items() if m.name.startswith(k)), None)
    if look:
        colour, metal, rough = look
        bsdf.inputs['Base Color'].default_value = colour
        bsdf.inputs['Metallic'].default_value = metal
        bsdf.inputs['Roughness'].default_value = rough
    print('appearance', m.name, '->', tuple(round(c, 2) for c in bsdf.inputs['Base Color'].default_value[:3]))

bpy.ops.export_scene.gltf(filepath=out, export_format='GLB', export_materials='EXPORT',
                          export_apply=True, export_yup=True)
print('wrote', out, os.path.getsize(out), 'bytes')
