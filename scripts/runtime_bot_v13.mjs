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
  if(base.activeOpening==='good-boys-deck-supplied'a 