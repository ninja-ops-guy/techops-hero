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
async function introSnapshot(page){
  return page.evaluate(()=>{
    const o=document.querySelector('#good-boys-story-cine.gbi-repaired');
    const v=o&&o.querySelector('.gbi-visual'),z=o&&o.querySelector('.gbi-card-zone'),c=o&&o.querySelector('.gb-card'),b=o&&o.querySelector('#gb-cine-next');
    const r=e=>e?e.getBoundingClientRect():null;
    const rr=x=>x?{top:x.top,bottom:x.bottom,left:x.left,right:x.right,width:x.width,height:x.height}:null;
    const or=r(o),vr=r(v),zr=r(z),cr=r(c),br=r(b);
    return {
      exists:!!o,
      viewport:{w:innerWidth,h:innerHeight},
      overlay:rr(or),visual:rr(vr),zone:rr(zr),card:rr(cr),button:rr(br),
      text:o?o.innerText:'',
      repairVersion:window.TechOpsGoodBoysIntroRepair&&window.TechOpsGoodBoysIntroRepair.VERSION||0,
      repairIndex:window.TechOpsGoodBoysIntroRepair&&window.TechOpsGoodBoysIntroRepair.index,
      active:!!(window.TechOpsGoodBoysIntroRepair&&window.TechOpsGoodBoysIntroRepair.active),
      inDialog:!!(window.S&&window.S.inDialog)
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
  await page.waitForSelector('#good-boys-story-cine.gbi-repaired',{state:'visible',timeout:3000});
  await page.screenshot({path:path.join(OUT,'goodboys-intro-mobile-slide1.png'),fullPage:true});

  const titles=["WALDO'S PLACE","THE GARAGE WALL","THE HIDDEN BAY","118 / 1984"];
  for(let i=0;i<4;i++){
    const s=await introSnapshot(page);log('slide',{slide:i+1,state:s});
    if(!s.exists)fail('intro-overlay-missing',{slide:i+1});
    if(s.repairVersion<1)fail('intro-repair-not-active',{slide:i+1,version:s.repairVersion});
    if(!s.inDialog)fail('intro-does-not-block-gameplay',{slide:i+1});
    if(!s.text.includes(`${i+1} / 4`))fail('slide-counter-wrong',{slide:i+1,text:s.text});
    if(!s.text.includes(titles[i]))fail('slide-title-wrong',{slide:i+1,text:s.text});
    if(s.visual&&s.card){
      const gap=s.card.top-s.visual.bottom;log('composition',{slide:i+1,gap,visualHeight:s.visual.height,cardHeight:s.card.height,viewportHeight:s.viewport.h});
      if(gap>48)fail('intro-giant-vertical-gap',{slide:i+1,gap});
      if(s.visual.height<135||s.visual.height>s.viewport.h*.55)fail('intro-visual-height-out-of-range',{slide:i+1,visualHeight:s.visual.height,viewportHeight:s.viewport.h});
      if(s.card.bottom>s.viewport.h+2)fail('intro-card-offscreen',{slide:i+1,cardBottom:s.card.bottom,viewportHeight:s.viewport.h});
    }
    const btn=page.locator('#good-boys-story-cine.gbi-repaired #gb-cine-next');
    if(!await btn.count()){fail('intro-next-button-missing',{slide:i+1});break;}
    await btn.click({timeout:1500});
    await page.waitForTimeout(180);
  }

  await page.waitForFunction(()=>!!(window.NM&&window.NM._v736),null,{timeout:5000}).catch(()=>{});
  const end=await page.evaluate(()=>({
    campaignAttached:!!(window.NM&&window.NM._v736),
    mission:Number(window.NM&&window.NM._v736&&window.NM._v736.m||window.S&&window.S.meta&&window.S.meta._v736&&window.S.meta._v736.m||0),
    introPresent:!!document.querySelector('#good-boys-story-cine.gbi-repaired'),
    introActive:!!(window.TechOpsGoodBoysIntroRepair&&window.TechOpsGoodBoysIntroRepair.active),
    launch:window.__goodBoysIntroRepairLaunch||null,
    filmVisible:!!document.querySelector('#good-dogs-cutscene-overlay.active')
  }));
  log('post-fourth-slide',end);
  if(!end.campaignAttached)fail('fourth-slide-did-not-launch-campaign',end);
  if(end.introPresent||end.introActive)fail('intro-overlay-did-not-close',end);
  if(end.mission!==1)fail('campaign-started-on-wrong-mission',end);
  await page.screenshot({path:path.join(OUT,'goodboys-intro-mobile-after-launch.png'),fullPage:true});
}catch(e){fail('bot-exception',{error:String(e&&e.stack||e)});await page.screenshot({path:path.join(OUT,'goodboys-intro-mobile-exception.png'),fullPage:true}).catch(()=>{});}finally{await browser.close();}
const report={pass:failures.length===0,failures,events};
fs.writeFileSync(path.join(OUT,'goodboys-intro-mobile.json'),JSON.stringify(report,null,2));
fs.writeFileSync(path.join(OUT,'goodboys-intro-mobile.md'),['# Good Boys iPhone Intro Bot','',`- Result: **${report.pass?'PASS':'FAIL'}**`,`- Failures: ${failures.length}`,'',...events.map(e=>`- ${e.name}: \`${JSON.stringify(e)}\``)].join('\n'));
if(!report.pass)process.exitCode=1;
