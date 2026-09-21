import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import {buildManifest,collectLocalRefs,collectQuotedScripts,collectReleaseRuntimePaths} from './scripts/release_asset_manifest.mjs';

assert.deepEqual(
  collectLocalRefs('<script src="./game.js?v=1"></script><link href="style.css#x"><img src="https://example.test/x.png"><iframe src="about:blank">'),
  ['game.js','style.css']
);
assert.deepEqual(
  collectQuotedScripts('load("alpha.js?v=1"); const x="parts/beta.js"; const y="https://example.test/no.js";'),
  ['alpha.js','parts/beta.js']
);

const runtime=collectReleaseRuntimePaths('.');
for(const required of [
  'index.html',
  'game.js',
  'style.css',
  'production_asset_registry.js',
  'assets/cutscenes/good_dogs/campaign_clip_manifest_v2_2_pixel.json',
  'assets/cutscenes/good_dogs/01_signal_beyond_earth_pixel.mp4',
  'assets/cutscenes/good_dogs/09_prison_crash_selected_pixel.mp4'
]) assert.ok(runtime.includes(required),`release runtime manifest discovery lost ${required}`);
assert.equal(new Set(runtime).size,runtime.length,'runtime paths must be unique');
assert.ok(runtime.every(p=>!p.includes('?')&&!p.includes('#')&&!/^https?:/.test(p)),'runtime paths must be normalized local references');

const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'techops-release-manifest-'));
try{
  fs.mkdirSync(path.join(tmp,'assets'),{recursive:true});
  fs.writeFileSync(path.join(tmp,'index.html'),'hello');
  fs.writeFileSync(path.join(tmp,'assets/a.bin'),Buffer.from([1,2,3]));
  const source={head:'a'.repeat(40),tree:'b'.repeat(40),fingerprint:'c'.repeat(64),dirty:false};
  const manifest=buildManifest(['assets/a.bin','index.html','index.html'],{root:tmp,source});
  assert.equal(manifest.total_files,2);
  assert.equal(manifest.total_bytes,8);
  assert.deepEqual(manifest.files.map(f=>f.path),['assets/a.bin','index.html']);
  assert.equal(manifest.files.find(f=>f.path==='index.html').sha256,crypto.createHash('sha256').update('hello').digest('hex'));
  assert.throws(()=>buildManifest(['../escape'],{root:tmp,source}),/unsafe manifest path|escapes root/);
  assert.throws(()=>buildManifest(['missing.js'],{root:tmp,source}),/missing file/);
}finally{
  fs.rmSync(tmp,{recursive:true,force:true});
}
console.log('R1 deterministic runtime asset manifest: PASS');
