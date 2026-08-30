/* TechOps Hero — normal-day cinematic mobile guard v1.
 * Adds explicit HTML touch controls to the shared v7.25 canvas cinematic.
 * This is intentionally independent of scene art so a canvas/input regression
 * cannot strand a normal day run with the ticket clock paused.
 */
(function(root){
  "use strict";
  if(!root||root.TechOpsDayCinematicMobileGuard)return;
  var VERSION=1,observer=null,style=null,lastOverlay=null,cleanupTimer=null;

  function isGoodBoys(){
    try{return root.__productionDesiredMode==="goodboys"||root.__productionActiveMode==="goodboys"||!!(root.NM&&root.NM._v736);}catch(e){return false;}
  }
  function installStyle(){
    if(!root.document)return;
    style=root.document.getElementById("day-cinematic-mobile-guard-style");
    if(!style){style=root.document.createElement("style");style.id="day-cinematic-mobile-guard-style";(root.document.head||root.document.documentElement).appendChild(style);}
    style.textContent=[
      "#v725-cine .day-cine-touch{position:absolute;left:max(12px,env(safe-area-inset-left));right:max(12px,env(safe-area-inset-right));bottom:max(14px,calc(env(safe-area-inset-bottom) + 8px));z-index:10003;display:flex;flex-direction:column;gap:8px;pointer-events:none;font-family:monospace}",
      "#v725-cine .day-cine-actions{display:flex;justify-content:flex-end;gap:8px;pointer-events:auto}",
      "#v725-cine .day-cine-choices{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px;pointer-events:auto}",
      "#v725-cine .day-cine-touch button{box-sizing:border-box;min-height:44px;border:1.5px solid #58d7ff;border-radius:10px;background:rgba(3,12,24,.94);color:#eef9ff;font:700 11px/1.15 monospace;letter-spacing:.03em;padding:9px 12px;touch-action:manipulation;box-shadow:0 4px 16px rgba(0,0,0,.45)}",
      "#v725-cine .day-cine-actions button{min-width:118px;background:rgba(4,18,32,.97)}",
      "#v725-cine .day-cine-choices button{border-color:#ffbd55;color:#fff7df;background:rgba(24,14,5,.94)}",
      "@media(min-width:700px){#v725-cine .day-cine-touch{left:50%;right:auto;width:min(720px,90vw);transform:translateX(-50%)}#v725-cine .day-cine-choices{grid-template-columns:repeat(4,1fr)}}"
    ].join("");
  }
  function releaseRun(){
    try{
      var d=root.document;if(!d)return;
      var realDialogue=d.getElementById("dialogue"),battle=d.getElementById("battle");
      var dialogueVisible=realDialogue&&!realDialogue.classList.contains("hidden")&&root.getComputedStyle(realDialogue).display!=="none";
      var battleVisible=battle&&!battle.classList.contains("hidden")&&root.getComputedStyle(battle).display!=="none";
      if(root.S&&!dialogueVisible&&!battleVisible&&!isGoodBoys())root.S.inDialog=false;
      d.body&&d.body.classList.remove("day-cinematic-active");
      root.dispatchEvent&&root.dispatchEvent(new Event("resize"));
    }catch(e){root.__dayCinematicReleaseError=String(e&&e.stack||e);}
  }
  function skip(){
    try{if(root.v725&&typeof root.v725.skip==="function")root.v725.skip();}catch(e){root.__dayCinematicSkipError=String(e&&e.stack||e);}
    root.setTimeout&&root.setTimeout(releaseRun,80);
  }
  function choose(i){
    try{if(root.v725&&typeof root.v725.choose==="function")root.v725.choose(i);}catch(e){root.__dayCinematicChoiceError=String(e&&e.stack||e);}
  }
  function button(label,fn,cls){var b=root.document.createElement("button");b.type="button";b.textContent=label;if(cls)b.className=cls;b.addEventListener("pointerdown",function(e){e.preventDefault();e.stopPropagation();fn();},{passive:false});b.addEventListener("click",function(e){e.preventDefault();e.stopPropagation();});return b;}
  function attach(overlay){
    if(!overlay||isGoodBoys())return false;
    installStyle();
    if(overlay.querySelector(".day-cine-touch"))return true;
    var ui=root.document.createElement("div");ui.className="day-cine-touch";ui.setAttribute("aria-label","Cinematic controls");
    var choices=root.document.createElement("div");choices.className="day-cine-choices";
    for(let i=0;i<4;i++)choices.appendChild(button("CHOICE "+(i+1),function(){choose(i);},"day-cine-choice"));
    var actions=root.document.createElement("div");actions.className="day-cine-actions";
    actions.appendChild(button("CONTINUE / SKIP",skip,"day-cine-skip"));
    ui.appendChild(choices);ui.appendChild(actions);overlay.appendChild(ui);
    try{root.document.body&&root.document.body.classList.add("day-cinematic-active");}catch(e){}
    lastOverlay=overlay;
    return true;
  }
  function scan(){
    try{
      if(!root.document)return;
      var o=root.document.getElementById("v725-cine");
      if(o)attach(o);
      else if(lastOverlay){lastOverlay=null;releaseRun();}
    }catch(e){root.__dayCinematicMobileGuardError=String(e&&e.stack||e);}
  }
  function install(){
    installStyle();scan();
    try{
      if(!observer&&root.MutationObserver&&root.document){observer=new MutationObserver(scan);observer.observe(root.document.documentElement,{childList:true,subtree:true});}
      if(!cleanupTimer&&root.setInterval)cleanupTimer=root.setInterval(scan,250);
      return true;
    }catch(e){root.__dayCinematicMobileGuardError=String(e&&e.stack||e);return false;}
  }
  install();
  root.TechOpsDayCinematicMobileGuard={VERSION:VERSION,install:install,scan:scan,skip:skip,choose:choose,releaseRun:releaseRun};
})(typeof globalThis!=="undefined"?globalThis:this);