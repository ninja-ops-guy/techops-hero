import fs from 'node:fs';
import path from 'node:path';
import { chromium, webkit, devices } from 'playwright';

const BASE=process.env.BOT_BASE_URL||'http://127.0.0.1:4173/';
const OUT=process.env.BOT_OUT_DIR||'runtime-bot-artifacts';
const CONTRACT_VERSION=13;
fs.mkdirSync(OUT,{recursive:true});

const transcript=[];
const findings=[];
const started=Date.now();

function repl(label,value){
  const line=`[${new Date().toISOString()}] > ${label}${value===undefined?'':`\n${JSON.stringify(value,null,2)}`}`;
  transcript.push(line);
  console.log(line);
}
function fail(mode,issue,detail={}){findings.push({severity:'FAIL',mode,issue,...detail});repl(`FAIL ${mode}: ${issue}`,detail);}
function warn(mode,issue,detail={}){findings.push({severity:'WARN',mode,issue,...detail});repl(`WARN ${mode}: ${issue}`,detail);}
function thirdPartyNoise(s=''){return /widget\.sndcdn\.com|w\.soundcloud\.com|soundcloud\.com/i.test(String(s));}

async function clickByRegex(page,regex){
  const buttons=page.locator('button'),n=await buttons.count();
  for(let i=0;i<n;i++){
    const b=buttons.nth(i);let text='';
    try{text=(await b.innerText()).trim();}catch{}
    if(regex.test(text)){
      try{await b.evaluate(el=>{el.click();return true;});return text;}catch{}
    }
  }
  return null;
}

async function domClick(page,selector){
  return page.evaluate(sel=>{const el=document.querySelector(sel);if(!el)return false;el.click();return true;},selector).catch(()=>false);
}

async function canvasSignal(page,selector){
  return page.evaluate(sel=>{
    const c=document.querySelector(sel);if(!c)return null;
    const ctx=c.getContext&&c.getContext('2d',{willReadFrequently:true});
    if(!ctx||!c.width||!c.height)return null;
    const sx=Math.max(0,Math.floor(c.width*.1)),sy=Math.max(0,Math.floor(c.height*.1));
    const sw=Math.max(1,Math.floor(c.width*.8)),sh=Math.max(1,Math.floor(c.height*.8));
    const d=ctx.getImageData(sx,sy,sw,sh).data;
    let nonBlack=0,alpha=0,min=255,max=0;
    for(let i=0;i<d.length;i+=16){
      const r=d[i],g=d[i+1],b=d[i+2],a=d[i+3];
      if(a>0)alpha++;
      if(r+g+b>24)nonBlack++;
      min=Math.min(min,r,g,b);max=Math.max(max,r,g,b);
    }
    return{ok:true,width:c.width,height:c.height,nonBlack,alpha,range:max-min};
  },selector).catch(e=>({ok:false,error:String(e)}));
}

async function waitForRenderReady(page,canvasSelector,{timeout=5000,minNonBlack=50,minRange=8}={}){
  await page.waitForFunction(({sel,minNonBlack,minRange})=>{
    const c=document.querySelector(sel);
    if(!c||!c.width||!c.height)return false;
    return new Promise(resolve=>{
      requestAnimationFrame(()=>requestAnimationFrame(()=>{
        try{
          const ctx=c.getContext('2d',{willReadFrequently:true});if(!ctx){resolve(false);return;}
          const w=Math.min(c.width,160),h=Math.min(c.height,160),d=ctx.getImageData(0,0,w,h).data;
          let nonBlack=0,min=255,max=0;
          for(let i=0;i<d.length;i+=16){
            const r=d[i],g=d[i+1],b=d[i+2];
            if(r+g+b>24)nonBlack++;
            min=Math.min(min,r,g,b);max=Math.max(max,r,g,b);
          }
          resolve(nonBlack>=minNonBlack&&(max-min)>=minRange);
        }catch(_){resolve(false);}
      }));
    });
  },{sel:canvasSelector,minNonBlack,minRange},{timeout,polling:100});
}

