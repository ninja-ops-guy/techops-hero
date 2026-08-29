/* Good Boys cinematic UI guard v1.
 * Presentation only: hide gameplay controls and canvas HUD whenever a Good Boys
 * cinematic or modal dialogue is active, so story frames stay readable on iOS.
 */
(function(root){
  "use strict";
  if(!root||root.TechOpsGoodBoysCinematicUiGuard)return;
  var VERSION=1,style=null,timer=null;
  function world(){try{return typeof NM!=="undefined"&&NM?NM:(root.NM||null);}catch(e){return root.NM||null;}}
  function state(){try{return typeof S!=="undefined"&&S?S:(root.S||null);}catch(e){return root.S||null;}}
  function active(){try{var n=world(),s=state();return !!(n&&n._v736||s&&s.meta&&s.meta._v736&&!s.meta._v736.done);}catch(e){return false;}}
  function visible(id){try{var el=root.document&&root.document.getElementById(id);if(!el)return false;if(el.classList&&el.classList.contains("hidden"))return false;var st=root.getComputedStyle?root.getComputedStyle(el):el.style;return !st||st.display!=="none"&&st.visibility!=="hidden"&&Number(st.opacity||1)!==0;}catch(e){return false;}}
  function blocked(){try{var s=state();return active()&&!!((s&&s.inDialog)||visible("dialogue")||visible("v725-cine")||visible("good-boys-story-cine")||visible("gb-prison-cine")||visible("good-boys-earthfall-cine")||visible("good-boys-campaign-intro"));}catch(e){return false;}}
  function installStyle(){try{if(!root.document)return;style=root.document.getElementById("good-boys-cinematic-ui-guard-style");if(!style){style=root.document.createElement("style");style.id="good-boys-cinematic-ui-guard-style";(root.document.head||root.document.documentElement).appendChild(style);}style.textContent="body.good-boys-ui-blocked #good-dogs-touch,body.good-boys-ui-blocked #good-boys-loop-controls,body.good-boys-ui-blocked #good-boys-director-controls,body.good-boys-ui-blocked #touch-buttons{display:none!important;visibility:hidden!important;opacity:0!important;pointer-events:none!important}body.good-boys-ui-blocked #hud,body.good-boys-ui-blocked #quest-tracker{display:none!important}";}catch(e){root.__goodBoysUiGuardStyleError=String(e&&e.stack||e);}}
  function hide(el){if(!el)return;if(el.dataset.gbUiGuardDisplay===undefined)el.dataset.gbUiGuardDisplay=el.style.display||"";if(el.dataset.gbUiGuardVisibility===undefined)el.dataset.gbUiGuardVisibility=el.style.visibility||"";if(el.dataset.gbUiGuardPointer===undefined)el.dataset.gbUiGuardPointer=el.style.pointerEvents||"";el.style.setProperty("display","none","important");el.style.setProperty("visibility","hidden","important");el.style.setProperty("pointer-events","none","important");el.inert=true;el.setAttribute("aria-hidden","true");}
  function restore(el){if(!el)return;if(el.dataset.gbUiGuardDisplay!==undefined){el.style.display=el.dataset.gbUiGuardDisplay;delete el.dataset.gbUiGuardDisplay;}if(el.dataset.gbUiGuardVisibility!==undefined){el.style.visibility=el.dataset.gbUiGuardVisibility;delete el.dataset.gbUiGuardVisibility;}if(el.dataset.gbUiGuardPointer!==undefined){el.style.pointerEvents=el.dataset.gbUiGuardPointer;delete el.dataset.gbUiGuardPointer;}el.inert=false;el.removeAttribute("aria-hidden");}
  function apply(){try{installStyle();var on=blocked();root.__goodBoysHideHud=on;if(root.document&&root.document.body)root.document.body.classList.toggle("good-boys-ui-blocked",on);if(!root.document)return;["good-dogs-touch","good-boys-loop-controls","good-boys-director-controls","touch-buttons"].forEach(function(id){var list=root.document.querySelectorAll("#"+id);for(var i=0;i<list.length;i++)on?hide(list[i]):restore(list[i]);});}catch(e){root.__goodBoysUiGuardError=String(e&&e.stack||e);}}
  apply();try{timer=root.setInterval?root.setInterval(apply,80):null;}catch(e){}
  root.TechOpsGoodBoysCinematicUiGuard={VERSION:VERSION,active:active,blocked:blocked,apply:apply,timer:timer};
})(typeof globalThis!=="undefined"?globalThis:this);
