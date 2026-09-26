# scripts/blend-to-glb.py
#
# The model as it was rendered for the animation, made into the GLB the
# viewer loads. Run inside Blender:
#
#     /Applications/Blender.app/Contents/MacOS/Blender -b --python scripts/blend-to-glb.py \
#         -- "Skeleton Barrel Fly.blend" source-models/skeleton-barrel-full.glb [frame] [atlas px] [staves]
#
# `staves` rewires every procedural wood so its grain runs along the model's
# long axis — the way a barrel's planks do — with a different phase on each
# part, instead of one field of grain evaluated across the whole model.
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
# metallic, roughness). The animation's iron was a mirror-black lit by a
# bright world it no longer has; this is the satin steel of the build video —
# a mid, slightly warm grey that is mostly matt.
LOOKS = {
    'Steel': ((0.20, 0.195, 0.18, 1.0), 0.2, 0.6),
}

args = sys.argv[sys.argv.index('--') + 1:]
src, out = args[0], args[1]
frame = int(args[2]) if len(args) > 2 and args[2] != '-' else None
ATLAS = int(args[3]) if len(args) > 3 and args[3] != '-' else 2048
STAVES = len(args) > 4 and args[4] == 'staves'

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

# Every part is baked as itself, so a texture that reads the part it is on
# — a random per part, the part's own coordinates — gives each part its own
# grain. The parts share one atlas, unwrapped together so no two overlap.
import math
from mathutils import Vector

if STAVES:
    # The barrel's axis, in the shared local space of its parts: the direction
    # the wood is longest in, through the middle of it.
    pts = [Vector(v.co) for o in to_bake for v in o.data.vertices
           if any(s.material and s.material.name.startswith(('Oak', '3D Oak')) for s in o.material_slots)]
    centre = sum(pts, Vector()) / max(len(pts), 1)
    spread = [max(p[i] for p in pts) - min(p[i] for p in pts) for i in range(3)]
    axis = spread.index(max(spread))
    across = [i for i in range(3) if i != axis]
    print('staves: axis', 'xyz'[axis], 'centre', tuple(round(c, 2) for c in centre), 'spread', [round(v, 2) for v in spread])
    for mat in {s.material for o in to_bake for s in o.material_slots if s.material}:
        if not (procedural(mat) and mat.name.startswith(('Oak', '3D Oak'))):
            continue
        nt = mat.node_tree
        wave = next((n for n in nt.nodes if n.type == 'TEX_WAVE'), None)
        coord = next((n for n in nt.nodes if n.type == 'TEX_COORD'), None)
        if not (wave and coord):
            continue
        for link in list(nt.links):
            if link.to_node == wave and link.to_socket.name == 'Vector':
                nt.links.remove(link)
        # angle round the axis, times the radius, is distance round the barrel:
        # bands in that run lengthwise along every stave
        sub = nt.nodes.new('ShaderNodeVectorMath'); sub.operation = 'SUBTRACT'
        sub.inputs[1].default_value = centre
        nt.links.new(coord.outputs['Object'], sub.inputs[0])
        sep = nt.nodes.new('ShaderNodeSeparateXYZ'); nt.links.new(sub.outputs['Vector'], sep.inputs['Vector'])
        atan = nt.nodes.new('ShaderNodeMath'); atan.operation = 'ARCTAN2'
        nt.links.new(sep.outputs['XYZ'[across[1]]], atan.inputs[0]); nt.links.new(sep.outputs['XYZ'[across[0]]], atan.inputs[1])
        radius = max(spread[across[0]], spread[across[1]]) / 2
        arc = nt.nodes.new('ShaderNodeMath'); arc.operation = 'MULTIPLY'; arc.inputs[1].default_value = radius
        nt.links.new(atan.outputs[0], arc.inputs[0])
        # a different phase on each part, so no two staves share a grain
        info = nt.nodes.new('ShaderNodeObjectInfo')
        phase = nt.nodes.new('ShaderNodeMath'); phase.operation = 'MULTIPLY'; phase.inputs[1].default_value = 37.0
        nt.links.new(info.outputs['Random'], phase.inputs[0])
        shifted = nt.nodes.new('ShaderNodeMath'); shifted.operation = 'ADD'
        nt.links.new(arc.outputs[0], shifted.inputs[0]); nt.links.new(phase.outputs[0], shifted.inputs[1])
        # a little of the position along the stave, so the distortion wanders
        along = nt.nodes.new('ShaderNodeMath'); along.operation = 'MULTIPLY'; along.inputs[1].default_value = 0.35
        nt.links.new(sep.outputs['XYZ'[axis]], along.inputs[0])
        comb = nt.nodes.new('ShaderNodeCombineXYZ')
        nt.links.new(shifted.outputs[0], comb.inputs['X']); nt.links.new(along.outputs[0], comb.inputs['Y'])
        nt.links.new(comb.outputs['Vector'], wave.inputs['Vector'])
        wave.wave_type = 'BANDS'; wave.bands_direction = 'X'
        wave.inputs['Scale'].default_value = 4.5       # grain lines about a fifth of a unit apart
        wave.inputs['Distortion'].default_value = 2.2  # the wander of real grain
        wave.inputs['Detail'].default_value = 3.0
        print('staves: rewired', mat.name)

bpy.ops.object.select_all(action='DESELECT')
for o in to_bake:
    o.data = o.data.copy()
    o.select_set(True)
bpy.context.view_layer.objects.active = to_bake[0]
# Its own copies of the materials, shared among the baked parts, so the flat
# parts keep the originals.
copies = {}
for o in to_bake:
    for slot in o.material_slots:
        if slot.material not in copies:
            copies[slot.material] = slot.material.copy()
        slot.material = copies[slot.material]
# Welded, unwrapped and packed together: one layout across every part, so
# no two parts share a patch of the atlas.
bpy.ops.object.mode_set(mode='EDIT')
bpy.ops.mesh.select_all(action='SELECT')
bpy.ops.mesh.remove_doubles(threshold=0.0001)
bpy.ops.uv.smart_project(angle_limit=1.15, island_margin=0.01)
bpy.ops.uv.pack_islands(margin=0.01)
bpy.ops.object.mode_set(mode='OBJECT')
for op in ('shade_smooth_by_angle', 'shade_auto_smooth'):
    if hasattr(bpy.ops.object, op):
        getattr(bpy.ops.object, op)(angle=math.radians(35))
        break
print('triangles baked', sum(sum(len(p.vertices) - 2 for p in o.data.polygons) for o in to_bake), 'parts', len(to_bake), 'materials', len(copies))

# The colour of those parts, baked into one image. Diffuse colour only — no
# light in it — so one sample is exact. The atlas starts mid-grey rather than
# black, and every island bleeds a little past its edge with the colour of
# the faces next door, since the texture is filtered across the edge.
atlas = bpy.data.images.new('atlas', ATLAS, ATLAS)
atlas.generated_color = (0.5, 0.5, 0.5, 1.0)
BLEED = 8
for mat in copies.values():
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
sc.render.bake.use_clear = False
bpy.ops.object.select_all(action='DESELECT')
for o in to_bake:
    o.select_set(True)
bpy.context.view_layer.objects.active = to_bake[0]
bpy.ops.object.bake(type='DIFFUSE', pass_filter={'COLOR'}, margin=BLEED, use_clear=False)
atlas.pack()
print('baked', ATLAS)

# One mesh for the site, now that every part has its own patch of the atlas.
bpy.ops.object.join()
whole = bpy.context.view_layer.objects.active
whole.name = 'baked'
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
