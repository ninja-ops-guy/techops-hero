// Node/browser replay parity. No deployments, save APIs or alternate browser transport.
// Usage: node scripts/arena_core_browser.mjs [--node-only | --fixtures-only]
// ARENA_CORE_ROOT selects a checkout during integration; default is this repository.
// ARENA_CORE_ARTIFACT_DIR selects a /tmp parent; each run retains its own subdirectory.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {createRequire,Module} from 'node:module';
import {execFileSync} from 'node:child_process';
const require=createRequire(import.meta.url),scriptRoot=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const root=path.resolve(process.env.ARENA_CORE_ROOT||scriptRoot);
const args=process.argv.slice(2);
if(args.some(arg=>!['--node-only','--fixtures-only'].includes(arg))||args.length>1)throw Error('Use --node-only or --fixtures-only, or no option for both browsers.');
const profile=args[0]?.slice(2)||'node-chromium-webkit';
const parent=path.resolve(process.env.ARENA_CORE_ARTIFACT_DIR||'/tmp/arena-core');
if(parent!=='/tmp'&&!parent.startsWith('/tmp/'))throw Error('Parity artifacts must remain under /tmp.');
fs.mkdirSync(parent,{recursive:true});
const artifacts=fs.mkdtempSync(path.join(parent,'run-'));
const {scenarios,replay,validateFixtures}=require(path.join(scriptRoot,'arena/core-parity-fixtures.cjs'));
const hash=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const write=(name,value)=>fs.writeFileSync(path.join(artifacts,name),JSON.stringify(value,null,2)+'\n');
function failure(error){return {message:String(error?.message||error).split('\n').filter(Boolean).slice(0,2).join(' ').slice(0,800)};}
function git(args,cwd=root){try{return execFileSync('git',args,{cwd,encoding:'utf8'}).trim();}catch{return null;}}
const summary={profile,startedAt:new Date().toISOString(),status:'running',revision:git(['rev-parse','HEAD']),dirty:!!git(['status','--porcelain']),harnessRevision:git(['rev-parse','HEAD'],scriptRoot),harnessDirty:!!git(['status','--porcelain'],scriptRoot),node:process.version,sourceHashes:{},fixtures:validateFixtures(),nodeReplay:{status:'not-run'},browsers:{chromium:{status:'not-run'},webkit:{status:'not-run'}},limits:['Replay parity is not internet-latency, physical-device, session-recovery, hosting, security or release qualification.','No campaign code or save mutation is part of these control tapes.']};
summary.sourceHashes['scripts/arena_core_browser.mjs']=hash(fs.readFileSync(fileURLToPath(import.meta.url)));
summary.sourceHashes['arena/core-parity-fixtures.cjs']=hash(fs.readFileSync(path.join(scriptRoot,'arena/core-parity-fixtures.cjs')));
let server;
function compile(bytes,filename,input){
 const loaded=new Module(filename);loaded.filename=filename;
 loaded.require=specifier=>{if(input&&['./input-contract.js','./input-contract'].includes(specifier))return input;throw Error('Unexpected dependency in pure core: '+specifier);};
 loaded._compile(bytes.toString('utf8'),filename);return loaded.exports;
}
try{
 if(profile==='fixtures-only')summary.status='fixture-definition-pass';
 else{
  const inputBytes=fs.readFileSync(path.join(root,'arena/input-contract.js')),coreBytes=fs.readFileSync(path.join(root,'arena/simulation.cjs'));
  summary.sourceHashes['arena/input-contract.js']=hash(inputBytes);summary.sourceHashes['arena/simulation.cjs']=hash(coreBytes);
  const input=compile(inputBytes,path.join(root,'arena/input-contract.js'));
  const core=compile(coreBytes,path.join(root,'arena/simulation.cjs'),input);
  if(![input.KEYS,input.BUTTONS,core.KEYS,core.ROSTER].every(Object.isFrozen))throw Error('Published input/core tables must be frozen.');
  const cases=scenarios(),nodeRuns=[];
  for(const scenario of cases){
   const result=replay({scenario,core,inputContract:input});
   if(!result.passed){write('node-failure.json',{scenario:scenario.name,...result.failure});throw Error('Node fixture failed: '+scenario.name+' — '+result.failure.message);}
   nodeRuns.push({scenario,result});
  }
  const allIds=nodeRuns.flatMap(run=>run.result.summary.eventIds);
  if(new Set(allIds).size!==allIds.length)throw Error('Event IDs collide between match namespaces.');
  summary.nodeReplay={status:'passed',cases:nodeRuns.map(({result})=>({...result.summary,eventIds:undefined,eventCount:result.summary.eventIds.length,traceSha256:hash(JSON.stringify(result.trace))}))};
  if(profile==='node-only')summary.status='node-only-pass';
  else{
   let playwright;
   try{playwright=await import('playwright');summary.playwrightVersion=require('playwright/package.json').version;}
   catch(error){for(const name of ['chromium','webkit'])summary.browsers[name]={status:'blocked',failure:failure(error)};}
   if(playwright){
    const {start}=require(path.join(root,'arena/server.cjs'));
    server=start({port:0});await new Promise((resolve,reject)=>{server.once('listening',resolve);server.once('error',reject);});
    const origin=`http://127.0.0.1:${server.address().port}`;
    for(const name of ['chromium','webkit']){
     let browser;
     const result=summary.browsers[name]={status:'running',cases:[]};
     try{
      browser=await playwright[name].launch({headless:true,timeout:30000});result.version=browser.version();
      const context=await browser.newContext();const page=await context.newPage();page.setDefaultTimeout(30000);page.setDefaultNavigationTimeout(30000);
      const mutations=[];page.on('request',request=>{if(request.method()!=='GET')mutations.push({method:request.method(),path:new URL(request.url()).pathname});});
      const errors=[];page.on('pageerror',error=>errors.push(failure(error)));
      await page.goto(origin,{waitUntil:'load'});
      const storageBefore=await context.storageState(),sessionBefore=await page.evaluate(()=>JSON.stringify({...sessionStorage}));
      result.loadedSourceHashes={};
      for(const [route,bytes] of [['/input-contract.js',inputBytes],['/simulation.cjs',coreBytes]]){
       const [response]=await Promise.all([page.waitForResponse(response=>response.url()===origin+route),page.addScriptTag({url:origin+route})]);
       if(response.status()!==200)throw Error('Core script route failed: '+route);
       const loadedHash=hash(await response.body());result.loadedSourceHashes[route]=loadedHash;
       if(loadedHash!==hash(bytes))throw Error('Browser script bytes differ from Node: '+route);
      }
      const frozen=await page.evaluate(()=>[ArenaInputContract.KEYS,ArenaInputContract.BUTTONS,ArenaSimulation.KEYS,ArenaSimulation.ROSTER].every(Object.isFrozen));
      if(!frozen)throw Error('Browser published tables are not frozen.');
      for(const {scenario,result:nodeResult} of nodeRuns){
       // One bulk browser evaluation per tape; every step/checkpoint/round operation
       // still compares complete state + events against the exact Node frames.
       const browserResult=await page.evaluate(replay,{scenario,expected:nodeResult.trace});
       if(!browserResult.passed){write(name+'-replay-failure.json',{scenario:scenario.name,...browserResult.failure});throw Error('Replay mismatch: '+scenario.name+' — '+browserResult.failure.message);}
       const {eventIds,...counts}=browserResult.summary;result.cases.push({...counts,eventCount:eventIds.length});
      }
      const storageAfter=await context.storageState(),sessionAfter=await page.evaluate(()=>JSON.stringify({...sessionStorage}));
      if(JSON.stringify(storageBefore)!==JSON.stringify(storageAfter)||sessionBefore!==sessionAfter)throw Error('Replay changed browser storage.');
      if(mutations.length){write(name+'-unexpected-requests.json',mutations);throw Error('Replay sent a non-GET request.');}
      if(errors.length){write(name+'-page-errors.json',errors);throw Error('Browser page reported runtime errors.');}
      result.storageUnchanged=true;result.nonGetRequests=0;result.status='passed';await context.close();
     }catch(error){result.status=browser?'failed':'blocked';result.failure=failure(error);write(name+'-failure.json',result.failure);}
     finally{if(browser)await browser.close().catch(()=>{});}
    }
   }
   summary.status=['chromium','webkit'].every(name=>summary.browsers[name].status==='passed')?'passed':'failed';
  }
  if(hash(fs.readFileSync(path.join(root,'arena/input-contract.js')))!==summary.sourceHashes['arena/input-contract.js']||hash(fs.readFileSync(path.join(root,'arena/simulation.cjs')))!==summary.sourceHashes['arena/simulation.cjs'])throw Error('Core source files changed during this run.');
 }
}catch(error){summary.status='failed';summary.failure=failure(error);write('runner-failure.json',summary.failure);}
finally{
 if(server){server.closeAllConnections?.();await new Promise(resolve=>server.close(resolve));}
 summary.finishedAt=new Date().toISOString();write('summary.json',summary);
 console.log(JSON.stringify({status:summary.status,profile,artifacts,node:summary.nodeReplay.status,chromium:summary.browsers.chromium.status,webkit:summary.browsers.webkit.status}));
 if(summary.status==='failed')process.exitCode=1;
}
