// Fixture-assisted regression, not unassisted campaign or physical-device acceptance.
// Encounter/closure fixtures supply initial conditions only. Menu choices, fighting,
// driving, home return, day progression and follow-up completion use real UI controls.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {chromium,webkit,devices} from 'playwright';
const BASE=process.env.BOT_BASE_URL||'http://127.0.0.1:4173/';
const OUT=process.env.BOT_OUT_DIR||'runtime-bot-artifacts';fs.mkdirSync(OUT,{recursive:true});
const requested=(process.env.BOT_BROWSERS||'chromium,webkit').split(',');
const profiles=[...requested.map(name=>({name,type:name==='webkit'?webkit:chromium,mobile:name==='webkit'})),...(process.env.BOT_MOBILE_CHROMIUM==='1'?[{name:'chromium-mobile',type:chromium,mobile:true}]:[])];
const results=[];
for(const profile of profiles){
 const launch={headless:true};if(profile.type===chromium){if(process.env.BOT_CHROMIUM_EXECUTABLE)launch.executablePath=process.env.BOT_CHROMIUM_EXECUTABLE;else if(process.env.BOT_CHROMIUM_CHANNEL)launch.channel=process.env.BOT_CHROMIUM_CHANNEL;}
 let browser,context,page;const errors=[],checks=[];const name=profile.name;
 const log=(check,detail)=>{checks.push({check,...detail});console.log(JSON.stringify({browser:name,check,...detail}));};
 const shot=label=>page.screenshot({path:path.join(OUT,`gameplay-quality-${name}-${label}.png`)});
 const click=label=>page.getByRole('button',{name:label,exact:typeof label==='string'}).first().click();
 try{
  browser=await profile.type.launch(launch);context=await browser.newContext(profile.mobile?{...devices['iPhone 13']}:{viewport:{width:1440,height:900}});page=await context.newPage();page.setDefaultTimeout(18000);page.on('pageerror',e=>errors.push(String(e.stack||e)));
  await page.goto(BASE,{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>window.TechOpsProductionBootstrap?.ready()&&window.TechOpsNightSession&&window.TechOpsOfficeMemory&&document.querySelector('#btn-nightcrawler'));
  await page.locator('#btn-nightcrawler').click();
  const deadline=Date.now()+16000;
  while(Date.now()<deadline){
   if(await page.evaluate(()=>!!(window.NM&&window.S?.nightMode&&!window.S.inDialog)))break;
   for(const label of [/Standard/i,/BEGIN THE INCIDENT/i]){const b=page.getByRole('button',{name:label}).first();if(await b.isVisible().catch(()=>false))await b.click();}
   if(await page.evaluate(()=>!!window.v722?.active?.()))await page.keyboard.press('Escape');
   await page.waitForTimeout(120);
  }
  await page.waitForFunction(()=>window.NM&&window.S?.nightMode&&!window.S.inDialog&&!window.NM._v736);
  log('night-title-route',{phase:await page.evaluate(()=>window.__productionNightLaunchPhase)});
  // Keep one harmless opponent in reach. No direct attack or progression calls.
  await page.evaluate(()=>{const n=NM;TechOpsNightCombat.cancel(n);delete n._nightCombat;Object.assign(n,{x:650,y:396,w:22,h:34,vx:0,vy:0,onGround:true,hp:100,ifr:0,block:false,clear:false,hitStop:0,jHeld:false,cam:200});n.platforms=[];n.enemies=[{x:700,y:396,w:24,h:34,hp:500,maxHp:500,kind:'thug',name:'Regression sparring fixture',alive:true,dmg:0,spd:0,windup:0,hitT:0,cd:999,cash:[0,0]}];});
  const muted=await page.evaluate(()=>typeof sfxMuted!=='undefined'&&sfxMuted);if(muted)await page.locator('#btn-music').click();
  const musicBefore=await page.evaluate(()=>Array.from(document.querySelectorAll('audio,iframe')).map(e=>e.getAttribute('src')));
  await page.keyboard.press('KeyE');await page.waitForFunction(()=>window.__combatAudioLast?.cue==='jab');
  const audio=await page.evaluate(()=>({last:__combatAudioLast,state:AC.state,hp:NM.enemies[0].hp,events:NM._nightCombat.events.map(e=>e.type)}));assert.equal(audio.state,'running');assert.ok(audio.hp<500);assert.ok(audio.events.includes('jab'));
  assert.deepEqual(await page.evaluate(()=>Array.from(document.querySelectorAll('audio,iframe')).map(e=>e.getAttribute('src'))),musicBefore);log('contact-sound-preserves-music',{cue:audio.last.cue,audioState:audio.state});await shot('combat');
  // Settings pause the entire provider chain, not only the new combat service.
  await page.locator('#v67-gear').click();const paused=await page.evaluate(()=>({clock:S.clock,x:NM.x,hp:NM.enemies[0].hp,played:__combatAudioLast.played}));
  await page.keyboard.press('KeyE');await page.keyboard.press('KeyS');await page.waitForTimeout(4200);
  const afterPause=await page.evaluate(()=>({clock:S.clock,x:NM.x,hp:NM.enemies[0].hp,played:__combatAudioLast.played}));assert.deepEqual(afterPause,paused);
  await page.locator('#v67s-sfx').focus();await page.keyboard.press('Home');await page.locator('#v67-set-x').click();await page.keyboard.press('KeyE');await page.waitForTimeout(350);assert.equal(await page.evaluate(()=>__combatAudioLast.played),paused.played);
  await page.locator('#v67-gear').click();await page.locator('#v67s-sfx').focus();await page.keyboard.press('End');await page.locator('#v67-set-x').click();log('settings-pause-and-sfx-volume',{pausedSeconds:4.2});
  const clock=await page.evaluate(()=>S.clock);await page.waitForFunction(c=>S.clock>c,clock);log('continuous-night-clock',{before:clock,after:await page.evaluate(()=>S.clock)});
  // Walk back to the car, select Home, then approach the house using normal keys.
  await page.keyboard.down('ArrowLeft');await page.waitForFunction(()=>NM.x<130);await page.keyboard.up('ArrowLeft');await page.keyboard.press('KeyE');await click(/HOME STREET/);await page.waitForFunction(()=>NM.district==='home'&&!NM.drive);
  await page.keyboard.down('ArrowRight');await page.waitForFunction(()=>NM.x>=1240||S.inDialog);await page.keyboard.up('ArrowRight');if(!await page.evaluate(()=>S.inDialog))await page.keyboard.press('KeyE');
  await click('Stay out a little longer');assert.equal(await page.evaluate(()=>!!S.nightMode),true);await page.keyboard.press('KeyE');await click('Rest until morning');await page.locator('#night-home-transition').waitFor({state:'visible'});await shot('home-transition');
  if(profile.mobile)await click('Skip to shift recap');
  await page.waitForFunction(()=>!S.nightMode&&!window.NM);await page.locator('#eod').waitFor({state:'visible'});
  const home=await page.evaluate(()=>({active:window.__productionActiveMode,char:S.meta._char,selected:localStorage.getItem('techops_char'),nightClass:document.body.classList.contains('techops-night-streets'),record:S.meta.lastNight}));
  assert.equal(home.active,null);assert.notEqual(home.char,'nightcrawler');assert.notEqual(home.selected,'nightcrawler');assert.equal(home.nightClass,false);assert.ok(home.record);log('home-settlement-and-router-release',{record:home.record,skipped:profile.mobile});await shot('shift-recap');
  const dayBefore=await page.evaluate(()=>S.day);await page.locator('#eod-rewards button').first().click();await page.waitForFunction(day=>S.day>day&&!S.nightMode,dayBefore);await page.waitForTimeout(700);assert.equal(await page.evaluate(()=>!!S.nightMode),false);log('next-workday',{day:await page.evaluate(()=>S.day)});
  // An ordinary closure fixture becomes due today; no story unlocks are granted.
  const fixtureId=await page.evaluate(()=>{const c=TechOpsCampaign.load(localStorage),r=TechOpsCampaign.recordOfficeClosure(c,{kind:'procedural',id:'browser-printer',day:S.day-1,title:'Printer Follow-up',typeId:'printer',ownerId:'Amit',department:'Shipping',humanNeed:'Print the real shipping label.',verification:'partial',humanOutcome:'unknown',pendingRepeat:true});TechOpsCampaign.save(c,localStorage);return r.id;});
  // Let existing opening/standup presentation settle before using the real desk.
  if(await page.evaluate(()=>!!window.v725?.active?.()))await page.keyboard.press('Escape');
  const dlg=page.locator('#dialogue');if(await dlg.isVisible()){const closeButton=dlg.getByRole('button',{name:/Back|Close|Continue|Got it|Clock|Let's go/i}).first();if(await closeButton.isVisible().catch(()=>false))await closeButton.click();}
  await page.evaluate(()=>{S.px=MIKE_DESK.x;S.py=MIKE_DESK.y+1;});await page.keyboard.press('KeyE');await click('Shift handoff / follow-up work');await click(/Printer Follow-up/);await click('Talk to the requester');await click('Check the technical service');await click('Watch the requester repeat the real task');await click('A requester-specific service path');
  const saved=await page.evaluate(id=>TechOpsCampaign.load(localStorage).officeMemory.records[id].followUp.phase,fixtureId);assert.equal(saved,'remediation');await click('Leave and resume later');
  // Reopen through the desk; the cold reload contract is covered deterministically.
  await page.keyboard.press('KeyE');await click('Shift handoff / follow-up work');await click(/Printer Follow-up/);await click('Apply the targeted correction');await click('Recheck service AND requester outcome');await click('Publish verified handoff to the knowledge base');
  const office=await page.evaluate(id=>({record:TechOpsCampaign.load(localStorage).officeMemory.records[id],kb:S.meta.kb.printer}),fixtureId);assert.equal(office.record.followUp.phase,'closed');assert.equal(office.record.ownerId,'Amit');assert.equal(office.record.verification,'partial');assert.equal(office.kb,true);log('desk-follow-up-and-knowledge',{savedPhase:saved,phase:office.record.followUp.phase,originalOwner:office.record.ownerId,originalVerification:office.record.verification});await shot('follow-up');
  if(errors.length)throw new Error(errors.join('\n'));
  results.push({browser:name,pass:true,fixtureAssisted:true,physicalDevice:false,checks,errors});
 }catch(error){const state=page?await page.evaluate(()=>({text:document.body.innerText.slice(-7000),clock:window.S?.clock,night:!!window.S?.nightMode,dialog:window.S?.inDialog,n:window.NM&&{x:NM.x,district:NM.district,session:NM._nightSession},audio:window.__combatAudioLast,audioError:window.__combatAudioError,phase:window.__productionNightLaunchPhase})).catch(()=>null):null;results.push({browser:name,pass:false,error:String(error.stack||error),state,checks,errors});if(page)await shot('error').catch(()=>{});}
 finally{if(context)await context.close();if(browser)await browser.close();fs.writeFileSync(path.join(OUT,'gameplay-quality.json'),JSON.stringify(results,null,2));console.log(JSON.stringify(results.at(-1)));}
}
if(results.some(r=>!r.pass))process.exitCode=1;
