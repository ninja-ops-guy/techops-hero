/* Actual keyboard/pointer entry and exit, with accelerated browser time.
 * Only the opening page's existing ending selection seeds campaign context. */
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const base=process.env.LOW_QUARTER_BASE_URL||'http://127.0.0.1:4208/';
const out=process.env.CYLINDER_ARTIFACT_DIR||'artifacts/cylinder';fs.mkdirSync(out,{recursive:true});
const profiles=[['shutdown',1280,900],['control',1280,900],['open_network',1280,900],['shutdown',390,844],['shutdown',320,740],['shutdown',844,390]].filter(p=>!process.env.CYLINDER_PROFILE_WIDTH||p[1]===Number(process.env.CYLINDER_PROFILE_WIDTH));
(async()=>{const browser=await chromium.launch({headless:true,...(process.env.PLAYWRIGHT_EXECUTABLE?{executablePath:process.env.PLAYWRIGHT_EXECUTABLE}:{})});const results=[];
try{for(const [ending,width,height] of profiles){
 const context=await browser.newContext({viewport:{width,height},hasTouch:width!==1280,reducedMotion:width===320?'reduce':'no-preference'}),page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));await page.clock.install();await page.goto(new URL('low-quarter-review.html',base).href);
 await page.evaluate(()=>localStorage.setItem('techops_hero_campaign_v1_2','ordinary-save-sentinel'));
 await page.selectOption('#ending',ending);await page.click('#launch');
 await page.click('[data-route="services"]');await page.clock.runFor(20500);
 assert.equal(await page.evaluate(()=>TechOpsLowQuarterOperationRuntime.snapshot().lowQuarterOperation.room),'services');
 if(width===1280){await page.keyboard.down('KeyD');await page.clock.runFor(3375);await page.keyboard.up('KeyD');}
 else{const b=await page.locator('[data-hold="right"]').boundingBox();await page.mouse.move(b.x+b.width/2,b.y+b.height/2);await page.mouse.down();await page.clock.runFor(3375);await page.mouse.up();}
 assert(await page.evaluate(()=>TechOpsLowQuarterSafehouse.canEnter(TechOpsLowQuarterOperationRuntime.snapshot())));
 await page.clock.runFor(150);
 if(width===1280){await page.locator('#world').focus();await page.keyboard.press('KeyE');}else await page.click('[data-interaction="cylinder"]');
 assert(await page.locator('#cylinder').isVisible());assert(await page.evaluate(()=>TechOpsLowQuarterOperationRuntime.paused()));
 const before=await page.evaluate(()=>TechOpsLowQuarterOperationRuntime.snapshot());
 await page.keyboard.down('KeyD');await page.keyboard.press('KeyJ');await page.clock.runFor(15000);await page.keyboard.up('KeyD');
 assert.deepEqual(await page.evaluate(()=>TechOpsLowQuarterOperationRuntime.snapshot()),before,'Shop pauses every simulation field and receipt');
 await page.click('#cylinder-talk');assert((await page.locator('#cylinder-dialogue').textContent()).includes('Dr Mortise'));
 await page.click('#cylinder-stock');assert((await page.locator('#cylinder-dialogue').textContent()).includes('Cylinders, hinges'));
 await page.click('#cylinder-door');assert((await page.locator('#cylinder-dialogue').textContent()).includes('closer overhead'));
 for(let i=0;i<6;i++){await page.keyboard.press('Tab');assert(await page.evaluate(()=>!!document.activeElement.closest('#cylinder')),'Modal retains keyboard focus');}
 assert(await page.evaluate(()=>document.querySelector('#cylinder').scrollWidth<=document.querySelector('#cylinder').clientWidth),'No horizontal modal overflow');
 const door=await page.locator('#cylinder-exit').boundingBox();assert(door.width>=44&&door.height>=44,'Exit is a usable touch target');
 if(height<520){const room=await page.locator('.cylinder-room').boundingBox();assert(room.y>=0&&room.y+room.height<=height,'Whole room and exit fit short landscape without scrolling');}
 await page.locator('#cylinder-talk').focus();await page.locator('#cylinder').evaluate(el=>el.scrollTop=0);
 await page.screenshot({path:path.join(out,ending+'-'+width+'.png'),fullPage:true});
 if(width===1280)await page.keyboard.press('Escape');else await page.click('#cylinder-exit');
 assert(!await page.locator('#cylinder').isVisible());await page.clock.runFor(1000);
 const after=await page.evaluate(()=>TechOpsLowQuarterOperationRuntime.snapshot());assert.equal(after.lowQuarterOperation.room,before.lowQuarterOperation.room);assert.equal(after.lowQuarterOperation.x,before.lowQuarterOperation.x,'No held-key leakage');assert(after.lowQuarterOperation.tick>before.lowQuarterOperation.tick,'Exit resumes siege');assert.deepEqual(after.lowQuarter.events,before.lowQuarter.events);
 // Save is committed before entry; reload returns to the same street, not an orphaned room.
 await page.click('[data-interaction="cylinder"]');await page.reload();await page.click('#resume');
 assert(!await page.locator('#cylinder').count());const resumed=await page.evaluate(()=>TechOpsLowQuarterOperationRuntime.snapshot());assert.equal(resumed.lowQuarterOperation.x,before.lowQuarterOperation.x);assert.equal(resumed.lowQuarterOperation.room,'services');
 assert.equal(await page.evaluate(()=>localStorage.getItem('techops_hero_campaign_v1_2')),'ordinary-save-sentinel');
 // Failed checkpoint writes must prevent entry and retain the committed operation.
 await page.evaluate(()=>{Storage.prototype.setItem=function(){throw Error('Storage unavailable for test');};});
 await page.click('[data-interaction="cylinder"]');assert(!await page.locator('#cylinder').count());assert(await page.evaluate(()=>TechOpsLowQuarterOperationRuntime.paused()));assert((await page.locator('#save-error').textContent()).includes('Storage unavailable'));
 assert.deepEqual(errors,[]);results.push({ending,width,height,passed:true,scope:'Opening setup plus real controls with virtual time; not physical device acceptance'});await context.close();console.log('PASS Cylinder '+ending+' '+width+'x'+height);
}fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(results,null,2));}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
