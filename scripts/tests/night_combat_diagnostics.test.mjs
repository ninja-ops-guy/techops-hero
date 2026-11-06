import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {test} from 'node:test';
import {createNightDiagnostics} from '../night_combat_diagnostics.mjs';

// Execute the production orchestration against stdlib mocks. Only the encounter
// body is substituted; these tests do not launch browsers or certify gameplay.
const source=fs.readFileSync(new URL('../night_combat_bot.mjs',import.meta.url),'utf8');
const first=source.indexOf("  await click(page.locator('#btn-nightcrawler'));"),last=source.indexOf('  record.pass=true;',first);
assert.ok(first>0&&last>first);
const runnable=(source.slice(0,first)+'  await encounter(name);\n'+source.slice(last)).replace(/^import .*;\r?\n/gm,'');
const profiles=['chromium','chromium-touch','webkit'];
function fixture({selected=profiles,hooks={},captureErrors=[],ioFailure,consoleFailure}={}){
 const calls=[],phaseLog=[],reports=[],warnings=[],files=new Map([['night-combat-phases.jsonl','STALE\n']]);
 const process={env:{BOT_OUT_DIR:'/fixture',NIGHT_COMBAT_BROWSERS:selected.join(',')},exitCode:undefined};
 let launched=0,clock=0;
 const step=async(profile,operation,value)=>{calls.push(profile+':'+operation);if(hooks[profile+':'+operation])await hooks[profile+':'+operation]();return value;};
 const io={mkdirSync(){},writeFileSync(file,data,options){ioFailure?.('write',path.basename(file),data);if(path.basename(file)==='night-combat-phases.jsonl')assert.equal(options.flush,true);files.set(path.basename(file),data);},appendFileSync(file,data,options){assert.equal(options.flush,true);ioFailure?.('append',path.basename(file),data);files.set(path.basename(file),(files.get(path.basename(file))||'')+data);}};
 const log={log(line){const value=JSON.parse(line);consoleFailure?.(value);if(value.kind==='night-combat-phase')phaseLog.push(value);else reports.push(value);},error(line){warnings.push(line);}};
 const browserType={launch:async options=>{
  const name=selected[launched++];assert.equal(options.headless,true);assert.equal(Object.keys(options).length,1);
  const page={on(){},setDefaultTimeout(value){assert.equal(value,15000);},setDefaultNavigationTimeout(value){assert.equal(value,60000);},goto:(url,options)=>{assert.equal(url,'http://127.0.0.1:4173/');assert.equal(options.waitUntil,'domcontentloaded');return step(name,'navigation');},evaluate:fn=>step(name,fn===roomBootstrapSnapshot?'bootstrap.snapshot':'failure.snapshot',{fixture:true}),waitForFunction:()=>step(name,'bootstrap.ready'),screenshot:options=>{assert.equal(options.timeout,5000);return step(name,'failure.screenshot');}};
  const context={name,route:()=>step(name,'context.route'),newPage:()=>step(name,'page.create',page),close:()=>step(name,'context.close')};
  const browser={version:()=> 'SIMULATED',newContext:options=>{assert.equal(name==='chromium',!!options.viewport);return step(name,'context.create',context);},close:()=>step(name,'browser.close')};
  return step(name,'browser.launch',browser);
 }};
 function roomBootstrapSnapshot(){}
 const bindings={fs:io,path,process,console:log,chromium:browserType,webkit:{...browserType},devices:{'iPhone 13':{isMobile:true}},roomBootstrapSnapshot,
  createNightDiagnostics:options=>createNightDiagnostics({...options,io,log,now:()=>clock+=.5,fail:()=>{process.exitCode=1;}}),
  beginRuntimeEvidence:(context)=>step(context.name,'capture.begin',{finish:()=>step(context.name,'capture.finish',{trace:'SIMULATED-trace.zip',runtime:'SIMULATED-runtime.json',captureErrors})}),
  encounter:name=>step(name,'gameplay')};
 const context=vm.createContext(bindings);
 return {calls,phaseLog,reports,warnings,files,process,run:()=>vm.runInContext('(async()=>{'+runnable+';return results;})()',context),events:()=>files.get('night-combat-phases.jsonl').trim().split('\n').filter(Boolean).map(JSON.parse)};
}
const pairs=events=>events.map(e=>[e.profile,e.operation,e.state]);
const turn=()=>new Promise(resolve=>setImmediate(resolve));