async function waitForInputReady(page,{timeout=10000}={}){
  const until=Date.now()+timeout;
  while(Date.now()<until){
    let acted=false;
    for(const sel of ['#gb-prison-cine button','#good-boys-story-cine button','#good-boys-earthfall-cine button','#dialogue:not(.hidden) #dlg-options button']){
      const b=page.locator(sel).first();
      if(await b.count()&&await b.isVisible().catch(()=>false)){
        await b.evaluate(el=>el.click()).catch(()=>{});
        acted=true;
        break;
      }
    }
    if(acted){await page.waitForTimeout(120);continue;}
    const ready=await page.evaluate(()=>{
      const s=window.S;
      if(s&&s.inDialog)return false;
      if(document.querySelector('#good-dogs-cutscene-overlay.active'))return false;
      for(const id of ['gb-prison-cine','good-boys-story-cine','good-boys-earthfall-cine']){
        const e=document.getElementById(id);if(!e)continue;const cs=getComputedStyle(e);
        if(!e.classList.contains('hidden')&&cs.display!=='none'&&cs.visibility!=='hidden'&&Number(cs.opacity||1)!==0)return false;
      }
      const d=document.getElementById('dialogue');
      if(d){const cs=getComputedStyle(d);if(!d.classList.contains('hidden')&&cs.display!=='none'&&cs.visibility!=='hidden'&&Number(cs.opacity||1)!==0)return false;}
      const box=document.getElementById('good-dogs-touch');
      if(box){
        const cs=getComputedStyle(box);
        const visible=cs.display!=='none'&&cs.visibility!=='hidden'&&Number(cs.opacity||1)!==0;
        if(visible){for(const b of box.querySelectorAll('button')){const r=b.getBoundingClientRect();if(r.width===0||r.height===0)return false;}}
      }
      return true;
    }).catch(()=>false);
    if(ready)return true;
    await page.waitForTimeout(150);
  }
  throw new Error('input readiness timeout: dialogue/cinematic/control ownership did not clear');
}

