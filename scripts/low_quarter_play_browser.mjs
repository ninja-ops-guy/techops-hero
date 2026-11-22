// Real game entry and physical mission inputs. Only the PRE-MISSION completed
// epilogue is seeded; no mission ledger, positions, health or receipts injected.
// Playwright's virtual clock accelerates time; this is not physical-device QA.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {chromium} from 'playwright';
const base=process.env.LOW_QUARTER_BASE_URL||'http://127.0.0.1:4208/';
const output=process.env.LOW_QUARTER_ARTIFACTS||'artifacts/low-quarter-play';fs.mkdirSync(output,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE||undefined});
const reports=[];
try{
 for(const [ending,touch] of [['shutdown',false],['control',false],['open_network',false],['shutdown',true]]){
  const name=ending+(touch?'-touch':'-desktop'),context=await browser.newContext({viewport:touch?{width:390,height:844}:{width:1280,height:800},hasTouch:touch,isMobile:touch,reducedMotion:'reduce'}),page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await context.route('**/*',r=>r.request().url().startsWith(base)?r.continue():r.abort());
  await page.goto(base,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.TechOpsProductionTitleExperience?.state().ready,null,{timeout:30000});
  await page.locator('#btn-start').click();await page.locator('#dlg-options button').filter({hasText:'Standard'}).click();await page.locator('#dlg-options button').filter({hasText:'Clock in'}).click();
  await page.waitForFunction(()=>window.TechOpsLateGameBootstrap?.ready()&&window.TechOpsLowQuarterPlay,null,{timeout:30000});
  await page.evaluate(ending=>{if(S.inDialog)closeDlg();const s=TechOpsCampaign.createInitialState();s.story={ending,facts:{campaign_complete:true}};s.lateGame={chapters:{ending}};TechOpsCampaign.save(s,localStorage);TechOpsLowQuarterRuntime.install();TechOpsLowQuarterRuntime.open();},ending);
  await page.getByRole('button',{name:'Enter Hold the Way Home',exact:true}).click();
  await page.clock.install();
  const snapshot=()=>page.evaluate(()=>TechOpsLowQuarterPlay.snapshot());
  const objects=()=>page.evaluate(()=>TechOpsLowQuarterMission.objects({...TechOpsCampaign.load(localStorage),lowQuarterMission:TechOpsLowQuarterPlay.snapshot()}));
  async function run(ms){await page.clock.runFor(ms);const error=await page.evaluate(()=>TechOpsLowQuarterPlay.error());assert.equal(error,null);}
  async function held(key,ms){if(touch&&['ArrowLeft','ArrowRight','KeyE'].includes(key)){const b=await page.locator('[data-control="'+key+'"]').boundingBox();await page.mouse.move(b.x+b.width/2,b.y+b.height/2);await page.mouse.down();await run(ms);await page.mouse.up();}else{await page.keyboard.down(key);await run(ms);await page.keyboard.up(key);}}
  async function walk(x){for(let n=0;n<8;n++){const s=await snapshot(),dx=x-s.player.x;if(Math.abs(dx)<12)return;await held(dx>0?'ArrowRight':'ArrowLeft',Math.max(100,Math.abs(dx)/110*1000));}throw Error('Walking did not reach '+x);}
  async function use(id){const o=(await objects()).find(v=>v.id===id);assert(o,'object exists '+id);await walk(o.x);
   const near=await page.evaluate(()=>TechOpsLowQuarterMission.nearest({...TechOpsCampaign.load(localStorage),lowQuarterMission:TechOpsLowQuarterPlay.snapshot()})?.id);assert.equal(near,id,'actual nearest interaction');
   await held('KeyE',(o.duration+.4)*1000);
  }
  async function wait(predicate,limit=1500){for(let n=0;n<limit;n++){if(predicate(await snapshot()))return;await run(1000);}throw Error('World observation timed out: '+(await snapshot()).message);}
  async function go(to){if((await snapshot()).player.sector===to)return;if(!(await objects()).some(o=>o.id==='exit_'+to))await go('services');await use('exit_'+to);await wait(s=>!s.travel);}
  for(let i=0;i<4;i++)await use('access_'+i);await use('threat');
  for(const sector of ['approaches','services','shelters','departure']){
   await go(sector);await walk(1100);for(const prefix of ['survey','warn','repair','staff','route'])await use(prefix+'_'+sector);
   const residents=(await objects()).filter(o=>o.action==='resident');for(const r of residents){await use(r.id);await page.getByRole('button',{name:'Offer supported shelter',exact:true}).click();}
  }
  await go('approaches');
  for(;;){const s=await snapshot(),o=(await objects()).find(o=>o.id.startsWith('command_'));if(!o)break;
   if(ending==='control'&&s.branch.step===4){await use('stop');await wait(s=>s.branch.crossing===1);}await use(o.id);
  }
  await use('deploy');await wait(s=>s.units.length>=9&&s.units.every(u=>u.ready));await use('launch');
  await page.keyboard.down('KeyJ');await page.keyboard.down('KeyK');await walk(350);await wait(s=>s.waves.arrival_1?.arrived!=null);await use('picket');
  await page.screenshot({path:output+'/'+name+'-first-assault.png'});
  // Real pause and reload before a fight is resolved. Save/return resumes the
  // same mission through its player-facing board entry, never a test fixture.
  await page.getByRole('button',{name:'Pause',exact:true}).click();const paused=await snapshot();await run(2000);assert.deepEqual(await snapshot(),paused);await page.getByRole('button',{name:'Resume',exact:true}).click();
  await page.getByRole('button',{name:'Save & return',exact:true}).click();const before=await page.evaluate(()=>TechOpsCampaign.load(localStorage).lowQuarterMission);
  await page.reload({waitUntil:'domcontentloaded'});await page.waitForFunction(()=>window.TechOpsLateGameBootstrap?.ready()&&window.TechOpsProductionTitleExperience?.state().ready,null,{timeout:30000});
  if(await page.locator('#btn-continue').isVisible())await page.locator('#btn-continue').click();
  await page.evaluate(()=>TechOpsLowQuarterRuntime.open());await page.getByRole('button',{name:'Resume Hold the Way Home',exact:true}).click();assert.deepEqual(await snapshot(),before);await page.keyboard.down('KeyJ');await page.keyboard.down('KeyK');
  for(const [i,sector] of ['approaches','services','shelters','departure'].entries()){
   await go(sector);await wait(s=>s.waves['arrival_'+(i+1)]?.arrived!=null);await walk(100);await run(45000);
   for(let n=0;n<30&&!(await snapshot()).waves['arrival_'+(i+1)].sealed;n++){await use('ramp_'+sector);await run(1000);}
   await wait(s=>s.waves['arrival_'+(i+1)].resolved);if(!(await snapshot()).services[sector])await use('repair_'+sector);await walk(1100);await use('sweep_'+sector);
  }
  await go('approaches');await wait(s=>s.clock>=1082);for(const sector of ['approaches','services','shelters','departure'])if(!(await snapshot()).services[sector]){await go(sector);await use('repair_'+sector);}await go('approaches');await use('account');await use('closeout');await page.getByRole('button',{name:'Confirm permanent closeout',exact:true}).click();
  const result=await page.evaluate(()=>{const s=TechOpsCampaign.load(localStorage);return {outcome:s.lowQuarter.result.outcome,safe:s.lowQuarter.result.safe.length,ending:s.story.ending,phase:s.lowQuarter.phase,picket:s.lowQuarterMission.picket,arrivals:TechOpsChorusSiege.status(s).resolvedWaves.length};});
  assert.deepEqual(result,{outcome:'district_saved',safe:48,ending,phase:'closed',picket:'safe',arrivals:4});assert.deepEqual(errors,[]);
  await page.screenshot({path:output+'/'+name+'-aftermath.png'});reports.push({name,result,errors,qualification:'Completed-epilogue fixture only; full mission uses keyboard and dialogue controls with virtual time. Touch layout is emulation, not physical iPhone.'});
  fs.writeFileSync(output+'/playthroughs.json',JSON.stringify(reports,null,2)+'\n');await context.close();console.log(name+': playable mission, four sectors, all 48 shelter handoffs, four physical arrivals, pause/reload and closeout PASS');
 }
}finally{await browser.close();}
