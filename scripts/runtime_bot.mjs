import fs from 'node:fs';
import path from 'node:path';
import { chromium, webkit, devices } from 'playwright';

const BASE = process.env.BOT_BASE_URL || 'http://127.0.0.1:4173/';
const OUT = process.env.BOT_OUT_DIR || 'runtime-bot-artifacts';
fs.mkdirSync(OUT, { recursive: true });
const transcript = [];
const findings = [];
const started = Date.now();
let shipAutomationError=null;

function repl(label, value) {
  const line = `[${new Date().toISOString()}] > ${label}${value === undefined ? '' : `\n${JSON.stringify(value, null, 2)}`}`;
  transcript.push(line); console.log(line);
}
function fail(mode, issue, detail = {}) { findings.push({severity:'FAIL',mode,issue,...detail}); repl(`FAIL ${mode}: ${issue}`,detail); }
function warn(mode, issue, detail = {}) { findings.push({severity:'WARN',mode,issue,...detail}); repl(`WARN ${mode}: ${issue}`,detail); }
function thirdPartyNoise(s='') { return /widget\.sndcdn\.com|w\.soundcloud\.com|soundcloud\.com/i.test(String(s)); }

async function snapshotRuntime(page) {
  return page.evaluate(() => {
    const text=id=>document.getElementById(id)?.textContent?.trim()||'';
    const vis=id=>{const e=document.getElementById(id);if(!e)return false;const s=getComputedStyle(e);return !e.classList.contains('hidden')&&s.display!=='none'&&s.visibility!=='hidden'&&Number(s.opacity||1)!==0;};
    const blockerIds=['good-dogs-cutscene-overlay','good-boys-ship-interlude','good-boys-story-cine','gb-prison-cine','good-boys-campaign-intro','good-boys-earthfall-cine','good-boys-mobile-recovery'];
    const blockerId=blockerIds.find(vis)||null;
    let runtime={};
    try { runtime=window.eval(`(function(){
      var s=(typeof S!=='undefined'&&S)?S:null,n=(typeof NM!=='undefined'&&NM)?NM:null,c=n&&n._v736,m=s&&s.meta&&s.meta._v736;
      var loop=n&&n._goodBoysLoop,k=(typeof keys!=='undefined'&&keys)?keys:{},a=window.TechOpsGoodBoysCampaignState,p=window.TechOpsGoodBoysProgressionAuthority;
      return {hasS:!!s,nightMode:!!(s&&s.nightMode),inDialog:!!(s&&s.inDialog),clock:s&&s.clock,char:s&&s.meta&&s.meta._char,hasNM:!!n,
        nm:n?{x:n.x,y:n.y,vx:n.vx,vy:n.vy,district:n.district,street:n.street,hp:n.hp,cam:n.cam}:null,
        keys:{arrowleft:!!k.arrowleft,arrowright:!!k.arrowright,a:!!k.a,d:!!k.d,w:!!k.w,arrowup:!!k.arrowup},
        pair:!!(c&&c.chars&&c.chars.katrin&&c.chars.manchez&&c.partner),activeDog:c&&c.active,mission:c&&c.m,metaMission:m&&m.m,stateMission:a&&a.mission?a.mission():null,
        missionInvariant:p&&p.acceptance?p.acceptance().invariant:null,
        referenceHud:!!(c&&c._referenceHud),referenceScale:n&&n._goodBoysReferenceScale||null,
        phase:n&&n._goodBoysPhase||null,stageAuthority:n&&n._goodBoysStageAuthority||null,loop:!!loop};
    })()`);} catch(e){runtime={evalError:String(e&&e.stack||e)};}
    let canvas={ok:false};
    try{const cv=document.getElementById('game'),ctx=cv&&cv.getContext('2d',{willReadFrequently:true});if(cv&&ctx&&cv.width&&cv.height){const sx=Math.max(0,Math.floor(cv.width*.1)),sy=Math.max(0,Math.floor(cv.height*.1)),sw=Math.max(1,Math.floor(cv.width*.8)),sh=Math.max(1,Math.floor(cv.height*.8)),d=ctx.getImageData(sx,sy,sw,sh).data;let nonBlack=0,alpha=0,min=255,max=0;for(let i=0;i<d.length;i+=16){const r=d[i],g=d[i+1],b=d[i+2],a=d[i+3];if(a>0)alpha++;if(r+g+b>24)nonBlack++;min=Math.min(min,r,g,b);max=Math.max(max,r,g,b);}canvas={ok:true,width:cv.width,height:cv.height,nonBlack,alpha,range:max-min};}}catch(e){canvas={ok:false,error:String(e)};}
    let wrapperHealth=null;
    try{wrapperHealth=window.TechOpsProductionWrapperGuard&&typeof window.TechOpsProductionWrapperGuard.health==='function'?window.TechOpsProductionWrapperGuard.health():null;}catch(e){wrapperHealth={error:String(e)};}
    const bodyText=document.body.innerText.slice(0,3500);
    const legacyCutscene=/E\s*\/\s*CLICK\s*[—-]\s*SKIP|CLICK\s*[—-]\s*SKIP|\bSKIP\s*[▶›]?/i.test(bodyText);
    return {url:location.href,title:document.title,buttons:Array.from(document.querySelectorAll('button')).filter(b=>getComputedStyle(b).display!=='none').map(b=>b.textContent.trim()).filter(Boolean),titleVisible:vis('title-screen'),hudVisible:vis('hud'),touchVisible:vis('touch-ui'),recoveryVisible:!!document.getElementById('good-boys-mobile-recovery'),toast:text('toast'),bodyText,runtime,canvas,cutsceneVisible:legacyCutscene||!!blockerId,authoredBlocker:!!blockerId,blockerId,shipInteraction:window.__goodBoysOpeningGameplay||null,openingPhase:window.__goodBoysOpeningPhase||null,mode:window.__productionActiveMode||window.__productionDesiredMode||null,routerError:window.__productionModeRouterError||null,safetyError:window.__techOpsLastRuntimeError||null,goodBoysError:window.__goodBoysCoreBroken||null,wrapperGuard:!!window.__techopsWrapperGuardInstalled,wrapperHealth,runtimeLock:!!window.__productionFeatureWrapperTimersStopped,runtimeLockError:window.__productionRuntimeLockError||null,lexicalBridge:window.__techopsLexicalBridgeVersion||0};
  });
}
async function clickByRegex(page,regex,timeout=2500){const buttons=page.locator('button'),n=await buttons.count();for(let i=0;i<n;i++){const b=buttons.nth(i);let txt='';try{txt=(await b.innerText()).trim();}catch{}if(regex.test(txt)){try{await b.click({timeout});return txt;}catch{}}}return null;}
async function domClick(page,selector){return page.locator(selector).evaluate(el=>{el.click();return true;}).catch(()=>false);}
async function moveShipTo(page,id){
  const result=await page.evaluate(async target=>{
    const right=document.querySelector('#good-boys-ship-interlude [data-move="right"]');
    const interact=document.querySelector('#good-boys-ship-interlude [data-interact]');
    if(!right||!interact)return {ok:false,error:'mobile controls missing'};
    const before=window.__goodBoysOpeningGameplay||{};const xStart=Number(before.x||0);const pointerId=61;
    const fire=(el,type,buttons)=>el.dispatchEvent(new PointerEvent(type,{bubbles:true,cancelable:true,pointerId,pointerType:'touch',isPrimary:true,buttons}));
    fire(right,'pointerdown',1);let moved=false,last=xStart;
    try{
      const deadline=performance.now()+5000;
      while(performance.now()<deadline){await new Promise(r=>setTimeout(r,40));const s=window.__goodBoysOpeningGameplay||{};last=Number(s.x||last);if(Math.abs(last-xStart)>=5)moved=true;if(s.near&&s.targetId===target)return {ok:true,moved,xStart,xEnd:last,target};}
      return {ok:false,moved,xStart,xEnd:last,target,error:moved?'target proximity not reached':'pointer hold produced no movement'};
    }finally{fire(right,'pointerup',0);}
  },id);
  repl('ship touch hold',result);if(!result.ok)throw new Error('ship touch hold failed: '+JSON.stringify(result));
  await page.waitForFunction(()=>{const b=document.querySelector('#good-boys-ship-interlude [data-interact]');return !!(b&&!b.disabled);},null,{timeout:1000});
  await page.evaluate(()=>{const b=document.querySelector('#good-boys-ship-interlude [data-interact]');if(!b||b.disabled)throw new Error('INTERACT unavailable');b.dispatchEvent(new PointerEvent('pointerup',{bubbles:true,cancelable:true,pointerId:62,pointerType:'touch',isPrimary:true,buttons:0}));});
  await page.waitForFunction(target=>{const s=window.__goodBoysOpeningGameplay;return !!(s&&Array.isArray(s.systems)&&s.systems.includes(target));},id,{timeout:2000});
}
async function completeShipInteraction(page){
  if(!await page.locator('#good-boys-ship-interlude').count())return false;
  for(const id of ['nav','flight','dock']){
    const already=await page.evaluate(target=>{const s=window.__goodBoysOpeningGameplay;return !!(s&&Array.isArray(s.systems)&&s.systems.includes(target));},id).catch(()=>false);if(already)continue;
    await moveShipTo(page,id);
  }
  return true;
}
async function settle(page,ms=5000){
  const until=Date.now()+ms;
  while(Date.now()<until){
    await page.waitForTimeout(150);
    if(await page.locator('#good-boys-ship-interlude').count()){try{await completeShipInteraction(page);shipAutomationError=null;}catch(e){shipAutomationError=String(e&&e.stack||e);return false;}await page.waitForTimeout(150);continue;}
    const film='#good-dogs-cutscene-overlay.active .gd-film-skip';if(await page.locator(film).count()){await domClick(page,film);await page.waitForTimeout(140);continue;}
    const authored=page.locator('#good-boys-story-cine button,#gb-prison-cine button,#good-boys-campaign-intro button,#good-boys-earthfall-cine button');
    if(await authored.count()){await authored.first().evaluate(el=>el.click()).catch(()=>{});await page.waitForTimeout(120);continue;}
    const txt=await page.locator('body').innerText().catch(()=>'');
    if(/SELECT SHIFT DIFFICULTY/i.test(txt)){await clickByRegex(page,/Standard/i,500).catch(()=>{});continue;}
    if(/BEGIN THE INCIDENT/i.test(txt)){await clickByRegex(page,/BEGIN THE INCIDENT/i,500).catch(()=>{});continue;}
    if(/E\s*\/\s*CLICK\s*[—-]\s*SKIP|CLICK\s*[—-]\s*SKIP/i.test(txt)){await page.keyboard.press('KeyE').catch(()=>{});await page.waitForTimeout(250);continue;}
    const s=await snapshotRuntime(page);if(!s.cutsceneVisible&&!s.runtime.inDialog)break;
  }
  return true;
}
async function exercise(page,mode,before,profileName){
  if(!before.runtime.hasNM)return null;
  if(before.cutsceneVisible||before.runtime.inDialog){await settle(page,5000);before=await snapshotRuntime(page);if(before.cutsceneVisible||before.runtime.inDialog){fail(mode,'authored blocker did not clear before gameplay probe',{profileName,blockerId:before.blockerId,inDialog:before.runtime.inDialog});return before;}}
  const x0=Number(before.runtime.nm?.x),steps0=Number(before.wrapperHealth?.stableStepCount||0),base0=Number(before.wrapperHealth?.baseStepCount||0);
  await page.keyboard.down('ArrowRight');await page.waitForTimeout(160);const held=await snapshotRuntime(page);repl(`${profileName} ${mode} key-held`,{lexicalKeys:held.runtime.keys,bridgeKeys:held.wrapperHealth?.nightKeys,keyEvents:held.wrapperHealth?.nightKeyEvents,keyWrites:held.wrapperHealth?.nightKeyWrites,x:held.runtime.nm?.x,vx:held.runtime.nm?.vx,stableSteps:Number(held.wrapperHealth?.stableStepCount||0)-steps0,baseSteps:Number(held.wrapperHealth?.baseStepCount||0)-base0});
  await page.waitForTimeout(690);await page.keyboard.up('ArrowRight');await page.waitForTimeout(250);const moved=await snapshotRuntime(page),x1=Number(moved.runtime.nm?.x);repl(`${profileName} ${mode} movement`,{x0,x1,delta:x1-x0,inDialog:moved.runtime.inDialog,lexicalKeys:moved.runtime.keys,bridge:moved.wrapperHealth&&{version:moved.wrapperHealth.nightKeyBridgeVersion,events:moved.wrapperHealth.nightKeyEvents,writes:moved.wrapperHealth.nightKeyWrites,lastKey:moved.wrapperHealth.lastKey,lastKeyDown:moved.wrapperHealth.lastKeyDown},stableSteps:Number(moved.wrapperHealth?.stableStepCount||0)-steps0,baseSteps:Number(moved.wrapperHealth?.baseStepCount||0)-base0});
  if(!Number.isFinite(x0)||!Number.isFinite(x1)||Math.abs(x1-x0)<2)fail(mode,'movement input did not move the player',{profileName,x0,x1,inDialog:moved.runtime.inDialog,cutsceneVisible:moved.cutsceneVisible,heldKeys:held.runtime.keys,bridgeHealth:held.wrapperHealth&&{nightKeyBridgeVersion:held.wrapperHealth.nightKeyBridgeVersion,nightKeyEvents:held.wrapperHealth.nightKeyEvents,nightKeyWrites:held.wrapperHealth.nightKeyWrites,nightKeys:held.wrapperHealth.nightKeys,stableStepCount:held.wrapperHealth.stableStepCount,baseStepCount:held.wrapperHealth.baseStepCount}});
  await page.keyboard.press('ArrowUp').catch(()=>{});await page.waitForTimeout(250);
  if(mode==='nightcrawler'){await page.keyboard.press('Shift').catch(()=>{});await page.keyboard.press('KeyE').catch(()=>{});}else{const dog0=moved.runtime.activeDog;await page.keyboard.press('KeyC').catch(()=>{});await page.waitForTimeout(250);const swapped=await snapshotRuntime(page);if(swapped.runtime.activeDog===dog0)warn(mode,'swap key did not change active dog',{profileName,activeDog:dog0});else repl(`${profileName} goodboys swap`,{from:dog0,to:swapped.runtime.activeDog});}
  return await snapshotRuntime(page);
}