async function snapshot(page){
  const base=await page.evaluate(()=>{
    const vis=id=>{const e=document.getElementById(id);if(!e)return false;const s=getComputedStyle(e);return s.display!=='none'&&s.visibility!=='hidden'&&Number(s.opacity||1)!==0&&!e.classList.contains('hidden');};
    const openingIds=['good-boys-deck-supplied','good-dogs-cutscene-overlay','good-boys-ship-flight','good-boys-crash-canonical','good-boys-opening-error'];
    const activeOpening=openingIds.find(vis)||null;
    let runtime={};
    try{
      const s=typeof S!=='undefined'?S:null,n=typeof NM!=='undefined'?NM:null,c=n&&n._v736,m=s&&s.meta&&s.meta._v736;
      const a=window.TechOpsGoodBoysCampaignState,p=window.TechOpsGoodBoysProgressionAuthority,k=typeof keys!=='undefined'?keys:{};
      runtime={
        hasS:!!s,nightMode:!!(s&&s.nightMode),inDialog:!!(s&&s.inDialog),char:s&&s.meta&&s.meta._char,
        hasNM:!!n,nm:n?{x:n.x,y:n.y,vx:n.vx,vy:n.vy,hp:n.hp,district:n.district,street:n.street}:null,
        keys:{arrowleft:!!k.arrowleft,arrowright:!!k.arrowright,a:!!k.a,d:!!k.d,w:!!k.w,arrowup:!!k.arrowup},
        pair:!!(c&&c.chars&&c.chars.katrin&&c.chars.manchez&&c.partner),activeDog:c&&c.active,
        mission:c&&c.m,metaMission:m&&m.m,stateMission:a&&a.mission?a.mission():null,
        missionInvariant:p&&p.acceptance?p.acceptance().invariant:null,
        referenceHud:!!(c&&c._referenceHud),phase:n&&n._goodBoysPhase||null,stageAuthority:n&&n._goodBoysStageAuthority||null
      };
    }catch(e){runtime={evalError:String(e&&e.stack||e)};}
    let wrapperHealth=null;
    try{wrapperHealth=window.TechOpsProductionWrapperGuard&&typeof window.TechOpsProductionWrapperGuard.health==='function'?window.TechOpsProductionWrapperGuard.health():null;}catch(e){wrapperHealth={error:String(e)};}
    const box=document.getElementById('good-dogs-touch'),buttons=box?Array.from(box.querySelectorAll('button')):[];
    const rects=buttons.map(b=>{const r=b.getBoundingClientRect(),s=getComputedStyle(b);return{id:b.id,x:r.x,y:r.y,w:r.width,h:r.height,display:s.display};});
    let overlaps=false;
    for(let i=0;i<rects.length;i++)for(let j=i+1;j<rects.length;j++){
      const a=rects[i],b=rects[j];if(a.w&&a.h&&b.w&&b.h&&a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y)overlaps=true;
    }
    return{
      title:document.title,url:location.href,activeOpening,
      openingPhase:window.__goodBoysOpeningPhase||null,
      deck:window.__goodBoysDeckAssetState||null,deckInteract:window.__goodBoysDeckInteract||null,
      cutsceneExit:window.__goodDogsCutsceneExit||null,cutsceneGesture:window.__goodDogsCutsceneNeedsGesture||null,
      flight:window.__goodBoysShipFlightState||null,crash:window.__goodBoysCrashScene||null,
      hard:window.__goodBoysHardButtonLaunch||null,openingError:window.__goodBoysOpeningErrorDetail||null,
      runtime,wrapperHealth,
      safetyError:window.__techOpsLastRuntimeError||null,routerError:window.__productionModeRouterError||null,
      wrapperGuard:!!window.__techopsWrapperGuardInstalled,lexicalBridge:window.__techopsLexicalBridgeVersion||0,
      controls:{bodyClass:document.body.classList.contains('good-boys-controls'),visible:!!(box&&vis('good-dogs-touch')),count:buttons.length,overlaps,rects},
      bodyText:document.body.innerText.slice(0,3500)
    };
  });
  base.canvas=await canvasSignal(page,'#game');
  if(base.activeOpening==='good-boys-deck-supplied')base.presentation=await canvasSignal(page,'#good-boys-deck-supplied canvas');
  else if(base.activeOpening==='good-boys-ship-flight')base.presentation=await canvasSignal(page,'#good-boys-ship-flight canvas');
  else if(base.activeOpening==='good-boys-crash-canonical'){
    base.presentation=await page.evaluate(()=>{
      const v=document.querySelector('#good-boys-crash-canonical video'),i=document.querySelector('#good-boys-crash-canonical img');
      if(v)return{ok:Number(v.readyState||0)>=2,kind:'video',readyState:Number(v.readyState||0),currentTime:Number(v.currentTime||0),paused:v.paused,ended:v.ended,src:v.currentSrc||v.getAttribute('src')||''};
      if(i)return{ok:!!(i.complete&&i.naturalWidth),kind:'plate',naturalWidth:i.naturalWidth||0,src:i.currentSrc||i.getAttribute('src')||''};
      return{ok:false,kind:'crash-loading'};
    }).catch(()=>({ok:false}));
  }else base.presentation=null;
  return base;
}

