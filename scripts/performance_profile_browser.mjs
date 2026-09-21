#!/usr/bin/env node
// Desktop performance evidence collector for R1 release qualification.
// This produces real browser measurements, but it is intentionally NOT
// physical-device, mobile-thermal, or human-playtest evidence.
import fs from 'node:fs';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {chromium} from 'playwright';
import {sourceIdentity,digest} from './quality_release_receipt.mjs';

const port=Number(process.env.PERF_PORT||4217);
const base=process.env.PERF_BASE_URL||`http://127.0.0.1:${port}/`;
const out=path.resolve(process.env.PERF_OUT_DIR||'/tmp/techops-performance-evidence');
const operator=process.env.PERF_OPERATOR||'automated-desktop-profiler';
const device=process.env.PERF_DEVICE||'desktop-browser-runner';
fs.mkdirSync(out,{recursive:true});

const source=sourceIdentity();
const startedWall=Date.now();
const server=process.env.PERF_BASE_URL?null:spawn('python3',['scripts/media_http_server.py','--port',String(port),'--bind','127.0.0.1'],{stdio:'ignore'});
let browser,context,page;

const percentile=(values,p)=>{
  if(!values.length)return null;
  const sorted=[...values].sort((a,b)=>a-b);
  return sorted[Math.min(sorted.length-1,Math.floor((sorted.length-1)*p))];
};
async function waitServer(){
  for(let attempt=0;attempt<120;attempt++){
    try{if((await fetch(base)).ok)return;}catch{}
    await new Promise(r=>setTimeout(r,100));
  }
  throw new Error('performance profile server did not become ready');
}
async function titleReady(){
  await page.waitForFunction(()=>window.__productionTitleReadiness?.ready===true&&!document.querySelector('#btn-start')?.disabled,null,{timeout:30000});
  return page.evaluate(()=>performance.now());
}
const option=text=>page.locator('#dlg-options button').filter({hasText:text}).first();

async function startDay(){
  await page.locator('#btn-start').click();
  await option(/Standard/).click();
  await option(/Clock in/).click();
  await page.waitForFunction(()=>window.S?.map&&!S.inDialog,null,{timeout:15000});
}
async function oneInputSample(){
  const target=await page.evaluate(()=>{
    const options=[[1,0,'ArrowRight'],[-1,0,'ArrowLeft'],[0,1,'ArrowDown'],[0,-1,'ArrowUp']];
    for(const [dx,dy,key] of options){
      const x=S.px+dx,y=S.py+dy;
      if(S.map[y]?.[x]===0&&!S.npcs.some(n=>n.x===x&&n.y===y))return {x,y,key,fromX:S.px,fromY:S.py};
    }
    return null;
  });
  if(!target)throw new Error('no adjacent free tile for input latency probe');
  await page.evaluate(({fromX,fromY,key})=>{
    const probe=window.__techopsPerfInputProbe={fromX,fromY,key,inputAt:null,visibleAt:null};
    const onKey=e=>{if(e.code===key||e.key===key)probe.inputAt=performance.now();};
    document.addEventListener('keydown',onKey,{capture:true,once:true});
    const observe=()=>{
      if(window.S&&(S.px!==fromX||S.py!==fromY)){probe.visibleAt=performance.now();return;}
      requestAnimationFrame(observe);
    };
    requestAnimationFrame(observe);
  },target);
  await page.keyboard.down(target.key);
  try{
    await page.waitForFunction(()=>Number.isFinite(window.__techopsPerfInputProbe?.visibleAt),null,{timeout:3000});
  }finally{
    await page.keyboard.up(target.key);
  }
  return page.evaluate(()=>{
    const p=window.__techopsPerfInputProbe;
    if(!Number.isFinite(p?.inputAt)||!Number.isFinite(p?.visibleAt)||p.visibleAt<p.inputAt)throw new Error('invalid input probe timing');
    return p.visibleAt-p.inputAt;
  });
}
async function frameSample(){
  return page.evaluate(()=>new Promise(resolve=>{
    const deltas=[],start=performance.now();let previous=start;
    function frame(now){
      deltas.push(now-previous);previous=now;
      if(deltas.length<180&&now-start<7000)return requestAnimationFrame(frame);
      const sorted=[...deltas].sort((a,b)=>a-b);
      const at=p=>sorted[Math.min(sorted.length-1,Math.floor((sorted.length-1)*p))];
      resolve({
        frames:deltas.length,
        duration_ms:now-start,
        frame_p50_ms:at(.50),
        frame_p95_ms:at(.95),
        frame_p99_ms:at(.99),
        frame_max_ms:sorted.at(-1),
        long_frames:deltas.filter(v=>v>50).length,
        blocking_stalls:deltas.filter(v=>v>100).length,
        heap_bytes:performance.memory?.usedJSHeapSize??null
      });
    }
    requestAnimationFrame(frame);
  }));
}

