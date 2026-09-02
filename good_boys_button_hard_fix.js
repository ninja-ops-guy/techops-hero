/* TechOps Hero — 118/1984 terminal title-button owner v8.
 * One production opening authority:
 *   cockpit pilot interaction -> automatic GD_CUT_02 -> supplied-asset Good
 *   Ship flight -> automatic GD_CUT_03 -> crash -> fresh M3 prison gameplay.
 * No procedural flight authority is permitted on this path.
 */
(function(root){
  "use strict";
  if(!root||!root.document)return;
  var PRIOR=root.TechOpsGoodBoysButtonHardFix;
  if(PRIOR&&Number(PRIOR.VERSION||0)>=8)return;
  var VERSION=8,lastLaunch=0,launching=false,depTimer=0;
  function target(t){try{return t&&t.closest&&t.closest("#btn-v736");}catch(_){return null;}}
  function freshConfig(){return {mission:3,k:false,waldo:false,evidence:[]};}
  function phase(name,extra){root.__goodBoysOpeningPhase=Object.assign({phase:name,owner:"hard-title-button-v8",at:Date.now()},extra||{});}
  function clearForeignUi(){
    try{["act1-reference","good-boys-story-cine","good-boys-premise","good-boys-ship-interlude","good-boys-opening-error","good-boys-deck-v4","good-boys-flight-v4","good-boys-crash-v4"].forEach(function(id){var n=root.document.getElementById(id);if(n)n.remove();});}catch(_){}
    try{var d=root.document.getElementById("dialogue");if(d)d.classList.add("hidden");if(root.S)root.S.inDialog=false;}catch(_){}
    try{var p=root.document.getElementById("panel");if(p)p.classList.add("hidden");var e=root.document.getElementById("eod");if(e)e.classList.add("hidden");}catch(_){}
  }
  function setButton(text,disabled){try{var b=root.document.getElementById("btn-v736");if(b){b.disabled=!!disabled;b.textContent=text;}}catch(_){} }
  function depsReady(){
    var c=root.GoodDogsCutscenes,o=root.TechOpsGoodBoysOpeningV4,a=root.TechOpsGoodDogsSingleAtlasAuthority,f=root.TechOpsGoodBoysShipFlight,d=root.TechOpsGoodBoysShipDeckScene;
    return !!(c&&parseFloat(c.VERSION||0)>=2.9&&typeof c.play==="function"&&o&&typeof o.showDeckInteraction==="function"&&typeof o.showCrashScene==="function"&&f&&Number(f.VERSION||0)>=2&&typeof f.launch==="function"&&d&&Number(d.VERSION||0)>=2&&a&&Number(a.VERSION||0)>=2&&a.installed!==false);
  }
  function waitForDeps(timeout){return new Promise(function(resolve,reject){var start=Date.now();function poll(){if(depsReady()){resolve(true);return;}if(Date.now()-start>=timeout){reject(new Error("Good Dogs production opening dependencies did not become ready"));return;}depTimer=root.setTimeout(poll,50);}poll();});}
  function validMovieResult(result,id){
    if(!result)throw new Error(id+" returned no result");
    var status=result.status||result.result;
    if(status!=="COMPLETED"&&status!=="USER_SKIPPED")throw new Error(id+" did not complete: "+String(status));
    return result;
  }
  async function playMovie(id){
    phase("cutscene",{id:id,automatic:true});
    root.__goodBoysAutomaticCutscene={id:id,requestedAt:Date.now(),automatic:true};
    var r=await root.GoodDogsCutscenes.play(id,{force:true,muted:true,autoplay:true});
    validMovieResult(r,id);root.__goodBoysAutomaticCutscene={id:id,completedAt:Date.now(),automatic:true,status:r.status||r.result};return r;
  }
  function runCanonicalFlight(){return new Promise(function(resolve,reject){
    var f=root.TechOpsGoodBoysShipFlight;if(!f||typeof f.launch!=="function"){reject(new Error("Canonical Good Ship flight unavailable"));return;}
    var settled=false,timer=root.setTimeout(function(){if(!settled){settled=true;reject(new Error("Canonical Good Ship flight timed out"));}},18000);
    try{
      var ok=f.launch(function(){if(settled)return;settled=true;root.clearTimeout(timer);var telemetry=typeof f.telemetry==="function"?f.telemetry():(root.__goodBoysShipFlightState||{});if(telemetry&&telemetry.assetReady===false&&telemetry.softlockPrevented)reject(new Error("Canonical Good Ship atlas failed to load"));else resolve({completed:true,source:"canonical-good-ship-atlas",telemetry:telemetry});});
      if(ok===false&&!settled){settled=true;root.clearTimeout(timer);reject(new Error("Canonical Good Ship flight refused launch"));}
    }catch(e){if(!settled){settled=true;root.clearTimeout(timer);reject(e);}}
  });}
  function showOpeningError(err){
    var old=root.document.getElementById("good-boys-opening-error");if(old)old.remove();var box=root.document.createElement("div");box.id="good-boys-opening-error";box.style.cssText="position:fixed;inset:0;z-index:180000;display:flex;align-items:center;justify-content:center;padding:22px;background:#02050af2;color:#eaf6ff;font-family:monospace";
    box.innerHTML='<div style="width:min(620px,100%);border:1px solid #ff6b81;background:#071019;padding:22px;box-shadow:0 18px 60px #000"><div style="color:#ff8fa3;font-weight:700;letter-spacing:.12em">GOOD DOGS OPENING ERROR</div><p style="line-height:1.55">The canonical opening stopped before prison gameplay. It will not substitute procedural art or jump around the missing scene.</p><button type="button" style="width:100%;min-height:52px;border:1px solid #67e8f9;background:#0a1a28;color:#fff;font:700 13px monospace">RETRY OPENING</button></div>';
    root.document.body.appendChild(box);box.querySelector("button").onclick=function(){box.remove();launch("retry");};root.__goodBoysOpeningError=String(err&&err.stack||err);root.__goodBoysHardButtonLaunch={ok:false,status:"opening-error",error:root.__goodBoysOpeningError,at:Date.now(),version:VERSION};
  }
  function mount(source){
    var cfg=freshConfig();if(!root.v736||typeof root.v736.start!=="function")throw new Error("v736.start unavailable");clearForeignUi();phase("prison-handoff",{mission:cfg.mission});
    var ok=root.v736.start({mission:cfg.mission,k:false,waldo:false,evidence:[],directGameplay:true}),c=root.NM&&root.NM._v736;
    if(!c||c.ending)throw new Error("Katrin/Manchez M3 prison runtime did not mount synchronously");if(Number(c.m||0)!==cfg.mission)throw new Error("Fresh 118/1984 entry mounted wrong mission: "+String(c.m));
    phase("prison-gameplay",{mission:cfg.mission});root.__goodBoysPhysicalLaunchActive=false;root.__goodBoysHardButtonLaunch={ok:true,status:"prison-gameplay",source:source||"unknown",mission:cfg.mission,active:c.active||null,pair:!!(c.chars&&c.chars.katrin&&c.chars.manchez),flightAuthority:"TechOpsGoodBoysShipFlight",pilotAsset:root.TechOpsGoodBoysShipDeckScene&&root.TechOpsGoodBoysShipDeckScene.PILOT_SRC||null,at:Date.now(),version:VERSION};launching=false;return ok!==false;
  }
  async function opening(source){
    phase("opening-dependencies");setButton("LOADING GOOD DOGS OPENING…",true);await waitForDeps(8000);var o=root.TechOpsGoodBoysOpeningV4;
    phase("cockpit-interact");setButton("MOVE TO PILOT · INTERACT",true);var deck=await o.showDeckInteraction();if(!deck||deck.completed!==true||deck.interaction!=="pilot")throw new Error("Cockpit pilot interaction did not complete");root.__goodBoysHardDeckResult=deck;
    phase("takeover-cutscene",{automatic:true});setButton("PLAYING SHIP TAKEOVER…",true);root.__goodBoysHardTakeoverClip=await playMovie("GD_CUT_02");
    phase("space-flight",{authority:"TechOpsGoodBoysShipFlight"});setButton("FLYING TO BLACKSITE…",true);var flight=await runCanonicalFlight();if(!flight||flight.completed!==true)throw new Error("Canonical Good Ship flight did not complete");root.__goodBoysHardFlightResult=flight;
    phase("prison-approach-cutscene",{automatic:true});setButton("APPROACHING ORBITAL PRISON…",true);root.__goodBoysHardApproachClip=await playMovie("GD_CUT_03");
    phase("crash-scene");var crash=await o.showCrashScene();if(!crash||crash.completed!==true)throw new Error("Crash scene did not complete");root.__goodBoysHardCrashResult=crash;
    return mount(source);
  }
  function launch(source){var now=Date.now();if(launching||now-lastLaunch<700)return true;lastLaunch=now;launching=true;root.__goodBoysPhysicalLaunchActive=true;clearForeignUi();root.__goodBoysHardButtonLaunch={ok:null,status:"opening",source:source||"unknown",mission:3,freshStoryStart:true,automaticCutscenes:true,canonicalFlight:true,at:now,version:VERSION};setButton("OPENING 118/1984 — KATRIN + MANCHEZ…",true);opening(source).catch(function(err){launching=false;root.__goodBoysPhysicalLaunchActive=false;setButton("RETRY 118/1984 — KATRIN + MANCHEZ",false);showOpeningError(err);});return true;}
  function own(e){if(!target(e&&e.target))return;try{e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();}catch(_){}launch(e&&e.type||"event");}
  root.document.addEventListener("pointerup",own,true);root.document.addEventListener("click",own,true);
  root.TechOpsGoodBoysButtonHardFix={VERSION:VERSION,launch:launch,freshConfig:freshConfig,opening:opening,playMovie:playMovie,runCanonicalFlight:runCanonicalFlight,clearForeignUi:clearForeignUi,depsReady:depsReady,get launching(){return launching;}};
})(typeof globalThis!=="undefined"?globalThis:this);