async function drivePilot(page,mode,profileName){
  await page.waitForSelector('#good-boys-deck-supplied',{state:'visible',timeout:12000});
  await page.waitForFunction(()=>window.__goodBoysDeckInteract&&window.__goodBoysDeckInteract.pilotAssetReady===true,null,{timeout:8000});
  await waitForRenderReady(page,'#good-boys-deck-supplied canvas',{timeout:6000,minNonBlack:100,minRange:8});
  const deckCanvas=await canvasSignal(page,'#good-boys-deck-supplied canvas');
  const deck=await snapshot(page);repl(`${profileName} ${mode} cockpit`,{deckCanvas,deckInteract:deck.deckInteract,phase:deck.openingPhase,hard:deck.hard});
  if(!deckCanvas?.ok||deckCanvas.nonBlack<100||deckCanvas.range<8)fail(mode,'authored cockpit canvas appears blank',{profileName,deckCanvas});
  if(deck.hard?.openingAuthority!=='TechOpsGoodBoysButtonHardFix'||Number(deck.hard?.version||0)<13)fail(mode,'v13 hard opening authority not active',{profileName,hard:deck.hard});
  await page.keyboard.down('ArrowRight');
  try{await page.waitForFunction(()=>window.__goodBoysDeckInteract&&window.__goodBoysDeckInteract.nearPilot===true,null,{timeout:8000});}
  finally{await page.keyboard.up('ArrowRight').catch(()=>{});}
  const near=await snapshot(page);repl(`${profileName} ${mode} pilot range`,near.deckInteract);
  if(!near.deckInteract?.nearPilot)throw new Error('pilot range was not reached');
  if(!await domClick(page,'#gbs-use'))throw new Error('pilot INTERACT control unavailable');
}

async function advanceTakeover(page,mode,profileName){
  await page.waitForFunction(()=>{
    const e=window.__goodDogsCutsceneExit,f=window.__goodBoysShipFlightState,o=document.querySelector('#good-dogs-cutscene-overlay.active');
    return !!((e&&e.id==='GD_CUT_02')||(f&&(f.active||Number(f.progress||0)>0))||o);
  },null,{timeout:10000});
  const autoplay=await page.evaluate(()=>{
    const o=document.querySelector('#good-dogs-cutscene-overlay.active'),v=o&&o.querySelector('video'),p=o&&o.querySelector('.gd-film-play');
    return{exit:window.__goodDogsCutsceneExit||null,gesture:window.__goodDogsCutsceneNeedsGesture||null,overlay:!!o,currentTime:v?Number(v.currentTime||0):null,readyState:v?Number(v.readyState||0):null,playButton:!!(p&&p.classList.contains('active')),src:v&&(v.currentSrc||v.getAttribute('src')||'')};
  });
  repl(`${profileName} ${mode} takeover`,autoplay);
  if(autoplay.gesture&&autoplay.gesture.id==='GD_CUT_02')fail(mode,'GD_CUT_02 required manual play',{profileName,autoplay});
  if(autoplay.overlay){
    await page.waitForFunction(()=>{const o=document.querySelector('#good-dogs-cutscene-overlay.active'),v=o&&o.querySelector('video'),e=window.__goodDogsCutsceneExit;return !!((e&&e.id==='GD_CUT_02')||(v&&Number(v.currentTime||0)>.08));},null,{timeout:8000}).catch(()=>{});
    if(await page.locator('#good-dogs-cutscene-overlay.active .gd-film-skip').count())await domClick(page,'#good-dogs-cutscene-overlay.active .gd-film-skip');
  }
  await page.waitForFunction(()=>window.__goodBoysShipFlightState&&(window.__goodBoysShipFlightState.active||Number(window.__goodBoysShipFlightState.progress||0)>0),null,{timeout:8000});
}

