#!/usr/bin/env node
// Production-page smoke acceptance. Only the isolated codec case injects a fault;
// browser keyboard/touch events drive all gameplay. This does not certify a phone.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {chromium} from 'playwright';
import {sourceIdentity,digest} from './quality_release_receipt.mjs';

const port=Number(process.env.QUALITY_PORT||4197),base=process.env.QUALITY_BASE_URL||`http://127.0.0.1:${port}/`;
const out=path.resolve(process.env.QUALITY_OUT_DIR||'/tmp/techops-quality-acceptance');
fs.mkdirSync(out,{recursive:true});
const report={schema_version:1,status:'running',source:sourceIdentity(),physical_device:false,codec_license:'unverified',checks:[],profiles:[],artifacts:[],limitations:['Emulated viewport and touch are not physical-device evidence.','A bounded opening and recovery run is not a complete campaign playthrough.','Frame samples measure this runner only; they do not certify phone thermals or sustained performance.']};
const server=process.env.QUALITY_BASE_URL?null:spawn('python3',['scripts/media_http_server.py','--port',String(port),'--bind','127.0.0.1'],{stdio:'ignore'});
let browser;
const profiles=[{id:'chromium-desktop',viewport:{width:1280,height:800},hasTouch:false},{id:'chromium-portrait',viewport:{width:390,height:844},hasTouch:true},{id:'chromium-landscape',viewport:{width:844,height:390},hasTouch:true}];
const selected=process.env.QUALITY_PROFILES?.split(',');
const record=(id,p,observations,evidence_type='browser-input')=>report.checks.push({id,profile:p.id,status:'passed',evidence_type,fixture:evidence_type==='fault-injection',observations});
const screenshot=async(page,name)=>{const file=`${name}.png`;await page.screenshot({path:path.join(out,file)});report.artifacts.push({path:file,sha256:digest(fs.readFileSync(path.join(out,file)))});};
async function title(page){await page.waitForFunction(()=>window.__productionTitleReadiness?.ready===true&&!document.querySelector('#btn-start')?.disabled,null,{timeout:30000});}
async function click(page,locator,touch=false){
  await locator.waitFor({state:'visible'});await locator.scrollIntoViewIfNeeded();
  const hit=await locator.evaluate(el=>{const r=el.getBoundingClientRect(),x=r.x+r.width/2,y=r.y+r.height/2,top=document.elementFromPoint(x,y);return {reachable:!!top&&(top===el||el.contains(top)),width:r.width,height:r.height,top:top?.id||top?.tagName,label:el.getAttribute('aria-label')||el.textContent};});
  assert.ok(hit.reachable,`Occluded action ${hit.label}: hit ${hit.top}`);
  assert.ok(hit.width>0&&hit.height>0,'Action must have nonempty rendered bounds');
  if(touch)assert.ok(hit.width>=44&&hit.height>=44,`Touch action is smaller than 44px: ${hit.label} (${hit.width} × ${hit.height})`);
  if(touch)await locator.tap();else await locator.click();
  return hit;
}
const option=(page,text)=>page.locator('#dlg-options button').filter({hasText:text}).first();
async function freshPage(p){
  const context=await browser.newContext({viewport:p.viewport,hasTouch:p.hasTouch,deviceScaleFactor:1});
  await context.route('**/*',route=>route.request().url().startsWith(base)?route.continue():route.abort());
  const page=await context.newPage(),errors=[];page.setDefaultTimeout(15000);page.on('pageerror',e=>errors.push(String(e.stack||e)));
  await page.goto(base,{waitUntil:'domcontentloaded'});await title(page);
  return {context,page,errors};
}
async function startDay(page,p){
  await click(page,page.locator('#btn-start'),p.hasTouch);
  await click(page,option(page,/Standard/),p.hasTouch);
  await click(page,option(page,/Clock in/),p.hasTouch);
  await page.waitForFunction(()=>window.S?.map&&!S.inDialog);
}
async function walkToStandup(page){
  // Observe the map to choose paths; movement itself always uses real key edges.
  for(let step=0;step<140;step++){
    const next=await page.evaluate(()=>{
      const target=S.meta.campaignAct1Native.standup,start={x:S.px,y:S.py};
      if(Math.abs(start.x-target.x)+Math.abs(start.y-target.y)<=1)return {done:true};
      const queue=[{...start,first:null}],seen=new Set([`${start.x},${start.y}`]);
      for(let i=0;i<queue.length;i++){const c=queue[i];for(const [dx,dy,key]of [[1,0,'ArrowRight'],[-1,0,'ArrowLeft'],[0,1,'ArrowDown'],[0,-1,'ArrowUp']]){
        const x=c.x+dx,y=c.y+dy,k=`${x},${y}`;if(seen.has(k)||S.map[y]?.[x]!==0||S.npcs.some(n=>n.x===x&&n.y===y))continue;
        const first=c.first||{key,x,y};if(Math.abs(x-target.x)+Math.abs(y-target.y)<=1)return first;seen.add(k);queue.push({x,y,first});
      }}return null;
    });
    assert.ok(next,'No reachable standup path');if(next.done)return;
    await page.keyboard.down(next.key);
    try{await page.waitForFunction(({x,y})=>S.px===x&&S.py===y,next,{timeout:1600});}
    catch(error){
      const state=await page.evaluate(({x,y,key})=>({px:S.px,py:S.py,room:S.room,inDialog:S.inDialog,panel:typeof panelOpen!=='undefined'&&panelOpen,shell:TechOpsModeShell.health(),keys:typeof keys!=='undefined'?keys:null,targetOccupied:S.npcs.some(n=>n.x===x&&n.y===y),keyHeld:typeof keys!=='undefined'&&keys[key.toLowerCase()]}),next);
      // Ambient NPCs may enter a previously free tile. Replan around observed
      // occupancy only; lost input or a blocked modal remains a test failure.
      if(state.targetOccupied&&state.keyHeld&&!state.inDialog&&!state.panel)continue;
      throw new Error('Day movement did not reach '+JSON.stringify(next)+'; '+JSON.stringify(state),{cause:error});
    }
    finally{await page.keyboard.up(next.key);}
  }
  throw Error('Standup walk exceeded bounded route');
}
async function day(page,p){
  await startDay(page,p);await walkToStandup(page);await page.keyboard.press('e');
  await click(page,option(page,/Assign queue: Mike/),p.hasTouch);
  await click(page,option(page,/Open workstation/),p.hasTouch);
  await page.waitForFunction(()=>document.querySelector('#dlg-name')?.textContent.includes('WORKSTATION'));
  await click(page,option(page,/^MUSIC$/),p.hasTouch);
  await click(page,option(page,/Play Red in the Mirror/),p.hasTouch);
  await click(page,option(page,/Back to desktop/),p.hasTouch);
  await page.waitForFunction(()=>document.querySelector('#dlg-name')?.textContent==='MIKE // WORKSTATION');
  await screenshot(page,`${p.id}-workstation`);
  await click(page,option(page,/Exit workstation/),p.hasTouch);
  // Observe the automatic checkpoint; never manufacture player state or progress.
  const checkpoint=await page.evaluate(()=>JSON.parse(localStorage.getItem(TechOpsSaveKeys.dayCheckpoint)));
  assert.ok(checkpoint?.state?.map,'Day startup must create a durable checkpoint');
  const campaign=await page.evaluate(()=>TechOpsCampaign.load(localStorage));
  assert.equal(campaign.flags.red_in_mirror_heard,true);
  await page.reload({waitUntil:'domcontentloaded'});await title(page);await click(page,page.locator('#btn-continue'),p.hasTouch);
  await page.waitForFunction(()=>window.S?.map&&!S.inDialog);
  const resumed=await page.evaluate(()=>({day:S.day,px:S.px,py:S.py,budget:S.budget,clock:S.clock,ticketsAlias:S.tickets.every(t=>S.npcs.includes(t)),music:TechOpsCampaign.load(localStorage).flags.red_in_mirror_heard,shell:TechOpsModeShell.health().mode}));
  for(const key of ['day','px','py','budget','clock'])assert.equal(resumed[key],checkpoint.state[key],`Day checkpoint ${key}`);
  assert.equal(resumed.ticketsAlias,true);assert.equal(resumed.music,true);assert.equal(resumed.shell,'day');
  record('day_resume',p,{resumed,checkpoint_saved_at:checkpoint.savedAt,entry:'Actual keyboard path to standup; real dialog hit targets; automatic startup checkpoint'});
  await screenshot(page,`${p.id}-day-resumed`);
}
async function night(page,p){
  await page.reload({waitUntil:'domcontentloaded'});await title(page);
  const campaignSave=await page.evaluate(()=>localStorage.getItem('techops_save'));
  await click(page,page.locator('#btn-nightcrawler'),p.hasTouch);
  const deadline=Date.now()+30000;
  while(Date.now()<deadline){
    if(await page.evaluate(()=>!!window.S?.nightMode&&!S.inDialog&&!window.v722?.active()&&!window.__productionDesiredMode))break;
    if(await page.evaluate(()=>!!window.v722?.active()))await page.keyboard.press('Escape');
    else {const choices=page.locator('#dlg-options button');if(await choices.first().isVisible().catch(()=>false)){const standard=choices.filter({hasText:/Standard/}).first();await click(page,await standard.isVisible()?standard:choices.first(),p.hasTouch);}}
    await page.waitForTimeout(100);
  }
  await page.waitForFunction(()=>window.S?.nightMode&&!S.inDialog&&!window.__productionDesiredMode);
  const start=await page.evaluate(()=>NM.x);await page.keyboard.down('ArrowRight');
  try{await page.waitForFunction(x=>NM.x>x+20,start,{timeout:4000});}finally{await page.keyboard.up('ArrowRight');}
  await click(page,page.locator('#night-campaign'),p.hasTouch);await page.waitForFunction(()=>S.inDialog);
  const snapshot=await page.evaluate(()=>({x:NM.x,y:NM.y,hp:NM.hp,district:NM.district,street:NM.street,clock:S.clock,cash:NM.cash,kills:NM.kills,enemies:NM.enemies.map(e=>({x:e.x,y:e.y,hp:e.hp,alive:e.alive}))}));
  await page.reload({waitUntil:'domcontentloaded'});await title(page);
  const saved=await page.evaluate(()=>TechOpsNightRuntime.checkpointStatus());assert.equal(saved.status,'ready');
  assert.match(await page.locator('#btn-nightcrawler').innerText(),/RESUME NIGHT/i);
  await click(page,page.locator('#btn-nightcrawler'),p.hasTouch);
  await page.waitForFunction(()=>!!window.__nightCheckpointResumed&&!!window.S?.nightMode);
  const resumed=await page.evaluate(()=>({x:NM.x,hp:NM.hp,district:NM.district,street:NM.street,clock:S.clock,cash:NM.cash,kills:NM.kills,inDialog:S.inDialog,daySave:localStorage.getItem('techops_save'),savedAt:__nightCheckpointResumed.savedAt}));
  for(const key of ['x','hp','district','street','cash','kills'])assert.equal(resumed[key],snapshot[key],`Night resume ${key}`);
  assert.equal(resumed.daySave,campaignSave);assert.equal(resumed.inDialog,false);assert.equal(resumed.savedAt,saved.savedAt);
  assert.deepEqual(saved.state.nightMode.enemies.map(e=>({x:e.x,y:e.y,hp:e.hp,alive:e.alive})),snapshot.enemies,'Interrupted checkpoint must preserve enemy world');
  record('night_resume',p,{before:snapshot,after:resumed,checkpoint_saved_at:saved.savedAt,campaign_isolation:true});
  await screenshot(page,`${p.id}-night-resumed`);
  const performance=await page.evaluate(()=>new Promise(resolve=>{const times=[],started=performance.now();let previous=started;function frame(now){times.push(now-previous);previous=now;if(times.length<120&&now-started<5000)return requestAnimationFrame(frame);times.sort((a,b)=>a-b);resolve({frames:times.length,duration_ms:now-started,p50_ms:times[Math.floor(times.length*.5)],p95_ms:times[Math.floor(times.length*.95)],max_ms:times.at(-1),long_frames:times.filter(t=>t>50).length,heap_bytes:performance.memory?.usedJSHeapSize??null});}requestAnimationFrame(frame);}));
  return performance;
}
async function dogs(p){
  const {context,page,errors}=await freshPage(p);
  try{
    await click(page,page.locator('#btn-v736'),p.hasTouch);
    await page.locator('#gd-mode-solo').waitFor({state:'visible'});
    assert.equal(await page.locator('#gd-mode-local').isDisabled(),p.hasTouch);
    const note=await page.locator('#gd-local-device-note').textContent();if(p.hasTouch)assert.match(note,/physical keyboard/i);
    await click(page,page.locator('#gd-mode-cancel'),p.hasTouch);
    await page.waitForFunction(()=>!document.querySelector('#good-dogs-mode-select'));
    await click(page,page.locator('#btn-v736'),p.hasTouch);
    await screenshot(page,`${p.id}-dogs-selector`);
    await click(page,page.locator(p.hasTouch?'#gd-mode-solo':'#gd-mode-local'),p.hasTouch);
    for(let shot=1;shot<=3;shot++){
      await page.waitForFunction(n=>window.__goodDogsHomeScene?.shot===n,shot);
      if(shot===1)await screenshot(page,`${p.id}-dogs-prologue`);
      await click(page,page.locator('#gd-home-next'),p.hasTouch);
    }
    await page.waitForFunction(()=>window.NM?._v736?.m===1&&!window.S?.inDialog);
    const mode=await page.evaluate(()=>TechOpsGoodDogsCoop.mode());assert.equal(mode,p.hasTouch?'solo':'local');assert.deepEqual(errors,[]);
    record('good_dogs_selector',p,{mode,touch_only_local_disabled:p.hasTouch,cancellation_recovered:true,prologue_shots:3,note});
    await screenshot(page,`${p.id}-dogs-property`);
  }finally{await context.close();}
}
async function codec(p){
  const {context,page,errors}=await freshPage(p);
  try{
    // Explicit negative-capability fixture, isolated from gameplay acceptance.
    await page.evaluate(()=>{HTMLMediaElement.prototype.canPlayType=()=>'';if(window.MediaSource)MediaSource.isTypeSupported=()=>false;window.__qualityWrites=[];window.__qualityResult=null;GoodDogsCutscenes.play('GD_CUT_01',{onStateWrite:r=>__qualityWrites.push(r)}).then(r=>__qualityResult=r);});
    await page.waitForFunction(()=>window.__goodDogsCutsceneNeedsGesture?.reason==='codec-unsupported');
    assert.equal(await page.evaluate(()=>!!document.querySelector('.gd-film-video')?.getAttribute('src')),false);
    assert.equal(await page.evaluate(()=>__qualityWrites.length),0);
    await screenshot(page,`${p.id}-codec-recovery`);
    const skip=page.locator('.gd-film-skip');await skip.scrollIntoViewIfNeeded();
    await skip.dblclick();await page.keyboard.press('Escape');
    await page.waitForFunction(()=>window.__qualityResult?.status==='USER_SKIPPED');
    const writes=await page.evaluate(()=>__qualityWrites);assert.equal(writes.length,1);assert.equal(writes[0].status,'USER_SKIPPED');assert.deepEqual(errors,[]);
    record('cinematic_recovery',p,{capability:'both probes false',source_assigned:false,writes,late_escape_did_not_repeat:true},'fault-injection');
  }finally{await context.close();}
}
try{
  let ready=false;for(let attempt=0;attempt<100;attempt++){try{if((await fetch(base)).ok){ready=true;break;}}catch{}await new Promise(r=>setTimeout(r,100));}assert.ok(ready,'Local media server not ready');
  browser=await chromium.launch({headless:true,...(process.env.BOT_CHROMIUM_EXECUTABLE?{executablePath:process.env.BOT_CHROMIUM_EXECUTABLE}:{})});report.browser_version=browser.version();
  for(const p of profiles.filter(p=>!selected||selected.includes(p.id))){
    const entry={...p,status:'running'};report.profiles.push(entry);const {context,page,errors}=await freshPage(p);
    try{
      const cards=await page.locator('[data-production-title-card]').evaluateAll(nodes=>nodes.filter(n=>!n.classList.contains('hidden')).map(n=>({id:n.id,disabled:n.disabled,label:n.getAttribute('aria-label')})));
      assert.deepEqual(cards.map(c=>c.id),['btn-start','btn-v736','btn-nightcrawler']);assert.ok(cards.every(c=>!c.disabled&&c.label));
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,'Title must not overflow horizontally');
      await screenshot(page,`${p.id}-title`);record('title_routes',p,{cards,viewport:p.viewport});
      await day(page,p);entry.performance=await night(page,p);assert.deepEqual(errors,[]);
      await dogs(p);await codec(p);entry.status='passed';
    }catch(error){entry.status='failed';entry.failure=String(error.stack||error);entry.errors=errors;await screenshot(page,`${p.id}-failure`).catch(()=>{});}
    finally{await context.close();console.log(JSON.stringify(entry));}
  }
  assert.ok(report.profiles.length,'No selected quality profiles');
  assert.ok(report.profiles.every(p=>p.status==='passed'),'One or more quality profiles failed');
  assert.equal(sourceIdentity().fingerprint,report.source.fingerprint,'Source changed during acceptance; rerun on a stable candidate');
  report.status='passed';
}catch(error){report.status='failed';report.failure=String(error.stack||error);process.exitCode=1;}
finally{
  if(browser)await browser.close();if(server)server.kill();
  report.finished_at=new Date().toISOString();fs.writeFileSync(path.join(out,'quality-report.json'),JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify({status:report.status,checks:report.checks.length,profiles:report.profiles.map(p=>({id:p.id,status:p.status})),report:path.join(out,'quality-report.json'),failure:report.failure}));
}
