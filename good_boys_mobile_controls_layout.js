/* Good Boys mobile controls layout authority v3.
 * Restores the original Good Dogs/Good Boys mobile action pad because those
 * buttons own the proven direct gameplay handlers. The newer gameplay-loop
 * control surface is suppressed in campaign mode so duplicate DASH/BLOCK
 * controls cannot compete with the working pad.
 */
(function(root){
  "use strict";
  if(!root||root.TechOpsGoodBoysMobileControlsLayout)return;
  var VERSION=3,style=null;
  function active(){try{return !!(root.NM&&root.NM._v736);}catch(e){return false;}}
  function ensureHandlers(){
    try{if(root.TechOpsGoodDogsProduction&&typeof root.TechOpsGoodDogsProduction.ensureMobileControls==="function")root.TechOpsGoodDogsProduction.ensureMobileControls();}catch(_){}
    try{if(root.TechOpsGoodBoysReferenceMechanics&&typeof root.TechOpsGoodBoysReferenceMechanics.tick==="function")root.TechOpsGoodBoysReferenceMechanics.tick();}catch(_){}
  }
  function installStyle(){
    try{
      if(!root.document)return false;
      style=root.document.getElementById("good-boys-mobile-controls-layout-style");
      if(!style){style=root.document.createElement("style");style.id="good-boys-mobile-controls-layout-style";(root.document.head||root.document.documentElement).appendChild(style);}
      style.textContent=[
        "body.good-boys-loop #good-boys-loop-controls{display:none!important;visibility:hidden!important;opacity:0!important;pointer-events:none!important}",
        "body.good-boys-loop #touch-buttons{display:none!important}",
        "body.good-boys-loop #good-dogs-touch{position:fixed!important;right:max(12px,calc(env(safe-area-inset-right) + 12px))!important;bottom:max(116px,calc(env(safe-area-inset-bottom) + 116px))!important;width:152px!important;display:grid!important;visibility:visible!important;opacity:1!important;grid-template-columns:repeat(2,72px)!important;gap:8px!important;z-index:10040!important;pointer-events:auto!important}",
        "body.good-boys-loop #good-dogs-touch button{box-sizing:border-box!important;width:72px!important;min-width:72px!important;height:52px!important;min-height:52px!important;margin:0!important;padding:4px!important;border-radius:12px!important;font:700 8px/1.15 monospace!important;white-space:normal!important;touch-action:manipulation!important;pointer-events:auto!important;opacity:1!important}",
        "@media(max-width:390px){body.good-boys-loop #good-dogs-touch{right:max(8px,calc(env(safe-area-inset-right) + 8px))!important;bottom:max(108px,calc(env(safe-area-inset-bottom) + 108px))!important;width:140px!important;grid-template-columns:repeat(2,66px)!important;gap:8px!important}body.good-boys-loop #good-dogs-touch button{width:66px!important;min-width:66px!important;height:50px!important;min-height:50px!important;font-size:7px!important}}"
      ].join("");
      return true;
    }catch(e){root.__goodBoysMobileControlsLayoutError=String(e&&e.stack||e);return false;}
  }
  function apply(){
    try{
      installStyle();ensureHandlers();
      if(!root.document)return false;
      var on=active(),legacy=root.document.getElementById("good-dogs-touch"),modern=root.document.getElementById("good-boys-loop-controls"),touch=root.document.getElementById("touch-buttons");
      if(modern&&on){modern.style.setProperty("display","none","important");modern.style.setProperty("visibility","hidden","important");modern.style.setProperty("pointer-events","none","important");modern.setAttribute("aria-hidden","true");modern.inert=true;}
      if(legacy){
        if(on){
          legacy.inert=false;legacy.removeAttribute("inert");legacy.removeAttribute("aria-hidden");
          legacy.style.removeProperty("visibility");legacy.style.removeProperty("opacity");legacy.style.removeProperty("pointer-events");legacy.style.setProperty("display","grid","important");
          var buttons=legacy.querySelectorAll("button");for(var i=0;i<buttons.length;i++){buttons[i].disabled=false;buttons[i].inert=false;buttons[i].removeAttribute("aria-hidden");buttons[i].style.setProperty("pointer-events","auto","important");}
        }else{legacy.style.setProperty("display","none","important");}
      }
      if(touch&&on){touch.style.setProperty("display","none","important");touch.setAttribute("aria-hidden","true");}
      return true;
    }catch(e){root.__goodBoysMobileControlsLayoutError=String(e&&e.stack||e);return false;}
  }
  apply();
  var timer=null;try{timer=root.setInterval(apply,180);}catch(e){}
  root.TechOpsGoodBoysMobileControlsLayout={VERSION:VERSION,active:active,ensureHandlers:ensureHandlers,installStyle:installStyle,apply:apply,timer:timer};
})(typeof globalThis!=="undefined"?globalThis:this);
