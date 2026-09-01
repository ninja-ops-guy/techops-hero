import fs from 'node:fs';
import path from 'node:path';
import { webkit, devices } from 'playwright';
const BASE=process.env.BOT_BASE_URL||'http://127.0.0.1:4173/';
const OUT=process.env.BOT_OUT_DIR||'runtime-bot-artifacts';
fs.mkdirSync(OUT,{recursive:true});
const failures=[],events=[];
const log=(name,data={})=>{events.push({at:new Date().toISOString(),name,...data});console.log(name,JSON.stringify(data));};
const fail=(name,data={})=>{failures.push({name,...data});log('FAIL '+name,data);};
async function clickLaunch(page){for(const b of await page.locator('button').all()){const t=(await b.innerText().catch(()=>'' )).trim();if(/118\/1984|BREAKOUT|GOOD\s*BOYS/i.test(t)){await b.click({timeout:1500});return t;}}return null;}
async function domClick(page,selector){return page.locator(selector).evaluate(el=>{el.click();return true;}).catch(()=>false);}
async function snap(page){return page.evaluate(()=>{const o=document.getElementById('good-dogs-cutscene-overlay'),v=o&&o.querySelector('.gd-film-video'),p=document.getElementById('good-boys-campaign-intro'),i=document.getElementById('good-boys-ship-interlude');let r={};try{r=window.eval(`(function(){var s=(typeof S!=='undefined'&&S)?S:null,n=(typeof NM!=='undefined'&&NM)?NM:null,c=n&&n._v736,m=s&&s.meta&&s.meta._v736,a=window.TechOpsGoodBoysCampaignState,p=window.TechOpsGoodBoysProgressionAuthority;return{campaign:!!c,mission:Number(c&&c.m||0),metaMission:Number(m&&m.m||0),stateMission:a&&a.mission?Number(a.mission()):0,invariant:p&&p.acceptance?p.acceptance().invariant:null,sState:s&&s.meta&&s.meta.goodDogsCutscenes||null};})()`);}catch(e){r.evalError=String(e&&e.stack||e);}return{active:!!(o&&o.classList.contains('active')),src:v?(v.currentSrc||v.getAttribute('src')||''):'',muted:v?!!v.muted:null,volume:v?Number(v.volume):null,interlude:!!i,interludeState:window.__goodBoysOpeningGameplay||null,shipApi:window.TechOpsShipInteraction?{version:Number(window.TechOpsShipInteraction.VERSION||0),active:!!window.TechOpsShipInteraction.active,count:Number(window.TechOpsShipInteraction.systemsInspected||0),total:Number(window.TechOpsShipInteraction.totalSystems||0)}:null,premise:!!p,premiseCount:document.querySelectorAll('#good-boys-campaign-intro').length,premiseText:p?p.textContent:'',premiseButton:p&&p.querySelector('button')?p.querySelector('button').textContent:'',legacyStoryCount:document.querySelectorAll('#good-boys-story-cine').length,legacyFollowTrail:[...document.querySelectorAll('button')].filter(b=>/FOLLOW THE TRAIL/i.test(b.textContent||'')).length,phase:window.__goodBoysOpeningPhase||null,repairVersion:window.TechOpsGoodBoysIntroRepair&&window.TechOpsGoodBoysIntroRepair.VERSION||0,...r};});}
function assertOwner(a,phase){if(a.repairVersion<11)fail('intro-owner-v11-missing',{phase,...a});if(a.legacyStoryCount)fail('legacy-director-premise-visible',{phase,...a});if(a.legacyFollowTrail)fail('retired-follow-trail-visible',{phase,...a});if(a.premiseCount>1)fail('duplicate-premise',{phase,...a});}
async function moveToSystem(page,id){
  const result=await page.evaluate(async target=>{
    const right=document.querySelector('#good-boys-ship-interlude [data-move="right"]');
    const interact=document.querySelector('#good-boys-ship-interlude [data-interact]');
    if(!right||!interact)return {ok:false,error:'mobile controls missing'};
    const before=window.__goodBoysOpeningGameplay||{};const xStart=Number(before.x||0);const pointerId=41;
    const fire=(el,type,buttons)=>el.dispatchEvent(new PointerEvent(type,{bubbles:true,cancelable:true,pointerId,pointerType:'touch',isPrimary:true,buttons}));
    fire(right,'pointerdown',1);let moved=false,last=xStart;
    try{
      const deadline=performance.now()+5000;
      while(performance.now()<deadline){
        await new Promise(r=>setTimeout(r,40));
        const s=window.__goodBoysOpeningGameplay||{};last=Number(s.x||last);if(Math.abs(last-xStart)>=5)moved=true;
        if(s.near&&s.targetId===target){return {ok:true,moved,xStart,xEnd:last,target};}
      }
      return {ok:false,moved,xStart,xEnd:last,target,error:moved?'target proximity not reached':'pointer hold produced no movement'};
    }finally{fire(right,'pointerup',0);}
  },id);
  log('ship-touch-hold',result);if(!result.ok)throw new Error('ship touch hold failed: '+JSON.stringify(result));
  await page.waitForFunction(()=>{const b=document.querySelector('#good-boys-ship-interlude [data-interact]');return !!(b&&!b.disabled);},null,{timeout:1000});
  await page.evaluate(()=>{const b=document.querySelector('#good-boys-ship-interlude [data-interact]');if(!b||b.disabled)throw new Error('INTERACT unavailable');const e=new PointerEvent('pointerup',{bubbles:true,cancelable:true,pointerId:42,pointerType:'touch',isPrimary:true,buttons:0});b.dispatchEvent(e);});
  await page.waitForFunction(target=>{const s=window.__goodBoysOpeningGameplay;return !!(s&&Array.isArray(s.systems)&&s.systems.includes(target));},id,{timeout:2500});
}
const browser=await webkit.launch({headless:true});const context=await browser.newContext({...devices['iPhone 15 Pro'],viewport:{width:393,height:852}});const page=await context.newPage();
try{
  await page.goto(BASE,{waitUntil:'domcontentloaded',timeout:30000});await page.waitForTimeout(1600);let a=await snap(page);assertOwner(a,'title');const clicked=await clickLaunch(page);if(!clicked)throw new Error('Good Boys launch button missing');log('launch',{clicked});
  await page.waitForSelector('#good-dogs-cutscene-overlay.active',{state:'visible',timeout:4000});a=await snap(page);log('clip1',a);assertOwner(a,'clip1');if(!/01_signal_beyond_earth_pixel\.mp4/i.test(a.src))fail('clip1-order',a);if(a.muted!==true||a.volume!==0)fail('clip1-not-silent',a);await page.screenshot({path:path.join(OUT,'goodboys-clip1.png')});if(!await domClick(page,'#good-dogs-cutscene-overlay.active .gd-film-skip'))throw new Error('clip1 skip unavailable');
  await page.waitForSelector('#good-boys-ship-interlude',{state:'visible',timeout:4000});a=await snap(page);log('ship-start',a);assertOwner(a,'ship-start');if(!a.shipApi||a.shipApi.version<2||a.shipApi.total!==3)fail('ship-three-system-contract-missing',a);if(a.active)fail('clip-overlaps-ship',a);
  for(const id of ['nav','flight','dock']){await moveToSystem(page,id);a=await snap(page);log('ship-system-'+id,a);if(!a.interludeState||!a.interludeState.systems.includes(id))fail('ship-system-not-inspected',{id,...a});}
  await page.waitForFunction(()=>{const s=window.__goodBoysOpeningGameplay;return !!(s&&s.completed&&s.count===3);},null,{timeout:3000});await page.screenshot({path:path.join(OUT,'goodboys-ship-3of3.png')});
  await page.waitForFunction(()=>{const v=document.querySelector('#good-dogs-cutscene-overlay.active .gd-film-video');return !!(v&&/02_signal_pull_transition_pixel\.mp4/i.test(v.currentSrc||v.getAttribute('src')||''));},null,{timeout:5000});a=await snap(page);log('clip2',a);assertOwner(a,'clip2');if(a.interlude)fail('ship-remained-under-clip2',a);if(a.muted!==true||a.volume!==0)fail('clip2-not-silent',a);if(!await domClick(page,'#good-dogs-cutscene-overlay.active .gd-film-skip'))throw new Error('clip2 skip unavailable');
  await page.waitForSelector('#good-boys-campaign-intro',{state:'visible',timeout:4000});a=await snap(page);log('premise',a);assertOwner(a,'premise');if(a.premiseCount!==1)fail('premise-not-singleton',a);if(!/TAKE CONTROL/i.test(a.premiseButton))fail('wrong-premise-cta',a);if(!/Navigation|flight control|docking security/i.test(a.premiseText)||!/Cell 118/i.test(a.premiseText)||!/Cell 1984/i.test(a.premiseText))fail('premise-logic',a);if(!await domClick(page,'#good-boys-campaign-intro button'))throw new Error('TAKE CONTROL unavailable');
  await page.waitForFunction(()=>!!(window.NM&&window.NM._v736),null,{timeout:9000});await page.waitForTimeout(650);a=await snap(page);log('gameplay',a);assertOwner(a,'gameplay');if(!a.campaign||a.mission!==2||a.metaMission!==2||a.stateMission!==2)fail('m2-canonical-handoff-failed',a);if(a.invariant&&a.invariant.ok===false)fail('mission-invariant-failed',a);if(a.active||a.premise||a.interlude)fail('opening-overlay-remains',a);if(!(a.sState&&a.sState.GD_CUT_01&&a.sState.GD_CUT_02))fail('opening-state-not-migrated',a);await page.screenshot({path:path.join(OUT,'goodboys-gameplay-m2.png')});
  const persisted=await page.evaluate(()=>{try{const s=JSON.parse(localStorage.getItem('techops_save')||'null');return Number(s&&s.meta&&s.meta._v736&&s.meta._v736.m||0);}catch{return -1;}});log('persisted-before-reload',{mission:persisted});if(persisted!==2)fail('m2-not-persisted',{persisted});
  await page.reload({waitUntil:'domcontentloaded',timeout:30000});await page.waitForTimeout(800);const after=await page.evaluate(()=>{try{const s=JSON.parse(localStorage.getItem('techops_save')||'null');return Number(s&&s.meta&&s.meta._v736&&s.meta._v736.m||0);}catch{return -1;}});log('persisted-after-reload',{mission:after});if(after!==2)fail('m2-not-persistent-after-reload',{after});
}catch(e){fail('bot-exception',{error:String(e&&e.stack||e)});await page.screenshot({path:path.join(OUT,'goodboys-intro-exception.png')}).catch(()=>{});}finally{await browser.close();}
const report={pass:failures.length===0,failures,events};fs.writeFileSync(path.join(OUT,'goodboys-intro-mobile.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));if(!report.pass)process.exitCode=1;
