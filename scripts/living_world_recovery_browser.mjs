import assert from 'node:assert/strict';
import fs from 'node:fs';
import {spawn} from 'node:child_process';
import {chromium} from 'playwright';

const port=process.env.LIVING_CHECK_PORT||'4186',base=`http://127.0.0.1:${port}/`;
const out=process.env.LIVING_OUT_DIR||'/tmp/techops-living-world';fs.mkdirSync(out,{recursive:true});
const server=spawn('python3',['scripts/media_http_server.py','--port',port,'--bind','127.0.0.1'],{stdio:'ignore'});
const browser=await chromium.launch({headless:true});
const profiles=[{id:'desktop',width:1280,height:800},{id:'portrait',width:390,height:844},{id:'landscape',width:844,height:390}],reports=[];
try{
  for(let i=0;i<50;i++){try{if((await fetch(base)).ok)break;}catch{}await new Promise(r=>setTimeout(r,100));}
  for(const profile of profiles){
    const context=await browser.newContext({viewport:{width:profile.width,height:profile.height},hasTouch:profile.id!=='desktop'}),page=await context.newPage(),errors=[];
    const option=text=>page.locator('#dlg-options button').filter({hasText:text}).first();
    const press=async el=>{await el.scrollIntoViewIfNeeded();if(profile.id==='desktop')await el.click();else await el.tap();};
    const title=()=>page.waitForFunction(()=>window.__productionTitleReadiness?.ready&&!document.querySelector('#btn-start')?.disabled);
    const fault=()=>page.evaluate(()=>{window.__livingStoreOriginal=localStorage.setItem;localStorage.setItem=function(k,v){if(k==='techops_nightcrawler_session_v1')throw new DOMException('fixture quota failure','QuotaExceededError');return window.__livingStoreOriginal.call(this,k,v);};});
    const repair=()=>page.evaluate(()=>{localStorage.setItem=window.__livingStoreOriginal;delete window.__livingStoreOriginal;});
    page.on('pageerror',e=>errors.push(e.message));
    await context.route('**/*',r=>r.request().url().startsWith(base)?r.continue():r.abort());
    try{
      await page.goto(base);await title();await press(page.locator('#btn-nightcrawler'));await press(option(/Standard/));await press(option(/Take the Charger/));await page.locator('#v722-cine').waitFor({state:'visible'});await page.keyboard.press('Escape');
      await page.waitForFunction(()=>window.S?.nightMode&&!S.inDialog&&!window.__productionDesiredMode);
      await press(page.locator('#night-campaign'));await press(option(/Living World/));await press(option(/^Begin — The Route We Keep$/));await press(option(/^Enter this chapter$/));
      await page.waitForFunction(()=>!!S.nightMode._livingWorld&&!S.inDialog);
      // Exercise actual touch dispatch, rather than invoking the movement API.
      if(profile.id!=='desktop'){
        const box=await page.locator('#dpad .d-right').boundingBox(),before=await page.evaluate(()=>NM.x),cdp=await context.newCDPSession(page);
        await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:box.x+box.width/2,y:box.y+box.height/2}]});await page.waitForTimeout(250);
        await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await page.waitForTimeout(400);
        assert((await page.evaluate(()=>NM.x))>before+10,'touch movement reaches the live expedition');await cdp.detach();
      }
      while(await page.evaluate(()=>NM.x<270)){await page.keyboard.down('ArrowRight');await page.waitForTimeout(80);await page.keyboard.up('ArrowRight');}
      await page.waitForTimeout(400);
      await fault();await press(page.locator('#living-world-interact'));await press(option(/^Hear the requester$/));
      await page.waitForFunction(()=>document.querySelector('#dlg-name').textContent==='PROGRESS NOT SAVED');
      assert.equal(await page.evaluate(()=>S.meta.livingWorld.active.step),0,'failed objective save rolls back the objective');
      await repair();await press(option(/^Keep playing and retry the action$/));await press(page.locator('#living-world-interact'));await press(option(/^Hear the requester$/));
      assert.equal(await page.evaluate(()=>S.meta.livingWorld.active.step),1);
      await press(page.locator('#night-campaign'));const elapsed=await page.evaluate(()=>S.meta.livingWorld.active.elapsed);await page.waitForTimeout(700);
      assert.equal(await page.evaluate(()=>S.meta.livingWorld.active.elapsed),elapsed,'journal pauses simulation');
      await press(option(/^Supplies and store$/));await press(option(/^Store — buy field supplies$/));const budget=await page.evaluate(()=>S.budget);
      await fault();await press(option(/^Field Dressing —/));assert.equal(await page.evaluate(()=>S.budget),budget);assert.equal(await page.evaluate(()=>S.supplies?.supply_dressing||0),0);
      await repair();await press(option(/^Field Dressing —/));assert.equal(await page.evaluate(()=>S.budget),budget-20);
      await press(option(/^Back to supplies$/));await press(option(/^Use Field Dressing/));assert.equal(await page.evaluate(()=>S.supplies.supply_dressing),1,'full health retains supply');
      // Explicit damage fixture isolates the atomic supply save from combat randomness.
      await page.evaluate(()=>{NM.hp=40;});await press(option(/^Use Field Dressing/));assert.equal(await page.evaluate(()=>NM.hp),55);assert.equal(await page.evaluate(()=>S.supplies.supply_dressing),0);
      await page.reload();await title();await press(page.locator('#btn-nightcrawler'));await page.waitForFunction(()=>!!window.__nightCheckpointResumed&&!!S.nightMode);
      assert.equal(await page.evaluate(()=>NM.hp),55);assert.equal(await page.evaluate(()=>S.supplies.supply_dressing),0);assert.equal(await page.evaluate(()=>S.budget),budget-20);
      await press(page.locator('#night-campaign'));await press(option(/Living World/));await press(option(/^Resume — The Route We Keep$/));await press(option(/^Resume this chapter$/));
      assert.equal(await page.evaluate(()=>S.meta.livingWorld.active.step),1);assert.equal(await page.evaluate(()=>NM.hp),55);
      await page.waitForTimeout(900);await page.screenshot({path:`${out}/${profile.id}-recovery.png`});
      const bounds=await page.evaluate(()=>{
        const b=id=>{const r=document.querySelector(id).getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height};};
        return {objective:b('#living-world-objective'),interact:b('#living-world-interact'),controls:b('#dpad'),actions:b('#v55-nmbtns'),menu:b('#night-campaign'),width:innerWidth,height:innerHeight};
      });
      const overlap=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
      assert(bounds.interact.h>=44&&bounds.interact.x>=0&&bounds.interact.x+bounds.interact.w<=bounds.width,'interaction fits viewport');
      assert(bounds.objective.y>=bounds.menu.y+bounds.menu.h,'objective below menu');
      assert(bounds.objective.y+bounds.objective.h<=bounds.height,'objective fits viewport');
      assert(!overlap(bounds.interact,bounds.actions),'interaction clears combat buttons');
      if(profile.id!=='desktop'){assert(!overlap(bounds.objective,bounds.controls),'objective clears direction controls');assert(!overlap(bounds.interact,bounds.controls),'interact clears direction controls');}
      assert.equal(await page.evaluate(()=>localStorage.getItem('techops_save')),null);assert.equal(await page.evaluate(()=>localStorage.getItem('techops_hero_campaign_v1')),null);
      assert.deepEqual(errors,[]);reports.push({profile:profile.id,pass:true,bounds,checks:['objective rollback','purchase rollback','full-health retention','purchase and use','chapter and health reload','journal pause','HUD layout',...(profile.id==='desktop'?[]:['real touch movement'])]});console.log('PASS',profile.id);
    }catch(e){await page.screenshot({path:`${out}/${profile.id}-recovery-failure.png`});throw e;}finally{await context.close();}
  }
  fs.writeFileSync(`${out}/recovery-report.json`,JSON.stringify({reports,fixtures:['40 HP for supply test','quota exception for rollback tests'],injectedStoryProgress:false},null,2));
}finally{await browser.close();server.kill();}
