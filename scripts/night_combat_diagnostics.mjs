// Bounded, best-effort boundaries only. No timeout, signal or gameplay authority.
import fs from 'node:fs';
import path from 'node:path';
import {performance} from 'node:perf_hooks';

// Read hostile errors once, redact before output truncation, and never let a
// getter/coercion failure interrupt cleanup. Limits apply to UTF-8 output bytes.
export function formatNightError(error){
 try{
  let text;
  for(const key of ['stack','message']){try{const value=error?.[key];if(typeof value==='string'&&value){text=value;break;}}catch{}}
  if(text===undefined)try{text=String(error);}catch{return '[unformattable error]';}
  const clipped=text.length>8192;text=text.slice(0,8192);
  text=text.replace(/-----BEGIN [^-]*PRIVATE KEY-----[\s\S]*/g,'[REDACTED PRIVATE KEY]')
   .replace(/\b[a-z][a-z\d+.-]*:\/\/[^\s<>"')]+/gi,'[REDACTED URL]')
   .replace(/\b(authorization|proxy-authorization|cookie|set-cookie)\s*[:=][^\r\n]*/gi,'$1: [REDACTED]')
   .replace(/\b(Bearer|Basic)\s+[a-z\d+/_=.-]+/gi,'$1 [REDACTED]')
   .replace(/\b(api[_-]?key|access[_-]?token|refresh[_-]?token|id[_-]?token|token|secret|password|passwd|pwd|client[_-]?secret|signature|credential)\b["']?\s*[:=]\s*(?:"(?:\\.|[^"\\\r\n])*(?:"|$)|'(?:\\.|[^'\\\r\n])*(?:'|$)|[^\s,;&}\]\r\n]+)/gi,'$1=[REDACTED]')
   .replace(/\b(?:gh[pousr]_[a-z\d_]+|github_pat_[a-z\d_]+|sk-[a-z\d_-]+|AKIA[A-Z\d]{16})\b/gi,'[REDACTED TOKEN]');
  if(clipped)text+=' [truncated]';
  if(Buffer.byteLength(text)>1000)text=Buffer.from(text).subarray(0,980).toString('utf8').replace(/\uFFFD$/,'')+' [truncated]';
  return text;
 }catch{return '[unformattable error]';}
}

export function createNightDiagnostics({out,io=fs,log=console,now=()=>performance.now(),fail=()=>{process.exitCode=1;}}){
 const file=path.join(out,'night-combat-phases.jsonl');
 let events=0,bytes=0,failures=0,capped=false,ready=false,last=null;
 const clock=()=>{try{const value=now();return Number.isFinite(value)&&value>=0?value:null;}catch{return null;}};
 const start=clock();last=start;
 function failure(operation){
  failures++;try{fail();}catch{}
  // Fixed labels only: never publish exception text or URLs to this phase sink.
  if(failures<=8)try{log.error(JSON.stringify({kind:'night-combat-diagnostic-error',operation}));}catch{}
 }
 function bestEffort(operation,write){try{return write();}catch{failure(operation);}}
 ready=bestEffort('phase.reset',()=>{io.writeFileSync(file,'',{flush:true});return true;})===true;
 function mark(profile,operation,state){
  if(capped)return;
  bestEffort('phase.encode',()=>{
   const time=clock(),valid=start!==null&&time!==null&&time>=last;
   const elapsedMs=valid?time-start:null;if(valid)last=time;
   const line=JSON.stringify({kind:'night-combat-phase',sequence:events+1,elapsedMs,profile,operation,state})+'\n';
   if(events>=256||bytes+Buffer.byteLength(line)>65536){capped=true;failure('phase.limit');return;}
   events++;bytes+=Buffer.byteLength(line);
   if(ready)bestEffort('phase.write',()=>io.appendFileSync(file,line,{flush:true}));
   // Mirror independently: compact evidence may omit JSONL or a sink may fail.
   bestEffort('phase.log',()=>log.log(line.trimEnd()));
  });
 }
 async function phase(profile,operation,run){
  mark(profile,operation,'begin');
  try{const value=await run();mark(profile,operation,'end');return value;}
  catch(error){mark(profile,operation,'error');throw error;}
 }
 function settle(record){if(failures){record.pass=false;record.error??='Night combat diagnostic logging failed';}}
 function report(profile,record,results){
  // All fallible marker writes precede the authoritative record write. "ready"
  // describes a pre-persistence boundary, never a successful persistence claim.
  mark(profile,'report','begin');
  mark(profile,'report','ready');
  settle(record);mark(profile,'profile',record.pass?'ready':'error');
  settle(record);
  bestEffort('report.log',()=>log.log(JSON.stringify(record)));settle(record);
  const persisted=bestEffort('report.write',()=>{io.writeFileSync(path.join(out,'night-combat.json'),JSON.stringify(results,null,2));return true;});settle(record);
  // No marker/log writes follow a successful commit. A failed sink is reported
  // as failed, without pretending that the in-memory failure reached disk.
  return persisted===true;
 }
 function cleanupFailure(record,operation,error){
  const text=formatNightError(error);record.pass=false;record.error??=text;
  (record.cleanupErrors??=[]).push({operation,error:text});
 }
 return {mark,phase,report,cleanupFailure,errorText:formatNightError};
}