async function driveGoodBoysOpening(page,mode,profileName){
  await drivePilot(page,mode,profileName);
  await advanceTakeover(page,mode,profileName);

  await page.waitForSelector('#good-boys-ship-flight',{state:'visible',timeout:8000});
  await page.waitForFunction(()=>window.__goodBoysShipFlightState&&window.__goodBoysShipFlightState.assetReady===true,null,{timeout:7000});
  await waitForRenderReady(page,'#good-boys-ship-flight canvas',{timeout:6000,minNonBlack:100,minRange:8});
  const flightCanvas=await canvasSignal(page,'#good-boys-ship-flight canvas');
  const flight=await snapshot(page);repl(`${profileName} ${mode} flight`,{flightCanvas,flight:flight.flight});
  if(!flightCanvas?.ok||flightCanvas.nonBlack<100||flightCanvas.range<8)fail(mode,'Good Ship flight canvas appears blank',{profileName,flightCanvas,flight:flight.flight});
  if(!String(flight.flight?.asset||'').includes('good_ship_arcade.atlas.png'))fail(mode,'Good Ship supplied atlas is not active',{profileName,flight:flight.flight});
  await page.screenshot({path:path.join(OUT,`${profileName}-goodboys-flight.png`),fullPage:true}).catch(()=>{});
  await page.waitForFunction(()=>window.__goodBoysShipFlightState&&window.__goodBoysShipFlightState.completed===true,null,{timeout:15000});

  await page.waitForFunction(()=>{const c=window.__goodBoysCrashScene;return !!(document.querySelector('#good-boys-crash-canonical')||(c&&(c.active||c.completed)));},null,{timeout:8000});
  const crash=await snapshot(page);repl(`${profileName} ${mode} crash`,{presentation:crash.presentation,crash:crash.crash,cutsceneExit:crash.cutsceneExit});
  if(crash.cutsceneExit?.id==='GD_CUT_03')fail(mode,'retired GD_CUT_03 replayed after Good Ship flight',{profileName,cutsceneExit:crash.cutsceneExit});
  if(crash.crash?.procedural===true)fail(mode,'procedural crash authority returned',{profileName,crash:crash.crash});
  if(crash.presentation&&!crash.presentation.ok&&crash.crash?.phase!=='loading')warn(mode,'authored crash media not yet visually ready',{profileName,presentation:crash.presentation,crash:crash.crash});
  await page.screenshot({path:path.join(OUT,`${profileName}-goodboys-crash.png`),fullPage:true}).catch(()=>{});

  await page.waitForFunction(()=>window.__goodBoysCrashScene&&window.__goodBoysCrashScene.completed===true,null,{timeout:18000});
  await page.waitForFunction(()=>window.NM&&window.NM._v736&&Number(window.NM._v736.m)===3,null,{timeout:8000});
}

async function settleNight(page){
  const until=Date.now()+9000;
  while(Date.now()<until){
    const film='#good-dogs-cutscene-overlay.active .gd-film-skip';
    if(await page.locator(film).count()){await domClick(page,film);await page.waitForTimeout(150);continue;}
    const authored=page.locator('#good-boys-story-cine button,#gb-prison-cine button,#good-boys-earthfall-cine button,#good-boys-campaign-intro button');
    if(await authored.count()){await authored.first().evaluate(el=>el.click()).catch(()=>{});await page.waitForTimeout(150);continue;}
    const txt=await page.locator('body').innerText().catch(()=>'');
    if(/SELECT SHIFT DIFFICULTY/i.test(txt)){await clickByRegex(page,/Standard/i);await page.waitForTimeout(120);continue;}
    if(/BEGIN THE INCIDENT/i.test(txt)){await clickByRegex(page,/BEGIN THE INCIDENT/i);await page.waitForTimeout(120);continue;}
    const active=await page.evaluate(()=>!!(window.v722&&typeof window.v722.active==='function'&&window.v722.active())).catch(()=>false);
    if(active){await page.evaluate(()=>window.v722.skip()).catch(()=>{});await page.waitForTimeout(150);continue;}
    const s=await snapshot(page);if(s.runtime.hasNM&&!s.runtime.inDialog&&!s.activeOpening)return true;
    await page.waitForTimeout(150);
  }
  return false;
}

