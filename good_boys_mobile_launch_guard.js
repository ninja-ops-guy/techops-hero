/* TechOps Hero — Good Boys mobile launch guard v1.
 * Production hotfix for iOS/Safari: v7.36 startCombat assumes enterNight()
 * creates NM synchronously. That is not reliable on mobile and can strand the
 * player in the generic Day/Night shell with only the D-pad visible.
 *
 * This guard stays outside the legacy v7.36 closure and wraps the shared
 * cinematic callback. Every combat mission waits for a real Night runtime
 * before the original v7.36 startCombat callback is allowed to execute.
 */
(function(root){
  "use strict";
  if(!root || root.TechOpsGoodBoysMobileLaunchGuard) return;
  var VERSION=1, timer=null, lastBase=null, launchToken=0;

  function isGoodBoysCombat(id){ return /^b736m[1-7]$/.test(String(id||"")); }
  function nightReady(){
    try{
      return !!(root.S && root.S.nightMode && root.NM &&
        typeof root.drawNM === "function" && typeof root.stepNM === "function" &&
        isFinite(root.NM.x) && isFinite(root.NM.y));
    }catch(e){ return false; }
  }
  function closeShell(){
    try{
      if(root.document){
        var d=root.document.getElementById("dialogue"); if(d)d.classList.add("hidden");
        var p=root.document.getElementById("panel"); if(p)p.classList.add("hidden");
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
  function showFailure(id){
    try{
      root.__goodBoysCoreBroken="mobile_night_handoff_timeout";
      if(!root.document)return;
      var old=root.document.getElementById("good-boys-mobile-recovery"); if(old)old.remove();
      var o=root.document.createElement("div"); o.id="good-boys-mobile-recovery";
      o.style.cssText="position:fixed;inset:0;z-index:100001;background:#02060bf2;color:#eef8ff;display:flex;align-items:center;justify-content:center;padding:20px;font-family:monospace";
      o.innerHTML='<div style="max-width:520px;border:2px solid #38bdf8;border-radius:14px;background:#07111d;padding:18px;text-align:center"><div style="font-weight:800;font-size:18px;color:#7dd3fc">GOOD BOYS — RUNTIME RECOVERY</div><p style="line-height:1.5">The Night engine did not finish initializing. The game stopped the launch instead of leaving you on a blank screen.</p><button id="gb-mobile-retry" style="width:100%;min-height:52px;border:2px solid #38bdf8;border-radius:10px;background:#0a1726;color:#eef8ff;font-weight:800">RETRY NIGHT HANDOFF</button></div>';
      root.document.body.appendChild(o);
      var b=root.document.getElementById("gb-mobile-retry"); if(b)b.onclick=function(){o.remove();primeNight();};
    }catch(e){}
  }
  function waitForNight(id,cb){
    var token=++launchToken, tries=0, maxTries=160;
    function poll(){
      if(token!==launchToken)return;
      primeNight();
      if(nightReady()){
        root.__goodBoysCoreBroken=null;
        try{ cb&&cb(); }catch(e){ root.__goodBoysMobileCallbackError=String(e&&e.stack||e); }
        /* startCombat should have attached the pair immediately. Give it one
           frame, then repair UI/state through the production authorities. */
        try{(root.setTimeout||setTimeout)(function(){
          try{if(root.TechOpsGoodBoysCanon)root.TechOpsGoodBoysCanon.tick();}catch(e){}
          try{if(root.TechOpsGoodBoysGameplayLoop)root.TechOpsGoodBoysGameplayLoop.tick();}catch(e){}
          try{if(root.TechOpsGoodDogsProduction)root.TechOpsGoodDogsProduction.tick();}catch(e){}
        },0);}catch(e){}
        return;
      }
      if(++tries>=maxTries){ showFailure(id); return; }
      try{(root.setTimeout||setTimeout)(poll,25);}catch(e){showFailure(id);}
    }
    poll();
  }
  function install(){
    try{
      if(!root.v725 || typeof root.v725.play !== "function") return false;
      var current=root.v725.play;
      if(current.__goodBoysMobileGuard) return true;
      lastBase=current;
      var guarded=function(id,cb){
        if(!isGoodBoysCombat(id)) return current.apply(this,arguments);
        var wrapped=(typeof cb === "function") ? function(){waitForNight(id,cb);} : cb;
        return current.call(this,id,wrapped);
      };
      guarded.__goodBoysMobileGuard=true;
      guarded.__goodBoysMobileGuardBase=current;
      root.v725.play=guarded;
      return true;
    }catch(e){root.__goodBoysMobileGuardError=String(e&&e.stack||e);return false;}
  }
  function tick(){
    /* Other production authorities may legitimately wrap v725.play later.
       Re-install as the outermost guard whenever that happens. */
    try{install();}catch(e){}
  }
  tick();
  try{timer=root.setInterval(tick,80);}catch(e){}
  root.TechOpsGoodBoysMobileLaunchGuard={VERSION:VERSION,nightReady:nightReady,primeNight:primeNight,waitForNight:waitForNight,install:install,tick:tick,timer:timer};
})(typeof globalThis!=="undefined"?globalThis:this);
