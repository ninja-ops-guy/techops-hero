import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const BASE=process.env.BOT_BASE_URL||'http://127.0.0.1:4173/';
const OUT=process.env.BOT_OUT_DIR||'runtime-bot-artifacts';
const CONTRACT_VERSION=13;
fs.mkdirSync(OUT,{recursive:true});

const events=[],failures=[];
const log=(name,data={})=>{events.push({at:new Date().toISOString(),name,...data});console.log(name,JSON.stringify(data));};
const fail=(name,data={})=>{failures.push({name,...data});log('FAIL '+name,data);};

async function clickMatching(page,re){
  for(const b of await page.locator('button').all()){
    const t=(await b.innerText().catch(()=>'' )).trim();
    if(re.test(t)){await b.evaluate(el=>el.click());return t;}
  }
  return null;
}
async function click(page,sel){return page.evaluate(s=>{const el=document.querySelector(s);if(!el)return false;el.click();return true;},sel).catch(()=>false);}
async function snap(page){
  return page.evaluate(()=>{
    const s=window.S||null,n=window.NM||null,c=n&&n._v736,m=s&&s.meta&&s.meta._v736,a=window.TechOpsGoodBoysProgressionAuthority,cs=window.TechOpsGoodBoysCampaignState;
    return{
      phase:window.__goodBoysOpeningPhase||null,openingError:window.__goodBoysOpeningErrorDetail||null,
      hard:window.__goodBoysHardButtonLaunch||null,
      mission:Number(c&&c.m||0),metaMission:Number(m&&m.m||0),stateMission:cs&&cs.mission?Number(cs.mission()):0,
      pair:!!(c&&c.chars&&c.chars.katrin&&c.chars.manchez),activeDog:c&&c.active||null,
      authority:!!a,campaignState:!!cs,bibleWorld:!!window.TechOpsGoodBoysBibleWorld,
      backgroundAuthority:!!window.TechOpsGoodBoysBackgroundAuthority,accessCore:!!window.TechOpsGoodBoysAccessCoreAuthority,
      earthfall:!!window.TechOpsGoodBoysEarthfallEnding,acceptance:a&&a.acceptance?a.acceptance():null,
      deck:window.__goodBoysDeckAssetState||null,deckInteract:window.__goodBoysDeckInteract||null,
      cutsceneExit:window.__goodDogsCutsceneExit||null,
      flight:window.__goodBoysSpaceFlight||window.__goodBoysShipFlightState||null,crash:window.__goodBoysCrashScene||null
    };
  });
}
function assertContractCompatible(d){
  const v=Number(d?.hard?.version||0);
  if(v>CONTRACT_VERSION)throw new Error(`Bot contract v${CONTRACT_VERSION} stale, runtime reports v${v}`);
  if(v&&v<CONTRACT_VERSION)fail('runtime-authority-older-than-progression-contract',{runtimeVersion:v,botContract:CONTRACT_VERSION,...d});
}
async function moveToPilot(page){
  await page.waitForFunction(()=>window.__goodBoysDeckInteract&&window.__goodBoysDeckInteract.pilotAssetReady===true,null,{timeout:7000});
  await page.keyboard.down('ArrowRight');
  try{await page.waitForFunction(()=>window.__goodBoysDeckInteract&&window.__goodBoysDeckInteract.nearPilot===true,null,{timeout:7000});}
  finally{await page.keyboard.up('ArrowRight').catch(()=>{});}
  if(!await click(page,'#gbs-use'))throw new Error('pilot interaction unavailable');
}
async function advanceTakeover(page){
  await page.waitForFunction(()=>{
    const e=window.__goodDogsCutsceneExit,f=window.__goodBoysShipFlightState,o=document.querySelector('#good-dogs-cutscene-overlay.active');
    return !!((e&&e.id==='GD_CUT_02')||(f&&(f.active||Number(f.progress||0)>0))||o);
  },null,{timeout:10000});
  if(await page.locator('#good-dogs-cutscene-overlay.active .gd-film-skip').count())await click(page,'#good-dogs-cutscene-overlay.active .gd-film-skip');
  await page.waitForFunction(()=>window.__goodBoysShipFlightState&&(window.__goodBoysShipFlightState.active||Number(window.__goodBoysShipFlightState.progress||0)>0),null,{timeout:8000});
}
async function clearBlockingCines(page,ms=5000){
  const until=Date.now()+ms;
  while(Date.now()<until){
    let acted=false;
    for(const sel of ['#gb-prison-cine button','#good-boys-earthfall-cine button','#good-boys-story-cine button','#dialogue:not(.hidden) #dlg-options button']){
      if(await page.locator(sel).count()&&await page.locator(sel).first().isVisible().catch(()=>false)){
        await page.locator(sel).first().evaluate(el=>el.click()).catch(()=>{});acted=true;break;
      }
    }
    if(!acted)return;
    await page.waitForTimeout(120);
  }
}

