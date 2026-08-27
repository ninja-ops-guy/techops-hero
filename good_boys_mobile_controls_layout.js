/* Good Boys mobile controls layout authority v4.
 * One right-side action pad only. Rebuilds the legacy container with the desired
 * six controls and removes competing Night/gameplay-loop action surfaces.
 */
(function(root){
  "use strict";
  if(!root||root.TechOpsGoodBoysMobileControlsLayout)return;
  var VERSION=4,style=null,box=null;
  function active(){try{return !!(root.NM&&root.NM._v736);}catch(e){return false;}}
  function mech(){return root.TechOpsGoodBoysReferenceMechanics||null;}
  function call(name){try{var m=mech();return !!(m&&typeof m[name]==="function"&&m[name]());}catch(e){return false;}}
  function btn(id,label,color,fn){var b=root.document.createElement("button");b.id=id;b.textContent=label;b.style.borderColor=color;b.addEventListener("pointerdown",function(e){e.preventDefault();e.stopPropagation();try{fn();}catch(_){}},{passive:false});return b;}
  function installStyle(){
    try{if(!root.document)return false;style=root.document.getElementById("good-boys-mobile-controls-layout-style");if(!style){style=root.document.createElement("style");style.id="good-boys-mobile-controls-layout-style";(root.document.head||root.document.documentElement).appendChild(style);}style.textContent=[
      "#good-boys-loop-controls{display:none!important;visibility:hidden!important;opacity:0!important;pointer-events:none!important}",
      "body.good-boys-loop #touch-buttons{display:none!important}",
      "body.good-boys-loop #good-dogs-touch{position:fixed!important;right:max(12px,calc(env(safe-area-inset-right) + 12px))!important;bottom:max(116px,calc(env(safe-area-inset-bottom) + 116px))!important;width:152px!important;display:grid!important;visibility:visible!important;opacity:1!important;grid-template-columns:repeat(2,72px)!important;gap:8px!important;z-index:10060!important;pointer-events:auto!important}",
      "body.good-boys-loop #good-dogs-touch button{box-sizing:border-box!important;width:72px!important;min-width:72px!important;height:52px!important;min-height:52px!important;margin:0!important;padding:4px!important;border-width:2px!important;border-style:solid!important;border-radius:12px!important;background:#05101ddd!important;color:#eef8ff!important;font:700 8px/1.15 monospace!important;white-space:normal!important;touch-action:manipulation!important;pointer-events:auto!important;opacity:1!important}",
      "@media(max-width:390px){body.good-boys-loop #good-dogs-touch{right:max(8px,calc(env(safe-area-inset-right) + 8px))!important;bottom:max(108px,calc(env(safe-area-inset-bottom) + 108px))!important;width:140px!important;grid-template-columns:repeat(2,66px)!important}body.good-boys-loop #good-dogs-touch button{width:66px!important;min-width:66px!important;height:50px!important;min-height:50px!important;font-size:7px!important}}"
    ].join("");return true;}catch(e){root.__goodBoysMobileControlsLayoutError=String(e&&e.stack||e);return false;}
  }
  function destroyCompetitors(){
    try{if(!root.document)return;var modern=root.document.getElementById("good-boys-loop-controls");if(modern&&modern.parentNode)modern.parentNode.removeChild(modern);var ids=["gbl-dash","gbl-block","gbl-attack","gbl-swap","gbl-boost","gbl-throw","gbl-sync","gbl-k"];for(var i=0;i<ids.length;i++){var e=root.document.getElementById(ids[i]);if(e&&e.parentNode)e.parentNode.removeChild(e);}var touch=root.document.getElementById("touch-buttons");if(touch&&active()){touch.style.setProperty("display","none","important");touch.setAttribute("aria-hidden","true");}}
    catch(e){}
  }
  function rebuild(){
    try{if(!root.document)return false;box=root.document.getElementById("good-dogs-touch");if(!box){box=root.document.createElement("div");box.id="good-dogs-touch";root.document.body.appendChild(box);}if(box.dataset.gbPadVersion!==String(VERSION)){box.innerHTML="";box.appendChild(btn("gb-swap","⇄ SWAP","#22b8ff",function(){if(root.v736&&root.v736.swap)root.v736.swap();}));box.appendChild(btn("gb-sync","SYNC","#ff9f1c",function(){if(root.v736&&root.v736.finisher)root.v736.finisher();}));box.appendChild(btn("gb-attack","🐾 ATTACK","#3cff78",function(){call("pairedAttack");}));box.appendChild(btn("gb-boost","⬆ BOOST","#69d6ff",function(){call("boostJump");}));box.appendChild(btn("gb-airdash","⚡ AIR x2","#7ce8ff",function(){call("airDash");}));box.appendChild(btn("gb-throw","↗ THROW","#ffad32",function(){call("throwOrCatch");}));box.dataset.gbPadVersion=String(VERSION);}box.inert=false;box.removeAttribute("inert");box.removeAttribute("aria-hidden");box.style.setProperty("display",active()?"grid":"none","important");var bs=box.querySelectorAll("button");for(var i=0;i<bs.length;i++){bs[i].disabled=false;bs[i].inert=false;bs[i].style.setProperty("pointer-events","auto","important");}return true;}catch(e){root.__goodBoysMobileControlsLayoutError=String(e&&e.stack||e);return false;}
  }
  function apply(){installStyle();destroyCompetitors();rebuild();return true;}
  apply();var timer=null;try{timer=root.setInterval(apply,120);}catch(e){}
  root.TechOpsGoodBoysMobileControlsLayout={VERSION:VERSION,active:active,installStyle:installStyle,destroyCompetitors:destroyCompetitors,rebuild:rebuild,apply:apply,timer:timer};
})(typeof globalThis!=="undefined"?globalThis:this);
