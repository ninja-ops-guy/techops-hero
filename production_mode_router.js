/* TechOps Hero — production mode router v1.
 * Owns the two alternate-mode launches that were still racing legacy wrappers
 * on mobile Safari: NIGHT CRAWLER and GOOD BOYS 118/1984.
 *
 * Design rule: title/menu intent is captured first, then the router guarantees
 * the requested runtime becomes authoritative. Day mode may initialize as an
 * implementation detail, but it is never accepted as the final state for an
 * alternate-mode launch.
 */
(function(root){
  "use strict";
  if(!root || root.TechOpsProductionModeRouter) return;
  var VERSION=1, desired=null, timer=null, wrappedStart=null, wrapped736=null;

  function textOf(node){ try{return String(node&&node.textContent||"").toUpperCase();}catch(e){return"";} }
  function setDesired(mode){ desired=mode||null; root.__productionDesiredMode=desired; return desired; }
  function state(){ try{return root.S||null;}catch(e){return null;} }
  function nightWorldReady(){
    try{return !!(state()&&state().nightMode&&root.NM&&typeof root.stepNM==="function"&&typeof root.drawNM==="function"&&isFinite(root.NM.x)&&isFinite(root.NM.y));}catch(e){return false;}
  }
  function pairReady(){
    try{var c=root.NM&&root.NM._v736;return !!(c&&c.chars&&c.chars.katrin&&c.chars.manchez&&c.partner&&(c.active==="katrin"||c.active==="manchez"));}catch(e){return false;}
  }
  function forceNightIdentity(){
    try{root.localStorage&&root.localStorage.setItem("techops_char","nightcrawler");}catch(e){}
    try{var s=state();if(s){s.meta=s.meta||{};s.meta._char="nightcrawler";s.clock=Math.max(Number(s.clock||0),16*60);}}catch(e){}
  }
  function clearNightIdentity(){
    try{root.localStorage&&root.localStorage.removeItem("techops_char");}catch(e){}
    try{var s=state();if(s&&s.meta&&s.meta._char==="nightcrawler")delete s.meta._char;}catch(e){}
  }
  function hideDayShell(){
    try{
      var d=root.document;if(!d)return;
      ["hud","touch-ui","dialogue","panel","battle","eod"].forEach(function(id){var el=d.getElementById(id);if(el&&el.style)el.style.setProperty("display","none","important");});
    }catch(e){}
  }
  function restoreRuntimeUi(){
    try{if(root.TechOpsGoodBoysGameplayLoop)root.TechOpsGoodBoysGameplayLoop.tick();}catch(e){}
    try{if(root.TechOpsGoodDogsProduction)root.TechOpsGoodDogsProduction.tick();}catch(e){}
    try{if(root.TechOpsGoodBoysCanon)root.TechOpsGoodBoysCanon.tick();}catch(e){}
    try{if(root.TechOpsNightReferenceVisuals)root.TechOpsNightReferenceVisuals.install();}catch(e){}
  }
  function enterNightReliably(done){
    var tries=0,max=160;
    function poll(){
      var s=state();
      try{if(s&&!s.nightMode&&typeof root.enterNight==="function")root.enterNight();}catch(e){root.__productionModeRouterEnterNightError=String(e&&e.stack||e);}
      if(nightWorldReady()){ if(done)done(); return; }
      if(++tries>=max){root.__productionModeRouterError="night_runtime_timeout";return;}
      (root.setTimeout||setTimeout)(poll,25);
    }
    poll();
  }
  function launchNightCrawler(){
    setDesired("nightcrawler");forceNightIdentity();hideDayShell();
    try{
      if(!state()&&typeof root.startRun==="function")root.startRun();
      else if(state()&&!state().nightMode&&typeof root.enterNight==="function")root.enterNight();
    }catch(e){root.__productionModeRouterNightStartError=String(e&&e.stack||e);}
    enterNightReliably(function(){
      forceNightIdentity();desired=null;root.__productionDesiredMode=null;root.__productionNightLaunchOk=true;
      try{var t=root.document&&root.document.getElementById("touch-ui");if(t)t.style.removeProperty("display");}catch(e){}
      restoreRuntimeUi();
    });
  }
  function launchGoodBoys(){
    setDesired("goodboys");clearNightIdentity();hideDayShell();
    try{if(root.v736&&typeof root.v736.start==="function")root.v736.start();}catch(e){root.__productionModeRouterGoodBoysStartError=String(e&&e.stack||e);}
    enterNightReliably(function(){
      var tries=0,max=80;
      function pairPoll(){
        restoreRuntimeUi();
        if(pairReady()){desired=null;root.__productionDesiredMode=null;root.__productionGoodBoysLaunchOk=true;return;}
        if(tries===20){try{if(root.v736&&typeof root.v736.start==="function")root.v736.start();}catch(e){}}
        if(++tries>=max){root.__productionModeRouterError="good_boys_pair_timeout";return;}
        (root.setTimeout||setTimeout)(pairPoll,25);
      }
      pairPoll();
    });
  }
  function captureIntent(ev){
    var n=ev&&ev.target,t=textOf(n);
    if(t.indexOf("NIGHT CRAWLER")>=0){setDesired("nightcrawler");forceNightIdentity();}
    else if(t.indexOf("118/1984")>=0||t.indexOf("BREAKOUT")>=0){setDesired("goodboys");clearNightIdentity();}
  }
  function wrapStartRun(){
    try{
      if(typeof root.startRun!=="function")return false;
      if(root.startRun.__productionModeRouter)return true;
      var base=root.startRun;wrappedStart=function(){var r=base.apply(this,arguments);try{if(desired==="nightcrawler"||((state()&&state().meta&&state().meta._char==="nightcrawler")))launchNightCrawler();}catch(e){}return r;};
      wrappedStart.__productionModeRouter=true;wrappedStart.__productionModeRouterBase=base;root.startRun=wrappedStart;return true;
    }catch(e){return false;}
  }
  function wrapGoodBoysStart(){
    try{
      if(!root.v736||typeof root.v736.start!=="function")return false;
      if(root.v736.start.__productionModeRouter)return true;
      var base=root.v736.start;wrapped736=function(){setDesired("goodboys");clearNightIdentity();hideDayShell();var r=base.apply(this,arguments);enterNightReliably(function(){restoreRuntimeUi();});return r;};
      wrapped736.__productionModeRouter=true;wrapped736.__productionModeRouterBase=base;root.v736.start=wrapped736;return true;
    }catch(e){return false;}
  }
  function healthTick(){
    wrapStartRun();wrapGoodBoysStart();
    if(desired==="nightcrawler"){
      forceNightIdentity();hideDayShell();
      if(state()&&!state().nightMode)enterNightReliably(function(){restoreRuntimeUi();desired=null;root.__productionDesiredMode=null;});
    }else if(desired==="goodboys"){
      hideDayShell();
      if(nightWorldReady()&&pairReady()){restoreRuntimeUi();desired=null;root.__productionDesiredMode=null;}
    }
  }
  try{root.document&&root.document.addEventListener("pointerdown",captureIntent,true);root.document&&root.document.addEventListener("click",captureIntent,true);}catch(e){}
  healthTick();try{timer=root.setInterval(healthTick,80);}catch(e){}
  root.TechOpsProductionModeRouter={VERSION:VERSION,setDesired:setDesired,state:state,nightWorldReady:nightWorldReady,pairReady:pairReady,forceNightIdentity:forceNightIdentity,clearNightIdentity:clearNightIdentity,launchNightCrawler:launchNightCrawler,launchGoodBoys:launchGoodBoys,enterNightReliably:enterNightReliably,wrapStartRun:wrapStartRun,wrapGoodBoysStart:wrapGoodBoysStart,healthTick:healthTick,timer:timer};
})(typeof globalThis!=="undefined"?globalThis:this);
