"""One-shot exact-tree PR publication. Temporary delivery files remove themselves."""
from __future__ import annotations
import gzip
import base64
import hashlib
import json
import os
from pathlib import Path
import re
import shutil
import subprocess

BRANCH = 'feat/gameplay-feedback-workday-pass'
DELIVERY = '.gameplay-r4-delivery'
WORKFLOW = '.github/workflows/gameplay-continuation-publish.yml'
TRIGGER_PARENT = '8ad591228fa21e261721ad57a0f5e00583c9a513'

def git(repo: Path, *args: str, data: bytes | None = None) -> str:
    return subprocess.check_output(['git', *args], cwd=repo, input=data).decode().strip()

def blob(data: bytes) -> str:
    return hashlib.sha1(b'blob ' + str(len(data)).encode() + b'\0' + data).hexdigest()

def safe(repo: Path, name: str) -> Path:
    if not isinstance(name, str) or not re.fullmatch(r'[A-Za-z0-9_./-]+', name):
        raise ValueError('Invalid delivery path')
    p = Path(name)
    if p.is_absolute() or any(x in ('.git', '..') for x in p.parts):
        raise ValueError('Unsafe delivery path')
    target = repo / p
    if target.is_symlink() or not target.resolve().is_relative_to(repo.resolve()):
        raise ValueError('Path escapes checkout')
    return target

def assemble(repo: Path, manifest: dict, changes: list, parent: str) -> None:
    git(repo, 'read-tree', parent)
    entries = []
    for row in manifest['recipe']:
        safe(repo, row['path'])
        if row['mode'] not in ('0', '100644', '100755') or not re.fullmatch('[a-f0-9]{40}', row['sha']):
            raise ValueError('Invalid index recipe')
        entries.append(row['mode'] + ' ' + row['sha'] + '\t' + row['path'] + '\n')
    git(repo, 'update-index', '--index-info', data=''.join(entries).encode())
    if git(repo, 'write-tree') != manifest['basis_tree']:
        raise ValueError('Basis tree mismatch')
    git(repo, 'checkout-index', '--all', '--force')
    for row in manifest['recipe']:
        if row['mode'] == '0':
            safe(repo, row['path']).unlink(missing_ok=True)
    names = set()
    for row in changes:
        name = row['path']
        if name in names:
            raise ValueError('Duplicate delta path')
        names.add(name)
        target = safe(repo, name)
        if row.get('delete'):
            target.unlink()
            continue
        before = target.read_bytes() if target.exists() else None
        if (blob(before) if before is not None else None) != row['before']:
            raise ValueError('Source mismatch: ' + name)
        lines = (before or b'').decode('utf-8').splitlines(keepends=True)
        result = []
        for op in row['ops']:
            if isinstance(op, str):
                result.append(op)
            elif isinstance(op, list) and len(op) == 2 and all(type(x) is int for x in op) and 0 <= op[0] <= op[1] <= len(lines):
                result.extend(lines[op[0]:op[1]])
            else:
                raise ValueError('Invalid source-copy operation')
        data = ''.join(result).encode('utf-8')
        if len(data) > 2_000_000 or blob(data) != row['after'] or row['mode'] not in ('100644', '100755'):
            raise ValueError('Result mismatch: ' + name)
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(data)
        target.chmod(0o755 if row['mode'] == '100755' else 0o644)
    safe(repo, WORKFLOW).unlink(missing_ok=True)
    shutil.rmtree(safe(repo, DELIVERY), ignore_errors=True)
    git(repo, 'add', '--all')
    git(repo, 'diff', '--cached', '--check')
    if git(repo, 'write-tree') != manifest['expected_tree']:
        raise ValueError('Final source tree mismatch')

def main() -> None:
    repo = Path.cwd().resolve()
    manifest = json.loads((repo / DELIVERY / 'manifest.json').read_text())
    encoded = ''.join((repo / DELIVERY / name).read_text().strip() for name in ('part0', 'part1', 'part2', 'part30', 'part31'))
    raw = gzip.decompress(base64.b64decode(encoded, validate=True))
    if len(raw) > 2_000_000 or hashlib.sha256(raw).hexdigest() != manifest['delta_sha256']:
        raise ValueError('Delivery digest mismatch')
    changes = json.loads(raw)
    if len(changes) != manifest['delta_files'] or len(changes) > 100:
        raise ValueError('Unexpected delivery size')
    head = git(repo, 'rev-parse', 'HEAD')
    if os.environ.get('GITHUB_REPOSITORY') != 'ninja-ops-guy/techops-hero' or os.environ.get('GITHUB_REF') != 'refs/heads/' + BRANCH:
        raise ValueError('Wrong repository/branch')
    if manifest['branch'] != BRANCH or git(repo, 'rev-parse', 'HEAD^') != TRIGGER_PARENT or git(repo, 'rev-parse', 'HEAD~2') != manifest['parent']:
        raise ValueError('Branch advanced or wrong parent')
    if git(repo, 'rev-parse', manifest['parent'] + '^{tree}') != manifest['parent_tree'] or git(repo, 'status', '--porcelain'):
        raise ValueError('Parent or checkout mismatch')
    git(repo, 'fetch', '--no-tags', '--depth=1', 'origin', manifest['main'])
    assemble(repo, manifest, changes, manifest['parent'])
    evidence = Path('/tmp/gameplay-continuation-evidence')
    evidence.mkdir(exist_ok=True)
    with (evidence / 'production-gate.log').open('w') as log:
        result = subprocess.run(['node', 'scripts/production_release_gate.js'], cwd=repo, stdout=log, stderr=subprocess.STDOUT)
    print((evidence / 'production-gate.log').read_text())
    if result.returncode:
        raise RuntimeError('Release gate failed; no source commit pushed')
    git(repo, 'add', '--all')
    if git(repo, 'write-tree') != manifest['expected_tree']:
        raise ValueError('Tests changed the reviewed source')
    for ref, expected in ((BRANCH, head), ('main', manifest['main'])):
        actual = git(repo, 'ls-remote', 'origin', 'refs/heads/' + ref).split()[0]
        if actual != expected:
            raise RuntimeError('Remote advanced; refusing to overwrite ' + ref)
    message = b'Integrate reviewed lifecycle, case-map tracking and mobile UX fixes\n'
    commit = git(repo, '-c', 'user.name=github-actions[bot]', '-c', 'user.email=41898282+github-actions[bot]@users.noreply.github.com', 'commit-tree', manifest['expected_tree'], '-p', head, '-p', manifest['main'], data=message)
    git(repo, 'push', 'origin', commit + ':refs/heads/' + BRANCH)
    receipt = {'commit': commit, 'tree': manifest['expected_tree'], 'main': manifest['main'], 'gate': 'PASS', 'mergeToMain': False}
    (evidence / 'receipt.json').write_text(json.dumps(receipt, indent=2))
    print(json.dumps(receipt))

if __name__ == '__main__':
    main()
