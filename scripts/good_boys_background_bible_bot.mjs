import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const BASE=process.env.BOT_BASE_URL||'http://127.0.0.1:4173/';
const OUT=process.env.BOT_OUT_DIR||'runtime-bot-artifacts';
fs.mkdirSync(OUT,{recursive:true});
const expected={
  1:{key:'goodboys_home',district:'goodboys_home',scene:"WALDO'S PLACE — HOUSE / YARD / GARAGE",landmarks:['YARD','PORCH','GARAGE','HIDDEN BAY']},
  2:{key:'goodboys_hangar',district:'goodboys_hangar',scene:"WALDO'S CONCEALED LAUNCH BAY",landmarks:['HANGAR SECURITY','SECRET SHIP']},
  3:{key:'goodboys_breach',district:'goodboys_breach',scene:'ORBITAL PRISON — HULL BREACH',landmarks:['IMPACT BREACH','MAINTENANCE AIRLOCK','BLOCK 118']},
  4:{key:'goodboys_cell118',district:'goodboys_cell118',scene:'DETENTION BLOCK 118',landmarks:['CELL 118']},
  5:{key:'goodboys_core',district:'goodboys_core',scene:'ACCESS CORE',landmarks:['K — ROUTE KEY','ACCESS NODE','ROUTE 1984']},
  6:{key:'goodboys_cell1984',district:'goodboys_cell1984',scene:'SURVEILLANCE BLOCK 1984',landmarks:['K UPLINK','CELL 1984']},
  7:{key:'goodboys_escape',district:'goodboys_escape',scene:'WARDEN CORE / SHUTTLE BAY',landmarks:['WARDEN CORE','MAINTENANCE SHUTTLE']},
  8:{key:'goodboys_earthfall',district:'goodboys_earthfall',scene:"WALDO'S HOUSE — DAWN",landmarks:["WALDO'S PORCH",'GARAGE','SHUTTLE WRECK']}
};
const findings=[];const fail=(mission,issue,data={})=>findings.push({mission,issue,...data});
async function clickText(page,re){for(const b of await page.locator('button').all()){let t='';try{t=(await b.innerText()).trim();}catch{}if(re.test(t)){try{await b.click({timeout:500});return true;}catch{}}}return false;}
async function dismiss(page,ms=6500){const until=Date.now()+ms;while(Date.now()<until){for(const sel of ['#good-dogs-cutscene-overlay .gd-film-skip','#good-boys-earthfall-cine button','#gb-prison-cine button','#good-boys-story-cine button','#good-boys-campaign-intro button']){const b=page.locator(sel);if(await b.count()){const visible=await b.first().isVisible().catch(()=>false);if(visible){await b.first().click({timeout:500}).catch(()=>{});await page.waitForTimeout(100);continue;}}}const txt=await page.locator('body').innerText().catch(()=>'');if(/SELECT SHIFT DIFFICULTY/i.test(txt)){await clickText(page,/Standard/i);continue;}if(/BEGIN THE INCIDENT/i.test(txt)){await clickText(page,/BEGIN THE INCIDENT/i);continue;}break;}}
const browser=await chromium.launch({headless:true});const context=await browser.newContext({viewport:{width:1280,height:800}});await context.tracing.start({screenshots:true,snapshots:true,sources:true});const page=await context.newPage();
try{
  await page.goto(BASE,{waitUntil:'domcontentloaded',timeout:30000});await page.waitForTimeout(1900);
  if(!await clickText(page,/(118\/1984|BREAKOUT|GOOD\s*BOYS)/i))throw new Error('Good Boys launch button missing');
  await dismiss(page,8000);await page.waitForTimeout(650);
  /* This bot samples the eight authored environments out of sequence. Pause the
     live progression timer so combat-clear state cannot legitimately advance a
     manually selected sample while its background contract is being observed. */
  await page.evaluate(()=>{const p=window.TechOpsGoodBoysProgressionAuthority;if(p&&p.timer!=null){clearInterval(p.timer);p.timer=null;}window.__goodBoysBackgroundBibleSampling=true;});
  for(let m=1;m<=8;m++){
    await page.evaluate((mission)=>{var n=window.NM,s=window.S;if(n&&n._v736)n._v736.m=mission;if(s&&s.meta&&s.meta._v736)s.meta._v736.m=mission;var prog=window.TechOpsGoodBoysProgressionAuthority;if(prog&&prog.reconcileMission)prog.reconcileMission('background-bible-sample');var p=window.TechOpsGoodBoysPrisonCinematicPatch;if(p&&p.buildBackdrops)p.buildBackdrops();var a=window.TechOpsGoodBoysBackgroundAuthority;if(a){a.syncCanon();a.enforce();}var w=window.TechOpsGoodBoysBibleWorld;if(w)w.tick();if(a)a.enforce();},m);
    await page.waitForTimeout(180);
    const st=await page.evaluate(()=>{var a=window.TechOpsGoodBoysBackgroundAuthority,w=window.TechOpsGoodBoysBibleWorld,n=window.NM||{},c=window.TechOpsGoodBoysCanon&&window.TechOpsGoodBoysCanon.canonical&&window.TechOpsGoodBoysCanon.canonical(),g=window.TechOpsGoodBoysGameplayLoop,s=window.S&&window.S.meta&&window.S.meta._v736;return {authority:!!a,bibleWorld:!!w,acceptance:a&&a.acceptance?a.acceptance():null,worldAcceptance:w&&w.acceptance?w.acceptance():null,district:n.district||null,canonBackground:n._goodBoysCanonBackground||null,canonScene:n._goodBoysCanonScene||null,property:!!n._gbWaldoPropertyCanonical,landmarks:(n._goodBoysLandmarks||[]).map(x=>x.label),stageMission:Number(n._gbBibleStageMission||0),runtimeMission:Number(n._v736&&n._v736.m||0),metaMission:Number(s&&s.m||0),canonRow:c?{bg:c.bg,district:c.district,name:c.name,zone:c.zone,objective:c.objective}:null,phase:g&&g.PHASES?g.PHASES[(s&&s.m)||(n._v736&&n._v736.m)||0]:null,abstractEye:n._goodBoysCanonBackground==='orbital_eye',abstractGate:n._goodBoysCanonBackground==='orbital_gate'};});
    const e=expected[m];
    if(st.runtimeMission!==m||st.metaMission!==m)fail(m,'sample-mission-diverged',{expected:m,runtimeMission:st.runtimeMission,metaMission:st.metaMission});
    if(!st.authority)fail(m,'background-authority-missing',st);if(!st.bibleWorld)fail(m,'bible-world-authority-missing',st);
    if(st.district!==e.district)fail(m,'wrong-district',{expected:e.district,actual:st.district});
    if(st.canonBackground!==e.key)fail(m,'wrong-background',{expected:e.key,actual:st.canonBackground});
    if(st.canonScene!==e.scene)fail(m,'wrong-scene-label',{expected:e.scene,actual:st.canonScene});
    if(!st.acceptance||!st.acceptance.pass)fail(m,'background-authority-acceptance-failed',st.acceptance||{});
    if(!st.worldAcceptance||!st.worldAcceptance.pass)fail(m,'bible-world-acceptance-failed',st.worldAcceptance||{});
    if(st.stageMission!==m)fail(m,'stage-not-owned-by-bible-world',{expected:m,actual:st.stageMission});
    for(const label of e.landmarks)if(!st.landmarks.includes(label))fail(m,'missing-authored-landmark',{label,actual:st.landmarks});
    if(m===1&&!st.property)fail(m,'waldo-property-render-contract-missing',st);
    if(m>=3&&m<=7&&(st.abstractEye||st.abstractGate))fail(m,'abstract-orbital-fallback-used',st);
    if(st.canonRow&&(st.canonRow.bg!==e.key||st.canonRow.district!==e.district))fail(m,'canon-table-drift',{expected:e,actual:st.canonRow});
    if(st.phase&&st.phase.bg!==e.key)fail(m,'gameplay-phase-background-drift',{expected:e.key,actual:st.phase.bg});
    await page.screenshot({path:path.join(OUT,`goodboys-bible-m${m}.png`),fullPage:false});
  }
}catch(e){fail(0,'bot-exception',{error:String(e&&e.stack||e)});}finally{await context.tracing.stop({path:path.join(OUT,'goodboys-background-bible-trace.zip')}).catch(()=>{});await browser.close();}
const report={pass:findings.length===0,expected,findings};fs.writeFileSync(path.join(OUT,'goodboys-background-bible.json'),JSON.stringify(report,null,2));fs.writeFileSync(path.join(OUT,'goodboys-background-bible.md'),['# Good Boys Background Bible Bot','',`- Result: **${report.pass?'PASS':'FAIL'}**`,`- Findings: ${findings.length}`,'','## Canon route','',...Object.entries(expected).map(([m,e])=>`- M${m}: ${e.scene} — \`${e.key}\` / \`${e.district}\``),'',...(findings.length?['## Findings','',...findings.map(f=>`- ${JSON.stringify(f)}`)]:[])].join('\n'));if(!report.pass)process.exitCode=1;
