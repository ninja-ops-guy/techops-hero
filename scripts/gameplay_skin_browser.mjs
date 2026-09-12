/* Real DOM skin/lifecycle fixtures. Explicitly seeded state, not a campaign run. */
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const out=process.env.BOT_OUT_DIR||'runtime-bot-artifacts/skin';fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,...(process.env.BOT_CHROMIUM_EXECUTABLE?{executablePath:process.env.BOT_CHROMIUM_EXECUTABLE}:{}),args:['--no-sandbox']});
const reports=[];
try{for(const viewport of [{width:1280,height:800},{width:390,height:640},{width:844,height:390}]){
 const context=await browser.newContext({viewport,hasTouch:true}),page=await context.newPage(),errors=[];
 page.on('pageerror',error=>errors.push(String(error)));
 const buttons=['swap','sync','attack','boost','airdash','partner','use'].map(id=>`<button id="gb-${id}">${id.toUpperCase()}</button>`).join('');
 await page.setContent('<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><title>Good Dogs control fixture</title><style>'+fs.readFileSync('style.css','utf8')+'#good-dogs-touch{position:fixed;display:grid}#dpad{position:fixed;width:130px;height:130px;background:#102a39}body{background:#06101b}</style><div id="game-wrap"><canvas id="game"></canvas><div id="dpad"></div><div id="good-dogs-touch">'+buttons+'</div><div id="gb-ref-hud"><div id="gb-ref-map"></div></div></div>');
 await page.evaluate(()=>{
  window.NM={district:'goodboys_breach',x:180,y:396,hp:100,_v736:{m:3,active:'katrin',chars:{katrin:{hp:100,maxHp:100},manchez:{hp:0,maxHp:120}}}};
  window.S={nightMode:NM,meta:{_v736:{m:3}}};window.TechOpsGoodBoysHudLite={drawHud(){}};
  const b=document.getElementById('gb-use');b.dataset.context='1';b.textContent='USE · OVERRIDE';b.onclick=()=>window.used=(window.used||0)+1;
 });
 // Match browser load order: classic bindings exist before concern modules.
 await page.addScriptTag({content:'let S=window.S;let NM=window.NM;'});
 await page.addScriptTag({content:fs.readFileSync('good_boys_reference_ui_v1.js','utf8')});
 const metrics=await page.evaluate(()=>{
  TechOpsGoodBoysReferenceUI.sync(1000);
  const rect=id=>{const r=document.getElementById(id).getBoundingClientRect();return {left:r.left,top:r.top,right:r.right,bottom:r.bottom,width:r.width,height:r.height};};
  return {body:document.body.classList.contains('good-boys-reference-ui'),pad:rect('good-dogs-touch'),move:rect('dpad'),use:rect('gb-use'),label:document.getElementById('gb-use').textContent,alternate:getComputedStyle(document.getElementById('gb-ref-hud')).display,hp:TechOpsGoodBoysReferenceUI.hp('manchez')};
 });
 assert.equal(metrics.body,true);assert.equal(metrics.alternate,'none');assert.equal(metrics.label,'USE · OVERRIDE');assert.equal(metrics.hp[0],0);
 assert.ok(metrics.pad.left>=0&&metrics.pad.right<=viewport.width+1&&metrics.pad.top>=0&&metrics.pad.bottom<=viewport.height+1,JSON.stringify(metrics));
 assert.ok(metrics.move.right<metrics.pad.left,'movement and action pads must not overlap');
 assert.ok(metrics.use.height>=44,'context action must remain touchable');
 if(viewport.height<500)assert.ok(metrics.pad.height<=160,'landscape actions should not cover the playfield');
 await page.screenshot({path:path.join(out,'skin-'+viewport.width+'.png')});
 await page.getByRole('button',{name:'USE · OVERRIDE',exact:true}).tap();
 assert.equal(await page.evaluate(()=>window.used),1,'skin must not replace interaction');
 await page.evaluate(()=>{S={nightMode:null};TechOpsGoodBoysReferenceUI.sync(1001);});
 assert.equal(await page.evaluate(()=>document.body.classList.contains('good-boys-reference-ui')),false,'Day cleanup cannot wait for throttle');
 await page.evaluate(()=>{S=window.S;S.paused=true;TechOpsGoodBoysReferenceUI.sync(1002);});
 assert.equal(await page.evaluate(()=>getComputedStyle(document.getElementById('gb-ref-hud')).display),'none');
 assert.deepEqual(errors,[]);reports.push({viewport,pass:true,...metrics});await context.close();
 }}finally{await browser.close();fs.writeFileSync(path.join(out,'skin-browser.json'),JSON.stringify({reports,seeded:true,fullCampaign:false,physicalDevice:false},null,2));}
console.log(JSON.stringify({pass:true,skinFixtures:reports.length,fullCampaign:false,physicalDevice:false}));
