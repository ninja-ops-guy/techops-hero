/* Night Walker lifecycle. One main-frame clock and compositor dispatch.
 * Campaign facts remain in campaign_*; Good Dogs retains its own runtime.
 * Replaces the competing TechOpsNightFlow/TechOpsNightSession implementations.
 */
(function(root){
  'use strict';
  if(!root||root.TechOpsNightRuntime)return;
  const MINUTE_SECONDS=5,HOME_X=1500,FLOOR=430;
  let installed=false,transition=null,observed=null,chapterAge=0,chapterKey='',ui=null,tokenSerial=0;
  const CHECKPOINT_KEY='techops_nightcrawler_session_v1',CHECKPOINT_VERSION=2;
  let checkpointAge=5,checkpointMark='',checkpointError=null;
  const state=()=>{try{return typeof S!=='undefined'?S:root.S;}catch(_){return root.S;}};
  const world=()=>{const s=state();return s&&s.nightMode||null;};
  const active=n=>!!(n&&typeof n==='object'&&typeof n.district==='string'&&!n._v736&&n.district!=='waldo'&&root.__productionDesiredMode!=='goodboys');
  const el=id=>root.document&&root.document.getElementById(id);
  const reduced=()=>!!(root.matchMedia&&root.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const standalone=s=>!!(s&&s.meta&&s.meta._standaloneMode==='nightcrawler');
  const finite=(value,min,max)=>typeof value==='number'&&Number.isFinite(value)&&value>=min&&value<=max;
  const districts=['downtown','longwharf','industrial','wooster','airport','suburbs','home'];
  function validCheckpoint(s){
    const n=s&&s.nightMode;
    if(!standalone(s)||!n||n._v736||n._sector04||n._nightSettled||!districts.includes(n.district)||!finite(n.street,1,n.district==='home'?1:2)||!Number.isInteger(n.street))return false;
    if(!finite(s.day,1,100000)||!finite(s.clock,1080,10000000)||![.7,1,1.3].includes(s.diff)||!Array.isArray(s.map)||!s.map.length||s.gameOver||s.inBattle)return false;
    if(!finite(n.x,-100,1900)||!finite(n.y,-2000,900)||!finite(n.w,1,200)||!finite(n.h,1,200)||!finite(n.hp,.001,10000)||!finite(n.cash,0,100000000)||!Number.isInteger(n.kills)||n.kills<0)return false;
    if(!finite(n.vx,-1000,1000)||!finite(n.vy,-1000,1000)||![-1,1].includes(n.face)||!finite(n.cam,-100,1900))return false;
    if(!n.done||typeof n.done!=='object'||Array.isArray(n.done)||Object.entries(n.done).some(([id,done])=>!districts.includes(id)||done!==true))return false;
    if(!Array.isArray(n.platforms)||n.platforms.length>100||n.platforms.some(p=>!p||!finite(p.x,-100,1900)||!finite(p.y,-2000,900)||!finite(p.w,1,1900)||!finite(p.h,1,200)))return false;
    if(!Array.isArray(n.enemies)||n.enemies.length>100||n.enemies.some(e=>!e||!finite(e.x,-300,2100)||!finite(e.y,-2000,900)||!finite(e.w,1,200)||!finite(e.h,1,200)||!finite(e.hp,-100000,100000)||!finite(e.maxHp,1,100000)||e.hp>e.maxHp||typeof e.alive!=='boolean'||e.alive!==(e.hp>0)||!finite(e.dmg,0,10000)||!finite(e.spd,0,100)||!Array.isArray(e.cash)||e.cash.length!==2||!e.cash.every(v=>finite(v,0,100000))))return false;
    if(n._nightCombat&&!finite(n._nightCombat.time,0,1000000000))return false;
    if(n._nightLifecycle&&!finite(n._nightLifecycle.seconds,0,MINUTE_SECONDS))return false;
    if(n.drive&&(!districts.includes(n.drive.to)||!finite(n.drive.t,0,10000)||!finite(n.drive.dur,1,10000)||n.drive.t>n.drive.dur))return false;
    return ['certs','inv','journal','ach','books','lab','staff','infra'].every(key=>Array.isArray(s[key]))&&['stats','soft','rep'].every(key=>s[key]&&typeof s[key]==='object');
  }
  function checkpointStatus(){
    try{
      const raw=root.localStorage&&root.localStorage.getItem(CHECKPOINT_KEY);
      if(!root.localStorage)return {status:'unavailable',message:'Storage is unavailable. This Night cannot survive a reload.'};
      if(!raw)return {status:'empty'};
      if(raw.length>2000000)return {status:'invalid',message:'The saved Night is too large to restore safely.'};
      const record=JSON.parse(raw);
      if(record&&record.version===CHECKPOINT_VERSION&&record.mode==='nightcrawler'&&record.status==='complete')return {status:'empty'};
      if(!record||record.version!==CHECKPOINT_VERSION||record.mode!=='nightcrawler'||!finite(record.savedAt,1,Number.MAX_SAFE_INTEGER)||!validCheckpoint(record.state))return {status:'invalid',message:'The saved Night has no valid world checkpoint. Start a new Night explicitly to replace it.'};
      return {status:'ready',state:record.state,savedAt:record.savedAt};
    }catch(e){return {status:'invalid',message:'The saved Night could not be read. Your other campaigns are unchanged.'};}
  }
  function normalizedSnapshot(s){
    // Combat targets are object references. Persist the world once, clear queued
    // player actions, and retain enemy reaction timers/damage without replaying a hit.
    const snapshot=JSON.parse(JSON.stringify(s,(key,value)=>key==='_nightCombat'&&value&&Array.isArray(value.events)?Object.assign({},value,{attack:null,grab:null,dash:null,follow:null,events:[],fx:[],hits:0,stage:0,beat:false}):value));
    const n=snapshot.nightMode;
    snapshot.inDialog=false;snapshot.inBattle=false;snapshot.paused=false;snapshot.moving=false;
    n.block=false;n.jHeld=false;n._737sHeld=false;n.dashT=0;n.vx=0;n.jabAnim=0;n.combo=0;n.hitStop=0;
    n.msg='NIGHT RESUMED — your route and rewards are preserved';n.msgT=0;
    if(n._nightLifecycle)n._nightLifecycle.exitCommitted=false;
    for(const e of n.enemies){if(e._nightCombat)e._nightCombat.held=false;}
    return snapshot;
  }
  function writeCheckpoint(record){
    try{if(!root.localStorage)throw new Error('Storage unavailable');root.localStorage.setItem(CHECKPOINT_KEY,JSON.stringify(record));checkpointError=null;root.__nightCheckpointError=null;return true;}
    catch(e){checkpointError='Night progress is not saved. Storage is full or unavailable; keep this tab open and retry.';root.__nightCheckpointError=String(e&&e.message||e);return false;}
  }
  function completeCheckpoint(s){return writeCheckpoint({version:CHECKPOINT_VERSION,mode:'nightcrawler',status:'complete',savedAt:Date.now(),profile:{day:s.day,clock:s.clock,budget:s.budget,diff:s.diff}});}
  function saveCheckpoint(s){
    s=s||state();if(!standalone(s))return false;
    if(!s.nightMode){if(s.meta.nightVisit&&s.meta.nightVisit.active===false)return completeCheckpoint(s);return false;}
    if(!validCheckpoint(s)){checkpointError='Night progress could not be checkpointed safely. Keep this tab open.';root.__nightCheckpointError='invalid-night-world';return false;}
    try{return writeCheckpoint({version:CHECKPOINT_VERSION,mode:'nightcrawler',status:'active',savedAt:Date.now(),state:normalizedSnapshot(s)});}
    catch(e){checkpointError='Night progress could not be checkpointed safely. Keep this tab open.';root.__nightCheckpointError=String(e&&e.message||e);return false;}
  }
  function resumeCheckpoint(){
    const record=checkpointStatus();if(record.status!=='ready'||!root.TechOpsRestoreNightState)return false;
    const restored=normalizedSnapshot(record.state),s=root.TechOpsRestoreNightState(restored);if(!s)return false;
    const n=s.nightMode;try{if(typeof NM!=='undefined')NM=n;}catch(_){}try{root.NM=n;}catch(_){}
    if(root.TechOpsModeShell)root.TechOpsModeShell.enterNight(s);
    n.msgT=(root.performance?root.performance.now():0)+3600;observed=n;chapterKey='';checkpointAge=0;checkpointMark='';resetInput();
    if(root.TechOpsCameraDirector)root.TechOpsCameraDirector.reset('nightcrawler');
    root.__nightCheckpointResumed={savedAt:record.savedAt,district:n.district,street:n.street};return true;
  }
  function checkpointFrame(dt){
    const s=state(),n=world();if(!standalone(s)||!active(n)||n._sector04||blocked())return;
    checkpointAge+=Math.min(.1,Math.max(0,Number(dt)||0));
    const mark=[n.district,n.street,n.cash,n.kills,Object.keys(n.done||{}).join(','),n.drive&&n.drive.to||''].join('|');
    if(checkpointAge>=5||mark!==checkpointMark){saveCheckpoint(s);checkpointAge=0;checkpointMark=mark;}
  }
  function saveAndReturn(){
    if(!saveCheckpoint())return dialog('NIGHT NOT SAVED',checkpointError,[{t:'Retry saving and return',f:saveAndReturn},{t:'Keep playing',f:root.closeDlg}]);
    if(root.closeDlg)root.closeDlg();clearNightSelection();root.__techopsAlternateStartMode=null;
    if(root.location&&root.location.reload)root.location.reload();return true;
  }
  function saveGame(){try{if(typeof save==='function')return save();if(root.save)return root.save();}catch(e){root.__nightSaveError=String(e);}return false;}
  function clockLabel(minutes){const m=((Math.floor(Number(minutes)||0)%1440)+1440)%1440;return String(Math.floor(m/60)).padStart(2,'0')+':'+String(m%60).padStart(2,'0');}
  function resetInput(){
    try{const k=typeof keys!=='undefined'?keys:root.keys;if(k)Object.keys(k).forEach(key=>k[key]=false);}catch(_){}
    try{const j=typeof joy!=='undefined'?joy:root.joy;if(j){j.x=0;j.y=0;}}catch(_){}
    if(root.TechOpsNightInput)root.TechOpsNightInput.reset();
  }
  function beforeEnter(s){
    if(!s||s.nightMode||root.__productionDesiredMode==='goodboys')return;
    s.meta=s.meta||{};
    if(!s.meta.nightVisit||!s.meta.nightVisit.active||s.meta.nightVisit.day!==s.day)
      s.meta.nightVisit={active:true,day:s.day,returnClock:s.meta._char==='nightcrawler'?540:s.clock,clock:Math.max(1080,s.clock||0),weather:s.weather};
    s._modeEpoch=(s._modeEpoch||0)+1;
  }
  function onEntered(s,n){
    if(!s||!active(n))return;
    const visit=s.meta&&s.meta.nightVisit;
    if(visit&&visit.active&&visit.day===s.day)s.clock=Math.max(s.clock||1080,Number(visit.clock)||1080);
    n._nightLifecycle={seconds:0,weather:'rain',exitCommitted:false};
    ['toast','chaos-banner'].forEach(id=>{const item=el(id);if(item)item.classList.add('hidden');});
    resetInput();observed=n;chapterKey='';
    if(root.dispatchEvent&&root.CustomEvent)root.dispatchEvent(new root.CustomEvent('techops:night-entered',{detail:{state:s,night:n}}));
  }
  function advance(minutes){
    const s=state(),n=world(),amount=Number(minutes);
    if(!s||!active(n)||!Number.isFinite(amount)||amount<=0)return false;
    s.clock=(Number(s.clock)||1080)+amount;
    if(s.meta&&s.meta.nightVisit)s.meta.nightVisit.clock=s.clock;
    return true;
  }
  function visible(id){const item=el(id);if(!item||item.hidden||item.classList.contains('hidden'))return false;const st=root.getComputedStyle?root.getComputedStyle(item):item.style;return !st||(st.display!=='none'&&st.visibility!=='hidden');}
  function blocked(){
    const s=state();
    return !s||!!(s.inDialog||s.inBattle||s.paused||s.gameOver||transition||root.document&&root.document.hidden||['panel','eod','v67-settings'].some(visible)||root.TechOpsPresentationDirector&&root.TechOpsPresentationDirector.isBlocking());
  }
  function tick(dt){
    const s=state(),n=world();if(!s||!active(n)||blocked())return false;
    if(!n._nightLifecycle)onEntered(s,n);
    const raw=Number(dt),delta=Number.isFinite(raw)?Math.min(.1,Math.max(0,raw)):0,rt=n._nightLifecycle;
    rt.seconds+=delta;
    while(rt.seconds+1e-9>=MINUTE_SECONDS){rt.seconds=Math.max(0,rt.seconds-MINUTE_SECONDS);advance(1);if(Math.floor(s.clock)%12===0)saveGame();}
    return true;
  }
  function atHome(){const n=world();return !!(active(n)&&!n._sector04&&n.district==='home'&&!n.drive&&Math.abs(n.x+n.w/2-HOME_X)<=86&&Math.abs(n.y+n.h-FLOOR)<=22);}
  function clearNightSelection(){
    const s=state(),router=root.TechOpsProductionModeRouter;
    if(router&&router.setDesired)router.setDesired(null);
    root.__productionDesiredMode=null;root.__productionActiveMode='day';root.__v737NightStartIntent=false;
    try{if(root.localStorage&&root.localStorage.getItem('techops_char')==='nightcrawler')root.localStorage.removeItem('techops_char');}catch(_){}
    if(s&&s.meta&&s.meta._char==='nightcrawler')delete s.meta._char;
  }
  function restoreDayShell(){
    clearNightSelection();
    ['hud','dialogue','panel','battle','eod','quest-tracker'].forEach(id=>{const item=el(id);if(item){item.style.removeProperty('display');item.style.removeProperty('visibility');}});
    if(el('hud'))el('hud').classList.remove('hidden');
    if(el('v55-nmbtns'))el('v55-nmbtns').classList.remove('on');
    if(el('tb-interact')){el('tb-interact').textContent='A';el('tb-interact').dataset.v55='false';}
    if(ui)ui.host.hidden=true;
    resetInput();if(root.TechOpsNightInput)root.TechOpsNightInput.sync();
  }
  function endVisit(s){if(s&&s.meta&&s.meta.nightVisit)s.meta.nightVisit.active=false;if(s)s._modeEpoch=(s._modeEpoch||0)+1;restoreDayShell();observed=null;chapterKey='';}
  function detachNight(){
    const s=state(),n=world();if(!s||!active(n))return false;
    if(root.TechOpsNightCombat)root.TechOpsNightCombat.cancel(n);
    if(!n._nightSettled){s.budget=(s.budget||0)+(n.cash||0);n._nightSettled=true;}
    if(el('quest-tracker')&&!n._qtHidden)el('quest-tracker').classList.remove('hidden');
    s.nightMode=null;try{if(typeof NM!=='undefined')NM=null;}catch(_){}try{root.NM=null;}catch(_){}
    s.inDialog=false;endVisit(s);
    if(root.TechOpsModeShell&&root.TechOpsModeShell.exitNight)root.TechOpsModeShell.exitNight(s);
    return true;
  }
  function campaignState(){try{return root.TechOpsCampaign&&root.TechOpsCampaign.load(root.localStorage);}catch(e){root.__nightCampaignError=String(e);return null;}}
  function resumeDay(){
    const s=state(),n=world();if(!s||!active(n)||standalone(s))return false;
    const c=campaignState(),visit=s.meta&&s.meta.nightVisit;if(!c)return false;
    if(n._sector04&&root.TechOpsSector04Runtime){root.TechOpsSector04Runtime.retreatToDayInvestigation(c,n);root.TechOpsCampaign.save(c,root.localStorage);}
    const tuesday=!!c.flags.tuesday_morning_reached;
    return playTransition(tuesday?'night_sector_dawn':'night_return_investigation',()=>{
      detachNight();
      const targetDay=c.campaign&&c.campaign.day||visit&&visit.day||s.day,rebuild=s.day!==targetDay;
      s.day=targetDay;s.clock=tuesday?540:visit&&visit.returnClock<1020?visit.returnClock:540;
      if(rebuild&&root.setupDay)root.setupDay();
      if(!rebuild&&visit&&visit.weather)s.weather=visit.weather;
      if(root.TechOpsCampaignNativeAct1)root.TechOpsCampaignNativeAct1.ensureWorld();
      if(root.updateHUD)root.updateHUD();saveGame();
    });
  }
  function dialog(title,text,options){if(!root.dlg)return false;const box=el('dialogue');if(box){box.style.removeProperty('display');box.style.removeProperty('visibility');}root.dlg(title,text,options);return true;}
  function openCampaign(){
    if(!active(world())||transition)return false;
    if(standalone(state()))return dialog('AFTER HOURS — STANDALONE RUN','Your Night route saves separately. Return to the title to continue the Day campaign; this free roam run cannot change its story objectives.',[{t:'Save Night and return to title',f:saveAndReturn},{t:'Back to the street',f:root.closeDlg}]);
    const c=campaignState();if(!c)return dialog('NIGHT WALKER // CAMPAIGN','Campaign data is unavailable. Your progress has not been changed.',[{t:'Back',f:root.closeDlg}]);
    const f=c.flags,options=[],evidence=c.evidence&&c.evidence.ghostIdentityEvidence;let text;
    if(f.tuesday_morning_reached){text='<b>AFTER HOURS — COMPLETE</b><br>The next campaign beat continues in the day shift. Your evidence and choices are preserved.';options.push({t:'Return to the day campaign',f:resumeDay});}
    else if(!f.day_work_unlocked){text='<b>CHAPTER I — AFTER HOURS</b><br>Complete the Day 1 standup and workstation opening to unlock Sector 04. Free roam is not the story campaign.';options.push({t:'Resume the daytime opening',f:resumeDay});}
    else{
      text='<b>CHAPTER I — AFTER HOURS // SECTOR 04</b><br>Observe → investigate → reveal the dependency → sever → verify.<br><br>'+(evidence&&evidence.status==='established'?'Identity evidence recorded. Trace the controller.':'Identity evidence missing. Investigate Impossible Access in Security Ops; damage alone cannot resolve this encounter.');
      if(root.TechOpsSector04Runtime)options.push({t:world()._sector04?'Continue Sector 04 investigation':'Enter Sector 04 — story campaign',f:()=>{if(root.closeDlg)root.closeDlg();root.TechOpsSector04Runtime.enterBrowser();}});
      options.push({t:'Return to daytime investigation',f:resumeDay});
    }
    options.push({t:'Back to Night Walker',f:root.closeDlg});return dialog('NIGHT WALKER // CAMPAIGN',text,options);
  }
  function openHome(){
    const n=world();if(!atHome()||transition||n._nightLifecycle&&n._nightLifecycle.exitCommitted)return false;
    const solo=standalone(state());
    return dialog("MIKE'S HOUSE",'The porch light is still on. The city can wait.<br><br>'+(solo?'Sleep finishes this standalone Night and returns to the title with your debrief. Your Day campaign stays separate.':'Sleep ends this night through the normal day review. Campaign progress is kept; sleeping does not complete story objectives.'),[
      {t:solo?'Sleep — finish this Night run':'Sleep — return to day mode',f:sleep},{t:solo?'Open the run menu':'Read the campaign journal',f:openCampaign},{t:'Stay out tonight',f:root.closeDlg}
    ]);
  }
  function sleep(){if(!atHome())return false;return playTransition('night_home_return',()=>root.exitNight(true));}
  function syncTransitionControls(token){
    if(!token||token!==transition||token.completed||!root.document)return;
    const overlay=el('v725-cine'),shared=overlay&&overlay.querySelector('.day-cine-touch');
    if(shared){
      const fallback=token.fallback;
      if(fallback){
        const hadFocus=root.document.activeElement===fallback;fallback.remove();token.fallback=null;
        const next=shared.querySelector('.day-cine-pause');if(hadFocus&&next&&!root.document.hidden)next.focus({preventScroll:true});
      }
      return;
    }
    if(token.fallback)return;
    const b=root.document.createElement('button');b.id='night-home-skip';b.type='button';b.textContent='Skip transition';
    b.onclick=()=>{
      if(token.completed||transition!==token||state()!==token.state||world()!==token.night||root.document.hidden||root.v725!==token.renderer)return;
      if(token.renderer&&typeof token.renderer.skip==='function')token.renderer.skip();
    };
    token.fallback=b;(overlay||root.document.body).appendChild(b);b.focus({preventScroll:true});
  }
  function playTransition(id,done){
    const s=state(),n=world();if(!active(n)||transition)return false;
    if(root.closeDlg)root.closeDlg();
    const director=root.TechOpsPresentationDirector,claim=director&&director.begin({id,owner:'runtime_night',mode:'nightcrawler',kind:'transition',blocking:true});
    if(director&&!claim)return false;
    const token={serial:++tokenSerial,state:s,night:n,claim,completed:false};transition=token;s.inDialog=true;resetInput();
    function finish(){
      if(token.completed)return;token.completed=true;
      if(director&&claim)director.end(claim,'completed');if(transition===token)transition=null;
      if(token.fallback){token.fallback.remove();token.fallback=null;}
      if(state()!==s||world()!==n)return;
      s.inDialog=false;resetInput();done();
    }
    token.finish=finish;
    try{
      if(root.v725&&root.v725.play&&registerScenes()&&root.v725.play(id,finish)){
        token.renderer=root.v725;syncTransitionControls(token);return true;
      }
    }catch(e){root.__nightCinematicError=String(e);}
    return dialog('HOME / MORNING','The night gives way to morning.',[{t:'Continue to day mode',f:()=>{if(root.closeDlg)root.closeDlg();finish();}}]);
  }
  function house(x,door,floor,scale,dawn){
    x.save();x.translate(door,floor);x.scale(scale,scale);
    x.fillStyle=dawn?'#32445a':'#111e32';x.fillRect(-130,-180,290,180);
    x.fillStyle=dawn?'#1e2b40':'#09121f';x.beginPath();x.moveTo(-155,-180);x.lineTo(10,-257);x.lineTo(180,-180);x.fill();
    x.fillStyle='#384453';for(let y=-168;y<-8;y+=20)x.fillRect(-125,y,280,2);
    x.fillStyle='#f5ce87';x.fillRect(-90,-133,46,55);x.fillRect(78,-133,46,55);
    x.fillStyle='#394352';x.fillRect(-69,-133,4,55);x.fillRect(99,-133,4,55);
    x.fillStyle='#283c4b';x.fillRect(-22,-100,48,100);x.strokeStyle='#a4bac5';x.strokeRect(-22,-100,48,100);
    x.fillStyle='#ffdb97';x.fillRect(16,-46,4,4);x.fillRect(-6,-116,16,9);
    x.fillStyle='rgba(255,215,143,.12)';x.beginPath();x.moveTo(2,-105);x.lineTo(-58,7);x.lineTo(64,7);x.fill();
    x.fillStyle='#9dacb7';x.fillRect(-32,-4,68,4);x.restore();
  }
  function drawHome(x,n){if(!x||!active(n)||n.district!=='home')return;const painted=root.TechOpsSceneArt&&root.TechOpsSceneArt.ready(n);if(!painted)house(x,HOME_X-(n.cam||0),FLOOR,1,false);x.save();x.textAlign='center';x.font='bold 13px monospace';x.fillStyle='#ffe6b7';if(!painted)x.fillText("MIKE'S HOUSE",HOME_X-(n.cam||0),FLOOR-272);if(atHome()){x.font='12px monospace';x.fillText('E / A — ENTER',HOME_X-(n.cam||0),FLOOR-135);}x.restore();}
  function registerScenes(){
    const cine=root.v725;if(!cine||!cine.register||!cine.h)return false;
    const h=cine.h,small=reduced(),duration=small?1100:2200;
    const exterior=(x,tm,local)=>{h.bg(x,'#090f1b');h.cityGlow(x,small?0:tm);house(x,845,570,1.7,false);h.mike(x,'right0',515+(small?0:Math.min(130,local/15)),575,138);if(root.nmCar)root.nmCar(x,285,570,270,small?0:tm);};
    const interior=x=>{h.bg(x,'#101827');h.panel(x,370,170,530,365,'#202c3d');x.fillStyle='#b38a5e';x.fillRect(465,450,375,14);x.fillStyle='#ebc98b';x.fillRect(710,280,85,65);x.fillStyle='#596378';x.fillRect(750,345,7,102);h.mike(x,'down0',575,470,155);};
    const dawn=x=>{const g=x.createLinearGradient(0,64,0,650);g.addColorStop(0,'#233c62');g.addColorStop(1,'#dda976');x.fillStyle=g;x.fillRect(0,64,1280,592);house(x,680,600,1.7,true);h.txt(x,'MORNING',220,185,28,'#fff0d5','center',true);h.txt(x,'A new shift. The same unfinished questions.',640,615,18,'#fff0d5','center',true);};
    const specs=[['night_home_return','HOME BEFORE MORNING','The key turns. The city stays outside.','Mike sets the night down, one piece at a time.'],['night_return_investigation','BACK TO THE INVESTIGATION','Some answers are not out here in the dark.','Return to the day shift. The evidence is still waiting.'],['night_sector_dawn','AFTER HOURS / TUESDAY','One violin note behind a locked door. Then silence.','YOU ARE FIXING THE SYMPTOMS.  Mike: Then show me the problem.']];
    specs.forEach(([id,title,first,second])=>cine.register(id,{title,cues:{0:'silence',1:'silence',2:'silence'},shots:[{dur:duration,cap:first,draw:exterior},{dur:duration,cap:second,draw:interior},{dur:duration,cap:'Morning comes. The queue is waiting.',draw:dawn}]}));return true;
  }
  function ensureUI(){
    if(ui||!root.document||!root.document.body)return ui;
    const style=root.document.createElement('style');style.id='night-lifecycle-style';style.textContent=`
#night-runtime-ui[hidden],#night-runtime-ui [hidden]{display:none!important}
#night-runtime-ui{position:absolute;inset:0;pointer-events:none;z-index:58;--night-hud-safe-top:env(safe-area-inset-top,0px);--night-hud-safe-right:env(safe-area-inset-right,0px);--night-hud-safe-bottom:env(safe-area-inset-bottom,0px);--night-hud-safe-left:env(safe-area-inset-left,0px)}
#night-hud-safe-area{position:absolute;left:0;top:0;width:0;height:0;visibility:hidden;pointer-events:none;box-sizing:content-box;padding:var(--night-hud-safe-top) var(--night-hud-safe-right) var(--night-hud-safe-bottom) var(--night-hud-safe-left)}
#night-campaign,#night-home-interact,#night-home-skip{pointer-events:auto;min-height:44px;border:1px solid #859ba8;border-radius:5px;background:#0b1525ed;color:#e2edf0;padding:10px 15px;font:12px monospace;cursor:pointer}
#night-campaign{position:absolute;right:max(12px,env(safe-area-inset-right));top:70px}
#night-runtime-ui #night-campaign[data-readable-hud="true"]{box-sizing:border-box;width:122px;min-width:122px;max-width:none!important;height:44px;min-height:44px!important;padding:6px!important;font:13px/1.15 monospace!important;white-space:nowrap;opacity:1!important}
#night-home-interact{position:absolute;bottom:max(165px,env(safe-area-inset-bottom));left:50%;transform:translateX(-50%)}
#night-home-skip{position:fixed;right:16px;top:max(62px,env(safe-area-inset-top));z-index:2147483647}
#night-checkpoint-status{position:absolute;left:12px;right:12px;bottom:max(112px,env(safe-area-inset-bottom));color:#ffe0a2;background:#251b15ed;padding:8px;font:12px/1.4 monospace;text-align:center}
#night-chapter{position:absolute;top:140px;left:50%;transform:translateX(-50%);width:min(70%,570px);text-align:center;background:linear-gradient(90deg,transparent,#081020de,transparent);color:#e9e9de;padding:14px;font:18px/1.5 monospace;letter-spacing:2px;transition:opacity .6s}
/* The short landscape title must scroll rather than clip its mode buttons. */
#title-screen{overflow-y:auto;touch-action:pan-y;overscroll-behavior:contain;justify-content:flex-start;padding-top:max(20px,env(safe-area-inset-top));padding-bottom:max(24px,env(safe-area-inset-bottom))}
#title-screen>*{flex-shrink:0}
#title-screen>:first-child{margin-top:auto}#title-screen>:last-child{margin-bottom:auto}
@media(max-height:500px){#title-screen{gap:10px}#title-logo .t-line1{font-size:28px}#title-logo .t-line2{font-size:36px}#title-screen .big-btn{padding:10px 24px}}
@media(max-width:650px){#night-campaign{top:64px;font-size:11px;padding:8px}#night-chapter{font-size:13px}}
@media(prefers-reduced-motion:reduce){#night-chapter{transition:none}}
`;
    root.document.head.appendChild(style);
    const host=root.document.createElement('div');host.id='night-runtime-ui';host.hidden=true;
    const safeArea=root.document.createElement('div');safeArea.id='night-hud-safe-area';safeArea.setAttribute('aria-hidden','true');
    const campaign=root.document.createElement('button');campaign.id='night-campaign';campaign.textContent='CAMPAIGN [C]';campaign.onclick=openCampaign;
    const home=root.document.createElement('button');home.id='night-home-interact';home.textContent="Enter Mike's house";home.onclick=openHome;
    const chapter=root.document.createElement('div');chapter.id='night-chapter';chapter.setAttribute('aria-live','polite');
    const checkpoint=root.document.createElement('div');checkpoint.id='night-checkpoint-status';checkpoint.setAttribute('role','status');checkpoint.hidden=true;
    host.append(safeArea,campaign,home,chapter,checkpoint);(el('game-wrap')||root.document.body).appendChild(host);ui={host,campaign,home,chapter,checkpoint};return ui;
  }
  function presentation(dt){
    const n=world(),view=ensureUI();if(!view)return;
    const shown=active(n)&&!blocked();view.host.hidden=!shown;view.home.hidden=!atHome();
    view.campaign.textContent=standalone(state())?'RUN MENU [C]':'CAMPAIGN [C]';
    // The canvas HUD reserves this DOM control's exact CSS rectangle. Compute
    // directly from the shared passive layout so startup/rotation cannot use a
    // stale prior-frame receipt, and retain the original campaign click owner.
    const hud=root.TechOpsRuntimeHud,canvas=typeof cv!=='undefined'?cv:root.cv||el('game');
    if(hud&&canvas&&hud.handles(n)){
      const menu=hud.layout(hud.viewport(canvas)).menu,rect=canvas.getBoundingClientRect&&canvas.getBoundingClientRect(),host=view.host.getBoundingClientRect&&view.host.getBoundingClientRect();
      view.campaign.setAttribute('data-readable-hud','true');
      view.campaign.style.left=(menu.x+(rect&&host?rect.left-host.left:0))+'px';view.campaign.style.top=(menu.y+(rect&&host?rect.top-host.top:0))+'px';view.campaign.style.right='auto';
    }else{
      view.campaign.setAttribute('data-readable-hud','false');
      ['left','top','right'].forEach(key=>view.campaign.style.removeProperty(key));
    }
    view.checkpoint.hidden=!checkpointError||!standalone(state());view.checkpoint.textContent=checkpointError||'';
    if(!active(n))return;
    const key=n.district+':'+n.street;if(key!==chapterKey){chapterKey=key;chapterAge=0;const d=root.TechOpsNightDistricts&&root.TechOpsNightDistricts[n.district];view.chapter.textContent=n._sector04?'CHAPTER I — AFTER HOURS / SECTOR 04':n.district==='home'?"HOME STREET / MIKE'S HOUSE":(d&&d.name||n.district.toUpperCase())+' / STREET '+n.street;}
    if(shown)chapterAge+=Math.min(.1,Math.max(0,Number(dt)||0));view.chapter.style.opacity=chapterAge<2.6?'1':'0';
    if(el('v55-nmbtns'))el('v55-nmbtns').classList.toggle('on',shown);
    if(root.TechOpsNightInput)root.TechOpsNightInput.sync();
    else if(el('tb-interact'))el('tb-interact').textContent=atHome()?'A':'👊';
  }
  function frame(dt){
    const s=state(),n=world();
    if(transition&&(transition.state!==s||transition.night!==n))transition.finish();
    if(transition&&transition.renderer)syncTransitionControls(transition);
    if(!s||!active(n)){if(ui)ui.host.hidden=true;if(s&&s.meta&&s.meta.nightVisit&&visible('eod')){if(root.draw)root.draw();return true;}return false;}
    if(observed!==n){if(!n._nightLifecycle)onEntered(s,n);observed=n;}
    // Repair only a flag with no visible modal/claim before deciding to pause.
    // The older dispatch paused before the guard could perform this repair.
    const guard=root.TechOpsProductionWrapperGuard;if(guard&&guard.repairStaleDialog)guard.repairStaleDialog();
    if(tick(dt)&&root.stepNM)root.stepNM(dt);
    if(active(world())){
      ensureUI(); // Resolve safe-area padding before the first canvas HUD draw.
      if(root.drawNM)root.drawNM();
      checkpointFrame(dt);
      presentation(dt);
      // The recovery compositor may step only when this authoritative frame
      // heartbeat is stale. Stamp after a successful Night render.
      root.__nightRuntimeLastOk=Date.now?Date.now():0;
    }else{if(ui)ui.host.hidden=true;if(root.draw)root.draw();}
    return true;
  }
  function install(){
    if(installed)return;installed=true;
    const oldClock=root.advanceClock;if(oldClock)root.advanceClock=function(minutes){if(active(world()))return advance(minutes);return oldClock.apply(this,arguments);};
    if(root.fmtClock)root.fmtClock=clockLabel;
    const oldInteract=root.interact;if(oldInteract)root.interact=function(){if(atHome()&&!blocked())return openHome();return oldInteract.apply(this,arguments);};
    const oldExit=root.exitNight;if(oldExit)root.exitNight=function(){
      const n=world();if(!active(n))return n?oldExit.apply(this,arguments):false;
      n._nightLifecycle=n._nightLifecycle||{};if(n._nightLifecycle.exitCommitted)return false;
      // Retire the recovery snapshot before reward settlement. If storage fails,
      // no completed-run claim is made and a reload cannot pay the same run twice.
      if(standalone(state())&&!completeCheckpoint(state())){const homeSafe=arguments[0];dialog('NIGHT RESULT NOT SAVED',checkpointError,[{t:'Retry saving this result',f:()=>{if(root.closeDlg)root.closeDlg();root.exitNight(homeSafe);}}]);return false;}
      n._nightLifecycle.exitCommitted=true;clearNightSelection();return oldExit.apply(this,arguments);
    };
    const oldCar=root.nmCarMenu;if(oldCar)root.nmCarMenu=function(){const result=oldCar.apply(this,arguments),options=el('dlg-options');if(active(world())&&!world()._sector04&&options&&!el('night-campaign-route')){const b=root.document.createElement('button');b.id='night-campaign-route';b.textContent='CAMPAIGN — After Hours / Sector 04';b.onclick=openCampaign;options.prepend(b);}return result;};
    if(root.document)root.document.addEventListener('keydown',e=>{if(!active(world()))return;if(transition&&e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();if(root.v725)root.v725.skip();return;}if(blocked())return;if(e.key.toLowerCase()==='c'){e.preventDefault();e.stopImmediatePropagation();openCampaign();}else if(atHome()&&e.key.toLowerCase()==='e'){e.preventDefault();e.stopImmediatePropagation();openHome();}},true);
    if(root.addEventListener)root.addEventListener('pagehide',()=>{if(standalone(state())&&active(world()))saveCheckpoint();});
    if(root.document)root.document.addEventListener('visibilitychange',()=>{if(root.document.hidden&&standalone(state())&&active(world()))saveCheckpoint();});
    registerScenes();ensureUI();
  }
  root.TechOpsNightRuntime={VERSION:3,MINUTE_SECONDS,HOME_X,CHECKPOINT_KEY,CHECKPOINT_VERSION,checkpointStatus,saveCheckpoint,resumeCheckpoint,saveAndReturn,active,state,world,beforeEnter,onEntered,advance,clockLabel,tick,frame,blocked,atHome,openHome,sleep,openCampaign,resumeDay,restoreDayShell,endVisit,drawHome,registerScenes,install,health:()=>({active:active(world()),transitioning:!!transition,clock:state()&&state().clock,returnDay:state()&&state().meta&&state().meta.nightVisit&&state().meta.nightVisit.day,checkpointError})};
  if(typeof module!=='undefined'&&module.exports)module.exports=root.TechOpsNightRuntime;
  if(root.document&&root.document.readyState==='loading')root.document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})(typeof globalThis!=='undefined'?globalThis:this);
