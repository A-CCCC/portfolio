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

# One mesh, one UV layout. Joined copies, so nothing in the file is touched.
bpy.ops.object.select_all(action='DESELECT')
for o in frozen:
    o.data = o.data.copy()
    o.select_set(True)
bpy.context.view_layer.objects.active = frozen[0]
bpy.ops.object.join()
whole = bpy.context.view_layer.objects.active
whole.name = 'model'
bpy.ops.object.mode_set(mode='EDIT')
bpy.ops.mesh.select_all(action='SELECT')
bpy.ops.uv.smart_project(angle_limit=1.15, island_margin=0.002)
bpy.ops.object.mode_set(mode='OBJECT')
print('triangles', sum(len(p.vertices) - 2 for p in whole.data.polygons), 'materials', len(whole.material_slots))

# The colour of everything, baked into one image. Diffuse colour only — no
# light in it — so one sample is exact.
atlas = bpy.data.images.new('atlas', ATLAS, ATLAS)
for slot in whole.material_slots:
    mat = slot.material
    if not mat.use_nodes:
        mat.use_nodes = True
    node = mat.node_tree.nodes.new('ShaderNodeTexImage')
    node.image = atlas
    node.name = 'bake'
    mat.node_tree.nodes.active = node
sc.render.engine = 'CYCLES'
sc.cycles.device = 'CPU'
sc.cycles.samples = 1
sc.render.bake.use_pass_direct = False
sc.render.bake.use_pass_indirect = False
sc.render.bake.margin = 6
bpy.ops.object.select_all(action='DESELECT')
whole.select_set(True)
bpy.ops.object.bake(type='DIFFUSE', pass_filter={'COLOR'}, margin=6)
atlas.pack()
print('baked', ATLAS)

# Every material now reads its colour from the atlas, and keeps the rest.
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
        bsdf.inputs['Specular IOR Level'].default_value = 0.5
        # Glass in the file is a real refractive material; in the viewer it is
        # a tinted, mostly see-through surface.
        if mat.name.lower().startswith('glass'):
            bsdf.inputs['Alpha'].default_value = 0.35
            mat.blend_method = 'BLEND'
    print('material', mat.name, 'metal', round(bsdf.inputs['Metallic'].default_value, 2) if bsdf else '-',
          'rough', round(bsdf.inputs['Roughness'].default_value, 2) if bsdf else '-')

bpy.ops.export_scene.gltf(filepath=out, export_format='GLB', export_materials='EXPORT',
                          export_apply=True, export_yup=True, export_image_format='JPEG',
                          export_jpeg_quality=88, use_selection=True)
print('wrote', out, os.path.getsize(out), 'bytes')
