/* Production-page checks. XP/encounter fixtures isolate progression; UI actions
 * and keyboard/touch movement exercise the real game. Not a full playthrough. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {spawn} from 'node:child_process';
import {chromium} from 'playwright';
const out=process.env.PROGRESSION_OUT||'/tmp/night-progression',port=4221,base=`http://127.0.0.1:${port}/`;fs.mkdirSync(out,{recursive:true});
const server=spawn('python3',['scripts/media_http_server.py','--port',String(port),'--bind','127.0.0.1'],{stdio:'ignore'}),browser=await chromium.launch({headless:true}),reports=[];
try{
 for(let i=0;i<50;i++){try{if((await fetch(base)).ok)break;}catch{}await new Promise(r=>setTimeout(r,100));}
 for(const [profile,viewport,touch] of [['desktop',{width:1280,height:800},false],['portrait',{width:390,height:844},true],['landscape',{width:844,height:390},true]]){
 const context=await browser.newContext({viewport,hasTouch:touch,isMobile:touch}),page=await context.newPage();page.setDefaultTimeout(20000);await context.route('**/*',r=>r.request().url().startsWith(base)?r.continue():r.abort());
 const report={profile,checks:[],errors:[],pass:false};reports.push(report);page.on('pageerror',e=>report.errors.push(e.message));const check=s=>{report.checks.push(s);console.log(profile,s);};const option=t=>page.locator('#dlg-options button').filter({hasText:t}).first();const press=async l=>{await l.scrollIntoViewIfNeeded();touch?await l.tap():await l.click();};
 try{
 await page.goto(base);await page.waitForFunction(()=>window.__productionTitleReadiness?.ready&&!document.querySelector('#btn-start')?.disabled);
 await press(page.locator('#btn-nightcrawler'));await press(option(/Standard/));await press(option(/Take the Charger/));await page.locator('#v722-cine').waitFor({state:'visible'});await page.keyboard.press('Escape');await page.waitForFunction(()=>window.S?.nightMode&&!S.inDialog&&!window.__productionDesiredMode);
 await press(page.locator('#night-campaign'));await press(option(/^Stats & skills$/));assert.match(await page.locator('#dlg-name').innerText(),/LEVEL 1/);assert.match(await page.locator('#dlg-text').innerText(),/0 stat points/);check('fresh run begins at level one with baseline double jump and no free points');
 await press(option(/^Strength/));await press(option(/^Increase strength/));assert.match(await page.locator('#dlg-name').innerText(),/UNCHANGED/);await press(option(/^Back to training/));check('UI rejects unearned upgrades');
 await page.evaluate(()=>{const p=TechOpsNightProgression.record();for(let i=0;i<7;i++)TechOpsNightProgression.award(p,'fixture:'+i,200);save();TechOpsNightProgression.open(()=>TechOpsNightRuntime.openCampaign());});
 for(const stat of ['strength','strength','speed','dexterity','intelligence','jumps']){await press(option(new RegExp('^'+(stat==='jumps'?'Jump count':stat[0].toUpperCase()+stat.slice(1)))));await press(option(new RegExp('^Increase '+stat)));}
 await press(option(/^Learn skills/));await press(option(/^Heavy hands/));await press(option(/^Learn —/));assert.match(await page.locator('#dlg-options').innerText(),/Heavy hands · Learned/);await press(option(/^Back to training/));
 const before=await page.evaluate(()=>JSON.stringify(TechOpsNightProgression.record()));const b=await page.evaluate(()=>TechOpsNightProgression.modifiers(NM));assert.equal(b.jumps,3);assert.equal(b.damage,1.27);assert.equal(b.speed,1.03);assert.equal(b.recovery,.98);assert.equal(b.combo,20);check('all five stats and a prerequisite-gated skill can be learned through UI');
 await page.waitForTimeout(700);await page.screenshot({path:`${out}/${profile}-stats.png`});
 const bounds=await page.locator('#dlg-options button').evaluateAll(bs=>bs.map(b=>{const r=b.getBoundingClientRect();return {w:r.width,h:r.height};}));assert(bounds.every(b=>b.h>=44&&b.w>=44));check('training controls retain 44-pixel touch targets');
 await press(option(/^Reset allocations/));await press(option(/^Keep this build/));assert.equal(await page.evaluate(()=>JSON.stringify(TechOpsNightProgression.record())),before);check('reset cancellation preserves the build');
 await page.reload();await page.waitForFunction(()=>window.__productionTitleReadiness?.ready&&!document.querySelector('#btn-start')?.disabled);await press(page.locator('#btn-nightcrawler'));await page.waitForFunction(()=>!!window.__nightCheckpointResumed&&!!S.nightMode&&!S.inDialog);assert.equal(await page.evaluate(()=>JSON.stringify(TechOpsNightProgression.record())),before);check('full reload restores XP, stats, skills and reward deduplication');
 await page.evaluate(()=>{NM.enemies=[];NM.x=600;NM.y=396;NM.vx=NM.vy=0;NM.onGround=true;NM.jumps=0;});
 for(let i=1;i<=3;i++){await page.keyboard.down('Space');await page.waitForTimeout(35);await page.keyboard.up('Space');await page.waitForTimeout(35);assert.equal(await page.evaluate(()=>NM.jumps),i);}await page.keyboard.press('Space');assert.equal(await page.evaluate(()=>NM.jumps),3);check('real jump input permits exactly three jumps and rejects a fourth');
 await press(page.locator('#night-campaign'));await press(option(/^Stats & skills$/));await press(option(/^Reset allocations/));await press(option(/^Reset stat and skill allocations/));assert.equal(await page.evaluate(()=>TechOpsNightProgression.modifiers(NM).jumps),2);assert.equal(await page.evaluate(()=>TechOpsNightProgression.record().xp),1400);assert.equal(await page.evaluate(()=>TechOpsNightProgression.record().skills.length),0);check('free respec refunds allocations while preserving XP and level');
 assert.deepEqual(report.errors,[]);report.pass=true;
 }catch(e){report.failure=e.stack;throw e;}finally{fs.writeFileSync(`${out}/${profile}.json`,JSON.stringify(report,null,2));await context.close();}
 }
}finally{fs.writeFileSync(`${out}/summary.json`,JSON.stringify(reports,null,2));await browser.close();server.kill();}
