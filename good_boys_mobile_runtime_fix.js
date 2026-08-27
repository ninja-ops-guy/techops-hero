/* Good Boys mobile runtime authority — 2026-08-27
 * Late-loaded entrypoint fix for mobile control ownership, opening progression,
 * Waldo-house stage coherence, and non-attacking locomotion presentation.
 */
(function(root){
  "use strict";
  if(!root||root.TechOpsGoodBoysMobileRuntimeFix)return;
  var VERSION=1,style=null,lastMission=0,transitionLock=false;
  function cs(){try{return root.NM&&root.NM._v736?root.NM._v736:null;}catch(e){return null;}}
  function active(){return !!cs();}
  function mission(){var c=cs();return Math.max(1,Math.min(8,Number(c&&c.m||root.S&&root.S.meta&&root.S.meta._v736&&root.S.meta._v736.m||1)));}
  function installStyle(){
    try{
      if(!root.document)return;
      if(!style){style=root.document.getElementById("good-boys-mobile-runtime-fix-style")||root.document.createElement("style");style.id="good-boys-mobile-runtime-fix-style";(root.document.head||root.document.documentElement).appendChild(style);}
      style.textContent=[
        "body.good-boys-runtime-fix #good-boys-loop-controls{display:none!important;visibility:hidden!important;opacity:0!important;pointer-events:none!important}",
        "body.good-boys-runtime-fix #touch-buttons{display:none!important}",
        "body.good-boys-runtime-fix #good-dogs-touch{display:grid!important;visibility:visible!important;opacity:1!important;pointer-events:auto!important;position:fixed!important;right:max(10px,calc(env(safe-area-inset-right) + 10px))!important;bottom:max(102px,calc(env(safe-area-inset-bottom) + 102px))!important;grid-template-columns:repeat(2,64px)!important;gap:7px!important;z-index:10080!important}",
        "body.good-boys-runtime-fix #good-dogs-touch button{display:block!important;visibility:visible!important;opacity:1!important;pointer-events:auto!important;min-width:64px!important;width:64px!important;min-height:48px!important;height:48px!important;border-radius:12px!important;touch-action:manipulation!important}",
        "@media(max-width:390px){body.good-boys-runtime-fix #good-dogs-touch{right:max(7px,calc(env(safe-area-inset-right) + 7px))!important;bottom:max(96px,calc(env(safe-area-inset-bottom) + 96px))!important;grid-template-columns:repeat(2,60px)!important}body.good-boys-runtime-fix #good-dogs-touch button{min-width:60px!important;width:60px!important}}"
      ].join("");
    }catch(e){root.__goodBoysMobileRuntimeFixError=String(e&&e.stack||e);}
  }
  function makeButton(id,label,fn){var b=root.document.createElement("button");b.id=id;b.textContent=label;b.type="button";b.addEventListener("pointerdown",function(e){e.preventDefault();e.stopPropagation();try{fn();}catch(_){}},{passive:false});b.addEventListener("click",function(e){e.preventDefault();e.stopPropagation();},{passive:false});return b;}
  function ensureLegacyPad(){
    try{
      if(!root.document||!root.document.body)return false;
      var pad=root.document.getElementById("good-dogs-touch");
      try{if(!pad&&root.TechOpsGoodDogsProduction&&typeof root.TechOpsGoodDogsProduction.ensureMobileControls==="function"){root.TechOpsGoodDogsProduction.ensureMobileControls();pad=root.document.getElementById("good-dogs-touch");}}catch(_){}
      if(!pad){
        pad=root.document.createElement("div");pad.id="good-dogs-touch";
        pad.appendChild(makeButton("gdf-swap","⇄ SWAP",function(){if(root.v736&&root.v736.swap)root.v736.swap();}));
        pad.appendChild(makeButton("gdf-sync","🐾 SYNC",function(){if(root.v736&&root.v736.finisher)root.v736.finisher();}));
        pad.appendChild(makeButton("gdf-boost","⬆ BOOST",function(){var m=root.TechOpsGoodBoysReferenceMechanics;if(m&&m.boostJump)m.boostJump();else root.dispatchEvent(new KeyboardEvent("keydown",{key:"ArrowUp",bubbles:true}));}));
        pad.appendChild(makeButton("gdf-air","AIR ×2",function(){var m=root.TechOpsGoodBoysReferenceMechanics;if(m&&m.airDash)m.airDash();else root.dispatchEvent(new KeyboardEvent("keydown",{key:"Shift",bubbles:true}));}));
        pad.appendChild(makeButton("gdf-throw","🤝 THROW",function(){var m=root.TechOpsGoodBoysReferenceMechanics;if(m&&m.throwOrCatch)m.throwOrCatch();}));
        pad.appendChild(makeButton("gdf-attack","🐾 ATTACK",function(){try{if(typeof root.interact==="function")root.interact();else root.dispatchEvent(new KeyboardEvent("keydown",{key:"e",bubbles:true}));}catch(_){} }));
        root.document.body.appendChild(pad);
      }
      pad.inert=false;pad.removeAttribute("inert");pad.removeAttribute("aria-hidden");
      var bs=pad.querySelectorAll("button");for(var i=0;i<bs.length;i++){bs[i].disabled=false;bs[i].inert=false;bs[i].removeAttribute("aria-hidden");bs[i].style.setProperty("pointer-events","auto","important");}
      return true;
    }catch(e){root.__goodBoysMobileRuntimeFixError=String(e&&e.stack||e);return false;}
  }
  function suppressModern(){try{var el=root.document&&root.document.getElementById("good-boys-loop-controls");if(el){el.inert=true;el.setAttribute("aria-hidden","true");el.style.setProperty("display","none","important");el.style.setProperty("visibility","hidden","important");el.style.setProperty("pointer-events","none","important");}return true;}catch(e){return false;}}
  function fixWalkFrames(){
    try{
      var A=root.KATRIN_MANCHEZ;if(!A||!A.frames)return false;
      if(!A.__goodBoysCalmWalk){
        var k=A.frames.kat_stand||A.frames.kat_idle0,m=A.frames.man_idle0;
        if(k)for(var i=1;i<7;i++)A.frames["kat_idle"+i]=k;
        if(m)for(var j=1;j<7;j++)A.frames["man_idle"+j]=m;
        A.__goodBoysCalmWalk=true;
      }
      return true;
    }catch(e){return false;}
  }
  function configureOpening(){
    try{
      if(!active()||!root.NM)return false;var n=root.NM,m=mission();
      if(m===1){
        n.platforms=[{x:300,y:360,w:210,h:10},{x:610,y:348,w:210,h:10},{x:930,y:336,w:230,h:10},{x:1260,y:350,w:250,h:10}];
        n._goodBoysHazards=[];
        n._goodBoysLandmarks=[{x:1420,label:"HIDDEN BAY",kind:"shuttle"}];
        n._goodBoysStageMission=1;n._goodBoysStageAuthority="waldo_house_grounded_v2";
      }else if(m===2&&lastMission!==2){
        n.platforms=[{x:260,y:350,w:240,h:10},{x:590,y:330,w:220,h:10},{x:900,y:350,w:250,h:10},{x:1240,y:320,w:260,h:10}];
        n._goodBoysHazards=[];n._goodBoysLandmarks=[{x:1450,label:"SECRET SHIP",kind:"shuttle"}];
        n._goodBoysStageMission=2;n._goodBoysStageAuthority="hidden_hangar_grounded_v2";
      }
      lastMission=m;return true;
    }catch(e){return false;}
  }
  function advanceTo(next){
    if(transitionLock)return;transitionLock=true;
    try{
      var c=cs();if(!c)return;c.m=next;
      try{if(root.S){root.S.meta=root.S.meta||{};root.S.meta._v736=root.S.meta._v736||{};root.S.meta._v736.m=next;}}catch(_){}
      if(root.NM){root.NM.x=180;root.NM.cam=0;root.NM.clear=false;root.NM._goodBoysStageMission=0;root.NM.msg=next===2?"🐾 Trail found — hidden bay unlocked.":"🐾 Route advanced.";root.NM.msgT=(root.performance&&root.performance.now?root.performance.now():Date.now())+1800;}
      try{if(root.TechOpsGoodBoysCanon){root.TechOpsGoodBoysCanon.syncIdentity();root.TechOpsGoodBoysCanon.enforceBackground();}}catch(_){}
      try{if(root.TechOpsGoodBoysGameplayLoop&&root.TechOpsGoodBoysGameplayLoop.configureStage)root.TechOpsGoodBoysGameplayLoop.configureStage();}catch(_){}
      try{if(typeof root.saveGame==="function")root.saveGame();}catch(_){}
    }finally{root.setTimeout(function(){transitionLock=false;},500);}
  }
  function progression(){
    try{
      if(!active()||!root.NM)return false;var m=mission(),n=root.NM;
      if(m===1&&Number(n.x)>=1325){advanceTo(2);return true;}
      return false;
    }catch(e){return false;}
  }
  function tick(){
    try{
      var on=active();if(root.document&&root.document.body)root.document.body.classList.toggle("good-boys-runtime-fix",on);
      if(!on)return;
      installStyle();ensureLegacyPad();suppressModern();fixWalkFrames();configureOpening();progression();
    }catch(e){root.__goodBoysMobileRuntimeFixError=String(e&&e.stack||e);}
  }
  tick();var timer=root.setInterval?root.setInterval(tick,100):null;
  root.TechOpsGoodBoysMobileRuntimeFix={VERSION:VERSION,tick:tick,ensureLegacyPad:ensureLegacyPad,suppressModern:suppressModern,configureOpening:configureOpening,progression:progression,advanceTo:advanceTo,timer:timer};
})(typeof globalThis!=="undefined"?globalThis:this);
