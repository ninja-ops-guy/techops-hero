// Full production page. Encounter fixtures arrange position/health, never inputs.
// Every attack uses browser keys or touch; Chromium-touch additionally holds two fingers.
import fs from 'node:fs';
import path from 'node:path';
import {chromium,webkit,devices} from 'playwright';
import {beginRuntimeEvidence} from './runtime_evidence_capture.mjs';
import {roomBootstrapSnapshot} from './room_bootstrap_snapshot.mjs';
const base=process.env.BOT_BASE_URL||'http://127.0.0.1:4173/';
const out=process.env.BOT_OUT_DIR||'runtime-bot-artifacts';fs.mkdirSync(out,{recursive:true});
const results=[];
const profiles=[['chromium',chromium,false],['chromium-touch',chromium,true],['webkit',webkit,true]];
const selected=process.env.NIGHT_COMBAT_BROWSERS?.split(',');
for(const [name,type,touch] of profiles){
 if(selected&&!selected.includes(name))continue;
 let browser,context,page,capture=null;
 const errors=[],checks=[];
 const record={browser:name,touch,fixture:true,checks,errors,pass:false};results.push(record);
 try{
  browser=await type.launch({headless:true,...(type===chromium&&process.env.BOT_CHROMIUM_EXECUTABLE?{executablePath:process.env.BOT_CHROMIUM_EXECUTABLE}:{}),...(type===chromium&&process.env.BOT_CHROMIUM_CHANNEL?{channel:process.env.BOT_CHROMIUM_CHANNEL}:{})});
  record.browserVersion=browser.version();
  context=await browser.newContext(touch?{...devices['iPhone 13']}:{viewport:{width:1440,height:900}});
  await context.route('**/*',r=>r.request().url().startsWith(base)?r.continue():r.abort());
  page=await context.newPage();page.on('pageerror',e=>errors.push(String(e)));page.setDefaultTimeout(15000);page.setDefaultNavigationTimeout(60000);
  const shot=label=>page.screenshot({path:path.join(out,`night-combat-${name}-${label}.png`)});
  const click=locator=>touch?locator.tap():locator.click();
  const setup=async (enemyX=700)=>page.evaluate(x=>{
   const n=NM;TechOpsNightInput.reset();for(const k of Object.keys(keys))keys[k]=false;joy.x=joy.y=0;
   TechOpsNightCombat.cancel(n);delete n._nightCombat;
   Object.assign(n,{x:650,y:396,w:22,h:34,vx:0,vy:0,face:1,onGround:true,hp:100,ifr:0,block:false,clear:false,hitStop:0,jHeld:false,cam:200});
   n.platforms=[];n.enemies=[{x,y:396,w:24,h:34,hp:500,maxHp:500,kind:'thug',name:'Sparring fixture',alive:true,dmg:0,spd:0,windup:0,hitT:0,cd:999,cash:[0,0],tint:'#7ee787'}];
  },enemyX);
  const idle=()=>page.waitForFunction(()=>!NM._nightCombat?.attack);
  capture=await beginRuntimeEvidence(context,page,{out,prefix:`night-combat-${name}`});
  await page.goto(base,{waitUntil:'domcontentloaded'});
  record.roomBootstrap=await page.evaluate(roomBootstrapSnapshot);
  await page.waitForFunction(()=>window.TechOpsProductionBootstrap?.ready()&&window.TechOpsNightInput&&document.querySelector('#btn-nightcrawler'));
  await click(page.locator('#btn-nightcrawler'));
  const deadline=Date.now()+20000;
  while(Date.now()<deadline){
   if(await page.evaluate(()=>!!(typeof S!=='undefined'&&S?.nightMode&&!S.inDialog&&!window.v722?.active()&&!window.__productionDesiredMode)))break;
   const dialog=page.locator('#dlg-options button').first();
   if(await page.evaluate(()=>!(typeof S!=='undefined'&&S?.nightMode)&&!window.v722?.active()&&!document.querySelector('#dialogue')?.classList.contains('hidden'))&&await dialog.isVisible().catch(()=>false))await click(dialog);
   if(await page.evaluate(()=>!!window.v722?.active()))await page.keyboard.press('Escape');
   await page.waitForTimeout(100);
  }
  await page.waitForFunction(()=>window.TechOpsNightInput.ready());checks.push('canonical fresh-save Night launch');
  await page.waitForFunction(()=>window.TechOpsNightMoves?.warm());checks.push('generated move atlas decoded on full production page');
  if(await page.locator('#night-input-grab').isVisible())throw Error('Optional GRAB leaked into the default movement-combo controls');
  if(touch){
   const original=page.viewportSize();
   for(const viewport of [{width:320,height:640},{width:390,height:844},{width:844,height:390}]){
    await page.setViewportSize(viewport);
    await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
    const layout=await page.evaluate(()=>{
     const selectors=['#tb-interact','#night-input-assists','#night-input-kick','#night-input-jump','#dpad .d-left','#dpad .d-right','#dpad .d-up','#dpad .d-down'];
     return selectors.map(id=>{const el=document.querySelector(id),r=el.getBoundingClientRect(),top=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return {id,reachable:!!top&&(top===el||el.contains(top)),x:r.x,y:r.y,w:r.width,h:r.height,inViewport:r.x>=0&&r.y>=0&&r.right<=innerWidth&&r.bottom<=innerHeight};});
    });
    for(let i=0;i<layout.length;i++)for(let j=i+1;j<layout.length;j++){const a=layout[i],b=layout[j];if(a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y)throw Error('Overlapping touch controls '+a.id+' '+b.id);}
    if(layout.some(r=>!r.reachable||!r.inViewport||r.w<(r.id.startsWith('#dpad')?52:62)||r.h<(r.id.startsWith('#dpad')?52:62)))throw Error('Touch control layout '+JSON.stringify({viewport,layout}));
   }
   await page.setViewportSize(original);
   await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
   checks.push('non-occluded touch targets at 320/390 portrait and 844 landscape');
  }
  // The spawn is beside the Charger: E/Punch must still open its routes.
  if(touch)await click(page.locator('#tb-interact'));else await page.keyboard.press('KeyE');
  await page.getByText('THE CHARGER',{exact:false}).first().waitFor({state:'visible'});
  await click(page.locator('#dlg-options button').filter({hasText:'Back to the street.'}));checks.push('Charger interaction preserved');
  // Preserve the existing touch grab/throw checks through the optional controls.
  await click(page.locator('#night-input-assists'));
  await page.locator('#night-input-grab').waitFor({state:'visible'});
  if(touch){
   const b=await page.locator('#night-input-grab').boundingBox();
   if(!b||b.width<44||b.height<42)throw Error('Optional grab target is too small');
  }
  // Exercise real event ordering: aliases share one held direction.
  await setup(1500);
  await page.keyboard.down('KeyD');await page.keyboard.down('ArrowRight');
  try{
   await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
   if(await page.evaluate(()=>NM._nightCombat?.events.some(e=>e.type==='dash')))throw Error('Overlapping D/Right presses created a false dash');
  }finally{await page.keyboard.up('KeyD');await page.keyboard.up('ArrowRight');}
  // Hit-stop pauses simulation, but must not extend the human tap interval.
  await setup(1500);await page.evaluate(()=>{NM.hitStop=100;});
  await page.keyboard.press('ArrowRight');await page.waitForTimeout(320);await page.keyboard.press('ArrowRight');
  await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
  if(await page.evaluate(()=>NM._nightCombat?.events.some(e=>e.type==='dash')))throw Error('Hit-stop stretched the double-tap window');
  await page.evaluate(()=>{NM.hitStop=0;});
  checks.push('direction aliases and hit-stop cannot create accidental dashes');
  await setup(770);
  await page.keyboard.press('ArrowRight',{delay:40});await page.keyboard.press('ArrowRight',{delay:40});
  await page.waitForFunction(()=>NM._nightCombat?.events.some(e=>e.type==='dash'));
  await page.keyboard.down('ArrowRight');
  try{await page.waitForFunction(()=>NM.enemies[0].x-NM.x<45);await page.keyboard.press('KeyE');}
  finally{await page.keyboard.up('ArrowRight');}
  await page.waitForFunction(()=>NM._nightCombat?.events.some(e=>e.type==='grab'&&e.fromDash));
  await shot('movement-dash-grab');checks.push('trusted double-tap -> dash -> attack grabs through full input stack');
  for(const direction of ['left','right','up','down']){
   await setup(690);
   if(touch)await click(page.locator('#night-input-grab'));else await page.keyboard.press('KeyG');
   await page.waitForFunction(()=>!!NM._nightCombat?.grab);
   await page.waitForFunction(()=>NM._nightCombat.time-NM._nightCombat.grab.at>=140);
   if(direction==='up')await shot('stationary-grab');
   const arrow='Arrow'+direction[0].toUpperCase()+direction.slice(1);
   await page.keyboard.down(arrow);
   try{await page.waitForFunction(()=>!NM._nightCombat.grab&&NM._nightCombat.events.some(e=>e.type==='throw'));}
   finally{await page.keyboard.up(arrow);}
   const thrown=await page.evaluate(()=>({vx:NM.enemies[0]._nightCombat.vx,vy:NM.enemies[0]._nightCombat.vy}));
   if(direction==='left'&&thrown.vx>=0||direction==='right'&&thrown.vx<=0||direction==='up'&&thrown.vy>=0)throw Error('Wrong throw direction '+direction+': '+JSON.stringify(thrown));
  }
  checks.push('stationary grabs and four directional throws');
  for(const [aim,key,kind,launches] of [['ArrowUp','KeyE','uppercut',true],['ArrowDown','KeyE','low',false],[null,'KeyJ','kick',true],['ArrowUp','KeyJ','rising-kick',true],['ArrowDown','KeyJ','sweep',false]]){
   await setup();if(aim)await page.keyboard.down(aim);
   try{await page.keyboard.press(key);}finally{if(aim)await page.keyboard.up(aim);}
   await page.waitForFunction(k=>NM._nightCombat?.events.some(e=>e.type===k&&e.damage>0),kind);
   const state=await page.evaluate(()=>({ground:NM.onGround,air:!!NM.enemies[0]._nightCombat.air}));
   if(!state.ground||state.air!==launches)throw Error(kind+' aim/launch mismatch: '+JSON.stringify(state));
  }
  checks.push('upper/lower punches and neutral/rising/sweep kicks');
  await setup();await page.keyboard.down('ArrowUp');await page.keyboard.press('KeyJ');await page.keyboard.up('ArrowUp');
  await page.waitForFunction(()=>NM.enemies[0]._nightCombat?.air);
  if(touch)await click(page.locator('#night-input-jump'));else await page.keyboard.press('Space');
  await page.waitForFunction(()=>!NM.onGround);
  for(let i=0;i<3;i++){
   await idle();
   if(touch&&i===1)await click(page.locator('#night-input-kick'));else await page.keyboard.press(i===1?'KeyJ':'KeyE');
   await page.waitForFunction(count=>NM._nightCombat.events.filter(e=>['air','air-kick'].includes(e.type)&&e.damage>0).length>=count,i+1);
  }
  await shot('air-combo');
  const combo=await page.evaluate(()=>NM._nightCombat.events.filter(e=>['air','air-kick'].includes(e.type)&&e.damage>0));
  if(combo.length!==3)throw Error('Expected three confirmed air contacts');checks.push('launch -> explicit jump -> punch/kick/punch air combo');
  await setup();
  for(let i=0;i<3;i++){
   if(i)await page.waitForFunction(()=>{const c=NM._nightCombat;return !c.attack&&c.time-c.lastInput>=310&&c.time-c.lastInput<480;});
   await page.keyboard.press('KeyE');await page.waitForFunction(count=>NM._nightCombat?.hits>=count,i+1);
  }
  if(!await page.evaluate(()=>NM.enemies[0]._nightCombat.air&&NM._nightCombat.stage===2))throw Error('Paced rising finisher regressed');checks.push('original rhythm finisher retained');
  if(name==='chromium-touch'){
   // Actual simultaneous touchscreen contacts, including the game's D-pad.
   await setup();const cdp=await context.newCDPSession(page);
   const center=async selector=>{const b=await page.locator(selector).boundingBox();if(!b)throw Error('Missing touch target '+selector);return {x:b.x+b.width/2,y:b.y+b.height/2};};
   const up=await center('#dpad .d-up'),kick=await center('#night-input-kick');
   const points=[{...up,id:1,radiusX:3,radiusY:3,force:1},{...kick,id:2,radiusX:3,radiusY:3,force:1}];
   try{
    await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[points[0]]});
    await page.waitForFunction(()=>joy.y<-.4);
    await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:points});
    await page.waitForFunction(()=>NM._nightCombat?.attack?.kind==='rising-kick');
   }finally{await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});}
   await page.waitForFunction(()=>NM._nightCombat.events.some(e=>e.type==='rising-kick'&&e.damage>0));
   await shot('simultaneous-aim-kick');await cdp.detach();checks.push('trusted simultaneous D-pad up + KICK');
  }
  await setup();await click(page.locator('#night-campaign'));const hp=await page.evaluate(()=>NM.enemies[0].hp);
  await page.keyboard.press('KeyJ');await page.keyboard.press('KeyG');
  if(await page.evaluate(()=>NM.enemies[0].hp)!==hp)throw Error('Combat leaked into campaign dialog');
  await click(page.locator('#dlg-options button').filter({hasText:'Back to Night Walker'}));checks.push('campaign-dialog combat isolation');
  if(errors.length)throw Error(errors.join('\n'));
  record.pass=true;
 }catch(e){record.error=String(e.stack||e);if(page){record.state=await page.evaluate(()=>({guard:window.TechOpsProductionWrapperGuard?.health(),n:typeof NM!=='undefined'&&NM&&{x:NM.x,y:NM.y,face:NM.face,dialog:typeof S!=='undefined'&&S?.inDialog,combat:NM._nightCombat,enemies:NM.enemies}})).catch(()=>null);await page.screenshot({path:path.join(out,`night-combat-${name}-error.png`),timeout:5000}).catch(()=>{});}}
 finally{
  if(page&&!record.roomBootstrap)record.roomBootstrap=await page.evaluate(roomBootstrapSnapshot).catch(()=>null);
  try{record.artifacts=capture?await capture.finish():{trace:null,runtime:null,captureErrors:['Capture did not start']};}
  catch(error){record.artifacts={trace:null,runtime:null,captureErrors:[String(error)]};}
  // Evidence failures cannot turn an unobserved run green. Preserve gameplay errors.
  if(record.artifacts.captureErrors.length){record.pass=false;record.error=record.error||'Night combat evidence capture failed';}
  if(context)await context.close();if(browser)await browser.close();
  console.log(JSON.stringify(record));fs.writeFileSync(path.join(out,'night-combat.json'),JSON.stringify(results,null,2));
 }
}
if(!results.length||results.some(r=>!r.pass))process.exitCode=1;
