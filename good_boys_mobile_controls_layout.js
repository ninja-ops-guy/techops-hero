/* Good Boys mobile controls layout authority v2.
 * Keeps one ergonomic action cluster on the right side and hard-disables the
 * older Good Dogs/touch action surface so duplicate controls cannot reappear.
 */
(function(root){
  "use strict";
  if(!root||root.TechOpsGoodBoysMobileControlsLayout)return;
  var VERSION=2,style=null,observer=null;
  function active(){try{return !!(root.NM&&root.NM._v736);}catch(e){return false;}}
  function installStyle(){
    try{
      if(!root.document)return false;
      style=root.document.getElementById("good-boys-mobile-controls-layout-style");
      if(style)return true;
      style=root.document.createElement("style");
      style.id="good-boys-mobile-controls-layout-style";
      style.textContent=[
        "#good-dogs-touch{display:none!important;visibility:hidden!important;opacity:0!important;pointer-events:none!important}",
        "body.good-boys-loop #touch-buttons{display:none!important}",
        "body.good-boys-loop #good-boys-loop-controls{position:fixed!important;right:max(12px,calc(env(safe-area-inset-right) + 12px))!important;bottom:max(116px,calc(env(safe-area-inset-bottom) + 116px))!important;width:152px!important;display:grid!important;grid-template-columns:repeat(2,72px)!important;grid-template-areas:'swap sync' 'boost dash' 'throw attack' 'block support'!important;gap:8px!important;z-index:10030!important;pointer-events:auto!important}",
        "body.good-boys-loop #good-boys-loop-controls button{box-sizing:border-box!important;width:72px!important;min-width:72px!important;height:52px!important;min-height:52px!important;margin:0!important;padding:4px!important;border-radius:12px!important;font:700 8px/1.15 monospace!important;white-space:normal!important;touch-action:manipulation!important}",
        "body.good-boys-loop #gbl-swap{grid-area:swap!important}",
        "body.good-boys-loop #gbl-sync{grid-area:sync!important}",
        "body.good-boys-loop #gbl-boost{grid-area:boost!important}",
        "body.good-boys-loop #gbl-dash{grid-area:dash!important}",
        "body.good-boys-loop #gbl-throw{grid-area:throw!important}",
        "body.good-boys-loop #gbl-attack{grid-area:attack!important}",
        "body.good-boys-loop #gbl-block{grid-area:block!important}",
        "body.good-boys-loop #gbl-k{grid-area:support!important}",
        "@media(max-width:390px){body.good-boys-loop #good-boys-loop-controls{right:max(8px,calc(env(safe-area-inset-right) + 8px))!important;bottom:max(108px,calc(env(safe-area-inset-bottom) + 108px))!important;width:140px!important;grid-template-columns:repeat(2,66px)!important;gap:8px!important}body.good-boys-loop #good-boys-loop-controls button{width:66px!important;min-width:66px!important;height:50px!important;min-height:50px!important;font-size:7px!important}}"
      ].join("");
      (root.document.head||root.document.documentElement).appendChild(style);
      return true;
    }catch(e){root.__goodBoysMobileControlsLayoutError=String(e&&e.stack||e);return false;}
  }
  function cleanLegacy(){
    try{
      if(!root.document)return false;
      var legacy=root.document.getElementById("good-dogs-touch");
      if(legacy){
        legacy.style.setProperty("display","none","important");
        legacy.style.setProperty("visibility","hidden","important");
        legacy.style.setProperty("opacity","0","important");
        legacy.style.setProperty("pointer-events","none","important");
        legacy.setAttribute("aria-hidden","true");
        legacy.inert=true;
      }
      var touch=root.document.getElementById("touch-buttons");
      if(touch&&active()){touch.style.setProperty("display","none","important");touch.setAttribute("aria-hidden","true");}
      return true;
    }catch(e){return false;}
  }
  function installObserver(){
    try{
      if(observer||!root.document||typeof root.MutationObserver!=="function")return !!observer;
      observer=new root.MutationObserver(function(records){
        for(var i=0;i<records.length;i++){
          var t=records[i].target;
          if((t&&t.id==="good-dogs-touch")||records[i].type==="childList"){cleanLegacy();break;}
        }
      });
      observer.observe(root.document.documentElement||root.document.body,{subtree:true,childList:true,attributes:true,attributeFilter:["style","class"]});
      return true;
    }catch(e){return false;}
  }
  function apply(){installStyle();cleanLegacy();installObserver();return true;}
  apply();
  var timer=null;try{timer=root.setInterval(apply,250);}catch(e){}
  root.TechOpsGoodBoysMobileControlsLayout={VERSION:VERSION,active:active,installStyle:installStyle,cleanLegacy:cleanLegacy,installObserver:installObserver,apply:apply,timer:timer};
})(typeof globalThis!=="undefined"?globalThis:this);
