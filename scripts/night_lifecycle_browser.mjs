// Full production page. Story prerequisites and travel distance are labeled fixtures;
// mode selection, movement, home, journal and return use browser input, never forced clicks.
import {chromium,firefox,webkit} from 'playwright';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {spawn} from 'node:child_process';
const OUT=process.env.NIGHT_REPORT_DIR||'artifacts/night-lifecycle';
const URL=process.env.BOT_BASE_URL||'http://127.0.0.1:4173/';
await mkdir(OUT,{recursive:true});
const server=process.env.BOT_BASE_URL?null:spawn('python3',['scripts/media_http_server.py','--port','4173','--bind','127.0.0.1'],{stdio:'ignore'});
const results=[];
for(let i=0;i<60;i++){try{if((await fetch(URL)).ok)break;}catch{}await new Promise(r=>setTimeout(r,100));}
async function snapshot(page){return page.evaluate(()=>({
 night:!!window.S?.nightMode,inDialog:window.S?.inDialog,clock:window.S?.clock,
 runtime:window.TechOpsNightRuntime?.health(),launch:window.__productionNightLaunchTrace,
 guard:window.TechOpsProductionWrapperGuard?.health(),blocking:window.TechOpsPresentationDirector?.health(),
 position:window.NM&&{x:NM.x,y:NM.y,vx:NM.vx,drive:NM.drive,district:NM.district,hp:NM.hp},
 keys:typeof keys!=='undefined'?{right:!!keys.arrowright,d:!!keys.d}:null,
 dialogue:{text:document.querySelector('#dialogue')?.innerText,hidden:document.querySelector('#dialogue')?.classList.contains('hidden')}
}));}
async function mount(page){await page.goto(URL,{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>window.__productionBootstrapReady&&window.TechOpsNightRuntime);}
async function enterNight(page,touch){
 const button=page.locator('#btn-nightcrawler');
 if(touch)await button.tap();else await button.click();
 const deadline=Date.now()+20000;
 while(Date.now()<deadline){
  if(await page.evaluate(()=>!!(window.S?.nightMode&&!S.inDialog&&!window.v722?.active()&&!window.__productionDesiredMode)))return;
  const options=page.locator('#dlg-options button');
  if(await page.evaluate(()=>!window.S?.nightMode&&!window.v722?.active()&&!document.querySelector('#dialogue')?.classList.contains('hidden'))&&await options.count()){
    const first=options.first();if(await first.isVisible()){if(touch)await first.tap();else await first.click();}
  }
  if(await page.evaluate(()=>!!window.v722?.active()))await page.keyboard.press('Escape');
  await page.waitForTimeout(100);
 }
 throw new Error('Night launch did not reach a playable state: '+JSON.stringify(await snapshot(page)));
}
async function returnScene(page){await page.waitForFunction(()=>window.v725?.active()||!window.S?.nightMode);if(await page.evaluate(()=>!!window.v725?.active()))await page.locator('#night-home-skip').click();await page.waitForFunction(()=>!S.nightMode);}
async function prepareStory(page){return page.evaluate(()=>{
 const C=TechOpsCampaign,c=C.createInitialState();for(const[id,owner]of [['shipping_cannot_print','mike'],['plating_workstation_down','amit'],['impossible_access_event','mike']])C.assignTicket(c,id,owner);
 C.completeStandup(c);C.completeWorkstation(c,{redInTheMirrorHeard:true,feliciaVideoSeen:true});
 for(const id of ['shipping_cannot_print','plating_workstation_down'])C.resolveTicket(c,id,{technicalResolution:true,verification:'strong',humanOutcome:'restored'});
 C.recordGhostEvidence(c,{id:'badge_impossible_access',perspective:'firsthand',discoveredBy:'mike'});C.save(c,localStorage);return JSON.stringify(c.evidence);
});}
async function run(name,engine,touch,viewport){
 const record={browser:name,touch,viewport,status:'running',steps:[],errors:[]};results.push(record);
 let browser,page;
 try{
  browser=await engine.launch({headless:true,...(engine===chromium&&process.env.BOT_CHROMIUM_EXECUTABLE?{executablePath:process.env.BOT_CHROMIUM_EXECUTABLE}:{})});
  record.browserVersion=browser.version();
  const context=await browser.newContext({viewport,hasTouch:touch,deviceScaleFactor:1});context.setDefaultTimeout(15000);context.setDefaultNavigationTimeout(60000);
  await context.route('**/*',r=>r.request().url().startsWith(URL)?r.continue():r.abort());
  page=await context.newPage();page.on('pageerror',e=>record.errors.push(String(e.stack||e)));
  // On the touch profile, drive the browser touchscreen at the locator's rendered
  // center instead of relying on locator.tap() actionability. This remains real
  // browser touch input: if an overlay owns the hit target, the state assertion
  // after the tap still fails rather than force-clicking through it.
  const click=async locator=>{
    if(!touch)return locator.click();
    await locator.scrollIntoViewIfNeeded();
    const box=await locator.boundingBox();
    assert.ok(box&&box.width>0&&box.height>0,'Touch target has no rendered bounds');
    await page.touchscreen.tap(box.x+box.width/2,box.y+box.height/2);
  };
  const option=text=>page.locator('#dlg-options button').filter({hasText:text});
  const shot=label=>page.screenshot({path:`${OUT}/${name}-${label}.png`});
  await mount(page);await enterNight(page,touch);record.steps.push('reachable title/difficulty/Night Drive launch');
  // Observe both acknowledged input and actual simulation advancement. Do not
  // accept mere elapsed wall time as proof of movement, or write gameplay keys.
  const before=await snapshot(page);await page.keyboard.down('ArrowRight');
  try{await page.waitForFunction(()=>typeof keys!=='undefined'&&keys.arrowright);await page.waitForFunction(({x,steps})=>NM.x>x+8&&window.TechOpsProductionWrapperGuard.health().baseStepCount>steps,{x:before.position.x,steps:before.guard.baseStepCount},{timeout:3000});}
  finally{await page.keyboard.up('ArrowRight');}
  record.steps.push('acknowledged input plus advancing production-step movement');
  await page.evaluate(()=>{NM.enemies=[];NM.x=700;NM.hp=100;S.weather='storm';S.clock=1439;NM._nightLifecycle.seconds=0;});
  const tickets=await page.evaluate(()=>JSON.stringify(S.tickets.map(t=>({age:t.age,incident:t.incidentDeclared}))));
  await page.waitForFunction(()=>S.clock>=1440,null,{timeout:12000});assert.equal(await page.evaluate(()=>fmtClock(S.clock)),'00:00');
  assert.equal(await page.evaluate(()=>JSON.stringify(S.tickets.map(t=>({age:t.age,incident:t.incidentDeclared})))),tickets);assert.equal(await page.evaluate(()=>S.inDialog),false);
  record.steps.push('continuous midnight clock without daytime ticket aging');
  await page.evaluate(()=>{window.__nightDayCalls=[0,0];window.__savedDayStep=window.step;window.__savedDayDraw=window.draw;window.step=function(...a){__nightDayCalls[0]++;return __savedDayStep(...a);};window.draw=function(...a){__nightDayCalls[1]++;return __savedDayDraw(...a);};});
  await page.waitForTimeout(250);assert.deepEqual(await page.evaluate(()=>__nightDayCalls),[0,0]);
  await page.evaluate(()=>{window.step=__savedDayStep;window.draw=__savedDayDraw;S.px=10;S.py=10;S.room={id:'it',x:.5};S.npcs.push({id:'test-day-leak',x:11,y:10,ambient:false,done:false,campaignAct2:'felicia_daylight'});});
  await page.keyboard.press('e');assert.equal(await page.evaluate(()=>S.inDialog),false);
  await page.evaluate(()=>{S.room=null;S.npcs=S.npcs.filter(n=>n.id!=='test-day-leak');});record.steps.push('day render and stale-office-input isolation');
  await click(page.locator('#night-campaign'));assert.match(await page.locator('#dlg-text').innerText(),/standup|Day 1/);await click(option('Back to Night Walker'));record.steps.push('visible campaign hub does not bypass the opening');
  await page.evaluate(()=>{NM.x=110;NM.y=396;NM.vx=NM.vy=0;});await page.keyboard.press('e');await click(option('HOME STREET'));
  await page.waitForFunction(()=>NM?.district==='home'&&!NM.drive);await page.evaluate(()=>{NM.x=1730;NM.y=396;});await page.waitForTimeout(180);assert.equal(await page.evaluate(()=>!!S.nightMode),true);
  await page.evaluate(()=>{NM.x=1489;NM.y=396;NM.vx=NM.vy=0;});await page.locator('#night-home-interact').waitFor({state:'visible'});await shot('home');
  await click(page.locator('#night-home-interact'));await click(option('Stay out tonight'));assert.equal(await page.evaluate(()=>!!S.nightMode),true);
  await click(page.locator('#night-home-interact'));const clock=await page.evaluate(()=>S.clock);await click(option('Sleep — return to day mode'));await page.locator('#night-home-skip').waitFor({state:'visible'});
  const transitionState=()=>page.evaluate(()=>({runtime:window.NM?{x:NM.x,hp:NM.hp}:null,steps:TechOpsProductionWrapperGuard.health().baseStepCount}));
  const position=await transitionState();
  await page.keyboard.down('ArrowRight');await page.waitForTimeout(350);await page.keyboard.up('ArrowRight');
  const afterInput=await transitionState();
  assert.equal(await page.evaluate(()=>S.clock),clock);assert.ok(afterInput.steps-position.steps<=1,`Transition may settle at most one already-scheduled production step; observed ${afterInput.steps-position.steps}`);
  if(position.runtime&&afterInput.runtime)assert.deepEqual(afterInput.runtime,position.runtime);else assert.equal(afterInput.runtime,null,'Night runtime may only change here by completing its teardown');
  await shot('transition');
  if(name!=='chromium'&&await page.evaluate(()=>!!window.v725?.active()))await click(page.locator('#night-home-skip'));await page.waitForFunction(()=>!window.v725?.active());
  if(await option('Straight to bed').isVisible())await click(option('Straight to bed'));
  await page.waitForFunction(()=>!S.nightMode);await page.locator('#eod-rewards button').first().waitFor({state:'visible'});await click(page.locator('#eod-rewards button').first());
  await page.waitForFunction(()=>!S.nightMode&&S.clock<1020&&!S.inDialog);await page.waitForTimeout(1000);
  assert.equal(await page.evaluate(()=>S.nightMode||null),null);assert.equal(await page.evaluate(()=>localStorage.getItem('techops_char')),null);assert.equal(await page.evaluate(()=>S.meta.nightVisit.active),false);await shot('morning');
  record.steps.push('home/stay/sleep blocks movement and returns to day without re-entry');
  await page.evaluate(()=>localStorage.clear());await mount(page);await enterNight(page,touch);await click(page.locator('#night-campaign'));await click(option('Resume the daytime opening'));await returnScene(page);
  const evidence=await prepareStory(page);assert.equal((await page.evaluate(()=>TechOpsSector04Runtime.enterBrowser())).pending,true);await page.waitForFunction(()=>window.v722?.active());await page.keyboard.press('Escape');await page.waitForFunction(()=>S.nightMode?._sector04?.active&&!S.inDialog);
  await page.evaluate(()=>{NM.x=720;NM._continuityCheck='same-session';NM.enemies.forEach(e=>e.x=1000);});await click(page.locator('#night-campaign'));await click(option('Continue Sector 04 investigation'));
  assert.equal(await page.evaluate(()=>NM._continuityCheck),'same-session');assert.equal(await page.evaluate(()=>JSON.stringify(TechOpsCampaign.load(localStorage).evidence)),evidence);assert.equal(await page.evaluate(()=>TechOpsCampaign.load(localStorage).flags.tuesday_morning_reached),false);await shot('sector04');
  record.steps.push('asynchronous Sector 04 entry and evidence-preserving resume');assert.deepEqual(record.errors,[]);record.status='passed';
 }catch(e){record.status='failed';record.failure=String(e.stack||e);if(page){record.state=await snapshot(page).catch(()=>null);await page.screenshot({path:`${OUT}/${name}-failure.png`,timeout:5000}).catch(()=>{});}}
 finally{if(browser)await browser.close();await writeFile(`${OUT}/report.json`,JSON.stringify(results,null,2));console.log(JSON.stringify(record));}
}
const profiles=[['chromium',chromium,false,{width:1280,height:800}],['firefox',firefox,false,{width:1280,height:800}],['webkit',webkit,false,{width:1280,height:800}],['webkit-mobile',webkit,true,{width:844,height:390}]];
// Local execution can select installed engines; CI deliberately leaves this unset.
const selected=process.env.NIGHT_BROWSERS?.split(',');
try{for(const [name,engine,touch,viewport]of profiles)if(!selected||selected.includes(name))await run(name,engine,touch,viewport);}
finally{if(server)server.kill();}
if(!results.length||results.some(r=>r.status!=='passed'))process.exitCode=1;
