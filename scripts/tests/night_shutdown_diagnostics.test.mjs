import assert from 'node:assert/strict';
import {EventEmitter} from 'node:events';
import {test} from 'node:test';
import {ownedProcessSnapshot,createNightShutdownDiagnostics} from '../night_shutdown_diagnostics.mjs';
import {runNightShutdownRepro} from '../night_shutdown_repro.mjs';
import {boundedNightCleanup} from '../night_combat_qualification.mjs';

test('process snapshots retain only owned ancestry, no argv, with a bounded OS query',()=>{
 const result=ownedProcessSnapshot({pid:100,exec:(file,args,options)=>{
  assert.equal(file,'ps');assert.deepEqual(args,['-axo','pid=,ppid=,pgid=,stat=,comm=']);
  assert.equal(options.timeout,200);assert.equal(options.maxBuffer,1024*1024);
  return '103 102 101 S /Applications/Google Chrome Helper\n100 1 100 S /usr/bin/node\n101 100 101 S /Applications/Google Chrome\n102 101 101 S /Applications/Google Chrome Helper\n104 1 104 S /Applications/Unrelated Chrome\n105 100 100 R /bin/ps\n';
 }});
 assert.deepEqual(result.processes.map(row=>row.pid).sort(),[100,101,102,103]);
 assert.equal(result.processes[0].command,'Google Chrome Helper');
 assert.equal(result.truncated,false);
 assert.ok(result.processes.every(row=>!('args' in row)));
});

test('snapshot and event evidence survives cleanup and diagnostic failure remains fail-closed',()=>{
 const record={pass:true,error:'FIRST_GAMEPLAY'},browser=new EventEmitter();
 let contexts=1,connected=true,broken=false;
 browser.contexts=()=>Array(contexts);browser.isConnected=()=>connected;
 const d=createNightShutdownDiagnostics({record,launchOptions:{headless:true,channel:'chrome'},version:()=> '1.55.1',
  snapshot:()=>{if(broken)throw Error('password=SECRET');return {processes:[{pid:42}],truncated:false};},now:()=>123});
 d.attach(browser);d.observe('before.context.close',browser);
 contexts=0;d.observe('after.context.close',browser);
 connected=false;browser.emit('disconnected');d.observe('after.browser.close',browser);
 broken=true;d.observe('failed.snapshot',browser);d.settle();
 assert.equal(record.pass,false);assert.equal(record.error,'FIRST_GAMEPLAY');
 assert.deepEqual(record.shutdown.snapshots.slice(0,3).map(s=>[s.contexts,s.connected]),[[1,true],[0,true],[0,false]]);
 assert.deepEqual(record.shutdown.events,[{event:'disconnected',at:123}]);
 assert.ok(!JSON.stringify(record).includes('SECRET'));
 assert.deepEqual(record.shutdown.launch,{headless:true,channel:'chrome',executablePath:null});
});

test('a missing diagnostic alone fails qualification without throwing through cleanup',()=>{
 const record={pass:true};const d=createNightShutdownDiagnostics({record,launchOptions:{headless:true},version:()=> '1.55.1',snapshot:()=>{throw Error('ps unavailable');}});
 assert.doesNotThrow(()=>d.observe('before.context.close',{isConnected:()=>true,contexts:()=>[]}));
 d.settle();assert.equal(record.pass,false);assert.equal(record.error,'Night shutdown diagnostic capture failed');
});

function probe({hang,trace=false,firstFailure=false}={}){
 const calls=[],persisted=[];let contexts=[],connected=true;
 const browser=new EventEmitter();Object.assign(browser,{version:()=> 'SIMULATED',isConnected:()=>connected,contexts:()=>contexts,
  newContext:async()=>{contexts=[context];return context;},close:async()=>{calls.push('browser.close');if(hang==='browser.close')return new Promise(()=>{});connected=false;browser.emit('disconnected');}});
 const context={tracing:{start:async()=>calls.push('trace.start'),stop:async()=>calls.push('trace.stop')},
  newPage:async()=>({goto:async url=>{assert.equal(url,'about:blank');if(firstFailure)throw Error('FIRST_NAVIGATION');}}),
  close:async()=>{calls.push('context.close');if(hang==='context.close')return new Promise(()=>{});contexts=[];}};
 const run=()=>runNightShutdownRepro({engine:{launch:async()=>browser},out:'/unused',launchOptions:{headless:true,channel:'chrome'},trace,
  observe:options=>createNightShutdownDiagnostics({...options,version:()=> 'SIMULATED',snapshot:()=>({processes:[],truncated:false})}),
  cleanup:(run,operation)=>boundedNightCleanup(run,operation,10),persist:record=>{calls.push('persist');persisted.push(JSON.parse(JSON.stringify(record)));}});
 return {run,calls,persisted};
}

test('blank-page probe preserves trace/context/browser order and persists successful evidence',async()=>{
 const f=probe({trace:true}),record=await f.run();
 assert.equal(record.pass,true);assert.equal(record.cleanupTimedOut,false);
 assert.deepEqual(f.calls,['trace.start','trace.stop','context.close','browser.close','persist']);
 assert.deepEqual(record.shutdown.snapshots.map(s=>s.contexts),[1,0,0]);
 assert.equal(f.persisted.length,1);
});
for(const hang of ['context.close','browser.close'])test('blank-page '+hang+' timeout persists FAIL and preserves first failure',async()=>{
 const f=probe({hang,firstFailure:true}),record=await f.run();
 assert.equal(record.pass,false);assert.equal(record.cleanupTimedOut,true);assert.match(record.error,/FIRST_NAVIGATION/);
 assert.equal(record.cleanupErrors[0].operation,hang);assert.equal(f.persisted[0].pass,false);
 assert.deepEqual(f.calls,['context.close','browser.close','persist']);
});

test('later snapshots can retain reparented browser groups without including the caller group',()=>{
 const sample=ownedProcessSnapshot({pid:100,retainedPids:[101],retainedGroups:[101,100],exec:()=>
  '100 1 100 S /usr/bin/node\n101 1 101 S /Applications/Google Chrome\n102 1 101 S /Applications/Google Chrome Helper\n900 1 100 S /bin/bash\n'});
 assert.deepEqual(sample.processes.map(row=>row.pid),[100,101,102]);
 assert.equal(sample.processes[1].ownership,'previously observed pid');
 assert.equal(sample.processes[2].ownership,'previously observed group');
});

test('observer carries earlier browser pids and groups into the post-close snapshot',()=>{
 const record={pass:true};let count=0;
 const d=createNightShutdownDiagnostics({record,runtime:{pid:100},launchOptions:{headless:true},version:()=> '1.55.1',snapshot:options=>{
  if(count++) {assert.deepEqual(options.retainedPids,[101]);assert.deepEqual(options.retainedGroups,[101]);}
  return {processes:[{pid:100,pgid:100},{pid:101,pgid:101}],truncated:false};
 }});
 const browser={isConnected:()=>true,contexts:()=>[]};
 d.observe('before.context.close',browser);d.observe('after.browser.close',browser);d.settle();assert.equal(record.pass,true);
});

test('an empty or malformed OS process listing cannot become successful diagnostic evidence',()=>{
 for(const output of ['', 'unparseable process output'])assert.throws(()=>ownedProcessSnapshot({pid:100,exec:()=>output}),/did not identify the harness PID/);
});
