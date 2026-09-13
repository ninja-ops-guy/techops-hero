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
def cloth_body(name,mat):
    v=[];f=[];rings=38;sides=96
    for k in range(rings):
        t=k/(rings-1);y=.405-.67*t
        # Rounded haunches, fuller chest and a raised neck opening.
        width=.168+.030*sin(pi*t)+.010*sin(2*pi*t)
        rz=.156+.020*sin(pi*t);zc=.395+.024*t
        for j in range(sides):
            a=j*2*pi/sides
            folds=.0045*sin(9*a+13*t)+.002*sin(19*a-24*t)
            hem=.009*math.exp(-((t-.07)/.065)**2)
            x=(width+folds+hem)*cos(a);z=zc+(rz+folds)*sin(a)
            if sin(a)<0:z+=.018*(1-t)
            v.append((x,y,z))
    for k in range(rings-1):
        for j in range(sides):f.append((k*sides+j,k*sides+(j+1)%sides,(k+1)*sides+(j+1)%sides,(k+1)*sides+j))
    f.extend([tuple(reversed(range(sides))),tuple((rings-1)*sides+j for j in range(sides))])
    return mesh(name,v,f,mat)
def weights(o,mode):
    # Origin must be at the character origin before evaluating anatomical fields.
    select([o]);scene.cursor.location=(0,0,0);bpy.ops.object.origin_set(type='ORIGIN_CURSOR')
    groups={}
    def put(i,name,w):
        if w<.001:return
        if name not in groups:groups[name]=o.vertex_groups.new(name=name)
        groups[name].add([i],w,'REPLACE')
    for v in o.data.vertices:
        z=v.co.z
        if mode=='face':
            h=smooth((z-.55)/.085);put(v.index,'head',h);put(v.index,'neck',1-h)
        elif mode.startswith(('fore.','hind.')):
            shoulder=smooth((z-.355)/.085);paw=1-smooth((z-.052)/.054);upper=smooth((z-.19)/.09)
            put(v.index,'spine',shoulder)
            put(v.index,mode+'.upper',(1-shoulder)*upper)
            put(v.index,mode+'.paw',(1-shoulder)*(1-upper)*paw)
            put(v.index,mode+'.lower',(1-shoulder)*(1-upper)*(1-paw))
        else:put(v.index,mode,1)

