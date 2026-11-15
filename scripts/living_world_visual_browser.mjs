import assert from 'node:assert/strict';
import fs from 'node:fs';
import {spawn} from 'node:child_process';
import {chromium} from 'playwright';
// Uses the completed normal-controls playthrough checkpoint, without granting
// facts or changing positions. Revisit and movement use the public UI.
const source=process.env.LIVING_VISUAL_SAVE||'/tmp/techops-living-world/desktop-storage.json';
const out=process.env.LIVING_OUT_DIR||'/tmp/techops-living-world',base='http://127.0.0.1:4184/';
const server=spawn('python3',['scripts/media_http_server.py','--port','4184','--bind','127.0.0.1'],{stdio:'ignore'});
const browser=await chromium.launch({headless:true}),context=await browser.newContext({viewport:{width:1280,height:800},storageState:source}),page=await context.newPage();
const errors=[],reports=[],option=t=>page.locator('#dlg-options button').filter({hasText:t}).first();
const exact=t=>new RegExp('^'+t.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'$');
page.on('pageerror',e=>errors.push(e.message));await context.route('**/*',r=>r.request().url().startsWith(base)?r.continue():r.abort());
try{
  for(let i=0;i<50;i++){try{if((await fetch(base)).ok)break;}catch{}await new Promise(r=>setTimeout(r,100));}
  await page.goto(base);await page.waitForFunction(()=>window.__productionTitleReadiness?.ready&&!document.querySelector('#btn-start')?.disabled);
  await page.locator('#btn-nightcrawler').click();await page.waitForFunction(()=>!!window.__nightCheckpointResumed&&!!S.nightMode);
  await page.locator('#night-campaign').click();await option(/Living World/).click();await page.waitForFunction(()=>!!window.TechOpsLivingWorld);
  const episodes=await page.evaluate(()=>TechOpsLivingWorldData.episodes);assert.equal(await page.evaluate(()=>S.meta.livingWorld.done.length),episodes.length,'requires completed gameplay, not an unlock fixture');
  for(const e of episodes){
    const re=new RegExp('^(Revisit|Resume) — '+e.title.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'$');await option(re).click();await option(/^(Enter|Resume) this chapter$/).click();
    // A partial optional visit can resume in another room. Record the actual
    // room instead of manufacturing a fresh location for the screenshot.
    await page.keyboard.down('ArrowRight');await page.waitForTimeout(1100);await page.keyboard.up('ArrowRight');await page.waitForTimeout(700);
    await page.screenshot({path:`${out}/visual-${e.id}.png`});
    reports.push(await page.evaluate(()=>({chapter:S.meta.livingWorld.active.id,room:S.meta.livingWorld.active.room,actor:S.meta.livingWorld.active.actor,health:NM.hp})));
    await page.locator('#night-campaign').click();await option(exact('Save chapter and return to the street')).click();await page.locator('#night-campaign').click();await option(/Living World/).click();
  }
  assert.deepEqual(errors,[]);fs.writeFileSync(`${out}/visual-report.json`,JSON.stringify({reports,errors,method:'Revisit UI from completed playthrough; normal keyboard movement; no story or position injection.'},null,2));console.log('PASS',reports.length,'chapter scene renders');
}finally{await context.close();await browser.close();server.kill();}
