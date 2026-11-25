import assert from 'node:assert/strict';
import fs from 'node:fs';
import {chromium} from 'playwright';

const base=process.env.LOW_QUARTER_BASE_URL||'http://127.0.0.1:4208/';
const out=process.env.STYLE_ARTIFACT_DIR||'artifacts/low-quarter-style';
fs.mkdirSync(out,{recursive:true});
const files=['freight-actions-candidate','defender-actions','iona-nightwalker-atlas','k-iona-duo','supporting-roles-candidate','k-walk-candidate','infected-ship-candidate','resident-infected-variants','interactive-props-candidate',...['approaches','services','shelters','departure','receiving'].map(n=>n+'-background')].map(n=>'assets/low-quarter-style-review/'+n+'.webp');
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
try{
 const page=await browser.newPage({viewport:{width:1280,height:900}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>{const original=CanvasRenderingContext2D.prototype.drawImage;window.__styleDraws=[];window.__defenderFrames=[];CanvasRenderingContext2D.prototype.drawImage=function(image,...args){if(image instanceof HTMLImageElement&&image.currentSrc.includes('/low-quarter-style-review/'))window.__styleDraws.push(image.currentSrc.split('/').pop());if(image instanceof HTMLImageElement&&image.currentSrc.endsWith('/defender-actions.webp'))window.__defenderFrames.push(args.slice(0,2));return original.call(this,image,...args);};});
 await page.goto(new URL('low-quarter-review.html',base).href);await page.click('#launch');await page.click('#pause');
 await page.evaluate(async paths=>Promise.all(paths.map(src=>new Promise((resolve,reject)=>{const image=new Image();image.onload=resolve;image.onerror=()=>reject(Error('Art failed to load: '+src));image.src=src;}))),files);
 for(const room of ['approaches','services','shelters','departure','receiving']){
  const unchanged=await page.evaluate(room=>{
   const C=TechOpsCampaign,s=C.createInitialState();s.story={ending:'shutdown',facts:{campaign_complete:true}};
   const state=TechOpsLowQuarterOperation.begin(s,'shutdown','style_fixture_'+room),o=state.lowQuarterOperation;
   if(room==='services'){o.units.find(u=>u.id==='robot').follow=true;o.units[0].ready=true;}
   o.room=room;o.x=700;o.tick=910;if(room==='approaches'){o.done.ready=true;o.breachStart=900;o.assaultStart=900;o.enemies=[{id:'e_1',alive:true,x:760,hp:60},{id:'e_4',alive:true,x:820,hp:60}];}
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
 // Exercise exact source cells. A sheet-level decode alone cannot prove a pose.
 const samples=await page.evaluate(()=>{
  const s=TechOpsCampaign.createInitialState();
  s.story={ending:'shutdown',facts:{campaign_complete:true}};
  const state=TechOpsLowQuarterOperation.begin(s,'shutdown','pose_fixture');
  const o=state.lowQuarterOperation,canvas=document.getElementById('world');
  const ctx=canvas.getContext('2d'),original=ctx.drawImage;
  let cells=[];
  ctx.drawImage=function(img,...args){
   const file=img.currentSrc?.split('/').pop();
   if(file==='freight-actions-candidate.webp')cells.push('infected:'+args[0]/224+','+args[1]/224);
   if(file==='iona-nightwalker-atlas.webp')cells.push('iona:'+(args[1]/256*6+args[0]/256));
   return original.call(this,img,...args);
  };
  function sample(){
   const before=JSON.stringify(state);
   cells=[];
   TechOpsLowQuarterOperationVisuals.draw(canvas,state);
   if(before!==JSON.stringify(state))throw Error('Pose sampling modified operation');
   return cells;
  }
  try{
   o.tick=10;o.x=700;
   const enemy={id:'infected_4',x:750,hp:60,alive:true,hitAt:-1};
   o.enemies=[enemy];
   const walking=sample();enemy.hitAt=o.tick;o.attackAt=o.tick;
   const striking=sample();enemy.hp=40;o.hurtAt=o.tick;
   const hurt=sample();enemy.hp=0;enemy.alive=false;o.hp=0;
   const down=sample();o.tick+=.3;
   const expired=sample();
   return {walking,striking,hurt,down,expired};
  }finally{ctx.drawImage=original;}
 });
 assert(samples.walking.some(cell=>['infected:0,1','infected:1,1'].includes(cell)));
 assert(samples.striking.includes('infected:2,1') && samples.striking.includes('iona:7'));
 assert(samples.hurt.includes('infected:3,1') && samples.hurt.includes('iona:22'));
 assert(samples.down.includes('infected:4,1') && samples.down.includes('iona:23'));
 const kPoses=await page.evaluate(()=>{
  const s=TechOpsCampaign.createInitialState();s.story={ending:'shutdown',facts:{campaign_complete:true}};
  const state=TechOpsLowQuarterOperation.begin(s,'shutdown','k_pose_fixture'),o=state.lowQuarterOperation;
  const canvas=document.getElementById('world'),ctx=canvas.getContext('2d'),original=ctx.drawImage;
  function sample(room){
   o.room=room;const cells=[];
   ctx.drawImage=function(img,...args){if(img.currentSrc?.endsWith('/freight-actions-candidate.webp')&&args[1]===0)cells.push(args[0]/224);return original.call(this,img,...args);};
   try{const before=JSON.stringify(state);TechOpsLowQuarterOperationVisuals.draw(canvas,state);if(before!==JSON.stringify(state))throw Error('K pose mutated operation');return cells;}finally{ctx.drawImage=original;}
  }
  o.x=700;o.tick=10;o.room='departure';
  const resident=o.residents[0];resident.room='departure';resident.follow=true;resident.x=o.x-75;
  const rescue=sample('departure');
  resident.follow=false;o.room='approaches';o.breachStart=1;
  o.enemies=[{id:'fixture_infected',alive:true,x:o.x-75+100,hp:60,hitAt:-1}];
  const brace=sample('approaches');
  o.room='services';o.breachStart=null;o.enemies=[];
  const idle=sample('services');
  return {rescue,brace,idle};
 });
 assert(kPoses.rescue.includes(0),'K rescue pose must use the authored reaching frame');
 assert(kPoses.brace.includes(3),'K breach pose must use the authored guard frame');
 assert(!kPoses.idle.includes(0)&&!kPoses.idle.includes(3),'K returns to the reference idle pose outside rescue/threat states');
 assert(!samples.expired.includes('infected:4,1'));
 const frames=await page.evaluate(()=>window.__defenderFrames);
 assert(frames.some(([x,y])=>x===576&&y===0),'Posted military signal drawn');
 assert(frames.some(([x,y])=>x<576&&y===192),'Escorting robot stride drawn');
 const draws=await page.evaluate(()=>window.__styleDraws);
 for(const path of files)assert(draws.includes(path.split('/').pop()),'Renderer never drew '+path);
 assert.deepEqual(errors,[]);assert.equal(await page.locator('#save-error').textContent(),'');
 fs.writeFileSync(out+'/results.json',JSON.stringify({scope:'Graphics fixtures; no mission or physical device claim',rendered:files,errors},null,2));
 console.log('PASS: all 14 style assets decoded and drawn, five sectors, K walking frame, no renderer state mutation.');
}finally{await browser.close();}
