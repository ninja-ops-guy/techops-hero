// Real-page fixture acceptance only; not traversal of an authored live district.
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {chromium} from 'playwright';
const require=createRequire(import.meta.url);
const {definition,arrived,complete,ordered}=require('../test_campaign_chorus_siege.js');
const base=process.env.LOW_QUARTER_BASE_URL||'http://127.0.0.1:4208/';
const browser=await chromium.launch({headless:true,executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE||undefined});
try{
 for(const [name,width,height,touch] of [['desktop',1280,800,false],['touch',390,844,true]]){
  const context=await browser.newContext({viewport:{width,height},hasTouch:touch,isMobile:touch,reducedMotion:'reduce'});
  await context.route('**/*',r=>r.request().url().startsWith(base)?r.continue():r.abort());
  const page=await context.newPage();await page.goto(base,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.TechOpsProductionTitleExperience?.state().ready,null,{timeout:30000});
  await page.locator('#btn-start').click();await page.locator('#dlg-options button').filter({hasText:'Standard'}).click();
  await page.locator('#dlg-options button').filter({hasText:'Clock in'}).click();
  const waitForSiegeRuntime=()=>page.waitForFunction(()=>window.TechOpsCampaign&&window.TechOpsChorusSiege&&window.TechOpsLowQuarterRuntime&&window.TechOpsLateGameBootstrap?.ready(),null,{timeout:30000});
  await waitForSiegeRuntime();
  async function fixture(state){await page.evaluate(({definition,state})=>{
   if(S.inDialog)closeDlg();TechOpsChorusSiege.registerScenario(definition);
   TechOpsCampaign.save(state,localStorage);TechOpsLowQuarterRuntime.install();TechOpsLowQuarterRuntime.open();
  },{definition,state});}
  for(const ending of ['shutdown','control','open_network']){
   await fixture(complete(arrived(ending)));
   let text=await page.locator('#dlg-text').innerText();assert.match(text,/district saved/i);assert.match(text,/Phase: complete/);
   await page.getByRole('button',{name:'Review irreversible closeout',exact:true}).click();
   await page.getByRole('button',{name:'Confirm permanent closeout',exact:true}).click();
   assert.equal(await page.evaluate(()=>TechOpsCampaign.load(localStorage).lowQuarter.phase),'closed');
  }
  await fixture(ordered());let text=await page.locator('#dlg-text').innerText();assert.match(text,/Phase: adaptation/);assert.match(text,/Observed adaptive orders: 1/);assert.doesNotMatch(text,/district saved/);
  // The sequential bootstrap publishes the authority before the board runtime.
  // Hold the latter response to exercise the exact ordering that exposed the
  // hosted reload race, then await the complete runtime instead of one global.
  let releaseRuntime;
  const runtimeGate=new Promise(resolve=>{releaseRuntime=resolve;});
  const runtimePattern='**/campaign_low_quarter_runtime.js*';
  const delayedRuntime=async route=>{await runtimeGate;await route.continue();};
  await page.route(runtimePattern,delayedRuntime);
  try{
   await page.reload({waitUntil:'domcontentloaded'});
   await page.waitForFunction(()=>window.TechOpsChorusSiege,null,{timeout:30000});
   assert.equal(await page.evaluate(()=>typeof window.TechOpsLowQuarterRuntime),'undefined','Authority readiness must not imply board readiness');
   releaseRuntime();
   await waitForSiegeRuntime();
   // Definitions are build content, not serialized from the save. Missing content
   // blocks the operation and preserves its bytes until this test registers it.
   assert.equal(await page.evaluate(()=>TechOpsLowQuarterRuntime.snapshot().phase),'blocked');
   await page.evaluate(definition=>TechOpsChorusSiege.registerScenario(definition),definition);
   assert.equal(await page.evaluate(()=>TechOpsChorusSiege.status(TechOpsCampaign.load(localStorage)).phase),'adaptation');
   assert.equal(await page.evaluate(()=>Object.keys(TechOpsChorusSiege.status(TechOpsCampaign.load(localStorage)).orders).length),1);
  }finally{releaseRuntime();await page.unroute(runtimePattern,delayedRuntime);}
  await context.close();console.log(name+': siege fixture board, all endings, closeout, missing revision and reload PASS');
 }
}finally{await browser.close();}
