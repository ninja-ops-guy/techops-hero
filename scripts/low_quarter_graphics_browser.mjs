import fs from 'node:fs';import assert from 'node:assert/strict';import {chromium} from 'playwright';
const root=process.env.LOW_QUARTER_BASE_URL||'http://127.0.0.1:4208/',out=process.env.GRAPHICS_ARTIFACT_DIR||'artifacts/low-quarter-graphics';fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});const reports=[];
try{for(const [width,height] of [[1280,900],[320,740],[390,844],[844,390]]){
 const context=await browser.newContext({viewport:{width,height},hasTouch:width!==1280,reducedMotion:width===320?'reduce':'no-preference'}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 if(width===320)await page.addInitScript(()=>{const raf=requestAnimationFrame.bind(window);let tested=false;window.requestAnimationFrame=callback=>raf(t=>{if(!tested&&document.getElementById('setup')?.hidden){tested=true;callback(t-1000);}else callback(t);});});
 await page.goto(new URL('low-quarter-review.html',root).href);await page.click('#launch');await page.click('#pause');
 assert.equal(await page.locator('#save-error').textContent(),'');assert(await page.locator('#touch').isVisible());for(const id of ['use','strike','pause']){const r=await page.locator('#'+id).boundingBox();assert(r.height>=44);}
 for(const room of ['approaches','services','shelters','departure','receiving']){
  const r=await page.evaluate(room=>{
   // EXPLICIT GRAPHICS FIXTURE: not campaign progression or playthrough evidence.
   const C=TechOpsCampaign,s=C.createInitialState();s.story={ending:'shutdown',facts:{campaign_complete:true}};const state=TechOpsLowQuarterOperation.begin(s,'shutdown','graphics_'+room),o=state.lowQuarterOperation;o.room=room;o.x=room==='receiving'?570:room==='departure'?1050:room==='shelters'?850:700;o.tick=room==='approaches'?910:350;if(room==='services')o.facing=-1;
   if(room==='receiving'){o.done.receiver=true;o.convoy={arrived:true};o.residents.slice(0,8).forEach((p,i)=>{p.room='receiving';p.boarded=true;p.x=220+i*40;});}
   if(room==='approaches'){o.done.ready=true;o.breachStart=900;o.assaultStart=900;o.enemies=Array.from({length:6},(_,i)=>({id:'fixture_'+i,alive:true,x:760+i*50,hp:60}));o.attackAt=909.9;}
   document.getElementById('status').textContent='ART REVIEW / '+room.toUpperCase()+' / GRAPHICS FIXTURE';document.getElementById('objective').textContent='Visual inspection: '+TechOpsLowQuarterOperationVisuals.areas[room].name;document.getElementById('message').textContent='Graphics fixture only. No mission progress or rescue credit is awarded here.';
   const before=JSON.stringify(state),canvas=document.querySelector('canvas');const start=performance.now();for(let i=0;i<120;i++)TechOpsLowQuarterOperationVisuals.draw(canvas,state);const average=(performance.now()-start)/120;
   return {immutable:before===JSON.stringify(state),canvas:{width:canvas.width,height:canvas.height},averageDrawMs:average,overflow:document.documentElement.scrollWidth>innerWidth};
  },room);assert(r.immutable);assert(!r.overflow,'Horizontal overflow at '+width);assert(r.averageDrawMs<16.7,'Renderer exceeds desktop/headless draw budget: '+r.averageDrawMs);
  await page.screenshot({path:out+'/'+width+'-'+room+'.png',fullPage:true});reports.push({width,height,room,...r,scope:'graphics-only fixture, not gameplay/phone performance'});
 }
 assert.deepEqual(errors,[]);assert.equal(await page.locator('#save-error').textContent(),'');await context.close();
}fs.writeFileSync(out+'/graphics.json',JSON.stringify({scope:'Canvas read-only art/layout fixtures. Headless average draw time is not physical-device FPS.',cases:reports},null,2));console.log('PASS 20 desktop/portrait/landscape graphics fixtures, state immutability, readable controls, no horizontal overflow, bounded average draw cost.');}finally{await browser.close();}
