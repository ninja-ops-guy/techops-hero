/* TechOps Hero — shared cinematic controls v2.
 * Renders semantic HTML captions and controls for the existing v7.25 owner.
 * This is intentionally independent of scene art so a canvas/input regression
 * cannot strand a run with the ticket clock paused. Timeline and choices stay
 * in v725; the existing scanner is only a late-load/teardown fallback.
 */
(function(root){
  "use strict";
  if(!root||root.TechOpsDayCinematicMobileGuard)return;
  var VERSION=2,observer=null,style=null,lastOverlay=null,cleanupTimer=null;

  function isGoodBoys(){
    try{return root.__productionDesiredMode==="goodboys"||root.__productionActiveMode==="goodboys"||!!(root.NM&&root.NM._v736);}catch(e){return false;}
  }
  function installStyle(){
    if(!root.document)return;
    style=root.document.getElementById("day-cinematic-mobile-guard-style");
    if(!style){style=root.document.createElement("style");style.id="day-cinematic-mobile-guard-style";(root.document.head||root.document.documentElement).appendChild(style);}
    style.textContent=[
      "#v725-cine .day-cine-touch{position:absolute;left:max(12px,env(safe-area-inset-left));right:max(12px,env(safe-area-inset-right));bottom:max(14px,calc(env(safe-area-inset-bottom) + 8px));z-index:10003;display:flex;flex-direction:column;gap:8px;max-height:75dvh;overflow:auto;pointer-events:none;font-family:monospace}",
      "#v725-cine .day-cine-actions{display:flex;justify-content:flex-end;gap:8px;pointer-events:auto}",
      "#v725-cine .day-cine-choices{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px;pointer-events:auto}",
      "#v725-cine .day-cine-touch button{box-sizing:border-box;min-height:44px;border:1.5px solid #58d7ff;border-radius:10px;background:rgba(3,12,24,.94);color:#eef9ff;font:700 13px/1.3 monospace;letter-spacing:.03em;padding:9px 12px;touch-action:manipulation;box-shadow:0 4px 16px rgba(0,0,0,.45)}",
      "#v725-cine .day-cine-actions button{min-width:118px;background:rgba(4,18,32,.97)}",
      "#v725-cine .day-cine-choices button{border-color:#ffbd55;color:#fff7df;background:rgba(24,14,5,.94)}",
      "#v725-cine .day-cine-caption,#v725-cine .day-cine-prompt{margin:0;padding:8px 12px;background:rgba(3,12,24,.94);color:#eef9ff;font:14px/1.5 monospace;pointer-events:auto}",
      "#v725-cine .day-cine-prompt{color:#fff0c4;font-weight:700}",
      "#v725-cine .day-cine-touch [hidden]{display:none!important}",
      "#v725-cine .day-cine-touch button:focus-visible{outline:3px solid #ffe39a;outline-offset:2px}",
      "#v725-cine .day-cine-touch button:disabled{opacity:.6}",
      "@media(min-width:700px){#v725-cine .day-cine-touch{left:50%;right:auto;width:min(720px,90vw);transform:translateX(-50%)}}",
      "@media(max-width:420px){#v725-cine .day-cine-choices{grid-template-columns:1fr}}"
    ].join("");
  }
  function releaseRun(){
    try{
      var d=root.document;if(!d)return;
      if(root.v725&&root.v725.active&&root.v725.active())return;
      var realDialogue=d.getElementById("dialogue"),battle=d.getElementById("battle");
      var dialogueVisible=realDialogue&&!realDialogue.classList.contains("hidden")&&root.getComputedStyle(realDialogue).display!=="none";
      var battleVisible=battle&&!battle.classList.contains("hidden")&&root.getComputedStyle(battle).display!=="none";
      if(root.S&&!dialogueVisible&&!battleVisible&&!isGoodBoys())root.S.inDialog=false;
      d.body&&d.body.classList.remove("day-cinematic-active");
      root.dispatchEvent&&root.dispatchEvent(new Event("resize"));
    }catch(e){root.__dayCinematicReleaseError=String(e&&e.stack||e);}
  }
  function skip(){
    try{if(root.v725&&typeof root.v725.skip==="function"&&root.v725.skip()===false)return;}catch(e){root.__dayCinematicSkipError=String(e&&e.stack||e);}
    root.setTimeout&&root.setTimeout(releaseRun,80);
  }
  function choose(i){
    try{if(root.v725&&typeof root.v725.choose==="function")root.v725.choose(i);}catch(e){root.__dayCinematicChoiceError=String(e&&e.stack||e);}
  }
  function togglePause(){
    var api=root.v725;if(!api||!api.presentation)return;
    if(api.presentation().paused)api.resume();else api.pause();
  }
  function button(label,fn,cls,overlay){
    var b=root.document.createElement("button");b.type="button";b.textContent=label;if(cls)b.className=cls;
    // Native click is shared by pointer, keyboard and assistive activation.
    b.addEventListener("pointerdown",function(e){e.stopPropagation();});
    b.addEventListener("click",function(e){e.preventDefault();e.stopPropagation();if(!root.document.hidden&&!b.disabled&&overlay&&overlay.isConnected&&root.document.getElementById("v725-cine")===overlay)fn();});
    return b;
  }
  function attach(overlay){
    if(!overlay)return null;
    var existing=overlay.querySelector(".day-cine-touch");if(existing)return existing;
    installStyle();
    var ui=root.document.createElement("div");ui.className="day-cine-touch";ui.setAttribute("role","group");ui.setAttribute("aria-label","Cinematic controls");
    var caption=root.document.createElement("p");caption.className="day-cine-caption";caption.setAttribute("role","status");caption.setAttribute("aria-live","polite");caption.setAttribute("aria-atomic","true");
    var prompt=root.document.createElement("p");prompt.className="day-cine-prompt";prompt.id="day-cine-prompt";
    var choices=root.document.createElement("div");choices.className="day-cine-choices";choices.setAttribute("role","group");choices.setAttribute("aria-labelledby",prompt.id);
    var actions=root.document.createElement("div");actions.className="day-cine-actions";
    actions.appendChild(button("PAUSE",togglePause,"day-cine-pause",overlay));
    actions.appendChild(button("SKIP SCENE",skip,"day-cine-skip",overlay));
    ui.appendChild(caption);ui.appendChild(prompt);ui.appendChild(choices);ui.appendChild(actions);overlay.appendChild(ui);
    try{root.document.body&&root.document.body.classList.add("day-cinematic-active");}catch(e){}
    lastOverlay=overlay;
    return ui;
  }
  function sync(overlay,view){
    if(!overlay)return false;
    view=view||(root.v725&&root.v725.presentation&&root.v725.presentation());
    if(!view||!view.active)return false;
    var ui=attach(overlay),key=JSON.stringify(view);if(!ui||overlay.__dayCinePresentationKey===key)return true;
    overlay.__dayCinePresentationKey=key;
    var active=root.document.activeElement,ownedFocus=active===overlay||!active||active===root.document.body||ui.contains(active);
    var caption=ui.querySelector(".day-cine-caption"),prompt=ui.querySelector(".day-cine-prompt"),choices=ui.querySelector(".day-cine-choices"),pause=ui.querySelector(".day-cine-pause"),skipButton=ui.querySelector(".day-cine-skip");
    caption.textContent=(view.paused?"Paused. Resume when ready. ":"")+view.caption;caption.hidden=!caption.textContent;
    prompt.textContent=view.prompt;prompt.hidden=!view.prompt;
    // Rebuild only when the actual authored options change, never every frame.
    var choiceKey=JSON.stringify([view.shot,view.choices||[]]);
    if(choices.__choiceKey!==choiceKey){
      choices.__choiceKey=choiceKey;choices.textContent="";
      (view.choices||[]).forEach(function(label,i){choices.appendChild(button(String(label),function(){
        var current=root.v725&&root.v725.presentation&&root.v725.presentation();
        if(current&&current.shot===view.shot)choose(i);
      },"day-cine-choice",overlay));});
    }
    choices.hidden=!(view.choices&&view.choices.length);
    Array.from(choices.querySelectorAll("button")).forEach(function(b){b.disabled=!!view.paused;});
    pause.textContent=view.paused?"RESUME":"PAUSE";pause.setAttribute("aria-label",view.paused?"Resume cinematic":"Pause cinematic");
    skipButton.hidden=!choices.hidden;
    if(ownedFocus&&(!active||active===overlay||active===root.document.body||!active.isConnected||active.hidden||active.disabled))pause.focus({preventScroll:true});
    return true;
  }
  function scan(){
    try{
      if(!root.document)return;
      var o=root.document.getElementById("v725-cine");
      if(o)sync(o);
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
  root.TechOpsDayCinematicMobileGuard={VERSION:VERSION,install:install,scan:scan,sync:sync,skip:skip,choose:choose,releaseRun:releaseRun};
})(typeof globalThis!=="undefined"?globalThis:this);
