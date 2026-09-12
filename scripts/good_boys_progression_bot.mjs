import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';
import { GOOD_DOGS_CONTRACT_VERSION, clickGoodDogsLaunch, driveFreshRouteToCockpit } from './good_dogs_route_driver.mjs';

const BASE=process.env.BOT_BASE_URL||'http://127.0.0.1:4173/';
const OUT=process.env.BOT_OUT_DIR||'runtime-bot-artifacts';
const CONTRACT_VERSION=GOOD_DOGS_CONTRACT_VERSION;
fs.mkdirSync(OUT,{recursive:true});

const events=[],failures=[];
const log=(name,data={})=>{events.push({at:new Date().toISOString(),name,...data});console.log(name,JSON.stringify(data));};
const fail=(name,data={})=>{failures.push({name,...data});log('FAIL '+name,data);};

async function click(page,sel){return page.evaluate(s=>{const el=document.querySelector(s);if(!el)return false;el.click();return true;},sel).catch(()=>false);}
async function snap(page){return page.evaluate(()=>{const s=window.S||null,n=window.NM||null,c=n&&n._v736,m=s&&s.meta&&s.meta._v736,a=window.TechOpsGoodBoysProgressionAuthority,cs=window.TechOpsGoodBoysCampaignState,b=window.TechOpsGoodDogsCutsceneBridge,p=window.TechOpsGoodBoysPrisonGameplayV2;return{
  phase:window.__goodBoysOpeningPhase||null,openingError:window.__goodBoysOpeningErrorDetail||null,hard:window.__goodBoysHardButtonLaunch||null,
  mission:Number(c&&c.m||0),metaMission:Number(m&&m.m||0),stateMission:cs&&cs.mission?Number(cs.mission()):0,pair:!!(c&&c.chars&&c.chars.katrin&&c.chars.manchez),activeDog:c&&c.active||null,player:n?{x:n.x,y:n.y,hp:n.hp}:null,visibleDialogs:[...document.querySelectorAll("#dialogue:not(.hidden),#gb-prison-cine,#good-boys-earthfall-cine")].map(e=>({id:e.id,text:e.innerText.slice(0,600)})),inDialog:!!(s&&s.inDialog),cellOpened:!!(c&&c.cellOpened),
  authority:!!a,campaignState:!!cs,bibleWorld:!!window.TechOpsGoodBoysBibleWorld,backgroundAuthority:!!window.TechOpsGoodBoysBackgroundAuthority,accessCore:!!window.TechOpsGoodBoysAccessCoreAuthority,earthfall:!!window.TechOpsGoodBoysEarthfallEnding,
  acceptance:a&&a.acceptance?a.acceptance():null,prison:p&&p.acceptance?p.acceptance():null,bridge:b&&b.acceptance?b.acceptance():null,
  deck:window.__goodBoysDeckAssetState||null,deckInteract:window.__goodBoysDeckInteract||null,cutsceneExit:window.__goodDogsCutsceneExit||null,flight:window.__goodBoysSpaceFlight||window.__goodBoysShipFlightState||null,crash:window.__goodBoysCrashScene||null
};});}
function assertContractCompatible(d){const v=Number(d?.hard?.version||0);if(v>CONTRACT_VERSION)throw new Error(`Bot contract v${CONTRACT_VERSION} stale, runtime reports v${v}`);if(v&&v<CONTRACT_VERSION)fail('runtime-authority-older-than-progression-contract',{runtimeVersion:v,botContract:CONTRACT_VERSION,...d});}
async function moveToPilot(page){await page.waitForFunction(()=>window.__goodBoysDeckInteract&&window.__goodBoysDeckInteract.pilotAssetReady===true,null,{timeout:7000});await page.keyboard.down('ArrowRight');try{await page.waitForFunction(()=>window.__goodBoysDeckInteract&&window.__goodBoysDeckInteract.nearPilot===true,null,{timeout:7000});}finally{await page.keyboard.up('ArrowRight').catch(()=>{});}if(!await click(page,'#gbs-use'))throw new Error('pilot interaction unavailable');}
async function advanceTakeover(page){await page.waitForFunction(()=>{const e=window.__goodDogsCutsceneExit,f=window.__goodBoysShipFlightState,o=document.querySelector('#good-dogs-cutscene-overlay.active');return !!((e&&e.id==='GD_CUT_02')||(f&&(f.active||Number(f.progress||0)>0))||o);},null,{timeout:10000});if(await page.locator('#good-dogs-cutscene-overlay.active .gd-film-skip').count())await click(page,'#good-dogs-cutscene-overlay.active .gd-film-skip');await page.waitForFunction(()=>window.__goodBoysShipFlightState&&(window.__goodBoysShipFlightState.active||Number(window.__goodBoysShipFlightState.progress||0)>0),null,{timeout:8000});}
async function prisonBriefing(page,cards){const next=page.locator('#gb-prison-next');await next.waitFor({state:'visible',timeout:5000});for(let i=0;i<cards;i++)await next.click();await next.waitFor({state:'hidden',timeout:3000});}
async function clearBlockingCines(page,ms=5000){const until=Date.now()+ms;while(Date.now()<until){let acted=false;for(const sel of ['#gb-prison-cine button','#good-boys-earthfall-cine button','#good-boys-story-cine button','#dialogue:not(.hidden) #dlg-options button']){if(await page.locator(sel).count()&&await page.locator(sel).first().isVisible().catch(()=>false)){await page.locator(sel).first().evaluate(el=>{el.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,pointerId:91,pointerType:'touch',isPrimary:true,buttons:1}));if(!el.isConnected)return;el.dispatchEvent(new PointerEvent('pointerup',{bubbles:true,pointerId:91,pointerType:'touch',isPrimary:true,buttons:0}));if(el.isConnected)el.click();}).catch(()=>{});acted=true;break;}}if(!acted)return;await page.waitForTimeout(120);}}
async function resolveCutscene(page,id,timeout=12000){
  await page.waitForFunction(want=>{const e=window.__goodDogsCutsceneExit,o=document.querySelector('#good-dogs-cutscene-overlay.active');return !!((e&&e.id===want)||(o&&o.dataset.activeCutscene===want));},id,{timeout});
  let d=await snap(page);log('cutscene-'+id+'-start',d);
  const overlay=page.locator('#good-dogs-cutscene-overlay.active');if(await overlay.count()){const play=page.locator('#good-dogs-cutscene-overlay.active .gd-film-play.active');if(await play.count())await play.evaluate(el=>el.click()).catch(()=>{});await page.waitForTimeout(100);if(await page.locator('#good-dogs-cutscene-overlay.active .gd-film-skip').count())await click(page,'#good-dogs-cutscene-overlay.active .gd-film-skip');}
  await page.waitForFunction(want=>{const e=window.__goodDogsCutsceneExit;return !!(e&&e.id===want&&(e.status==='COMPLETED'||e.status==='USER_SKIPPED'));},id,{timeout});
  await page.waitForFunction(()=>!document.querySelector('#good-dogs-cutscene-overlay.active'),null,{timeout:3000});
  d=await snap(page);log('cutscene-'+id+'-complete',d);return d;
}

