// Actual keyboard/pointer interactions from the existing completed-epilogue
// fixture. No mission records, positions, marks, consent or health injected.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {chromium} from 'playwright';
const base=process.env.LOW_QUARTER_BASE_URL||'http://127.0.0.1:4208/';
const output=process.env.ARCHIVE_ARTIFACTS||'artifacts/living-archive';fs.mkdirSync(output,{recursive:true});
const sourceFiles=['campaign_living_archive.js','campaign_low_quarter_mission.js','campaign_low_quarter_play.js','campaign_late_game_bootstrap.js','campaign_native_act1_visuals.js','campaign_story.js','index.html','scripts/living_archive_browser.mjs'];
const hashes=Object.fromEntries(sourceFiles.map(path=>[path,crypto.createHash('sha256').update(fs.readFileSync(path)).digest('hex')]));
const reports=[];
for(const touch of [false,true]){
 const name=touch?'touch':'desktop',browser=await chromium.launch({headless:true,executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE||undefined});
 try{
  const context=await browser.newContext({viewport:touch?{width:390,height:844}:{width:1280,height:800},isMobile:touch,hasTouch:touch,reducedMotion:touch?'reduce':'no-preference'}),page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await context.route('**/*',route=>route.request().url().startsWith(base)?route.continue():route.abort());
  await page.goto(base,{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>window.TechOpsProductionTitleExperience?.state().ready);
  await page.locator('#btn-start').click();await page.locator('#dlg-options button').filter({hasText:'Standard'}).click();await page.locator('#dlg-options button').filter({hasText:'Clock in'}).click();
  await page.waitForFunction(()=>window.TechOpsLateGameBootstrap?.ready()&&window.TechOpsLowQuarterPlay&&window.TechOpsLivingArchive);
  await page.evaluate(()=>{if(S.inDialog)closeDlg();const s=TechOpsCampaign.createInitialState();s.story={ending:'shutdown',facts:{campaign_complete:true}};s.lateGame={chapters:{ending:'shutdown'}};TechOpsCampaign.save(s,localStorage);TechOpsLowQuarterRuntime.install();TechOpsLowQuarterRuntime.open();});
  await page.clock.install();await page.getByRole('button',{name:'Enter Hold the Way Home',exact:true}).click();await page.clock.runFor(32);
  const snapshot=()=>page.evaluate(()=>TechOpsLowQuarterPlay.snapshot());
  const objects=()=>page.evaluate(()=>{const s=TechOpsCampaign.load(localStorage);s.lowQuarterMission=TechOpsLowQuarterPlay.snapshot();return TechOpsLowQuarterMission.objects(s);});
  async function run(ms){for(let left=ms;left>0;left-=250)await page.clock.fastForward(Math.min(250,left));assert.equal(await page.evaluate(()=>TechOpsLowQuarterPlay.error()),null);}
  async function held(key,ms){
   if(touch&&['ArrowLeft','ArrowRight','KeyE'].includes(key)){const b=await page.locator('[data-control="'+key+'"]').boundingBox();await page.mouse.move(b.x+b.width/2,b.y+b.height/2);await page.mouse.down();await run(ms);await page.mouse.up();}
   else{await page.keyboard.down(key);await run(ms);await page.keyboard.up(key);}
  }
  async function walk(x){for(let n=0;n<8;n++){const dx=x-(await snapshot()).player.x;if(Math.abs(dx)<12)return;await held(dx>0?'ArrowRight':'ArrowLeft',Math.max(100,Math.abs(dx)/110*1000));}throw Error('Walk did not reach '+x);}
  async function use(id){const o=(await objects()).find(v=>v.id===id);assert(o,'Available physical object '+id);await walk(o.x);
   const nearest=await page.evaluate(()=>{const s=TechOpsCampaign.load(localStorage);s.lowQuarterMission=TechOpsLowQuarterPlay.snapshot();return TechOpsLowQuarterMission.nearest(s)?.id;});assert.equal(nearest,id,'Actual nearest interaction');
   if(touch){const b=await page.locator('[data-control="KeyE"]').boundingBox();await page.mouse.move(b.x+b.width/2,b.y+b.height/2);await page.mouse.down();}else await page.keyboard.down('KeyE');
   let completed=false;try{for(let n=0;n<200;n++){await run(250);if((await snapshot()).dialog||!(await objects()).some(v=>v.id===id)){completed=true;break;}}}finally{if(touch)await page.mouse.up();else await page.keyboard.up('KeyE');}
   assert(completed,'Physical interaction completed '+id+' '+(await snapshot()).message);
  }
  async function wait(predicate){for(let n=0;n<1500;n++){if(predicate(await snapshot()))return;await run(1000);}throw Error('Mission condition timed out');}
  async function go(to){if((await snapshot()).player.sector===to)return;if(!(await objects()).some(o=>o.id==='exit_'+to))await go('services');await use('exit_'+to);await wait(s=>!s.travel);}
  for(let i=0;i<4;i++)await use('access_'+i);await use('threat');
  for(const sector of ['approaches','services','shelters','departure']){
   await go(sector);await walk(1100);for(const prefix of ['survey','warn','repair','staff','route'])await use(prefix+'_'+sector);
   if(sector==='services'){
    for(const [id,label] of [['lq_b_01','Offer attended transport'],['lq_b_02','Offer attended transport'],['lq_b_03','Respect refusal']]){await use(id);await page.getByRole('button',{name:label,exact:true}).click();}
    await use('mark_services');await use('records_services');assert((await page.locator('#lq-choice').innerText()).includes('Wait for local defenders'));
    await page.getByRole('button',{name:'Return to the street',exact:true}).click();
   }
  }
  await go('approaches');for(;;){const o=(await objects()).find(v=>v.id.startsWith('command_'));if(!o)break;await use(o.id);}
  await use('deploy');await wait(s=>s.units.length>=9&&s.units.every(u=>u.ready));await use('launch');
  const before=await snapshot();assert.equal(before.player.sector,'approaches');await run(16000);const after=await snapshot();
  assert.equal(after.player.sector,'approaches');assert.equal(after.residents.lq_b_02.status,'gate');assert.equal(after.residents.lq_b_02.followedMark,'mark_1');
  assert.equal(after.residents.lq_b_01.status,'home');assert.equal(after.residents.lq_b_03.status,'home');assert.equal(after.residents.lq_b_04.status,'home');
  assert.equal(await page.evaluate(()=>TechOpsLowQuarter.evaluate(TechOpsCampaign.load(localStorage)).safe.length),0);
  await page.getByRole('button',{name:'Read records',exact:true}).click();const reading=await page.locator('#lq-choice').innerText();assert(reading.includes('Wait for local defenders'),'copies do not acquire remote updates');
  const paused=await snapshot();await run(2500);assert.deepEqual(await snapshot(),paused,'records pause the mission simulation');
  const bounds=await page.locator('#lq-choice').boundingBox();assert(bounds.x>=0&&bounds.y>=0&&bounds.x+bounds.width<=page.viewportSize().width&&bounds.y+bounds.height<=page.viewportSize().height);
  await page.screenshot({path:output+'/'+name+'-records.png'});await page.getByRole('button',{name:'Return to the street',exact:true}).click();
  await go('services');await walk(1400);await page.screenshot({path:output+'/'+name+'-marks.png'});
  await use('records_services');assert((await page.locator('#lq-choice').innerText()).includes('Current local directions'));await page.keyboard.press('Escape');await run(32);assert.equal((await snapshot()).dialog,null);
  const archiveBefore=(await snapshot()).archive;
  await page.getByRole('button',{name:'Save & return',exact:true}).click();
  await page.reload({waitUntil:'domcontentloaded'});await page.waitForFunction(()=>window.TechOpsLateGameBootstrap?.ready()&&window.TechOpsProductionTitleExperience?.state().ready);
  if(await page.locator('#btn-continue').isVisible())await page.locator('#btn-continue').click();
  assert.deepEqual(await page.evaluate(()=>TechOpsCampaign.load(localStorage).lowQuarterMission.archive),archiveBefore);
  await page.evaluate(()=>TechOpsLowQuarterRuntime.open());await page.getByRole('button',{name:'Resume Hold the Way Home',exact:true}).click();await run(1000);
  assert.equal((await snapshot()).residents.lq_b_02.status,'gate');assert.deepEqual(errors,[]);
  const report={profile:name,viewport:page.viewportSize(),browser:browser.version(),sourceHashes:hashes,offSectorFollower:'lq_b_02',requiredAttendantWaited:'lq_b_01',refusalStayed:'lq_b_03',unknownConsentStayed:'lq_b_04',safeCount:0,reloadPreserved:true,recordBounds:bounds,pageErrors:errors,scope:'Actual keyboard/pointer controls after a completed-epilogue fixture; virtual browser clock. Touch uses mouse pointer on the actual touch controls; not physical iPhone, native multitouch or Safari.'};
  reports.push(report);fs.writeFileSync(output+'/'+name+'.json',JSON.stringify(report,null,2)+'\n');console.log('PASS Living Archive '+name);
 }catch(e){fs.writeFileSync(output+'/'+name+'-failure.txt',String(e.stack||e));throw e;}finally{await browser.close();}
}
for(const path of sourceFiles)assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path)).digest('hex'),hashes[path],'Source unchanged: '+path);
fs.writeFileSync(output+'/results.json',JSON.stringify(reports,null,2)+'\n');
