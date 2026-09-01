import fs from 'node:fs';
import path from 'node:path';
import { webkit, devices } from 'playwright';

const BASE=process.env.BOT_BASE_URL||'http://127.0.0.1:4173/';
const OUT=process.env.BOT_OUT_DIR||'runtime-bot-artifacts';
fs.mkdirSync(OUT,{recursive:true});
const failures=[],events=[];
const log=(name,data={})=>{events.push({at:new Date().toISOString(),name,...data});console.log(name,JSON.stringify(data));};
const fail=(name,data={})=>{failures.push({name,...data});log('FAIL '+name,data);};

async function waitForLateGame(page){
  await page.waitForFunction(()=>{
    const a=window.TechOpsLateGameBootstrap&&window.TechOpsLateGameBootstrap.acceptance&&window.TechOpsLateGameBootstrap.acceptance();
    return !!(window.TechOpsCampaign&&window.TechOpsMORNINGSTARBuild&&window.TechOpsSwarmDoctrine&&window.TechOpsMORNINGSTARRuntime&&a&&a.ready);
  },null,{timeout:12000});
}

async function activateBaseRun(page,preferContinue=false){
  const activated=await page.evaluate(prefer=>{
    const visible=el=>!!(el&&el.getClientRects().length&&!el.classList.contains('hidden')&&getComputedStyle(el).display!=='none'&&getComputedStyle(el).visibility!=='hidden');
    const option=re=>[...document.querySelectorAll('#dlg-options button')].find(b=>re.test(b.textContent||''));
    const hasLexicalS=()=>{try{return !!window.eval(`(typeof S!=='undefined'&&S)`);}catch{return false;}};
    let route='';
    const cont=document.getElementById('btn-continue');
    if(prefer&&visible(cont)){cont.click();route='continue';}
    else{
      const start=document.getElementById('btn-start');if(!start)throw new Error('CLOCK IN unavailable');start.click();route='clock-in';
      const standard=option(/Standard/i);if(!standard)throw new Error('Standard difficulty unavailable');standard.click();
    }
    const clockIn=option(/Clock in/i);if(clockIn)clockIn.click();
    if(window.TechOpsMORNINGSTARRuntime&&typeof window.TechOpsMORNINGSTARRuntime.install==='function')window.TechOpsMORNINGSTARRuntime.install();
    return {route,hud:visible(document.getElementById('hud')),dialog:visible(document.getElementById('dialogue')),hasS:hasLexicalS()};
  },preferContinue);
  log('base-run-activation',activated);
  await page.waitForFunction(()=>{const h=document.getElementById('hud');let s=false;try{s=!!window.eval(`(typeof S!=='undefined'&&S)`);}catch{}return !!(s&&h&&!h.classList.contains('hidden')&&h.getClientRects().length);},null,{timeout:3000});
  return activated;
}

async function snapshot(page){
  return page.evaluate(()=>{
    const button=id=>{const b=document.getElementById(id);if(!b)return{exists:false};const cs=getComputedStyle(b);return{exists:true,display:b.style.display||'',computed:cs.display,visibility:cs.visibility,visible:!!(b.getClientRects().length&&cs.display!=='none'&&cs.visibility!=='hidden'),disabled:!!b.disabled};};
    let campaign=null,swarm=null,acceptance=null,lexical={state:false,goodBoys:null,character:null,inDialog:false};
    try{campaign=window.TechOpsCampaign&&window.TechOpsCampaign.load?window.TechOpsCampaign.load(localStorage):null;}catch(e){campaign={error:String(e&&e.stack||e)};}
    try{swarm=window.TechOpsSwarmDoctrine&&window.TechOpsSwarmDoctrine.snapshot?window.TechOpsSwarmDoctrine.snapshot():null;}catch(e){swarm={error:String(e&&e.stack||e)};}
    try{acceptance=window.TechOpsMORNINGSTARRuntime&&window.TechOpsMORNINGSTARRuntime.acceptance?window.TechOpsMORNINGSTARRuntime.acceptance():null;}catch(e){acceptance={error:String(e&&e.stack||e)};}
    try{lexical=window.eval(`(function(){var s=(typeof S!=='undefined'&&S)?S:null;return{state:!!s,goodBoys:s&&s.meta&&s.meta._v736?JSON.parse(JSON.stringify(s.meta._v736)):null,character:s&&s.meta&&s.meta._char||null,inDialog:!!(s&&s.inDialog)};})()`);}catch(e){lexical={error:String(e&&e.stack||e),state:false,goodBoys:null,character:null,inDialog:false};}
    const hud=document.getElementById('hud'),hcs=hud?getComputedStyle(hud):null;
    return {
      runtimeVersion:window.TechOpsMORNINGSTARRuntime&&window.TechOpsMORNINGSTARRuntime.VERSION||0,
      bootstrap:window.TechOpsLateGameBootstrap&&window.TechOpsLateGameBootstrap.acceptance?window.TechOpsLateGameBootstrap.acceptance():null,
      phase:window.TechOpsMORNINGSTARBuild&&window.TechOpsMORNINGSTARBuild.getCurrentPhase?window.TechOpsMORNINGSTARBuild.getCurrentPhase():-1,
      hudVisible:!!(hud&&hud.getClientRects().length&&!hud.classList.contains('hidden')&&hcs&&hcs.display!=='none'),
      morningstarButton:button('btn-morningstar'),
      swarmButton:button('btn-swarm-command'),
      campaignPhase:campaign&&campaign.lateGame&&campaign.lateGame.morningstar&&Number(campaign.lateGame.morningstar.phase),
      persistedSwarmLog:campaign&&campaign.lateGame&&campaign.lateGame.swarm&&Array.isArray(campaign.lateGame.swarm.log)?campaign.lateGame.swarm.log.length:0,
      swarm,
      acceptance,
      goodBoys:lexical.goodBoys,
      stateAttached:lexical.state,
      character:lexical.character,
      inDialog:lexical.inDialog,
      isFelicia:typeof window.isFel==='function'?!!window.isFel():null
    };
  });
}

