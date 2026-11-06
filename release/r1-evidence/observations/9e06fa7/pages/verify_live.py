"""Compare response entity bytes with an unmodified release_asset_manifest.mjs receipt."""
import concurrent.futures
import datetime
import hashlib
import json
from pathlib import Path
import subprocess
import sys
import tempfile
from urllib.parse import quote

manifest_path, output_path = map(Path, sys.argv[1:3])
base_url = sys.argv[3].rstrip('/') + '/'
manifest = json.loads(manifest_path.read_bytes())
def utc():
    return datetime.datetime.now(datetime.timezone.utc).isoformat()
def read_path(entry):
    url = base_url + quote(entry['path'], safe='/')
    result = {'path': entry['path'], 'at_utc': utc()}
    with tempfile.TemporaryFile() as body:
        with tempfile.NamedTemporaryFile() as meta:
            command = ['curl', '--silent', '--show-error', '--compressed', '--max-time', '45',
                       '--output', '-', '--write-out', '%output{' + meta.name + '}%{http_code}', url]
            proc = subprocess.run(command, stdout=body, stderr=subprocess.PIPE)
            meta.seek(0)
            status = meta.read().decode()
            body.seek(0)
            contents = body.read()
    result.update(status=status, curl_exit=proc.returncode, bytes=len(contents),
                  sha256=hashlib.sha256(contents).hexdigest())
    result['match'] = (proc.returncode == 0 and status == '200' and
                       result['bytes'] == entry['size'] and result['sha256'] == entry['sha256'])
    if proc.stderr: result['error'] = proc.stderr.decode(errors='replace').strip()
    return result

started = utc()
results = []
with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:
    futures = [pool.submit(read_path, entry) for entry in manifest['files']]
    for future in concurrent.futures.as_completed(futures):
        result = future.result()
        results.append(result)
        if len(results) % 50 == 0 or not result['match']:
            print(len(results), result['path'], result['status'], result['match'], flush=True)
results.sort(key=lambda row:row['path'])
out = {'base_url':base_url, 'started_utc':started, 'finished_utc':utc(),
       'method':'HTTPS GET, decoded entity bytes, no redirects, eight workers, one request per manifest path',
       'manifest_sha256':hashlib.sha256(manifest_path.read_bytes()).hexdigest(),
       'source':manifest['source'],'paths':len(results),
       'matches':sum(r['match'] for r in results),'observations':results}
output_path.write_text(json.dumps(out,indent=2)+'\n')
print('Matched',out['matches'],'of',out['paths'],flush=True)
sys.exit(0 if out['matches']==out['paths'] else 1)
