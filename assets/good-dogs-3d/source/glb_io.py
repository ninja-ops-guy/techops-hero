"""Split this pack's uncompressed GLB into portable, self-contained assets.
Preserve skin inverse binds and original mesh data. No external dependencies.
"""
from pathlib import Path
import copy, json, struct, hashlib

ROOT=Path(__file__).resolve().parents[1]
PATH=ROOT/'models'/'techops-hero-coop-scene.glb'

def read_glb(path):
    b=path.read_bytes();magic,version,total=struct.unpack_from('<III',b)
    assert magic==0x46546c67 and version==2 and total==len(b)
    n,t=struct.unpack_from('<II',b,12);assert t==0x4e4f534a
    d=json.loads(b[20:20+n]);offset=20+n
    size,kind=struct.unpack_from('<II',b,offset);assert kind==0x004e4942
    return d,bytearray(b[offset+8:offset+8+size])

def write_glb(path,d,b):
    while len(b)%4:b+=b'\0'
    d['buffers']=[{'byteLength':len(b)}]
    j=json.dumps(d,separators=(',',':')).encode()
    j+=b' '*((-len(j))%4)
    result=struct.pack('<III',0x46546c67,2,12+8+len(j)+8+len(b))+struct.pack('<II',len(j),0x4e4f534a)+j+struct.pack('<II',len(b),0x004e4942)+b
    path.write_bytes(result)

def clip_actions(d,blob):
    dims={'SCALAR':1,'VEC2':2,'VEC3':3,'VEC4':4,'MAT4':16}
    def array(index):
        a=d['accessors'][index];v=d['bufferViews'][a['bufferView']]
        assert a['componentType']==5126
        n=dims[a['type']];start=v.get('byteOffset',0)+a.get('byteOffset',0);stride=v.get('byteStride',n*4)
        return [struct.unpack_from('<'+'f'*n,blob,start+i*stride) for i in range(a['count'])]
    def append(original,values):
        a=copy.deepcopy(d['accessors'][original]);a.pop('byteOffset',None)
        n=dims[a['type']];start=len(blob)
        for row in values:blob.extend(struct.pack('<'+'f'*n,*row))
        a['count']=len(values)
        if 'min' in a:a['min']=[min(row[i] for row in values) for i in range(n)]
        if 'max' in a:a['max']=[max(row[i] for row in values) for i in range(n)]
        a['bufferView']=len(d['bufferViews']);d['bufferViews'].append({'buffer':0,'byteOffset':start,'byteLength':len(blob)-start})
        index=len(d['accessors']);d['accessors'].append(a);return index
    for anim in d.get('animations',[]):
        name=anim.get('name','');limit=32/24 if name.startswith('dog.') else 48/24 if name.startswith('char.') else None
        if limit is None:continue
        cache={}
        for sampler in anim['samplers']:
            times=array(sampler['input']);values=array(sampler['output'])
            assert len(times)==len(values) and sampler.get('interpolation','LINEAR')!='CUBICSPLINE'
            selected=[i for i,row in enumerate(times) if row[0]<=limit+1e-6]
            for field,rows in [('input',times),('output',values)]:
                key=(sampler[field],limit)
                if key not in cache:cache[key]=append(sampler[field],[rows[i] for i in selected])
                sampler[field]=cache[key]
        anim['name']=name.replace('.rig','.trot_in_place.prototype' if name.startswith('dog.') else '.idle.prototype')

