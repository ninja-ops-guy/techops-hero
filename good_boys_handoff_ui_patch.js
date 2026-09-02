/* TechOps Hero — Good Boys handoff UI isolation v3.
 * Passive presentation guard only. The 118/1984 title button has exactly one
 * launch authority: TechOpsGoodBoysButtonHardFix. This module may suppress
 * stale Day 1 UI while that flow is active, but it must never start/resume a
 * mission or consume the title click itself.
 */
(function(root){
  "use strict";
  if(!root||!root.document)return;
  var PRIOR=root.TechOpsGoodBoysHandoffUIPatch;
  if(PRIOR&&Number(PRIOR.VERSION||0)>=3)return;
  try{if(PRIOR&&PRIOR.timer)root.clearInterval(PRIOR.timer);if(PRIOR&&PRIOR.observer)PRIOR.observer.disconnect();}catch(_){}
  var VERSION=3;

  function launchTarget(t){try{return t&&t.closest&&t.closest("#btn-v736");}catch(_){return null;}}
  function runtime(){try{return root.NM&&root.NM._v736&&!root.NM._v736.ending?root.NM._v736:null;}catch(_){return null;}}
  function goodBoysActive(){
    try{
      var p=root.__goodBoysOpeningPhase,c=runtime(),h=root.TechOpsGoodBoysButtonHardFix;
      return !!(root.__goodBoysPhysicalLaunchActive||(h&&h.launching)||(p&&p.phase&&p.phase!=="gameplay"&&p.phase!=="prison-gameplay")||c);
    }catch(_){return false;}
  }
  function clearDayPresentation(){
    if(!goodBoysActive())return false;
    try{if(root.TechOpsCampaignNativeAct1Visuals&&typeof root.TechOpsCampaignNativeAct1Visuals.hide==="function")root.TechOpsCampaignNativeAct1Visuals.hide(true);}catch(_){}
    try{var el=root.document.getElementById("act1-reference");if(el)el.remove();}catch(_){}
    try{
      var d=root.document.getElementById("dialogue"),name=root.document.getElementById("dlg-name");
      if(d&&name&&/WORKSTATION|COMPANY|ENGINEERING THE HUMAN CONNECTION|SELECT SHIFT DIFFICULTY|CIO DISPATCH/i.test(name.textContent||""))d.classList.add("hidden");
    }catch(_){}
    root.__goodBoysDayPresentationSuppressed={at:Date.now(),phase:root.__goodBoysOpeningPhase||null,physical:!!root.__goodBoysPhysicalLaunchActive,passive:true};
    return true;
  }
  function markIntent(e){
    if(!launchTarget(e&&e.target))return;
    root.__goodBoysLaunchIntentAt=Date.now();
    root.__goodBoysHandoffAuthority={owner:"TechOpsGoodBoysButtonHardFix",passive:true,version:VERSION,at:Date.now()};
    root.setTimeout(clearDayPresentation,0);
  }

  root.document.addEventListener("pointerdown",markIntent,true);
  var observer=new MutationObserver(function(){clearDayPresentation();});
  observer.observe(root.document.documentElement,{subtree:true,childList:true});
  var timer=root.setInterval(clearDayPresentation,80);
  root.__goodBoysHandoffAuthority={owner:"TechOpsGoodBoysButtonHardFix",passive:true,version:VERSION,at:Date.now()};
  root.TechOpsGoodBoysHandoffUIPatch={VERSION:VERSION,clearDayPresentation:clearDayPresentation,goodBoysActive:goodBoysActive,launchOwner:"TechOpsGoodBoysButtonHardFix",passive:true,observer:observer,timer:timer};
})(typeof globalThis!=="undefined"?globalThis:this);
