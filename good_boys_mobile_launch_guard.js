/* TechOps Hero — Good Boys mobile launch guard v2.
 * Production authority for iOS/Safari Good Boys launch sequencing.
 *
 * Legacy v7.36 assumes enterNight() creates NM synchronously. Mobile Safari can
 * render the generic Night shell first and create NM on a later frame, leaving
 * the player on an empty scene with the generic D-pad/A controls. This guard:
 *   1) waits for the real Night engine,
 *   2) invokes the legacy combat callback only when it is safe,
 *   3) verifies Katrin + Manchez actually attached,
 *   4) retries the attach once when the engine raced the callback,
 *   5) presents a deterministic recovery action instead of a blank game.
 */
(function(root){
  "use strict";
  if(!root || root.TechOpsGoodBoysMobileLaunchGuard) return;
  var VERSION=2, timer=null, launchToken=0;
  var pending={id:null,cb:null};

  function isGoodBoysCombat(id){ return /^b736m[1-7]$/.test(String(id||"")); }
  function nightReady(){
    try{
      return !!(root.S && root.S.nightMode && root.NM &&
        typeof root.drawNM === "function" && typeof root.stepNM === "function" &&
        isFinite(root.NM.x) && isFinite(root.NM.y));
    }catch(e){ return false; }
  }
  function pairReady(){
    try{
      var c=root.NM&&root.NM._v736;
      return !!(c && c.chars && c.chars.katrin && c.chars.manchez && c.partner &&
        (c.active==="katrin"||c.active==="manchez"));
    }catch(e){return false;}
  }
  function closeShell(){
    try{
      if(root.document){
        var ids=["dialogue","panel","eod","battle"];
        ids.forEach(function(id){var e=root.document.getElementById(id);if(e)e.classList.add("hidden");});
      }
      if(root.S) root.S.inDialog=false;
    }catch(e){}
  }
  function primeNight(){
    try{
      closeShell();
      if(!nightReady() && typeof root.enterNight === "function") root.enterNight();
    }catch(e){ root.__goodBoysMobilePrimeError=String(e&&e.stack||e); }
    try{
      if(root.v722 && typeof root.v722.active === "function" && root.v722.active() && typeof root.v722.skip === "function") root.v722.skip();
    }catch(e){}
  }
  function repairAuthorities(){
    try{if(root.TechOpsGoodBoysCanon)root.TechOpsGoodBoysCanon.tick();}catch(e){}
    try{if(root.TechOpsGoodBoysGameplayLoop)root.TechOpsGoodBoysGameplayLoop.tick();}catch(e){}
    try{if(root.TechOpsGoodDogsProduction)root.TechOpsGoodDogsProduction.tick();}catch(e){}
    try{if(root.TechOpsGoodBoysReferenceMechanics)root.TechOpsGoodBoysReferenceMechanics.tick();}catch(e){}
  }
  function clearRecovery(){try{var o=root.document&&root.document.getElementById("good-boys-mobile-recovery");if(o)o.remove();}catch(e){}}
  function retryPending(){
    clearRecovery();
    if(!pending.id||typeof pending.cb!=="function")return false;
    waitForNight(pending.id,pending.cb,true);return true;
  }
  function showFailure(reason){
    try{
      root.__goodBoysCoreBroken=reason||"mobile_night_handoff_timeout";
      if(!root.document)return;
      clearRecovery();
      var o=root.document.createElement("div"); o.id="good-boys-mobile-recovery";
      o.style.cssText="position:fixed;inset:0;z-index:100001;background:#02060bf2;color:#eef8ff;display:flex;align-items:center;justify-content:center;padding:20px;font-family:monospace";
      o.innerHTML='<div style="max-width:520px;border:2px solid #38bdf8;border-radius:14px;background:#07111d;padding:18px;text-align:center"><div style="font-weight:800;font-size:18px;color:#7dd3fc">GOOD BOYS — RUNTIME RECOVERY</div><p style="line-height:1.5">The co-op engine did not finish attaching Katrin and Manchez. The launch was stopped instead of leaving you on the generic Night shell.</p><div style="font-size:11px;color:#94a3b8;margin:10px 0">'+String(reason||"handoff_timeout")+'</div><button id="gb-mobile-retry" style="width:100%;min-height:52px;border:2px solid #38bdf8;border-radius:10px;background:#0a1726;color:#eef8ff;font-weight:800">RETRY CO-OP HANDOFF</button></div>';
      root.document.body.appendChild(o);
      var b=root.document.getElementById("gb-mobile-retry"); if(b)b.onclick=function(){retryPending();};
    }catch(e){}
  }
  function verifyPair(id,cb,reattach){
    var checks=0,maxChecks=20;
    function check(){
      repairAuthorities();
      if(pairReady()){
        root.__goodBoysCoreBroken=null;
        root.__goodBoysMobileLaunchState={id:id,night:true,pair:true,recovered:!!reattach};
        return;
      }
      if(++checks<maxChecks){try{(root.setTimeout||setTimeout)(check,25);}catch(e){showFailure("pair_verify_timer_failed");}return;}
      if(!reattach){
        /* The Night engine existed but v7.36 attached before its district/world
           settled. One idempotent callback retry is safer than leaving Mike or
           an empty shell as the player body. */
        try{cb();}catch(e){root.__goodBoysMobileCallbackError=String(e&&e.stack||e);}
        verifyPair(id,cb,true);return;
      }
      showFailure("pair_attach_failed");
    }
    check();
  }
  function waitForNight(id,cb,isRetry){
    pending={id:id,cb:cb};
    var token=++launchToken,tries=0,maxTries=200;
    function poll(){
      if(token!==launchToken)return;
      primeNight();
      if(nightReady()){
        root.__goodBoysCoreBroken=null;
        try{cb&&cb();}catch(e){root.__goodBoysMobileCallbackError=String(e&&e.stack||e);showFailure("combat_callback_failed");return;}
        verifyPair(id,cb,!!isRetry);
        return;
      }
      if(++tries>=maxTries){showFailure("mobile_night_handoff_timeout");return;}
      try{(root.setTimeout||setTimeout)(poll,25);}catch(e){showFailure("night_poll_timer_failed");}
    }
    poll();
  }
  function install(){
    try{
      if(!root.v725 || typeof root.v725.play !== "function") return false;
      var current=root.v725.play;
      if(current.__goodBoysMobileGuard) return true;
      var guarded=function(id,cb){
        if(!isGoodBoysCombat(id)) return current.apply(this,arguments);
        var wrapped=(typeof cb === "function") ? function(){waitForNight(id,cb,false);} : cb;
        return current.call(this,id,wrapped);
      };
      guarded.__goodBoysMobileGuard=true;
      guarded.__goodBoysMobileGuardBase=current;
      root.v725.play=guarded;
      return true;
    }catch(e){root.__goodBoysMobileGuardError=String(e&&e.stack||e);return false;}
  }
  function tick(){try{install();repairAuthorities();}catch(e){}}
  tick();
  try{timer=root.setInterval(tick,80);}catch(e){}
  root.TechOpsGoodBoysMobileLaunchGuard={VERSION:VERSION,isGoodBoysCombat:isGoodBoysCombat,nightReady:nightReady,pairReady:pairReady,primeNight:primeNight,repairAuthorities:repairAuthorities,retryPending:retryPending,waitForNight:waitForNight,verifyPair:verifyPair,install:install,tick:tick,timer:timer};
})(typeof globalThis!=="undefined"?globalThis:this);
