/* Night Walker lifecycle. One main-frame clock and compositor dispatch.
 * Campaign facts remain in campaign_*; Good Dogs retains its own runtime.
 * Replaces the competing TechOpsNightFlow/TechOpsNightSession implementations.
 */
(function(root){
  'use strict';
  if(!root||root.TechOpsNightRuntime)return;
  const MINUTE_SECONDS=5,HOME_X=1500,FLOOR=430;
  let installed=false,transition=null,observed=null,chapterAge=0,chapterKey='',ui=null,tokenSerial=0;
  const state=()=>{try{return typeof S!=='undefined'?S:root.S;}catch(_){return root.S;}};
  const world=()=>{const s=state();return s&&s.nightMode||null;};
  const active=n=>!!(n&&typeof n==='object'&&typeof n.district==='string'&&!n._v736&&(n.district!=='waldo'||n.drive)&&root.__productionDesiredMode!=='goodboys');
  const el=id=>root.document&&root.document.getElementById(id);
  const reduced=()=>!!(root.matchMedia&&root.matchMedia('(prefers-reduced-motion: reduce)').matches);
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
    while(rt.seconds+1e-9>=MINUTE_SECONDS){rt.seconds-=MINUTE_SECONDS;advance(1);if(Math.floor(s.clock)%12===0)saveGame();}
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
    s.inDialog=false;endVisit(s);return true;
  }
  function campaignState(){try{return root.TechOpsCampaign&&root.TechOpsCampaign.load(root.localStorage);}catch(e){root.__nightCampaignError=String(e);return null;}}
  function resumeDay(){
    const s=state(),n=world();if(!s||!active(n))return false;
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
      if(tuesday&&root.TechOpsCampaignNativeAct2)root.TechOpsCampaignNativeAct2.ensureWorld();
      if(root.updateHUD)root.updateHUD();saveGame();
    });
  }
  function dialog(title,text,options){if(!root.dlg)return false;const box=el('dialogue');if(box){box.style.removeProperty('display');box.style.removeProperty('visibility');}root.dlg(title,text,options);return true;}
  function openCampaign(){
    if(world()?.drive)return false;
    if(!active(world())||transition)return false;
    if(root.TechOpsNightCampaign)return root.TechOpsNightCampaign.open(world(),resumeDay);
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
    return dialog("MIKE'S HOUSE",'The porch light is still on. The city can wait.<br><br>Sleep ends this night through the normal day review. Campaign progress is kept; sleeping does not complete story objectives.',[
      {t:'Sleep — return to day mode',f:sleep},{t:'Read the campaign journal',f:openCampaign},{t:'Stay out tonight',f:root.closeDlg}
    ]);
  }
  function sleep(){if(!atHome())return false;return playTransition('night_home_return',()=>root.exitNight(true));}
  function playTransition(id,done){
    const s=state(),n=world();if(!active(n)||transition)return false;
    if(root.closeDlg)root.closeDlg();
    const director=root.TechOpsPresentationDirector,claim=director&&director.begin({id,owner:'runtime_night',mode:'nightcrawler',kind:'transition',blocking:true});
    if(director&&!claim)return false;
    const token={serial:++tokenSerial,state:s,night:n,claim,completed:false};transition=token;s.inDialog=true;resetInput();
    function finish(){
      if(token.completed)return;token.completed=true;
      if(director&&claim)director.end(claim,'completed');if(transition===token)transition=null;
      if(el('night-home-skip'))el('night-home-skip').remove();
      if(state()!==s||world()!==n)return;
      s.inDialog=false;resetInput();done();
    }
    token.finish=finish;
    try{
      if(root.v725&&root.v725.play&&registerScenes()&&root.v725.play(id,finish)){
        if(root.document){const b=root.document.createElement('button');b.id='night-home-skip';b.textContent='Skip transition';b.onclick=()=>root.v725.skip();root.document.body.appendChild(b);b.focus();}return true;
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
#night-runtime-ui{position:absolute;inset:0;pointer-events:none;z-index:58}
#night-campaign,#night-home-interact,#night-home-skip{pointer-events:auto;min-height:44px;border:1px solid #859ba8;border-radius:5px;background:#0b1525ed;color:#e2edf0;padding:10px 15px;font:12px monospace;cursor:pointer}
#night-campaign{position:absolute;left:max(12px,env(safe-area-inset-left));right:max(12px,env(safe-area-inset-right));top:76px;max-width:540px;text-align:left;line-height:1.35}
#night-home-interact{position:absolute;bottom:max(165px,env(safe-area-inset-bottom));left:50%;transform:translateX(-50%)}
#night-home-skip{position:fixed;right:16px;top:max(62px,env(safe-area-inset-top));z-index:2147483647}
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
    const campaign=root.document.createElement('button');campaign.id='night-campaign';campaign.textContent='CAMPAIGN [C]';campaign.onclick=openCampaign;
    const home=root.document.createElement('button');home.id='night-home-interact';home.textContent="Enter Mike's house";home.onclick=openHome;
    const chapter=root.document.createElement('div');chapter.id='night-chapter';chapter.setAttribute('aria-live','polite');host.append(campaign,home,chapter);(el('game-wrap')||root.document.body).appendChild(host);ui={host,campaign,home,chapter};return ui;
  }
  function presentation(dt){
    const n=world(),view=ensureUI();if(root.TechOpsNightTravel)root.TechOpsNightTravel.syncUI(n);if(!view)return;
    const shown=active(n)&&!blocked()&&!n.drive;view.host.hidden=!shown;view.home.hidden=!atHome();
    if(!active(n))return;
    if(root.TechOpsNightCampaign){
      const label='STORY · '+root.TechOpsNightCampaign.summary().title;
      if(view.campaign.textContent!==label)view.campaign.textContent=label;
      view.campaign.setAttribute('aria-label','Open Night Walker campaign journal');
    }
    const key=n.district+':'+n.street+':'+(n.location||'street');if(key!==chapterKey){chapterKey=key;chapterAge=0;const d=root.TechOpsNightDistricts&&root.TechOpsNightDistricts[n.district];view.chapter.textContent=n._sector04?'CHAPTER I — AFTER HOURS / SECTOR 04':n.district==='home'?"HOME STREET / MIKE'S HOUSE":(d&&d.name||n.district.toUpperCase())+(n.location==='exterior'?' / PARKED OUTSIDE':n.location==='interior'?' / INSIDE / FLOOR '+n.street:' / STREET '+n.street);}
    if(shown)chapterAge+=Math.min(.1,Math.max(0,Number(dt)||0));view.chapter.style.opacity=chapterAge<2.6?'1':'0';
    if(el('v55-nmbtns'))el('v55-nmbtns').classList.toggle('on',shown);
    if(root.TechOpsNightInput)root.TechOpsNightInput.sync();
    else if(el('tb-interact'))el('tb-interact').textContent=atHome()?'A':'👊';
  }
  function frame(dt){
    const s=state(),n=world();
    if(transition&&(transition.state!==s||transition.night!==n))transition.finish();
    if(!s||!active(n)){if(root.TechOpsNightTravel)root.TechOpsNightTravel.syncUI(null);if(ui)ui.host.hidden=true;if(s&&s.meta&&s.meta.nightVisit&&visible('eod')){if(root.draw)root.draw();return true;}return false;}
    if(observed!==n){if(!n._nightLifecycle)onEntered(s,n);observed=n;}
    // Repair only a flag with no visible modal/claim before deciding to pause.
    // The older dispatch paused before the guard could perform this repair.
    const guard=root.TechOpsProductionWrapperGuard;if(guard&&guard.repairStaleDialog)guard.repairStaleDialog();
    if(tick(dt)){if(n.drive&&root.TechOpsNightTravel)root.TechOpsNightTravel.step(n,dt,typeof keys!=='undefined'?keys:root.keys,typeof joy!=='undefined'?joy:root.joy);else if(root.stepNM){root.stepNM(dt);root.TechOpsNightCampaign?.step(world(),dt);}}
    if(active(world())){if(world().drive&&root.TechOpsNightTravel)root.TechOpsNightTravel.draw(typeof ctx!=='undefined'?ctx:root.ctx,world(),root.performance.now());else if(root.drawNM)root.drawNM();presentation(dt);}else{if(ui)ui.host.hidden=true;if(root.draw)root.draw();}
    return true;
  }
  function install(){
    if(installed)return;installed=true;
    const oldClock=root.advanceClock;if(oldClock)root.advanceClock=function(minutes){if(active(world()))return advance(minutes);return oldClock.apply(this,arguments);};
    if(root.fmtClock)root.fmtClock=clockLabel;
    const oldInteract=root.interact;if(oldInteract)root.interact=function(){if(!blocked()&&root.TechOpsNightCampaign?.interact(world()))return true;if(!blocked()&&root.TechOpsNightTravel?.interact(world()))return true;if(atHome()&&!blocked())return openHome();return oldInteract.apply(this,arguments);};
    const oldExit=root.exitNight;if(oldExit)root.exitNight=function(){const n=world();if(!active(n))return n?oldExit.apply(this,arguments):false;n._nightLifecycle=n._nightLifecycle||{};if(n._nightLifecycle.exitCommitted)return false;n._nightLifecycle.exitCommitted=true;clearNightSelection();return oldExit.apply(this,arguments);};
    const oldCar=root.nmCarMenu;if(oldCar)root.nmCarMenu=function(){const result=oldCar.apply(this,arguments),options=el('dlg-options');if(active(world())&&!world()._sector04&&options&&!el('night-campaign-route')){const b=root.document.createElement('button');b.id='night-campaign-route';b.textContent='CAMPAIGN — After Hours / Sector 04';b.onclick=openCampaign;options.prepend(b);}return result;};
    if(root.document)root.document.addEventListener('keydown',e=>{if(!active(world()))return;if(transition&&e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();if(root.v725)root.v725.skip();return;}if(blocked())return;if(world().drive)return;if(e.key.toLowerCase()==='c'){e.preventDefault();e.stopImmediatePropagation();openCampaign();}else if(atHome()&&e.key.toLowerCase()==='e'){e.preventDefault();e.stopImmediatePropagation();openHome();}},true);
    registerScenes();ensureUI();
  }
  root.TechOpsNightRuntime={VERSION:2,MINUTE_SECONDS,HOME_X,active,state,world,beforeEnter,onEntered,advance,clockLabel,tick,frame,blocked,atHome,openHome,sleep,openCampaign,resumeDay,restoreDayShell,endVisit,drawHome,registerScenes,install,health:()=>({active:active(world()),transitioning:!!transition,clock:state()&&state().clock,returnDay:state()&&state().meta&&state().meta.nightVisit&&state().meta.nightVisit.day})};
  if(typeof module!=='undefined'&&module.exports)module.exports=root.TechOpsNightRuntime;
  if(root.document&&root.document.readyState==='loading')root.document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})(typeof globalThis!=='undefined'?globalThis:this);