test('all profile startup, capture and close boundaries retain production order',async()=>{
 const f=fixture();const results=await f.run();assert.equal(results.length,3);assert.ok(results.every(r=>r.pass));assert.equal(f.process.exitCode,undefined);
 assert.deepEqual(f.events(),f.phaseLog);assert.ok(!f.files.get('night-combat-phases.jsonl').includes('STALE'));
 assert.deepEqual(f.events().map(e=>e.sequence),f.events().map((_,i)=>i+1));assert.ok(f.events().every((e,i,a)=>i===0||e.elapsedMs>=a[i-1].elapsedMs));
 for(const profile of profiles){
  const operations=['browser.launch','context.create','context.route','page.create','capture.begin','navigation','bootstrap.snapshot','bootstrap.ready','gameplay','capture.finish','context.close','browser.close'];
  assert.deepEqual(pairs(f.events().filter(e=>e.profile===profile)),[[profile,'profile','begin'],...operations.flatMap(op=>[[profile,op,'begin'],[profile,op,'end']]),[profile,'report','begin'],[profile,'report','ready'],[profile,'profile','ready']]);
 }
 assert.ok(f.calls.indexOf('chromium:browser.close')<f.calls.indexOf('chromium-touch:browser.launch'));
 assert.ok(f.calls.indexOf('chromium-touch:browser.close')<f.calls.indexOf('webkit:browser.launch'));
});

for(const operation of ['capture.finish','context.close','browser.close'])test(operation+' unresolved promise leaves only begin and does not start next profile',async()=>{
 let release;const gate=new Promise(resolve=>release=resolve);const f=fixture({hooks:{['chromium:'+operation]:()=>gate}});
 const pending=f.run();await turn();assert.deepEqual(pairs(f.events()).at(-1),['chromium',operation,'begin']);assert.ok(!f.calls.includes('chromium-touch:browser.launch'));
 release();await pending;assert.ok(pairs(f.events()).some(e=>e.join('/')==='chromium/'+operation+'/end'));
});
for(const operation of ['browser.launch','context.create','page.create','capture.begin','navigation','bootstrap.ready'])test('next-profile '+operation+' stall is independently visible',async()=>{
 let release;const gate=new Promise(resolve=>release=resolve);const f=fixture({hooks:{['chromium-touch:'+operation]:()=>gate}});
 const pending=f.run();await turn();assert.deepEqual(pairs(f.events()).at(-1),['chromium-touch',operation,'begin']);assert.ok(f.events().some(e=>e.profile==='chromium'&&e.operation==='profile'&&e.state==='ready'));assert.ok(!f.calls.includes('webkit:browser.launch'));
 release();await pending;
});

