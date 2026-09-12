// Encounter fixtures set position/health only. Attacks and throws use real keys.
import fs from 'node:fs';
import path from 'node:path';
import {chromium,webkit,devices} from 'playwright';
const base=process.env.BOT_BASE_URL||'http://127.0.0.1:4173/',out=process.env.BOT_OUT_DIR||'runtime-bot-artifacts';fs.mkdirSync(out,{recursive:true});
const results=[];
for(const [name,type] of [['chromium',chromium],['webkit',webkit]]){
 const browser=await type.launch({headless:true,...(name==='chromium'&&process.env.BOT_CHROMIUM_CHANNEL?{channel:process.env.BOT_CHROMIUM_CHANNEL}:{})});
 const context=await browser.newContext(name==='webkit'?{...devices['iPhone 13']}:{viewport:{width:1440,height:900}}),page=await context.newPage();
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));page.setDefaultTimeout(12000);
 const shot=label=>page.screenshot({path:path.join(out,`night-combat-${name}-${label}.png`)});
 const setup=async x=>page.evaluate(enemyX=>{const n=window.NM;window.TechOpsNightCombat.cancel(n);delete n._nightCombat;Object.assign(n,{x:650,y:396,w:22,h:34,vx:0,vy:0,onGround:true,hp:100,ifr:0,block:false,clear:false,hitStop:0,jHeld:false,cam:200});n.platforms=[];n.enemies=[{x:enemyX,y:396,w:24,h:34,hp:500,maxHp:500,kind:'thug',name:'Sparring fixture',alive:true,dmg:0,spd:0,windup:0,hitT:0,cd:999,cash:[0,0],tint:'#7ee787'}];},x);
 const waitIdle=()=>page.waitForFunction(()=>!NM._nightCombat?.attack);
 try{
  await page.goto(base,{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>window.TechOpsProductionBootstrap?.ready()&&window.TechOpsNightCombat&&document.querySelector('#btn-nightcrawler'));
  await page.locator('#btn-nightcrawler').click();
  // A fresh save must choose difficulty and begin the incident before Night mounts.
  const launchDeadline=Date.now()+12000;
  while(Date.now()<launchDeadline){
   if(await page.evaluate(()=>!!(window.NM&&window.S?.nightMode&&!window.S.inDialog)))break;
   for(const name of [/Standard/i,/BEGIN THE INCIDENT/i]){
    const button=page.getByRole('button',{name}).first();
    if(await button.isVisible().catch(()=>false))await button.click();
   }
   if(await page.evaluate(()=>!!window.v722?.active?.()))await page.keyboard.press('Escape');
   await page.waitForTimeout(120);
  }
  await page.waitForFunction(()=>window.NM&&window.S?.nightMode&&!window.S.inDialog&&!window.NM._v736);
  for(const direction of ['left','right','up']){
   await setup(690);await page.keyboard.down('ArrowRight');await page.waitForTimeout(45);await page.keyboard.press('KeyE');await page.waitForFunction(()=>!!NM._nightCombat?.grab);await page.keyboard.up('ArrowRight');
   await page.waitForFunction(()=>NM._nightCombat.grab.armed&&NM._nightCombat.time-NM._nightCombat.grab.at>=140);
   if(direction==='up')await shot('grab');
   const throwKey='Arrow'+direction[0].toUpperCase()+direction.slice(1);await page.keyboard.down(throwKey);
   await page.waitForFunction(()=>NM.enemies[0]._nightCombat?.air&&!NM._nightCombat.grab);await page.keyboard.up(throwKey);
   const thrown=await page.evaluate(()=>({vx:NM.enemies[0]._nightCombat.vx,vy:NM.enemies[0]._nightCombat.vy}));
   if(direction==='left'?thrown.vx>=0:thrown.vx<=0)throw Error('Wrong throw direction '+direction+': '+JSON.stringify(thrown));
   if(direction==='up'){
    if(thrown.vy>=0)throw Error('Up throw did not launch');await shot('launch');await waitIdle();
    // Jump follows the up throw; steer alongside the target and make an air hit.
    await page.keyboard.down('ArrowRight');await page.keyboard.press('KeyE');
    await page.waitForFunction(()=>NM._nightCombat.events.some(e=>e.type==='air'&&e.damage>0));await page.keyboard.up('ArrowRight');await shot('air-hit');
   }
  }
  await setup(700);
  for(let i=0;i<3;i++){
   if(i)await page.waitForFunction(()=>{const c=NM._nightCombat;return !c.attack&&c.time-c.lastInput>=310&&c.time-c.lastInput<480;});
   await page.keyboard.press('KeyE');await page.waitForFunction(count=>NM._nightCombat?.hits>=count,i+1);
  }
  if(!await page.evaluate(()=>NM.enemies[0]._nightCombat.air&&NM._nightCombat.stage===2))throw Error('Paced hits did not reach rising finisher');await shot('rhythm-finisher');
  if(errors.length)throw Error(errors.join('\n'));
  results.push({browser:name,pass:true,fixture:true,realKeys:true,throws:['left','right','up'],airHit:true,rhythmFinisher:true,events:await page.evaluate(()=>NM._nightCombat.events)});
 }catch(e){results.push({browser:name,pass:false,error:String(e.stack||e),errors,state:await page.evaluate(()=>({phase:window.__goodBoysOpeningPhase,n:window.NM&&{x:NM.x,y:NM.y,face:NM.face,dialog:window.S?.inDialog,combat:NM._nightCombat,enemies:NM.enemies}})).catch(()=>null)});await shot('error').catch(()=>{});}
 finally{await context.close();await browser.close();console.log(JSON.stringify(results.at(-1)));fs.writeFileSync(path.join(out,'night-combat.json'),JSON.stringify(results,null,2));}
}
if(results.some(r=>!r.pass))process.exitCode=1;