def subset(source,blob,roots,local=False):
    d=copy.deepcopy(source);keep=set()
    def visit(i):
        if i in keep:return
        keep.add(i)
        for j in d['nodes'][i].get('children',[]):visit(j)
    for r in roots:visit(r)
    # Skeleton joints and skeleton root must accompany every retained skin.
    for n in list(keep):
        if 'skin' in d['nodes'][n]:
            skin=d['skins'][d['nodes'][n]['skin']]
            for j in skin['joints']:visit(j)
            if 'skeleton' in skin:visit(skin['skeleton'])
    nm={old:new for new,old in enumerate(sorted(keep))}
    meshids=sorted({d['nodes'][i]['mesh'] for i in keep if 'mesh' in d['nodes'][i]})
    mm={old:new for new,old in enumerate(meshids)}
    skinids=sorted({d['nodes'][i]['skin'] for i in keep if 'skin' in d['nodes'][i]});sm={old:new for new,old in enumerate(skinids)}
    nodes=[d['nodes'][i] for i in sorted(keep)]
    for n in nodes:
        if 'children' in n:n['children']=[nm[i] for i in n['children'] if i in nm]
        if 'mesh' in n:n['mesh']=mm[n['mesh']]
        if 'skin' in n:n['skin']=sm[n['skin']]
    if local:
        for r in roots:
            n=nodes[nm[r]];n['translation']=[0,0,0]
            if 'matrix' in n:n['matrix'][12:15]=[0,0,0]
    meshes=[d['meshes'][i] for i in meshids];skins=[d['skins'][i] for i in skinids]
    for s in skins:
        s['joints']=[nm[i] for i in s['joints']]
        if 'skeleton' in s:s['skeleton']=nm[s['skeleton']]
    animations=[]
    for a in d.get('animations',[]):
        ch=[c for c in a['channels'] if c['target'].get('node') in nm]
        if not ch:continue
        samplers=sorted({c['sampler'] for c in ch});sammap={o:n for n,o in enumerate(samplers)}
        for c in ch:c['target']['node']=nm[c['target']['node']];c['sampler']=sammap[c['sampler']]
        a['channels']=ch;a['samplers']=[a['samplers'][i] for i in samplers];animations.append(a)
    access=set()
    for m in meshes:
        for p in m['primitives']:
            access.update(p['attributes'].values())
            if 'indices' in p:access.add(p['indices'])
            for t in p.get('targets',[]):access.update(t.values())
    for s in skins:
        if 'inverseBindMatrices' in s:access.add(s['inverseBindMatrices'])
    for a in animations:
        for s in a['samplers']:access.update([s['input'],s['output']])
    am={o:n for n,o in enumerate(sorted(access))}
    for m in meshes:
        for p in m['primitives']:
            p['attributes']={k:am[v] for k,v in p['attributes'].items()}
            if 'indices' in p:p['indices']=am[p['indices']]
            for t in p.get('targets',[]):
                for k,v in t.items():t[k]=am[v]
    for s in skins:
        if 'inverseBindMatrices' in s:s['inverseBindMatrices']=am[s['inverseBindMatrices']]
    for a in animations:
        for s in a['samplers']:s['input']=am[s['input']];s['output']=am[s['output']]
    accessors=[d['accessors'][i] for i in sorted(access)]
    bv=set()
    for a in accessors:
        if 'bufferView' in a:bv.add(a['bufferView'])
        assert 'sparse' not in a,'Sparse accessors require a separate path'
    for im in d.get('images',[]):
        if 'bufferView' in im:bv.add(im['bufferView'])
    vm={o:n for n,o in enumerate(sorted(bv))};out=bytearray();views=[]
    for i in sorted(bv):
        v=copy.deepcopy(d['bufferViews'][i]);offset=v.get('byteOffset',0);data=blob[offset:offset+v['byteLength']]
        while len(out)%4:out+=b'\0'
        v['byteOffset']=len(out);v['buffer']=0;out.extend(data);views.append(v)
    for a in accessors:
        if 'bufferView' in a:a['bufferView']=vm[a['bufferView']]
    for im in d.get('images',[]):
        if 'bufferView' in im:im['bufferView']=vm[im['bufferView']]
    d.update(nodes=nodes,meshes=meshes,accessors=accessors,bufferViews=views,scenes=[{'name':'TechOps Hero asset','nodes':[nm[i] for i in roots]}],scene=0)
    if skins:d['skins']=skins
    else:d.pop('skins',None)
    if animations:d['animations']=animations
    else:d.pop('animations',None)
    return d,out

if __name__=='__main__':
    d,b=read_glb(PATH)
    # Remain rerunnable without shortening already-normalized clips again.
    if any(a.get('name','').endswith('.rig') for a in d.get('animations',[])):clip_actions(d,b)
    d,b=subset(d,b,d['scenes'][d.get('scene',0)]['nodes'])
    write_glb(PATH,d,b)
    entries=[]
    for asset in ('dog.katrin','dog.manchez','char.k','char.waldo'):
        root=next(i for i,n in enumerate(d['nodes']) if n.get('name')==asset+'.rig')
        part,pb=subset(d,b,[root],local=True);out=ROOT/'models'/(asset+'.glb');write_glb(out,part,pb)
        triangles=sum(part['accessors'][p['indices']]['count']//3 for m in part['meshes'] for p in m['primitives'] if 'indices' in p)
        entries.append({'asset_id':asset,'file':str(out.relative_to(ROOT)),'triangles':triangles,'bones':len(part['skins'][0]['joints']),'bytes':out.stat().st_size,'sha256':hashlib.sha256(out.read_bytes()).hexdigest(),'status':'stylized prototype'})
    roots=[i for i in d['scenes'][0]['nodes'] if not d['nodes'][i].get('name','').startswith(('dog.','char.','CAM.'))]
    env,eb=subset(d,b,roots);write_glb(ROOT/'models'/'orbital-prison-kit.glb',env,eb)
    (ROOT/'asset-manifest.json').write_text(json.dumps({'version':'0.1.0-prototype','date':'2026-09-12','coordinate_system':'glTF Y-up metres, character forward +Z','characters':entries,'scene':'models/techops-hero-coop-scene.glb','environment':'models/orbital-prison-kit.glb','photoreal_reconstruction_completed':False,'game_integration_completed':False},indent=2)+'\n')
    print(json.dumps(entries,indent=2))
