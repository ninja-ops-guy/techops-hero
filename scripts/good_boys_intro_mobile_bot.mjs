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
async function phase(page){return page.evaluate(()=>({phase:window.__goodBoysOpeningPhase||null,deck:window.__goodBoysDeckAssetState||null,deckInteract:window.__goodBoysDeckInteract||null,cutsceneExit:window.__goodDogsCutsceneExit||null,flight:window.__goodBoysSpaceFlight||null,crash:window.__goodBoysCrashScene||null,error:window.__goodBoysOpeningErrorDetail||null,hard:window.__goodBoysHardButtonLaunch||null,mission:window.NM&&window.NM._v736?Number(window.NM._v736.m||0):0,pair:!!(window.NM&&window.NM._v736&&window.NM._v736.chars&&window.NM._v736.chars.katrin&&window.NM._v736.chars.manchez),activeDog:window.NM&&window.NM._v736?window.NM._v736.active:null}));}
async function canvasSignal(page,selector){return page.evaluate(sel=>{const c=document.querySelector(sel);if(!c)return null;const x=c.getContext('2d',{willReadFrequently:true});if(!x)return null;const w=c.width,h=c.height,d=x.getImageData(0,0,w,h).data;let nonBlack=0,alpha=0,min=255,max=0;for(let i=0;i<d.length;i+=16){const r=d[i],g=d[i+1],b=d[i+2],a=d[i+3];if(a)alpha++;if(r||g||b)nonBlack++;min=Math.min(min,r,g,b);max=Math.max(max,r,g,b);}return{nonBlack,alpha,range:max-min,w,h};},selector).catch(()=>null);}
async function skipFilm(page,id){await page.waitForFunction(want=>{const o=document.querySelector('#good-dogs-cutscene-overlay.active'),v=o&&o.querySelector('video');return !!(o&&v&&String(v.currentSrc||v.getAttribute('src')||'').includes(want));},id,{timeout:10000});const s=await phase(page);log('cutscene-'+id,s);if(!await click(page,'#good-dogs-cutscene-overlay.active .gd-film-skip'))throw new Error('skip unavailable for '+id);await page.waitForFunction(want=>window.__goodDogsCutsceneExit&&window.__goodDogsCutsceneExit.id===want,id,{timeout:5000});}
const browser=await webkit.launch({headless:true});const context=await browser.newContext({...devices['iPhone 15 Pro'],viewport:{width:393,height:852}});await context.tracing.start({screenshots:true,snapshots:true,sources:true});const page=await context.newPage();
try{
  await page.goto(BASE,{waitUntil:'domcontentloaded',timeout:30000});await page.waitForTimeout(1600);
  const clicked=await clickLaunch(page);if(!clicked)throw new Error('Good Boys launch button missing');log('launch',{clicked});
  await page.waitForSelector('#good-boys-deck-supplied',{state:'visible',timeout:9000});await page.waitForTimeout(180);
  const deckSignal=await canvasSignal(page,'#good-boys-deck-supplied canvas');const deckState=await phase(page);log('cockpit',{deckSignal,...deckState});
  if(!deckSignal||deckSignal.nonBlack<100||deckSignal.alpha<100||deckSignal.range<8)fail('cockpit-canvas-blank',{deckSignal,...deckState});
  if(!deckState.deck||deckState.deck.nonBlocking!==true)fail('cockpit-not-js-first-nonblocking',deckState);
  await page.screenshot({path:path.join(OUT,'goodboys-cockpit.png')});
  if(!await click(page,'#good-boys-deck-supplied button'))throw new Error('cockpit USE unavailable');
  await skipFilm(page,'02_signal_pull_transition_pixel.mp4');
  await page.waitForSelector('#good-boys-flight-v4',{state:'visible',timeout:7000});log('flight-start',await phase(page));await page.screenshot({path:path.join(OUT,'goodboys-flight.png')});
  await page.waitForFunction(()=>window.__goodBoysSpaceFlight&&window.__goodBoysSpaceFlight.completed===true,null,{timeout:8000});
  await skipFilm(page,'03_orbital_approach_pixel.mp4');
  await page.waitForSelector('#good-boys-crash-canonical',{state:'visible',timeout:7000});log('crash-start',await phase(page));await page.screenshot({path:path.join(OUT,'goodboys-crash.png')});
  await page.waitForFunction(()=>window.__goodBoysCrashScene&&window.__goodBoysCrashScene.completed===true,null,{timeout:10000});
  await page.waitForFunction(()=>window.NM&&window.NM._v736&&Number(window.NM._v736.m)===3,null,{timeout:7000});const end=await phase(page);log('prison-handoff',end);
  if(end.error)fail('opening-error-visible',end);if(end.mission!==3)fail('opening-did-not-enter-m3',end);if(!end.pair)fail('katrin-manchez-pair-not-attached',end);if(!/katrin|manchez/i.test(String(end.activeDog||'')))fail('active-dog-missing',end);
  await page.screenshot({path:path.join(OUT,'goodboys-prison-m3.png')});
}catch(e){fail('bot-exception',{error:String(e&&e.stack||e),state:await phase(page).catch(()=>null)});await page.screenshot({path:path.join(OUT,'goodboys-intro-exception.png')}).catch(()=>{});}finally{await context.tracing.stop({path:path.join(OUT,'goodboys-intro-trace.zip')}).catch(()=>{});await browser.close();}
const report={pass:failures.length===0,contract:'cockpit -> takeover -> flight -> approach -> crash -> M3 prison',failures,events};fs.writeFileSync(path.join(OUT,'goodboys-intro-mobile.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));if(!report.pass)process.exitCode=1;