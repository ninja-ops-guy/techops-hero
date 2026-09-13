/* TechOps Hero — Night mobile visual cohesion v1.
 * Evidence basis: live iPhone capture IMG_2750 (2026-09-12).
 * Owns only ordinary Night Crawler mobile presentation; no combat semantics.
 */
(function(root){
  "use strict";
  if(!root||root.TechOpsNightMobileVisualCohesion)return;
  var VERSION=1,observer=null;
  function active(){
    try{return !!(root.S&&root.S.nightMode&&root.TechOpsNightInput&&root.TechOpsNightInput.owns&&root.TechOpsNightInput.owns());}catch(e){return false;}
  }
  function installStyle(){
    if(!root.document)return false;
    var s=root.document.getElementById("night-mobile-visual-cohesion-style");
    if(!s){s=root.document.createElement("style");s.id="night-mobile-visual-cohesion-style";(root.document.head||root.document.documentElement).appendChild(s);}
    s.textContent=[
      "@media (pointer:coarse){",
      "body.night-mobile-cohesion #v55-nmbtns[data-night-combat-input=\"active\"]{grid-template-columns:repeat(3,52px)!important;gap:6px!important;right:max(8px,env(safe-area-inset-right))!important;bottom:max(154px,calc(env(safe-area-inset-bottom) + 154px))!important}",
      "body.night-mobile-cohesion #v55-nmbtns[data-night-combat-input=\"active\"]>.v55-nbtn{width:52px!important;height:42px!important;min-width:52px!important;min-height:42px!important;font-size:10px!important;border-radius:9px!important}",
      "body.night-mobile-cohesion #touch-buttons{right:max(12px,env(safe-area-inset-right))!important;bottom:max(18px,env(safe-area-inset-bottom))!important;gap:8px!important}",
      "body.night-mobile-cohesion #touch-buttons #tb-interact{width:60px!important;height:60px!important;font-size:16px!important}",
      "body.night-mobile-cohesion #touch-buttons #tb-menu{width:40px!important;height:40px!important;font-size:14px!important}",
      "body.night-mobile-cohesion #dpad{left:max(12px,env(safe-area-inset-left))!important;bottom:max(16px,env(safe-area-inset-bottom))!important;grid-template-columns:repeat(3,46px)!important;grid-template-rows:repeat(3,46px)!important;gap:3px!important}",
      "body.night-mobile-cohesion #dpad .dbtn{font-size:17px!important;border-width:2px!important}",
      "body.night-mobile-cohesion #toast{top:auto!important;bottom:max(258px,calc(env(safe-area-inset-bottom) + 258px))!important;max-width:calc(100vw - 28px)!important;padding:6px 10px!important;border-width:1px!important;border-radius:7px!important;font-size:10px!important;line-height:1.35!important;background:#09111bea!important}",
      "}"
    ].join("");
    return true;
  }
  function normalizeHint(){
    try{
      var t=root.document&&root.document.getElementById("toast");
      if(!t||!active())return false;
      var text=String(t.textContent||"");
      var hint="Double-tap ←/→: DASH · Then ATTACK: GRAB · ↑/↓ AIM · JUMP to follow";
      if(/G\s*\/\s*GRAB|SPACE\s*\/\s*JUMP|Double-tap/i.test(text)&&text!==hint)t.textContent=hint;
      return true;
    }catch(e){return false;}
  }
  function sync(){
    installStyle();
    try{if(root.document&&root.document.body)root.document.body.classList.toggle("night-mobile-cohesion",active());}catch(e){}
    normalizeHint();
  }
  function installObserver(){
    if(!root.document||observer||!root.MutationObserver)return;
    var box=root.document.getElementById("v55-nmbtns"),toast=root.document.getElementById("toast");
    observer=new root.MutationObserver(sync);
    if(box)observer.observe(box,{attributes:true,attributeFilter:["data-night-combat-input","class"]});
    if(toast)observer.observe(toast,{childList:true,characterData:true,subtree:true,attributes:true,attributeFilter:["class"]});
  }
  sync();installObserver();
  if(root.addEventListener){root.addEventListener("techops:production-ready",function(){sync();installObserver();});root.addEventListener("resize",sync,{passive:true});}
  root.TechOpsNightMobileVisualCohesion={VERSION:VERSION,sync:sync,active:active,installStyle:installStyle,normalizeHint:normalizeHint};
})(typeof globalThis!=="undefined"?globalThis:this);
