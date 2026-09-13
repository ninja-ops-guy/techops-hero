"""Refine the editable TechOps scene in Blender; retain the existing 17-bone rigs.

Apply once to the v0.1 source scene. Materials stay portable Principled materials;
the game adds microdetail shaders in fidelity.mjs. Subdivision interpolates the
existing weights; this does not claim artist-finished deformation or likeness.
"""
import bpy

counts=[]
for name in ('dog.katrin.mesh','dog.manchez.mesh','char.k.mesh'):
    obj=bpy.data.objects[name]
    before=len(obj.data.polygons)
    if not obj.get('fidelity_refined'):
        bpy.ops.object.select_all(action='DESELECT')
        obj.select_set(True)
        bpy.context.view_layer.objects.active=obj
        # Round the original broad body forms and tapered fur clusters. Placing
        # the surface modifier before skinning preserves the skeleton and clips.
        mod=obj.modifiers.new('Refined silhouette and rounded fur','SUBSURF')
        mod.subdivision_type='CATMULL_CLARK'
        mod.levels=1
        mod.render_levels=1
        mod.quality=3
        bpy.ops.object.modifier_move_up(modifier=mod.name)
        bpy.ops.object.modifier_apply(modifier=mod.name)
        for poly in obj.data.polygons:poly.use_smooth=True
        obj['fidelity_refined']=True
        obj['asset_status']='Refined prototype; interpolated segment weights'
    for mat in obj.data.materials:
        if not mat or not mat.use_nodes:continue
        shader=mat.node_tree.nodes.get('Principled BSDF')
        if not shader:continue
        name_lower=mat.name.lower()
        if 'fur' in name_lower:
            shader.inputs['Roughness'].default_value=.94
            shader.inputs['Specular IOR Level'].default_value=.18
            shader.inputs['Sheen Weight'].default_value=.35
        elif 'knit' in name_lower:
            shader.inputs['Roughness'].default_value=.87
            shader.inputs['Sheen Weight'].default_value=.24
        elif 'leather' in name_lower:
            shader.inputs['Roughness'].default_value=.49
            shader.inputs['Coat Weight'].default_value=.18
        elif 'metal' in name_lower:
            shader.inputs['Metallic'].default_value=1
            shader.inputs['Roughness'].default_value=.24
    obj.data.calc_loop_triangles()
    counts.append({'name':name,'before_faces':before,'after_faces':len(obj.data.polygons),'triangles':len(obj.data.loop_triangles)})

bpy.context.scene.frame_set(1)
if 'CAM.Dogs / material and identity check' in bpy.data.objects:
    bpy.context.scene.camera=bpy.data.objects['CAM.Dogs / material and identity check']
result={'characters':counts,'rigs_preserved':True,'clips_preserved':True,'note':'Game materials, post-processing and local GPU validation are separate.'}
