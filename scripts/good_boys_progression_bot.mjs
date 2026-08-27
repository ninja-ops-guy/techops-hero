import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const BASE=process.env.BOT_BASE_URL||'http://127.0.0.1:4173/';
const OUT=process.env.BOT_OUT_DIR||'runtime-bot-artifacts';
fs.mkdirSync(OUT,{recursive:true});
const events=[];const failures=[];
const log=(name,data={})=>{events.push({at:new Date().toISOString(),name,...data});console.log(name,JSON.stringify(data));};
const fail=(name,data={})=>{failures.push({name,...data});log('FAIL '+name,data);};

async function clickText(page,re){for(const b of await page.locator('button').all()){let t='';try{t=(await b.innerText()).trim();}catch{}if(re.test(t)){try{await b.click({timeout:500});return true;}catch{}}}return false;}
async function dismiss(page,ms=5000){const until=Date.now()+ms;while(Date.now()<until){
  const director=page.locator('#good-boys-story-cine button');if(await director.count()){await director.first().click({timeout:500}).catch(()=>{});await page.waitForTimeout(120);continue;}
  const prison=page.locator('#gb-prison-cine button');if(await prison.count()){await prison.first().click({timeout:500}).catch(()=>{});await page.waitForTimeout(120);continue;}
  const txt=await page.locator('body').innerText().catch(()=>'');
  if(/SELECT SHIFT DIFFICULTY/i.test(txt)){await clickText(page,/Standard/i);await page.waitForTimeout(120);continue;}
  if(/BEGIN THE INCIDENT/i.test(txt)){await clickText(page,/BEGIN THE INCIDENT/i);await page.waitForTimeout(120);continue;}
  if(/CLICK\s*[—-]\s*SKIP|E\s*\/\s*CLICK\s*[—-]\s*SKIP/i.test(txt)){await page.keyboard.press('KeyE').catch(()=>{});await page.waitForTimeout(180);continue;}
  await page.waitForTimeout(120);
}}
async function state(page){return page.evaluate(()=>{let r={};try{r=window.eval(`(function(){var s=(typeof S!=='undefined'&&S)?S:null,n=(typeof NM!=='undefined'&&NM)?NM:null,c=n&&n._v736,m=s&&s.meta&&s.meta._v736,a=window.TechOpsGoodBoysProgressionAuthority;return {night:!!(s&&s.nightMode),inDialog:!!(s&&s.inDialog),mission:Number(c&&c.m||m&&m.m||0),metaMission:Number(m&&m.m||0),done:!!(m&&m.done),active:!!c,x:n&&n.x,ship:!!(n&&n._gbShipRevealed),living:n&&n.enemies?(n.enemies.filter(e=>e&&e.alive!==false&&Number(e.hp)>0).length):0,authority:!!a,acceptance:a&&a.acceptance?a.acceptance():null};})()`);}catch(e){r.error=String(e&&e.stack||e);}return {...r,directorCines:document.querySelectorAll('#good-boys-story-cine').length,prisonCines:document.querySelectorAll('#gb-prison-cine').length,directorPads:document.querySelectorAll('#good-boys-director-controls').length,legacyPads:document.querySelectorAll('#good-dogs-touch,#good-boys-loop-controls').length};});}
async function waitMission(page,want,ms=6000){const until=Date.now()+ms;let s;while(Date.now()<until){s=await state(page);if(s.mission===want||s.metaMission===want||s.done)return s;await dismiss(page,350);await page.waitForTimeout(100);}return s||await state(page);}

