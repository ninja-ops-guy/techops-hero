/* Targeted production-page acceptance, not a complete story playthrough.
 * Explicit later-chapter/position fixtures isolate interactions; actual UI,
 * keyboard and Chromium touch events exercise the resulting behavior. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {spawn} from 'node:child_process';
import {chromium} from 'playwright';
const port=process.env.FIELD_PORT||'4197',base=process.env.FIELD_BASE_URL||`http://127.0.0.1:${port}/`;
const out=process.env.FIELD_OUT_DIR||'/tmp/techops-fieldcraft';fs.mkdirSync(out,{recursive:true});
const server=process.env.FIELD_BASE_URL?null:spawn('python3',['scripts/media_http_server.py','--port',port,'--bind','127.0.0.1'],{stdio:'ignore'});
const browser=await chromium.launch({headless:true});const reports=[];
try{
 for(let i=0;i<50;i++){try{if((await fetch(base)).ok)break;}catch{}await new Promise(r=>setTimeout(r,100));}
 for(const [profile,viewport,touch] of [['desktop',{width:1280,height:800},false],['portrait',{width:390,height:844},true],['landscape',{width:844,height:390},true]]){
  if(process.env.FIELD_PROFILE&&process.env.FIELD_PROFILE!==profile)continue;
  const context=await browser.newContext({viewport,hasTouch:touch,isMobile:touch});const page=await context.newPage();page.setDefaultTimeout(25000);
  await context.route('**/*',r=>r.request().url().startsWith(base)?r.continue():r.abort());
  const errors=[],report={profile,checks:[],errors,pass:false,fixtures:'Later-chapter prerequisites, chapter/room/objective positions, and one stationary combat opponent. No claim of native-story unlock or physical-device coverage.'};reports.push(report);
  page.on('pageerror',e=>errors.push(e.message));const check=x=>{report.checks.push(x);console.log(profile,x);};
  const option=text=>page.locator('#dlg-options button').filter({hasText:text}).first();
  async function press(locator){await locator.scrollIntoViewIfNeeded();if(touch)await locator.tap();else await locator.click();}
  async function fixture(id,room,step=0,x=150){
   await page.evaluate(({id,room,step,x})=>{
    if(TechOpsLivingWorldRuntime.active(NM))TechOpsLivingWorldRuntime.leave(false);
    closeDlg();const A=TechOpsLivingWorld,s=A.initial('standalone');s.done=A.Data.episodes.map(e=>e.id).filter(k=>k!==id);s.flags.waldo_invited=s.flags.waldo_visit_received=true;
    S.meta.livingWorld=s;NM.hp=100;S.paused=false;TechOpsLivingWorldRuntime.enter(id);s.active.room=room;s.active.step=step;s.active.x=x;s.active.y=396;TechOpsLivingWorldRuntime.enter(id);NM.enemies=[];NM.hp=100;
   },{id,room,step,x});await page.waitForFunction(()=>!S.inDialog&&TechOpsLivingWorldRuntime.active(NM));
  }
  async function close(){await press(option(/^(Resume|Return to the room|Stay in the room)$/));await page.waitForFunction(()=>!S.inDialog);}
  async function settings(){await press(page.locator('#field-tools'));await press(option('Comfort, controls and audio'));}
  async function moveTo(target){
   const cdp=touch?await context.newCDPSession(page):null;let count=0;
   while(count++<40){const x=await page.evaluate(()=>NM.x);if(Math.abs(x-target)<15)break;const right=x<target,ms=Math.min(220,Math.max(50,Math.abs(x-target)*2.5));
    if(touch){const b=await page.locator(right?'#dpad .d-right':'#dpad .d-left').boundingBox();assert(b,'visible touch movement');await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:b.x+b.width/2,y:b.y+b.height/2,id:1}]});await page.waitForTimeout(ms);await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});}
    else{await page.keyboard.down(right?'ArrowRight':'ArrowLeft');await page.waitForTimeout(ms);await page.keyboard.up(right?'ArrowRight':'ArrowLeft');}
    await page.waitForTimeout(100);
   }assert(Math.abs(await page.evaluate(()=>NM.x)-target)<25,'physical movement reaches the panel');if(cdp)await cdp.detach();
  }
  try{
   await page.goto(base);await page.waitForFunction(()=>window.__productionTitleReadiness?.ready&&!document.querySelector('#btn-start')?.disabled);
   await press(page.locator('#btn-nightcrawler'));await press(option(/Standard/));await press(option(/Take the Charger/));await page.locator('#v722-cine').waitFor({state:'visible'});await page.keyboard.press('Escape');
   await page.waitForFunction(()=>window.S?.nightMode&&!S.inDialog&&!window.__productionDesiredMode);
   await press(page.locator('#night-campaign'));await press(option(/Living World/));await press(option(/^Begin — The Route We Keep$/));await press(option(/^Enter this chapter$/));
   await moveTo(609);await press(page.locator('#field-tools'));await press(option(/^Read local cycle$/));assert.equal(await page.evaluate(()=>TechOpsFieldcraft.room(S.meta.livingWorld).scanned),true);await close();check('fresh title entry and physical movement reach a saved local scan');
   await page.keyboard.press('KeyC');await press(option(/^Optional quest notes$/));
   let notes=await page.locator('#dlg-text').innerText();assert(notes.includes('The Spare Key'));assert(!notes.includes('The Last Shift'));assert(!notes.includes('An Unfinished Song'));await press(option(/^Resume chapter$/));
   await moveTo(1560);await press(page.locator('#living-world-interact'));await press(option(/^Travel — Maintenance passage$/));await moveTo(339);await press(page.locator('#living-world-interact'));
   if(await option(/^The Spare Key$/).count())await press(option(/^The Spare Key$/));await press(option(/^Ask who may keep the spare$/));
   await page.waitForFunction(()=>document.getElementById('dlg-text').textContent.includes('next lead'));assert(!(await page.locator('#dlg-text').innerText()).includes('The Last Shift'));await press(option(/^Keep this moment$/));
   await page.keyboard.press('KeyC');await press(option(/^Optional quest notes$/));notes=await page.locator('#dlg-text').innerText();assert(notes.includes('maintenance worker'));assert(!notes.includes('The Last Shift'));
   await page.screenshot({path:`${out}/${profile}-optional-notes.png`});await press(option(/^Resume chapter$/));check('optional notes record a real interaction without revealing future sites or private viewpoints');
   await fixture('fracture','rear',1,609);
   await press(page.locator('#field-tools'));await press(option(/^Read local cycle$/));await close();await press(page.locator('#field-tools'));await press(option(/^Isolate task circuit$/));await close();
   assert.equal(await page.evaluate(()=>TechOpsLivingWorld.cycle(S.meta.livingWorld).task),'isolated');assert.equal(await page.evaluate(()=>S.meta.livingWorld.flags.fracture_local_support),undefined);check('task isolation changes the hazard without granting shelter support');
   await page.screenshot({path:`${out}/${profile}-isolated.png`});
   await page.keyboard.press('KeyC');const remaining=await page.evaluate(()=>TechOpsFieldcraft.room(S.meta.livingWorld).isolation);await page.waitForTimeout(250);assert.equal(await page.evaluate(()=>TechOpsFieldcraft.room(S.meta.livingWorld).isolation),remaining);await press(option(/^Resume —/));check('journal pauses the task clock');
   await fixture('fracture','rear',1,150);await press(page.locator('#field-tools'));await press(option(/^Choose equipment$/));await press(option(/^Equip — Route kit$/));await close();
   await moveTo(769);await press(page.locator('#field-tools'));await press(option(/^Power service platform$/));await close();assert.equal(await page.evaluate(()=>NM.platforms.filter(p=>p._fieldcraft).length),3);check('route kit adds a physical raised crossing');
   await page.evaluate(()=>{window.__storageBeforeFieldTest=localStorage.setItem;localStorage.setItem=function(k,v){if(k==='techops_nightcrawler_session_v1')throw new DOMException('Qualification storage failure','QuotaExceededError');return window.__storageBeforeFieldTest.call(this,k,v);};});
   await settings();await press(option(/^Combat: Gentle$/));await page.waitForFunction(()=>document.getElementById('dlg-name').textContent==='PROGRESS NOT SAVED');assert.equal(await page.evaluate(()=>S.meta.livingWorld.fieldcraft.damage),'standard');
   await page.evaluate(()=>{localStorage.setItem=window.__storageBeforeFieldTest;});await press(option(/^Keep playing/));check('failed preference save rolls back and reports the failure');
   await settings();await press(option(/^Combat: Gentle$/));await press(option(/^Machine timing: Relaxed$/));await press(option(/^Text size: 115%$/));await press(option(/^Text size: 130%$/));
   await page.screenshot({path:`${out}/${profile}-settings-130.png`});
   const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1);assert.equal(overflow,false,'text settings do not create horizontal page overflow');
   await press(option(/^Start field ambience$/));await page.waitForFunction(()=>TechOpsFieldScore.engaged()&&document.getElementById('dlg-name').textContent==='COMFORT / CONTROLS');await close();await page.waitForFunction(()=>TechOpsFieldScore.diagnostics().voices>0);check('explicit audio gesture starts the adaptive score');
   await page.keyboard.press('KeyC');await page.waitForFunction(()=>TechOpsFieldScore.diagnostics().voices===0);await press(option(/^Resume —/));await page.waitForFunction(()=>TechOpsFieldScore.diagnostics().voices>0);check('audio silences during dialogue and resumes without a burst');
   await page.evaluate(()=>setMusic(false));await page.waitForFunction(()=>TechOpsFieldScore.diagnostics().voices===0);assert.equal(await page.evaluate(()=>TechOpsFieldScore.isMuted()),true);await page.evaluate(()=>setMusic(true));check('existing master audio toggle controls field score');
   await settings();await press(option(/^Remap action controls$/));await press(option(/^PUNCH — E$/));await press(option(/^Q$/));await press(option(/^Back$/));await close();
   await page.keyboard.press('KeyE');assert.equal(await page.evaluate(()=>S.inDialog),false);await page.keyboard.press('KeyQ');await page.waitForFunction(()=>NM._nightCombat?.attack);check('action remap works and the freed legacy key cannot open dialogue');
   await page.keyboard.press('KeyC');await press(option(/^Save chapter and return to the street$/));assert.equal(await page.evaluate(()=>TechOpsFieldScore.engaged()),false);
   await press(page.locator('#night-campaign'));await press(option(/Living World/));await press(option(/^Resume — The Work Continues$/));assert.match(await page.locator('#dlg-text').innerText(),/Welcome back/);await press(option(/^Resume this chapter$/));
   assert.equal(await page.evaluate(()=>S.meta.livingWorld.fieldcraft.damage),'gentle');assert.equal(await page.evaluate(()=>TechOpsFieldcraft.room(S.meta.livingWorld).lift),true);check('chapter return restores equipment, comfort, raised route and viewpoint recap');
   await page.reload();await page.waitForFunction(()=>window.__productionTitleReadiness?.ready&&!document.querySelector('#btn-start')?.disabled);await press(page.locator('#btn-nightcrawler'));await page.waitForFunction(()=>!!window.__nightCheckpointResumed&&!!S.nightMode&&!S.inDialog);
   await press(page.locator('#night-campaign'));await press(option(/Living World/));await press(option(/^Resume — The Work Continues$/));await press(option(/^Resume this chapter$/));
   assert.equal(await page.evaluate(()=>S.meta.livingWorld.fieldcraft.bindings.punch),'KeyQ');assert.equal(await page.evaluate(()=>TechOpsFieldcraft.room(S.meta.livingWorld).lift),true);assert.equal(await page.evaluate(()=>TechOpsFieldScore.engaged()),false);check('full page reload restores remapping and room changes without audio autoplay');
   await page.locator('#field-tools').waitFor({state:'visible'});await page.locator('#v55-nmbtns').waitFor({state:'visible'});
   const bounds=await page.evaluate(()=>Object.fromEntries(['field-tools','living-world-interact','living-world-objective','dpad','v55-nmbtns'].map(id=>{const r=document.getElementById(id).getBoundingClientRect();return [id,{x:r.x,y:r.y,w:r.width,h:r.height}];})));
   const overlap=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
   assert(bounds['field-tools'].h>=44);assert(bounds['field-tools'].x>=0&&bounds['field-tools'].x+bounds['field-tools'].w<=viewport.width+1);
   for(const id of ['living-world-interact','v55-nmbtns',...(touch?['dpad']:[])])assert(!overlap(bounds['field-tools'],bounds[id]),'field controls must not overlap '+id);
   assert(bounds['living-world-objective'].y+bounds['living-world-objective'].h<viewport.height);report.bounds=bounds;check('field controls retain 44px targets and clear movement/combat controls');
   await fixture('iona_pressure','switch',1,1289);
   await page.evaluate(()=>{NM.platforms=[];NM.enemies=[{name:'Input fixture',kind:'guard',x:1340,y:392,w:30,h:38,hp:500,maxHp:500,alive:true,spd:0,dmg:0,windup:0,cd:999,cash:[0,0]}];});
   if(touch){const cdp=await context.newCDPSession(page),up=await page.locator('#dpad .d-up').boundingBox(),kick=await page.locator('#night-input-kick').boundingBox();assert(up&&kick);const first={x:up.x+up.width/2,y:up.y+up.height/2,id:1},second={x:kick.x+kick.width/2,y:kick.y+kick.height/2,id:2};await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[first]});await page.waitForTimeout(50);await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[first,second]});await page.waitForTimeout(70);await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await cdp.detach();}
   else{await page.keyboard.down('ArrowUp');await page.keyboard.press('KeyE');await page.keyboard.up('ArrowUp');}
   assert.equal(await page.evaluate(()=>S.inDialog),false);assert.ok(await page.evaluate(()=>NM._nightCombat?.attack||NM._nightCombat?.events.length));check(touch?'simultaneous touch aim and attack near an objective preserves combat':'directional Light beside an objective preserves combat');
   await page.screenshot({path:`${out}/${profile}-combat.png`});
   await settings();await press(option(/^Combat: Gentle$/));await close();await page.evaluate(()=>{TechOpsNightCombat.cancel(NM);delete NM._nightCombat;NM.hp=100;NM.ifr=0;NM.block=false;NM.y=396;NM.onGround=true;NM.enemies=[{name:'Damage fixture',kind:'guard',x:NM.x+22,y:392,w:30,h:38,hp:500,maxHp:500,alive:true,spd:0,dmg:8,windup:26,cd:0,cash:[0,0]}];});await page.waitForFunction(()=>NM.hp<100);assert.equal(await page.evaluate(()=>NM.hp),96);check('gentle combat halves a real incoming melee hit before defeat handling');
   await fixture('iona_pressure','switch',1,150);await press(page.locator('#field-tools'));await press(option(/^Choose equipment$/));await press(option(/^Equip — Route kit$/));await close();await moveTo(1419);await press(page.locator('#field-tools'));await press(option(/^Start diversion motor$/));await close();await page.evaluate(()=>{NM.x=600;NM.enemies=[{name:'Diversion fixture',kind:'guard',_livingEncounter:'fixture',x:1000,y:392,w:30,h:38,hp:36,maxHp:36,alive:true,spd:.65,dmg:4,windup:0,cd:0,cash:[0,0]}];});await page.waitForFunction(()=>NM.enemies[0].x>1005);assert.equal(await page.evaluate(()=>S.meta.livingWorld.active.step),1);check('a local security construct follows the motor rather than the player');
   await fixture('iona_local','room',4,949);await press(page.locator('#living-world-interact'));if(await option(/^Stay for a rehearsal$/).isVisible())await press(option(/^Stay for a rehearsal$/));
   await press(option(/^Enable ambience and drum sounds$/));await page.waitForFunction(()=>TechOpsFieldScore.engaged()&&document.getElementById('dlg-name').textContent==='Stay for a rehearsal');
   for(const label of ['Kick','Snare','Tom','Hat'])await press(option(new RegExp('^'+label+'$')));await press(option(/^Play this take$/));await page.waitForFunction(()=>TechOpsFieldScore.diagnostics().auditions>0);await page.waitForTimeout(100);assert.ok(await page.evaluate(()=>TechOpsFieldScore.diagnostics().auditions>0));check('rehearsal plays back the private pattern while background music remains paused');await press(option(/^Keep this take$/));assert.deepEqual(await page.evaluate(()=>S.meta.livingWorld.active.fieldcraft.moments.rhythm),[0,1,2,3]);assert.equal(await page.evaluate(()=>S.meta.livingWorld.flags.song_shared),undefined);check('optional rehearsal persists privately with no quest reward');
   await fixture('fracture','rear',1,609);await page.evaluate(()=>{S.meta.livingWorld.active.variant=0;S.meta.livingWorld.active.elapsed=6;});await press(page.locator('#field-tools'));await press(option(/^Try a quick bypass$/));await close();assert.equal(await page.evaluate(()=>TechOpsFieldcraft.room(S.meta.livingWorld).detour),true);check('failed live-cycle bypass opens the alternate walkway');
   await page.evaluate(()=>{TechOpsLivingWorldRuntime.onDefeat();});await press(option(/^Recover via the service walkway$/));assert.equal(await page.evaluate(()=>NM.hp),40);assert.ok(await page.evaluate(()=>NM.platforms.some(p=>p._fieldcraft)));check('service recovery retains the chapter and creates a playable raised approach');
   await fixture('low_return','workshop',0,600);await page.waitForFunction(()=>TechOpsIonaNightwalker.warm());
   const startCompanion=await page.evaluate(()=>NM._livingWorld.staging.x);await moveTo(850);await page.waitForTimeout(350);assert.ok(await page.evaluate(x=>NM._livingWorld.staging.x>x,startCompanion));assert.equal(await page.evaluate(()=>TechOpsLivingWorldRuntime.viewpoint(NM)),'k');assert.notEqual(await page.evaluate(()=>TechOpsNightCombat.actor(NM)),'iona');assert.equal(await page.evaluate(()=>S.meta.livingWorld.active.escort),null);check('Iona follows K through ordinary movement without becoming the controlled actor or a rescue escort');
   await page.screenshot({path:`${out}/${profile}-iona-with-k.png`});
   await page.keyboard.press('KeyC');const pausedCompanion=await page.evaluate(()=>NM._livingWorld.staging.x);await page.waitForTimeout(300);assert.equal(await page.evaluate(()=>NM._livingWorld.staging.x),pausedCompanion);await press(option(/^Resume —/));await moveTo(650);assert.equal(await page.evaluate(()=>NM._livingWorld.staging.face),-1);check('companion motion pauses in menus and reverses with the walking direction');
   await moveTo(1560);await press(page.locator('#living-world-interact'));await press(option(/^Travel — Rehearsal street \/ return$/));assert.equal(await page.evaluate(()=>S.meta.livingWorld.active.room),'rehearsal');assert.ok(await page.evaluate(()=>Math.abs(NM.x-NM._livingWorld.staging.x)<100));check('a normal room transition stages both established travelers at the receiving end');
   await page.keyboard.press('KeyC');await press(option(/^Save chapter and return to the street$/));assert.equal(await page.evaluate(()=>NM._livingWorld?.staging),undefined);await press(page.locator('#night-campaign'));await press(option(/Living World/));await press(option(/^Resume — The Streets We Remember$/));await press(option(/^Resume this chapter$/));assert.equal(await page.evaluate(()=>S.meta.livingWorld.active.room),'rehearsal');assert.ok(await page.evaluate(()=>NM._livingWorld.staging));check('save and resume restore the chapter and restage Iona without leaking the companion into the street');
   await fixture('factory_return','compute',2,1230);await page.waitForTimeout(500);await page.screenshot({path:`${out}/${profile}-k-rescue.png`});
   await fixture('factory_return','return',3,755);const careBefore=await page.evaluate(()=>JSON.stringify({flags:S.meta.livingWorld.flags,knowledge:S.meta.livingWorld.knowledge,step:S.meta.livingWorld.active.step}));await page.screenshot({path:`${out}/${profile}-billy-care.png`});await press(page.locator('#living-world-interact'));if(await option(/^Check Billy’s care watch$/).isVisible())await press(option(/^Check Billy’s care watch$/));await page.waitForFunction(()=>document.getElementById('dlg-text').textContent.includes('one Billy'));assert.equal(await page.evaluate(()=>JSON.stringify({flags:S.meta.livingWorld.flags,knowledge:S.meta.livingWorld.knowledge,step:S.meta.livingWorld.active.step})),careBefore);await close();check('Billy has a separate visible care station whose inspection grants no progress or private records');
   await fixture('factory_return','return',1,659);assert.notEqual(await page.evaluate(()=>TechOpsLivingWorldRuntime.nearest()?.id),'billy-care');assert.equal(await page.evaluate(()=>NM._livingWorld.staging),undefined);check('care inspection is staged after the rescue and Iona is absent from unrelated viewpoints');
   assert.equal(await page.evaluate(()=>localStorage.getItem('techops_save')),null);assert.deepEqual(errors,[]);report.pass=true;
  }catch(error){report.error=String(error.stack);await page.screenshot({path:`${out}/${profile}-failure.png`}).catch(()=>{});throw error;}
  finally{fs.writeFileSync(`${out}/${profile}-report.json`,JSON.stringify(report,null,2));await context.close();}
 }
}finally{fs.writeFileSync(`${out}/summary.json`,JSON.stringify(reports,null,2));await browser.close();if(server)server.kill();}
