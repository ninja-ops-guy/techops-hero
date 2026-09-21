// Full production page. Story prerequisites and travel distance are labeled fixtures;
// mode selection, movement, home, journal and return use browser input, never forced clicks.
import {chromium,firefox,webkit} from 'playwright';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {spawn} from 'node:child_process';
const OUT=process.env.NIGHT_REPORT_DIR||(process.env.BOT_OUT_DIR?`${process.env.BOT_OUT_DIR}/night-lifecycle`:'artifacts/night-lifecycle');
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
async function startupSnapshot(page){return page.evaluate(()=>({
 readyState:document.readyState,visibility:document.visibilityState,bootstrapReady:!!window.__productionBootstrapReady,
 bootstrap:window.TechOpsProductionBootstrap?.health?.(),title:window.TechOpsProductionTitleExperience?.state?.(),
 bootstrapError:window.__productionBootstrapError||null,modeError:window.__productionModeRouterError||null,
 lastScripts:[...document.scripts].slice(-8).map(script=>({src:script.src,async:script.async})),
 resourceCount:performance.getEntriesByType('resource').length
}));}
async function mount(page){
 await page.goto(URL,{waitUntil:'domcontentloaded'});
 try{await page.waitForFunction(()=>window.__productionBootstrapReady&&window.TechOpsNightRuntime);}
 catch(error){error.message+='\nStartup observation: '+JSON.stringify(await startupSnapshot(page).catch(()=>null));throw error;}
}
async function sectorMenuProbe(page){
 return page.evaluate(()=>{
  const states=new WeakMap(),worlds=new WeakMap(),labels=new WeakMap();let nextState=0,nextWorld=0,nextLabel=0;
  const identity=(map,value,next)=>{if(!value||typeof value!=='object')return null;if(!map.has(value))map.set(value,next());return map.get(value);};
  const probe={events:[]},button=document.getElementById('night-campaign');
  const describe=node=>node?{id:node.id||null,tag:node.tagName||null,control:node.closest?.('button')?.id||null}:null;
  const capture=(phase,event)=>{
   const state=typeof S!=='undefined'?S:window.S,night=typeof NM!=='undefined'?NM:window.NM,dialogue=document.getElementById('dialogue');
   const box=button?.getBoundingClientRect(),style=button&&getComputedStyle(button),hit=box&&document.elementFromPoint(box.x+box.width/2,box.y+box.height/2);
   const entry={phase,at:performance.now(),event:event?{type:event.type,target:describe(event.target),button:event.button,detail:event.detail,defaultPrevented:event.defaultPrevented}:null,
    stateId:identity(states,state,()=>++nextState),worldId:identity(worlds,night,()=>++nextWorld),stateWorldId:identity(worlds,state?.nightMode,()=>++nextWorld),
    night:!!state?.nightMode,inDialog:state?.inDialog,hp:night?.hp,sector:!!night?._sector04?.active,district:night?.district,
    runtime:window.TechOpsNightRuntime?.health(),presentation:window.TechOpsPresentationDirector?.current(),
    dialogue:{hidden:dialogue?.classList.contains('hidden'),name:document.getElementById('dlg-name')?.textContent,options:[...document.querySelectorAll('#dlg-options button')].map(option=>option.textContent)},
    control:{labelNodeId:identity(labels,button?.firstChild,()=>++nextLabel),connected:!!button?.isConnected,disabled:!!button?.disabled,rect:box?.toJSON(),display:style?.display,visibility:style?.visibility,pointerEvents:style?.pointerEvents,hit:describe(hit),hitOwned:!!(hit&&(hit===button||button?.contains(hit)))}};
   probe.events.push(entry);return entry;
  };
  const listen=event=>{if(probe.events.length<24)capture(event.type,event);};
  for(const type of ['pointerdown','mousedown','pointerup','mouseup','click'])window.addEventListener(type,listen,true);
  probe.finish=()=>{capture('after activation');for(const type of ['pointerdown','mousedown','pointerup','mouseup','click'])window.removeEventListener(type,listen,true);return probe.events;};
  window.__nightLifecycleMenuProbe=probe;return capture('before activation');
 });
}
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
async function sharedSceneControls(page){
 const scene=page.locator('#v725-cine'),pause=scene.locator('.day-cine-pause'),skip=scene.locator('.day-cine-skip');
 await pause.waitFor({state:'visible'});await skip.waitFor({state:'visible'});
 assert.equal(await page.locator('#night-home-skip').count(),0,'shared cinematic controls must replace the external Night skip');
 assert.equal(await scene.locator('.day-cine-skip').count(),1,'one shared Skip owns transition settlement');
 return {scene,pause,skip};
}
async function returnScene(page){await page.waitForFunction(()=>window.v725?.active()||!window.S?.nightMode);if(await page.evaluate(()=>!!window.v725?.active()))await (await sharedSceneControls(page)).skip.click();await page.waitForFunction(()=>!S.nightMode);}
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
  await mount(page);const storyMarker=JSON.stringify({day:7,clock:700,meta:{marker:'standalone-night-isolation'}});await page.evaluate(value=>localStorage.setItem('techops_save',value),storyMarker);await enterNight(page,touch);record.steps.push('reachable title/difficulty/Night Drive launch');
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
  await click(page.locator('#night-campaign'));await page.waitForFunction(()=>document.querySelector('#dlg-text')?.textContent.includes('saves separately'));assert.match(await page.locator('#dlg-text').innerText(),/saves separately/);assert.equal(await option('Resume the daytime opening').count(),0);await click(option('Back to the street'));record.steps.push('standalone run menu preserves campaign isolation');
  await page.evaluate(()=>{NM.x=110;NM.y=396;NM.vx=NM.vy=0;});await page.keyboard.press('e');await click(option('HOME STREET'));
  await page.waitForFunction(()=>NM?.district==='home'&&!NM.drive);await page.evaluate(()=>{NM.x=1730;NM.y=396;});await page.waitForTimeout(180);assert.equal(await page.evaluate(()=>!!S.nightMode),true);
  await page.evaluate(()=>{NM.x=1489;NM.y=396;NM.vx=NM.vy=0;});await page.locator('#night-home-interact').waitFor({state:'visible'});await shot('home');
  await click(page.locator('#night-home-interact'));await click(option('Stay out tonight'));assert.equal(await page.evaluate(()=>!!S.nightMode),true);
  await click(page.locator('#night-home-interact'));await click(option('Sleep — finish this Night run'));
  const transitionControls=await sharedSceneControls(page);
  await click(transitionControls.pause);await page.waitForFunction(()=>window.v725?.presentation().paused);
  assert.equal(await transitionControls.pause.getAttribute('aria-label'),'Resume cinematic');
  assert.equal(await page.evaluate(()=>TechOpsPresentationDirector.isBlocking()),true,'home transition must own input before standalone exit');
  const pausedShot=await page.evaluate(()=>v725.presentation().shot);
  await page.keyboard.press('Tab');assert.equal(await page.evaluate(()=>v725.active()&&v725.presentation().paused),true,'Tab cannot settle the paused transition');
  await shot('transition');assert.equal(await page.evaluate(()=>v725.presentation().shot),pausedShot,'capture cannot advance the paused shot');
  await click(transitionControls.pause);await page.waitForFunction(()=>window.v725?.active()&&!v725.presentation().paused);
  assert.equal(await transitionControls.pause.getAttribute('aria-label'),'Pause cinematic');
  // Keep the scene held while navigation listeners are armed on slow runners.
  await click(transitionControls.pause);await page.waitForFunction(()=>window.v725?.presentation().paused);
  record.steps.push('shared cinematic Pause/Resume/Tab controls and one explicit Skip');
  const standaloneReload=page.waitForNavigation({waitUntil:'domcontentloaded'});await click(transitionControls.skip);await standaloneReload;await page.waitForFunction(()=>window.__productionBootstrapReady&&window.TechOpsProductionTitleExperience?.state().ready);
  assert.equal(await page.evaluate(()=>localStorage.getItem('techops_save')),storyMarker,'standalone Night cannot overwrite the campaign profile');
  assert.equal(await page.evaluate(()=>localStorage.getItem('techops_char')),null);assert.equal(await page.locator('#title-night-result').isVisible(),true);await shot('morning');
  record.steps.push('home/stay/sleep returns to title with isolated campaign save and visible debrief');
  await page.evaluate(()=>localStorage.clear());await mount(page);await page.waitForFunction(()=>window.TechOpsProductionTitleExperience?.state().ready);await click(page.locator('#btn-start'));await click(option('Standard'));await click(option('Clock in'));await page.waitForFunction(()=>window.S&&!S.nightMode&&!S.inDialog);record.steps.push('actual Day entry before fixture-assisted campaign Night');
  const evidence=await prepareStory(page);assert.equal((await page.evaluate(()=>TechOpsSector04Runtime.enterBrowser())).pending,true);await page.waitForFunction(()=>window.v722?.active());await page.keyboard.press('Escape');await page.waitForFunction(()=>S.nightMode?._sector04?.active&&!S.inDialog);
  await page.evaluate(()=>{NM.x=720;NM._continuityCheck='same-session';NM.enemies.forEach(e=>e.x=1000);});
  await sectorMenuProbe(page);
  try{await click(page.locator('#night-campaign'));}
  finally{record.sectorMenu=await page.evaluate(()=>window.__nightLifecycleMenuProbe?.finish());}
  const opened=record.sectorMenu.at(-1);
  assert.ok(opened.night&&opened.sector&&opened.inDialog&&!opened.dialogue.hidden&&opened.dialogue.options.some(text=>text.includes('Continue Sector 04 investigation')),
    'Sector 04 menu must open from one visible activation before gameplay can mask the failure: '+JSON.stringify(record.sectorMenu));
  await click(option('Continue Sector 04 investigation'));
  assert.equal(await page.evaluate(()=>NM._continuityCheck),'same-session');assert.equal(await page.evaluate(()=>JSON.stringify(TechOpsCampaign.load(localStorage).evidence)),evidence);assert.equal(await page.evaluate(()=>TechOpsCampaign.load(localStorage).flags.tuesday_morning_reached),false);await shot('sector04');
  record.steps.push('asynchronous Sector 04 entry and evidence-preserving resume');assert.deepEqual(record.errors,[]);record.status='passed';
 }catch(e){record.status='failed';record.failure=String(e.stack||e);if(page){record.state=await snapshot(page).catch(()=>null);record.startup=await startupSnapshot(page).catch(()=>null);await page.screenshot({path:`${OUT}/${name}-failure.png`,timeout:5000}).catch(()=>{});}}
 finally{if(browser)await browser.close();await writeFile(`${OUT}/report.json`,JSON.stringify(results,null,2));console.log(JSON.stringify(record));}
}
const profiles=[['chromium',chromium,false,{width:1280,height:800}],['firefox',firefox,false,{width:1280,height:800}],['webkit',webkit,false,{width:1280,height:800}],['webkit-mobile',webkit,true,{width:844,height:390}]];
// Local execution can select installed engines; CI deliberately leaves this unset.
const selected=process.env.NIGHT_BROWSERS?.split(',');
try{for(const [name,engine,touch,viewport]of profiles)if(!selected||selected.includes(name))await run(name,engine,touch,viewport);}
finally{if(server)server.kill();}
if(!results.length||results.some(r=>r.status!=='passed'))process.exitCode=1;
