import assert from 'node:assert/strict';
import fs from 'node:fs';
import {spawn} from 'node:child_process';
import {chromium} from 'playwright';
const port=process.env.LIVING_PORT||'4184';
const base=process.env.LIVING_BASE_URL||'http://127.0.0.1:'+port+'/';
const out=process.env.LIVING_OUT_DIR||'/tmp/techops-living-world';fs.mkdirSync(out,{recursive:true});
const server=process.env.LIVING_BASE_URL?null:spawn('python3',['scripts/media_http_server.py','--port',port,'--bind','127.0.0.1'],{stdio:'ignore'});
const browser=await chromium.launch({headless:true});
const profile=process.env.LIVING_PROFILE||'desktop';
const viewport=profile==='portrait'?{width:390,height:844}:profile==='landscape'?{width:844,height:390}:{width:1280,height:800};
const resumed=!!process.env.LIVING_RESUME;
const context=await browser.newContext({viewport,hasTouch:profile!=='desktop',...(resumed?{storageState:process.env.LIVING_RESUME}:{})});
const page=await context.newPage();page.setDefaultTimeout(30000);const errors=[],reports=[];
page.on('pageerror',e=>{errors.push(e.message);console.log('PAGE ERROR',e.message);});
await context.route('**/*',r=>r.request().url().startsWith(base)?r.continue():r.abort());
function option(text){return page.locator('#dlg-options button').filter({hasText:text}).first();}
async function press(el){await el.scrollIntoViewIfNeeded();if(profile==='desktop')await el.click();else await el.tap();}
const exact=text=>new RegExp('^'+text.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'$');
async function title(){await page.waitForFunction(()=>window.__productionTitleReadiness?.ready&&!document.querySelector('#btn-start')?.disabled);}
async function view(){return page.evaluate(()=>({n:{x:NM.x,y:NM.y,vx:NM.vx,hp:NM.hp,enemies:NM.enemies.filter(e=>e.alive).map(e=>({x:e.x,y:e.y,hp:e.hp}))},a:S.meta.livingWorld?.active,g:window.TechOpsLivingWorld?.current(S.meta.livingWorld),dialog:S.inDialog,dialogTitle:document.querySelector('#dlg-name')?.textContent}));}
async function fight(){
  const deadline=Date.now()+45000;
  while(Date.now()<deadline){const v=await view(),enemy=v.n.enemies[0];if(!enemy)return;
    if(v.dialog){if(v.dialogTitle==='FALL BACK TO THE CHECKPOINT'){await press(option(/^Recover at the room entry$/));continue;}throw new Error('Unexpected dialog in combat: '+v.dialogTitle);}
    const dx=enemy.x-v.n.x,key=dx>0?'ArrowRight':'ArrowLeft';
    const escort=v.a.escort;if(escort&&Math.abs(v.n.x-escort.x)>210){await walk(escort.x+150);continue;}
    await page.keyboard.down(key);await page.waitForTimeout(Math.abs(dx)>80?180:25);await page.keyboard.up(key);
    if(Math.abs(dx)<130){await page.keyboard.press('KeyJ');await page.waitForTimeout(420);}
  }throw new Error('Combat deadline '+JSON.stringify(await view()));
}
async function walk(target){
  const deadline=Date.now()+35000;let held=null;
  while(Date.now()<deadline){const v=await view();if(v.dialog){if(held){await page.keyboard.up(held);held=null;}if(v.dialogTitle==='FALL BACK TO THE CHECKPOINT'){await press(option(/^Recover at the room entry$/));continue;}throw new Error('Unexpected dialog while moving: '+v.dialogTitle);}
    const e=v.a?.escort,gap=e&&e.room===v.a.room?Math.abs(v.n.x-e.x):0;
    const delta=(gap>290?e.x+170:target)-v.n.x;if(Math.abs(delta)<20){if(held)await page.keyboard.up(held);await page.waitForTimeout(350);return;}
    const behind=gap>190&&gap<=290;
    const key=behind?null:delta>0?'ArrowRight':'ArrowLeft';if(key!==held){if(held)await page.keyboard.up(held);if(key)await page.keyboard.down(key);held=key;}
    await page.waitForTimeout(70);
  }
  if(held)await page.keyboard.up(held);throw new Error('Movement deadline at '+JSON.stringify(await view()));
}
async function route(to){
  for(let guard=0;guard<8;guard++){
    const v=await view();if(v.a.room===to)return;
    const path=await page.evaluate(to=>{const A=TechOpsLivingWorld,s=S.meta.livingWorld,q=[[s.active.room,[]]],seen=new Set();while(q.length){const [room,path]=q.shift();if(room===to)return path;if(seen.has(room))continue;seen.add(room);const copy=A.clone(s);copy.active.room=room;copy.active.x=1600;if(copy.active.escort){copy.active.escort.room=room;copy.active.escort.x=1560;}for(const r of A.routes(copy).filter(r=>r.open))q.push([r.to,[...path,r.to]]);}return null;},to);
    assert(path?.length,'No accessible route to '+to);await walk(1560);
    if(v.a.escort)await page.waitForFunction(()=>Math.abs(S.meta.livingWorld.active.escort.x-NM.x)<130);
    await press(page.locator('#living-world-interact'));
    const name=await page.evaluate(id=>TechOpsLivingWorld.episode(S.meta.livingWorld.active.id).rooms.find(r=>r.id===id).name,path[0]);
    const remote=await page.evaluate(()=>TechOpsLivingWorld.episode(S.meta.livingWorld.active.id).remoteRooms);await press(option(exact((remote?'Viewpoint — ':'Travel — ')+name)));await page.waitForTimeout(200);
  }throw Error('Route loop');
}
async function reach(g){
  await route(g.room);
  await fight();
  await walk(g.x-11);await page.waitForTimeout(350);
  if(g.y<300&&(await view()).n.y>300){
    await page.keyboard.down('Space');await page.waitForTimeout(80);await page.keyboard.up('Space');await page.waitForTimeout(220);
    await page.keyboard.down('Space');await page.waitForTimeout(80);await page.keyboard.up('Space');
    await page.waitForFunction(()=>NM.y<300&&NM.onGround,null,{timeout:5000});
  }
}
try{
  for(let i=0;i<50;i++){try{if((await fetch(base)).ok)break;}catch{}await new Promise(r=>setTimeout(r,100));}
  await page.goto(base);await title();await press(page.locator('#btn-nightcrawler'));if(!resumed){await press(option(/Standard/));await press(option(/Take the Charger/));await page.locator('#v722-cine').waitFor({state:'visible'});await page.keyboard.press('Escape');}
  await page.waitForFunction(()=>window.S?.nightMode&&!S.inDialog&&!window.__productionDesiredMode);
  await press(page.locator('#night-campaign'));await press(option(/Living World/));await page.waitForFunction(()=>!!window.TechOpsLivingWorld&&document.querySelector('#dlg-name')?.textContent.includes('EXPEDITIONS'));
  const ids=await page.evaluate(()=>TechOpsLivingWorldData.episodes.map(e=>e.id));
  const limit=Number(process.env.LIVING_LIMIT)||ids.length;
  for(const id of ids.slice(0,limit)){
    const spec=await page.evaluate(id=>TechOpsLivingWorld.episode(id),id);console.log('CHAPTER',id);
    if(await page.evaluate(id=>S.meta.livingWorld.done.includes(id),id)){reports.push({id,completed:true,restoredFromPriorRun:true});continue;}
    await press(option(new RegExp('^(Begin|Resume) — '+spec.title.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'$')));await press(option(/^(Enter|Resume) this chapter$/));
    await page.waitForFunction(()=>!!S.nightMode._livingWorld&&!S.inDialog);
    if(id==='service_ring')await page.screenshot({path:`${out}/${profile}-service.png`});
    while(!(await view()).a.finished){
      const step=(await view()).a.step;
      const v=await view(),g=v.g;console.log('OBJECTIVE',id,g.id);
      if(g.actor&&(await view()).a.actor!==g.actor){await press(page.locator('#night-campaign'));await press(option(exact('Switch operator — '+g.actor)));}
      await reach(g);
      if(g.kind==='handoff')await page.waitForFunction(x=>Math.abs(S.meta.livingWorld.active.escort.x-x)<130,g.x);
      await press(page.locator('#living-world-interact'));
      if((await view()).dialogTitle==='AT THIS LOCATION')await press(option(exact(g.label)));
      const label=g.kind==='scene'?((v.a.sceneIndex||0)+1===g.lines.length?'Finish the conversation':'Continue'):g.kind==='dispatch'?g.tasks.find(t=>!(v.a.tasks||[]).includes(t.id)).label:g.options?g.options.find(o=>o[0]===(g.answer||g.options[0][0]))[1]:g.kind==='hold'?'Begin working at the station':g.label;
      await press(option(exact(label)));
      if(g.kind==='scene'){while((await view()).dialog&&(await view()).g?.id===g.id){await press(option(/^(Continue|Finish the conversation)$/));}}
      if(g.kind==='hold'){
        const deadline=Date.now()+90000;
        while((await view()).g?.id===g.id&&Date.now()<deadline){
          await page.waitForTimeout(350);const work=await view();
          if(work.g?.id!==g.id)break;
          if(work.dialog&&work.dialogTitle==='FALL BACK TO THE CHECKPOINT')await press(option(/^Recover at the room entry$/));
          if(!work.a.holding){
            await reach(g);
            if(['stealth','horror','rescue'].includes(spec.mode))await page.waitForFunction(()=>TechOpsLivingWorld.cycle(S.meta.livingWorld).phase>8.6);
            await press(page.locator('#living-world-interact'));await press(option(/^Begin working at the station$/));
          }
        }
        assert((await view()).g?.id!==g.id,'Work must finish after responding to interruptions');
      }
      if(g.kind==='finish'){
        await option(exact('Return to expeditions')).waitFor();await page.screenshot({path:`${out}/${profile}-${id}-complete.png`});await press(option(exact('Return to expeditions')));break;
      }else await page.waitForFunction(()=>!S.inDialog);
    }
    reports.push({id,completed:true});
    await context.storageState({path:`${out}/${profile}-storage.json`});
  }
  assert.equal(await page.evaluate(()=>S.meta.livingWorld.done.length),limit);
  if(limit===ids.length&&!process.env.LIVING_SKIP_OPTIONAL){
    const quests=await page.evaluate(()=>TechOpsLivingWorldData.sidequests);
    for(const q of quests){
      for(let step=await page.evaluate(id=>S.meta.livingWorld.side[id]||0,q.id);step<q.steps.length;step++){
        const loc=q.stages?q.stages[step]:{episode:q.episode,room:q.room,x:q.points[step]};
        const spec=await page.evaluate(id=>TechOpsLivingWorld.episode(id),loc.episode);
        await press(option(exact('Revisit — '+spec.title)).or(option(exact('Resume — '+spec.title))));await press(option(/^(Enter|Resume) this chapter$/));
        console.log('SIDE QUEST',q.id,step);await route(loc.room);await walk(loc.x-11);
        await press(page.locator('#living-world-interact'));if((await view()).dialogTitle==='AT THIS LOCATION')await press(option(exact(q.title)));
        await press(option(exact(q.steps[step][0])));await press(option(/^(Keep this moment|Continue in the room)$/));
        await press(page.locator('#night-campaign'));await press(option(/^Save chapter and return to the street$/));await press(page.locator('#night-campaign'));await press(option(/Living World/));
      }
      assert.equal(await page.evaluate(id=>S.meta.livingWorld.side[id],q.id),q.steps.length);reports.push({sideQuest:q.id,completed:true});
    }
    await context.storageState({path:`${out}/${profile}-storage.json`});
  }
  assert.equal(await page.evaluate(()=>localStorage.getItem('techops_save')),null,'standalone expeditions cannot write the Day profile');
  assert.equal(await page.evaluate(()=>localStorage.getItem('techops_hero_campaign_v1')),null,'standalone expeditions cannot grant native story facts');
  assert.deepEqual(errors,[]);
  fs.writeFileSync(`${out}/${profile}-report.json`,JSON.stringify({profile,viewport,reports,errors,method:'Normal title and expedition UI; keyboard movement and platform jumps. No story flags, health, positions, or objective completions injected.'},null,2));
  console.log('PASS',profile,reports.filter(r=>r.id).length,'chapters,',reports.filter(r=>r.sideQuest).length,'optional quests');
}catch(e){await page.screenshot({path:`${out}/${profile}-failure.png`});await context.storageState({path:`${out}/${profile}-storage.json`});fs.writeFileSync(`${out}/${profile}-failure.json`,JSON.stringify({error:String(e.stack),state:await view().catch(()=>null),errors,reports},null,2));throw e;}
finally{await context.close();await browser.close();if(server)server.kill();}
