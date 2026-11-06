import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {runNightDiagnostics,filterCrashMetadata} from './scripts/night_lifecycle_diagnostics.mjs';

test('retains native termination evidence and failure exit without retaining credentials',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'night-diagnostics-'));
 try{
  const script=join(dir,'fixture.cjs');
  await writeFile(script,`process.stderr.write('pw:browser [pid=123] <process did exit: exitCode=null, signal=SIGSEGV>\\nAuthorization: Bear');
setTimeout(()=>{process.stderr.write('er secret-value\\nhttps://user:password@example.test/path?token=private-value&v=49\\n"password": "private-json"\\n');process.exit(23);},10);`);
  const result=await runNightDiagnostics({out:dir,script,forwardStdout:false});
  assert.equal(result.code,23);
  assert.equal(result.signal,null);
  const log=await readFile(join(dir,'browser-process.log'),'utf8');
  assert.match(log,/signal=SIGSEGV/);
  assert.doesNotMatch(log,/secret-value|user:password|private-value|private-json/);
  const report=JSON.parse(await readFile(join(dir,'process-diagnostics.json'),'utf8'));
  assert.equal(report.exit.code,23);
  assert.equal(report.exit.signal,null);
 }finally{await rm(dir,{recursive:true,force:true});}
});

test('bounds stderr retention while preserving the final crash signature',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'night-log-bound-'));
 try{
  const script=join(dir,'fixture.cjs');
  await writeFile(script,`process.stderr.end(('x'.repeat(600)+'\\n').repeat(5000)+'oversized-secret'.repeat(5000)+'\\nlast native crash: SIGABRT\\n',()=>process.exit(19));`);
  const result=await runNightDiagnostics({out:dir,script,forwardStdout:false});
  const log=await readFile(join(dir,'browser-process.log'),'utf8');
  assert.equal(result.code,19);assert.ok(Buffer.byteLength(log)<=2*1024*1024);
  assert.match(log,/last native crash: SIGABRT/);assert.match(log,/oversized diagnostic line omitted/);
  assert.doesNotMatch(log,/oversized-secret/);
  assert.ok(JSON.parse(await readFile(join(dir,'process-diagnostics.json'),'utf8')).droppedLogLines>0);
 }finally{await rm(dir,{recursive:true,force:true});}
});

test('persists sanitized evidence while acceptance is still running',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'night-live-evidence-')),release=join(dir,'release');let running;
 try{
  const script=join(dir,'fixture.cjs');
  await writeFile(script,`process.stderr.write('native marker before crash\\npassword=must-redact\\n');setInterval(()=>{if(require('node:fs').existsSync(${JSON.stringify(release)}))process.exit(23);},20);`);
  running=runNightDiagnostics({out:dir,script,forwardStdout:false});
  let log='',deadline=Date.now()+3000;
  while(Date.now()<deadline){log=await readFile(join(dir,'browser-process.log'),'utf8').catch(()=>'');if(log.includes('native marker'))break;await new Promise(r=>setTimeout(r,25));}
  assert.match(log,/native marker before crash/);assert.doesNotMatch(log,/must-redact/);
  const report=JSON.parse(await readFile(join(dir,'process-diagnostics.json'),'utf8'));
  assert.equal(report.exit,null,'a partial receipt cannot claim a completed pass');
 }finally{await writeFile(release,'release');if(running)await running;await rm(dir,{recursive:true,force:true});}
});

test('a termination request stays an interruption even if the child cleans up with exit zero',{skip:process.platform!=='linux'},async()=>{
 const dir=await mkdtemp(join(tmpdir(),'night-interrupt-'));
 try{
  const script=join(dir,'fixture.cjs');
  await writeFile(script,`process.on('SIGTERM',()=>process.exit(0));setInterval(()=>{},1000);process.kill(process.ppid,'SIGTERM');`);
  const result=await runNightDiagnostics({out:dir,script,forwardStdout:false});
  assert.equal(result.code,0);assert.equal(result.interruptedBy,'SIGTERM');
 }finally{await rm(dir,{recursive:true,force:true});}
});

test('crash metadata retains the signal and native stack without host identity or command secrets',()=>{
 const retained=filterCrashMetadata(`PID: 123 (WebKitWebProcess)
Signal: 11 (SEGV)
Executable: /opt/webkit/WebKitWebProcess
Command Line: WebKitWebProcess --password=private-command
Hostname: unrelated-host
Environment: TOKEN=private-environment
Stack trace of thread 123:
  #0 0x123 WebCore::FrameLoader::commitProvisionalLoad (libwebkit.so + 0x456)`);
 assert.match(retained,/Signal: 11 \(SEGV\)/);
 assert.match(retained,/WebCore::FrameLoader/);
 assert.doesNotMatch(retained,/private-command|private-environment|unrelated-host|Command Line|Environment/);
});

test('samples only the launched browser descendants and records available OOM evidence',{skip:process.platform!=='linux'},async()=>{
 const dir=await mkdtemp(join(tmpdir(),'night-process-evidence-'));
 try{
  const script=join(dir,'fixture.cjs');
  await writeFile(script,`const {spawn}=require('node:child_process');
const child=spawn(process.execPath,['-e','setTimeout(()=>{},600)','--','--secret-canary'],{stdio:'ignore',env:{...process.env,SECRET_CANARY:'must-not-be-collected'}});
process.stderr.write('pw:browser <launched> pid=1\\npw:browser <launched> pid='+child.pid+'\\n');
child.on('close',()=>process.exit(0));`);
  const result=await runNightDiagnostics({out:dir,script,forwardStdout:false});
  assert.equal(result.code,0);
  const text=await readFile(join(dir,'process-diagnostics.json'),'utf8'),report=JSON.parse(text);
  assert.ok(report.resources.samples.some(sample=>sample.processes.some(p=>p.rssKiB>0)),'capture live browser-descendant RSS');
  assert.ok(report.resources.samples.every(sample=>sample.processes.every(p=>p.pid!==1)),'ignore unrelated PID even when stderr names it');
  assert.ok(report.resources.samples.some(sample=>sample.cgroup.events||sample.cgroup.unavailable),'OOM evidence has an explicit availability result');
  assert.doesNotMatch(text,/secret-canary|must-not-be-collected/);
 }finally{await rm(dir,{recursive:true,force:true});}
});
