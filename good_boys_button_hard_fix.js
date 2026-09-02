/* TechOps Hero — 118/1984 hard title-button owner v2.
 * Keeps the proven physical-device button ownership, but restores the authored
 * opening for mission 2: cutscene 01 -> playable ship -> cutscene 02 -> M2.
 */
(function(root){
  "use strict";
  if(!root||!root.document)return;
  var PRIOR=root.TechOpsGoodBoysButtonHardFix;
  if(PRIOR&&Number(PRIOR.VERSION||0)>=2)return;
  var VERSION=2,lastLaunch=0,launching=false;
  function target(t){try{return t&&t.closest&&t.closest("#btn-v736");}catch(_){return null;}}
  function saved(){
    try{var raw=root.localStorage&&root.localStorage.getItem("techops_save"),s=raw?JSON.parse(raw):null,m=s&&s.meta&&s.meta._v736||null;return {mission:m&&Number(m.m)>1?Math.max(2,Math.min(8,Number(m.m))):2,k:!!(m&&m.k),waldo:!!(m&&m.waldo),evidence:m&&Array.isArray(m.evidence)?m.evidence.slice():[]};}
    catch(_){return {mission:2,k:false,waldo:false,evidence:[]};}
  }
  function phase(name,extra){root.__goodBoysOpeningPhase=Object.assign({phase:name,owner:"hard-title-button-v2",at:Date.now()},extra||{});}
  function clearForeignUi(){
    try{["act1-reference","good-boys-story-cine","good-boys-premise"].forEach(function(id){var n=root.document.getElementById(id);if(n)n.remove();});}catch(_){}
    try{var d=root.document.getElementById("dialogue");if(d)d.classList.add("hidden");if(root.S)root.S.inDialog=false;}catch(_){}
    try{var p=root.document.getElementById("panel");if(p)p.classList.add("hidden");}catch(_){}
    try{var e=root.document.getElementById("eod");if(e)e.classList.add("hidden");}catch(_){}
  }
  function mount(cfg,source){
    if(!root.v736||typeof root.v736.start!=="function")throw new Error("v736.start unavailable");
    clearForeignUi();phase("campaign-handoff",{mission:cfg.mission});
    var ok=root.v736.start({mission:cfg.mission,k:cfg.k,waldo:cfg.waldo,evidence:cfg.evidence,directGameplay:true});
    var c=root.NM&&root.NM._v736;if(!c||c.ending)throw new Error("Katrin/Manchez runtime did not mount synchronously");
    phase("gameplay",{mission:Number(c.m||cfg.mission)});root.__goodBoysPhysicalLaunchActive=false;
    root.__goodBoysHardButtonLaunch={ok:true,status:"gameplay",source:source||"unknown",mission:Number(c.m||cfg.mission),active:c.active||null,pair:!!(c.chars&&c.chars.katrin&&c.chars.manchez),at:Date.now(),version:VERSION};
    launching=false;return ok!==false;
  }
  async function opening(cfg,source){
    var cine=root.GoodDogsCutscenes,repair=root.TechOpsGoodBoysIntroRepair;
    if(!cine||typeof cine.play!=="function"||!repair||typeof repair.showShipInterlude!=="function")throw new Error("Good Boys authored opening unavailable");
    phase("clip1");
    await cine.play("GD_CUT_01",{force:true,muted:true,allowIOSVideo:true});
    phase("ship-interaction");
    await repair.showShipInterlude();
    phase("clip2");
    await cine.play("GD_CUT_02",{force:true,muted:true,allowIOSVideo:true});
    return mount(cfg,source);
  }
  function launch(source){
    var now=Date.now();if(launching||now-lastLaunch<900)return true;lastLaunch=now;launching=true;
    var cfg=saved(),b=root.document.getElementById("btn-v736");root.__goodBoysPhysicalLaunchActive=true;
    root.__goodBoysHardButtonLaunch={ok:null,status:cfg.mission===2?"opening":"starting",source:source||"unknown",mission:cfg.mission,at:now,version:VERSION};
    try{if(b){b.disabled=true;b.textContent=cfg.mission===2?"OPENING GOOD DOGS PROTOCOL…":"RESUMING KATRIN + MANCHEZ · M"+cfg.mission+"…";}}catch(_){}
    clearForeignUi();
    if(cfg.mission===2){opening(cfg,source).catch(function(err){root.__goodBoysOpeningError=String(err&&err.stack||err);try{mount(cfg,source);}catch(err2){launching=false;root.__goodBoysPhysicalLaunchActive=false;root.__goodBoysHardButtonLaunch={ok:false,status:"failed",source:source||"unknown",mission:cfg.mission,error:String(err2&&err2.stack||err2),openingError:root.__goodBoysOpeningError,at:Date.now(),version:VERSION};try{if(b){b.disabled=false;b.textContent="RETRY 118/1984 — KATRIN + MANCHEZ";}}catch(_){}}});return true;}
    try{return mount(cfg,source);}catch(err){launching=false;root.__goodBoysPhysicalLaunchActive=false;root.__goodBoysHardButtonLaunch={ok:false,status:"failed",source:source||"unknown",mission:cfg.mission,error:String(err&&err.stack||err),at:Date.now(),version:VERSION};try{if(b){b.disabled=false;b.textContent="RETRY 118/1984 — KATRIN + MANCHEZ";}}catch(_){}return false;}
  }
  function own(e){if(!target(e&&e.target))return;try{e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();}catch(_){}launch(e&&e.type||"event");}
  root.document.addEventListener("pointerup",own,true);root.document.addEventListener("click",own,true);
  root.TechOpsGoodBoysButtonHardFix={VERSION:VERSION,launch:launch,saved:saved,opening:opening,clearForeignUi:clearForeignUi,get launching(){return launching;}};
})(typeof globalThis!=="undefined"?globalThis:this);
