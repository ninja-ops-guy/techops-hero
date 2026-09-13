"""Package authored scene revision into skinned high/mobile GLBs.

Usage: python package_video_models.py scene.glb output-directory
Requires numpy, scipy and fast-simplification 0.2.0. Reduction runs separately
per material; skin weights and normals are interpolated from nearby source
vertices. Small identity details keep their source topology.
"""
from pathlib import Path
import sys, copy, json, hashlib
import numpy as np
from scipy.spatial import cKDTree
from fast_simplification import simplify
from glb_io import read_glb,write_glb,subset
DT={5121:np.uint8,5123:np.uint16,5125:np.uint32,5126:np.float32}
DIMS={'SCALAR':1,'VEC2':2,'VEC3':3,'VEC4':4,'MAT4':16}
def read(d,b,i):
    a=d['accessors'][i];v=d['bufferViews'][a['bufferView']];dt=np.dtype(DT[a['componentType']]);n=DIMS[a['type']]
    out=np.ndarray((a['count'],n),dtype=dt,buffer=b,offset=v.get('byteOffset',0)+a.get('byteOffset',0),strides=(v.get('byteStride',n*dt.itemsize),dt.itemsize)).copy()
    if a.get('normalized'):out=out.astype(np.float32)/np.iinfo(dt).max
    return out

def put(d,b,array,kind,component):
    a=np.asarray(array,dtype=DT[component]);raw=a.tobytes();b.extend(b'\0'*((-len(b))%4));offset=len(b);b.extend(raw)
    view=len(d['bufferViews']);d['bufferViews'].append({'buffer':0,'byteOffset':offset,'byteLength':len(raw)})
    idx=len(d['accessors']);entry={'bufferView':view,'componentType':component,'count':len(a),'type':kind}
    if kind=='VEC3':entry.update(min=a.min(axis=0).tolist(),max=a.max(axis=0).tolist())
    d['accessors'].append(entry);return idx

def reduce(d,b,reduction):
    for mesh in d['meshes']:
      for p in mesh['primitives']:
        attrs=p['attributes'];pos=read(d,b,attrs['POSITION']);faces=read(d,b,p['indices']).reshape(-1,3)
        if len(faces)<1200:continue
        pp,ff=simplify(pos.astype(np.float64),faces.astype(np.int32),target_reduction=reduction,agg=5,preserve_border=True)
        dist,nn=cKDTree(pos).query(pp,k=4);blend=1/np.maximum(1e-7,dist)**2;blend/=blend.sum(axis=1,keepdims=True)
        normal=read(d,b,attrs['NORMAL']);normal=(normal[nn]*blend[:,:,None]).sum(axis=1);normal/=np.maximum(1e-8,np.linalg.norm(normal,axis=1))[:,None]
        joints=read(d,b,attrs['JOINTS_0']).astype(int);weights=read(d,b,attrs['WEIGHTS_0']);allweights=np.zeros((len(pp),17),np.float32)
        rows=np.arange(len(pp))
        for neighbor in range(4):
          for slot in range(4):np.add.at(allweights,(rows,joints[nn[:,neighbor],slot]),weights[nn[:,neighbor],slot]*blend[:,neighbor])
        jj=np.argsort(allweights,axis=1)[:,-4:];ww=np.take_along_axis(allweights,jj,axis=1);ww/=np.maximum(1e-8,ww.sum(axis=1))[:,None]
        p['attributes']={'POSITION':put(d,b,pp,'VEC3',5126),'NORMAL':put(d,b,normal,'VEC3',5126),'JOINTS_0':put(d,b,jj,'VEC4',5123),'WEIGHTS_0':put(d,b,ww,'VEC4',5126)}
        p['indices']=put(d,b,ff.reshape(-1,1),'SCALAR',5125)
    return subset(d,b,d['scenes'][0]['nodes'])

source=Path(sys.argv[1]);out=Path(sys.argv[2]);out.mkdir(parents=True,exist_ok=True)
d,b=read_glb(source);entries=[]
for id in ['dog.katrin','dog.manchez','char.k']:
 root=next(i for i,n in enumerate(d['nodes']) if n.get('name')==id+'.rig')
 for tier,reduction in [('high',.40),('balanced/performance',.84)]:
  part,blob=subset(d,b,[root],local=True)
  part,blob=reduce(part,blob,reduction)
  name=id+('' if tier=='high' else '.lite')+'.glb';path=out/name;write_glb(path,part,blob)
  triangles=sum(part['accessors'][p['indices']]['count']//3 for m in part['meshes'] for p in m['primitives'])
  entry={'file':'models/'+name,'tier':tier,'triangles':triangles,'sha256':hashlib.sha256(path.read_bytes()).hexdigest(),'bytes':path.stat().st_size,'bones':len(part['skins'][0]['joints'])};entries.append(entry);print(entry,flush=True)
manifest=out.parent/'asset-manifest.json';m=json.loads(manifest.read_text());m.update(version='0.4.0-video-reference',source_pack='Editable scene revision 10 / authored from supplied film references',models=entries,geometry='Continuous voxel-welded anatomy; lofted garments; 17-bone blended skins; material-preserving quality tiers',materials='Reference steel and ivory fur maps, triplanar PBR, skinned fur cards, amber practicals, HDR bloom and depth occlusion');m['photoreal_reconstruction_completed']=False
for name in ['prison-steel.jpg','ivory-fur.jpg']:
 p=out.parent/'textures'/name;m.setdefault('textures',[]).append({'file':'textures/'+name,'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()})
manifest.write_text(json.dumps(m,indent=2)+'\n')
