import assert from 'node:assert/strict';
import fs from 'node:fs';
import {chromium} from 'playwright';

const base=process.env.LOW_QUARTER_BASE_URL||'http://127.0.0.1:4208/';
const out=process.env.STYLE_ARTIFACT_DIR||'artifacts/low-quarter-style';
fs.mkdirSync(out,{recursive:true});
const files=['iona-nightwalker-atlas','k-iona-duo','supporting-roles-candidate','k-walk-candidate','infected-ship-candidate','resident-infected-variants','interactive-props-candidate',...['approaches','services','shelters','departure','receiving'].map(n=>n+'-background')].map(n=>'assets/low-quarter-style-review/'+n+'.webp');
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
try{
 const page=await browser.newPage({viewport:{width:1280,height:900}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>{const original=CanvasRenderingContext2D.prototype.drawImage;window.__styleDraws=[];CanvasRenderingContext2D.prototype.drawImage=function(image,...args){if(image instanceof HTMLImageElement&&image.currentSrc.includes('/low-quarter-style-review/'))window.__styleDraws.push(image.currentSrc.split('/').pop());return original.call(this,image,...args);};});
 await page.goto(new URL('low-quarter-review.html',base).href);await page.click('#launch');await page.click('#pause');
 await page.evaluate(async paths=>Promise.all(paths.map(src=>new Promise((resolve,reject)=>{const image=new Image();image.onload=resolve;image.onerror=()=>reject(Error('Art failed to load: '+src));image.src=src;}))),files);
 for(const room of ['approaches','services','shelters','departure','receiving']){
  const unchanged=await page.evaluate(room=>{
   const C=TechOpsCampaign,s=C.createInitialState();s.story={ending:'shutdown',facts:{campaign_complete:true}};
   const state=TechOpsLowQuarterOperation.begin(s,'shutdown','style_fixture_'+room),o=state.lowQuarterOperation;
   o.room=room;o.x=700;o.tick=910;if(room==='approaches'){o.done.ready=true;o.breachStart=900;o.assaultStart=900;o.enemies=[{id:'e_1',alive:true,x:760,hp:60}];}
   document.getElementById('status').textContent='STYLE REVIEW / '+room.toUpperCase()+' / GRAPHICS FIXTURE';
   document.getElementById('objective').textContent='Visual inspection: '+TechOpsLowQuarterOperationVisuals.areas[room].name;
   document.getElementById('message').textContent='Graphics fixture only. No mission progress or rescue credit is awarded.';
   const canvas=document.getElementById('world'),before=JSON.stringify(state);
   TechOpsLowQuarterOperationVisuals.draw(canvas,state);o.x=710;const moved=JSON.stringify(state);TechOpsLowQuarterOperationVisuals.draw(canvas,state);
   return before!==moved&&moved===JSON.stringify(state);
  },room);
  assert(unchanged,'Fixture motion was the only state change in '+room);
  await page.screenshot({path:out+'/'+room+'.png',fullPage:true});
 }
 const draws=await page.evaluate(()=>window.__styleDraws);
 for(const path of files)assert(draws.includes(path.split('/').pop()),'Renderer never drew '+path);
 assert.deepEqual(errors,[]);assert.equal(await page.locator('#save-error').textContent(),'');
 fs.writeFileSync(out+'/results.json',JSON.stringify({scope:'Graphics fixtures; no mission or physical device claim',rendered:files,errors},null,2));
 console.log('PASS: all 12 style assets decoded and drawn, five sectors, K walking frame, no renderer state mutation.');
}finally{await browser.close();}
