/* TechOps Hero — 118/1984 hard title-button owner v6.
 * Physical-device title entry always starts the authored side-story opening:
 * ship deck INTERACT -> playable space flight -> GD_CUT_03 orbital/prison
 * approach -> shuttle crash -> fresh M2 prison gameplay.
 *
 * Important: the title button does NOT resume a persisted prison mission. A
 * separate resume affordance can be added later; title entry must remain a
 * deterministic story start while this campaign is under acceptance testing.
 */
(function(root){
  "use strict";
  if(!root||!root.document)return;
  var PRIOR=root.TechOpsGoodBoysButtonHardFix;
  if(PRIOR&&Number(PRIOR.VERSION||0)>=6)return;
  var VERSION=6,lastLaunch=0,launching=false,depTimer=0;
  function target(t){try{return t&&t.closest&&t.closest("#btn-v736");}catch(_){return null;}}
  function freshConfig(){return {mission:2,k:false,waldo:false,evidence:[]};}
  function phase(name,extra){root.__goodBoysOpeningPhase=Object.assign({phase:name,owner:"hard-title-button-v6",at:Date.now()},extra||{});}
  function clearForeignUi(){try{["act1-reference","good-boys-story-cine","good-boys-premise","good-boys-ship-interlude","good-boys-opening-error","good-boys-deck-v4","good-boys-flight-v4","good-boys-crash-v4"].forEach(function(id){var n=root.document.getElementById(id);if(n)n.remove();});}catch(_){}try{var d=root.document.getElementById("dialogue");if(d)d.classList.add("hidden");if(root.S)root.S.inDialog=false;}catch(_){}try{var p=root.document.getElementById("panel");if(p)p.classList.add("hidden");}catch(_){}try{var e=root.document.getElementById("eod");if(e)e.classList.add("hidden");}catch(_){} }
  function setButton(text,disabled){try{var b=root.document.getElementById("btn-v736");if(b){b.disabled=!!disabled;b.textContent=text;}}catch(_){} }
  function depsReady(){var c=root.GoodDogsCutscenes,o=root.TechOpsGoodBoysOpeningV4,a=root.TechOpsGoodDogsSingleAtlasAuthority;return !!(c&&parseFloat(c.VERSION||0)>=2.9&&typeof c.play==="function"&&o&&typeof o.showDeckInteraction==="function"&&typeof o.showSpaceFlight==="function"&&typeof o.showCrashScene==="function"&&a&&Number(a.VERSION||0)>=2&&a.installed!==false);}
  function waitForDeps(timeout){return new Promise(function(resolve,reject){var start=Date.now();function poll(){if(depsReady()){resolve(true);return;}if(Date.now()-start>=timeout){reject(new Error("Good Dogs opening v6 dependencies did not become ready"));return;}depTimer=root.setTimeout(poll,50);}poll();});}
  function showOpeningError(err){var old=root.document.getElementById("good-boys-opening-error");if(old)old.remove();var box=root.document.createElement("div");box.id="good-boys-opening-error";box.style.cssText="position:fixed;inset:0;z-index:160000;display:flex;align-items:center;justify-content:center;padding:22px;background:#02050af2;color:#eaf6ff;font-family:monospace";box.innerHTML='<div style="width:min(620px,100%);border:1px solid #ff6b81;background:#071019;padding:22px;box-shadow:0 18px 60px #000"><div style="color:#ff8fa3;font-weight:700;letter-spacing:.12em">GOOD DOGS OPENING ERROR</div><p style="line-height:1.55">The story opening stopped before prison gameplay. It will not jump around the missing scene.</p><button type="button" style="width:100%;min-height:52px;border:1px solid #67e8f9;background:#0a1a28;color:#fff;font:700 13px monospace">RETRY OPENING</button></div>';root.document.body.appendChild(box);box.querySelector("button").onclick=function(){box.remove();launch("retry");};root.__goodBoysOpeningError=String(err&&err.stack||err);root.__goodBoysHardButtonLaunch={ok:false,status:"opening-error",error:root.__goodBoysOpeningError,at:Date.now(),version:VERSION};}
  function mount(source){var cfg=freshConfig();if(!root.v736||typeof root.v736.start!=="function")throw new Error("v736.start unavailable");clearForeignUi();phase("prison-handoff",{mission:2});var ok=root.v736.start({mission:2,k:false,waldo:false,evidence:[],directGameplay:true});var c=root.NM&&root.NM._v736;if(!c||c.ending)throw new Error("Katrin/Manchez M2 prison runtime did not mount synchronously");if(Number(c.m||0)!==2)throw new Error("Fresh 118/1984 entry mounted wrong mission: "+String(c.m));phase("prison-gameplay",{mission:2});root.__goodBoysPhysicalLaunchActive=false;root.__goodBoysHardButtonLaunch={ok:true,status:"prison-gameplay",source:source||"unknown",mission:2,active:c.active||null,pair:!!(c.chars&&c.chars.katrin&&c.chars.manchez),atlasAuthority:root.__goodDogsAtlasAuthority||null,actorAuthority:root.__goodDogsActorRenderAuthority||null,at:Date.now(),version:VERSION};launching=false;return ok!==false;}
  function validMovieResult(result,id){if(!result)throw new Error(id+" returned no result");if(result.result&&result.result!=="COMPLETED"&&result.result!=="USER_SKIPPED")throw new Error(id+" did not complete: "+String(result.result));return result;}
  async function opening(source){phase("opening-dependencies");setButton("LOADING GOOD DOGS OPENING…",true);await waitForDeps(7000);var cine=root.GoodDogsCutscenes,o=root.TechOpsGoodBoysOpeningV4;
    /* GD_CUT_01 is intentionally absent here. The manifest places Signal Beyond
       Earth after the Garage Receiver, not at this ship-side-story entry. */
    phase("ship-deck-interact");setButton("BOARDING SHIP…",true);var deck=await o.showDeckInteraction();if(!deck||deck.completed!==true)throw new Error("Ship deck interaction did not complete");root.__goodBoysHardDeckResult=deck;
    phase("space-flight");setButton("FLYING TO BLACKSITE…",true);var flight=await o.showSpaceFlight();if(!flight||flight.completed!==true)throw new Error("Space flight did not complete");root.__goodBoysHardFlightResult=flight;
    phase("prison-approach-cutscene");setButton("APPROACHING ORBITAL PRISON…",true);var approach=validMovieResult(await cine.play("GD_CUT_03",{force:true,muted:true}),"GD_CUT_03");root.__goodBoysHardApproachClip=approach;
    phase("crash-scene");var crash=await o.showCrashScene();if(!crash||crash.completed!==true)throw new Error("Crash scene did not complete");root.__goodBoysHardCrashResult=crash;
    return mount(source);
  }
  function launch(source){var now=Date.now();if(launching||now-lastLaunch<700)return true;lastLaunch=now;launching=true;root.__goodBoysPhysicalLaunchActive=true;clearForeignUi();root.__goodBoysHardButtonLaunch={ok:null,status:"opening",source:source||"unknown",mission:2,freshStoryStart:true,at:now,version:VERSION};setButton("OPENING 118/1984 — KATRIN + MANCHEZ…",true);opening(source).catch(function(err){launching=false;root.__goodBoysPhysicalLaunchActive=false;setButton("RETRY 118/1984 — KATRIN + MANCHEZ",false);showOpeningError(err);});return true;}
  function own(e){if(!target(e&&e.target))return;try{e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();}catch(_){}launch(e&&e.type||"event");}
  root.document.addEventListener("pointerup",own,true);root.document.addEventListener("click",own,true);root.TechOpsGoodBoysButtonHardFix={VERSION:VERSION,launch:launch,freshConfig:freshConfig,opening:opening,clearForeignUi:clearForeignUi,depsReady:depsReady,get launching(){return launching;}};
})(typeof globalThis!=="undefined"?globalThis:this);