test('gameplay first failure survives capture and both cleanup rejections; browser close still attempted',async()=>{
 const firstError=Error('FIRST_GAMEPLAY'),capture=Error('CAPTURE_SECOND'),context=Error('CONTEXT_THIRD'),browser=Error('BROWSER_FOURTH');
 const hooks={'chromium:gameplay':()=>{throw firstError;},'chromium:capture.finish':()=>{throw capture;},'chromium:context.close':()=>{throw context;},'chromium:browser.close':()=>{throw browser;}};
 const f=fixture({hooks});await assert.rejects(f.run(),e=>e===firstError);
 assert.ok(f.calls.includes('chromium:browser.close'));assert.ok(!f.calls.includes('chromium-touch:browser.launch'));
 const record=f.reports[0];assert.equal(record.pass,false);assert.match(record.error,/FIRST_GAMEPLAY/);assert.match(record.artifacts.captureErrors[0],/CAPTURE_SECOND/);assert.equal(record.cleanupErrors.length,2);
 for(const op of ['capture.finish','context.close','browser.close'])assert.ok(f.events().some(e=>e.operation===op&&e.state==='error'));
 assert.ok(!JSON.stringify(f.events()).includes('FIRST_GAMEPLAY'),'phase sink excludes exception payloads');
});
test('capture rejection stays first when later context close also rejects',async()=>{
 const first=Error('capture first'),later=Error('context later');const f=fixture({hooks:{'chromium:capture.finish':()=>{throw first;},'chromium:context.close':()=>{throw later;}}});
 await assert.rejects(f.run(),e=>e===first);assert.match(f.reports[0].artifacts.captureErrors[0],/capture first/);assert.equal(f.reports[0].error,'Night combat evidence capture failed');assert.ok(f.calls.includes('chromium:browser.close'));
});
for(const operation of ['failure.snapshot','failure.screenshot'])test(operation+' secondary rejection cannot mask gameplay or prevent cleanup',async()=>{
 const original=Error('original gameplay');const f=fixture({selected:['chromium'],hooks:{'chromium:gameplay':()=>{throw original;},['chromium:'+operation]:()=>{throw Error('secondary observation');}}});
 const [record]=await f.run();assert.equal(record.pass,false);assert.match(record.error,/original gameplay/);assert.equal(f.process.exitCode,1);
 assert.ok(f.events().some(e=>e.operation===operation&&e.state==='error'));assert.ok(f.calls.includes('chromium:capture.finish'));assert.ok(f.calls.includes('chromium:context.close'));assert.ok(f.calls.includes('chromium:browser.close'));
});
for(const operation of ['context.close','browser.close'])test(operation+' rejection marks error, persists failed record and stops later profiles',async()=>{
 const error=Error(operation+' failed');const f=fixture({hooks:{['chromium:'+operation]:()=>{throw error;}}});await assert.rejects(f.run(),e=>e===error);
 assert.equal(f.reports[0].pass,false);assert.match(f.reports[0].error,/failed/);assert.equal(JSON.parse(f.files.get('night-combat.json'))[0].pass,false);assert.ok(f.calls.includes('chromium:browser.close'));assert.ok(!f.calls.includes('chromium-touch:browser.launch'));
 assert.ok(!f.events().some(e=>e.operation===operation&&e.state==='end'));
});
test('falsy cleanup rejection still stops later profiles',async()=>{
 const f=fixture({hooks:{'chromium:context.close':()=>Promise.reject(undefined)}});let rejected=false;try{await f.run();}catch(error){rejected=true;assert.equal(error,undefined);}
 assert.equal(rejected,true);assert.ok(f.calls.includes('chromium:browser.close'));assert.equal(f.reports[0].pass,false);assert.ok(!f.calls.includes('chromium-touch:browser.launch'));
});
for(const operation of ['browser.launch','context.create','context.route','page.create','capture.begin'])test(operation+' startup failure closes only allocated resources and retains first failure',async()=>{
 const error=Error('startup '+operation);const f=fixture({selected:['chromium'],hooks:{['chromium:'+operation]:()=>{throw error;}}});const [record]=await f.run();
 assert.equal(record.pass,false);assert.match(record.error,/startup/);assert.equal(f.process.exitCode,1);
 assert.equal(f.calls.includes('chromium:browser.close'),operation!=='browser.launch');
 assert.equal(f.calls.includes('chromium:context.close'),!['browser.launch','context.create'].includes(operation));
});
test('capture reports with errors remain failures while normal cleanup and next profiles continue',async()=>{
 const f=fixture({captureErrors:['SIMULATED evidence missing']});const records=await f.run();assert.equal(f.process.exitCode,1);assert.ok(records.every(r=>!r.pass&&r.error==='Night combat evidence capture failed'));assert.equal(f.reports.length,3);
});

for(const sink of ['reset','append','console','report.write','report.log'])test(sink+' diagnostic failure cannot prevent cleanup or erase gameplay failure',async()=>{
 const error=Error('FIRST_GAMEPLAY');const f=fixture({selected:['chromium'],hooks:{'chromium:gameplay':()=>{throw error;}},
  ioFailure:(op,file)=>{if((sink==='reset'&&op==='write'&&file.endsWith('.jsonl'))||(sink==='append'&&op==='append')||(sink==='report.write'&&file==='night-combat.json'))throw Error('SECRET_IO');},
  consoleFailure:value=>{if((sink==='console'&&value.kind)||(sink==='report.log'&&!value.kind))throw Error('SECRET_CONSOLE');}});
 const [record]=await f.run();assert.equal(record.pass,false);assert.match(record.error,/FIRST_GAMEPLAY/);assert.equal(f.process.exitCode,1);
 assert.ok(f.calls.includes('chromium:context.close'));assert.ok(f.calls.includes('chromium:browser.close'));assert.ok(f.warnings.length<=8);assert.ok(!f.warnings.join('').includes('SECRET_'));
 if(sink==='append'||sink==='reset')assert.ok(f.phaseLog.some(e=>e.operation==='browser.close'&&e.state==='end'));
 if(sink==='console')assert.ok(f.events().some(e=>e.operation==='browser.close'&&e.state==='end'));
});
test('logging failure alone cannot report a green run',async()=>{
 const f=fixture({selected:['chromium'],ioFailure:op=>{if(op==='append')throw Error('disk');}});const [record]=await f.run();assert.equal(record.pass,false);assert.equal(record.error,'Night combat diagnostic logging failed');assert.equal(f.process.exitCode,1);
});

