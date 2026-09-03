import fs from 'node:fs';
import path from 'node:path';
import { webkit, devices } from 'playwright';
const BASE=process.env.BOT_BASE_URL||'http://127.0.0.1:4173/';
const OUT=process.env.BOT_OUT_DIR||'runtime-bot-artifacts';
fs.mkdirSync(OUT,{recursive:true});
const failures=[],events=[];
const log=(name,data={})=>{events.push({at:new Date().toISOString(),name,...data});console.log(name,JSON.stringify(data));};
const fail=(name,data={})=>{failures.push({name,...data});log('FAIL '+name,data);};
async function clickLaunch(page){for(const b of await page.locator('button').all()){const t=(await b.innerText().catch(()=>'' )).trim();if(/118\/1984|BREAKOUT|GOOD\s*BOYS/i.test(t)){await b.evaluate(el=>el.click());return t;}}return null;}
async function click(page,selector){return page.evaluate(sel=>{const el=document.querySelector(sel);if(!el)return false;el.click();return true;},selector).catch(()=>false);}
async function phase(page){return page.evaluate(()=>({phase:window.__goodBoysOpeningPhase||null,deck:window.__goodBoysDeckAssetState||null,deckInteract:window.__goodBoysDeckInteract||null,cutsceneExit:window.__goodDogsCutsceneExit||null,autoplay:window.__goodDogsCutsceneAutoplay||null,gesture:window.__goodDogsCutsceneNeedsGesture||null,flight:window.__goodBoysShipFlightState||null,flightTrace:window.__goodBoysShipFlightTrace||null,crash:window.__goodBoysCrashScene||null,error:window.__goodBoysOpeningErrorDetail||null,hard:window.__goodBoysHardButtonLaunch||null,handoff:window.__goodBoysHandoffAuthority||null,mission:window.NM&&window.NM._v736?Number(window.NM._v736.m||0):0,pair:!!(window.NM&&window.NM._v736&&window.NM._v736.chars&&window.NM._v736.chars.katrin&&window.NM._v736.chars.manchez),activeDog:window.NM&&window.NM._v736?window.NM._v736.active:null}));}
async function canvasSignal(page,selector){return page.evaluate(sel=>{const c=document.querySelector(sel);if(!c)return null;const x=c.getContext('2d',{willReadFrequently:true});if(!x)return null;const w=c.width,h=c.height,d=x.getImageData(0,0,w,h).data;let nonBlack=0,alpha=0,min=255,max=0;for(let i=0;i<d.length;i+=16){const r=d[i],g=d[i+1],b=d[i+2],a=d[i+3];if(a)alpha++;if(r||g||b)nonBlack++;min=Math.min(min,r,g,b);max=Math.max(max,r,g,b);}return{nonBlack,alpha,range:max-min,w,h};},selector).catch(()=>null);}
async function holdRightToPilot(page){
  await page.waitForFunction(()=>window.__goodBoysDeckInteract&&window.__goodBoysDeckInteract.pilotAssetReady===true,null,{timeout:7000});
  await page.keyboard.down('ArrowRight');
  try{
    await page.waitForFunction(()=>window.__goodBoysDeckInteract&&window.__goodBoysDeckInteract.nearPilot===true,null,{timeout:7000});
  }finally{
    await page.keyboard.up('ArrowRight').catch(()=>{});
  }
}
async function assertAutoplayThenSkip(page,id){
  await page.waitForFunction(want=>{const e=window.__goodDogsCutsceneExit;if(e&&e.id===want)return true;const o=document.querySelector('#good-dogs-cutscene-overlay.active'),v=o&&o.querySelector('video');return !!(o&&v&&String(v.currentSrc||v.getAttribute('src')||'').includes(want));},id,{timeout:10000});
  await page.waitForFunction(want=>{const e=window.__goodDogsCutsceneExit;if(e&&e.id===want)return true;const o=document.querySelector('#good-dogs-cutscene-overlay.active'),v=o&&o.querySelector('video'),p=o&&o.querySelector('.gd-film-play');return !!(o&&v&&Number(v.currentTime||0)>.08&&!(p&&p.classList.contains('active')));},id,{timeout:8000});
  const s=await phase(page);log('cutscene-autoplay-'+id,s);if(s.gesture&&s.gesture.id===id)fail('cutscene-required-manual-play',{id,...s});
  if(s.cutsceneExit&&s.cutsceneExit.id===id)return;
  if(!await click(page,'#good-dogs-cutscene-overlay.active .gd-film-skip'))throw new Error('skip unavailable for '+id);await page.waitForFunction(want=>window.__goodDogsCutsceneExit&&window.__goodDogsCutsceneExit.id===want,id,{timeout:5000});
}
const browser=await webkit.launch({headless:true});const context=await browser.newContext({...devices['iPhone 15 Pro'],viewport:{width:393,height:852}});await context.tracing.start({screenshots:true,snapshots:true,sources:true});const page=await context.newPage();
try{
  await page.goto(BASE,{waitUntil:'domcontentloaded',timeout:30000});await page.waitForTimeout(1800);
  const clicked=await clickLaunch(page);if(!clicked)throw new Error('Good Boys launch button missing');log('launch',{clicked});
  await page.waitForSelector('#good-boys-deck-supplied',{state:'visible',timeout:9000});await page.waitForTimeout(250);
  const deckSignal=await canvasSignal(page,'#good-boys-deck-supplied canvas');let deckState=await phase(page);log('cockpit',{deckSignal,...deckState});
  if(!deckSignal||deckSignal.nonBlack<100||deckSignal.alpha<100||deckSignal.range<8)fail('cockpit-canvas-blank',{deckSignal,...deckState});
  const pilotAsset=String(deckState.deck?.pilotAsset||deckState.deckInteract?.pilotAsset||'').split('?')[0];
  if(pilotAsset!=='assets/v736/good_boys_ship/cockpit_pilot.jpg'||deckState.phase?.assetAuthority!=='supplied-pilot')fail('cockpit-pilot-asset-not-authoritative',deckState);
  if(!deckState.handoff||deckState.handoff.owner!=='TechOpsGoodBoysButtonHardFix')fail('opening-authority-not-hard-button',deckState);
  await page.screenshot({path:path.join(OUT,'goodboys-cockpit.png')});
  await holdRightToPilot(page);deckState=await phase(page);log('pilot-in-range',deckState);if(!deckState.deckInteract?.nearPilot)fail('pilot-never-entered-interaction-range',deckState);
  if(!await click(page,'#gbs-use'))throw new Error('pilot INTERACT unavailable');
  await assertAutoplayThenSkip(page,'02_signal_pull_transition_pixel.mp4');
  await page.waitForSelector('#good-boys-ship-flight',{state:'visible',timeout:7000});await page.waitForFunction(()=>window.__goodBoysShipFlightState&&window.__goodBoysShipFlightState.assetReady===true,null,{timeout:6000});
  const flightSignal=await canvasSignal(page,'#good-boys-ship-flight canvas');const flightStart=await phase(page);log('flight-start',{flightSignal,...flightStart});if(!flightSignal||flightSignal.nonBlack<100||flightSignal.alpha<100||flightSignal.range<8)fail('good-ship-canvas-blank',{flightSignal,...flightStart});if(!String(flightStart.flight?.asset||'').includes('good_ship_arcade.atlas.png'))fail('good-ship-atlas-not-active',flightStart);await page.screenshot({path:path.join(OUT,'goodboys-flight.png')});
  await page.waitForFunction(()=>window.__goodBoysShipFlightState&&window.__goodBoysShipFlightState.completed===true,null,{timeout:13000});
  await assertAutoplayThenSkip(page,'03_orbital_approach_pixel.mp4');
  await page.waitForSelector('#good-boys-crash-canonical',{state:'visible',timeout:7000});log('crash-start',await phase(page));await page.screenshot({path:path.join(OUT,'goodboys-crash.png')});
  await page.waitForFunction(()=>window.__goodBoysCrashScene&&window.__goodBoysCrashScene.completed===true,null,{timeout:10000});
  await page.waitForFunction(()=>window.NM&&window.NM._v736&&Number(window.NM._v736.m)===3,null,{timeout:7000});const end=await phase(page);log('prison-handoff',end);
  if(end.error)fail('opening-error-visible',end);if(end.mission!==3)fail('opening-did-not-enter-m3',end);if(!end.pair)fail('katrin-manchez-pair-not-attached',end);if(!/katrin|manchez/i.test(String(end.activeDog||'')))fail('active-dog-missing',end);if(end.hard?.version<10||end.hard?.openingAuthority!=='TechOpsGoodBoysButtonHardFix')fail('wrong-opening-runtime-authority',end);
  await page.screenshot({path:path.join(OUT,'goodboys-prison-m3.png')});
}catch(e){fail('bot-exception',{error:String(e&&e.stack||e),state:await phase(page).catch(()=>null)});await page.screenshot({path:path.join(OUT,'goodboys-intro-exception.png')}).catch(()=>{});}finally{await context.tracing.stop({path:path.join(OUT,'goodboys-intro-trace.zip')}).catch(()=>{});await browser.close();}
const report={pass:failures.length===0,contract:'pilot interaction -> GD_CUT_02 autoplay -> supplied Good Ship asteroid flight -> GD_CUT_03 autoplay -> crash -> M3 prison',failures,events};fs.writeFileSync(path.join(OUT,'goodboys-intro-mobile.json'),JSON.stringify(report,null,2));fs.writeFileSync(path.join(OUT,'goodboys-intro-mobile.md'),`# Good Boys iPhone Intro Bot\n\n**Result:** ${report.pass?'PASS':'FAIL'}\n\nContract: ${report.contract}\n\n${failures.length?failures.map(f=>`- ${f.name}: \`${JSON.stringify(f)}\``).join('\n'):'- Existing pilot asset rendered and became the interaction target.\n- GD_CUT_02 and GD_CUT_03 advanced under muted inline autoplay without the old forced VIDEO READY gate.\n- Supplied Good Ship atlas rendered the playable asteroid flight.\n- Canonical crash handed off to fresh M3 prison gameplay.'}\n`);console.log(JSON.stringify(report,null,2));if(!report.pass)process.exitCode=1;