const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:1280,height:800}});
await context.tracing.start({screenshots:true,snapshots:true,sources:true});
const page=await context.newPage();

try{
  await page.goto(BASE,{waitUntil:'domcontentloaded',timeout:30000});
  await page.waitForTimeout(1500);
  if(!await clickMatching(page,/(118\/1984|BREAKOUT|GOOD\s*BOYS)/i))throw new Error('Good Boys launch button missing');

  await page.waitForSelector('#good-boys-deck-supplied',{state:'visible',timeout:9000});
  let d=await snap(page);assertContractCompatible(d);log('cockpit',d);
  if(!d.deckInteract||d.deckInteract.interaction!=='pilot')fail('pilot-interaction-contract-missing',d);
  if(d.hard?.openingAuthority!=='TechOpsGoodBoysButtonHardFix'||Number(d.hard?.version||0)<CONTRACT_VERSION)fail('hard-opening-authority-mismatch',d);
  await moveToPilot(page);
  d=await snap(page);log('pilot-interaction-complete',d);

  await advanceTakeover(page);
  await page.waitForSelector('#good-boys-ship-flight',{state:'visible',timeout:7000});
  await page.waitForFunction(()=>window.__goodBoysShipFlightState&&window.__goodBoysShipFlightState.completed===true,null,{timeout:13000});

  await page.waitForFunction(()=>{const c=window.__goodBoysCrashScene;return !!(document.querySelector('#good-boys-crash-canonical')||(c&&(c.active||c.completed)));},null,{timeout:7000});
  d=await snap(page);log('crash-start',d);
  if(d.cutsceneExit?.id==='GD_CUT_03')fail('retired-gd-cut-03-played',d);
  if(d.crash?.procedural===true)fail('procedural-crash-authority-returned',d);
  await page.waitForFunction(()=>window.__goodBoysCrashScene&&window.__goodBoysCrashScene.completed===true,null,{timeout:18000});

  await page.waitForFunction(()=>window.NM&&window.NM._v736&&Number(window.NM._v736.m)===3,null,{timeout:7000});
  await clearBlockingCines(page,2500);
  let s=await snap(page);assertContractCompatible(s);log('m3-start',s);
  if(s.openingError)fail('opening-error',s);
  if(s.mission!==3||s.metaMission!==3||s.stateMission!==3)fail('opening-did-not-canonically-enter-m3',s);
  if(!s.pair)fail('good-dogs-pair-not-attached',s);
  if(!s.authority||!s.campaignState||!s.accessCore||!s.earthfall)fail('campaign-authorities-not-attached',s);
  if(s.acceptance&&s.acceptance.invariant&&s.acceptance.invariant.ok===false)fail('opening-handoff-invariant-failed',s);

  const primed=await page.evaluate(()=>window.TechOpsGoodBoysProgressionAuthority&&window.TechOpsGoodBoysProgressionAuthority.testPrimeClear?window.TechOpsGoodBoysProgressionAuthority.testPrimeClear():false);
  log('m3-prime-clear',{primed});
  if(!primed)fail('m3-prime-clear-unavailable',s);

  const until=Date.now()+9000;
  while(Date.now()<until){
    await clearBlockingCines(page,700);
    s=await snap(page);
    if(s.mission===4||s.metaMission===4||s.stateMission===4)break;
    await page.waitForTimeout(120);
  }
  log('m4-result',s);
  if(s.mission!==4&&s.metaMission!==4&&s.stateMission!==4)fail('m3-did-not-progress-to-m4',s);
  await page.screenshot({path:path.join(OUT,'goodboys-progression-m4.png')});
}catch(e){
  fail('bot-exception',{error:String(e&&e.stack||e),state:await snap(page).catch(()=>null)});
  await page.screenshot({path:path.join(OUT,'goodboys-progression-exception.png')}).catch(()=>{});
}finally{
  await context.tracing.stop({path:path.join(OUT,'goodboys-progression-trace.zip')}).catch(()=>{});
  await browser.close();
}

const report={pass:failures.length===0,contractVersion:CONTRACT_VERSION,contract:'pilot interaction -> GD_CUT_02 skip -> flight -> authored crash -> M3 -> M4',failures,events};
fs.writeFileSync(path.join(OUT,'goodboys-progression.json'),JSON.stringify(report,null,2));
console.log(JSON.stringify(report,null,2));
if(!report.pass)process.exitCode=1;
