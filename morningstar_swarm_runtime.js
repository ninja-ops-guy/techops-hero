/* TechOps Hero — MORNINGSTAR + swarm gameplay bridge v5.
 * Presentation/input bridge only. State authority remains in morningstar_build.js,
 * swarm_doctrine.js and the main campaign contracts. Maintenance is owned by
 * campaign_completion_runtime.js; this module creates no private polling timer.
 */
(function(root){
  "use strict";
  if(!root||!root.document||root.TechOpsMORNINGSTARRuntime)return;
  var VERSION=5,nightWrapped=false;
  function phase(){try{return root.TechOpsMORNINGSTARBuild?root.TechOpsMORNINGSTARBuild.getCurrentPhase():0;}catch(e){return 0;}}
  function isFelicia(){try{return typeof root.isFel==="function"?!!root.isFel():!!(root.S&&root.S.meta&&root.S.meta._char==="felicia");}catch(e){return false;}}
  function notify(t){try{if(typeof root.toast==="function")root.toast(t,3200);}catch(_){} }
  function close(){try{if(typeof root.closeDlg==="function")root.closeDlg();}catch(_){} }
  function issue(type,params){
    if(!root.TechOpsSwarmDoctrine||typeof root.TechOpsSwarmDoctrine.issueCommand!=="function")return false;
    var r=root.TechOpsSwarmDoctrine.issueCommand(type,params||{},isFelicia()?"Felicia":"Mike");
    if(r.success)notify("SWARM · "+type+" EXECUTED · LOG "+String(r.logId||"").slice(-6));
    else notify("SWARM · "+type+" REJECTED · "+String(r.reason||"constraint"));
    return r;
  }
  function openSwarm(){
    if(!root.TechOpsSwarmDoctrine||phase()<3||typeof root.dlg!=="function")return false;
    var fel=isFelicia(),opts=[
      {t:"RECON · 300m / 120s",f:function(){issue("RECON",{range:300,duration:120,drones:2,intent:"map threat surface"});}},
      {t:"RELAY · 600m / 240s",f:function(){issue("RELAY",{range:600,duration:240,drones:2,intent:"extend team signal"});}},
      {t:"SHIELD · 150m / 90s",f:function(){issue("SHIELD",{range:150,duration:90,drones:2,intent:"protect current team boundary"});}},
      {t:"DISRUPT · 250m / 30s",f:function(){issue("DISRUPT",{range:250,duration:30,drones:1,intent:"interrupt hostile signal"});}},
      {t:"Inspect Swarm Log",f:function(){root.TechOpsSwarmDoctrine.openLog();}}
    ];
    if(fel)opts.push({t:"INTERCEPT · SELF-AUTHORIZE",f:function(){issue("INTERCEPT",{range:300,duration:45,drones:2,intent:"intercept immediate threat",authorizedBy:"Felicia"});}});
    opts.push({t:"Close",f:close});
    root.dlg("MORNINGSTAR // SWARM COMMAND",fel?"Felicia has tactical swarm authority, but every command remains bounded, attributable and challengeable.<br><br><b>Self-authorizing INTERCEPT is logged and can trigger a doctrine dispute.</b>":"Mike can issue bounded, nonlethal swarm commands and inspect or reverse logged actions. Lethal interception still requires explicit human authorization.",opts);
    return true;
  }
  function ensureHudButtons(){
    var host=root.document.getElementById("hud-right"),build=root.TechOpsMORNINGSTARBuild;if(!host||!build)return false;
    var b=root.document.getElementById("btn-morningstar");
    if(!b){b=root.document.createElement("button");b.id="btn-morningstar";b.className="hud-btn";b.textContent="✦";b.title="MORNINGSTAR build";b.setAttribute("aria-label","Open MORNINGSTAR build");b.addEventListener("click",function(e){e.preventDefault();if(root.TechOpsMORNINGSTARBuild&&typeof root.TechOpsMORNINGSTARBuild.openHub==="function")root.TechOpsMORNINGSTARBuild.openHub();});host.appendChild(b);}
    var snap=build.snapshot&&build.snapshot();b.style.display=phase()>0||(snap&&snap.requirements)?"":"none";
    var swarm=root.document.getElementById("btn-swarm-command");
    if(!swarm){swarm=root.document.createElement("button");swarm.id="btn-swarm-command";swarm.className="hud-btn";swarm.textContent="⌁";swarm.title="Swarm commands";swarm.setAttribute("aria-label","Open swarm commands");swarm.addEventListener("click",function(e){e.preventDefault();openSwarm();});host.appendChild(swarm);}
    swarm.style.display=phase()>=3?"":"none";
    return true;
  }
  function ensureWatchdogButton(){
    var panel=root.document.getElementById("v64-panel");if(!panel||phase()<3||!isFelicia())return false;
    var b=panel.querySelector("#v64-swarm");
    if(!b){b=root.document.createElement("button");b.id="v64-swarm";b.type="button";b.textContent="SWARM";b.style.cssText="width:100%;margin-top:6px;padding:7px;border:1px solid #39d3ff;background:#07131c;color:#39d3ff;font:10px 'Press Start 2P',monospace;cursor:pointer";b.addEventListener("click",function(e){e.preventDefault();openSwarm();});panel.appendChild(b);}
    return true;
  }
  function seedIntegrityIncident(){
    try{
      if(phase()<4||!root.TechOpsSwarmDoctrine||typeof root.TechOpsSwarmDoctrine.snapshot!=="function"||typeof root.TechOpsSwarmDoctrine.recordExternalActivation!=="function")return false;
      var s=root.TechOpsSwarmDoctrine.snapshot(),seen=s&&s.questioningMomentsTriggered||[];
      if(seen.indexOf("swarm_q2")>=0)return false;
      root.TechOpsSwarmDoctrine.recordExternalActivation("orpheus-matched-felicia-authorization-pattern");
      root.__swarmIntegrityIncidentSeeded={phase:phase(),at:Date.now()};return true;
    }catch(e){root.__swarmIntegrityIncidentError=String(e&&e.stack||e);return false;}
  }
  function wrapNightStage(){
    if(typeof root.nmNextStage!=="function")return false;
    if(root.nmNextStage.__morningstarSwarmWrapped){nightWrapped=true;return true;}
    var base=root.nmNextStage;
    var fn=function(){
      var r=base.apply(this,arguments);
      try{if(root.TechOpsSwarmDoctrine&&typeof root.TechOpsSwarmDoctrine.checkQuestioningMoment==="function")root.TechOpsSwarmDoctrine.checkQuestioningMoment();seedIntegrityIncident();}
      catch(e){root.__swarmPostMissionError=String(e&&e.stack||e);}return r;
    };
    fn.__morningstarSwarmWrapped=true;fn.__base=base;root.nmNextStage=fn;nightWrapped=true;return true;
  }
  function acceptance(){var snap=null;try{snap=root.TechOpsSwarmDoctrine&&root.TechOpsSwarmDoctrine.snapshot?root.TechOpsSwarmDoctrine.snapshot():null;}catch(e){}return{version:VERSION,phase:phase(),hud:!!root.document.getElementById("btn-morningstar"),swarmHud:!!root.document.getElementById("btn-swarm-command"),watchdogSwarm:!!root.document.getElementById("v64-swarm"),nightHook:nightWrapped&&!!(root.nmNextStage&&root.nmNextStage.__morningstarSwarmWrapped),doctrine:!!root.TechOpsSwarmDoctrine,build:!!root.TechOpsMORNINGSTARBuild,integrityIncident:!!(snap&&snap.questioningMomentsTriggered&&snap.questioningMomentsTriggered.indexOf("swarm_q2")>=0),sharedMaintenance:true,at:Date.now()};}
  function install(){ensureHudButtons();ensureWatchdogButton();wrapNightStage();root.__morningstarSwarmRuntime=acceptance();return true;}
  root.TechOpsMORNINGSTARRuntime={VERSION:VERSION,install:install,openSwarm:openSwarm,issue:issue,seedIntegrityIncident:seedIntegrityIncident,acceptance:acceptance};
  install();
})(typeof globalThis!=="undefined"?globalThis:this);