for(const large of [false,true])test('phase retention is capped by '+(large?'64 KiB':'256 entries')+' independently of callback completion',async()=>{
 const lines=[],warnings=[];let failed=0;
 const d=createNightDiagnostics({out:'/fixture',io:{writeFileSync(){},appendFileSync(file,line,options){assert.equal(options.flush,true);lines.push(line);}},log:{log(){},error:v=>warnings.push(v)},now:()=>10,fail:()=>failed++});
 for(let i=0;i<1000;i++)d.mark('chromium',large?'x'.repeat(1000):'operation','begin');
 assert.ok(lines.length<=256);assert.ok(Buffer.byteLength(lines.join(''))<=65536);assert.equal(failed,1);assert.equal(warnings.length,1);assert.equal(large?lines.length<256:lines.length===256,true);
 let called=false;assert.equal(await d.phase('chromium','post-cap',()=>{called=true;return 42;}),42);assert.equal(called,true);
});
test('failed or regressing diagnostic clock keeps sequence order and never rejects the phase callback',async()=>{
 let time=100,broken=false;const events=[];const d=createNightDiagnostics({out:'/fixture',io:{writeFileSync(){},appendFileSync(f,line){events.push(JSON.parse(line));}},log:{log(){},error(){}},now:()=>{if(broken)throw Error('clock');return time;},fail:()=>assert.fail('clock must not interrupt work')});
 time=120;d.mark('chromium','one','begin');broken=true;d.mark('chromium','two','begin');broken=false;time=110;d.mark('chromium','three','begin');time=130;assert.equal(await d.phase('chromium','four',()=>42),42);
 assert.deepEqual(events.map(e=>e.elapsedMs),[20,null,null,30,30]);assert.deepEqual(events.map(e=>e.sequence),[1,2,3,4,5]);
});

