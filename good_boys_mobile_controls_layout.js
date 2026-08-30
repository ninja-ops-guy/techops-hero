/* Good Boys mobile controls layout authority v5.
 * Compact mobile-brawler composition: four primary actions, two shoulder utilities,
 * smaller D-pad, no duplicate legacy Night controls. Approved art is untouched.
 */
(function(root){
  "use strict";
  if(!root||root.TechOpsGoodBoysMobileControlsLayout)return;
  var VERSION=5,style=null,box=null;
  function active(){try{return !!(root.NM&&root.NM._v736);}catch(e){return false;}}
  function mech(){return root.TechOpsGoodBoysReferenceMechanics||null;}
  function call(name){try{var m=mech();return !!(m&&typeof m[name]==="function"&&m[name]());}catch(e){return false;}}
  function btn(id,label,color,fn,utility){var b=root.document.createElement("button");b.id=id;b.textContent=label;b.dataset.utility=utility?"1":"0";b.style.borderColor=color;b.addEventListener("pointerdown",function(e){e.preventDefault();e.stopPropagation();try{fn();}catch(_){}},{passive:false});return b;}
  function installStyle(){
    try{
      if(!root.document)return false;
      style=root.document.getElementById("good-boys-mobile-controls-layout-style");
      if(!style){style=root.document.createElement("style");style.id="good-boys-mobile-controls-layout-style";(root.document.head||root.document.documentElement).appendChild(style);}
      style.textContent=[
        "#good-boys-loop-controls{display:none!important;visibility:hidden!important;opacity:0!important;pointer-events:none!important}",
        "body.good-boys-loop #touch-buttons{display:none!important}",
        "body.good-boys-loop #dpad{position:fixed!important;left:max(12px,calc(env(safe-area-inset-left) + 12px))!important;bottom:max(58px,calc(env(safe-area-inset-bottom) + 58px))!important;transform:scale(.72)!important;transform-origin:left bottom!important;opacity:.88!important;z-index:10055!important}",
        "body.good-boys-loop #good-dogs-touch{position:fixed!important;right:max(12px,calc(env(safe-area-inset-right) + 12px))!important;bottom:max(58px,calc(env(safe-area-inset-bottom) + 58px))!important;width:150px!important;display:grid!important;visibility:visible!important;opacity:.94!important;grid-template-columns:repeat(2,72px)!important;grid-template-rows:34px 58px 58px!important;gap:7px!important;z-index:10060!important;pointer-events:auto!important}",
        "body.good-boys-loop #good-dogs-touch button{box-sizing:border-box!important;width:72px!important;min-width:72px!important;height:58px!important;min-height:58px!important;margin:0!important;padding:4px!important;border-width:2px!important;border-style:solid!important;border-radius:50%!important;background:#05101de8!important;color:#eef8ff!important;font:700 8px/1.05 monospace!important;white-space:normal!important;touch-action:manipulation!important;pointer-events:auto!important;opacity:1!important;box-shadow:0 3px 12px #0009!important}",
        "body.good-boys-loop #good-dogs-touch button[data-utility='1']{height:34px!important;min-height:34px!important;border-radius:10px!important;font-size:7px!important;background:#07131ddd!important}",
        "body.good-boys-loop #gb-attack{grid-column:1;grid-row:2}body.good-boys-loop #gb-boost{grid-column:2;grid-row:2}body.good-boys-loop #gb-airdash{grid-column:1;grid-row:3}body.good-boys-loop #gb-throw{grid-column:2;grid-row:3}body.good-boys-loop #gb-swap{grid-column:1;grid-row:1}body.good-boys-loop #gb-sync{grid-column:2;grid-row:1}",
        "@media(max-width:390px){body.good-boys-loop #good-dogs-touch{right:max(8px,calc(env(safe-area-inset-right) + 8px))!important;bottom:max(52px,calc(env(safe-area-inset-bottom) + 52px))!important;width:136px!important;grid-template-columns:repeat(2,65px)!important;grid-template-rows:32px 54px 54px!important;gap:6px!important}body.good-boys-loop #good-dogs-touch button{width:65px!important;min-width:65px!important;height:54px!important;min-height:54px!important;font-size:7px!important}body.good-boys-loop #good-dogs-touch button[data-utility='1']{height:32px!important;min-height:32px!important}body.good-boys-loop #dpad{left:max(8px,calc(env(safe-area-inset-left) + 8px))!important;bottom:max(52px,calc(env(safe-area-inset-bottom) + 52px))!important;transform:scale(.66)!important}}"
      ].join("");
      return true;
    }catch(e){root.__goodBoysMobileControlsLayoutError=String(e&&e.stack||e);return false;}
  }
  function destroyCompetitors(){
    try{
      if(!root.document)return;
      var modern=root.document.getElementById("good-boys-loop-controls");if(modern&&modern.parentNode)modern.parentNode.removeChild(modern);
      var ids=["gbl-dash","gbl-block","gbl-attack","gbl-swap","gbl-boost","gbl-throw","gbl-sync","gbl-k"];for(var i=0;i<ids.length;i++){var e=root.document.getElementById(ids[i]);if(e&&e.parentNode)e.parentNode.removeChild(e);}
      var touch=root.document.getElementById("touch-buttons");if(touch&&active()){touch.style.setProperty("display","none","important");touch.setAttribute("aria-hidden","true");}
    }catch(e){}
  }
  function rebuild(){
    try{
      if(!root.document)return false;
      box=root.document.getElementById("good-dogs-touch");if(!box){box=root.document.createElement("div");box.id="good-dogs-touch";root.document.body.appendChild(box);}
      if(box.dataset.gbPadVersion!==String(VERSION)){
        box.innerHTML="";
        box.appendChild(btn("gb-swap","⇄ SWAP","#22b8ff",function(){if(root.v736&&root.v736.swap)root.v736.swap();},true));
        box.appendChild(btn("gb-sync","SYNC","#ff9f1c",function(){if(root.v736&&root.v736.finisher)root.v736.finisher();},true));
        box.appendChild(btn("gb-attack","ATTACK","#3cff78",function(){call("pairedAttack");},false));
        box.appendChild(btn("gb-boost","JUMP","#69d6ff",function(){call("boostJump");},false));
        box.appendChild(btn("gb-airdash","DASH","#7ce8ff",function(){call("airDash");},false));
        box.appendChild(btn("gb-throw","PARTNER","#ffad32",function(){call("throwOrCatch");},false));
        box.dataset.gbPadVersion=String(VERSION);
      }
      box.inert=false;box.removeAttribute("inert");box.removeAttribute("aria-hidden");box.style.setProperty("display",active()?"grid":"none","important");
      var bs=box.querySelectorAll("button");for(var i=0;i<bs.length;i++){bs[i].disabled=false;bs[i].inert=false;bs[i].style.setProperty("pointer-events","auto","important");}
      return true;
    }catch(e){root.__goodBoysMobileControlsLayoutError=String(e&&e.stack||e);return false;}
  }
  function apply(){installStyle();destroyCompetitors();rebuild();return true;}
  apply();var timer=null;try{timer=root.setInterval(apply,120);}catch(e){}
  root.TechOpsGoodBoysMobileControlsLayout={VERSION:VERSION,active:active,installStyle:installStyle,destroyCompetitors:destroyCompetitors,rebuild:rebuild,apply:apply,timer:timer};
})(typeof globalThis!=="undefined"?globalThis:this);