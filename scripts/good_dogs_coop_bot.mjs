// Real independent keyboard input for local co-op. M2 combat setup is an
// explicit fixture here; the existing solo route still clears it unassisted.
import fs from 'node:fs';
import path from 'node:path';
import {chromium,webkit,devices} from 'playwright';
import {clickGoodDogsLaunch,moveDogTo,driveMissionOne,mountFreshProperty,clearMissionTwoWithInput} from './good_dogs_route_driver.mjs';
const base=process.env.BOT_BASE_URL||'http://127.0.0.1:4173/',out=process.env.BOT_OUT_DIR||'runtime-bot-artifacts';fs.mkdirSync(out,{recursive:true});
const names=new Set((process.env.BOT_BROWSERS||'chromium,webkit').split(',')),results=[];
for(const [name,type] of [['chromium',chromium],['webkit',webkit]]){
 if(!names.has(name))continue;
 const browser=await type.launch({headless:true,...(name==='chromium'&&process.env.BOT_CHROMIUM_CHANNEL?{channel:process.env.BOT_CHROMIUM_CHANNEL}:{})});
 try{for(const mode of ['local','solo']){
  const context=await browser.newContext(mode==='solo'?{...devices['iPhone 13']}:{viewport:{width:1280,height:800}}),page=await context.newPage(),errors=[];
  let releaseBootstrap=()=>{};
  if(mode==='local'){const gate=new Promise(resolve=>{releaseBootstrap=resolve;});await page.route('**/production_wrapper_guard.js?*',async route=>{await gate;await route.continue();});}
  const snap=async label=>page.screenshot({path:path.join(out,`coop-${name}-${mode}-${label}.png`)});
  page.on('pageerror',e=>errors.push(String(e)));page.setDefaultTimeout(10000);
  try{
   await page.goto(base,{waitUntil:'domcontentloaded'});
   if(mode==='local'){
    // Hold one production dependency while clicking the real title button.
    // An early launch must remain pending until the boarding adapter is installed.
    await page.waitForFunction(()=>window.TechOpsGoodBoysButtonHardFix?.VERSION>=16&&document.querySelector('script[data-production-bootstrap="production_wrapper_guard.js"]'),null,{timeout:20000});
    await clickGoodDogsLaunch(page);
    await page.waitForFunction(()=>window.__goodBoysOpeningPhase?.phase==='opening-dependencies');
    if(await page.evaluate(()=>!!document.querySelector('#gd-mode-solo')||!!window.NM?._v736))throw Error('Early title input entered campaign before production readiness');
    releaseBootstrap();
   }else{
    await page.waitForFunction(()=>window.TechOpsGoodBoysButtonHardFix?.depsReady(),null,{timeout:20000});
    await clickGoodDogsLaunch(page);
   }
   await page.locator('#gd-mode-solo').waitFor();
   if(!await page.evaluate(()=>window.__productionBootstrapReady&&window.__techopsWrapperGuardInstalled&&window.__goodBoysShipFlightInstalled))throw Error('Selector appeared before required runtime dependencies');
   await snap('selector');
   // Cancellation must leave title and launch authority usable.
   await page.locator('#gd-mode-cancel').click();await page.waitForTimeout(750);await clickGoodDogsLaunch(page);
   if(mode==='solo'){
    await mountFreshProperty(page,{onHomeShot:i=>snap('home-'+i)});await snap('property');await driveMissionOne(page);await clearMissionTwoWithInput(page,{board:false});await snap('hangar');
   }else{
    await page.locator('#gd-mode-local').click();
    for(let i=1;i<=3;i++){await page.waitForFunction(shot=>window.__goodDogsHomeScene?.shot===shot,i);await snap('home-'+i);await page.locator('#gd-home-next').click();}
    await page.waitForFunction(()=>window.NM?._v736?.m===1&&!window.S.inDialog);
    const original=await page.evaluate(()=>({a:NM.x,b:NM._v736.partner.x}));
    await page.keyboard.down('KeyD');await page.waitForTimeout(350);await page.keyboard.up('KeyD');
    const p2=await page.evaluate(()=>({a:NM.x,b:NM._v736.partner.x}));
    if(Math.abs(original.a-p2.a)>5||p2.b-original.b<25)throw Error('P2 input moved P1 or failed to move P2: '+JSON.stringify({original,p2}));
    await page.keyboard.down('ArrowRight');await page.waitForTimeout(350);await page.keyboard.up('ArrowRight');
    await page.waitForTimeout(150);const p1=await page.evaluate(()=>({a:NM.x,b:NM._v736.partner.x}));
    if(p1.a-p2.a<25||Math.abs(p1.b-p2.b)>10)throw Error('P1 input moved P2: '+JSON.stringify({p1,p2}));
    // Traverse together so the shared camera never abandons a player.
    for(const x of [450,720,990,1179]){await moveDogTo(page,x);await moveDogTo(page,x,{player:2});}
    await moveDogTo(page,1369);await page.waitForTimeout(1200);await snap('garage-puzzle');
    if(!await page.evaluate(()=>TechOpsGoodDogsCoop.complete(1)))throw Error('Two human dogs failed garage puzzle');
    await moveDogTo(page,1440);await moveDogTo(page,1410,{player:2});
    await page.keyboard.press('KeyE');await page.waitForFunction(()=>S.meta._v736.m===2);
    const intro=page.locator('#good-boys-campaign-intro button').first();await intro.waitFor();await intro.click();
    await page.waitForFunction(()=>NM._v736.m===2&&!S.inDialog);
    if(!await page.evaluate(()=>TechOpsGoodDogsCoop.active()))throw Error('Local mode lost at M2 handoff');
    // Isolate second-player collision and combat without rewriting the combat resolver.
    await page.evaluate(()=>{NM.enemies=[];NM._v736.pendingSpawn=null;NM._v736.wave=99;NM.x=700;NM._v736.partner.x=650;});
    await page.keyboard.press('KeyW');await page.waitForTimeout(100);
    if(!await page.evaluate(()=>NM._v736.partner.vy<0&&!NM._v736.partner.onGround))throw Error('P2 jump failed');
    await page.waitForTimeout(1000);
    await page.evaluate(()=>{const p=NM._v736.partner;p.face=1;NM.enemies=[{x:p.x+35,y:p.y,w:24,h:34,hp:30,maxHp:30,alive:true,kind:'guard',name:'Coop test',dmg:0,spd:0,cd:999,down:0}];});
    await page.keyboard.press('KeyF');await page.waitForTimeout(120);
    if(!await page.evaluate(()=>NM.enemies[0].hp<30))throw Error('P2 attack did not reach shared damage resolver');
    await page.evaluate(()=>{NM.enemies=[];NM._v736.pendingSpawn=null;NM._v736.wave=99;NM._gbShipRevealed=true;});
    await moveDogTo(page,969,{player:2});await moveDogTo(page,1199);await page.waitForTimeout(1400);
    if(await page.evaluate(()=>TechOpsGoodDogsCoop.complete(2)))throw Error('Console puzzle opened without interaction');
    await page.keyboard.press('KeyE');await page.waitForFunction(()=>TechOpsGoodDogsCoop.complete(2));await snap('power-puzzle');
    // P1 down must not transfer P2's identity or position. P2 explicitly revives.
    await page.evaluate(()=>{NM.x=1180;NM._v736.partner.x=1210;exitNight(false);});
    await page.keyboard.press('KeyR');await page.waitForTimeout(100);
    if(!await page.evaluate(()=>NM._v736.active==='katrin'&&!NM._v736.chars.katrin.downed&&NM._v736.chars.katrin.hp>1))throw Error('P2 revive/ownership failed');
    await page.keyboard.down('KeyD');await page.evaluate(()=>window.dispatchEvent(new Event('blur')));await page.waitForTimeout(250);await page.keyboard.up('KeyD');
    if(!await page.evaluate(()=>Math.abs(NM._v736.partner.vx)<.1))throw Error('P2 input stuck after blur');
   }
   if(errors.length)throw Error(errors.join('\n'));
   results.push({browser:name,mode,pass:true,controls:'real keyboard',m2CombatFixture:mode==='local',evidence:await page.evaluate(()=>({mode:TechOpsGoodDogsCoop.mode(),mission:NM._v736.m,puzzles:S.meta._v736.pairPuzzles,home:__goodDogsHomeSceneExit}))});
  }catch(e){results.push({browser:name,mode,pass:false,error:String(e.stack||e),errors,state:await page.evaluate(()=>({phase:window.__goodBoysOpeningPhase,error:window.__goodBoysOpeningErrorDetail,step:window.__err736p,x:window.NM?.x,p:window.NM?._v736?.partner,puzzle:window.NM?._v736?.pairPuzzle,meta:window.S?.meta?._v736,dialog:window.S?.inDialog})).catch(()=>null)});await snap('error').catch(()=>{});}
  finally{releaseBootstrap();console.log(JSON.stringify(results.at(-1)));fs.writeFileSync(path.join(out,'coop.json'),JSON.stringify(results,null,2));await context.close();}
 }}finally{await browser.close();}
}
if(!results.length||results.some(r=>!r.pass))process.exitCode=1;
