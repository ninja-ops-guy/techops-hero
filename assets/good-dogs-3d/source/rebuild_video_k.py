"""Rebuild the two dressed quadrupeds from the supplied film references.

Blender 5.2 authoring script for the existing TechOps Hero scene. Geometry is
authored, not a claimed reconstruction. Continuous undercoat, lofted clothing,
and blended joint weights replace the old disconnected primitive segments.
The runtime supplies the reference texture maps and fine fur cards.
"""
import bpy, math
from mathutils import Vector
from math import sin, cos, pi

scene=bpy.context.scene
scene.frame_set(1)
M={m.name:m for m in bpy.data.materials}
def material(name,color,rough=.85,metal=0):
    m=bpy.data.materials.get(name) or bpy.data.materials.new(name)
    m.use_nodes=True;m.diffuse_color=(*color,1)
    p=m.node_tree.nodes.get('Principled BSDF')
    p.inputs['Base Color'].default_value=(*color,1)
    p.inputs['Metallic'].default_value=metal;p.inputs['Roughness'].default_value=rough
    return m
fur=material('Video / ivory undercoat',(.79,.78,.73),.96)
knit=material('Video / charcoal knit',(.018,.020,.023),.92)
camo=material('Video / camouflage textile',(.16,.17,.12),.94)
hatfur=material('Video / olive shearling',(.040,.047,.035),.99)
gold=material('Video / gold links',(.69,.42,.115),.30,.96)
eye=material('Video / brown cornea',(.016,.009,.004),.10)
nose=material('Video / nose leather',(.012,.014,.015),.35)
mouth=material('Video / mouth',(.027,.008,.010),.82)
tongue=material('Video / tongue',(.38,.102,.13),.58)
tooth=material('Video / teeth',(.69,.65,.53),.48)
badge=material('Video / blue enamel badge',(.032,.073,.15),.36,.4)

def smooth(t):
    t=max(0,min(1,t));return t*t*(3-2*t)
def select(items):
    bpy.ops.object.select_all(action='DESELECT')
    for o in items:o.select_set(True)
    bpy.context.view_layer.objects.active=items[0]
def sphere(name,center,radii,mat,parts=None,segments=48,rings=32):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=segments,ring_count=rings,location=center)
    o=bpy.context.object;o.name=name;o.scale=radii
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    o.data.materials.append(mat)
    for p in o.data.polygons:p.use_smooth=True
    if parts is not None:parts.append(o)
    return o
def mesh(name,verts,faces,mat):
    data=bpy.data.meshes.new(name);data.from_pydata(verts,[],faces);data.update()
    o=bpy.data.objects.new(name,data);scene.collection.objects.link(o);data.materials.append(mat)
    for p in data.polygons:p.use_smooth=True
    return o
def join(items,name):
    select(items);bpy.ops.object.join();o=bpy.context.object;o.name=name
    scene.cursor.location=(0,0,0);bpy.ops.object.origin_set(type='ORIGIN_CURSOR')
    return o
def union(items,name,voxel=.007):
    o=join(items,name)
    m=o.modifiers.new('Continuous anatomy','REMESH');m.mode='VOXEL';m.voxel_size=voxel;m.use_smooth_shade=True
    bpy.ops.object.modifier_apply(modifier=m.name)
    m=o.modifiers.new('Soft anatomical transitions','SMOOTH');m.factor=.55;m.iterations=5
    bpy.ops.object.modifier_apply(modifier=m.name)
    m=o.modifiers.new('Silhouette subdivision','SUBSURF');m.levels=1
    bpy.ops.object.modifier_apply(modifier=m.name)
    return o
def tube(name,points,radii,mat,sides=32,closed=False):
    pts=[Vector(p) for p in points];v=[];f=[]
    for i,p in enumerate(pts):
        d=(pts[(i+1)%len(pts)]-pts[i-1]).normalized() if closed else (pts[min(i+1,len(pts)-1)]-pts[max(i-1,0)]).normalized()
        ref=Vector((0,0,1)) if abs(d.z)<.9 else Vector((1,0,0))
        a=d.cross(ref).normalized();b=d.cross(a).normalized();r=radii[i] if isinstance(radii,list) else radii
        rx,ry=(r,r) if isinstance(r,(float,int)) else r
        for j in range(sides):
            t=j*2*pi/sides;v.append(tuple(p+a*cos(t)*rx+b*sin(t)*ry))
    for i in range(len(pts) if closed else len(pts)-1):
        for j in range(sides):f.append((i*sides+j,i*sides+(j+1)%sides,((i+1)%len(pts))*sides+(j+1)%sides,((i+1)%len(pts))*sides+j))
    if not closed:f.extend([tuple(reversed(range(sides))),tuple((len(pts)-1)*sides+j for j in range(sides))])
    return mesh(name,v,f,mat)

import bmesh
rig=bpy.data.objects['char.k.rig'];old=bpy.data.objects['char.k.mesh']
rig.animation_data_clear()
for bone in rig.pose.bones:bone.rotation_mode='XYZ';bone.rotation_euler=(0,0,0)
old.parent=None
bm=bmesh.new();bm.from_mesh(old.data)
remove=[]
for face in bm.faces:
    name=old.data.materials[face.material_index].name.lower()
    z=sum(v.co.z for v in face.verts)/len(face.verts)
    if (('leather' in name and .20<z<1.50) or ('cloth' in name and z<1.3)):remove.append(face)
