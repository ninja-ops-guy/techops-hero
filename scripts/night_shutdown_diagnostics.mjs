// Observation only. Never signals processes or changes browser cleanup policy.
import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
import path from 'node:path';
import os from 'node:os';
import {formatNightError} from './night_combat_diagnostics.mjs';
const require=createRequire(import.meta.url);

export function ownedProcessSnapshot({pid=process.pid,retainedPids=[],retainedGroups=[],exec=execFileSync}={}){
 // No argv or environment: retain only this Node process and descendants.
 // A synchronous OS query has its own small deadline, including on timeout paths.
 const output=exec('ps',['-axo','pid=,ppid=,pgid=,stat=,comm='],
  {encoding:'utf8',timeout:200,maxBuffer:1024*1024,stdio:['ignore','pipe','pipe']});
 const rows=output.split('\n').flatMap(line=>{
  const match=line.trim().match(/^(\d+)\s+(\d+)\s+(\d+)\s+(\S+)\s+(.+)$/);
  return match?[{pid:+match[1],ppid:+match[2],pgid:+match[3],state:match[4],command:path.basename(match[5])}]:[];
 });
 if(!rows.some(row=>row.pid===pid))throw Error('Process snapshot did not identify the harness PID');
 const owned=new Set([pid]);
 for(let changed=true;changed;){changed=false;for(const row of rows)if(owned.has(row.ppid)&&!owned.has(row.pid)){owned.add(row.pid);changed=true;}}
 const nodeGroup=rows.find(row=>row.pid===pid)?.pgid;
 const retained=new Set(retainedPids),groups=new Set(retainedGroups.filter(group=>group>0&&group!==nodeGroup));
 const descendants=rows.filter(row=>row.command!=='ps'&&(owned.has(row.pid)||retained.has(row.pid)||groups.has(row.pgid)))
  .map(row=>({...row,ownership:row.pid===pid?'harness':owned.has(row.pid)?'descendant':retained.has(row.pid)?'previously observed pid':'previously observed group'}));
 return {processes:descendants.slice(0,64),truncated:descendants.length>64};
}

export function createNightShutdownDiagnostics({record,launchOptions,snapshot=ownedProcessSnapshot,
 runtime=process,version=()=>require('playwright/package.json').version,now=()=>Date.now()}){
 const data=record.shutdown={node:runtime.version,platform:runtime.platform,arch:runtime.arch,pid:runtime.pid,
  osRelease:os.release(),osVersion:os.version(),
  runner:{os:runtime.env?.RUNNER_OS??null,arch:runtime.env?.RUNNER_ARCH??null,image:runtime.env?.ImageOS??null,imageVersion:runtime.env?.ImageVersion??null},
  launch:{headless:launchOptions.headless,channel:launchOptions.channel??null,executablePath:launchOptions.executablePath??null},
  snapshots:[],events:[],errors:[]};
 const retainedPids=new Set(),retainedGroups=new Set();
 function failure(error){if(data.errors.length<8)data.errors.push(formatNightError(error));}
 try{data.playwrightVersion=version();}catch(error){failure(error);}
 function observe(stage,browser){
  if(data.snapshots.length>=5)return;
  const item={stage};data.snapshots.push(item);
  try{item.at=now();item.connected=browser.isConnected();item.contexts=browser.contexts().length;}catch(error){failure(error);}
  try{
   const sample=snapshot({pid:runtime.pid,retainedPids:[...retainedPids],retainedGroups:[...retainedGroups]});
   Object.assign(item,sample);
   const nodeGroup=sample.processes.find(row=>row.pid===runtime.pid)?.pgid;
   for(const row of sample.processes){
    if(row.pid!==runtime.pid)retainedPids.add(row.pid);
    if(row.pgid>0&&nodeGroup!==undefined&&row.pgid!==nodeGroup)retainedGroups.add(row.pgid);
   }
  }catch(error){failure(error);}
 }
 function attach(browser){
  try{browser.on('disconnected',()=>{try{if(data.events.length<4)data.events.push({event:'disconnected',at:now()});}catch(error){failure(error);}});}catch(error){failure(error);}
 }
 function settle(){if(data.errors.length){record.pass=false;record.error??='Night shutdown diagnostic capture failed';}}
 return {attach,observe,settle};
}
