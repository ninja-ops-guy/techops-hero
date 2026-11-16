// UI integration qualification. Prerequisites, checkpoint positions and cleared
// combat are explicit fixtures; objective completion, timed work and saves use
// production UI. This does not qualify combat, normal traversal or a real phone.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {spawn} from 'node:child_process';
import {chromium} from 'playwright';
const port=process.env.IONA_PORT||'4192',base=`http://127.0.0.1:${port}/`;
const out=process.env.IONA_OUT_DIR||'/tmp/techops-iona-revenge';fs.mkdirSync(out,{recursive:true});
const server=spawn('python3',['scripts/media_http_server.py','--port',port,'--bind','127.0.0.1'],{stdio:'ignore'});
let browser;const reports=[];
try{
 browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_EXECUTABLE||'/usr/bin/chromium'});
 for(let i=0;i<50;i++){try{if((await fetch(base)).ok)break;}catch{}await new Promise(r=>setTimeout(r,100));}
 for(const [profile,width,height,touch] of [['desktop',1280,800,false],['portrait',390,844,true],['landscape',844,390,true]]){
  const context=await browser.newContext({viewport:{width,height},hasTouch:touch,isMobile:touch});
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));page.setDefaultTimeout(15000);
  await context.route('**/*',r=>r.request().url().startsWith(base)?r.continue():r.abort());
  const option=t=>page.locator('#dlg-options button').filter({hasText:t}).first();
  const exact=t=>new RegExp('^'+t.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'$');
  const press=async el=>{await el.scrollIntoViewIfNeeded();await(touch?el.tap():el.click());};
  const report={profile,viewport:{width,height},touchDialogs:touch,completed:[],goals:[],errors,pass:false};reports.push(report);
  try{
   await page.goto(base);await page.waitForFunction(()=>window.__productionTitleReadiness?.ready);
   await press(page.locator('#btn-nightcrawler'));await press(option(/Standard/));await press(option(/Take the Charger/));
   await page.locator('#v722-cine').waitFor({state:'visible'});await page.keyboard.press('Escape');
   await page.waitForFunction(()=>window.S?.nightMode&&!S.inDialog&&!window.__productionDesiredMode);
   await press(page.locator('#night-campaign'));await press(option(/Living World/));await page.waitForFunction(()=>!!window.TechOpsLivingWorld);
   await page.evaluate(()=>{const a=TechOpsLivingWorld,s=S.meta.livingWorld;const index=a.Data.episodes.findIndex(e=>e.id==='iona_world_left_running');s.done=a.Data.episodes.slice(0,index).map(e=>e.id);s.flags.waldo_invited=s.flags.waldo_visit_received=true;TechOpsLivingWorldRuntime.openBoard();});
   for(const id of ['iona_world_left_running','iona_freight_name']){
    const e=await page.evaluate(id=>TechOpsLivingWorld.episode(id),id);
    await press(option(exact('Begin — '+e.title)));await press(option(/^Enter this chapter$/));
    for(let budget=0;budget<70;budget++){
     const g=await page.evaluate(()=>TechOpsLivingWorld.current(S.meta.livingWorld));if(!g)break;
     console.log(profile,id,g.id);
     // Move the fixture to the next checkpoint without granting completion.
     await page.evaluate(g=>{const a=S.meta.livingWorld.active;a.room=g.room;a.x=g.x-11;a.y=g.y-17;
      Object.assign(NM,{x:a.x,y:a.y,vx:0,vy:0,onGround:true,hp:100,ifr:999,enemies:[],platforms:[]});
      if(a.escort){a.escort.room=g.room;a.escort.x=g.x-40;}S.paused=false;
     },g);
     await page.waitForTimeout(100);await press(page.locator('#living-world-interact'));
     if(await page.locator('#dlg-name').textContent()==='AT THIS LOCATION')await press(option(exact(g.label)));
     assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,'page must fit viewport');
     const label=g.kind==='scene'?(g.lines.length===1?'Finish the conversation':'Continue'):g.options?g.options.find(o=>o[0]===(g.answer||g.options[0][0]))[1]:g.kind==='hold'?'Begin working at the station':g.label;
     if(['gate_recovery','fire_door','all_clear'].includes(g.id))await page.screenshot({path:`${out}/${profile}-${g.id}.png`});
     await press(option(exact(label)));
     if(g.kind==='scene'){while(await page.evaluate(id=>S.inDialog&&TechOpsLivingWorld.current(S.meta.livingWorld)?.id===id,g.id))await press(option(/^(Continue|Finish the conversation)$/));}
     if(g.kind==='hold')await page.waitForFunction(id=>TechOpsLivingWorld.current(S.meta.livingWorld)?.id!==id,g.id,{timeout:20000});
     assert.notEqual(await page.evaluate(()=>TechOpsLivingWorld.current(S.meta.livingWorld)?.id),g.id);
     report.goals.push(`${id}/${g.id}`);
     if(g.id==='gate_recovery'){
      assert.equal(await page.evaluate(()=>TechOpsLivingWorld.routes(S.meta.livingWorld).find(r=>r.to==='gallery').open),false);
      const saved=await page.evaluate(()=>JSON.stringify(S.meta.livingWorld));assert(saved.includes('iona_access_gate_locked'));
      await press(page.locator('#night-campaign'));await press(option(/^Save chapter and return to the street$/));
      await press(page.locator('#night-campaign'));await press(option(/Living World/));await press(option(exact('Resume — '+e.title)));await press(option(/^Resume this chapter$/));
      assert.equal(await page.evaluate(()=>TechOpsLivingWorld.current(S.meta.livingWorld).id),'records_shutter');
      assert.equal(await page.evaluate(()=>TechOpsLivingWorld.routes(S.meta.livingWorld).find(r=>r.to==='gallery').open),false);
      report.gateResume=true;
     }
     if(g.kind==='finish'){await press(option(/^Return to expeditions$/));report.completed.push(id);break;}
    }
   }
   assert.deepEqual(report.completed,['iona_world_left_running','iona_freight_name']);assert.deepEqual(errors,[]);
   assert.equal(await page.evaluate(()=>localStorage.getItem('techops_hero_campaign_v1')),null);
   report.pass=true;console.log('PASS',profile,report.goals.length,'UI objectives');
  }catch(e){report.error=String(e.stack);await page.screenshot({path:`${out}/${profile}-failure.png`});console.error(report.error);}
  await context.close();
 }
}finally{if(browser)await browser.close();server.kill();fs.writeFileSync(`${out}/report.json`,JSON.stringify({method:'Prerequisite, position, escort-position and cleared-enemy fixtures; production UI completions, work timers and save/resume. Chromium touch emulation, not physical-device testing or full traversal/combat qualification.',reports},null,2));}
if(reports.some(r=>!r.pass))process.exitCode=1;