const browser=await chromium.launch({headless:true});const context=await browser.newContext({viewport:{width:1280,height:800}});await context.tracing.start({screenshots:true,snapshots:true,sources:true});const page=await context.newPage();
try{
  await page.goto(BASE,{waitUntil:'domcontentloaded',timeout:30000});await page.waitForTimeout(1700);
  if(!await clickText(page,/(118\/1984|BREAKOUT|GOOD\s*BOYS)/i)){fail('launch-button-missing');throw new Error('Good Boys launch button missing');}
  await page.waitForTimeout(250);
  if(await page.locator('#good-boys-story-cine').count()){
    const blocked=await page.evaluate(()=>{try{return !!((typeof S!=='undefined')&&S&&S.inDialog);}catch{return false;}});
    log('opening-cinematic',{blocked});if(!blocked)fail('opening-cinematic-does-not-block-gameplay');
  }
  await dismiss(page,7000);
  let s=await state(page);log('started',s);if(!s.active||!s.authority)fail('progression-authority-not-attached',s);
  if(s.directorPads!==1)fail('director-pad-count',{count:s.directorPads});if(s.legacyPads!==0)fail('legacy-control-pads-remain',{count:s.legacyPads});

  if(s.mission!==1){await page.evaluate(()=>{var a=window.TechOpsGoodBoysProgressionAuthority,n=window.NM,s=window.S;if(n&&n._v736){n._v736.m=1;n.x=180;}if(s&&s.meta&&s.meta._v736)s.meta._v736.m=1;a&&a.tick();});}
  await page.evaluate(()=>{window.NM.x=1400;window.TechOpsGoodBoysProgressionAuthority.tick();});
  s=await waitMission(page,2);log('m1-to-m2',s);if(s.mission!==2&&s.metaMission!==2)fail('m1-did-not-advance-to-m2',s);

  await dismiss(page,2500);
  await page.evaluate(()=>{var n=window.NM,a=window.TechOpsGoodBoysProgressionAuthority;n.enemies=[{x:n.x+40,y:n.y,w:28,h:38,hp:5,alive:true}];a.tick();n.enemies[0].hp=0;n.enemies[0].alive=false;a.tick();});
  await page.waitForTimeout(450);s=await state(page);log('m2-ship-reveal',s);if(!s.ship)fail('m2-ship-not-revealed-after-clear',s);
  await page.evaluate(()=>{window.NM.x=1300;window.TechOpsGoodBoysProgressionAuthority.tick();});
  s=await waitMission(page,3,7000);log('m2-to-m3',s);if(s.mission!==3&&s.metaMission!==3)fail('m2-did-not-board-to-m3',s);

  if(await page.locator('#gb-prison-cine').count()){
    const blocked=await page.evaluate(()=>!!(window.S&&window.S.inDialog));log('prison-cinematic',{blocked});if(!blocked)fail('prison-cinematic-does-not-block-gameplay');
  }
  await dismiss(page,4500);

  for(let m=3;m<=7;m++){
    let cur=await waitMission(page,m,3000);if(cur.done)break;if(cur.mission!==m&&cur.metaMission!==m){fail('unexpected-mission-before-clear',{expected:m,state:cur});break;}
    const primed=await page.evaluate(()=>window.TechOpsGoodBoysProgressionAuthority&&window.TechOpsGoodBoysProgressionAuthority.testPrimeClear());
    log('prime-clear',{mission:m,primed});if(!primed){fail('could-not-prime-clear',{mission:m});break;}
    await dismiss(page,3500);
    const next=m+1;cur=await waitMission(page,next,6500);log('mission-advance',{from:m,to:next,state:cur});
    if(!cur.done&&cur.mission!==next&&cur.metaMission!==next){fail('mission-did-not-advance',{from:m,to:next,state:cur});break;}
    await dismiss(page,2200);
  }

  s=await state(page);log('final',s);if(!s.done&&s.metaMission<8&&s.mission<8)fail('campaign-did-not-reach-ending',s);
  if(s.directorPads>1)fail('duplicate-director-pads-at-end',{count:s.directorPads});if(s.legacyPads!==0)fail('legacy-pads-returned',{count:s.legacyPads});
  await page.screenshot({path:path.join(OUT,'goodboys-progression-final.png'),fullPage:true});
}catch(e){fail('bot-exception',{error:String(e&&e.stack||e)});await page.screenshot({path:path.join(OUT,'goodboys-progression-exception.png'),fullPage:true}).catch(()=>{});}finally{await context.tracing.stop({path:path.join(OUT,'goodboys-progression-trace.zip')}).catch(()=>{});await browser.close();}
const report={pass:failures.length===0,failures,events};fs.writeFileSync(path.join(OUT,'goodboys-progression.json'),JSON.stringify(report,null,2));fs.writeFileSync(path.join(OUT,'goodboys-progression.md'),['# Good Boys Progression Bot','',`- Result: **${report.pass?'PASS':'FAIL'}**`,`- Failures: ${failures.length}`,'','## Progression','',...events.map(e=>`- ${e.name}: \`${JSON.stringify(e)}\``)].join('\n'));if(!report.pass)process.exitCode=1;
