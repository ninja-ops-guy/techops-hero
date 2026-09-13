#!/usr/bin/env python3
"""Audited import of approved conversation assets into Git data objects only."""
from PIL import Image
from collections import deque
from pathlib import Path
import json,hashlib
import argparse, urllib.request, base64, os, tempfile
SOURCE_URL='https://d2ol7oe51mr4n9.cloudfront.net/user_35RBEXAM1O9RfdpYhaXNJJroZk3/a7b99506-b8b4-4047-8260-ac08ab63c84f.png'
MASTER_URL='https://d2ol7oe51mr4n9.cloudfront.net/user_35RBEXAM1O9RfdpYhaXNJJroZk3/d53b08a4-16d1-40bd-99e1-8e418976d71a.mp3'
SOURCE_SHA='3ac96d73843b76eca8ff980ceb800087db219f6fa4e3bbf2ba59aede0709ee03'
MASTER_SHA='5ecbb19508f48bd8c4934e109ea83e43d82ca7130efa877200b80fcfcecbe6ac'
p=argparse.ArgumentParser(description='Rebuild only the user-approved EAST SIDE media. No generation, no branch mutation.')
p.add_argument('--source',type=Path);p.add_argument('--master',type=Path);p.add_argument('--out',type=Path,default=Path('.'))
p.add_argument('--upload-blobs',action='store_true');p.add_argument('--receipt',type=Path,default=Path('eastside-blob-receipt.json'))
a=p.parse_args();r=a.out.resolve();tmp=tempfile.TemporaryDirectory();base=Path(tmp.name)
def get(path,url,sha,dest):
    data=path.read_bytes() if path else urllib.request.urlopen(url,timeout=45).read(5*1024*1024)
    if hashlib.sha256(data).hexdigest()!=sha:raise RuntimeError('Source checksum mismatch: '+dest.name)
    dest.write_bytes(data);return dest
source_path=get(a.source,SOURCE_URL,SOURCE_SHA,base/'a_wide_pixel_art_spritesheet_concept_sheet_in_th.png')
master=get(a.master,MASTER_URL,MASTER_SHA,base/'east-side.mp3')
source=Image.open(source_path).convert('RGBA')
if source.size!=(1536,1024):raise RuntimeError('Wrong approved sheet dimensions')
(r/'assets/eastside').mkdir(parents=True,exist_ok=True);(r/'assets/audio/eastside').mkdir(parents=True,exist_ok=True);(r/'docs').mkdir(parents=True,exist_ok=True)
for name,rect in {'environment':(0,292,1536,612),'porch_sequence':(550,748,1365,880),'props_fx':(0,612,1536,878)}.items():
    source.crop(rect).convert('RGB').quantize(colors=128,method=Image.Quantize.MEDIANCUT).save(r/('assets/eastside/east_side_'+name+'.png'),optimize=True)
(r/'assets/audio/eastside/east-side.mp3').write_bytes(master.read_bytes())
frames={
'idle':(306,38,64,96),'walk1':(377,40,61,94),'walk2':(447,39,61,95),'walk3':(519,40,63,94),'sit':(585,49,59,84),
'interact':(383,170,76,91),'headphones_off':(308,166,78,95),'knock':(738,170,63,91),
'waldo':(832,54,47,134),'waldo_aside':(1057,64,50,124),
'dog1':(1145,48,83,78),'dog2':(1283,51,86,75),'dog3':(1412,49,87,77)
}
canvas=Image.new('RGBA',(128*7,160*2))
records={}
for i,(name,(x,y,w,h)) in enumerate(frames.items()):
    crop=source.crop((x,y,x+w,y+h));px=crop.load();q=deque();seen=set()
    # Remove only connected blue board background, never interior pixels.
    def bg(X,Y):
        R,G,B,A=px[X,Y];
        if name.startswith('waldo'):return R<17 and G<28 and B<46 and B>=G+5 and G>=R+2
        return 7<=R<27 and 14<=G<40 and 29<=B<67 and B>=G+14 and G>=R+3
    for X in range(w):
        for Y in (0,h-1):
            if bg(X,Y):q.append((X,Y));seen.add((X,Y))
    for Y in range(h):
        for X in (0,w-1):
            if bg(X,Y):q.append((X,Y));seen.add((X,Y))
    while q:
        X,Y=q.popleft();px[X,Y]=(0,0,0,0)
        for xx,yy in ((X-1,Y),(X+1,Y),(X,Y-1),(X,Y+1)):
            if 0<=xx<w and 0<=yy<h and (xx,yy) not in seen and bg(xx,yy):seen.add((xx,yy));q.append((xx,yy))
    if name=='dog1':
        for yy in range(25):
            for xx in range(12):px[xx,yy]=(0,0,0,0)
    cx=(i%7)*128+(128-w)//2;cy=(i//7)*160+148-h
    canvas.alpha_composite(crop,(cx,cy));records[name]={'sourceRect':[x,y,w,h],'rect':[cx,cy,w,h],'pivot':'bottom-center'}
out=r/'assets/eastside/east_side_actors.png';canvas.save(out,optimize=True)
manifest={'schemaVersion':1,'source':{'file':'a_wide_pixel_art_spritesheet_concept_sheet_in_th.png','sha256':hashlib.sha256((base/'a_wide_pixel_art_spritesheet_concept_sheet_in_th.png').read_bytes()).hexdigest(),'approval':'User: This will work. Integrate.','interpretation':'Three dog sprites are used as unnamed neighborhood dogs, not Katrin or Manchez. Pose crops are source stills, not a certified complete walk cycle.'},'actors':records,'files':{str(p.relative_to(r)):{'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()}for p in sorted((r/'assets/eastside').glob('*.png'))}}
manifest['audio']={'assets/audio/eastside/east-side.mp3':{'bytes':976104,'sha256':MASTER_SHA,'provenance':'User-supplied EAST SIDE master; no transcoding.'}}
(r/'docs/eastside_source_manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
paths=sorted(list(manifest['files'])+list(manifest['audio'])+['docs/eastside_source_manifest.json'])
receipt={'schemaVersion':1,'head':os.environ.get('GITHUB_SHA'),'sourceSha256':SOURCE_SHA,'files':[]}
for path in paths:
    data=(r/path).read_bytes();entry={'path':path,'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest(),'blob':hashlib.sha1(('blob '+str(len(data))+'\0').encode()+data).hexdigest()}
    if a.upload_blobs:
        repo=os.environ.get('GITHUB_REPOSITORY');token=os.environ.get('GITHUB_TOKEN')
        if repo!='ninja-ops-guy/techops-hero' or not token:raise RuntimeError('Expected authorized repository and token')
        request=urllib.request.Request('https://api.github.com/repos/'+repo+'/git/blobs',data=json.dumps({'content':base64.b64encode(data).decode(),'encoding':'base64'}).encode(),headers={'Authorization':'Bearer '+token,'Accept':'application/vnd.github+json','Content-Type':'application/json'},method='POST')
        with urllib.request.urlopen(request,timeout=60) as response:result=json.load(response)
        if result.get('sha')!=entry['blob']:raise RuntimeError('Git blob mismatch: '+path)
    receipt['files'].append(entry)
a.receipt.write_text(json.dumps(receipt,indent=2)+'\n');print(json.dumps(receipt))
tmp.cleanup()