def build_dog(id,camouflage):
    rig=bpy.data.objects[id+'.rig'];collection=rig.users_collection[0]
    old=bpy.data.objects[id+'.mesh'];bpy.data.objects.remove(old,do_unlink=True)
    rig.animation_data_clear()
    select([rig]);bpy.ops.object.mode_set(mode='EDIT')
    bones={'root':((0,0,0),(0,0,.15)),'spine':((0,.30,.40),(0,-.18,.48)),'neck':((0,-.18,.48),(0,-.27,.60)),'head':((0,-.27,.60),(0,-.29,.79)),'tail':((0,.37,.43),(0,.51,.60))}
    for side,x in [('L',-.135),('R',.135)]:
        for kind,y in [('fore',-.20),('hind',.31)]:
            key=kind+'.'+side;knee=(x,y+(-.03 if kind=='fore' else .035),.225);paw=(x,y-.035,.065)
            bones[key+'.upper']=((x,y,.43),knee);bones[key+'.lower']=(knee,paw);bones[key+'.paw']=(paw,(x,paw[1]-.09,.065))
    for name,(a,b) in bones.items():rig.data.edit_bones[name].head=a;rig.data.edit_bones[name].tail=b
    bpy.ops.object.mode_set(mode='OBJECT')
    parts=[];cloth=camo if camouflage else knit
    def add(o,mode):weights(o,mode);parts.append(o);return o
    torso=cloth_body(id+' / fitted sweater',cloth);add(torso,'spine')
    # The neck and cheeks are welded into a smooth undercoat surface.
    head=[]
    for label,c,r in [
      ('skull',(0,-.256,.687),(.171,.151,.166)),
      ('neck',(0,-.20,.523),(.143,.130,.124)),
      ('jaw',(0,-.362,.558),(.092,.069,.041)),
      ('bridge',(0,-.381,.652),(.075,.070,.059)),
      ('cheek.L',(-.064,-.383,.615),(.094,.086,.072)),
      ('cheek.R',(.064,-.383,.615),(.094,.086,.072)),
      ('ear.L',(-.172,-.220,.632),(.063,.095,.132)),
      ('ear.R',(.172,-.220,.632),(.063,.095,.132))]:sphere(label,c,r,fur,head)
    add(union(head,id+' / continuous face',.0065),'face')
    for side,x in [('L',-.135),('R',.135)]:
        for kind,y in [('fore',-.20),('hind',.31)]:
            key=kind+'.'+side;pieces=[]
            yy=y-.022 if kind=='fore' else y+.016
            sphere('leg upper',(x,y,.300),(.071,.078,.136),fur,pieces)
            sphere('leg lower',(x,yy,.169),(.058,.063,.116),fur,pieces)
            sphere('ankle',(x,y-.023,.093),(.063,.073,.082),fur,pieces)
            sphere('paw',(x,y-.054,.048),(.078,.099,.048),fur,pieces)
            leg=union(pieces,id+' / '+key+' continuous limb',.008)
            add(leg,key)
            if kind=='fore':
                pts=[(x,y,.424),(x,y-.005,.387),(x,y-.014,.338),(x,y-.018,.300)]
                add(tube(id+' / soft sleeve',pts,[.086,.090,.080,.075],cloth,48),key)
                add(tube(id+' / ribbed cuff',[(x+.075*cos(a*2*pi/48),y-.018+.075*sin(a*2*pi/48),.307) for a in range(48)],.0075,cloth,8,True),key)
    for x in (-.074,.074):
        add(sphere(id+' / eyelid',(x,-.402,.727),(.0255,.020,.023),nose,segments=48,rings=24),'head')
        add(sphere(id+' / cornea',(x,-.415,.729),(.0195,.012,.0175),eye,segments=48,rings=24),'head')
    add(sphere(id+' / open mouth',(0,-.438,.578),(.059,.029,.041),mouth),'head')
    lippts=[(.066*cos(a*pi/24),-.449-.014*sin(a*pi/24),.585-.039*sin(a*pi/24)) for a in range(25)]
    add(tube(id+' / lower lip',lippts,.0033,nose,10),'head')
    add(sphere(id+' / soft tongue',(0,-.466,.552),(.025,.012,.032),tongue),'head')
    add(tube(id+' / tongue groove',[(0,-.478,.532),(0,-.479,.55),(0,-.477,.568)],.0008,mouth,6),'head')
    for x in (-.043,.043):add(sphere(id+' / small canine',(x,-.461,.594),(.006,.006,.010),tooth,segments=20,rings=12),'head')
    add(sphere(id+' / nose',(0,-.477,.638),(.034,.027,.025),nose),'head')
    for x in (-.014,.014):add(sphere(id+' / nostril',(x,-.502,.638),(.0065,.0035,.005),mouth,segments=20,rings=12),'head')
    if camouflage:
        h=[]
        sphere('ushanka crown',(0,-.252,.817),(.191,.168,.071),hatfur,h)
        for x in (-.179,.179):sphere('ushanka flap',(x,-.229,.710),(.052,.098,.145),hatfur,h)
        add(union(h,id+' / soft ushanka',.009),'head')
        add(sphere(id+' / blue hat badge',(0,-.417,.821),(.031,.006,.029),badge,segments=40,rings=24),'head')
        for k in range(10):
            a=k*2*pi/10
            add(tube(id+' / badge petal',[(.022*cos(a),-.424,.821+.022*sin(a)),(.008*cos(a+.25),-.426,.821+.008*sin(a+.25))],.0016,gold,6),'head')
    else:
        # Dense loft gives soft folds without the former hard rib rods.
        v=[];f=[];rs=38;ns=112
        for k in range(rs):
            t=k/(rs-1);z=.766+.139*t;radius=(1-t*t)**.55
            rx=.188*radius;ry=.161*radius;cx=.035*t*t;cy=-.246+.024*t
            for j in range(ns):
                a=j*2*pi/ns;ripple=.0017*sin(a*56)+.003*sin(a*7+t*9)
                v.append((cx+(rx+ripple)*cos(a),cy+(ry+ripple)*sin(a),z+.005*sin(3*a)*sin(pi*t)))
        for k in range(rs-1):
            for j in range(ns):f.append((k*ns+j,k*ns+(j+1)%ns,(k+1)*ns+(j+1)%ns,(k+1)*ns+j))
        add(mesh(id+' / slouched wool beanie',v,f,knit),'head')
        brim=[(.188*cos(a*2*pi/96),-.246+.162*sin(a*2*pi/96),.778+.003*sin(a*6*pi/96)) for a in range(96)]
        add(tube(id+' / folded wool brim',brim,.018,knit,16,True),'head')
    # Continuous curved tail with a fuller plume silhouette.
    tpts=[(0,.367,.43),(.028,.435,.46),(.062,.490,.52),(.09,.503,.596),(.084,.466,.651),(.054,.409,.667)]
    add(tube(id+' / curled tail',tpts,[.042,.047,.048,.044,.036,.017],fur,40),'tail')
    for i in range(34):
        a=i*2*pi/34;c=Vector((.180*cos(a),-.183+.151*sin(a),.527+.044*sin(a)))
        t=Vector((-.180*sin(a),.151*cos(a),.044*cos(a))).normalized()
        b=Vector((0,0,1));b=(b-t*b.dot(t)).normalized()
        if i%2:b=(b*.58+Vector((cos(a),sin(a),0))*.81).normalized()
        pts=[tuple(c+t*.023*cos(j*2*pi/20)+b*.014*sin(j*2*pi/20)) for j in range(20)]
        add(tube(id+' / Cuban link',pts,.0042,gold,8,True),'neck')
    skin=join(parts,id+'.mesh')
    for c in list(skin.users_collection):c.objects.unlink(skin)
    collection.objects.link(skin);skin.parent=rig
    mod=skin.modifiers.new('Blended quadruped deformation','ARMATURE');mod.object=rig
    skin['video_match']=True;skin['fur_groom']='runtime strand cards';skin['reference_height_m']=.91
    rig['video_match']=True;rig['status']='authored continuous anatomy / blended quadruped weights'
    # Alternating diagonal contacts. Locomotion speed is set by the host, not baked translation.
    for frame in range(1,34,2):
        phase=(frame-1)*2*pi/32
        for side in ('L','R'):
            for kind in ('fore','hind'):
                sign=1 if (side=='L')==(kind=='fore') else -1
                s=sin(phase)*sign
                for suffix,angle in [('upper',.32*s),('lower',.39*max(0,-s)),('paw',-.12*s)]:
                    b=rig.pose.bones[kind+'.'+side+'.'+suffix];b.rotation_mode='XYZ';b.rotation_euler=(angle,0,0);b.keyframe_insert('rotation_euler',frame=frame)
        for name,rot in [('spine',(.016*sin(phase*2),0,0)),('neck',(-.018*sin(phase*2),0,.018*sin(phase))),('head',(.014*sin(phase*2),0,0)),('tail',(0,.13*sin(phase),.10*cos(phase)))]:
            b=rig.pose.bones[name];b.rotation_mode='XYZ';b.rotation_euler=rot;b.keyframe_insert('rotation_euler',frame=frame)
    rig.animation_data.action.name=id+'.trot_in_place.video'
    return {'asset':id,'vertices':len(skin.data.vertices),'faces':len(skin.data.polygons),'bones':len(rig.data.bones),'height':.91}

rebuilt=[build_dog('dog.katrin',False),build_dog('dog.manchez',True)]
scene.frame_set(1)
camera=bpy.data.objects['CAM.Dogs / material and identity check']
camera.location=(1.3,-4.15,1.10)
camera.rotation_euler=(Vector((0,-1.16,.46))-camera.location).to_track_quat('-Z','Y').to_euler()
camera.data.lens=55;scene.camera=camera
scene.render.engine='BLENDER_EEVEE';scene.render.resolution_x=960;scene.render.resolution_y=640;scene.render.resolution_percentage=100
scene.render.image_settings.media_type='IMAGE';scene.render.image_settings.file_format='PNG'
target=artifacts.file(name='video-match-anatomy.png',media_type='image/png')
scene.render.filepath=target.path;bpy.ops.render.render(write_still=True);target.publish()
result={'rebuilt':rebuilt,'scope':'authored meshes; reference textures and fine fur applied in the game renderer','reference':'2026-09-13 supplied cinematic videos and Cell 118 stills'}