async function runMode(browserType,profileName,contextOptions,mode){
  repl(`launch ${profileName} :: ${mode}`);shipAutomationError=null;
  const browser=await browserType.launch({headless:true}),context=await browser.newContext(contextOptions);await context.tracing.start({screenshots:true,snapshots:false,sources:false});const page=await context.newPage();
  const consoleErrors=[],pageErrors=[],requestFailures=[],badResponses=[];
  page.on('console',m=>{if(m.type()==='error')consoleErrors.push(m.text());});page.on('pageerror',e=>pageErrors.push(String(e&&e.stack||e)));page.on('requestfailed',r=>requestFailures.push({url:r.url(),error:r.failure()?.errorText||''}));page.on('response',r=>{if(r.status()>=400)badResponses.push({url:r.url(),status:r.status()});});
  try{
    await page.goto(BASE,{waitUntil:'domcontentloaded',timeout:30000});await page.waitForTimeout(1800);
    const clicked=mode==='nightcrawler'?await clickByRegex(page,/NIGHT\s*CRAWLER/i):await clickByRegex(page,/(118\/1984|BREAKOUT|GOOD\s*BOYS)/i);
    if(!clicked){const s=await snapshotRuntime(page);fail(mode,'launch button not found',{profileName,buttons:s.buttons});await page.screenshot({path:path.join(OUT,`${profileName}-${mode}-missing-button.png`),fullPage:true});return;}
    repl(`${profileName} clicked`,clicked);await settle(page,mode==='goodboys'?15000:7500);
    if(mode==='goodboys'&&await page.locator('#gb-mobile-retry').count()){warn(mode,'recovery surfaced; bot executing one retry',{profileName});await page.locator('#gb-mobile-retry').evaluate(el=>el.click()).catch(()=>{});await settle(page,7000);}
    const s1=await snapshotRuntime(page);await page.screenshot({path:path.join(OUT,`${profileName}-${mode}.png`),fullPage:true});repl(`${profileName} ${mode} state`,s1);
    if(mode==='goodboys'&&s1.blockerId==='good-boys-ship-interlude'){fail(mode,'ship opening did not complete',{profileName,shipAutomationError,opening:s1.shipInteraction});return;}
    const firstPartyPageErrors=pageErrors.filter(e=>!thirdPartyNoise(e)),thirdPartyPageErrors=pageErrors.filter(thirdPartyNoise);
    if(firstPartyPageErrors.length)fail(mode,'uncaught first-party page errors',{profileName,pageErrors:firstPartyPageErrors});if(thirdPartyPageErrors.length)warn(mode,'third-party media widget errors',{profileName,pageErrors:thirdPartyPageErrors});if(consoleErrors.length)warn(mode,'console errors',{profileName,consoleErrors:consoleErrors.slice(0,20)});if(requestFailures.length)warn(mode,'request failures',{profileName,requests:requestFailures.slice(0,15)});if(badResponses.length)warn(mode,'HTTP asset failures',{profileName,responses:badResponses.slice(0,15)});
    if(s1.safetyError)fail(mode,'runtime safety captured exception',{profileName,error:s1.safetyError});if(s1.canvas.ok&&(s1.canvas.nonBlack<20||s1.canvas.range<8))fail(mode,'canvas appears blank/stalled',{profileName,canvas:s1.canvas});if(!s1.canvas.ok)warn(mode,'canvas probe unavailable',{profileName,canvas:s1.canvas});if(!s1.wrapperGuard)warn(mode,'stable wrapper guard not confirmed',{profileName});
    if(s1.wrapperHealth&&(!s1.wrapperHealth.installed||!s1.wrapperHealth.globalDrawAligned||!s1.wrapperHealth.globalStepAligned))fail(mode,'stable compositor health check failed',{profileName,wrapperHealth:s1.wrapperHealth});if(s1.runtimeLockError)fail(mode,'production runtime lock reported an error',{profileName,error:s1.runtimeLockError});if(!s1.lexicalBridge)warn(mode,'lexical runtime bridge not confirmed',{profileName});if(s1.wrapperHealth&&s1.wrapperHealth.nightKeyBridgeError)fail(mode,'production Night key bridge reported an error',{profileName,error:s1.wrapperHealth.nightKeyBridgeError});
    if(mode==='nightcrawler'){
      if(!s1.runtime.nightMode||!s1.runtime.hasNM)fail(mode,'Night runtime did not attach',{profileName,runtime:s1.runtime,routerError:s1.routerError});if(s1.runtime.char!=='nightcrawler')fail(mode,'Night Crawler identity not active',{profileName,runtime:s1.runtime});if(s1.recoveryVisible)fail(mode,'unexpected Good Boys recovery on Night Crawler',{profileName});
    }else{
      if(s1.recoveryVisible||s1.goodBoysError)fail(mode,'Good Boys recovery remains active',{profileName,error:s1.goodBoysError});if(!s1.runtime.nightMode||!s1.runtime.hasNM)fail(mode,'Good Boys has no Night world',{profileName,runtime:s1.runtime,routerError:s1.routerError});if(!s1.runtime.pair)fail(mode,'Katrin/Manchez pair not attached',{profileName,runtime:s1.runtime});if(!['katrin','manchez'].includes(s1.runtime.activeDog))fail(mode,'active playable dog invalid',{profileName,runtime:s1.runtime});if(Number(s1.runtime.mission)!==Number(s1.runtime.metaMission)||Number(s1.runtime.mission)!==Number(s1.runtime.stateMission))fail(mode,'Good Boys mission authority diverged',{profileName,runtime:s1.runtime});if(s1.runtime.missionInvariant&&s1.runtime.missionInvariant.ok===false)fail(mode,'Good Boys post-handoff invariant failed',{profileName,invariant:s1.runtime.missionInvariant});if(Number(s1.runtime.mission)!==2)warn(mode,'Good Boys opening did not settle at expected M2',{profileName,mission:s1.runtime.mission});if(s1.routerError)warn(mode,'router retained error after pair attached',{profileName,error:s1.routerError});if(!s1.runtime.referenceHud&&!s1.runtime.phase&&!s1.runtime.stageAuthority)warn(mode,'Good Boys reference presentation markers absent',{profileName,runtime:s1.runtime});if(/NEW HAVEN STREETS|NIGHT CRAWL/i.test(s1.bodyText))warn(mode,'generic Night presentation leaks into Good Boys',{profileName,bodyText:s1.bodyText.slice(0,500)});
    }
    const exercised=await exercise(page,mode,s1,profileName);if(exercised){repl(`${profileName} ${mode} exercised state`,exercised);if(exercised.safetyError)fail(mode,'runtime errored during input exercise',{profileName,error:exercised.safetyError});if(!exercised.canvas.ok||(exercised.canvas.nonBlack<20||exercised.canvas.range<8))fail(mode,'canvas failed after gameplay input',{profileName,canvas:exercised.canvas});}
    await page.waitForTimeout(1600);const s2=await snapshotRuntime(page);repl(`${profileName} ${mode} liveness`,s2);if(s2.safetyError)fail(mode,'runtime errored during liveness window',{profileName,error:s2.safetyError});if(!s2.canvas.ok||(s2.canvas.nonBlack<20||s2.canvas.range<8))fail(mode,'canvas failed liveness window',{profileName,canvas:s2.canvas});
  }catch(e){fail(mode,'bot exception',{profileName,error:String(e&&e.stack||e)});await page.screenshot({path:path.join(OUT,`${profileName}-${mode}-exception.png`),fullPage:true}).catch(()=>{});}finally{await context.tracing.stop({path:path.join(OUT,`${profileName}-${mode}-trace.zip`)}).catch(()=>{});await browser.close();}
}

