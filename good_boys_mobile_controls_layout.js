/* Good Boys mobile controls layout authority v6.
 * Compact mobile-brawler composition plus a context USE action so objectives
 * that historically required keyboard E remain completable on touch devices.
 */
(function(root){
  "use strict";
  if(!root)return;
  try{var prior=root.TechOpsGoodBoysMobileControlsLayout;if(prior&&prior.timer&&root.clearInterval)root.clearInterval(prior.timer);}catch(_){}
  var VERSION=6,style=null,box=null;
  function active(){try{return !!(root.NM&&root.NM._v736);}catch(e){return false;}}
  function cs(){try{return root.NM&&root.NM._v736?root.NM._v736:null;}catch(e){return null;}}
  function mission(){try{var p=root.TechOpsGoodBoysProgressionAuthority;if(p&&p.mission)return Number(p.mission())||1;return Number(cs()&&cs().m)||1;}catch(e){return 1;}}
  function mech(){return root.TechOpsGoodBoysReferenceMechanics||null;}
  function call(name){try{var m=mech();return !!(m&&typeof m[name]==="function"&&m[name]());}catch(e){return false;}}
  function setMsg(t){try{if(root.NM){root.NM.msg=t;root.NM.msgT=(root.performance&&root.performance.now?root.performance.now():Date.now())+1800;}}catch(_){} }
  function fireKeyboardE(){try{if(root.KeyboardEvent){root.dispatchEvent(new root.KeyboardEvent("keydown",{key:"e",code:"KeyE",bubbles:true,cancelable:true}));root.dispatchEvent(new root.KeyboardEvent("keyup",{key:"e",code:"KeyE",bubbles:true,cancelable:true}));return true;}}catch(e){}return false;}
  function mobileUse(){
    try{
      var c=cs(),n=root.NM;if(!c||!n)return false;
      /* First preserve the native keyboard path for all authored interactions. */
      fireKeyboardE();
      /* Cell 118 recovery: the authored mission stores evidence in cs.evidence,
         but older touch layouts removed the E button entirely. If native E did
         not consume the nearby glint, bind the same proximity contract here. */
      if(mission()===4&&c.evidence&&!c.cellOpened){
        var nearest=null,best=9999;
        for(var i=0;i<c.evidence.length;i++){var ev=c.evidence[i];if(!ev||ev.found)continue;var d=Math.abs((Number(n.x)||0)-(Number(ev.x)||0));if(d<best){best=d;nearest=ev;}}
        if(nearest&&best<90){
          nearest.found=true;
          try{var mt=root.S&&root.S.meta&&root.S.meta._v736;if(mt){mt.evidence=mt.evidence||[];if(mt.evidence.indexOf(nearest.id)<0)mt.evidence.push(nearest.id);}if(typeof root.save==="function")root.save();}catch(_){}
          var found=c.evidence.filter(function(e){return e&&e.found;}).length;
          setMsg("EVIDENCE LOGGED · "+found+"/4"+(found>=3?" · MOVE TO CELL 118":""));
          root.__goodBoysMobileUse={mission:4,type:"evidence",id:nearest.id,found:found,at:Date.now()};
          return true;
        }
        var foundCount=c.evidence.filter(function(e){return e&&e.found;}).length;
        if(foundCount>=3){setMsg("CELL 118 READY · MOVE TO THE PRISONER");root.__goodBoysMobileUse={mission:4,type:"cell-ready",found:foundCount,at:Date.now()};return true;}
        setMsg("MOVE TO A ✦ EVIDENCE GLINT · USE");return true;
      }
      setMsg("INTERACT");return true;
    }catch(e){root.__goodBoysMobileUseError=String(e&&e.stack||e);return false;}
  }
  function btn(id,label,color,fn,utility){var b=root.document.createElement("button");b.id=id;b.textContent=label;b.dataset.utility=utility?"1":"0";b.style.borderColor=color;b.addEventListener("pointerdown",function(e){e.preventDefault();e.stopPropagation();try{fn();}catch(_){}},{passive:false});return b;}
  function installStyle(){try{if(!root.document)return false;style=root.document.getElementById("good-boys-mobile-controls-layout-style");if(!style){style=root.document.createElement("style");style.id="good-boys-mobile-controls-layout-style";(root.document.head||root.document.documentElement).appendChild(style);}style.textContent=[
    "#good-boys-loop-controls{display:none!important;visibility:hidden!important;opacity:0!important;pointer-events:none!important}",
    "body.good-boys-loop #touch-buttons{display:none!important}",
    "body.good-boys-loop #dpad{position:fixed!important;left:max(10px,calc(env(safe-area-inset-left) + 10px))!important;bottom:max(54px,calc(env(safe-area-inset-bottom) + 54px))!important;transform:scale(.68)!important;transform-origin:left bottom!important;opacity:.88!important;z-index:10055!important}",
    "body.good-boys-loop #good-dogs-touch{position:fixed!important;right:max(10px,calc(env(safe-area-inset-right) + 10px))!important;bottom:max(54px,calc(env(safe-area-inset-bottom) + 54px))!important;width:150px!important;display:grid!important;visibility:visible!important;opacity:.95!important;grid-template-columns:repeat(2,72px)!important;grid-template-rows:32px 54px 54px 32px!important;gap:6px!important;z-index:10060!important;pointer-events:auto!important}",
    "body.good-boys-loop #good-dogs-touch button{box-sizing:border-box!important;width:72px!important;min-width:72px!important;height:54px!important;min-height:54px!important;margin:0!important;padding:4px!important;border:2px solid;border-radius:50%!important;background:#05101de8!important;color:#eef8ff!important;font:700 8px/1.05 monospace!important;touch-action:manipulation!important;pointer-events:auto!important;box-shadow:0 3px 12px #0009!important}",
    "body.good-boys-loop #good-dogs-touch button[data-utility='1']{height:32px!important;min-height:32px!important;border-radius:9px!important;font-size:7px!important;background:#07131ddd!important}",
    "body.good-boys-loop #gb-swap{grid-column:1;grid-row:1}body.good-boys-loop #gb-sync{grid-column:2;grid-row:1}body.good-boys-loop #gb-attack{grid-column:1;grid-row:2}body.good-boys-loop #gb-boost{grid-column:2;grid-row:2}body.good-boys-loop #gb-airdash{grid-column:1;grid-row:3}body.good-boys-loop #gb-partner{grid-column:2;grid-row:3}body.good-boys-loop #gb-use{grid-column:1/3;grid-row:4;width:150px!important;border-radius:9px!important;height:32px!important;min-height:32px!important}",
    "body.good-boys-loop #gb-use[data-context='1']{border-color:#ffd166!important;color:#fff4c2!important;box-shadow:0 0 14px rgba(255,209,102,.25)!important}",
    "@media(max-width:390px){body.good-boys-loop #good-dogs-touch{right:max(7px,calc(env(safe-area-inset-right) + 7px))!important;bottom:max(48px,calc(env(safe-area-inset-bottom) + 48px))!important;width:136px!important;grid-template-columns:repeat(2,65px)!important;grid-template-rows:30px 50px 50px 30px!important}body.good-boys-loop #good-dogs-touch button{width:65px!important;min-width:65px!important;height:50px!important;min-height:50px!important;font-size:7px!important}body.good-boys-loop #gb-use{width:136px!important;height:30px!important;min-height:30px!important}body.good-boys-loop #dpad{transform:scale(.63)!important;bottom:max(48px,calc(env(safe-area-inset-bottom) + 48px))!important}}"
  ].join("");return true;}catch(e){root.__goodBoysMobileControlsLayoutError=String(e&&e.stack||e);return false;}}
  function destroyCompetitors(){try{if(!root.document)return;var modern=root.document.getElementById("good-boys-loop-controls");if(modern&&modern.parentNode)modern.parentNode.removeChild(modern);var ids=["gbl-dash","gbl-block","gbl-attack","gbl-swap","gbl-boost","gbl-throw","gbl-sync","gbl-k"];for(var i=0;i<ids.length;i++){var e=root.document.getElementById(ids[i]);if(e&&e.parentNode)e.parentNode.removeChild(e);}var touch=root.document.getElementById("touch-buttons");if(touch&&active()){touch.style.setProperty("display","none","important");touch.setAttribute("aria-hidden","true");}}catch(e){}}
  function rebuild(){try{if(!root.document)return false;box=root.document.getElementById("good-dogs-touch");if(!box){box=root.document.createElement("div");box.id="good-dogs-touch";root.document.body.appendChild(box);}if(box.dataset.gbPadVersion!==String(VERSION)){box.innerHTML="";box.appendChild(btn("gb-swap","⇄ SWAP","#22b8ff",function(){if(root.v736&&root.v736.swap)root.v736.swap();},true));box.appendChild(btn("gb-sync","SYNC","#ff9f1c",function(){if(root.v736&&root.v736.finisher)root.v736.finisher();},true));box.appendChild(btn("gb-attack","ATTACK","#3cff78",function(){call("pairedAttack");},false));box.appendChild(btn("gb-boost","JUMP","#69d6ff",function(){call("boostJump");},false));box.appendChild(btn("gb-airdash","DASH","#7ce8ff",function(){call("airDash");},false));box.appendChild(btn("gb-partner","PARTNER","#ffad32",function(){call("throwOrCatch");},false));box.appendChild(btn("gb-use","USE / INTERACT","#ffd166",mobileUse,true));box.dataset.gbPadVersion=String(VERSION);}var use=box.querySelector("#gb-use");if(use){var contextual=mission()===4;use.dataset.context=contextual?"1":"0";use.textContent=contextual?"USE · CELL 118":"USE / INTERACT";}box.inert=false;box.removeAttribute("inert");box.removeAttribute("aria-hidden");box.style.setProperty("display",active()?"grid":"none","important");var bs=box.querySelectorAll("button");for(var i=0;i<bs.length;i++){bs[i].disabled=false;bs[i].inert=false;bs[i].style.setProperty("pointer-events","auto","important");}return true;}catch(e){root.__goodBoysMobileControlsLayoutError=String(e&&e.stack||e);return false;}}
  function apply(){installStyle();destroyCompetitors();rebuild();return true;}
  apply();var timer=null;try{timer=root.setInterval(apply,120);}catch(e){}
  root.TechOpsGoodBoysMobileControlsLayout={VERSION:VERSION,active:active,mission:mission,mobileUse:mobileUse,installStyle:installStyle,destroyCompetitors:destroyCompetitors,rebuild:rebuild,apply:apply,timer:timer};
})(typeof globalThis!=="undefined"?globalThis:this);