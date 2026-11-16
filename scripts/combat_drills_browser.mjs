/* Real production controls; declared target/airborne fixtures isolate each move. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {spawn} from 'node:child_process';
import {chromium} from 'playwright';
const out='/tmp/combat-drills',port=4251,base=`http://127.0.0.1:${port}/`;fs.mkdirSync(out,{recursive:true});const server=spawn('python3',['scripts/media_http_server.py','--port',String(port),'--bind','127.0.0.1'],{stdio:'ignore'}),browser=await chromium.launch({headless:true}),reports=[];
try{
 for(let i=0;i<60;i++){try{if((await fetch(base)).ok)break;}catch{}await new Promise(r=>setTimeout(r,100));}
 for(const [profile,viewport,touch] of [['desktop',{width:1280,height:800},false],['portrait',{width:390,height:844},true],['landscape',{width:844,height:390},true]]){
 const context=await browser.newContext({viewport,hasTouch:touch,isMobile:touch}),page=await context.newPage(),report={profile,checks:[],errors:[],pass:false};reports.push(report);page.on('pageerror',e=>report.errors.push(e.message));page.setDefaultTimeout(20000);await context.route('**/*',r=>r.request().url().startsWith(base)?r.continue():r.abort());const option=t=>page.locator('#dlg-options button').filter({hasText:t}).first(),press=async l=>{await l.scrollIntoViewIfNeeded();touch?await l.tap():await l.click();},check=s=>{report.checks.push(s);console.log(profile,s);};
 try{
 await page.goto(base);await page.waitForFunction(()=>window.__productionTitleReadiness?.ready&&!document.querySelector('#btn-start')?.disabled);await press(page.locator('#btn-nightcrawler'));await press(option(/Standard/));await press(option(/Take the Charger/));await page.locator('#v722-cine').waitFor({state:'visible'});await page.keyboard.press('Escape');await page.waitForFunction(()=>window.S?.nightMode&&!S.inDialog&&!window.__productionDesiredMode);
 await page.evaluate(()=>{NM.enemies=[];NM.x=600;NM.hp=73;NM.cash=17;});
 await press(page.locator('#night-campaign'));await press(option(/Combat Lab/));await press(option(/Training —/));await press(option(/^Mike$/));await press(page.locator('#night-campaign'));await press(option(/^Guided combat drills$/));assert.equal(await page.locator('#dlg-options button').count(),7);check('six drills are reachable from the actual Training menu');
 await press(option(/^1\. Land/));await press(option(/^Begin drill$/));if(touch)await press(page.locator('#tb-interact'));else await page.keyboard.press('e');await page.waitForFunction(()=>document.querySelector('#dlg-name')?.textContent.includes('DRILL COMPLETE'));check('real light attack completes the contact drill');
 await page.waitForTimeout(700);await page.screenshot({path:`${out}/${profile}-complete.png`});await press(option(/^Next drill$/));assert.match(await page.locator('#dlg-text').innerText(),/third of a second/);assert.equal(await page.evaluate(()=>NM._combatLab.coach.complete),false);check('next drill resets evidence and explains combo timing');
 await press(option(/^Choose another drill$/));await press(option(/^6\. Land/));await press(option(/^Begin drill$/));if(touch){await page.locator('#night-input-assists').waitFor({state:'visible'});if(await page.locator('#night-input-assists').getAttribute('aria-expanded')!=='true')await press(page.locator('#night-input-assists'));await press(page.locator('#night-input-special1'));}else await page.keyboard.press('h');await page.waitForFunction(()=>document.querySelector('#dlg-name')?.textContent.includes('DRILL COMPLETE'));check('real character special contact completes the focus-funded drill');
 await press(option(/^Return to free practice$/));assert.equal(await page.evaluate(()=>!!NM._combatLab.coach),false);await press(page.locator('#night-campaign'));await press(option(/^Return to the street$/));assert.equal(await page.evaluate(()=>NM.hp),73);assert.equal(await page.evaluate(()=>NM.cash),17);assert.equal(await page.evaluate(()=>TechOpsNightProgression.record().xp),0);check('leaving guided practice preserves street state and grants no XP');
 assert.deepEqual(report.errors,[]);report.pass=true;
 }catch(e){report.failure=e.stack;throw e;}finally{fs.writeFileSync(`${out}/${profile}.json`,JSON.stringify(report,null,2));await context.close();}
 }
}finally{fs.writeFileSync(`${out}/summary.json`,JSON.stringify(reports,null,2));await browser.close();server.kill();}
