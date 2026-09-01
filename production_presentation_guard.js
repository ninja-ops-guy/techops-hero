/* TechOps Hero — production presentation guard v2.
 * Prevents generic v6.3 day/night cards and Night Crawler toasts from leaking
 * into the Good Boys campaign while preserving the shared gameplay engine.
 */
(function(root){
  "use strict";
  if(!root||root.TechOpsProductionPresentationGuard)return;
  var VERSION=2,baseCard=null,timer=null;
  function world(){try{return (typeof NM!=="undefined"&&NM)?NM:(root.NM||null);}catch(e){return root.NM||null;}}
  function state(){try{return (typeof S!=="undefined"&&S)?S:(root.S||null);}catch(e){return root.S||null;}}
  function goodBoys(){var n=world();return root.__productionDesiredMode==="goodboys"||root.__productionActiveMode==="goodboys"||!!(n&&n._v736)||!!root.__TECHOPS_GOOD_BOYS_CANON_CHAIN;}
  function nightCrawler(){var s=state();return !goodBoys()&&(root.__productionDesiredMode==="nightcrawler"||root.__productionActiveMode==="nightcrawler"||!!(s&&s.meta&&s.meta._char==="nightcrawler"));}
  function install(){
    try{
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
      install();if(!goodBoys()||!root.document)return;
      var c=root.document.getElementById("v63-card");
      if(c){c.style.opacity="0";c.innerHTML="";}
      var t=root.document.getElementById("toast");
      if(t&&/NIGHT CRAWL|NEW HAVEN STREETS|NEW HAVEN AFTER DARK/i.test(t.textContent||"")){t.classList.add("hidden");t.textContent="";}
    }catch(e){}
  }
  clean();try{timer=root.setInterval(clean,100);}catch(e){}
  root.TechOpsProductionPresentationGuard={VERSION:VERSION,goodBoys:goodBoys,nightCrawler:nightCrawler,install:install,clean:clean,timer:timer};
})(typeof globalThis!=="undefined"?globalThis:this);