async function exerciseGameplay(page,mode,profileName,before){
  if(!before.runtime.hasNM)return null;
  const x0=Number(before.runtime.nm?.x);
  await page.keyboard.down('ArrowRight');
  await page.waitForTimeout(900);
  await page.keyboard.up('ArrowRight');
  await page.waitForTimeout(250);
  const moved=await snapshot(page),x1=Number(moved.runtime.nm?.x);
  repl(`${profileName} ${mode} movement`,{x0,x1,delta:x1-x0,keys:moved.runtime.keys,wrapperHealth:moved.wrapperHealth});
  if(!Number.isFinite(x0)||!Number.isFinite(x1)||Math.abs(x1-x0)<2)fail(mode,'movement input did not move the player',{profileName,x0,x1,runtime:moved.runtime,wrapperHealth:moved.wrapperHealth});
  await page.keyboard.press('ArrowUp').catch(()=>{});
  if(mode==='nightcrawler'){
    await page.keyboard.press('Shift').catch(()=>{});
    await page.keyboard.press('KeyE').catch(()=>{});
  }else{
    const dog0=moved.runtime.activeDog;
    await page.keyboard.press('KeyC').catch(()=>{});
    await page.waitForTimeout(250);
    const swapped=await snapshot(page);
    if(swapped.runtime.activeDog===dog0)warn(mode,'swap key did not change active dog',{profileName,activeDog:dog0});
    else repl(`${profileName} goodboys swap`,{from:dog0,to:swapped.runtime.activeDog});
  }
  await page.waitForTimeout(250);
  return snapshot(page);
}

