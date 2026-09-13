import bpy
from mathutils import Vector
adjusted=[]
for name in ('dog.katrin.mesh','dog.manchez.mesh'):
 o=bpy.data.objects[name];spine=o.vertex_groups.get('spine');changed=0
 if not o.get('sweater_clearance_v2'):
  cloth=set()
  for p in o.data.polygons:
   m=o.data.materials[p.material_index].name.lower()
   if 'knit' in m or 'cloth' in m:
    cloth.update(p.vertices)
  center=Vector((0,.04,.385))
  for i in cloth:
   v=o.data.vertices[i]
   if spine and any(g.group==spine.index and g.weight>.8 for g in v.groups):
    delta=v.co-center
    v.co=center+Vector((delta.x*1.10,delta.y*1.14,delta.z*1.12));changed+=1
  o['sweater_clearance_v2']=True
 o.data.validate(clean_customdata=False);o.data.update();adjusted.append({'name':name,'garment_vertices_adjusted':changed})
bpy.data.objects['char.k.mesh'].data.validate(clean_customdata=False)