function hostileError(){return {get stack(){throw Error('stack getter');},get message(){throw Error('message getter');},toString(){throw Error('coercion');}};}
test('hostile cleanup formatter cannot skip owned browser close or replace initial gameplay failure',async()=>{
 const first=Error('FIRST_GAMEPLAY'),hostile=hostileError();
 const f=fixture({selected:['chromium'],hooks:{'chromium:gameplay':()=>{throw first;},'chromium:context.close':()=>{throw hostile;}}});
 await assert.rejects(f.run(),error=>error===first);
 assert.equal(f.calls.filter(op=>op==='chromium:browser.close').length,1);
 assert.match(f.reports[0].error,/FIRST_GAMEPLAY/);assert.equal(f.reports[0].cleanupErrors[0].error,'[unformattable error]');
 assert.equal(JSON.parse(f.files.get('night-combat.json'))[0].pass,false);
});
test('hostile primary cleanup error is retained as the rejection while its record is safe',async()=>{
 const hostile=hostileError();const f=fixture({hooks:{'chromium:context.close':()=>{throw hostile;}}});
 await assert.rejects(f.run(),error=>error===hostile);assert.equal(f.reports[0].error,'[unformattable error]');
 assert.equal(f.calls.filter(op=>op==='chromium:browser.close').length,1);assert.ok(!f.calls.includes('chromium-touch:browser.launch'));
});
test('hostile initial gameplay and capture formatting cannot interrupt later owned cleanup',async()=>{
 for(const operation of ['gameplay','capture.finish']){
  const hostile=hostileError();const f=fixture({selected:['chromium'],hooks:{['chromium:'+operation]:()=>{throw hostile;},'chromium:context.close':()=>{throw Error('secondary close');}}});
  await assert.rejects(f.run(),error=>error===hostile);assert.ok(f.calls.includes('chromium:browser.close'));
  const record=f.reports[0];assert.equal(record.pass,false);assert.match(operation==='gameplay'?record.error:record.artifacts.captureErrors[0],/unformattable error/);
 }
});
test('cleanup formatter samples getters once and bounds UTF-8 primary and secondary fields',async()=>{
 let reads=0;const error={get stack(){reads++;return 'context close '+ '💥'.repeat(10000);}};
 const f=fixture({selected:['chromium'],hooks:{'chromium:context.close':()=>{throw error;}}});await assert.rejects(f.run(),e=>e===error);
 const record=f.reports[0];assert.equal(reads,1);assert.ok(Buffer.byteLength(record.error)<=1000);assert.ok(Buffer.byteLength(record.cleanupErrors[0].error)<=1000);assert.match(record.error,/truncated/);assert.ok(f.calls.includes('chromium:browser.close'));
});
test('cleanup primary and secondary fields redact URLs, credentials, headers and token formats',async()=>{
 const secrets=['URL_USER','URL_PASSWORD','QUERY_SECRET','FRAGMENT_SECRET','HEADER_SECRET','COOKIE_SECRET','API_SECRET','PASS_SECRET','JSON_SECRET','BEARER_SECRET','ghp_UNIQUESECRET','sk-UNIQUESECRET'];
 const stack='context failed\nhttps://URL_USER:URL_PASSWORD@host/path?token=QUERY_SECRET#FRAGMENT_SECRET\nAuthorization: Bearer HEADER_SECRET\nCookie: session=COOKIE_SECRET\napi_key=API_SECRET password="PASS_SECRET" "client_secret": "JSON_SECRET"\nBearer BEARER_SECRET\nghp_UNIQUESECRET sk-UNIQUESECRET';
 const error={stack};const f=fixture({selected:['chromium'],hooks:{'chromium:context.close':()=>{throw error;}}});await assert.rejects(f.run(),e=>e===error);
 const record=f.reports[0],stored=f.files.get('night-combat.json');
 for(const secret of secrets){assert.ok(!record.error.includes(secret),secret);assert.ok(!stored.includes(secret),secret);}
 assert.match(record.error,/context failed/);assert.match(record.error,/REDACTED/);assert.equal(record.error,record.cleanupErrors[0].error);
});
test('oversized credential is redacted before output clipping and private key bodies are withheld',()=>{
 const d=createNightDiagnostics({out:'/fixture',io:{writeFileSync(){}},log:{log(){},error(){}},fail(){}});
 for(const value of ['password='+ 'SECRET'.repeat(5000),'-----BEGIN PRIVATE KEY-----\n'+'KEYSECRET'.repeat(2000)]){
  const text=d.errorText({stack:value});assert.ok(Buffer.byteLength(text)<=1000);assert.ok(!text.includes('SECRET'));assert.match(text,/REDACTED/);
 }
 for(const value of [null,undefined,0,Symbol('plain')])assert.doesNotThrow(()=>d.errorText(value));
});