async function runMode(browserType,profileName,contextOptions,mode){
  repl(`launch ${profileName} :: ${mode}`);
  const browser=await browserType.launch({headless:true});
  const context=await browser.newContext(contextOptions);
  await context.tracing.start({screenshots:true,snapshots:false,sources:false});
  const page=await context.newPage();
  const consoleErrors=[],pageErrors=[],requestFailures=[],badResponses=[],crashes=[];
  page.on('console',m=>{if(m.type()==='error')consoleErrors.push(m.text());});
  page.on('pageerror',e=>pageErrors.push(String(e&&e.stack||e)));
  page.on('crash',()=>crashes.push({at:Date.now()}));
  page.on('requestfailed',r=>requestFailures.push({url:r.url(),error:r.failure()?.errorText||''}));
  page.on('response',r=>{if(r.status()>=400)badResponses.push({url:r.url(),status:r.status()});});

  try{
    await page.goto(BASE,{waitUntil:'domcontentloaded',timeout:30000});
    await page.waitForTimeout(1800);
    const clicked=mode==='nightcrawler'?await clickByRegex(page,/NIGHT\s*CRAWLER/i):await clickByRegex(page,/(118\/1984|BREAKOUT|GOOD\s*BOYS)/i);
    if(!clicked){const s=await snapshot(page);fail(mode,'launch button not found',{profileName,bodyText:s.bodyText});return;}
    repl(`${profileName} clicked`,clicked);

    if(mode==='goodboys'){
      await driveGoodBoysOpening(page,mode,profileName);
      // M3 intentionally opens an authored prison briefing. It owns S.inDialog
      // and hides gameplay controls until TAKE CONTROL. Dismiss it before
      // evaluating input readiness so a valid cinematic is not misreported as
      // a stale-dialog gameplay lock.
      await waitForInputReady(page,{timeout:12000});
    }else{
      const settled=await settleNight(page);
      if(!settled)throw new Error('Night runtime did not reach input-ready state');
      await waitForInputReady(page,{timeout:5000});
    }

    await page.waitForTimeout(300);
    const s1=await snapshot(page);
    await page.screenshot({path:path.join(OUT,`${profileName}-${mode}.png`),fullPage:true}).catch(()=>{});
    repl(`${profileName} ${mode} state`,s1);

    const firstPartyPageErrors=pageErrors.filter(e=>!thirdPartyNoise(e));
    const thirdPartyPageErrors=pageErrors.filter(thirdPartyNoise);
    if(firstPartyPageErrors.length)fail(mode,'uncaught first-party page errors',{profileName,pageErrors:firstPartyPageErrors.slice(0,20)});
    if(thirdPartyPageErrors.length)warn(mode,'third-party media widget errors',{profileName,pageErrors:thirdPartyPageErrors.slice(0,10)});
    if(consoleErrors.length)warn(mode,'console errors',{profileName,consoleErrors:consoleErrors.slice(0,20)});
    if(requestFailures.length)warn(mode,'request failures',{profileName,requests:requestFailures.slice(0,15)});
    if(badResponses.length)warn(mode,'HTTP asset failures',{profileName,responses:badResponses.slice(0,15)});
    if(crashes.length)fail(mode,'browser page crashed during launch',{profileName,crashes});
    if(s1.safetyError)fail(mode,'runtime safety captured exception',{profileName,error:s1.safetyError});
    if(s1.openingError)fail(mode,'Good Boys opening error remained visible',{profileName,error:s1.openingError});
    if(!s1.canvas?.ok||s1.canvas.nonBlack<20||s1.canvas.range<8)fail(mode,'gameplay canvas appears blank/stalled',{profileName,canvas:s1.canvas});
    if(!s1.wrapperGuard)warn(mode,'stable wrapper guard not confirmed',{profileName});
    if(s1.wrapperHealth&&(!s1.wrapperHealth.installed||!s1.wrapperHealth.globalDrawAligned||!s1.wrapperHealth.globalStepAligned))fail(mode,'stable compositor health check failed',{profileName,wrapperHealth:s1.wrapperHealth});
    if(s1.wrapperHealth?.nightKeyBridgeError)fail(mode,'production Night key bridge reported an error',{profileName,error:s1.wrapperHealth.nightKeyBridgeError});
    if(!s1.lexicalBridge)warn(mode,'lexical runtime bridge not confirmed',{profileName});

    if(mode==='nightcrawler'){
      if(!s1.runtime.nightMode||!s1.runtime.hasNM)fail(mode,'Night runtime did not attach',{profileName,runtime:s1.runtime,routerError:s1.routerError});
      if(s1.runtime.char!=='nightcrawler')fail(mode,'Night Crawler identity not active',{profileName,runtime:s1.runtime});
    }else{
      if(s1.activeOpening)fail(mode,'Good Boys opening presentation did not clear before M3 gameplay',{profileName,activeOpening:s1.activeOpening,phase:s1.openingPhase});
      if(!s1.runtime.nightMode||!s1.runtime.hasNM)fail(mode,'Good Boys has no Night world after authored opening',{profileName,runtime:s1.runtime});
      if(!s1.runtime.pair)fail(mode,'Katrin/Manchez pair not attached',{profileName,runtime:s1.runtime});
      if(!['katrin','manchez'].includes(s1.runtime.activeDog))fail(mode,'active playable dog invalid',{profileName,runtime:s1.runtime});
      if(Number(s1.runtime.mission)!==3)fail(mode,'Good Boys opening did not enter M3',{profileName,runtime:s1.runtime});
      if(Number(s1.runtime.mission)!==Number(s1.runtime.metaMission)||Number(s1.runtime.mission)!==Number(s1.runtime.stateMission))fail(mode,'Good Boys mission authority diverged',{profileName,runtime:s1.runtime});
      if(s1.runtime.missionInvariant&&s1.runtime.missionInvariant.ok===false)fail(mode,'Good Boys post-handoff invariant failed',{profileName,invariant:s1.runtime.missionInvariant});
      if(s1.hard?.openingAuthority!=='TechOpsGoodBoysButtonHardFix'||Number(s1.hard?.version||0)<13)fail(mode,'wrong Good Boys opening runtime authority',{profileName,hard:s1.hard});
      if(/NEW HAVEN STREETS|NIGHT CRAWL|NEW HAVEN AFTER DARK/i.test(s1.bodyText))fail(mode,'generic Night presentation leaks into Good Boys',{profileName});
      if(!s1.controls.bodyClass||!s1.controls.visible||s1.controls.count!==7||s1.controls.overlaps)fail(mode,'Good Boys mobile controls are unstyled or overlapping',{profileName,controls:s1.controls});
    }

    const exercised=await exerciseGameplay(page,mode,profileName,s1);
    if(exercised){
      repl(`${profileName} ${mode} exercised state`,exercised);
      if(exercised.safetyError)fail(mode,'runtime errored during input exercise',{profileName,error:exercised.safetyError});
      if(!exercised.canvas?.ok||exercised.canvas.nonBlack<20||exercised.canvas.range<8)fail(mode,'canvas failed after gameplay input',{profileName,canvas:exercised.canvas});
    }

    await page.waitForTimeout(3000);
    const s2=await snapshot(page);repl(`${profileName} ${mode} liveness`,s2);
    if(crashes.length)fail(mode,'browser page crashed during liveness window',{profileName,crashes});
    if(s2.safetyError)fail(mode,'runtime errored during liveness window',{profileName,error:s2.safetyError});
    if(!s2.canvas?.ok||s2.canvas.nonBlack<20||s2.canvas.range<8)fail(mode,'canvas failed liveness window',{profileName,canvas:s2.canvas});
  }catch(e){
    fail(mode,'bot exception',{profileName,error:String(e&&e.stack||e),state:await snapshot(page).catch(()=>null)});
    await page.screenshot({path:path.join(OUT,`${profileName}-${mode}-exception.png`),fullPage:true}).catch(()=>{});
  }finally{
    await context.tracing.stop({path:path.join(OUT,`${profileName}-${mode}-trace.zip`)}).catch(()=>{});
    await browser.close();
  }
}

