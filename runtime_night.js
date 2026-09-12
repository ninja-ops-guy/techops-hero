/* TechOps Hero — Night Walker cinematic flow authority v1.
 * Adds flowing night time, intentional home/day transition, campaign discovery,
 * and day-state isolation without creating a parallel save/campaign authority.
 */
(function(root){
  "use strict";
  if(!root||root.TechOpsNightFlow)return;

  var VERSION=1;
  var BUILD="20260912-night-flow-r2";
  var RULES={secondsPerMinute:2,maxFrameSeconds:.25,homeX:1560,homeRearmX:1480};
  var STREETS={downtown:1,longwharf:1,industrial:1,wooster:1,airport:1,suburbs:1,home:1,sector04:1};
  var activeScene=null,installed=false,wrappers={},heartbeatTimer=null,lastHeartbeat=0;

  function state(){try{return root.S||((typeof S!=="undefined")?S:null);}catch(e){return root.S||null;}}
  function world(){try{return root.NM||((typeof NM!=="undefined")?NM:null);}catch(e){return root.NM||null;}}
  function now(){try{return root.performance&&root.performance.now?root.performance.now():Date.now();}catch(e){return Date.now();}}
  function flow(n){if(!n)return{};if(!n._nightFlow||typeof n._nightFlow!=="object")n._nightFlow={};return n._nightFlow;}
  function ownsClock(s,n){return !!(s&&n&&s.nightMode===n&&!n._v736&&n.district!=="waldo"&&(STREETS[n.district]||n._sector04));}
  function clockLabel(minutes){if(!Number.isFinite(minutes))return"--:--";var v=((Math.floor(minutes)%1440)+1440)%1440;return String(Math.floor(v/60)).padStart(2,"0")+":"+String(v%60).padStart(2,"0");}
  function paused(s,n){return !ownsClock(s,n)||!!(s.inDialog||s.inBattle||s.paused||s.gameOver||n.drive||flow(n).cinematic||(root.document&&root.document.hidden));}
  function tick(dt){var s=state(),n=world();if(paused(s,n)||!Number.isFinite(dt)||dt<=0)return 0;var f=flow(n);if(n.x<RULES.homeRearmX)f.homeAsked=false;var carry=Number.isFinite(f.clockCarry)&&f.clockCarry>=0&&f.clockCarry<RULES.secondsPerMinute?f.clockCarry:0;var elapsed=carry+Math.min(dt,RULES.maxFrameSeconds);var mins=Math.floor((elapsed+1e-9)/RULES.secondsPerMinute);if(mins){s.clock=(Number(s.clock)||0)+mins;try{if(typeof root.updateHUD==="function")root.updateHUD();}catch(e){}}f.clockCarry=Math.max(0,elapsed-mins*RULES.secondsPerMinute);return mins;}

  function releaseInput(){try{var k=root.keys||((typeof keys!=="undefined")?keys:null);if(k)Object.keys(k).forEach(function(x){k[x]=false;});}catch(e){}try{var j=root.joy||((typeof joy!=="undefined")?joy:null);if(j){j.x=0;j.y=0;}}catch(e){}}
  function sameScene(s,n){return !!(s&&n&&state()===s&&world()===n&&s.nightMode===n);}
  function canUseHome(s,n){if(!sameScene(s,n)||!ownsClock(s,n)||n.district!=="home"||n.x<RULES.homeX||n.drive||s.inBattle||s.gameOver||flow(n).cinematic)return false;var enemies=n.enemies||[];for(var i=0;i<enemies.length;i++){var e=enemies[i];if(e&&e.alive!==false&&Math.abs((e.x||0)-(n.x||0))<120)return false;}return true;}
  function closeDialog(){try{if(typeof root.closeDlg==="function")root.closeDlg();}catch(e){}}

  function ensureStyle(){var d=root.document;if(!d||d.getElementById("night-flow-style"))return;var el=d.createElement("style");el.id="night-flow-style";el.textContent="#night-home-film{position:absolute;inset:0;z-index:950;overflow:hidden;background:#000;color:#f3f0e5;pointer-events:auto}#night-home-film canvas{width:100%;height:100%;object-fit:cover;transform-origin:75% 55%}#night-home-film:before,#night-home-film:after{content:'';position:absolute;left:0;right:0;height:10%;background:#000;z-index:2}#night-home-film:before{top:0}#night-home-film:after{bottom:0}.night-film-copy{position:absolute;left:7%;right:7%;bottom:15%;z-index:3;font:600 clamp(13px,2.4vw,23px)/1.65 monospace;text-shadow:0 2px 5px #000}.night-film-skip{position:absolute;right:max(16px,env(safe-area-inset-right));top:max(14px,env(safe-area-inset-top));z-index:4;min-height:48px;padding:10px 15px;border:1px solid #eee8;border-radius:6px;background:#111c;color:#fff;font:14px monospace;cursor:pointer}.night-film-skip:focus-visible{outline:3px solid #fff;outline-offset:3px}@media(prefers-reduced-motion:reduce){#night-home-film canvas{transform:none!important}}";(d.head||d.documentElement).appendChild(el);}
  function abortScene(){if(!activeScene)return false;try{activeScene.cancel();return true;}catch(e){activeScene=null;return false;}}
  function commitExit(){var s=state(),n=world();if(!sameScene(s,n))return false;var f=flow(n);f.allowExit=true;try{return typeof wrappers.exitNight==="function"?wrappers.exitNight.call(root,true):false;}finally{f.allowExit=false;}}
  function beginHome(){var s=state(),n=world();if(!canUseHome(s,n)||activeScene)return false;closeDialog();var f=flow(n);f.cinematic=true;s.inDialog=true;n.vx=0;n.vy=0;releaseInput();
    var d=root.document,box=null,raf=null,last=null,elapsed=0,done=false,keydown=null,prior=d&&d.activeElement;
    function cleanup(){if(done)return;done=true;if(raf!=null&&root.cancelAnimationFrame)root.cancelAnimationFrame(raf);if(d&&keydown)d.removeEventListener("keydown",keydown,true);if(box&&box.remove)box.remove();f.cinematic=false;if(sameScene(s,n))s.inDialog=false;activeScene=null;releaseInput();try{if(prior&&prior.isConnected&&prior.focus)prior.focus();}catch(e){}}
    function finish(){if(done)return false;if(!sameScene(s,n)){cleanup();return false;}cleanup();commitExit();return true;}
    activeScene={cancel:cleanup,finish:finish,s:s,n:n};
    try{
      if(!d||!d.createElement||!root.requestAnimationFrame){finish();return true;}
      ensureStyle();box=d.createElement("div");box.id="night-home-film";box.setAttribute("role","dialog");box.setAttribute("aria-modal","true");box.setAttribute("aria-label","Mike's house — end the night");
      var source=d.getElementById("game"),canvas=d.createElement("canvas");if(source){canvas.width=source.width;canvas.height=source.height;var x=canvas.getContext&&canvas.getContext("2d");if(x)try{x.drawImage(source,0,0);}catch(e){}}box.appendChild(canvas);
      var copy=d.createElement("div");copy.className="night-film-copy";copy.setAttribute("aria-live","polite");box.appendChild(copy);
      var skip=d.createElement("button");skip.type="button";skip.className="night-film-skip";skip.textContent="Skip to night summary";skip.onclick=finish;box.appendChild(skip);(d.getElementById("game-wrap")||d.body).appendChild(box);
      keydown=function(e){if(e.key==="Escape"){e.preventDefault();e.stopImmediatePropagation();finish();}else if(e.key==="Tab"){e.preventDefault();skip.focus();}else if(e.key!=="Enter"&&e.key!==" ")e.stopImmediatePropagation();};d.addEventListener("keydown",keydown,true);skip.focus();
      var reduced=!!(root.matchMedia&&root.matchMedia("(prefers-reduced-motion: reduce)").matches),duration=reduced?1900:4100,shot=-1;
      function frame(t){if(done)return;if(!sameScene(s,n)){cleanup();return;}if(last!==null&&!(d&&d.hidden))elapsed+=Math.max(0,Math.min(t-last,100));last=t;var q=Math.min(1,elapsed/duration),next=q<.38?0:q<.75?1:2;if(next!==shot){copy.textContent=next===0?"MIKE'S HOUSE · "+clockLabel(s.clock):next===1?"The city can wait.":"NIGHT COMPLETE";shot=next;}canvas.style.opacity=String(q<.38?1:Math.max(0,1-(q-.38)/.37));if(!reduced)canvas.style.transform="scale("+(1+.035*q)+")";if(q>=1){finish();return;}raf=root.requestAnimationFrame(frame);}raf=root.requestAnimationFrame(frame);
    }catch(e){try{finish();}catch(_) { cleanup(); }}return true;
  }
  function requestHome(automatic){var s=state(),n=world();if(!canUseHome(s,n)||s.inDialog||typeof root.dlg!=="function")return false;var f=flow(n);if(automatic&&f.homeAsked)return false;f.homeAsked=true;root.dlg("MIKE'S HOUSE","The porch light is still on. End the night, keep your earnings, and continue through the normal day summary.",[{t:"Sleep until morning",f:function(){if(sameScene(s,n))beginHome();}},{t:"Stay out",f:function(){if(sameScene(s,n))closeDialog();}}]);return true;}

  function readCampaign(){try{var api=root.TechOpsCampaign;if(!api||typeof api.load!=="function")return{title:"AFTER HOURS · unavailable",objective:"Campaign state could not be read. Progress was not reset.",enter:false};var c=api.load(root.localStorage),f=c&&c.flags||{};if(f.tuesday_morning_reached||f.sector04_completed)return{title:"AFTER HOURS · completed",objective:"Sector 04 is documented. Continue the investigation by day.",enter:false};if(!f.day_work_unlocked)return{title:"AFTER HOURS · daytime preparation",objective:"Complete the standup and workstation opening by day. Free roam does not complete those objectives.",enter:false};var ev=c&&c.evidence&&c.evidence.ghostIdentityEvidence,est=ev&&ev.status==="established";return{title:"AFTER HOURS · Sector 04",objective:est?"Investigate the Access Guard and its controller. Damage suppresses; verified understanding resolves.":"Investigate Sector 04. Daytime identity evidence may still be required to resolve the controller.",enter:!!(c.campaign&&c.campaign.day===1)};}catch(e){return{title:"AFTER HOURS · unavailable",objective:"Campaign state could not be read. Progress was not reset.",enter:false};}}
  function enterSector04Reuse(){var s=state(),n=world(),rt=root.TechOpsSector04Runtime;if(!sameScene(s,n)||!rt||typeof rt.enterBrowser!=="function")return false;var old=root.enterNight;try{root.enterNight=function(){};rt.enterBrowser();return true;}catch(e){try{if(typeof root.toast==="function")root.toast("Sector 04 could not start. Night progress was preserved.",3200);}catch(_){}return false;}finally{root.enterNight=old;}}
  function openCampaign(){var s=state(),n=world();if(!sameScene(s,n)||!ownsClock(s,n)||s.inBattle||flow(n).cinematic||typeof root.dlg!=="function")return false;var view=readCampaign(),opts=[];if(view.enter&&root.TechOpsSector04Runtime&&typeof root.TechOpsSector04Runtime.enterBrowser==="function")opts.push({t:"Enter Sector 04 — campaign mission",f:function(){if(sameScene(s,n)){closeDialog();enterSector04Reuse();}}});opts.push({t:"Back to the street",f:closeDialog});root.dlg(view.title,view.objective,opts);return true;}
  function campaignOption(){return{t:"NIGHT WALKER CAMPAIGN · journal / Sector 04",f:openCampaign};}

  function suppressDayToast(msg){var s=state();if(!s||!s.nightMode||typeof msg!=="string")return false;return /^(?:☀️|🌧️|⛈️|🥵)\s*<b>(?:Monday|Tuesday|Wednesday|Thursday|Friday)<\/b>\s*—\s*(?:Sunny|Rain|Thunderstorm|Heatwave)\./i.test(msg)||/Monday flood|Friday\. Nobody deploys today|Moisture-splice surcharge/i.test(msg);}
  function refreshHUD(){var s=state(),n=world(),d=root.document;if(!ownsClock(s,n)||!d)return;var c=d.getElementById("hud-clock"),day=d.getElementById("hud-day");if(c)c.textContent=clockLabel(s.clock);if(day)day.textContent=n._sector04?"NIGHT WALKER · SECTOR 04":"NIGHT WALKER";}
  function beforeStep(dt){tick(Number(dt)||0);var s=state(),n=world();if(canUseHome(s,n)&&!s.inDialog)requestHome(true);}
  function afterStep(){var s=state(),n=world();if(n&&n.x<RULES.homeRearmX)flow(n).homeAsked=false;if(canUseHome(s,n)&&!s.inDialog)requestHome(true);}
  function afterDraw(){refreshHUD();}

  function assignGlobal(name,fn){try{root[name]=fn;}catch(e){}try{if(name==="exitNight")exitNight=fn;else if(name==="advanceClock")advanceClock=fn;else if(name==="interact")interact=fn;else if(name==="nmCarMenu")nmCarMenu=fn;else if(name==="toast")toast=fn;else if(name==="enterNight")enterNight=fn;}catch(e){}}
  function installWrappers(){if(installed)return true;installed=true;
    if(typeof root.advanceClock==="function"){wrappers.advanceClock=root.advanceClock;assignGlobal("advanceClock",function(min){var s=state(),n=world();if(ownsClock(s,n)){if(Number(min)===20){root.__nightFlowSuppressedStreetJumps=(root.__nightFlowSuppressedStreetJumps||0)+1;return s.clock;}s.clock=(Number(s.clock)||0)+(Number(min)||0);try{if(typeof root.updateHUD==="function")root.updateHUD();}catch(e){}return s.clock;}return wrappers.advanceClock.apply(this,arguments);});}
    if(typeof root.exitNight==="function"){wrappers.exitNight=root.exitNight;assignGlobal("exitNight",function(homeSafe){var s=state(),n=world(),f=n&&flow(n);if(homeSafe&&canUseHome(s,n)&&!(f&&f.allowExit)){requestHome(true);return false;}abortScene();releaseInput();return wrappers.exitNight.apply(this,arguments);});}
    if(typeof root.enterNight==="function"){wrappers.enterNight=root.enterNight;assignGlobal("enterNight",function(){abortScene();releaseInput();var r=wrappers.enterNight.apply(this,arguments),s=state();if(s){s._sceneEpoch=(s._sceneEpoch||0)+1;var t=root.document&&root.document.getElementById("toast");if(t)t.classList.add("hidden");}return r;});}
    if(typeof root.interact==="function"){wrappers.interact=root.interact;assignGlobal("interact",function(){var s=state(),n=world();if(activeScene&&sameScene(activeScene.s,activeScene.n))return;if(canUseHome(s,n)&&!s.inDialog)return requestHome(false);return wrappers.interact.apply(this,arguments);});}
    if(typeof root.nmCarMenu==="function"){wrappers.nmCarMenu=root.nmCarMenu;assignGlobal("nmCarMenu",function(){var originalDlg=root.dlg;if(typeof originalDlg!=="function")return wrappers.nmCarMenu.apply(this,arguments);root.dlg=function(title,text,opts){if(/CHARGER/i.test(String(title||""))&&Array.isArray(opts)&&!opts.some(function(o){return o&&/NIGHT WALKER CAMPAIGN/i.test(o.t||"");}))opts.unshift(campaignOption());return originalDlg.apply(this,arguments);};try{return wrappers.nmCarMenu.apply(this,arguments);}finally{root.dlg=originalDlg;}});}
    if(typeof root.toast==="function"){wrappers.toast=root.toast;assignGlobal("toast",function(msg){if(suppressDayToast(msg)){root.__nightFlowSuppressedDayToasts=(root.__nightFlowSuppressedDayToasts||0)+1;return;}return wrappers.toast.apply(this,arguments);});}
    root.__nightFlowInstalled=true;
    lastHeartbeat=now();
    if(!heartbeatTimer&&root.setInterval)heartbeatTimer=root.setInterval(function(){var t=now(),dt=Math.max(0,(t-lastHeartbeat)/1000);lastHeartbeat=t;try{tick(dt);var s=state(),n=world();if(n&&n.x<RULES.homeRearmX)flow(n).homeAsked=false;if(canUseHome(s,n)&&!s.inDialog)requestHome(true);refreshHUD();}catch(e){root.__nightFlowHeartbeatError=String(e&&e.stack||e);}},100);
    return true;
  }
  function health(){var s=state(),n=world();return{version:VERSION,build:BUILD,installed:installed,active:ownsClock(s,n),district:n&&n.district||null,clock:s&&s.clock,homeReady:canUseHome(s,n),cinematic:!!activeScene,suppressedDayToasts:root.__nightFlowSuppressedDayToasts||0,suppressedStreetJumps:root.__nightFlowSuppressedStreetJumps||0,heartbeat:!!heartbeatTimer,error:root.__nightFlowHeartbeatError||null};}
  var api={VERSION:VERSION,BUILD:BUILD,RULES:RULES,ownsClock:ownsClock,clockLabel:clockLabel,tick:tick,beforeStep:beforeStep,afterStep:afterStep,afterDraw:afterDraw,refreshHUD:refreshHUD,canUseHome:canUseHome,requestHome:requestHome,beginHome:beginHome,abortScene:abortScene,openCampaign:openCampaign,campaignOption:campaignOption,readCampaign:readCampaign,enterSector04Reuse:enterSector04Reuse,install:installWrappers,health:health};
  root.TechOpsNightFlow=api;installWrappers();
})(typeof globalThis!=="undefined"?globalThis:this);
