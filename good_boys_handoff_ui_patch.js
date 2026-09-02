/* TechOps Hero — Good Boys handoff UI isolation v2.
 * Physical-device launch authority for the 118/1984 title button.
 * The side campaign must never enter the normal Day 1 workstation/standup
 * bootstrap just to initialize shared game state. v736.start already owns that
 * initialization. This capture owner runs before the button-level legacy repair
 * listener and gives fresh launches and saved resumes deterministic paths.
 */
(function(root){
  "use strict";
  if(!root||!root.document)return;
  var PRIOR=root.TechOpsGoodBoysHandoffUIPatch;
  if(PRIOR&&Number(PRIOR.VERSION||0)>=2)return;
  try{if(PRIOR&&PRIOR.timer)root.clearInterval(PRIOR.timer);if(PRIOR&&PRIOR.observer)PRIOR.observer.disconnect();}catch(_){}
  var VERSION=2,launching=false,token=0;

  function launchTarget(t){try{return t&&t.closest&&t.closest("#btn-v736");}catch(_){return null;}}
  function titleVisible(){try{var t=root.document.getElementById("title-screen");return !!(t&&!t.classList.contains("hidden"));}catch(_){return false;}}
  function runtime(){try{return root.NM&&root.NM._v736&&!root.NM._v736.ending?root.NM._v736:null;}catch(_){return null;}}
  function savedMission(){
    try{var d=root.localStorage&&root.localStorage.getItem("techops_save"),s=d?JSON.parse(d):null,m=Number(s&&s.meta&&s.meta._v736&&s.meta._v736.m||1);return isFinite(m)&&m>0?Math.max(1,Math.min(8,m)):1;}catch(_){return 1;}
  }
  function goodBoysActive(){
    try{
      var r=root.TechOpsGoodBoysIntroRepair,p=root.__goodBoysOpeningPhase,c=runtime();
      return !!(launching||root.__goodBoysPhysicalLaunchActive||(r&&r.launching)||(p&&p.phase&&p.phase!=="gameplay")||c);
    }catch(_){return false;}
  }
  function clearDayPresentation(){
    if(!goodBoysActive())return false;
    try{if(root.TechOpsCampaignNativeAct1Visuals&&typeof root.TechOpsCampaignNativeAct1Visuals.hide==="function")root.TechOpsCampaignNativeAct1Visuals.hide(true);}catch(_){}
    try{var el=root.document.getElementById("act1-reference");if(el)el.remove();}catch(_){}
    try{var d=root.document.getElementById("dialogue"),name=root.document.getElementById("dlg-name");if(d&&name&&/WORKSTATION|COMPANY|ENGINEERING THE HUMAN CONNECTION|SELECT SHIFT DIFFICULTY|CIO DISPATCH/i.test(name.textContent||""))d.classList.add("hidden");}catch(_){}
    root.__goodBoysDayPresentationSuppressed={at:Date.now(),phase:root.__goodBoysOpeningPhase||null,physical:!!root.__goodBoysPhysicalLaunchActive};
    return true;
  }
  function setPhase(name,extra){root.__goodBoysOpeningPhase=Object.assign({phase:name,at:Date.now(),owner:"physical-title-v2"},extra||{});}
  function markClockIn(){
    var state=null;try{state=root.eval&&root.eval("(typeof S!=='undefined'&&S)?{inDialog:!!S.inDialog,diff:Number(S.diff||0),day:Number(S.day||0)}:null");}catch(_){}
    root.__goodBoysCanonicalClockIn={ok:!!(state&&state.diff===1&&!state.inDialog),difficulty:"standard",usedStart:false,usedStandard:false,usedDispatch:false,source:"good-boys-isolated-bootstrap",state:state,at:Date.now()};
  }
  function waitMounted(m,myToken){
    var tries=0;
    function poll(){
      if(myToken!==token)return;
      clearDayPresentation();
      var c=runtime();
      if(c&&Number(c.m||0)===Number(m)){
        launching=false;root.__goodBoysPhysicalLaunchActive=false;setPhase("gameplay",{mission:Number(m)});markClockIn();
        root.__goodBoysPhysicalLaunch={ok:true,mission:Number(m),resume:Number(m)>2,at:Date.now(),owner:"physical-title-v2"};
        try{if(typeof root.save==="function")root.save();}catch(_){}
        return;
      }
      if(++tries<320){root.setTimeout(poll,25);return;}
      launching=false;root.__goodBoysPhysicalLaunchActive=false;
      root.__goodBoysPhysicalLaunch={ok:false,mission:Number(m),error:root.__err736s||root.__goodBoysProgressionError||root.__goodBoysHandoffError||"runtime did not mount",at:Date.now(),owner:"physical-title-v2"};
    }
    poll();
  }
  function bootMission(m,myToken){
    if(myToken!==token)return false;
    clearDayPresentation();setPhase("campaign-handoff",{mission:Number(m),directGameplay:Number(m)===2});
    try{
      if(!root.v736||typeof root.v736.start!=="function")throw new Error("v736.start unavailable");
      var ok=root.v736.start({mission:Number(m),directGameplay:Number(m)===2});
      markClockIn();
      root.__goodBoysDirectIntro={ok:null,status:"handoff",at:Date.now(),epoch:myToken,mission:Number(m),directGameplay:Number(m)===2,source:"physical-title-v2"};
      waitMounted(Number(m),myToken);
      return ok!==false;
    }catch(e){
      launching=false;root.__goodBoysPhysicalLaunchActive=false;root.__goodBoysPhysicalLaunch={ok:false,mission:Number(m),error:String(e&&e.stack||e),at:Date.now(),owner:"physical-title-v2"};return false;
    }
  }
  function freshOpening(myToken){
    var repair=root.TechOpsGoodBoysIntroRepair;
    if(!repair||typeof repair.playOpening!=="function"||typeof repair.showPremise!=="function")return Promise.resolve(bootMission(2,myToken));
    setPhase("opening",{fresh:true});
    return Promise.resolve().then(function(){return repair.playOpening();}).then(function(){if(myToken!==token)return false;clearDayPresentation();return repair.showPremise();}).then(function(){if(myToken!==token)return false;return bootMission(2,myToken);}).catch(function(e){root.__goodBoysPhysicalLaunchError=String(e&&e.stack||e);return bootMission(2,myToken);});
  }
  function isolatedLaunch(e){
    var b=launchTarget(e&&e.target);if(!b)return false;
    try{e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();}catch(_){}
    if(launching)return true;
    var myToken=++token,m=savedMission();launching=true;root.__goodBoysPhysicalLaunchActive=true;root.__goodBoysLaunchIntentAt=Date.now();
    clearDayPresentation();
    try{b.disabled=true;b.dataset.gbPhysicalLaunch="1";b.textContent=m>1?("RESUMING 118/1984 · M"+m+"…"):"OPENING 118/1984 TRANSMISSION…";}catch(_){}
    root.__goodBoysPhysicalLaunch={ok:null,status:m>1?"resume":"opening",mission:m,at:Date.now(),owner:"physical-title-v2"};
    if(m>1){bootMission(m,myToken);return true;}
    freshOpening(myToken);return true;
  }

  root.document.addEventListener("pointerdown",function(e){if(launchTarget(e.target)){root.__goodBoysLaunchIntentAt=Date.now();root.setTimeout(clearDayPresentation,0);}},true);
  /* Document capture runs before the target's legacy capture listener. This is
     deliberate: the old handler enters canonical Day 1 CLOCK IN and can strand
     real iPhones on the workstation cinematic. */
  root.document.addEventListener("click",isolatedLaunch,true);
  var observer=new MutationObserver(function(){clearDayPresentation();});
  observer.observe(root.document.documentElement,{subtree:true,childList:true});
  var timer=root.setInterval(clearDayPresentation,80);
  root.TechOpsGoodBoysHandoffUIPatch={VERSION:VERSION,isolatedLaunch:isolatedLaunch,bootMission:bootMission,freshOpening:freshOpening,clearDayPresentation:clearDayPresentation,goodBoysActive:goodBoysActive,savedMission:savedMission,observer:observer,timer:timer,get launching(){return launching;}};
})(typeof globalThis!=="undefined"?globalThis:this);
