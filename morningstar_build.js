/* TechOps Hero — MORNINGSTAR progressive build authority v1
 * Main-campaign state only. Never writes Good Boys S.meta._v736 progression.
 * Five authored build phases combine day-ticket work with Night Walker recovery.
 */
(function(root){
  "use strict";
  if(!root || root.TechOpsMORNINGSTARBuild) return;
  var VERSION=1, wrappedResolve=false, wrappedSetup=false, wrappedNight=false, injectedDay=-1;
  var PHASES=[
    {id:"airframe",name:"Airframe Recovery",dayTickets:["hangar_allocation_dispute","decommissioned_aircraft_audit"],nightRecovery:"airframe_recovered",nightGate:{district:"industrial",stage:1},unlocks:["aircraft_silhouette","flight_paths_map","hangar_access"]},
    {id:"signals_lab",name:"Signals Laboratory",dayTickets:["sdr_procurement","telemetry_calibration","antenna_switching_failure"],nightRecovery:"signals_lab_recovered",nightGate:{district:"airport",stage:1},unlocks:["spectrum_map","wide_area_scan","direction_finding"]},
    {id:"swarm",name:"Distributed Swarm",dayTickets:["drone_test_permission","distributed_control_research","swarm_safety_review"],nightRecovery:"swarm_recovered",nightGate:{district:"downtown",stage:1},unlocks:["swarm_commands","relay_placement","reconnaissance_drones","shield_drones"]},
    {id:"morningstar_integrated",name:"MORNINGSTAR Platform",dayTickets:["integration_testing","flight_demo_prep","safety_certification"],nightRecovery:"morningstar_integrated_recovered",nightGate:{district:"longwharf",stage:1},unlocks:["night_walker_command_hub","mission_selection","evidence_board","upgrade_tree"]},
    {id:"watchdog_config",name:"Watchdog Configuration",dayTickets:["trust_audit","verification_protocol","authority_distribution_review"],nightRecovery:"watchdog_config_recovered",nightGate:{district:"suburbs",stage:1},unlocks:["electronic_warfare_suite","team_coordination_protocol","shared_authority_keys"]}
  ];
  var TICKET_COPY={
    hangar_allocation_dispute:["Hangar Allocation Dispute","Engineering"],decommissioned_aircraft_audit:["Decommissioned Aircraft Audit","Engineering"],
    sdr_procurement:["SDR Procurement","Engineering"],telemetry_calibration:["Telemetry Calibration","Engineering"],antenna_switching_failure:["Antenna Switching Failure","Engineering"],
    drone_test_permission:["Drone Test Permission","Security"],distributed_control_research:["Distributed Control Review","Engineering"],swarm_safety_review:["Swarm Safety Review","Security"],
    integration_testing:["MORNINGSTAR Integration Test","Engineering"],flight_demo_prep:["Flight Demo Preparation","Engineering"],safety_certification:["Flight Safety Verification","Security"],
    trust_audit:["Trust Audit","Security"],verification_protocol:["Verification Protocol","Engineering"],authority_distribution_review:["Authority Distribution Review","Security"]
  };
  function campaign(){try{return root.TechOpsCampaign&&root.TechOpsCampaign.load?root.TechOpsCampaign.load(root.localStorage):null;}catch(e){return null;}}
  function save(s){try{if(root.TechOpsCampaign&&root.TechOpsCampaign.save)root.TechOpsCampaign.save(s,root.localStorage);if(root.S){root.S.meta=root.S.meta||{};root.S.meta.campaignMorningstar=s&&s.lateGame&&s.lateGame.morningstar||null;}return true;}catch(e){root.__morningstarSaveError=String(e&&e.stack||e);return false;}}
  function store(s){s.lateGame=s.lateGame||{};return s.lateGame.morningstar||(s.lateGame.morningstar={phase:0,completedDayTickets:[],nightRecoveredItems:[],unlocks:[],history:[]});}
  function current(s){return Math.max(0,Math.min(PHASES.length,Number(store(s).phase)||0));}
  function activePhase(s){var i=current(s);return i<PHASES.length?PHASES[i]:null;}
  function facts(s){s.story=s.story||{completedActs:[],facts:{}};s.story.facts=s.story.facts||{};return s.story.facts;}
  function eligible(s){try{var snap=root.TechOpsCampaignAct2&&root.TechOpsCampaignAct2.snapshot?root.TechOpsCampaignAct2.snapshot(s):{};return !!(snap.morningstarSignatureFound||facts(s).morningstar_signature_found||facts(s).violinist_revealed);}catch(e){return !!facts(s).morningstar_signature_found;}}
  function dayComplete(s,p){var st=store(s);return p.dayTickets.every(function(id){return st.completedDayTickets.indexOf(id)>=0;});}
  function nightComplete(s,p){return store(s).nightRecoveredItems.indexOf(p.nightRecovery)>=0;}
  function canAdvance(s){s=s||campaign();var p=s&&activePhase(s);return !!(s&&p&&eligible(s)&&dayComplete(s,p)&&nightComplete(s,p));}
  function applyStoryFacts(s,phaseIndex){var f=facts(s);if(phaseIndex>=1)f.morningstar_hangar_revealed=true;if(phaseIndex>=4){f.morningstar_reconstructed=true;f.morningstar_airborne=true;f.mike_model_discovered=true;}if(phaseIndex>=5)f.watchdog_configured=true;}
  function advance(){
    var s=campaign();if(!s||!canAdvance(s))return{success:false,reason:"requirements_not_met"};
    var st=store(s),idx=current(s),p=PHASES[idx];st.phase=idx+1;
    p.unlocks.forEach(function(u){if(st.unlocks.indexOf(u)<0)st.unlocks.push(u);});st.history.push({type:"phase_completed",phase:p.id,at:new Date().toISOString()});applyStoryFacts(s,st.phase);save(s);
    root.__morningstarPhaseComplete={phase:st.phase,id:p.id,unlocks:p.unlocks.slice(),at:Date.now()};try{if(typeof root.toast==="function")root.toast("MORNINGSTAR "+st.phase+"/5 · "+p.name+" COMPLETE",4200);}catch(e){}
    return{success:true,phase:st.phase,id:p.id,unlocks:p.unlocks.slice()};
  }
  function maybeAdvance(){var r=advance();return r.success?r:null;}
  function onTicketResolved(id){var s=campaign();if(!s||!id)return false;var p=activePhase(s);if(!p||p.dayTickets.indexOf(id)<0)return false;var st=store(s);if(st.completedDayTickets.indexOf(id)<0){st.completedDayTickets.push(id);st.history.push({type:"day_ticket",id:id,at:new Date().toISOString()});save(s);}maybeAdvance();return true;}
  function onNightRecovery(id){var s=campaign();if(!s||!id)return false;var p=activePhase(s);if(!p||id!==p.nightRecovery)return false;var st=store(s);if(st.nightRecoveredItems.indexOf(id)<0){st.nightRecoveredItems.push(id);st.history.push({type:"night_recovery",id:id,at:new Date().toISOString()});save(s);}maybeAdvance();return true;}
  function ticketType(id){var c=TICKET_COPY[id];if(!c)return null;return{id:id,label:c[0],icon:"✦",enemy:"Dependency Manifestation",eicon:"◆",world:"MORNINGSTAR Build",wbg:"#101928",stat:c[1]==="Security"?"security":"networking",diag:{best:"Verify the dependency, preserve provenance, and document rollback",okay:"Confirm the immediate state with the responsible owner",wrong:["Bypass the approval and force the change","Close the ticket on a green dashboard","Assume the last known-good config is current","Treat the symptom as the system"]}};}
  function openSpot(map){if(!map)return{x:20,y:16};for(var y=5;y<map.length-3;y++)for(var x=5;x<(map[y]||[]).length-3;x++)if(map[y][x]===0)return{x:x,y:y};return{x:20,y:16};}
  function injectPhaseTicket(){
    var s=campaign(),g=root.S;if(!s||!g||!g.map||!eligible(s))return false;var p=activePhase(s);if(!p)return false;var st=store(s),todo=p.dayTickets.filter(function(id){return st.completedDayTickets.indexOf(id)<0;});if(!todo.length)return false;
    var id=todo[0],day=Number(g.day)||0;if(injectedDay===day&&g.npcs&&g.npcs.some(function(n){return n&&n.morningstarTicketId===id&&!n.done;}))return false;if(g.npcs&&g.npcs.some(function(n){return n&&n.morningstarTicketId===id&&!n.done;}))return false;
    var type=ticketType(id),pos=openSpot(g.map),copy=TICKET_COPY[id],npc={id:9400+PHASES.indexOf(p)*20+p.dayTickets.indexOf(id),name:"MORNINGSTAR // "+copy[0],dept:copy[1],type:type,x:pos.x,y:pos.y,face:"SYS",done:false,diagnosed:false,correctDiag:false,pv:0,ambient:false,morningstarTicketId:id};
    g.npcs=g.npcs||[];g.tickets=g.tickets||[];g.npcs.push(npc);g.tickets.push(npc);g.ticketsTotal=(g.ticketsTotal||0)+1;injectedDay=day;try{if(typeof root.toast==="function")root.toast("MORNINGSTAR BUILD TICKET · "+copy[0],3600);}catch(e){}return true;
  }
  function installResolveHook(){if(wrappedResolve||typeof root.resolveTicket!=="function")return false;var base=root.resolveTicket;root.resolveTicket=function(n){var r=base.apply(this,arguments);try{if(n&&n.done)onTicketResolved(n.morningstarTicketId||(n.type&&n.type.id));}catch(e){root.__morningstarResolveHookError=String(e&&e.stack||e);}return r;};root.resolveTicket.__morningstarWrapped=true;root.resolveTicket.__base=base;wrappedResolve=true;return true;}
  function installSetupHook(){if(wrappedSetup||typeof root.setupDay!=="function")return false;var base=root.setupDay;root.setupDay=function(){var r=base.apply(this,arguments);try{(root.setTimeout||setTimeout)(injectPhaseTicket,0);}catch(e){}return r;};root.setupDay.__morningstarWrapped=true;root.setupDay.__base=base;wrappedSetup=true;return true;}
  function installNightHook(){if(wrappedNight||typeof root.nmNextStage!=="function")return false;var base=root.nmNextStage;root.nmNextStage=function(){var before=null;try{before=root.NM?{district:root.NM.district,stage:Number(root.NM.stage)||0}:null;}catch(e){}var r=base.apply(this,arguments);try{var s=campaign(),p=s&&activePhase(s);if(before&&p&&before.district===p.nightGate.district&&before.stage>=p.nightGate.stage)onNightRecovery(p.nightRecovery);}catch(e){root.__morningstarNightHookError=String(e&&e.stack||e);}return r;};root.nmNextStage.__morningstarWrapped=true;root.nmNextStage.__base=base;wrappedNight=true;return true;}
  function requirements(s){s=s||campaign();var p=s&&activePhase(s),st=s&&store(s);if(!p)return null;return{phase:current(s),id:p.id,name:p.name,dayTickets:p.dayTickets.map(function(id){return{id:id,label:TICKET_COPY[id][0],complete:st.completedDayTickets.indexOf(id)>=0};}),night:{id:p.nightRecovery,district:p.nightGate.district,stage:p.nightGate.stage,complete:nightComplete(s,p)},unlocks:p.unlocks.slice(),canAdvance:canAdvance(s)};}
  function openHub(){var s=campaign();if(!s||typeof root.dlg!=="function")return false;var r=requirements(s);if(!r)return root.dlg("MORNINGSTAR // COMPLETE","All five build phases are complete. Authority remains distributed and inspectable.",[{t:"Close",f:root.closeDlg}]);var body="<b>"+r.name+"</b><br><br>DAY WORK<br>"+r.dayTickets.map(function(t){return(t.complete?"✓ ":"□ ")+t.label;}).join("<br>")+"<br><br>NIGHT RECOVERY<br>"+(r.night.complete?"✓ ":"□ ")+r.night.district.toUpperCase()+" // STREET "+(r.night.stage+1)+"<br><br>UNLOCKS<br>"+r.unlocks.join(" · ");var opts=[{t:"Close",f:root.closeDlg}];if(root.TechOpsSwarmDoctrine&&current(s)>=3)opts.unshift({t:"Open Swarm Log",f:function(){root.TechOpsSwarmDoctrine.openLog();}});root.dlg("MORNINGSTAR BUILD // "+(r.phase+1)+"/5",body,opts);return true;}
  function snapshot(){var s=campaign();if(!s)return null;var st=store(s),p=activePhase(s);return{version:VERSION,currentPhase:current(s),currentPhaseName:p?p.name:"Complete",totalPhases:PHASES.length,unlocks:st.unlocks.slice(),completedDayTickets:st.completedDayTickets.slice(),nightRecoveredItems:st.nightRecoveredItems.slice(),canAdvance:canAdvance(s),requirements:requirements(s)};}
  function install(){installResolveHook();installSetupHook();installNightHook();injectPhaseTicket();return true;}
  root.TechOpsMORNINGSTARBuild={VERSION:VERSION,PHASES:PHASES,getCurrentPhase:function(){var s=campaign();return s?current(s):0;},getPhase:function(i){return PHASES[i]||null;},canAdvance:function(){var s=campaign();return !!(s&&canAdvance(s));},advance:advance,onTicketResolved:onTicketResolved,onNightRecovery:onNightRecovery,openHub:openHub,snapshot:snapshot,install:install};
  (root.setInterval||setInterval)(install,500);install();
})(typeof globalThis!=="undefined"?globalThis:this);