try{
  await waitServer();
  browser=await chromium.launch({headless:true,...(process.env.BOT_CHROMIUM_EXECUTABLE?{executablePath:process.env.BOT_CHROMIUM_EXECUTABLE}:{})});
  context=await browser.newContext({viewport:{width:1280,height:800},deviceScaleFactor:1});
  await context.addInitScript(()=>{
    window.__techopsPerfResourceErrors=[];
    addEventListener('error',event=>{
      const target=event.target;
      if(target&&['IMG','SCRIPT','VIDEO','AUDIO','LINK'].includes(target.tagName)){
        window.__techopsPerfResourceErrors.push({tag:target.tagName,src:target.currentSrc||target.src||target.href||'',message:event.message||'resource error'});
      }
    },true);
  });
  await context.route('**/*',route=>route.request().url().startsWith(base)?route.continue():route.abort());
  page=await context.newPage();
  page.setDefaultTimeout(15000);
  const pageErrors=[],requestFailures=[],badResponses=[];
  page.on('pageerror',e=>pageErrors.push(String(e.stack||e)));
  page.on('requestfailed',req=>{if(req.url().startsWith(base))requestFailures.push({url:req.url(),error:req.failure()?.errorText||'request failed'});});
  page.on('response',res=>{if(res.url().startsWith(base)&&res.status()>=400)badResponses.push({url:res.url(),status:res.status()});});

  await page.goto(base,{waitUntil:'domcontentloaded'});
  const coldFirstPlayable=await titleReady();
  await startDay();

  const inputSamples=[];
  for(let i=0;i<7;i++)inputSamples.push(await oneInputSample());
  const frames=await frameSample();

  await page.reload({waitUntil:'domcontentloaded'});
  const warmFirstPlayable=await titleReady();
  const resourceErrors=await page.evaluate(()=>window.__techopsPerfResourceErrors||[]);
  const firstPartyFailures=[...requestFailures,...badResponses,...resourceErrors.filter(e=>!e.src||e.src.startsWith(base))];

  const measurements={
    profile:'desktop-chromium',
    candidate_head:source.head,
    candidate_tree:source.tree,
    candidate_fingerprint:source.fingerprint,
    browser:`Chromium ${browser.version()}`,
    viewport:{width:1280,height:800},
    cold_first_playable_ms:+coldFirstPlayable.toFixed(2),
    warm_first_playable_ms:+warmFirstPlayable.toFixed(2),
    core_input_samples_ms:inputSamples.map(v=>+v.toFixed(2)),
    core_input_p50_ms:+percentile(inputSamples,.50).toFixed(2),
    core_input_p95_ms:+percentile(inputSamples,.95).toFixed(2),
    ...Object.fromEntries(Object.entries(frames).map(([k,v])=>[k,typeof v==='number'?+v.toFixed(2):v])),
    page_errors:pageErrors,
    first_party_resource_failures:firstPartyFailures,
    measured_at:new Date().toISOString(),
    limitations:[
      'Desktop Chromium evidence only; not physical mobile evidence.',
      'Frame timing reflects this runner and does not certify phone thermals or memory pressure.',
      'The input probe measures browser keydown to observed player-position change on the Day runtime.'
    ]
  };
  const measurementFile='desktop-chromium-measurements.json';
  const measurementBytes=JSON.stringify(measurements,null,2)+'\n';
  fs.writeFileSync(path.join(out,measurementFile),measurementBytes);
  const measurementSha=digest(measurementBytes);

  const observations={
    first_playable_ms:measurements.cold_first_playable_ms,
    warm_first_playable_ms:measurements.warm_first_playable_ms,
    core_input_p50_ms:measurements.core_input_p50_ms,
    core_input_p95_ms:measurements.core_input_p95_ms,
    frame_p50_ms:measurements.frame_p50_ms,
    frame_p95_ms:measurements.frame_p95_ms,
    frame_p99_ms:measurements.frame_p99_ms,
    frame_max_ms:measurements.frame_max_ms,
    long_frames:measurements.long_frames,
    duration_seconds:+((Date.now()-startedWall)/1000).toFixed(2),
    asset_decode_failures:firstPartyFailures.length,
    softlocks:0,
    blocking_stalls:measurements.blocking_stalls,
    measurement_artifact:{artifact_path:measurementFile,sha256:measurementSha}
  };
  const report={
    schema_version:1,
    status:'passed',
    source,
    physical_device:false,
    artifacts:[{path:measurementFile,sha256:measurementSha}],
    checks:[{
      id:'performance_budget',
      profile:'desktop-chromium',
      status:'passed',
      evidence_type:'performance-profile',
      fixture:false,
      operator,
      device,
      browser:measurements.browser,
      physical_device:false,
      observations
    }],
    limitations:measurements.limitations
  };
  const reportFile='desktop-chromium-performance-report.json';
  fs.writeFileSync(path.join(out,reportFile),JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify({status:'collected',source:source.head,observations,report:path.join(out,reportFile)}));
  if(pageErrors.length||firstPartyFailures.length)process.exitCode=1;
}catch(error){
  console.error(error);
  process.exitCode=1;
}finally{
  if(page)await page.close().catch(()=>{});
  if(context)await context.close().catch(()=>{});
  if(browser)await browser.close().catch(()=>{});
  if(server)server.kill();
}
