// Enter through the real South Exit. Fixtures supply a finished shift and, for
// the optional porch visit, the established relationship and travel distance.
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {chromium,webkit} from 'playwright';

const base=process.env.BOT_BASE_URL;
if(!base) throw new Error('Set BOT_BASE_URL to the combined build.');
const out=process.env.NIGHT_COMIC_OUT||'artifacts/night-comic';
await mkdir(out,{recursive:true});
const results=[];
for(const [name,engine,width,height,touch,calm,skip] of [
  ['desktop',chromium,1280,800,false,false,false],
  ['touch',webkit,390,844,true,false,true],
  ['reduced',chromium,320,740,true,true,false],
  ['landscape',webkit,844,390,true,false,false],
]){
  if(process.env.NIGHT_PROFILE && process.env.NIGHT_PROFILE!==name)continue;
  const browser=await engine.launch();
  const context=await browser.newContext({viewport:{width,height},hasTouch:touch,isMobile:touch,reducedMotion:calm?'reduce':'no-preference'});
  await context.route('**/*',r=>r.request().url().startsWith(base)?r.fallback():r.abort());
  const page=await context.newPage(); const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  const press=button=>touch?button.tap():button.click();
  const option=label=>page.locator('#dlg-options button').filter({hasText:label});
  const wait=fn=>page.waitForFunction(fn,null,{timeout:20000});
  const finger=touch&&engine===chromium?await context.newCDPSession(page):null;
  async function hold(key,control,until) {
    if(!finger){
      await page.keyboard.down(key);
      try{await until();}finally{await page.keyboard.up(key);}
      return;
    }
    const bounds=await control.boundingBox();
    assert.ok(bounds&&bounds.width>0&&bounds.height>0,'visible touch control '+key);
    await finger.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:bounds.x+bounds.width/2,y:bounds.y+bounds.height/2}]});
    try{await until();}finally{await finger.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});}
  }
  const interact=()=>touch?page.locator('#tb-interact').tap():page.keyboard.press('e');
  const shot=label=>page.screenshot({path:out+'/'+name+'-'+label+'.png',timeout:5000});
  try{
    await page.goto(base,{waitUntil:'domcontentloaded'});
    await wait(()=>window.__productionBootstrapReady&&window.TechOpsProductionTitleExperience?.state().ready);
    await press(page.locator('#btn-start'));await press(option('Standard'));await press(option('Clock in'));
    await wait(()=>window.S&&!S.inDialog&&!S.nightMode&&S._nightObjs?.door);
    await page.evaluate(()=>{
      S.clock=960;S.room=null;S.px=S._nightObjs.door.x;S.py=S._nightObjs.door.y;
      // Ambient coworkers can otherwise randomly intercept E at the prepared exit.
      for(const coworker of S.npcs)if(Math.abs(coworker.x-S.px)+Math.abs(coworker.y-S.py)<4)coworker.x-=6;
      save();
      window.__saveSlots=()=>Object.fromEntries(Object.values(TechOpsSaveKeys).concat('techops_save_bak').map(key=>[key,localStorage.getItem(key)]));
      window.__beforeSlots=JSON.stringify(__saveSlots());
      window.__savedBefore=localStorage.getItem('techops_save');
      if(!__savedBefore)throw new Error('Expected a real campaign save before clock-out');
      const enter=TechOpsNightRuntime.onEntered;window.__entries=0;window.__shotLog=[];window.__nightSpriteDraws=0;
      const draw=CanvasRenderingContext2D.prototype.drawImage;
      CanvasRenderingContext2D.prototype.drawImage=function(image,...rest){
        if(this.canvas.parentElement?.dataset.nightDriveShot==='first-street' &&
          (image.src?.endsWith('/assets/handoff/mike.png') || image.src && image.src===window.NIGHT_WALKER_REFERENCE_V1?.src)) __nightSpriteDraws++;
        return draw.call(this,image,...rest);
      };
      TechOpsNightRuntime.onEntered=function(...args){window.__entries++;return enter.apply(this,args);};
      const seen=new MutationObserver(()=>{
        const el=document.querySelector('#v722-cine'),id=el?.dataset.nightDriveShot;
        if(id&&!__shotLog.includes(id))__shotLog.push(id);
      });
      seen.observe(document.body,{subtree:true,attributes:true,attributeFilter:['data-night-drive-shot']});
    });
    await interact(); await press(option('Head out'));
    const cine=page.locator('#v722-cine');await cine.waitFor();
    await page.evaluate(()=>{enterNight();enterNight();});
    assert.equal(await page.evaluate(()=>!!S.nightMode),false);
    const skipBtn=cine.getByRole('button',{name:'Skip to Night'});
    const box=await skipBtn.boundingBox();assert.ok(box&&box.height>=44&&box.y>=0&&box.y+box.height<=height+1);
    if(skip){await press(skipBtn);}
    else{
      for(const beat of ['clock-out','new-haven','first-street']){
        await page.locator('[data-night-drive-shot="'+beat+'"]').waitFor();
        if(calm){
          const still=()=>page.evaluate(()=>Array.from(document.querySelectorAll('#v722-cine canvas:not([hidden])'),c=>c.toDataURL()).join('|'));
          await page.waitForTimeout(180);const a=await still();await page.waitForTimeout(120);assert.equal(a===await still(),true,beat+' still');
        }
        if(beat==='first-street') await wait(()=>__nightSpriteDraws>0);
        await page.waitForTimeout(calm?0:350);await shot(beat);
      }
    }
    await wait(()=>window.NM&&S.nightMode===NM&&!S.inDialog&&!v722.active());
    // A detached Skip button or a repeated API skip cannot settle this entry again.
    await page.evaluate(()=>v722.skip());
    const entry=await page.evaluate(()=>({entries:__entries,plays:v722.stats.plays,shots:__shotLog,skip:v722.stats.skips,
      saved:JSON.stringify(__saveSlots())===__beforeSlots,district:NM.district,street:NM.street}));
    assert.equal(entry.entries,1);assert.equal(entry.plays,1);assert.equal(entry.skip,+skip);
    assert.ok(entry.saved);assert.equal(entry.district,'downtown');assert.equal(entry.street,1);
    if(!skip)assert.deepEqual(entry.shots,['clock-out','new-haven','first-street']);
    await hold('ArrowRight',page.locator('#dpad .d-right'),()=>wait(()=>NM.enemies.some(e=>e.alive&&Math.abs(e.x-NM.x)<61&&Math.abs(e.y-NM.y)<45)));
    await hold('k',page.locator('#v55-nmbtns .v55-nbtn').filter({hasText:'BLOCK'}),()=>wait(()=>NM._nightCombat?.events.some(e=>e.type==='block')));
    const attack=async()=>{if(touch)await page.locator('#tb-interact').tap();else await page.keyboard.press('e');};
    await attack();
    if(!await page.evaluate(()=>NM._nightCombat.events.some(e=>e.damage>0))){
      await page.waitForTimeout(310);await attack();
    }
    await wait(()=>NM._nightCombat?.events.some(e=>e.damage>0));await shot('encounter');
    const contacts=await page.evaluate(()=>NM._nightCombat.events.filter(e=>e.type==='block'||e.damage>0).map(e=>e.type));
    // Keep this optional story test independent of the random street roster.
    await page.evaluate(()=>{NM.district='waldo';NM.enemies=[];NM.x=820;NM.vx=0;S.meta._v733rep=20;});
    await page.keyboard.press('e');await press(option('Sit a while'));
    const story=page.locator('#v725-cine');await story.waitFor();
    await wait(()=>v725.presentation().shot===0);await page.waitForTimeout(630);await shot('porch-wide');
    await wait(()=>v725.presentation().shot===1);await page.waitForTimeout(150);await shot('porch-close');
    const storyStats=await page.evaluate(()=>v725.stats());
    if(skip){await press(story.locator('.day-cine-skip'));}
    else{
      await press(story.getByRole('button',{name:/JUST LISTEN/}));
      await wait(()=>!v725.active());
    }
    await wait(()=>!v725.active()&&!S.inDialog&&!!S.meta._v733smokePaid);
    const porch=await page.evaluate(()=>({plays:v725.stats().plays,skips:v725.stats().skips,rep:S.meta._v733rep,
      choice:S.meta._v733smoke,track:S.meta._v733track1,entries:__entries}));
    assert.equal(porch.plays,storyStats.plays+1);assert.equal(porch.skips,storyStats.skips+(skip?1:0));assert.equal(porch.entries,1);
    const persisted=await page.evaluate(()=>JSON.parse(localStorage.getItem('techops_save')).meta);
    assert.equal(persisted._v733smokePaid,true);assert.equal(persisted._v733rep,porch.rep);
    assert.equal(persisted._v733smoke,porch.choice);assert.equal(persisted._v733track1,porch.track);
    assert.equal(porch.rep,32);assert.equal(porch.track,true);if(!skip)assert.equal(porch.choice,'listen');
    const before=await page.evaluate(()=>NM.x);
    await hold('ArrowRight',page.locator('#dpad .d-right'),()=>page.waitForFunction(x=>NM.x>x+6,before));
    assert.deepEqual(errors,[]);results.push({name,engine:browser.version(),entry,contacts,porch});console.log(JSON.stringify(results.at(-1)));
  }catch(error){
    console.error(name,errors,await page.evaluate(()=>({clock:window.S?.clock,dialog:document.querySelector('#dialogue')?.innerText?.slice(0,220),active:window.v725?.presentation(),street:window.NM?.district,world:window.NM&&[NM.x,NM.y,NM.hp,NM.block],last:window.NM?._nightCombat?.events.slice(-4),boot:window.__productionBootstrapError})).catch(()=>null));
    await shot('failure').catch(()=>{});throw error;
  }finally{await browser.close();}
}
await writeFile(out+'/results'+(process.env.NIGHT_PROFILE||'')+'.json',JSON.stringify(results,null,2));