bmesh.ops.delete(bm,geom=remove,context='FACES');bm.to_mesh(old.data);bm.free()
leather=material('Video / tactical jacket leather',(.021,.024,.027),.55)
canvas=material('Video / K camouflage textile',(.17,.17,.12),.90)
parts=[old]
def bind(o,fn):
    select([o]);scene.cursor.location=(0,0,0);bpy.ops.object.origin_set(type='ORIGIN_CURSOR')
    groups={}
    for v in o.data.vertices:
        for name,w in fn(v.co).items():
            if w<.001:continue
            if name not in groups:groups[name]=o.vertex_groups.new(name=name)
            groups[name].add([v.index],w,'REPLACE')
    parts.append(o);return o
def fixed(name):return lambda v:{name:1}
def loft(name,profile,mat,fn,sides=72):
    verts=[];faces=[]
    for i,(x,y,z,rx,ry) in enumerate(profile):
        for j in range(sides):
            a=2*pi*j/sides
            fold=.0025*sin(a*11+i*.7)+.003*sin(a*5-i*.8)
            verts.append((x+(rx+fold)*cos(a),y+(ry+fold)*sin(a),z+.003*sin(a*4+i*.55)))
    for i in range(len(profile)-1):
        for j in range(sides):faces.append((i*sides+j,i*sides+(j+1)%sides,(i+1)*sides+(j+1)%sides,(i+1)*sides+j))
    faces.extend([tuple(reversed(range(sides))),tuple((len(profile)-1)*sides+j for j in range(sides))])
    return bind(mesh(name,verts,faces,mat),fn)
profile=[]
for i in range(45):
    t=i/44;z=.89+.58*t
    rx=.205+.04*sin(pi*t)+.024*math.exp(-((t-.78)/.19)**2)
    ry=.118+.020*sin(pi*t)
    if t>.83:rx*=1-.53*smooth((t-.83)/.17)
    profile.append((0,.008,z,rx,ry))
loft('K / fitted field jacket',profile,leather,lambda v:{'spine':smooth((v.z-.97)/.17),'pelvis':1-smooth((v.z-.97)/.17)})
for side,sg in [('L',-1),('R',1)]:
    def armweight(v,side=side):
        upper=smooth((v.z-1.06)/.15);hand=1-smooth((v.z-.85)/.08)
        return {'upperarm.'+side:upper,'forearm.'+side:(1-upper)*(1-hand),'hand.'+side:(1-upper)*hand}
    profile=[]
    for i in range(41):
        t=i/40;z=.89+.51*t;x=sg*(.365-.147*t)
        radius=.066+.025*t+.016*sin(pi*t)
        profile.append((x,-.055+.065*t,z,radius,radius*.95))
    loft('K / continuous jacket sleeve '+side,profile,leather,armweight)
    def legweight(v,side=side):
        hip=smooth((v.z-.87)/.13);thigh=smooth((v.z-.43)/.20)
        return {'pelvis':hip,'thigh.'+side:(1-hip)*thigh,'shin.'+side:(1-hip)*(1-thigh)}
    profile=[]
    for i in range(55):
        t=i/54;z=.15+.82*t;x=sg*(.13-.028*t)
        r=.078+.027*t+.014*sin(pi*t)
        wrinkle=.005*sin(t*66)*math.exp(-((t-.44)/.27)**2)
        profile.append((x,.006-.012*sin(pi*t),z,r+wrinkle,r*.97+wrinkle))
    loft('K / continuous combat trousers '+side,profile,canvas,legweight)
    bind(sphere('K / cargo pocket',(sg*.19,-.007,.72),(.036,.089,.105),canvas,segments=40,rings=24),fixed('thigh.'+side))
    bind(sphere('K / chest pocket',(sg*.128,-.126,1.275),(.080,.016,.065),leather,segments=40,rings=24),fixed('spine'))
    bind(tube('K / chest pocket flap',[(sg*.06,-.14,1.306),(sg*.20,-.14,1.306)],.006,knit,8),fixed('spine'))
# Front closure and raised collar use actual geometry, weighted to the torso.
bind(tube('K / jacket zip',[(.008,-.126,.92),(.008,-.148,1.12),(.008,-.137,1.31),(.008,-.094,1.43)],.0032,gold,8),fixed('spine'))
for side in [-1,1]:
    bind(tube('K / standing jacket collar',[(side*.12,-.069,1.47),(side*.07,-.118,1.40),(side*.04,-.143,1.34)],.026,leather,20),fixed('spine'))
# Join in local character space; the existing stage transform stays on the rig.
for mod in list(old.modifiers):old.modifiers.remove(mod)
skin=join(parts,'char.k.mesh');skin.parent=rig
mod=skin.modifiers.new('Blended clothing deformation','ARMATURE');mod.object=rig
skin['video_match']=True;rig['video_match']=True
scene.frame_set(1)
camera=bpy.data.objects['CAM.Dogs / material and identity check']
camera.location=(.8,-4.3,1.25);camera.rotation_euler=(Vector((-.3,-.7,.88))-camera.location).to_track_quat('-Z','Y').to_euler();camera.data.lens=48;scene.camera=camera
scene.render.engine='BLENDER_EEVEE';scene.render.resolution_x=960;scene.render.resolution_y=640;scene.render.resolution_percentage=100
scene.render.image_settings.media_type='IMAGE';scene.render.image_settings.file_format='PNG'
target=artifacts.file(name='video-match-crew.png',media_type='image/png');scene.render.filepath=target.path;bpy.ops.render.render(write_still=True);target.publish()
result={'asset':'char.k','vertices':len(skin.data.vertices),'faces':len(skin.data.polygons),'bones':len(rig.data.bones),'changes':'continuous jacket and trousers; blended knee, elbow and shoulder weights'}
