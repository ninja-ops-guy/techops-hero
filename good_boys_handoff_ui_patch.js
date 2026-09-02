/* TechOps Hero — Good Boys handoff UI isolation v1.
 * Prevents the normal Day 1 workstation presentation from leaking over the
 * standalone Katrin/Manchez campaign while canonical startup is initialized.
 */
(function(root){
  "use strict";
  if(!root||!root.document||root.TechOpsGoodBoysHandoffUIPatch)return;
  var VERSION=1;
  function goodBoysActive(){
    try{
      var r=root.TechOpsGoodBoysIntroRepair,p=root.__goodBoysOpeningPhase,c=root.NM&&root.NM._v736;
      return !!((r&&r.launching)||(p&&p.phase&&p.phase!=="gameplay")||(c&&!c.ending));
    }catch(_){return false;}
  }
  function clearDayPresentation(){
    if(!goodBoysActive())return false;
    try{if(root.TechOpsCampaignNativeAct1Visuals&&typeof root.TechOpsCampaignNativeAct1Visuals.hide==="function")root.TechOpsCampaignNativeAct1Visuals.hide(true);}catch(_){}
    try{var el=root.document.getElementById("act1-reference");if(el)el.remove();}catch(_){}
    root.__goodBoysDayPresentationSuppressed={at:Date.now(),phase:root.__goodBoysOpeningPhase||null};
    return true;
  }
  function launchTarget(t){try{return t&&t.closest&&t.closest("#btn-v736");}catch(_){return null;}}
  root.document.addEventListener("pointerdown",function(e){if(launchTarget(e.target)){root.__goodBoysLaunchIntentAt=Date.now();root.setTimeout(clearDayPresentation,0);}},true);
  root.document.addEventListener("click",function(e){if(launchTarget(e.target)){root.__goodBoysLaunchIntentAt=Date.now();root.setTimeout(clearDayPresentation,0);}},true);
  var observer=new MutationObserver(function(){clearDayPresentation();});
  observer.observe(root.document.documentElement,{subtree:true,childList:true});
  var timer=root.setInterval(clearDayPresentation,100);
  root.TechOpsGoodBoysHandoffUIPatch={VERSION:VERSION,clearDayPresentation:clearDayPresentation,goodBoysActive:goodBoysActive,observer:observer,timer:timer};
})(typeof globalThis!=="undefined"?globalThis:this);
