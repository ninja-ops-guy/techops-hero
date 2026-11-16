/* Real production controls; declared target/airborne fixtures isolate each move. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {spawn} from 'node:child_process';
import {chromium} from 'playwright';
const out='/tmp/night-character-skills',port=4247,base=`http://127.0.0.1:${port}/`;fs.mkdirSync(out,{recursive:true});const server=spawn('python3',['scripts/media_http_server.py','--port',String(port),'--bind','127.0.0.1'],{stdio:'ignore'}),browser=await chromium.launch({headless:true}),reports=[];
try{
 for(let i=0;i<60;i++){try{if((await fetch(base)).ok)break;}catch{}await new Promise(r=>setTimeout(r,100));}
 for(const [profile,viewport,touch] of [['desktop',{width:1280,height:800},false],['portrait',{width:390,height:844},true],['landscape',{width:844,height:390},true]]){
 const context=await browser.newContext({viewport,hasTouch:touch,isMobile:touch}),page=await context.newPage(),report={profile,checks:[],errors:[],pass:false};reports.push(report);page.on('pageerror',e=>report.errors.push(e.message));page.setDefaultTimeout(20000);await context.route('**/*',r=>r.request().url().startsWith(base)?r.continue():r.abort());const option=t=>page.locator('#dlg-options button').filter({hasText:t}).first(),press=async l=>{await l.scrollIntoViewIfNeeded();touch?await l.tap():await l.click();},check=s=>{report.checks.push(s);console.log(profile,s);};
 try{
 await page.goto(base);await page.waitForFunction(()=>window.__productionTitleReadiness?.ready&&!document.querySelector('#btn-start')?.disabled);await press(page.locator('#btn-nightcrawler'));await press(option(/Standard/));await press(option(/Take the Charger/));await page.locator('#v722-cine').waitFor({state:'visible'});await page.keyboard.press('Escape');await page.waitForFunction(()=>window.S?.nightMode&&!S.inDialog&&!window.__productionDesiredMode);
 await page.evaluate(()=>{NM.enemies=[];NM.x=600;NM.hp=73;NM.cash=17;});const saved=await page.evaluate(()=>JSON.stringify(TechOpsNightProgression.record()));
 for(const actor of ['Mike','K','Iona','Felicia']){
 await press(page.locator('#night-campaign'));await press(option(/Combat Lab/));await press(option(/Training —/));await press(option(new RegExp('^'+actor+'$')));
 await press(page.locator('#night-campaign'));await press(option(/^Character skills and moves$/));assert.match(await page.locator('#dlg-text').innerText(),/complete preset/);assert.equal(await page.locator('#dlg-options button').count(),actor==='Felicia'?6:4);await press(option(/^Back$/));await press(option(/^Resume practice$/));
 for(const slot of [1,2]){
 await press(page.locator('#night-campaign'));await press(option(/^Refill practice focus$/));
 const before=await page.evaluate(({actor,slot})=>{TechOpsNightCombat.cancel(NM);NM.x=650;NM.y=actor==='K'&&slot===2?330:396;NM.onGround=!(actor==='K'&&slot===2);NM.vx=NM.vy=0;NM.dashT=0;NM.face=1;NM.enemies[0].x=700;NM.enemies[0].y=396;NM.enemies[0].hp=100000;NM.enemies[0].alive=true;delete NM.enemies[0]._nightCombat;const entry=TechOpsNightProgression.selected(NM,slot)[1];return {hp:NM.enemies[0].hp,move:entry.move,cost:TechOpsNightCombat.MOVES[entry.move].focus};},{actor,slot});
 if(touch){await page.locator('#night-input-assists').waitFor({state:'visible'});if(await page.locator('#night-input-assists').getAttribute('aria-expanded')!=='true')await press(page.locator('#night-input-assists'));await page.locator('#night-input-special'+slot).waitFor({state:'visible'});const b=await page.locator('#night-input-special'+slot).boundingBox();assert(b&&b.width>=44&&b.height>=44&&b.x>=0&&b.y>=0&&b.x+b.width<=viewport.width&&b.y+b.height<=viewport.height,'special control on-screen and touch-sized');await press(page.locator('#night-input-special'+slot));}else await page.keyboard.press(slot===1?'h':'y');
 await page.waitForFunction(move=>NM._nightCombat?.events.some(e=>e.type===move),before.move);assert((await page.evaluate(()=>NM.enemies[0].hp))<before.hp);assert.equal(await page.evaluate(()=>TechOpsNightCombat.focus(NM)),100-before.cost);await page.waitForTimeout(650);check(actor+' special '+slot+' uses real '+(touch?'touch':'keyboard')+' input, hits and spends focus');
 }
 if(actor==='Iona'){await press(page.locator('#night-campaign'));await press(option(/^Character skills and moves$/));await page.waitForTimeout(700);await page.screenshot({path:`${out}/${profile}-iona-moves.png`});await press(option(/^Back$/));await press(option(/^Resume practice$/));}
 await press(page.locator('#night-campaign'));await press(option(/^Return to the street$/));assert.equal(await page.evaluate(()=>NM.hp),73);assert.equal(await page.evaluate(()=>NM.cash),17);
 }
 assert.equal(await page.evaluate(()=>JSON.stringify(TechOpsNightProgression.record())),saved);check('all character practice presets restore the street and leave XP and skills unchanged');
 // Declared earned-XP fixture; learning and reload use the actual menu/save path.
 await page.evaluate(()=>{const p=TechOpsNightProgression.record();for(let i=0;i<8;i++)TechOpsNightProgression.award(p,'fixture:'+i,200);TechOpsNightProgression.upgrade(p,'intelligence');TechOpsNightProgression.upgrade(p,'intelligence');save();});
 await press(page.locator('#night-campaign'));await press(option(/^Stats & skills$/));await press(option(/^Learn skills$/));await press(option(/^IONA —/));await press(option(/^Iona · Uzi burst/));await press(option(/^Learn —/));assert(await page.evaluate(()=>TechOpsNightProgression.record().skills.includes('ionaBurst')));await page.reload();await page.waitForFunction(()=>window.__productionTitleReadiness?.ready);await press(page.locator('#btn-nightcrawler'));await page.waitForFunction(()=>!!window.__nightCheckpointResumed&&!!S.nightMode&&!S.inDialog);assert(await page.evaluate(()=>TechOpsNightProgression.record().skills.includes('ionaBurst')));assert.equal(await page.evaluate(()=>TechOpsNightProgression.has(NM,'ionaBurst')),false);check('character unlock survives reload without giving Mike Iona’s move');
 assert.deepEqual(report.errors,[]);report.pass=true;
 }catch(e){report.failure=e.stack;throw e;}finally{fs.writeFileSync(`${out}/${profile}.json`,JSON.stringify(report,null,2));await context.close();}
 }
}finally{fs.writeFileSync(`${out}/summary.json`,JSON.stringify(reports,null,2));await browser.close();server.kill();}