const browser=await webkit.launch({headless:true});
const context=await browser.newContext({...devices['iPhone 15 Pro'],viewport:{width:393,height:852}});
const page=await context.newPage();

try{
  await page.goto(BASE,{waitUntil:'domcontentloaded',timeout:30000});
  await waitForLateGame(page);
  await activateBaseRun(page,false);
  const seeded=await page.evaluate(()=>{
    const c=window.TechOpsCampaign,s=c.load(localStorage);
    s.story=s.story||{schemaVersion:1,completedActs:[],facts:{}};
    s.story.completedActs=s.story.completedActs||[];s.story.facts=s.story.facts||{};
    s.story.facts.morningstar_signature_found=true;s.story.facts.violinist_revealed=true;
    s.p1=s.p1||{};s.p1.evidence=s.p1.evidence||{score:3,records:[]};s.p1.trust=s.p1.trust||{score:1,history:[]};
    s.lateGame=s.lateGame||{};
    s.lateGame.morningstar={phase:3,completedDayTickets:[],nightRecoveredItems:[],unlocks:['swarm_commands'],history:[]};
    c.save(s,localStorage);
    window.eval(`if(typeof S!=='undefined'&&S){S.meta=S.meta||{};S.meta._char='mike';}`);
    localStorage.setItem('techops_char','mike');
    window.TechOpsMORNINGSTARRuntime.install();
    const gb=window.eval(`(typeof S!=='undefined'&&S&&S.meta&&S.meta._v736)?JSON.stringify(S.meta._v736):null`);
    return {saveKey:c.SAVE_KEY,phase:window.TechOpsMORNINGSTARBuild.getCurrentPhase(),goodBoys:gb};
  });
  log('seeded',seeded);
  await page.waitForFunction(()=>{const b=document.getElementById('btn-swarm-command');return !!(b&&b.getClientRects().length&&getComputedStyle(b).display!=='none');},null,{timeout:2500});
  let a=await snapshot(page);log('phase3-ui',a);
  if(a.runtimeVersion<5)fail('runtime-v5-missing',a);
  if(!(a.bootstrap&&a.bootstrap.ready))fail('late-game-bootstrap-not-ready',a);
  if(a.phase!==3||a.campaignPhase!==3)fail('canonical-phase3-seed-failed',a);
  if(!a.stateAttached||a.character!=='mike')fail('canonical-mike-run-not-active',a);
  if(!a.hudVisible)fail('base-hud-not-visible',a);
  if(!a.morningstarButton.exists||!a.morningstarButton.visible)fail('morningstar-hud-button-not-user-visible',a);
  if(!a.swarmButton.exists||!a.swarmButton.visible)fail('shared-swarm-hud-button-not-user-visible',a);

  await page.evaluate(()=>{const b=document.getElementById('btn-swarm-command');if(!b)throw new Error('swarm command missing');b.click();});
  await page.waitForFunction(()=>{
    const d=document.getElementById('dialogue'),n=document.getElementById('dlg-name');
    return !!(d&&n&&!d.classList.contains('hidden')&&/MORNINGSTAR\s*\/\/\s*SWARM COMMAND/i.test(n.textContent||''));
  },null,{timeout:3000});
  await page.waitForFunction(()=>{
    const t=(document.getElementById('dlg-text')&&document.getElementById('dlg-text').textContent)||'';
    return /bounded/i.test(t)&&/nonlethal/i.test(t);
  },null,{timeout:5000});
  const dialog=await page.evaluate(()=>({
    name:(document.getElementById('dlg-name')&&document.getElementById('dlg-name').textContent)||'',
    text:(document.getElementById('dlg-text')&&document.getElementById('dlg-text').textContent)||'',
    hidden:document.getElementById('dialogue')?document.getElementById('dialogue').classList.contains('hidden'):true,
    inDialog:!!window.eval(`(typeof S!=='undefined'&&S&&S.inDialog)`)
  }));
  log('swarm-dialog',dialog);
  if(dialog.hidden||!dialog.inDialog)fail('swarm-dialog-not-canonical',dialog);
  if(!/bounded/i.test(dialog.text)||!/nonlethal/i.test(dialog.text))fail('mike-swarm-dialog-copy-missing',dialog);
  await page.screenshot({path:path.join(OUT,'late-game-swarm-mobile.png')});
  await page.evaluate(()=>{if(typeof window.closeDlg==='function')window.closeDlg();else try{window.eval(`if(typeof closeDlg==='function')closeDlg()`);}catch{}});

  const mike=await page.evaluate(()=>{
    window.eval(`if(typeof S!=='undefined'&&S){S.meta=S.meta||{};S.meta._char='mike';}`);localStorage.setItem('techops_char','mike');
    const r=window.TechOpsMORNINGSTARRuntime.issue('RECON',{range:100,duration:20,drones:2,intent:'mobile runtime regression - mike'});
    const log=window.TechOpsSwarmDoctrine.getLog({result:'EXECUTED'});return{result:r,last:log[log.length-1]||null,isFel:typeof window.isFel==='function'?window.isFel():null};
  });
  log('mike-command',mike);
  if(!(mike.result&&mike.result.success))fail('mike-recon-command-failed',mike);
  if(!mike.last||mike.last.issuer!=='Mike')fail('mike-command-attribution-failed',mike);

  const felicia=await page.evaluate(()=>{
    window.eval(`if(typeof S!=='undefined'&&S){S.meta=S.meta||{};S.meta._char='felicia';}`);localStorage.setItem('techops_char','felicia');
    const r=window.TechOpsMORNINGSTARRuntime.issue('RECON',{range:120,duration:20,drones:2,intent:'mobile runtime regression - felicia'});
    const log=window.TechOpsSwarmDoctrine.getLog({result:'EXECUTED'});return{result:r,last:log[log.length-1]||null,isFel:typeof window.isFel==='function'?window.isFel():null};
  });
  log('felicia-command',felicia);
  if(felicia.isFel!==true)fail('felicia-character-route-not-active',felicia);
  if(!(felicia.result&&felicia.result.success))fail('felicia-recon-command-failed',felicia);
  if(!felicia.last||felicia.last.issuer!=='Felicia')fail('felicia-command-attribution-failed',felicia);

  a=await snapshot(page);log('post-commands',a);
  if(a.persistedSwarmLog<2)fail('swarm-log-not-persisted',a);
  const beforeGb=seeded.goodBoys;
  const afterGb=a.goodBoys==null?null:JSON.stringify(a.goodBoys);
  if(beforeGb!==afterGb)fail('good-boys-authority-mutated',{beforeGb,afterGb});

  await page.reload({waitUntil:'domcontentloaded',timeout:30000});
  await waitForLateGame(page);
  await activateBaseRun(page,true);
  await page.waitForFunction(()=>window.TechOpsMORNINGSTARBuild&&window.TechOpsMORNINGSTARBuild.getCurrentPhase()===3,null,{timeout:3000});
  await page.waitForFunction(()=>{const b=document.getElementById('btn-swarm-command');return !!(b&&b.getClientRects().length&&getComputedStyle(b).display!=='none');},null,{timeout:3000});
  const reloaded=await snapshot(page);log('reloaded',reloaded);
  if(reloaded.campaignPhase!==3||reloaded.phase!==3)fail('phase3-not-persistent-after-reload',reloaded);
  if(reloaded.persistedSwarmLog<2)fail('swarm-log-lost-after-reload',reloaded);
  if(!reloaded.stateAttached||!reloaded.hudVisible||!reloaded.swarmButton.exists||!reloaded.swarmButton.visible)fail('swarm-hud-not-user-visible-after-reload',reloaded);
}catch(e){
  fail('bot-exception',{error:String(e&&e.stack||e)});
  await page.screenshot({path:path.join(OUT,'late-game-mobile-exception.png')}).catch(()=>{});
}finally{
  await browser.close();
}

const report={pass:failures.length===0,failures,events};
fs.writeFileSync(path.join(OUT,'late-game-mobile.json'),JSON.stringify(report,null,2));
const md=[
  '# MORNINGSTAR + Swarm iPhone Runtime',
  '',
  `Result: **${report.pass?'PASS':'FAIL'}**`,
  '',
  `Failures: ${failures.length}`,
  '',
  ...(failures.length?failures.map(f=>`- ${f.name}: \`${JSON.stringify(f)}\``):['- Canonical phase-3 persistence, genuinely visible shared swarm HUD, lexical Mike/Felicia attribution, audit persistence, and Good Boys authority isolation verified.'])
].join('\n');
fs.writeFileSync(path.join(OUT,'late-game-mobile.md'),md+'\n');
console.log(JSON.stringify(report,null,2));
if(!report.pass)process.exitCode=1;