const enabledBrowsers=new Set(String(process.env.BOT_BROWSERS||'webkit,chromium').split(',').map(s=>s.trim()).filter(Boolean));
const chromiumMobile=process.env.BOT_CHROMIUM_MOBILE==='1';
const profiles=[
  {id:'webkit',name:'iphone-webkit',browser:webkit,options:{...devices['iPhone 15 Pro'],viewport:{width:393,height:852}}},
  {id:'chromium',name:chromiumMobile?'iphone-chromium':'desktop-chromium',browser:chromium,options:chromiumMobile?{...devices['iPhone 15 Pro'],viewport:{width:393,height:852}}:{viewport:{width:1440,height:900}}}
].filter(p=>enabledBrowsers.has(p.id));
const modes=String(process.env.BOT_MODES||'nightcrawler,goodboys').split(',').map(s=>s.trim()).filter(s=>s==='nightcrawler'||s==='goodboys');
for(const p of profiles)for(const mode of modes)await runMode(p.browser,p.name,p.options,mode);

const report={timestamp:new Date().toISOString(),baseUrl:BASE,durationMs:Date.now()-started,contractVersion:13,pass:!findings.some(f=>f.severity==='FAIL'),failures:findings.filter(f=>f.severity==='FAIL').length,warnings:findings.filter(f=>f.severity==='WARN').length,findings};
fs.writeFileSync(path.join(OUT,'report.json'),JSON.stringify(report,null,2));
fs.writeFileSync(path.join(OUT,'repl.txt'),transcript.join('\n\n')+'\n');
const md=['# TechOps Hero Runtime Bot','',`- Contract: **v13 authored Good Boys opening**`,`- Result: **${report.pass?'PASS':'FAIL'}**`,`- Target: \`${BASE}\``,`- Failures: ${report.failures}`,`- Warnings: ${report.warnings}`,`- Duration: ${(report.durationMs/1000).toFixed(1)}s`,'','## Findings','',findings.length?findings.map((f,i)=>`${i+1}. **${f.severity} / ${f.mode}** — ${f.issue}\n\n   \`${JSON.stringify(f)}\``).join('\n'):'No findings.','','## REPL transcript','','See `repl.txt`, authored-opening screenshots, gameplay screenshots, and Playwright trace ZIPs in the workflow artifact.'].join('\n');
fs.writeFileSync(path.join(OUT,'report.md'),md);
console.log('\n'+md);
if(!report.pass)process.exitCode=1;