const browser=await chromium.launch({headless:true,...(process.env.BOT_CHROMIUM_EXECUTABLE?{executablePath:process.env.BOT_CHROMIUM_EXECUTABLE}:{}),...(process.env.BOT_CHROMIUM_CHANNEL?{channel:process.env.BOT_CHROMIUM_CHANNEL}:{})});const context=await browser.newContext({viewport:{width:1280,height:800}});await context.tracing.start({screenshots:true,snapshots:true,sources:true});const page=await context.newPage();
try{
  await page.goto(BASE,{waitUntil:'domcontentloaded',timeout:30000});await page.waitForTimeout(1500);if(!await clickGoodDogsLaunch(page))throw new Error('Good Dogs launch button missing');
  await driveFreshRouteToCockpit(page,{onEvent:log,requireDecoded:true});
  await page.waitForSelector('#good-boys-deck-supplied',{state:'visible',timeout:9000});let d=await snap(page);assertContractCompatible(d);log('cockpit',d);if(!d.deckInteract||d.deckInteract.interaction!=='pilot')fail('pilot-interaction-contract-missing',d);if(d.hard?.openingAuthority!=='TechOpsGoodBoysButtonHardFix'||Number(d.hard?.version||0)<CONTRACT_VERSION)fail('hard-opening-authority-mismatch',d);await moveToPilot(page);
  await advanceTakeover(page);await page.waitForSelector('#good-boys-ship-flight',{state:'visible',timeout:7000});await page.waitForFunction(()=>window.__goodBoysShipFlightState&&window.__goodBoysShipFlightState.completed===true,null,{timeout:13000});
  await page.waitForFunction(()=>{const c=window.__goodBoysCrashScene;return !!(document.querySelector('#good-boys-crash-canonical')||(c&&(c.active||c.completed)));},null,{timeout:7000});d=await snap(page);log('crash-start',d);if(d.cutsceneExit?.id==='GD_CUT_03')fail('retired-gd-cut-03-played',d);if(d.crash?.procedural===true)fail('procedural-crash-authority-returned',d);await page.waitForFunction(()=>window.__goodBoysCrashScene&&window.__goodBoysCrashScene.completed===true,null,{timeout:18000});

  await page.waitForFunction(()=>window.NM&&window.NM._v736&&Number(window.NM._v736.m)===3,null,{timeout:7000});await prisonBriefing(page,3);let s=await snap(page);assertContractCompatible(s);log('m3-start',s);
  if(s.openingError)fail('opening-error',s);if(s.mission!==3||s.metaMission!==3||s.stateMission!==3)fail('opening-did-not-canonically-enter-m3',s);if(!s.pair)fail('good-dogs-pair-not-attached',s);if(!s.authority||!s.campaignState||!s.accessCore||!s.earthfall)fail('campaign-authorities-not-attached',s);if(!s.prison||Number(s.prison.version||0)<2)fail('prison-breach-authority-missing',s);

  // Mission metadata changes before the fresh runtime mounts. Prime only after
  // the completed handoff, its transition cooldown, and the entry briefing.
  await page.waitForFunction(()=>{
    const a=window.TechOpsGoodBoysProgressionAuthority?.acceptance();
    return a?.active&&a.mission===3&&a.handoffComplete?.mission===3&&!a.handoff&&!a.transition&&(a.lastAdvanceAge===null||a.lastAdvanceAge>=700);
  },null,{timeout:9000});
  await clearBlockingCines(page,2500);
  await page.waitForFunction(()=>!window.S.inDialog,null,{timeout:5000});
  const objectivePrimed=await page.evaluate(()=>window.TechOpsGoodBoysPrisonGameplayV2&&window.TechOpsGoodBoysPrisonGameplayV2.testPrimeComplete?window.TechOpsGoodBoysPrisonGameplayV2.testPrimeComplete():false);log('m3-objective-prime',{objectivePrimed});if(!objectivePrimed)fail('m3-objective-prime-unavailable',s);
  const combatPrimed=await page.evaluate(()=>window.TechOpsGoodBoysProgressionAuthority&&window.TechOpsGoodBoysProgressionAuthority.testPrimeClear?window.TechOpsGoodBoysProgressionAuthority.testPrimeClear():false);log('m3-combat-prime-clear',{combatPrimed});if(!combatPrimed)fail('m3-prime-clear-unavailable',s);
  await page.waitForFunction(()=>window.NM&&window.NM._v736&&Number(window.NM._v736.m)===4,null,{timeout:9000});

  s=await resolveCutscene(page,'GD_CUT_04',12000);if(s.mission!==4)fail('gd-cut-04-did-not-return-to-m4',s);if(s.inDialog&&!s.bridge?.visibleBlocker)fail('stale-dialog-after-gd-cut-04',s);
  const before05=await snap(page);if(before05.bridge?.seen?.GD_CUT_05)fail('gd-cut-05-played-before-cell-open',before05);

  await page.evaluate(()=>{if(window.NM&&window.NM._v736)window.NM._v736.cellOpened=true;if(window.TechOpsGoodDogsCutsceneBridge)window.TechOpsGoodDogsCutsceneBridge.tick();});
  s=await resolveCutscene(page,'GD_CUT_05',12000);if(s.mission!==4)fail('gd-cut-05-did-not-return-to-m4',s);if(s.inDialog&&!s.bridge?.visibleBlocker)fail('stale-dialog-after-gd-cut-05',s);if(!s.bridge?.seen?.GD_CUT_05)fail('gd-cut-05-not-persisted',s);

  await page.screenshot({path:path.join(OUT,'goodboys-progression-cell118-cutscenes.png')});

  // Continue past the previously truncated Cell 118 check. These are explicit
  // encounter fixtures: they exercise real transitions/cutscenes and Warden
  // damage handling, not player skill or physical-device acceptance.
  for(const from of [4,5,6]){
    await clearBlockingCines(page,2500);
    await page.waitForFunction(m=>{
      const a=window.TechOpsGoodBoysProgressionAuthority,c=window.NM&&window.NM._v736;
      return c&&Number(c.m)===m&&a&&!a.acceptance().transition&&!a.acceptance().cinematicVisible;
    },from,{timeout:10000});
    await page.waitForTimeout(750);
    const primed=await page.evaluate(()=>window.TechOpsGoodBoysProgressionAuthority.testPrimeClear());
    log('encounter-fixture-clear',{from,primed});
    if(!primed)throw new Error('Encounter fixture failed at M'+from);
    await page.waitForFunction(m=>window.NM&&window.NM._v736&&Number(window.NM._v736.m)===m,from+1,{timeout:10000});
    s=await resolveCutscene(page,{4:'GD_CUT_06',5:'GD_CUT_07',6:'GD_CUT_08'}[from],12000);
    // The bridge restores this briefing after the film exits. A momentarily
    // clear modal state is not evidence that mission entry has settled.
    await prisonBriefing(page,1);
    if(s.mission!==from+1||s.metaMission!==from+1||s.stateMission!==from+1)fail('later-mission-authority-diverged',s);
  }
  await clearBlockingCines(page,2500);
  await page.waitForFunction(()=>{
    const n=window.NM,a=window.TechOpsGoodBoysProgressionAuthority;
    return n&&n._v736&&Number(n._v736.m)===7&&a&&!a.acceptance().cinematicVisible&&!a.acceptance().transition&&(n.enemies||[]).some(e=>e.kind==='warden1984'&&e.alive&&e.hp>0);
  },null,{timeout:10000});
  await page.waitForTimeout(800);
  const warden=await page.evaluate(()=>{
    const n=window.NM,c=n._v736,b=n.enemies.find(e=>e.kind==='warden1984'&&e.alive);
    // Seed the documented finisher window, then call the actual combat action.
    c.finisherReady=true;c.sync=100;c.pendingSpawn=null;
    for(const dog of Object.values(c.chars)){dog.downed=false;dog.out=false;dog.hp=dog.maxHp||100;}
    b.hp=1;window.v736.finisher();
    return{kind:b.kind,hp:b.hp,alive:b.alive};
  });
  log('warden-real-finisher',warden);
  if(warden.alive!==false||warden.hp>0)throw new Error('Warden remains alive after real tandem finisher');
  await page.keyboard.down('ArrowRight');
  try{await page.waitForFunction(()=>window.NM&&Number(window.NM.x)>=1500||document.querySelector('#good-boys-earthfall-cine'),null,{timeout:12000});}finally{await page.keyboard.up('ArrowRight');}
  await page.waitForFunction(()=>document.querySelector('#good-boys-earthfall-cine'),null,{timeout:15000});
  const beforeEnding=await snap(page);if(!beforeEnding.inDialog)fail('earthfall-does-not-block-gameplay',beforeEnding);
  await page.screenshot({path:path.join(OUT,'goodboys-progression-earthfall.png')});
  for(let i=0;i<4;i++)await click(page,'#gbe-next');
  await page.waitForFunction(()=>window.S&&window.S.meta&&window.S.meta._v736&&window.S.meta._v736.done,null,{timeout:5000});
  await page.waitForTimeout(300);
  await page.screenshot({path:path.join(OUT,'goodboys-progression-completed.png')});
  const ending=await page.evaluate(()=>({visibleDialogs:['dialogue','gb-prison-cine','good-boys-story-cine','good-boys-earthfall-cine','good-dogs-cutscene-overlay'].filter(id=>{const el=document.getElementById(id);return el&&!el.classList.contains('hidden')&&getComputedStyle(el).display!=='none';}).map(id=>({id,text:document.getElementById(id).innerText.slice(0,300)})),campaign:window.S.meta._v736,breakout:window.S.meta._v736breakout,pair:window.S.meta._v736pair,inDialog:window.S.inDialog,overlay:!!document.querySelector('#good-boys-earthfall-cine')}));
  log('earthfall-complete',ending);
  if(ending.campaign.m!==8||!ending.campaign.k||!ending.campaign.waldo||!ending.breakout||!ending.pair||ending.inDialog||ending.overlay)fail('earthfall-completion-contract',ending);
}catch(e){fail('bot-exception',{error:String(e&&e.stack||e),state:await snap(page).catch(()=>null)});await page.screenshot({path:path.join(OUT,'goodboys-progression-exception.png')}).catch(()=>{});}finally{await context.tracing.stop({path:path.join(OUT,'goodboys-progression-trace.zip')}).catch(()=>{});await browser.close();}
const report={pass:failures.length===0,contractVersion:CONTRACT_VERSION,contract:'GD_CUT_01 -> real-input M1 trail -> real-input M2 hangar -> cockpit/flight/crash -> M3 breach -> Cell 118/K -> M5/M6 rescue fixtures -> real Warden finisher -> Earthfall and unlocks',failures,events};fs.writeFileSync(path.join(OUT,'goodboys-progression.json'),JSON.stringify(report,null,2));
fs.writeFileSync(path.join(OUT,'goodboys-progression.md'),['# Good Dogs Progression Bot','',`- Result: **${report.pass?'PASS':'FAIL'}**`,`- Contract: ${report.contract}`,`- Failures: ${failures.length}`,'','M1 and M2 use real keyboard input. Later encounter fixtures do not certify physical-device gameplay.','',...failures.map(f=>'- '+f.name+': '+JSON.stringify(f)),''].join('\n'));
console.log(JSON.stringify(report,null,2));if(!report.pass)process.exitCode=1;
