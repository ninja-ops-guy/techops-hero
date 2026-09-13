import bpy,math
rig=bpy.data.objects['char.k.rig']
for frame in range(1,34,2):
 p=(frame-1)*math.pi*2/32
 for side,sg in [('L',1),('R',-1)]:
  swing=math.sin(p)*sg
  for name,angle in [('thigh.',.28*swing),('shin.',.30*max(0,-swing)),('foot.',-.08*swing),('upperarm.',-.20*swing),('forearm.',-.09-.08*max(0,swing))]:
   b=rig.pose.bones[name+side];b.rotation_mode='XYZ';b.rotation_euler=(angle,0,0);b.keyframe_insert('rotation_euler',frame=frame)
 rig.pose.bones['spine'].rotation_euler=(.008*math.sin(2*p),0,.016*math.sin(p));rig.pose.bones['spine'].keyframe_insert('rotation_euler',frame=frame)
rig.animation_data.action.name='char.k.walk.video'
scene=bpy.context.scene;scene.frame_end=33;scene.frame_set(1)
result={'animations':'33-frame in-place quadruped trot and K walk','frameRange':[scene.frame_start,scene.frame_end],'fps':scene.render.fps}
