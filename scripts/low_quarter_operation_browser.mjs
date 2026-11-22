import assert from 'node:assert/strict';
import fs from 'node:fs';
import {chromium} from 'playwright';
const base=process.env.LOW_QUARTER_BASE_URL||'http://127.0.0.1:4208/';
const out=process.env.OPERATION_ARTIFACT_DIR||'artifacts/low-quarter-operation';fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE||undefined,args:['--no-sandbox','--disable-dev-shm-usage']});
const profiles=(process.env.OPERATION_PROFILES||'desktop,touch').split(','),endings=(process.env.OPERATION_ENDINGS||'shutdown,control,open_network').split(',');
const reports=[];let activePage=null;
try{for(const profile of profiles)for(const ending of endings){
 const ctx=await browser.newContext({viewport:profile==='touch'?{width:390,height:844}:{width:1280,height:800},hasTouch:profile==='touch',reducedMotion:profile==='touch'?'reduce':'no-preference'});
 const p=await ctx.newPage(),errors=[];activePage=p;p.on('pageerror',e=>errors.push(e.message));
 await p.clock.install({time:new Date('2026-11-22T12:00:00Z')});await p.goto(new URL('low-quarter-review.html',base).href);await p.clock.pauseAt(new Date('2026-11-22T12:10:00Z'));
 // This sentinel must never be read or changed by the review serializer.
 await p.evaluate(()=>localStorage.setItem(TechOpsCampaign.SAVE_KEY,'ordinary-campaign-sentinel'));
 await p.selectOption('#ending',ending);await p.click('#launch');
 const snap=()=>p.evaluate(()=>TechOpsLowQuarterOperationRuntime.snapshot());
 const advance=async seconds=>{for(let left=seconds;left>0;left-=5)await p.clock.runFor(Math.min(5,left)*1000);assert.equal(await p.locator('#save-error').textContent(),'');};
 const walk=async x=>{
   let o=(await snap()).lowQuarterOperation,guard=0;
   while(Math.abs(o.x-x)>10&&guard++<12){const dir=o.x<x?'right':'left',seconds=Math.max(.02,Math.min(2,Math.abs(o.x-x)/160));
     if(profile==='touch'){const b=p.locator('[data-hold="'+dir+'"]');const r=await b.boundingBox();await p.mouse.move(r.x+r.width/2,r.y+r.height/2);await p.mouse.down();await advance(seconds);await p.mouse.up();}
     else{const key=dir==='right'?'ArrowRight':'ArrowLeft';await p.keyboard.down(key);await advance(seconds);await p.keyboard.up(key);}
     o=(await snap()).lowQuarterOperation;
   }assert(Math.abs(o.x-x)<15,'Reach '+x+' got '+o.x);
 };
 const interact=async id=>{await p.locator('[data-interaction="'+id+'"]').click();await advance(.2);};
 const work=async id=>{console.log(profile+' '+ending+' · '+id);const prop=await p.evaluate(id=>TechOpsLowQuarterOperation.PROPS.find(x=>x.id===id),id);await walk(prop.x);await advance(.2);await interact(id);await advance(prop.seconds+.3);assert((await snap()).lowQuarterOperation.done[id],id+' : '+await p.locator('#message').textContent());};
 const go=async room=>{console.log(profile+' '+ending+' · travel '+room);if(room==='receiving')await p.getByRole('button',{name:'Follow convoy to receiving yard',exact:true}).click();else await p.locator('[data-route="'+room+'"]').click();const o=(await snap()).lowQuarterOperation;assert(o.travel,'Route '+room);await advance(o.travel.duration+.4);assert.equal((await snap()).lowQuarterOperation.room,room);};
 await work('lookout');await work('watch');await work('survey_approaches');await go('services');await work('survey_services');await work('power');await work('radio');
 // Reload from actual serialized gameplay after warning/repair, then resume with UI.
 const before=(await snap()).lowQuarter;await p.reload();await p.click('#resume');assert.deepEqual((await snap()).lowQuarter,before);
 await go('shelters');await work('survey_shelters');await work('vent');await work('care');if(ending==='open_network')await work('cooperate');await work('test_shelters');
 for(const r of (await snap()).lowQuarterOperation.residents.filter(r=>r.room==='shelters')){await walk(r.x);await advance(.2);await interact(r.id);}
 await go('departure');await work('survey_departure');await work('road');await work('alternative');await work('test_departure');await go('services');await go('approaches');await work('test_approaches');await go('services');await work('rota');await work('test_services');
 if(ending==='shutdown'){await work('records');await work('coalition');await work('dispatch');await advance(22);}
 if(ending==='control'){await work('dispatch');await work('stop');await work('audit');await go('departure');await work('veto');await work('challenge');await go('services');}
 if(ending==='open_network'){await work('dispatch');await advance(22);await work('isolate');await advance(18);await work('restore');}
 for(const room of ['approaches','services','shelters','departure']){const u=(await snap()).lowQuarterOperation.units.find(u=>u.id==='team_'+room);await walk(u.x);await advance(.2);await interact(u.id);}
 for(const room of ['shelters','departure','services','approaches']){if((await snap()).lowQuarterOperation.room!==room)await go(room);await walk(820);await advance(1.2);await interact('post');}
 await work('ready');await p.screenshot({path:out+'/'+profile+'-'+ending+'-deployment.png',fullPage:true});
 await advance(901-(await snap()).lowQuarterOperation.tick);
 let count=0;while((await snap()).lowQuarterOperation.kills<18&&count++<300){const o=(await snap()).lowQuarterOperation;assert(!o.halted,o.message);const target=o.enemies.find(e=>e.alive);if(target){await walk(target.x);await p.click('#strike');}await advance(.45);}
 assert.equal((await snap()).lowQuarterOperation.kills,18);await work('gate');await go('services');await go('departure');
 for(let i=1;i<=8;i++){const r=(await snap()).lowQuarterOperation.residents.find(r=>r.id==='resident_'+i);await walk(r.x);await advance(.2);await interact(r.id);}
 await walk(1120);await advance(9);await work('van');await go('receiving');await work('receiver');await advance(.4);
 const state=await snap(),o=state.lowQuarterOperation;assert(o.checkpoint,o.message);assert.equal(state.lowQuarter.result,null);assert.equal(state.lowQuarter.phase,'active');assert.equal(state.lowQuarter.siege.events.filter(e=>e.type==='resolve_wave').length,0);
 assert.equal(await p.evaluate(()=>localStorage.getItem(TechOpsCampaign.SAVE_KEY)),'ordinary-campaign-sentinel');
 await p.screenshot({path:out+'/'+profile+'-'+ending+'-checkpoint.png',fullPage:true});
 await p.reload();await p.click('#resume');assert.deepEqual((await snap()).lowQuarter,state.lowQuarter);assert((await snap()).lowQuarterOperation.checkpoint);assert.deepEqual(errors,[]);
 reports.push({profile,ending,checkpoint:true,safe:12,rescueEvents:state.lowQuarter.events.length,siegeEvents:state.lowQuarter.siege.events.length,observations:o.observations.length,ordinarySaveUntouched:true,inputs:profile==='touch'?'pointer-held movement and real UI actions':'keyboard movement and real UI actions',clock:'virtual browser clock; no gameplay state/receipt injection',physicalPhone:false});
 fs.writeFileSync(out+'/playthroughs.json',JSON.stringify(reports,null,2));console.log('PASS '+profile+' '+ending+' natural opening, save/reload, independent receiving, ordinary-save isolation');await ctx.close();
}}catch(error){if(activePage&&!activePage.isClosed()){await activePage.screenshot({path:out+'/failure.png',fullPage:true}).catch(()=>{});const diagnostic=await activePage.evaluate(()=>({state:globalThis.TechOpsLowQuarterOperationRuntime?.snapshot(),error:document.getElementById('save-error')?.textContent,message:document.getElementById('message')?.textContent})).catch(()=>null);fs.writeFileSync(out+'/failure.json',JSON.stringify({error:String(error),diagnostic},null,2));}throw error;}finally{await browser.close();}
