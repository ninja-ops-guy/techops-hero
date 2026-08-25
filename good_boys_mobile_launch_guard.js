/* TechOps Hero — Good Boys mobile launch guard v3.
 * Production authority for iOS/Safari Good Boys launch sequencing.
 *
 * v7.36 assumes enterNight() creates NM synchronously. Mobile Safari can render
 * the generic Night shell first and create NM on a later frame. Resume paths
 * (Cell 118 / Cell 1984) made this especially visible because the legacy shell
 * could survive without the Katrin+Manchez pair ever attaching.
 *
 * v3 adds:
 *   - explicit upgrade from older dynamically-cached guard versions,
 *   - v736.start intent tracking (including resumed missions),
 *   - generic-shell suppression while a Good Boys launch is unresolved,
 *   - independent watchdog/recovery even if another wrapper bypasses v725.play,
 *   - pair verification before declaring launch success.
 */
(function(root){
  "use strict";
  if(!root) return;
  var PRIOR=root.TechOpsGoodBoysMobileLaunchGuard;
  if(PRIOR && Number(PRIOR.VERSION||0)>=3) return;
  try{if(PRIOR&&PRIOR.timer&&root.clearInterval)root.clearInterval(PRIOR.timer);}catch(e){}

  var VERSION=3, timer=null, launchToken=0;
  var pending={id:null,cb:null}, launchIntent=null, startBase=null;

  function isGoodBoysCombat(id){ return /^b736m[1-7]$/.test(String(id||"")); }
  function missionFromState(){
    try{var m=root.S&&root.S.meta&&root.S.meta._v736&&Number(root.S.meta._v736.m);return m>=1&&m<=7?m:null;}catch(e){return null;}
  }
  function nightReady(){
    try{return !!(root.S&&root.S.nightMode&&root.NM&&typeof root.drawNM==="function"&&typeof root.stepNM==="function"&&isFinite(root.NM.x)&&isFinite(root.NM.y));}catch(e){return false;}
  }
  function pairReady(){
    try{var c=root.NM&&root.NM._v736;return !!(c&&c.chars&&c.chars.katrin&&c.chars.manchez&&c.partner&&(c.active==="katrin"||c.active==="manchez"));}catch(e){return false;}
  }
  function titleVisible(){
    try{var t=root.document&&root.document.getElementById("title-screen");return !!(t&&!t.classList.contains("hidden"));}catch(e){return false;}
  }
  function setGenericShellHidden(hidden){
    try{
      if(!root.document)return;
      var ids=["touch-ui","hud"];
      ids.forEach(function(id){var e=root.document.getElementById(id);if(!e)return;if(hidden){if(!e.dataset.gbPrevDisplay)e.dataset.gbPrevDisplay=e.style.display||"";e.style.display="none";}else if(e.dataset.gbPrevDisplay!==undefined){e.style.display=e.dataset.gbPrevDisplay;delete e.dataset.gbPrevDisplay;}});
    }catch(e){}
  }
  function closeShell(){
    try{if(root.document)["dialogue","panel","eod","battle"].forEach(function(id){var e=root.document.getElementById(id);if(e)e.classList.add("hidden");});if(root.S)root.S.inDialog=false;}catch(e){}
  }
  function primeNight(){
    try{closeShell();if(!nightReady()&&typeof root.enterNight==="function")root.enterNight();}catch(e){root.__goodBoysMobilePrimeError=String(e&&e.stack||e);}
    try{if(root.v722&&typeof root.v722.active==="function"&&root.v722.active()&&typeof root.v722.skip==="function")root.v722.skip();}catch(e){}
  }
  function repairAuthorities(){
    try{if(root.TechOpsGoodBoysCanon)root.TechOpsGoodBoysCanon.tick();}catch(e){}
    try{if(root.TechOpsGoodBoysGameplayLoop)root.TechOpsGoodBoysGameplayLoop.tick();}catch(e){}
    try{if(root.TechOpsGoodDogsProduction)root.TechOpsGoodDogsProduction.tick();}catch(e){}
    try{if(root.TechOpsGoodBoysReferenceMechanics)root.TechOpsGoodBoysReferenceMechanics.tick();}catch(e){}
  }
  function clearRecovery(){try{var o=root.document&&root.document.getElementById("good-boys-mobile-recovery");if(o)o.remove();}catch(e){}}
  function markSuccess(id,recovered){
    launchIntent=null;setGenericShellHidden(false);clearRecovery();root.__goodBoysCoreBroken=null;
    root.__goodBoysMobileLaunchState={id:id||("b736m"+(missionFromState()||"?")),night:true,pair:true,recovered:!!recovered,version:VERSION};
  }
  function retryPending(){clearRecovery();var id=pending.id||(launchIntent&&launchIntent.id);if(!id)return false;if(typeof pending.cb==="function"){waitForNight(id,pending.cb,true);return true;}try{if(root.v736&&typeof root.v736.start==="function"){root.v736.start();return true;}}catch(e){}return false;}
  function showFailure(reason){
    try{
      root.__goodBoysCoreBroken=reason||"mobile_night_handoff_timeout";setGenericShellHidden(true);
      if(!root.document)return;clearRecovery();
      var o=root.document.createElement("div");o.id="good-boys-mobile-recovery";
      o.style.cssText="position:fixed;inset:0;z-index:100001;background:#02060bf2;color:#eef8ff;display:flex;align-items:center;justify-content:center;padding:20px;font-family:monospace";
      o.innerHTML='<div style="max-width:520px;border:2px solid #38bdf8;border-radius:14px;background:#07111d;padding:18px;text-align:center"><div style="font-weight:800;font-size:18px;color:#7dd3fc">GOOD BOYS — RUNTIME RECOVERY</div><p style="line-height:1.5">The co-op engine did not finish attaching Katrin and Manchez. The generic Night shell was blocked instead of becoming playable.</p><div style="font-size:11px;color:#94a3b8;margin:10px 0">'+String(reason||"handoff_timeout")+'</div><button id="gb-mobile-retry" style="width:100%;min-height:52px;border:2px solid #38bdf8;border-radius:10px;background:#0a1726;color:#eef8ff;font-weight:800">RETRY CO-OP HANDOFF</button></div>';
      root.document.body.appendChild(o);var b=root.document.getElementById("gb-mobile-retry");if(b)b.onclick=retryPending;
    }catch(e){}
  }
  function verifyPair(id,cb,reattach){
    var checks=0,maxChecks=24;
    function check(){
      repairAuthorities();
      if(pairReady()){markSuccess(id,reattach);return;}
      if(++checks<maxChecks){try{(root.setTimeout||setTimeout)(check,25);}catch(e){showFailure("pair_verify_timer_failed");}return;}
      if(!reattach&&typeof cb==="function"){
        try{cb();}catch(e){root.__goodBoysMobileCallbackError=String(e&&e.stack||e);}
        verifyPair(id,cb,true);return;
      }
      showFailure("pair_attach_failed");
    }
    check();
  }
  function waitForNight(id,cb,isRetry){
    pending={id:id,cb:cb};launchIntent=launchIntent||{id:id,at:Date.now?Date.now():0};setGenericShellHidden(true);
    var token=++launchToken,tries=0,maxTries=240;
    function poll(){
      if(token!==launchToken)return;primeNight();
      if(nightReady()){
        root.__goodBoysCoreBroken=null;
        try{cb&&cb();}catch(e){root.__goodBoysMobileCallbackError=String(e&&e.stack||e);showFailure("combat_callback_failed");return;}
        verifyPair(id,cb,!!isRetry);return;
      }
      if(++tries>=maxTries){showFailure("mobile_night_handoff_timeout");return;}
      try{(root.setTimeout||setTimeout)(poll,25);}catch(e){showFailure("night_poll_timer_failed");}
    }
    poll();
  }
  function installPlayGuard(){
    try{
      if(!root.v725||typeof root.v725.play!=="function")return false;
      var current=root.v725.play;if(current.__goodBoysMobileGuardV3)return true;
      var guarded=function(id,cb){
        if(!isGoodBoysCombat(id))return current.apply(this,arguments);
        launchIntent={id:String(id),at:Date.now?Date.now():0};setGenericShellHidden(true);
        var wrapped=typeof cb==="function"?function(){waitForNight(id,cb,false);}:cb;
        return current.call(this,id,wrapped);
      };
      guarded.__goodBoysMobileGuard=true;guarded.__goodBoysMobileGuardV3=true;guarded.__goodBoysMobileGuardBase=current;root.v725.play=guarded;return true;
    }catch(e){root.__goodBoysMobileGuardError=String(e&&e.stack||e);return false;}
  }
  function installStartGuard(){
    try{
      if(!root.v736||typeof root.v736.start!=="function")return false;
      var current=root.v736.start;if(current.__goodBoysStartGuardV3)return true;startBase=current;
      var guarded=function(){var m=missionFromState()||1;launchIntent={id:"b736m"+m,at:Date.now?Date.now():0};setGenericShellHidden(true);return current.apply(this,arguments);};
      guarded.__goodBoysStartGuardV3=true;guarded.__goodBoysStartGuardBase=current;root.v736.start=guarded;return true;
    }catch(e){return false;}
  }
  function watchdog(){
    try{
      installPlayGuard();installStartGuard();repairAuthorities();
      if(pairReady()){if(launchIntent)markSuccess(launchIntent.id,false);return;}
      if(!launchIntent||titleVisible())return;
      setGenericShellHidden(true);
      var age=(Date.now?Date.now():0)-Number(launchIntent.at||0);
      /* If the generic Night shell is visible for >2s with no pair, the play
         wrapper was bypassed or a resume callback was lost. Surface recovery. */
      if(nightReady()&&age>2000&&!root.__goodBoysCoreBroken)showFailure("resume_pair_missing");
      else if(age>8000&&!root.__goodBoysCoreBroken)showFailure("resume_night_missing");
    }catch(e){}
  }
  watchdog();try{timer=root.setInterval(watchdog,80);}catch(e){}
  root.TechOpsGoodBoysMobileLaunchGuard={VERSION:VERSION,isGoodBoysCombat:isGoodBoysCombat,missionFromState:missionFromState,nightReady:nightReady,pairReady:pairReady,primeNight:primeNight,repairAuthorities:repairAuthorities,retryPending:retryPending,waitForNight:waitForNight,verifyPair:verifyPair,install:installPlayGuard,installStartGuard:installStartGuard,watchdog:watchdog,timer:timer};
})(typeof globalThis!=="undefined"?globalThis:this);
