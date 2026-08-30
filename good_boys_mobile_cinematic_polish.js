/* TechOps Hero — Good Boys mobile cinematic polish v1.
 * Presentation-only overrides for every Good Boys cinematic surface.
 * Uses existing approved art; never replaces source imagery.
 */
(function(root){
  "use strict";
  if(!root||root.TechOpsGoodBoysMobileCinematicPolish)return;
  var VERSION=1,style=null,timer=null;
  function installStyle(){
    if(!root.document)return false;
    style=root.document.getElementById("good-boys-mobile-cinematic-polish-style");
    if(!style){style=root.document.createElement("style");style.id="good-boys-mobile-cinematic-polish-style";(root.document.head||root.document.documentElement).appendChild(style);}
    style.textContent=[
      /* Prison cards: approved plate stays fully visible in portrait. */
      "#gb-prison-cine{box-sizing:border-box!important;background-size:contain!important;background-position:center max(6vh,env(safe-area-inset-top))!important;background-repeat:no-repeat!important;background-color:#02050a!important;padding:max(14px,env(safe-area-inset-top)) max(12px,env(safe-area-inset-right)) max(16px,env(safe-area-inset-bottom)) max(12px,env(safe-area-inset-left))!important;overflow:hidden!important}",
      "#gb-prison-cine:before,#gb-prison-cine:after{display:none!important}",
      "#gb-prison-cine .card{box-sizing:border-box!important;width:min(720px,calc(100vw - 24px))!important;max-height:42vh!important;overflow:auto!important;overscroll-behavior:contain!important;margin-bottom:max(1.5vh,env(safe-area-inset-bottom))!important;padding:13px 14px!important;border-radius:12px!important;box-shadow:0 14px 40px #000c!important}",
      "#gb-prison-cine h2{font-size:clamp(18px,4.8vw,22px)!important}#gb-prison-cine p{font-size:clamp(11px,3vw,13px)!important;line-height:1.4!important;margin-bottom:9px!important}#gb-prison-cine .goal{font-size:clamp(9px,2.6vw,10px)!important;margin-bottom:9px!important;padding:7px 9px!important}#gb-prison-cine button{height:auto!important;min-height:44px!important}",
      /* Earthfall: no crop, no fake letterbox; card does not bury the art. */
      "#good-boys-earthfall-cine{background-size:contain!important;background-position:center max(5vh,env(safe-area-inset-top))!important;background-repeat:no-repeat!important;background-color:#02050b!important}",
      "#good-boys-earthfall-cine:before,#good-boys-earthfall-cine:after{display:none!important}",
      "#good-boys-earthfall-cine .gbe-shade{background:linear-gradient(to bottom,rgba(1,4,8,.03) 0%,rgba(1,4,8,.06) 42%,rgba(1,4,8,.58) 68%,rgba(1,4,8,.97) 100%)!important}",
      "#good-boys-earthfall-cine .gbe-card{bottom:max(14px,env(safe-area-inset-bottom))!important;width:min(720px,calc(100vw - 24px))!important;max-height:41vh!important;overflow:auto!important;overscroll-behavior:contain!important;padding:13px 14px!important;border-width:1.5px!important}",
      "#good-boys-earthfall-cine h2{font-size:clamp(18px,4.8vw,22px)!important}#good-boys-earthfall-cine p{font-size:clamp(11px,3vw,13px)!important;line-height:1.4!important}#good-boys-earthfall-cine button{min-height:44px!important}",
      /* Shared v7.25 canvas stays contained and centered through Safari chrome/orientation changes. */
      "#v725-cine{box-sizing:border-box!important;padding:max(0px,env(safe-area-inset-top)) max(0px,env(safe-area-inset-right)) max(0px,env(safe-area-inset-bottom)) max(0px,env(safe-area-inset-left))!important;overflow:hidden!important}",
      "#v725-cine canvas{display:block!important;max-width:100vw!important;max-height:100dvh!important;object-fit:contain!important;image-rendering:pixelated!important}",
      "@media(max-aspect-ratio:3/4){#gb-prison-cine,#good-boys-earthfall-cine{background-size:100% auto!important;background-position:center max(7vh,env(safe-area-inset-top))!important}#gb-prison-cine .card,#good-boys-earthfall-cine .gbe-card{max-height:40vh!important}}",
      "@media(max-width:390px){#gb-prison-cine .card,#good-boys-earthfall-cine .gbe-card{width:calc(100vw - 18px)!important;max-height:43vh!important;padding:11px 12px!important}#gb-prison-cine p,#good-boys-earthfall-cine p{font-size:11px!important;line-height:1.34!important}}",
      "@media(max-height:700px){#gb-prison-cine .card,#good-boys-earthfall-cine .gbe-card{max-height:46vh!important}#gb-prison-cine p,#good-boys-earthfall-cine p{line-height:1.3!important}}"
    ].join("");
    return true;
  }
  function fitV725(){
    try{
      var c=root.document&&root.document.querySelector("#v725-cine canvas");if(!c)return false;
      var vw=Math.max(1,root.innerWidth||root.document.documentElement.clientWidth||1),vh=Math.max(1,root.innerHeight||root.document.documentElement.clientHeight||1);
      var s=Math.min(vw/1280,vh/720);c.style.width=Math.floor(1280*s)+"px";c.style.height=Math.floor(720*s)+"px";c.style.maxWidth="100vw";c.style.maxHeight="100dvh";return true;
    }catch(e){root.__goodBoysMobileCineFitError=String(e&&e.stack||e);return false;}
  }
  function apply(){installStyle();fitV725();}
  installStyle();apply();
  try{root.addEventListener&&root.addEventListener("resize",fitV725,{passive:true});root.addEventListener&&root.addEventListener("orientationchange",function(){root.setTimeout&&root.setTimeout(fitV725,80);},{passive:true});}catch(e){}
  try{timer=root.setInterval?root.setInterval(apply,250):null;}catch(e){}
  root.TechOpsGoodBoysMobileCinematicPolish={VERSION:VERSION,installStyle:installStyle,fitV725:fitV725,apply:apply,timer:timer};
})(typeof globalThis!=="undefined"?globalThis:this);