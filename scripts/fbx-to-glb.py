# scripts/fbx-to-glb.py
#
# A Fusion FBX (or OBJ) export, made into the GLB the model viewer loads — run inside
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
    'Oak':       ((0.19, 0.12, 0.065, 1.0), 0.0, 0.85),  # the barrel's panels: dark, aged
    '3D Oak':    ((0.19, 0.12, 0.065, 1.0), 0.0, 0.85),
    'Aluminum':  ((0.19, 0.12, 0.065, 1.0), 0.0, 0.85),  # the skull panels: same wood
    'Steel':     ((0.12, 0.13, 0.16, 1.0), 0.6, 0.55),   # bands and spikes: dark blued iron
    # '3D Ash' (the rope) and 'ABS' (the balloons) come through as they are
}

src, out = sys.argv[sys.argv.index('--') + 1:][:2]
bpy.ops.wm.read_factory_settings(use_empty=True)
# FBX or OBJ, whichever Fusion was asked for: both carry the appearances, and
# OBJ keeps one painted onto faces as its own material group on the body.
if src.lower().endswith('.obj'):
    bpy.ops.wm.obj_import(filepath=src)
else:
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
    # Fusion's appearances arrive with a strong specular layer, which in the
    # viewer reflects a lit room off every surface and lifts dark wood to tan.
    # A matt material keeps a little; metal keeps its own.
    bsdf.inputs['Specular IOR Level'].default_value = 0.2
    bsdf.inputs['Specular Tint'].default_value = (1.0, 1.0, 1.0, 1.0)
    print('appearance', m.name, '->', tuple(round(c, 2) for c in bsdf.inputs['Base Color'].default_value[:3]))

bpy.ops.export_scene.gltf(filepath=out, export_format='GLB', export_materials='EXPORT',
                          export_apply=True, export_yup=True)
print('wrote', out, os.path.getsize(out), 'bytes')