const terminal=(event,operation)=>event.kind==='night-combat-phase'&&event.operation===operation&&(operation==='report'?['end','ready'].includes(event.state):['end','ready','error'].includes(event.state));
test('quoted secrets remain redacted when input clipping removes their closing quote',()=>{
 const d=createNightDiagnostics({out:'/fixture',io:{writeFileSync(){}},log:{log(){},error(){}},fail(){}});
 for(const quote of ['"',"'"]){
  const text=d.errorText({stack:'password='+quote+'SECRET WITH SPACES '.repeat(1000)+quote});
  assert.ok(!text.includes('SECRET'));assert.ok(!text.includes('SPACES'));assert.match(text,/REDACTED/);assert.ok(Buffer.byteLength(text)<=1000);
 }
});
test('escaped quotes inside credential values do not expose the remainder',()=>{
 const d=createNightDiagnostics({out:'/fixture',io:{writeFileSync(){}},log:{log(){},error(){}},fail(){}});
 for(const quote of ['"',"'"]){
  const text=d.errorText({stack:'context password='+quote+'FIRST\\'+quote+' LAST_SECRET'+quote+' failed'});
  assert.ok(!text.includes('FIRST'));assert.ok(!text.includes('LAST_SECRET'));assert.match(text,/context/);assert.match(text,/failed/);
 }
});
for(const operation of ['report','profile'])for(const sink of ['append','console'])for(const initial of [false,true])test(`terminal ${operation} marker ${sink} failure persists FAIL${initial?' and initial failure':''}`,async()=>{
 let triggered=false;const original=Error('FIRST_GAMEPLAY');
 const reject=event=>{if(!triggered&&terminal(event,operation)){triggered=true;throw Error('terminal marker I/O');}};
 const f=fixture({selected:['chromium'],hooks:initial?{'chromium:gameplay':()=>{throw original;}}:{},
  ioFailure:(op,file,line)=>{if(sink==='append'&&op==='append')reject(JSON.parse(line));},
  consoleFailure:value=>{if(sink==='console')reject(value);}});
 const [record]=await f.run();assert.equal(triggered,true);assert.equal(f.process.exitCode,1);assert.equal(record.pass,false);
 const saved=JSON.parse(f.files.get('night-combat.json'))[0];assert.equal(saved.pass,false);assert.equal(f.reports[0].pass,false);
 assert.equal(saved.error,record.error);if(initial)assert.match(saved.error,/FIRST_GAMEPLAY/);else assert.equal(saved.error,'Night combat diagnostic logging failed');
 assert.ok(f.calls.includes('chromium:context.close'));assert.ok(f.calls.includes('chromium:browser.close'));
});
test('terminal marker and final report write failures never invent successful persistence or retry',async()=>{
 let writes=0;const f=fixture({selected:['chromium'],ioFailure:(op,file,line)=>{
  if(op==='append'&&terminal(JSON.parse(line),'profile'))throw Error('marker failed');
  if(file==='night-combat.json'){writes++;throw Error('persist failed');}
 }});
 const [record]=await f.run();assert.equal(record.pass,false);assert.equal(f.process.exitCode,1);assert.equal(writes,1);assert.equal(f.files.has('night-combat.json'),false);
 assert.ok(f.warnings.some(v=>JSON.parse(v).operation==='report.write'));assert.ok(!f.events().some(e=>['report','profile'].includes(e.operation)&&e.state==='end'));
 const d=createNightDiagnostics({out:'/fixture',io:{writeFileSync(file){if(file.endsWith('night-combat.json'))throw Error('no persistence');},appendFileSync(){}},log:{log(){},error(){}},fail(){}});
 const direct={pass:true};assert.equal(d.report('chromium',direct,[direct]),false);assert.equal(direct.pass,false);
});
test('last fallible marker and console record precede the only final file write',async()=>{
 const order=[];const f=fixture({selected:['chromium'],ioFailure:(op,file,line)=>{if(op==='append')order.push('marker:'+JSON.parse(line).operation+':'+JSON.parse(line).state);if(file==='night-combat.json')order.push('persist');},consoleFailure:value=>order.push(value.kind?'console-marker':'record')});
 await f.run();assert.equal(order.at(-1),'persist');assert.equal(order.filter(x=>x==='persist').length,1);assert.ok(order.indexOf('marker:profile:ready')<order.indexOf('record'));
});

for(const primary of [null,undefined])for(const origin of ['gameplay','capture','gameplay then capture'])for(const close of ['context.close','browser.close'])test(`nullish primary ${String(primary)} from ${origin} survives ${close} rejection`,async()=>{
 const secondaryCapture=Error('SECONDARY_CAPTURE'),cleanup=Error('SECONDARY_CLEANUP');
 const hooks={['chromium:'+close]:()=>{throw cleanup;}};
 if(origin==='capture')hooks['chromium:capture.finish']=()=>{throw primary;};
 else{
  hooks['chromium:gameplay']=()=>{throw primary;};
  if(origin==='gameplay then capture')hooks['chromium:capture.finish']=()=>{throw secondaryCapture;};
 }
 const f=fixture({hooks});let rejected=false,reason;
 try{await f.run();}catch(error){rejected=true;reason=error;}
 assert.equal(rejected,true);assert.equal(reason,primary,'the first rejection value must survive unchanged');
 assert.equal(f.calls.filter(op=>op==='chromium:context.close').length,1);assert.equal(f.calls.filter(op=>op==='chromium:browser.close').length,1);
 assert.ok(!f.calls.includes('chromium-touch:browser.launch'));assert.equal(f.reports.length,1);
 const record=f.reports[0],saved=JSON.parse(f.files.get('night-combat.json'))[0];
 assert.equal(record.pass,false);assert.equal(saved.pass,false);assert.equal(saved.error,record.error);
 assert.equal(record.error,origin==='capture'?'Night combat evidence capture failed':String(primary));
 assert.equal(record.cleanupErrors[0].operation,close);assert.match(record.cleanupErrors[0].error,/SECONDARY_CLEANUP/);
 if(origin==='capture')assert.equal(record.artifacts.captureErrors[0],String(primary));
 if(origin==='gameplay then capture')assert.match(record.artifacts.captureErrors[0],/SECONDARY_CAPTURE/);
});
