// Full production-page check. Later-story milestones are a declared fixture;
// section validation, launch, keyboard movement and rendering use the real app.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const base=process.env.BOT_BASE_URL||'http://127.0.0.1:4173/';
const out=process.env.BOT_OUT_DIR||'runtime-bot-artifacts';
fs.mkdirSync(out,{recursive:true});
const results=[];
const browser=await chromium.launch({headless:true,...(process.env.BOT_CHROMIUM_EXECUTABLE?{executablePath:process.env.BOT_CHROMIUM_EXECUTABLE}:{})});
try {
 for(const [name,viewport,touch] of [['desktop',{width:1280,height:800},false],['portrait',{width:390,height:844},true],['landscape',{width:844,height:390},true]]) {
  const context=await browser.newContext({viewport,hasTouch:touch,isMobile:touch});
  await context.route('**/*',r=>r.request().url().startsWith(base)?r.continue():r.abort());
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(String(e)));
  page.setDefaultTimeout(30000);
  const result={name,fixture:'Later-story prerequisites and legal Iona workshop history; enemies cleared for sprite review',checks:[],errors,pass:false};results.push(result);
  try {
   await page.goto(base,{waitUntil:'domcontentloaded'});
   await page.waitForFunction(()=>window.TechOpsProductionBootstrap?.ready()&&window.TechOpsLinked&&window.TechOpsIonaNightwalker?.warm()&&window.TechOpsIonaNightwalker?.warmBicycle());
   await page.locator('#btn-nightcrawler').click();
   const deadline=Date.now()+20000;
   while(Date.now()<deadline) {
    if(await page.evaluate(()=>!!(S?.nightMode&&!S.inDialog&&!window.v722?.active()&&!window.__productionDesiredMode)))break;
    if(await page.evaluate(()=>!!window.v722?.active()))await page.keyboard.press('Escape');
    const button=page.locator('#dlg-options button').first();
    if(await button.isVisible().catch(()=>false))await button.click();
    await page.waitForTimeout(100);
   }
   await page.waitForFunction(()=>window.TechOpsNightInput?.ready());
   await page.evaluate(async()=>{
    S.paused=true; delete S.meta._standaloneMode;
    if(S.meta._v736)delete S.meta._v736.campaignOrigin;
    TechOpsLinkedSaveCore.claimWriter(S.meta.seeWorldLink);
    const c=TechOpsCampaign.load(localStorage);
    c.seeWorldLink=S.meta.seeWorldLink;
    c.story={...(c.story||{}),completedActs:['prologue','act_1','act_2','act_3','act_4','act_5','act_6','interlude','act_7'],facts:{...(c.story?.facts||{}),violinist_revealed:true,felicia_alliance:true,duet_protocol_complete:true,orbital_signal_found:true,k_freed:true,waldo_freed:true,warden_null_defeated:true,crew_returned_to_earth:true,mike_meets_k:true}};
    c.seeWorldDisclosures={redArrestAccount:{version:1,audience:'player',at:new Date().toISOString()}};
    TechOpsCampaign.save(c,localStorage);
    if(save()!==true)throw Error('Fixture native save failed');
    await TechOpsLinked.publish();
    const l=await import('./see-world/linked.mjs'),e=await import('./see-world/engine.mjs'),data=await import('./see-world/campaigns.mjs');
    const queue=[e.newRun('iona')];let chosen;
    while(queue.length){const run=queue.shift();if(run.flags.depot==='workshop'){chosen=run;break;}if(run.ended)continue;for(const choice of data.nodeById(data.campaignById('iona'),run.node).choices){try{queue.push(e.choose(run,choice.id));}catch{}}}
    if(!chosen)throw Error('No legal workshop path');
    const snapshot=TechOpsLinked.context(),progress=l.loadProgress(localStorage,snapshot);
    await l.saveRuns(localStorage,progress,{iona:chosen},snapshot);
    window.__ionaDraws=[];window.__ionaBicycleDraws=0;
    const original=CanvasRenderingContext2D.prototype.drawImage;
    CanvasRenderingContext2D.prototype.drawImage=function(image,...args){if(image?.src?.includes('iona-bicycle-v1.webp'))window.__ionaBicycleDraws++;if(image?.src?.includes('iona-band-v1.webp')){window.__ionaDraws.push(args.slice(0,4));if(window.__ionaDraws.length>100)window.__ionaDraws.shift();}return original.call(this,image,...args);};
    TechOpsLinked.launch('low-quarter-workshop');
    NM.enemies=[];NM.platforms=[];NM.x=600;NM.y=396;NM.hp=100;NM.onGround=true;S.paused=false;
   });
   await page.waitForFunction(()=>TechOpsIonaNightwalker.owns(NM)&&window.__ionaDraws.length>0);
   result.checks.push('real earned-section launch selects and renders Iona');
   await page.screenshot({path:path.join(out,`iona-${name}-idle.png`)});
   const before=await page.evaluate(()=>NM.x);
   await page.keyboard.down('ArrowRight');await page.waitForTimeout(400);await page.keyboard.up('ArrowRight');
   assert.ok(await page.evaluate(x=>NM.x>x,before));result.checks.push('keyboard movement retains Iona');
   await page.keyboard.press('KeyE');
   await page.waitForFunction(()=>window.__ionaDraws.some(r=>r[1]>=256));
   result.checks.push('real attack input reaches Iona combat pose');
   await page.screenshot({path:path.join(out,`iona-${name}-action.png`)});
   const setup=()=>page.evaluate(()=>{
    TechOpsNightInput.reset();for(const k of Object.keys(keys))keys[k]=false;joy.x=joy.y=0;
    TechOpsNightCombat.cancel(NM);delete NM._nightCombat;
    Object.assign(NM,{x:600,y:396,w:22,h:34,vx:0,vy:0,onGround:true,face:1,hp:100,ifr:0,block:false,hitStop:0,clear:false,jHeld:false,jumps:0,dashT:0,dashCD:0});
    NM.platforms=[];NM.enemies=[{x:650,y:396,w:24,h:34,hp:500,maxHp:500,alive:true,kind:'thug',name:'Combo fixture',spd:0,dmg:0,cd:999,windup:0,kb:0,cash:[0,0]}];
   });
   const aim=async(direction,key)=>{await page.keyboard.down(direction);try{await page.keyboard.press(key);}finally{await page.keyboard.up(direction);}};
   const idle=()=>page.waitForFunction(()=>!NM._nightCombat?.attack);
   const launch=async()=>{await setup();await aim('ArrowUp','KeyJ');await page.waitForFunction(()=>NM.enemies[0]._nightCombat?.air);await page.keyboard.press('Space');await page.waitForFunction(()=>!NM.onGround);await idle();};
   await launch();await page.keyboard.press('KeyE');await page.waitForFunction(()=>NM.enemies[0]._nightCombat.airHits>=1);await idle();
   await aim('ArrowUp','KeyJ');
   await page.waitForFunction(()=>NM.enemies[0]._nightCombat.airHits===3&&window.__ionaBicycleDraws>0);
   assert.equal(await page.evaluate(()=>NM._nightCombat.events.filter(e=>e.type==='bicycle-kick'&&e.damage>0).length),2);
   assert.ok(await page.evaluate(()=>NM.enemies[0]._nightCombat.locked));
   result.checks.push('launcher → jump → light → two bicycle contacts reaches the three-hit cap with actual sprite rendering');
   await page.screenshot({path:path.join(out,`iona-${name}-bicycle.png`)});
   await launch();await page.keyboard.press('KeyE');await page.waitForFunction(()=>NM.enemies[0]._nightCombat.airHits>=1);await idle();
   await page.keyboard.press('Space');await page.waitForFunction(()=>NM.enemies[0].y+NM.enemies[0].h>=NM.y+NM.h-8);
   await aim('ArrowDown','KeyE');await page.waitForFunction(()=>NM._nightCombat.events.some(e=>e.type==='air-down'&&e.damage>0));
   result.checks.push('air light → repositioning jump → downward light contacts the target below');
   await page.screenshot({path:path.join(out,`iona-${name}-down-light.png`)});
   await page.getByRole('button',{name:'Leave side operation',exact:true}).click();
   await page.waitForFunction(()=>!TechOpsLinked.mission()&&!TechOpsIonaNightwalker.owns(NM));
   await page.evaluate(()=>{window.__ionaDraws=[];});await page.waitForTimeout(150);
   assert.equal(await page.evaluate(()=>window.__ionaDraws.length),0);result.checks.push('leaving restores ordinary actor rendering');
   assert.deepEqual(errors,[]);result.pass=true;
  }catch(error){result.error=String(error.stack||error);await page.screenshot({path:path.join(out,`iona-${name}-failure.png`)}).catch(()=>{});}
  await context.close();
 }
}finally{await browser.close();fs.writeFileSync(path.join(out,'iona-browser-results.json'),JSON.stringify(results,null,2));}
console.log(JSON.stringify(results,null,2));
if(results.some(r=>!r.pass))process.exitCode=1;
