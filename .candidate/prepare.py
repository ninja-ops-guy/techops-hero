"""Apply an authored, hash-bound source recipe and create an UNATTACHED commit.
No branch, PR, main, release, deployment, or repository settings are changed here.
Temporary preparation inputs are removed from the candidate tree.
"""
import base64,hashlib,json,lzma,os,pathlib,subprocess,urllib.request
P=pathlib.Path
repo=os.environ['GITHUB_REPOSITORY']
assert repo=='ninja-ops-guy/techops-hero'
raw=lzma.decompress(base64.b64decode(''.join(p.read_text().strip() for p in sorted(P('.candidate').glob('part-*.txt')))))
assert hashlib.sha256(raw).hexdigest()=='99ed35b8de156077d9cf656d7e37761eefb2abbda412f462a7b499060b316620','Recipe integrity mismatch'
data=json.loads(raw)
assert set(data['changes'])==set(data['files'])
for name,proof in data['files'].items():
    p=P(name)
    assert not p.is_absolute() and '..' not in p.parts and not name.startswith(('.git','.candidate'))
    current=hashlib.sha256(p.read_bytes()).hexdigest() if p.exists() else None
    assert current==proof['before'],f'Base mismatch: {name}'
for name,change in data['changes'].items():
    p=P(name);p.parent.mkdir(parents=True,exist_ok=True)
    if 'content' in change:text=change['content']
    else:
        lines=p.read_text().splitlines(keepends=True)
        for start,end,replacement in reversed(change['edits']):lines[start:end]=[replacement]
        text=''.join(lines)
    p.write_text(text)
if data['assemble']:subprocess.run(['node','scripts/assemble-linked-runtime.js'],check=True)
for name,proof in data['files'].items():assert hashlib.sha256(P(name).read_bytes()).hexdigest()==proof['after'],f'Output mismatch: {name}'
subprocess.run(['node','scripts/assemble-linked-runtime.js','--check'],check=True)
for name in data['files']:
    if name.endswith(('.js','.mjs')):subprocess.run(['node','--check',name],check=True)
def api(path,body):
    request=urllib.request.Request('https://api.github.com/repos/'+repo+'/'+path,data=json.dumps(body).encode(),headers={'Authorization':'Bearer '+os.environ['GH_TOKEN'],'Accept':'application/vnd.github+json','Content-Type':'application/json','X-GitHub-Api-Version':'2022-11-28'},method='POST')
    with urllib.request.urlopen(request) as response:return json.load(response)
head=subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip()
tree=subprocess.check_output(['git','rev-parse','HEAD^{tree}'],text=True).strip()
entries=[]
for name in sorted(data['files']):
    blob=api('git/blobs',{'encoding':'base64','content':base64.b64encode(P(name).read_bytes()).decode()})
    entries.append({'path':name,'mode':'100644','type':'blob','sha':blob['sha']})
for name in subprocess.check_output(['git','ls-files','.candidate','.github/workflows/linked-candidate-prepare.yml'],text=True).splitlines():entries.append({'path':name,'mode':'100644','type':'blob','sha':None})
t=api('git/trees',{'base_tree':tree,'tree':entries})
c=api('git/commits',{'message':'Implement canon-gated See World bridge and seven native Night Walker sections','tree':t['sha'],'parents':[head]})
P('candidate-evidence').mkdir(exist_ok=True)
P('candidate-evidence/candidate.json').write_text(json.dumps({'status':'UNATTACHED_CANDIDATE_NOT_RELEASE_QUALIFIED','repository':repo,'parent':head,'commit':c['sha'],'tree':t['sha'],'recipe_sha256':hashlib.sha256(raw).hexdigest(),'files':data['files'],'verification':['all before and after SHA-256 values matched','generated bundle check passed','changed JavaScript syntax checks passed'],'branch_mutated':False},indent=2))
print('Unattached candidate:',c['sha'])
