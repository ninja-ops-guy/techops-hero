import assert from 'node:assert/strict';
import fs from 'node:fs';
import {spawn} from 'node:child_process';
import {chromium} from 'playwright';
// A genuine phase-one completed playthrough supplies prerequisites, never the
// new invitation, visit, dialogue cursor, coordinates or Iona completions.
const source=process.env.LIVING_LEGACY_SAVE||'/tmp/techops-living-world/desktop-storage.json';
const out=process.env.LIVING_OUT_DIR||'/tmp/techops-living-phase2';fs.mkdirSync(out,{recursive:true});
const base='http://127.0.0.1:4187/',server=spawn('python3',['scripts/media_http_server.py','--port','4187','--bind','127.0.0.1'],{stdio:'ignore'});
const browser=await chromium.launch({headless:true}),reports=[];
try{
 for(let i=0;i<50;i++){try{if((await fetch(base)).ok)break;}catch{}await new Promise(r=>setTimeout(r,100));}
 for(const [profile,width,height] of [['desktop',1280,800],['portrait',390,844],['landscape',844,390]]){
  const storage=JSON.parse(fs.readFileSync(source));for(const o of storage.origins)o.origin=base.slice(0,-1);
  const context=await browser.newContext({viewport:{width,height},hasTouch:profile!=='desktop',storageState:storage}),page=await context.newPage(),errors=[];
  await context.route('**/*',r=>r.request().url().startsWith(base)?r.continue():r.abort());page.on('pageerror',e=>errors.push(e.message));
  const option=t=>page.locator('#dlg-options button').filter({hasText:t}).first();
  const press=async el=>{await el.scrollIntoViewIfNeeded();await (profile==='desktop'?el.click():el.tap());};
  async function boot(){await page.goto(base);await page.waitForFunction(()=>window.__productionTitleReadiness?.ready&&!document.querySelector('#btn-start')?.disabled);await press(page.locator('#btn-nightcrawler'));await page.waitForFunction(()=>!!window.__nightCheckpointResumed&&!!S.nightMode);await press(page.locator('#night-campaign'));await press(option(/Living World/));await page.waitForFunction(()=>!!window.TechOpsLivingWorld);}
  try{
   await boot();assert.equal(await option(/^(Revisit|Begin|Resume) — Her Own Bearings$/).count(),0);
   await press(option(/^Begin — No Broken Computer Required$/));await press(option(/^Enter this chapter$/));
   while(await page.evaluate(()=>NM.x<620)){await page.keyboard.down('ArrowRight');await page.waitForTimeout(90);await page.keyboard.up('ArrowRight');}await page.waitForTimeout(350);
   await press(page.locator('#living-world-interact'));assert.equal(await page.locator('#dlg-name').textContent(),'Waldo');
   await press(option(/^Continue$/));await press(option(/^Pause the conversation$/));
   await page.reload();await boot();await press(option(/^Resume — No Broken Computer Required$/));await press(option(/^Resume this chapter$/));await press(page.locator('#living-world-interact'));
   assert.equal(await page.locator('#dlg-name').textContent(),'Mike');assert((await page.locator('#dlg-text').textContent()).includes('Just to hang out?'));
   await press(option(/^Continue$/));await press(option(/^Continue$/));
   await page.evaluate(()=>{window.__originalStore=localStorage.setItem;localStorage.setItem=function(k,v){if(k==='techops_nightcrawler_session_v1')throw new DOMException('dialogue fixture quota','QuotaExceededError');return window.__originalStore.call(this,k,v);};});
   await press(option(/^Finish the conversation$/));await page.waitForFunction(()=>document.querySelector('#dlg-name').textContent==='PROGRESS NOT SAVED');
   assert.equal(await page.evaluate(()=>!!S.meta.livingWorld.flags.waldo_invited),false);assert.equal(await page.evaluate(()=>S.meta.livingWorld.active.sceneIndex),3);
   await page.evaluate(()=>{localStorage.setItem=window.__originalStore;delete window.__originalStore;});await press(option(/^Keep playing and retry the action$/));await press(page.locator('#living-world-interact'));await press(option(/^Finish the conversation$/));
   assert.equal(await page.evaluate(()=>S.meta.livingWorld.flags.waldo_invited),true);assert.equal(await page.evaluate(()=>!!S.meta.livingWorld.flags.waldo_visit_received),false);
   assert.equal(await page.evaluate(()=>TechOpsLivingWorld.gate(S.meta.livingWorld,'iona_local',{}).open),false);
   await page.screenshot({path:`${out}/${profile}-invitation.png`});assert.deepEqual(errors,[]);reports.push({profile,dialogueResume:true,failedFinalLineRollback:true,invitationDoesNotUnlock:true,touchDialogs:profile!=='desktop',errors});console.log('PASS',profile);
  }finally{await context.close();}
 }
 fs.writeFileSync(`${out}/dialogue-report.json`,JSON.stringify({reports,method:'Authentic phase-one save prerequisites, normal movement and dialogue controls. Injected storage failure only; no new story flags or positions injected.'},null,2));
}finally{await browser.close();server.kill();}
