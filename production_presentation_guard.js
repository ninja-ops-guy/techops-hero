/* TechOps Hero — production presentation guard v3.
 * Prevents generic v6.3 day/night cards and Night Crawler toasts from leaking
 * into the Good Boys campaign while preserving the shared gameplay engine.
 */
(function(root){
  "use strict";
  if(!root||root.TechOpsProductionPresentationGuard)return;
  var VERSION=3,baseCard=null,timer=null;
  var HUD_LABELS={"v54-phone":["COMMS","Open team communications"],"btn-twin":["TWIN","Toggle Digital Twin overlay"],"btn-sweep":["SCAN","Run network sweep"],"btn-music":["AUDIO","Toggle music"],"btn-menu":["MENU","Open management console"],"v67-gear":["SET","Open settings"],"v67-gal":["LOG","Open cinematic gallery"]};
  function labelHud(){
    if(!root.document)return;
    Object.keys(HUD_LABELS).forEach(function(id){
      var button=root.document.getElementById(id),label=HUD_LABELS[id];
      if(!button||!button.setAttribute)return;
      if(button.getAttribute("data-control-label")!==label[0])button.setAttribute("data-control-label",label[0]);
      if(!button.getAttribute("aria-label"))button.setAttribute("aria-label",label[1]);
      if(!button.getAttribute("title"))button.setAttribute("title",label[1]);
      if(id==="v54-phone"&&!button.__presentationKeyboard){
        button.__presentationKeyboard=true;button.setAttribute("role","button");button.setAttribute("tabindex","0");
        button.addEventListener("keydown",function(event){if(event.key==="Enter"||event.key===" "){event.preventDefault();event.stopPropagation();button.click();}});
      }
    });
  }
  function world(){try{return (typeof NM!=="undefined"&&NM)?NM:(root.NM||null);}catch(e){return root.NM||null;}}
  function state(){try{return (typeof S!=="undefined"&&S)?S:(root.S||null);}catch(e){return root.S||null;}}
  function goodBoys(){var n=world(),s=state();return root.__productionDesiredMode==="goodboys"||root.__productionActiveMode==="goodboys"||!!(s&&s.meta&&s.meta._standaloneMode==="gooddogs")||!!(n&&n._v736)||!!root.__TECHOPS_GOOD_BOYS_CANON_CHAIN;}
  function nightCrawler(){var s=state();return !goodBoys()&&(root.__productionDesiredMode==="nightcrawler"||root.__productionActiveMode==="nightcrawler"||!!(s&&s.meta&&s.meta._char==="nightcrawler"));}
  function inheritedNightHint(text){return /NIGHT CRAWL|NEW HAVEN STREETS|NEW HAVEN AFTER DARK|Double-tap[^\n]*(?:DASH|GRAB)|ATTACK after dash|JUMP to follow/i.test(String(text||""));}
  function install(){
    try{
      if(typeof root.toast==="function"&&!root.toast.__productionPresentationGuard){
        var baseToast=root.toast;
        var guardedToast=function(text){if(goodBoys()&&inheritedNightHint(text))return;return baseToast.apply(this,arguments);};
        guardedToast.__productionPresentationGuard=true;root.toast=guardedToast;
      }
      if(typeof root.v63Card!=="function")return false;
      if(root.v63Card.__productionPresentationGuard)return true;
      baseCard=root.v63Card;
      var guarded=function(title){
        /* Good Boys owns its own mission/cinematic presentation. */
        if(goodBoys())return;
        /* Night already has a persistent objective and tutorial toast. */
        if(nightCrawler())return;
        return baseCard.apply(this,arguments);
      };
      guarded.__productionPresentationGuard=true;
      root.v63Card=guarded;
      return true;
    }catch(e){return false;}
  }
  function clean(){
    try{
      install();labelHud();if(!goodBoys()||!root.document)return;
      var c=root.document.getElementById("v63-card");
      if(c){c.style.opacity="0";c.innerHTML="";}
      var t=root.document.getElementById("toast");
      if(t&&inheritedNightHint(t.textContent)){t.classList.add("hidden");t.textContent="";}
    }catch(e){}
  }
  clean();try{timer=root.setInterval(clean,100);}catch(e){}
  root.TechOpsProductionPresentationGuard={VERSION:VERSION,goodBoys:goodBoys,nightCrawler:nightCrawler,install:install,clean:clean,labelHud:labelHud,timer:timer};
})(typeof globalThis!=="undefined"?globalThis:this);