const profiles=[{name:'iphone-webkit',browser:webkit,options:{...devices['iPhone 15 Pro'],viewport:{width:393,height:852}}},{name:'desktop-chromium',browser:chromium,options:{viewport:{width:1440,height:900}}}];
for(const p of profiles)for(const mode of ['nightcrawler','goodboys'])await runMode(p.browser,p.name,p.options,mode);
const report={timestamp:new Date().toISOString(),baseUrl:BASE,durationMs:Date.now()-started,pass:!findings.some(f=>f.severity==='FAIL'),failures:findings.filter(f=>f.severity==='FAIL').length,warnings:findings.filter(f=>f.severity==='WARN').length,findings};
fs.writeFileSync(path.join(OUT,'report.json'),JSON.stringify(report,null,2));fs.writeFileSync(path.join(OUT,'repl.txt'),transcript.join('\n\n')+'\n');
const md=['# TechOps Hero Runtime Bot','',`- Result: **${report.pass?'PASS':'FAIL'}**`,`- Target: \`${BASE}\``,`- Failures: ${report.failures}`,`- Warnings: ${report.warnings}`,`- Duration: ${(report.durationMs/1000).toFixed(1)}s`,'','## Findings','',findings.length?findings.map((f,i)=>`${i+1}. **${f.severity} / ${f.mode}** — ${f.issue}\n\n   \`${JSON.stringify(f)}\``).join('\n'):'No findings.','','## REPL transcript','','See `repl.txt`, screenshots, and Playwright trace ZIPs in the workflow artifact.'].join('\n');
fs.writeFileSync(path.join(OUT,'report.md'),md);console.log('\n'+md);if(!report.pass)process.exitCode=1;
