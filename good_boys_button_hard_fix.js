/* TechOps Hero — 118/1984 hard title-button owner v1.
 * Physical-device reliability patch. This file is loaded immediately after
 * v736_hooks.js so the title button has an authoritative capture handler before
 * any later cinematic/progression wrapper can attach competing listeners.
 * Priority: tapping 118/1984 must always enter Katrin + Manchez gameplay.
 */
(function(root){
  "use strict";
  if(!root||!root.document||root.TechOpsGoodBoysButtonHardFix)return;
  var VERSION=1,lastLaunch=0,launching=false;
  function target(t){try{return t&&t.closest&&t.closest("#btn-v736");}catch(_){return null;}}
  function saved(){
    try{
      var raw=root.localStorage&&root.localStorage.getItem("techops_save"),s=raw?JSON.parse(raw):null,m=s&&s.meta&&s.meta._v736||null;
      return {mission:m&&Number(m.m)>1?Math.max(2,Math.min(8,Number(m.m))):2,k:!!(m&&m.k),waldo:!!(m&&m.waldo),evidence:m&&Array.isArray(m.evidence)?m.evidence.slice():[]};
    }catch(_){return {mission:2,k:false,waldo:false,evidence:[]};}
  }
  function clearForeignUi(){
    try{["act1-reference","good-boys-campaign-intro","good-boys-ship-interlude","good-boys-story-cine","good-boys-premise"].forEach(function(id){var n=root.document.getElementById(id);if(n)n.remove();});}catch(_){}
    try{var o=root.document.getElementById("good-dogs-cutscene-overlay");if(o){o.classList.remove("active");o.style.display="none";}}catch(_){}
    try{var d=root.document.getElementById("dialogue");if(d)d.classList.add("hidden");if(root.S)root.S.inDialog=false;}catch(_){}
    try{var p=root.document.getElementById("panel");if(p)p.classList.add("hidden");}catch(_){}
    try{var e=root.document.getElementById("eod");if(e)e.classList.add("hidden");}catch(_){}
  }
  function launch(source){
    var now=Date.now();if(launching||now-lastLaunch<900)return true;lastLaunch=now;launching=true;
    var cfg=saved(),b=root.document.getElementById("btn-v736");
    root.__goodBoysHardButtonLaunch={ok:null,status:"starting",source:source||"unknown",mission:cfg.mission,at:now,version:VERSION};
    try{if(b){b.disabled=true;b.textContent="STARTING KATRIN + MANCHEZ · M"+cfg.mission+"…";}}catch(_){}
    clearForeignUi();
    try{
      if(!root.v736||typeof root.v736.start!=="function")throw new Error("v736.start unavailable");
      /* Direct gameplay is intentional here. The authored opening remains a
         separate polish path; the title button itself is never allowed to softlock. */
      var ok=root.v736.start({mission:cfg.mission,k:cfg.k,waldo:cfg.waldo,evidence:cfg.evidence,directGameplay:true});
      var c=root.NM&&root.NM._v736;
      if(!c||c.ending)throw new Error("Katrin/Manchez runtime did not mount synchronously");
      root.__goodBoysOpeningPhase={phase:"gameplay",mission:Number(c.m||cfg.mission),owner:"hard-title-button-v1",at:Date.now()};
      root.__goodBoysPhysicalLaunchActive=false;
      root.__goodBoysHardButtonLaunch={ok:true,status:"gameplay",source:source||"unknown",mission:Number(c.m||cfg.mission),active:c.active||null,pair:!!(c.chars&&c.chars.katrin&&c.chars.manchez),at:Date.now(),version:VERSION};
      launching=false;
      return ok!==false;
    }catch(err){
      launching=false;root.__goodBoysPhysicalLaunchActive=false;
      root.__goodBoysHardButtonLaunch={ok:false,status:"failed",source:source||"unknown",mission:cfg.mission,error:String(err&&err.stack||err),at:Date.now(),version:VERSION};
      try{if(b){b.disabled=false;b.textContent="RETRY 118/1984 — KATRIN + MANCHEZ";}}catch(_){}
      return false;
    }
  }
  function own(e){
    if(!target(e&&e.target))return;
    try{e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();}catch(_){}
    launch(e&&e.type||"event");
  }
  /* Pointer-up gives iOS a direct physical-input path. Click is retained for
     keyboard/desktop activation and as a fallback on browsers without PointerEvent. */
  root.document.addEventListener("pointerup",own,true);
  root.document.addEventListener("click",own,true);
  root.TechOpsGoodBoysButtonHardFix={VERSION:VERSION,launch:launch,saved:saved,clearForeignUi:clearForeignUi,get launching(){return launching;}};
})(typeof globalThis!=="undefined"?globalThis:this);
