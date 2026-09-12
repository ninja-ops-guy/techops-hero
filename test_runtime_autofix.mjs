import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { mediaFailureSources, repositoryMediaPath } from './scripts/runtime_autofix_evidence.mjs';

const error = {code:4, message:'DEMUXER_ERROR_NO_SUPPORTED_STREAMS: FFmpegDemuxer: no supported streams'};
const failing = {autoplay:{gesture:{mediaError:error},src:'http://127.0.0.1:4173/assets/takeover.mp4?v=2'}};
const report = {previous:{src:'assets/crash.mp4'}, findings:[failing], later:{src:'assets/unrelated.mp4'}};
assert.deepEqual(mediaFailureSources([JSON.stringify(report)]), [failing.autoplay.src]);
assert.deepEqual(mediaFailureSources(['[timestamp] FAIL ' + JSON.stringify(failing)]), [failing.autoplay.src]);
assert.deepEqual(mediaFailureSources(['assets/crash.mp4\n' + error.message]), []);
assert.deepEqual(mediaFailureSources([JSON.stringify({src:'assets/healthy.mp4',status:'PASS'})]), []);
assert.equal(repositoryMediaPath(failing.autoplay.src), 'assets/takeover.mp4');
for (const source of ['../private.mp4','assets/../private.mp4','assets/%2e%2e/private.mp4','https://x/elsewhere.mp4','assets/file.mp4/extra']) {
  assert.equal(repositoryMediaPath(source), null, source);
}

// Exercise the actual CLI: a compatible file must remain byte-identical on
// repeated matching failures. A neighboring file must never be transcoded.
const dir = fs.mkdtempSync(path.join(os.tmpdir(),'techops-autofix-'));
try {
  fs.mkdirSync(path.join(dir,'assets')); fs.mkdirSync(path.join(dir,'evidence')); fs.mkdirSync(path.join(dir,'bin'));
  fs.writeFileSync(path.join(dir,'assets/takeover.mp4'),'verified-original-media');
  fs.writeFileSync(path.join(dir,'assets/crash.mp4'),'unrelated-original-media');
  fs.writeFileSync(path.join(dir,'evidence/report.json'), JSON.stringify(report));
  fs.writeFileSync(path.join(dir,'bin/ffprobe'), '#!/bin/sh\nprintf \'%s\\n\' \'{"streams":[{"codec_name":"h264","pix_fmt":"yuv420p","width":678,"height":512}]}\'\n', {mode:0o755});
  fs.writeFileSync(path.join(dir,'bin/ffmpeg'), '#!/bin/sh\ntouch unexpected-transcode\nexit 1\n', {mode:0o755});
  const script = path.resolve('scripts/runtime_autofix.mjs');
  const run = () => {
    const result = spawnSync(process.execPath,[script],{cwd:dir,encoding:'utf8',env:{...process.env,PATH:path.join(dir,'bin')+path.delimiter+process.env.PATH,RUNTIME_ARTIFACT_DIR:'evidence',RUNTIME_AUTOFIX_RESULT:'result.json',RUNTIME_AUTOFIX_SUMMARY:'summary.md'}});
    assert.equal(result.status,0,result.stderr);
    return JSON.parse(fs.readFileSync(path.join(dir,'result.json')));
  };
  for(let i=0;i<2;i++){
    const result=run();assert.deepEqual(result.changed,[]);
    assert.equal(result.diagnostics[0].file,'assets/takeover.mp4');
    assert.equal(result.diagnostics[0].rule,'media-already-compatible');
  }
  assert.equal(fs.readFileSync(path.join(dir,'assets/takeover.mp4'),'utf8'),'verified-original-media');
  assert.equal(fs.readFileSync(path.join(dir,'assets/crash.mp4'),'utf8'),'unrelated-original-media');
  assert.equal(fs.existsSync(path.join(dir,'unexpected-transcode')),false);
  fs.writeFileSync(path.join(dir,'evidence/report.json'),'incomplete ' + error.message + '\nassets/crash.mp4');
  assert.deepEqual(run().changed,[]);
} finally { fs.rmSync(dir,{recursive:true,force:true}); }
console.log('Runtime autofix evidence attribution and repeat-run integrity: PASS');
