/* Isolated browser acceptance for the real Day dialog renderer, case tracking,
 * and next-shift callbacks. In-memory storage and seeded Tuesday state are
 * explicit fixtures; this is not full New Run -> Tuesday acceptance. */
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const out=process.env.BOT_OUT_DIR||'runtime-bot-artifacts/task-focus';fs.mkdirSync(out,{recursive:true});
const game=fs.readFileSync('game.js','utf8');
const dialogSource=game.slice(game.indexOf('function dlg(name,'),game.indexOf('function ambientTalk('));
const browser=await chromium.launch({headless:true,...(process.env.BOT_CHROMIUM_EXECUTABLE?{executablePath:process.env.BOT_CHROMIUM_EXECUTABLE}:{}),args:['--no-sandbox']});
const reports=[];
try{for(const viewport of [{width:1280,height:800},{width:390,height:640},{width:844,height:390}]){
 const context=await browser.newContext({viewport,hasTouch:viewport.width<900}),page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(String(e)));
 await page.setContent('<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><title>Day dialog fixture</title><style>'+fs.readFileSync('style.css','utf8')+'</style><div id="game-wrap"><canvas id="game"></canvas><div id="dialogue" class="hidden"><div id="dlg-name"></div><div id="dlg-text"></div><div id="dlg-options"></div></div></div>');
 await page.evaluate(()=>{
  const data=new Map();Object.defineProperty(window,'localStorage',{value:{getItem:k=>data.get(k)||null,setItem:(k,v)=>data.set(k,String(v))}});
  window.$=id=>document.getElementById(id);window.flushPromo=()=>{};window.toast=()=>{};
  window.S={day:1,clock:540,px:4,py:4,meta:{},npcs:[],map:Array.from({length:43},()=>Array(45).fill(0)),nightMode:false,inDialog:false,inBattle:false};
 });
 await page.addScriptTag({content:dialogSource});
 for(const file of ['campaign_act1.js','campaign_native_act1.js','campaign_act1_investigations.js'])await page.addScriptTag({content:fs.readFileSync(file,'utf8')});
 await page.evaluate(()=>{
  const c=TechOpsCampaign,s=c.createInitialState();c.assignTicket(s,'shipping_cannot_print','mike');c.assignTicket(s,'plating_workstation_down','amit');c.assignTicket(s,'impossible_access_event','security');c.completeStandup(s);c.completeWorkstation(s,{feliciaVideoSkipped:true});c.save(s,localStorage);TechOpsCampaignNativeAct1.ensureWorld();TechOpsCampaignNativeAct1.openTicketRecord('shipping_cannot_print');
 });
 await page.waitForTimeout(200);
 const before=await page.evaluate(()=>{const e=document.getElementById('dialogue'),r=e.getBoundingClientRect();return {top:r.top,bottom:r.bottom,width:r.width,innerHeight,scrollHeight:e.scrollHeight,clientHeight:e.clientHeight};});
 await page.screenshot({path:path.join(out,`casebook-${viewport.width}.png`)});
 assert.ok(before.top>=0&&before.bottom<=viewport.height+1,'Casebook must stay inside viewport: '+JSON.stringify(before));
 await page.getByRole('button',{name:'Track this case on the Day map',exact:true}).click();
 assert.equal(await page.evaluate(()=>TechOpsCampaignNativeAct1.worldObjective().ticketId),'shipping_cannot_print');
 await page.evaluate(()=>{
  const c=TechOpsCampaign,s=c.load(localStorage);c.resolveTicket(s,'shipping_cannot_print',{technicalResolution:true,verification:'partial',humanOutcome:'degraded'});
  c.recordGhostEvidence(s,{id:'badge_impossible_access',perspective:'delegated_partial',discoveredBy:'security'});c.enterSector04(s);c.insightAccessGuard(s);c.severAccessController(s);c.transitionToTuesday(s);c.save(s,localStorage);S.day=2;TechOpsCampaignNativeAct1.ensureWorld();TechOpsCampaignNativeAct1.openWorkdayFollowup('shipping_cannot_print');
 });
 const click=async(name)=>page.getByRole('button',{name,exact:true}).click();
 for(const label of ['Ask the next-shift requester','Continue follow-up','Trace the next-shift label job','Continue follow-up','Next-shift queue authorization gap','Apply the supported remediation','Run the technical recheck'])await click(label);
 await page.screenshot({path:path.join(out,`followup-${viewport.width}.png`)});
 await click('Requester performs and confirms the task');
 await click('Return to work');
 const end=await page.evaluate(()=>{const s=TechOpsCampaign.load(localStorage);return {historical:s.tickets.shipping_cannot_print.humanOutcome,nextShift:TechOpsCampaign.workdayHandoff(s).find(r=>r.ticketId==='shipping_cannot_print').phase,objective:TechOpsCampaignNativeAct1.worldObjective(),dialog:S.inDialog};});
 assert.equal(end.historical,'degraded');assert.equal(end.nextShift,'complete');assert.equal(end.objective,null);assert.equal(end.dialog,false);assert.deepEqual(errors,[]);
 reports.push({pass:true,viewport,casebook:before,result:end,fixture:true});await context.close();
}}finally{await browser.close();fs.writeFileSync(path.join(out,'task-focus-browser.json'),JSON.stringify(reports,null,2));}
console.log(JSON.stringify({pass:reports.length===3,dialogFixtures:reports.length,fullCampaign:false,physicalDevice:false}));
