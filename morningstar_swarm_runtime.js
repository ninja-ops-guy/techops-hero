/* TechOps Hero — MORNINGSTAR + swarm gameplay bridge v1.
 * Presentation/input bridge only. State authority remains in morningstar_build.js,
 * swarm_doctrine.js and the main campaign contracts.
 */
(function(root){
  "use strict";
  if(!root||!root.document||root.TechOpsMORNINGSTARRuntime)return;
  var VERSION=1,nightWrapped=false,timer=null;
  function phase(){try{return root.TechOpsMORNINGSTARBuild?root.TechOpsMORNINGSTARBuild.getCurrentPhase():0;}catch(e){return 0;}}
  function isFelicia(){try{return typeof root.isFel==="function"?!!root.isFel():!!(root.S&&root.S.meta&&root.S.meta._char==="felicia");}catch(e){return false;}}
  function notify(t){try{if(typeof root.toast==="function")root.toast(t,3200);}catch(_){} }
  function close(){try{if(typeof root.closeDlg==="function")root.closeDlg();}catch(_){} }
  function issue(type,params){
    var d=root.TechOpsSwarmDoctrine;if(!d)return false;
    var r=d.issueCommand(type,params||{},isFelicia()?"Felicia":"Mike");
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
    root.dlg("MORNINGSTAR // SWARM COMMAND",fel?"Felicia has tactical swarm authority, but every command remains bounded, attributable and challengeable.<br><br><b>Self-authorizing INTERCEPT is logged and can trigger a doctrine dispute.</b>":"Issue a bounded nonlethal swarm command. Lethal interception requires explicit Mike or Felicia authorization.",opts);
    return true;
  }
  function ensureHudButton(){
    var host=root.document.getElementById("hud-right"),build=root.TechOpsMORNINGSTARBuild;if(!host||!build)return false;
    var b=root.document.getElementById("btn-morningstar");
    if(!b){b=root.document.createElement("button");b.id="btn-morningstar";b.className="hud-btn";b.textContent="✦";b.title="MORNINGSTAR build";b.setAttribute("aria-label","Open MORNINGSTAR build");b.addEventListener("click",function(e){e.preventDefault();build.openHub();});host.appendChild(b);}
    b.style.display=phase()>0||build.snapshot&&build.snapshot()&&build.snapshot().requirements?"":"none";
    return true;
  }
  function ensureWatchdogButton(){
    var panel=root.document.getElementById("v64-panel");if(!panel||phase()<3||!isFelicia())return false;
    var b=panel.querySelector("#v64-swarm");
    if(!b){b=root.document.createElement("button");b.id="v64-swarm";b.type="button";b.textContent="SWARM";b.style.cssText="width:100%;margin-top:6px;padding:7px;border:1px solid #39d3ff;background:#07131c;color:#39d3ff;font:10px 'Press Start 2P',monospace;cursor:pointer";b.addEventListener("click",function(e){e.preventDefault();openSwarm();});panel.appendChild(b);}
    return true;
  }
  function wrapNightStage(){
    if(nightWrapped||typeof root.nmNextStage!=="function")return false;
    var base=root.nmNextStage;
    var fn=function(){var r=base.apply(this,arguments);try{if(root.TechOpsSwarmDoctrine)root.TechOpsSwarmDoctrine.checkQuestioningMoment();}catch(e){root.__swarmPostMissionError=String(e&&e.stack||e);}return r;};
    fn.__morningstarSwarmWrapped=true;fn.__base=base;root.nmNextStage=fn;nightWrapped=true;return true;
  }
  function acceptance(){return{version:VERSION,phase:phase(),hud:!!root.document.getElementById("btn-morningstar"),watchdogSwarm:!!root.document.getElementById("v64-swarm"),nightHook:nightWrapped,doctrine:!!root.TechOpsSwarmDoctrine,build:!!root.TechOpsMORNINGSTARBuild,at:Date.now()};}
  function install(){ensureHudButton();ensureWatchdogButton();wrapNightStage();root.__morningstarSwarmRuntime=acceptance();return true;}
  root.TechOpsMORNINGSTARRuntime={VERSION:VERSION,install:install,openSwarm:openSwarm,issue:issue,acceptance:acceptance};
  timer=(root.setInterval||setInterval)(install,750);install();root.TechOpsMORNINGSTARRuntime.timer=timer;
})(typeof globalThis!=="undefined"?globalThis:this);
