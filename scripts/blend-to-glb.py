# scripts/blend-to-glb.py
#
# The model as it was rendered for the animation, made into the GLB the
# viewer loads. Run inside Blender:
#
#     /Applications/Blender.app/Contents/MacOS/Blender -b --python scripts/blend-to-glb.py \
#         -- "Skeleton Barrel Fly.blend" source-models/skeleton-barrel-full.glb [frame] [atlas px]
#
# then shrink the result for the site (see public/models/README.md).
#
# Three things the animation file has that no export carries on its own:
# parts that are animated into place (taken at the last frame, where the model
# is whole), materials whose colour is procedural — the wood's grain is a wave
# through a colour ramp, which glTF cannot describe — and a skull painted onto
# faces rather than bodies. So every part is frozen where it stands, every
# mesh is joined into one and unwrapped, and the colour of every material is
# baked into a single image that each material then reads through its own UVs.
# Metal, roughness and transparency stay per material, as they were.
import sys, os
import bpy

# Materials to override before the bake, by name prefix: (base colour,
# metallic, roughness). The animation's iron was lit by a bright world it no
# longer has; this is the blued, part-metallic iron that reads right in the
# viewer's light.
LOOKS = {
    'Steel': ((0.12, 0.13, 0.16, 1.0), 0.6, 0.55),
}

args = sys.argv[sys.argv.index('--') + 1:]
src, out = args[0], args[1]
frame = int(args[2]) if len(args) > 2 else None
ATLAS = int(args[3]) if len(args) > 3 else 2048

bpy.ops.wm.open_mainfile(filepath=src)
sc = bpy.context.scene
sc.frame_set(frame if frame is not None else sc.frame_end)
print('frame', sc.frame_current)

# Every visible mesh, frozen where the animation has put it.
frozen = []
for o in list(bpy.data.objects):
    if o.type != 'MESH' or o.hide_render:
        continue
    m = o.matrix_world.copy()
    o.animation_data_clear()
    o.parent = None
    o.matrix_world = m
    frozen.append(o)
for o in bpy.data.objects:
    if o.type != 'MESH':
        bpy.data.objects.remove(o)
print('parts', len(frozen))

# Only the parts wearing a procedural material need baking: those are joined
# into one mesh and unwrapped, and their materials become copies that read the
# atlas. Every other part keeps its flat colours exactly, and no atlas seam
# can ever cross it.
def procedural(mat):
    if not (mat and mat.use_nodes and mat.node_tree):
        return False
    bsdf = next((n for n in mat.node_tree.nodes if n.type == 'BSDF_PRINCIPLED'), None)
    return bool(bsdf and bsdf.inputs['Base Color'].is_linked)

for o in frozen:
    for slot in o.material_slots:
        mat = slot.material
        look = next((v for k, v in LOOKS.items() if mat and mat.name.startswith(k)), None)
        bsdf = next((n for n in mat.node_tree.nodes if n.type == 'BSDF_PRINCIPLED'), None) if mat and mat.node_tree else None
        if look and bsdf:
            colour, metal, rough = look
            for link in list(mat.node_tree.links):
                if link.to_socket == bsdf.inputs['Base Color']:
                    mat.node_tree.links.remove(link)
            bsdf.inputs['Base Color'].default_value = colour
            bsdf.inputs['Metallic'].default_value = metal
            bsdf.inputs['Roughness'].default_value = rough

to_bake = [o for o in frozen if any(procedural(s.material) for s in o.material_slots)]
plain = [o for o in frozen if o not in to_bake]
print('parts to bake', len(to_bake), '| kept flat', len(plain))

bpy.ops.object.select_all(action='DESELECT')
for o in to_bake:
    o.data = o.data.copy()
    o.select_set(True)
bpy.context.view_layer.objects.active = to_bake[0]
bpy.ops.object.join()
whole = bpy.context.view_layer.objects.active
whole.name = 'baked'
# Its own copies of its materials, so the flat parts keep the originals.
for slot in whole.material_slots:
    slot.material = slot.material.copy()
bpy.ops.object.mode_set(mode='EDIT')
bpy.ops.mesh.select_all(action='SELECT')
# Islands further apart than the bake bleeds, or one bleeds into the next.
bpy.ops.uv.smart_project(angle_limit=1.15, island_margin=0.01)
bpy.ops.object.mode_set(mode='OBJECT')
print('triangles baked', sum(len(p.vertices) - 2 for p in whole.data.polygons), 'materials', len(whole.material_slots))

# The colour of those parts, baked into one image. Diffuse colour only — no
# light in it — so one sample is exact. The atlas starts mid-grey rather than
# black, and every island bleeds a little past its edge with the colour of
# the faces next door, since the texture is filtered across the edge.
atlas = bpy.data.images.new('atlas', ATLAS, ATLAS)
atlas.generated_color = (0.5, 0.5, 0.5, 1.0)
BLEED = 8
for slot in whole.material_slots:
    mat = slot.material
    node = mat.node_tree.nodes.new('ShaderNodeTexImage')
    node.image = atlas
    node.name = 'bake'
    mat.node_tree.nodes.active = node
sc.render.engine = 'CYCLES'
sc.cycles.device = 'CPU'
sc.cycles.samples = 1
sc.render.bake.use_pass_direct = False
sc.render.bake.use_pass_indirect = False
sc.render.bake.margin = BLEED
sc.render.bake.margin_type = 'ADJACENT_FACES'
bpy.ops.object.select_all(action='DESELECT')
whole.select_set(True)
bpy.context.view_layer.objects.active = whole
bpy.ops.object.bake(type='DIFFUSE', pass_filter={'COLOR'}, margin=BLEED)
atlas.pack()
print('baked', ATLAS)

# The baked parts' materials now read the atlas for colour and keep the rest.
for slot in whole.material_slots:
    mat = slot.material
    nt = mat.node_tree
    bsdf = next((n for n in nt.nodes if n.type == 'BSDF_PRINCIPLED'), None)
    node = nt.nodes['bake']
    if bsdf:
        for link in list(nt.links):
            if link.to_socket == bsdf.inputs['Base Color']:
                nt.links.remove(link)
        nt.links.new(node.outputs['Color'], bsdf.inputs['Base Color'])

# Every material that goes out: a sane specular, and glass that can be seen through.
for o in [whole] + plain:
    for slot in o.material_slots:
        mat = slot.material
        bsdf = next((n for n in mat.node_tree.nodes if n.type == 'BSDF_PRINCIPLED'), None) if mat and mat.node_tree else None
        if not bsdf:
            continue
        bsdf.inputs['Specular IOR Level'].default_value = 0.5
        if mat.name.lower().startswith('glass'):
            bsdf.inputs['Alpha'].default_value = 0.35
            mat.blend_method = 'BLEND'

bpy.ops.object.select_all(action='DESELECT')
for o in [whole] + plain:
    o.select_set(True)
print('exporting', 1 + len(plain), 'objects')
bpy.ops.export_scene.gltf(filepath=out, export_format='GLB', export_materials='EXPORT',
                          export_apply=True, export_yup=True, export_image_format='JPEG',
                          export_jpeg_quality=88, use_selection=True)
print('wrote', out, os.path.getsize(out), 'bytes')
