/* TechOps Hero — Good Boys handoff UI isolation v3.
 * The physical title capture no longer runs an independent intro/mission path.
 * It delegates to TechOpsGoodBoysButtonHardFix v8 so cockpit interaction,
 * automatic movies and the supplied-asset Good Ship flight have one owner.
 */
(function(root){
  "use strict";
  if(!root||!root.document)return;
  var PRIOR=root.TechOpsGoodBoysHandoffUIPatch;
  if(PRIOR&&Number(PRIOR.VERSION||0)>=3)return;
  try{if(PRIOR&&PRIOR.timer)root.clearInterval(PRIOR.timer);if(PRIOR&&PRIOR.observer)PRIOR.observer.disconnect();}catch(_){}
  var VERSION=3,launching=false,token=0;
  function launchTarget(t){try{return t&&t.closest&&t.closest("#btn-v736");}catch(_){return null;}}
  function runtime(){try{return root.NM&&root.NM._v736&&!root.NM._v736.ending?root.NM._v736:null;}catch(_){return null;}}
  function goodBoysActive(){try{var p=root.__goodBoysOpeningPhase;return !!(launching||root.__goodBoysPhysicalLaunchActive||(p&&p.phase&&p.phase!=="gameplay")||runtime());}catch(_){return false;}}
  function clearDayPresentation(){
    if(!goodBoysActive())return false;
    try{if(root.TechOpsCampaignNativeAct1Visuals&&typeof root.TechOpsCampaignNativeAct1Visuals.hide==="function")root.TechOpsCampaignNativeAct1Visuals.hide(true);}catch(_){}
    try{var el=root.document.getElementById("act1-reference");if(el)el.remove();}catch(_){}
    try{var d=root.document.getElementById("dialogue"),name=root.document.getElementById("dlg-name");if(d&&name&&/WORKSTATION|COMPANY|ENGINEERING THE HUMAN CONNECTION|SELECT SHIFT DIFFICULTY|CIO DISPATCH/i.test(name.textContent||""))d.classList.add("hidden");}catch(_){}
    root.__goodBoysDayPresentationSuppressed={at:Date.now(),phase:root.__goodBoysOpeningPhase||null,physical:!!root.__goodBoysPhysicalLaunchActive,owner:"handoff-v3"};return true;
  }
  function waitTerminal(myToken){return new Promise(function(resolve,reject){var started=Date.now();function poll(){if(myToken!==token){reject(new Error("Good Boys launch superseded"));return;}var h=root.TechOpsGoodBoysButtonHardFix;if(h&&Number(h.VERSION||0)>=8&&typeof h.launch==="function"){resolve(h);return;}if(Date.now()-started>3500){reject(new Error("Terminal Good Boys launch authority unavailable"));return;}root.setTimeout(poll,40);}poll();});}
  function isolatedLaunch(e){
    var b=launchTarget(e&&e.target);if(!b)return false;try{e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();}catch(_){}
    if(launching)return true;var myToken=++token;launching=true;root.__goodBoysPhysicalLaunchActive=true;root.__goodBoysLaunchIntentAt=Date.now();clearDayPresentation();
    try{b.disabled=true;b.dataset.gbPhysicalLaunch="terminal-v8";b.textContent="OPENING 118/1984 — KATRIN + MANCHEZ…";}catch(_){}
    root.__goodBoysPhysicalLaunch={ok:null,status:"delegating",at:Date.now(),owner:"handoff-v3",target:"TechOpsGoodBoysButtonHardFix"};
    waitTerminal(myToken).then(function(h){if(myToken!==token)return;launching=false;root.__goodBoysPhysicalLaunch={ok:null,status:"terminal-owner",at:Date.now(),owner:"handoff-v3",terminalVersion:h.VERSION};h.launch("handoff-ui-v3");}).catch(function(err){launching=false;root.__goodBoysPhysicalLaunchActive=false;root.__goodBoysPhysicalLaunch={ok:false,status:"authority-error",error:String(err&&err.stack||err),at:Date.now(),owner:"handoff-v3"};try{b.disabled=false;b.textContent="RETRY 118/1984 — KATRIN + MANCHEZ";}catch(_){}});return true;
  }
  root.document.addEventListener("pointerdown",function(e){if(launchTarget(e.target)){root.__goodBoysLaunchIntentAt=Date.now();root.__goodBoysPhysicalLaunchActive=true;root.setTimeout(clearDayPresentation,0);}},true);
  root.document.addEventListener("click",isolatedLaunch,true);
  var observer=new MutationObserver(function(){clearDayPresentation();});observer.observe(root.document.documentElement,{subtree:true,childList:true});
  var timer=root.setInterval(clearDayPresentation,100);
  root.TechOpsGoodBoysHandoffUIPatch={VERSION:VERSION,isolatedLaunch:isolatedLaunch,clearDayPresentation:clearDayPresentation,goodBoysActive:goodBoysActive,waitTerminal:waitTerminal,observer:observer,timer:timer,get launching(){return launching;}};
})(typeof globalThis!=="undefined"?globalThis:this);
