/* TechOps Hero — production presentation guard v1.
 * Prevents legacy v6.3 Night Crawl title cards/toasts from leaking into the
 * Good Boys campaign while preserving the shared Night gameplay engine.
 */
(function(root){
  "use strict";
  if(!root||root.TechOpsProductionPresentationGuard)return;
  var VERSION=1,baseCard=null,timer=null;
  function world(){try{return (typeof NM!=="undefined"&&NM)?NM:(root.NM||null);}catch(e){return root.NM||null;}}
  function goodBoys(){var n=world();return root.__productionDesiredMode==="goodboys"||root.__productionActiveMode==="goodboys"||!!(n&&n._v736)||!!root.__TECHOPS_GOOD_BOYS_CANON_CHAIN;}
  function install(){
    try{
      if(typeof root.v63Card!=="function")return false;
      if(root.v63Card.__productionPresentationGuard)return true;
      baseCard=root.v63Card;
      var guarded=function(title,sub,color){
        var t=String(title||"").toUpperCase(),s=String(sub||"").toUpperCase();
        if(goodBoys()&&(t.indexOf("NIGHT CRAWL")>=0||s.indexOf("NEW HAVEN STREETS")>=0))return;
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
      if(c&&/NIGHT CRAWL|NEW HAVEN STREETS/i.test(c.textContent||"")){c.style.opacity="0";c.innerHTML="";}
      var t=root.document.getElementById("toast");
      if(t&&/NIGHT CRAWL|NEW HAVEN STREETS/i.test(t.textContent||"")){t.classList.add("hidden");t.textContent="";}
    }catch(e){}
  }
  clean();try{timer=root.setInterval(clean,100);}catch(e){}
  root.TechOpsProductionPresentationGuard={VERSION:VERSION,goodBoys:goodBoys,install:install,clean:clean,timer:timer};
})(typeof globalThis!=="undefined"?globalThis:this);
