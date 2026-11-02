// Run the unchanged Night acceptance once; retain only scoped, sanitized diagnostics.
import {spawn,execFile} from 'node:child_process';
import {mkdir,writeFile,readFile,statfs,rename} from 'node:fs/promises';
import {StringDecoder} from 'node:string_decoder';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {join,resolve} from 'node:path';
import {release,arch} from 'node:os';
import {promisify} from 'node:util';
const execute=promisify(execFile);

export function sanitizeDiagnostic(value){
 return String(value).replace(/\x1b\[[0-9;]*m/g,'')
  .replace(/(<launching>) .*/,'$1 [arguments omitted]')
  .replace(/https?:\/\/[^\s"'<>]+/g,value=>{try{const url=new URL(value);return url.origin+url.pathname+(url.search||url.hash?'?[redacted]':'');}catch{return '[redacted URL]';}})
  .replace(/\b(authorization|proxy-authorization|cookie|set-cookie)["']?\s*[:=].*/gi,'$1: [redacted]')
  .replace(/\b(Bearer|Basic)\s+\S+/gi,'$1 [redacted]')
  .replace(/\b([\w-]*(?:token|password|secret|api[_-]?key|access[_-]?key|credential)[\w-]*)["']?\s*[=:]\s*(?:"[^"]*"|'[^']*'|[^\s,;]+)/gi,'$1=[redacted]')
  .replace(/\b(?:gh[pousr]_[A-Za-z0-9_]+|github_pat_[A-Za-z0-9_]+)\b/g,'[redacted]');
}

export function filterCrashMetadata(text){
 return text.split(/\r?\n/).filter(line=>/^\s*(?:PID:|Signal:|Executable:|Stack trace of thread|#\d+\s)/.test(line)).slice(0,100).map(sanitizeDiagnostic).join('\n');
}

async function crashMetadata(resources,startedAt,finishedAt){
 if(process.platform!=='linux')return {unavailable:'coredump metadata is Linux-only'};
 const pids=resources.knownProcesses.filter(p=>/^(?:WPEWebProcess|WebKitWebProces)/.test(p.name)).slice(-8).map(p=>p.pid),records=[];
 const stamp=value=>new Date(value).toISOString().replace('T',' ').replace(/\.\d+Z$/,' UTC');
 for(const pid of pids){
  try{
   // Read metadata for observed WebKit children only. Never copy process memory,
   // environment, command lines, unrelated journal entries, or raw core files.
   const {stdout}=await execute('coredumpctl',['--no-pager','--since',stamp(startedAt),'--until',stamp(Date.parse(finishedAt)+1000),'info',String(pid)],{timeout:1500,maxBuffer:65536});
   const matchesPid=new RegExp('^\\s*PID:\\s*'+pid+'\\b','m').test(stdout);
   const matchesExecutable=/^\s*Executable:.*\/(?:WPEWebProcess|WebKitWebProcess)\s*$/m.test(stdout);
   records.push(matchesPid&&matchesExecutable?{pid,metadata:filterCrashMetadata(stdout)}:{pid,unavailable:'matching WebKit content-process metadata is absent'});
  }catch(error){
   if(error.code==='ENOENT')return {unavailable:'coredumpctl is not installed',records};
   const denied=/permission denied|access denied|not seeing messages/i.test(String(error.stderr||''));
   records.push({pid,unavailable:denied?'permission denied; no escalation attempted':error.killed?'metadata query timed out':'no readable matching crash record'});
   if(denied)break;
  }
 }
 return {records,...(!pids.length?{unavailable:'no WebKit child PID was observed'}:{})};
}

async function systemVersions(){
 const result={platform:process.platform,kernel:release(),architecture:arch(),node:process.version};
 if(process.platform!=='linux')return result;
 const packages=['libc6','libglib2.0-0t64','libgtk-3-0t64','libgstreamer1.0-0','gstreamer1.0-plugins-base','gstreamer1.0-plugins-good','gstreamer1.0-libav'];
 try{
  const {stdout}=await execute('dpkg-query',['-W',...packages],{timeout:2000,maxBuffer:8192});
  result.libraries=Object.fromEntries(stdout.trim().split('\n').map(line=>line.split(/\s+/)).filter(([name,version])=>packages.includes(name.split(':')[0])&&/^[\w.+:~\-]+$/.test(version)));
 }catch(error){result.libraries={unavailable:error.code||'package metadata unavailable'};}
 return result;
}

function processLog(observe=()=>{}){
 const decoder=new StringDecoder('utf8'),lines=[];let pending='',oversized=false,bytes=0,dropped=0;
 const line=value=>{
  const clean=sanitizeDiagnostic(value)+'\n',size=Buffer.byteLength(clean);observe(clean);
  lines.push({clean,size});bytes+=size;
  while(bytes>2*1024*1024){bytes-=lines.shift().size;dropped++;}
 };
 const feed=value=>{
  for(const part of value.split(/(\n)/)){
   if(part==='\n'){line(oversized?'[oversized diagnostic line omitted]':pending);pending='';oversized=false;}
   else if(!oversized){pending+=part;if(pending.length>32768){pending='';oversized=true;}}
  }
 };
 const snapshot=()=>({text:lines.map(l=>l.clean).join(''),droppedLines:dropped});
 return {snapshot,push:chunk=>feed(decoder.write(chunk)),finish(){feed(decoder.end());if(pending||oversized)line(oversized?'[oversized diagnostic line omitted]':pending);return snapshot();}};
}

function processSampler(parentPid){
 const roots=new Set(),known=new Map(),samples=[],readErrors=new Map();let pending=null,dropped=0;
 const reason=error=>({unavailable:error.code||'unavailable'});
 const cgroupPath=process.platform==='linux'&&parentPid?readFile(`/proc/${parentPid}/cgroup`,'utf8').then(text=>{
  const entry=text.split('\n').find(line=>line.startsWith('0::'))?.slice(3);
  if(!entry||entry.split('/').includes('..'))throw Error('unavailable');
  return resolve('/sys/fs/cgroup','.'+entry);
 }).catch(()=>null):Promise.resolve(null);
 const status=async pid=>{
  try{
  const text=await readFile(`/proc/${pid}/status`,'utf8');
  const number=field=>Number(text.match(new RegExp('^'+field+':\\s*(\\d+)','m'))?.[1]||0);
  return {pid,ppid:number('PPid'),name:(text.match(/^Name:\s*(.+)$/m)?.[1]||'').slice(0,32),rssKiB:number('VmRSS'),peakRssKiB:number('VmHWM'),threads:number('Threads')};
  }catch(error){if(!['ENOENT','ESRCH'].includes(error.code)&&readErrors.size<32)readErrors.set(pid,{pid,unavailable:error.code||'process status unavailable'});throw error;}
 };
 const cgroup=async()=>{
  const location=await cgroupPath;if(!location)return {unavailable:'process cgroup unavailable'};
  try{
   const [events,current]=await Promise.all([readFile(join(location,'memory.events'),'utf8'),readFile(join(location,'memory.current'),'utf8')]);
   return {currentBytes:Number(current),events:Object.fromEntries(events.split('\n').map(line=>line.match(/^(low|high|max|oom|oom_kill|oom_group_kill) (\d+)$/)).filter(Boolean).map(([,key,value])=>[key,Number(value)]))};
  }catch(error){return reason(error);}
 };
 const sample=async()=>{
  if(process.platform!=='linux'||!parentPid)return;
  const processes=[],queue=[];
  for(const pid of roots){const item=await status(pid).catch(()=>null);if(item?.ppid===parentPid)queue.push(item);}
  const seen=new Set();
  while(queue.length&&processes.length<64){
   const item=queue.shift();if(seen.has(item.pid))continue;seen.add(item.pid);processes.push(item);
   if(known.size<256)known.set(item.pid,{pid:item.pid,name:item.name});
   const children=await readFile(`/proc/${item.pid}/task/${item.pid}/children`,'utf8').catch(()=>'');
   for(const value of children.trim().split(/\s+/).slice(0,64)){
    if(!/^\d+$/.test(value))continue;const child=await status(Number(value)).catch(()=>null);
    if(child?.ppid===item.pid)queue.push(child);
   }
  }
  const shm=await statfs('/dev/shm').then(s=>({totalBytes:s.blocks*s.bsize,availableBytes:s.bavail*s.bsize})).catch(reason);
  samples.push({at:new Date().toISOString(),processes,cgroup:await cgroup(),sharedMemory:shm});
  // Cover the workflow's complete 480-second budget, including a failure in an
  // earlier profile, while retaining a fixed upper bound outside that workflow.
  if(samples.length>500){samples.shift();dropped++;}
 };
 const request=()=>{if(!pending)pending=sample().catch(()=>{}).finally(()=>{pending=null;});};
 const timer=setInterval(request,1000);request();
 const snapshot=()=>({platform:process.platform,scope:'launched browser descendants; inherited process cgroup; shared-memory capacity',samples,droppedSamples:dropped,knownProcesses:[...known.values()],processReadErrors:[...readErrors.values()],...(process.platform!=='linux'?{unavailable:'Linux process evidence is unavailable on this platform'}:{})});
 return {
  snapshot,
  observe(line){const match=line.match(/pw:browser.*<launched> pid=(\d+)/);if(match&&roots.size<16){roots.add(Number(match[1]));request();}},
  async finish(){clearInterval(timer);await pending;await sample();return snapshot();}
 };
}

export async function runNightDiagnostics({out,script=fileURLToPath(new URL('./night_lifecycle_browser.mjs',import.meta.url)),forwardStdout=true}={}){
 out=out||process.env.NIGHT_REPORT_DIR||(process.env.BOT_OUT_DIR?`${process.env.BOT_OUT_DIR}/night-lifecycle`:'artifacts/night-lifecycle');
 await mkdir(out,{recursive:true});
 const startedAt=new Date().toISOString();
 const child=spawn(process.execPath,[script],{env:{...process.env,DEBUG:'pw:browser',NIGHT_REPORT_DIR:out},stdio:['ignore','pipe','pipe']});
 const sampler=processSampler(child.pid),log=processLog(line=>sampler.observe(line));
 const versions=systemVersions();let writing=null,persistenceError=null;
 const atomicWrite=async(name,text)=>{const file=join(out,name);await writeFile(file+'.tmp',text);await rename(file+'.tmp',file);};
 const persist=async(record)=>{
  if(writing)await writing;
  const retained=log.snapshot();
  writing=(async()=>{
   await atomicWrite('process-diagnostics.json',JSON.stringify({startedAt,exit:null,droppedLogLines:retained.droppedLines,system:await versions,resources:sampler.snapshot(),...record},null,2));
   await atomicWrite('browser-process.log',retained.text);
  })().catch(error=>{persistenceError=error.code||'write failed';});
  await writing;writing=null;
 };
 // A timeout or native termination must not erase all earlier evidence. Both
 // partial and final files contain sanitized/bounded data before reaching disk.
 const flushTimer=setInterval(()=>{if(!writing)void persist({});},1000);
 let interruptedBy=null;
 const forward=signal=>{interruptedBy=signal;child.kill(signal);},onTerm=()=>forward('SIGTERM'),onInt=()=>forward('SIGINT');
 process.on('SIGTERM',onTerm);process.on('SIGINT',onInt);
 child.stdout.on('data',data=>{if(forwardStdout)process.stdout.write(data);});
 child.stderr.on('data',data=>log.push(data));
 const result=await new Promise(resolve=>{
  child.once('error',error=>resolve({code:1,signal:null,launchError:error.code||'launch failed'}));
  child.once('close',(code,signal)=>resolve({code,signal}));
 });
 process.off('SIGTERM',onTerm);process.off('SIGINT',onInt);
 if(interruptedBy)result.interruptedBy=interruptedBy;
 const finishedAt=new Date().toISOString(),retained=log.finish();
 const resources=await sampler.finish();
 clearInterval(flushTimer);if(writing)await writing;
 await persist({finishedAt,exit:result,resources,crashes:{pending:true}});
 const crashes=result.code!==0||result.signal||interruptedBy?await crashMetadata(resources,startedAt,finishedAt):{notRequested:'acceptance completed successfully'};
 await persist({finishedAt,exit:result,droppedLogLines:retained.droppedLines,resources,crashes});
 if(persistenceError){process.stderr.write('Night diagnostic persistence failed: '+persistenceError+'\n');if(result.code===0)result.code=1;}
 return result;
}

if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 const result=await runNightDiagnostics();
 if(result.interruptedBy||result.signal)process.kill(process.pid,result.interruptedBy||result.signal);
 else process.exitCode=result.code??1;
}
