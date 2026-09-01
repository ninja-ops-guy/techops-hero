import fs from 'node:fs';
import path from 'node:path';
import { webkit, devices } from 'playwright';

const BASE=process.env.BOT_BASE_URL||'http://127.0.0.1:4173/';
const OUT=process.env.BOT_OUT_DIR||'runtime-bot-artifacts';
fs.mkdirSync(OUT,{recursive:true});
const failures=[];const events=[];
const log=(name,data={})=>{events.push({at:new Date().toISOString(),name,...data});console.log(name,JSON.stringify(data));};
const fail=(name,data={})=>{failures.push({name,...data});log('FAIL '+name,data);};

async function clickLaunch(page){
  for(const b of await page.locator('button').all()){
    const t=(await b.innerText().catch(()=>'' )).trim();
    if(/118\/1984|BREAKOUT|GOOD\s*BOYS/i.test(t)){await b.click({timeout:1500});return t;}
  }
  return null;
}
async function filmSnapshot(page){
  return page.evaluate(()=>{
    const o=document.getElementById('good-dogs-cutscene-overlay');
    const v=o&&o.querySelector('.gd-film-video'),b=o&&o.querySelector('.gd-film-skip');
    const r=e=>{if(!e)return null;const x=e.getBoundingClientRect();return{top:x.top,bottom:x.bottom,left:x.left,right:x.right,width:x.width,height:x.height};};
    const style=o&&getComputedStyle(o);
    return{
      exists:!!o,
      active:!!(o&&o.classList.contains('active')&&style&&style.display!=='none'),
      overlay:r(o),video:r(v),skip:r(b),
      src:v?(v.currentSrc||v.getAttribute('src')||''):'',
      readyState:v?Number(v.readyState):0,
      paused:v?!!v.paused:true,
      repairVersion:window.TechOpsGoodBoysIntroRepair&&window.TechOpsGoodBoysIntroRepair.VERSION||0,
      launching:!!(window.TechOpsGoodBoysIntroRepair&&window.TechOpsGoodBoysIntroRepair.launching),
      titleVisible:(()=>{const t=document.getElementById('title-screen');return !!(t&&!t.classList.contains('hidden')&&getComputedStyle(t).display!=='none');})(),
      stateExists:!!window.S
    };
  });
}
async function campaignSnapshot(page){
  return page.evaluate(()=>{
    const s=window.S,n=window.NM,c=n&&n._v736,m=s&&s.meta&&s.meta._v736,o=document.getElementById('good-dogs-cutscene-overlay');
    const title=document.getElementById('title-screen');
    return{
      stateExists:!!s,
      night:!!(s&&s.nightMode),
      campaignAttached:!!c,
      pair:!!(c&&c.chars&&c.chars.katrin&&c.chars.manchez&&c.partner),
      mission:Number(c&&c.m||m&&m.m||0),
      filmActive:!!(o&&o.classList.contains('active')&&getComputedStyle(o).display!=='none'),
      titleVisible:!!(title&&!title.classList.contains('hidden')&&getComputedStyle(title).display!=='none'),
      launch:window.__goodBoysDirectIntro||null,
      mediaError:window.__goodBoysDirectIntroMediaError||null,
      clockInError:window.__goodBoysDirectIntroClockInError||null,
      startError:window.__goodBoysDirectIntroStartError||null
    };
  });
}

const browser=await webkit.launch({headless:true});
const context=await browser.newContext({...devices['iPhone 15 Pro'],viewport:{width:393,height:852}});
const page=await context.newPage();
try{
  await page.goto(BASE,{waitUntil:'domcontentloaded',timeout:30000});
  await page.waitForTimeout(1800);
  const clicked=await clickLaunch(page);if(!clicked){fail('launch-button-missing');throw new Error('Good Boys launch button missing');}
  log('launch-clicked',{clicked});

  await page.waitForSelector('#good-dogs-cutscene-overlay.active',{state:'visible',timeout:3500});
  const film=await filmSnapshot(page);log('opening-film',film);
  if(film.repairVersion<5)fail('direct-intro-v5-not-active',{version:film.repairVersion});
  if(!film.active)fail('opening-film-not-active',film);
  if(!/assets\/cutscenes\/good_dogs\/01_signal_beyond_earth_pixel\.mp4(?:$|[?#])/i.test(film.src))fail('wrong-opening-master',{src:film.src});
  if(!film.skip||film.skip.width<40||film.skip.height<30)fail('opening-skip-not-tappable',{skip:film.skip});
  if(film.overlay&&(film.overlay.width<380||film.overlay.height<800))fail('opening-film-not-full-mobile-frame',{overlay:film.overlay});
  await page.screenshot({path:path.join(OUT,'goodboys-intro-mobile-gd-cut-01.png'),fullPage:true});

  const skip=page.locator('#good-dogs-cutscene-overlay.active .gd-film-skip');
  const tapStarted=Date.now();
  await skip.click({timeout:1500});
  const tapMs=Date.now()-tapStarted;log('film-skip-tap',{tapMs});
  if(tapMs>=1400)fail('film-skip-tap-too-slow',{tapMs});

  await page.waitForFunction(()=>!!(window.NM&&window.NM._v736),null,{timeout:8000}).catch(()=>{});
  await page.waitForTimeout(250);
  const end=await campaignSnapshot(page);log('post-film-campaign',end);
  if(!end.stateExists)fail('clock-in-state-not-created',end);
  if(!end.campaignAttached)fail('film-did-not-launch-campaign',end);
  if(end.mission!==1)fail('campaign-started-on-wrong-mission',end);
  if(end.filmActive)fail('opening-film-did-not-close',end);
  if(end.titleVisible)fail('title-screen-remained-after-opening-film',end);
  if(end.clockInError||end.startError)fail('direct-intro-handoff-error',end);
  await page.screenshot({path:path.join(OUT,'goodboys-intro-mobile-after-gd-cut-01.png'),fullPage:true});
}catch(e){fail('bot-exception',{error:String(e&&e.stack||e)});await page.screenshot({path:path.join(OUT,'goodboys-intro-mobile-exception.png'),fullPage:true}).catch(()=>{});}finally{await browser.close();}
const report={pass:failures.length===0,failures,events};
fs.writeFileSync(path.join(OUT,'goodboys-intro-mobile.json'),JSON.stringify(report,null,2));
fs.writeFileSync(path.join(OUT,'goodboys-intro-mobile.md'),['# Good Boys iPhone Intro Bot','',`- Result: **${report.pass?'PASS':'FAIL'}**`,`- Failures: ${failures.length}`,'',...events.map(e=>`- ${e.name}: \`${JSON.stringify(e)}\``)].join('\n'));
if(!report.pass)process.exitCode=1;

// validation touch: direct Good Dogs opening v5
