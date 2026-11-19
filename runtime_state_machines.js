/* TechOps Hero — explicit state-machine registry and read-only runtime inspector.
 *
 * One dependency-free transition contract for the existing script runtime. This
 * module owns no game state, timer, frame loop, DOM listener or save write.
 * Existing authorities keep their state; selectors project it for developers,
 * tests and agents. Compatibility adapters may record an unexpected transition
 * while preserving the legacy target, so instrumentation cannot break a run.
 */
(function(root){
  "use strict";
  if(!root||root.TechOpsStateMachines)return;
  var VERSION=1,HISTORY_LIMIT=160,history=[],sequence=0;

  function clone(value){
    if(value==null||typeof value!=="object")return value;
    if(Array.isArray(value))return value.map(clone);
    var out={};Object.keys(value).forEach(function(key){out[key]=clone(value[key]);});return out;
  }
  function graph(initial,states,transitions,global){
    var out={};states.forEach(function(state){out[state]=Object.assign({},global||{},transitions&&transitions[state]||{});});
    return{initial:initial,states:states,transitions:out};
  }
  function define(id,file,kind,machine){
    machine.id=id;machine.file=file;machine.kind=kind;DEFINITIONS[id]=machine;
  }
  var DEFINITIONS=Object.create(null);

  define("title-readiness","production_title_experience.js","coordinator",graph("loading",["loading","ready","launching","failed"],{
    loading:{retry:"loading","runtime.ready":"ready","runtime.loading":"loading","launch.requested":"launching"},
    ready:{retry:"loading","runtime.loading":"loading","launch.requested":"launching","launch.cancelled":"ready"},
    launching:{"launch.cancelled":"ready","runtime.ready":"ready"},
    failed:{retry:"loading","launch.requested":"launching"}
  },{"launch.failed":"failed"}));

  define("night-launch","production_mode_router.js","coordinator",graph("idle",["idle","intent","launch","start-run","dispatch","enter-requested","cinematic","mounting","ready","failed"],{
    "start-run":{"dispatch.awaiting-confirmation":"dispatch","enterNight.request":"enter-requested","v722.observe":"cinematic","runtime.attached":"mounting","checkpoint.restored":"mounting"},
    dispatch:{"dispatch.confirmed":"start-run"},
    launch:{"startRun.request":"start-run","enterNight.request":"enter-requested","v722.observe":"cinematic","runtime.attached":"mounting","checkpoint.restored":"mounting"},
    "enter-requested":{"v722.begin":"cinematic","runtime.attached":"mounting"},
    cinematic:{"v722.end":"mounting","runtime.attached":"mounting"},
    mounting:{"runtime.attached":"mounting"}
  },{"intent.capture":"intent","launch.begin":"launch","launch.failed":"failed","router.ready":"ready"}));

  define("run-lifecycle","game.js","derived",graph("title",["title","difficulty","day","night","end-of-day","game-over","victory"],{
    title:{START:"difficulty",CONTINUE:"day"},difficulty:{DIFFICULTY_SELECTED:"day",ALTERNATE_SELECTED:"night"},
    day:{NIGHT_ENTERED:"night",DAY_COMPLETED:"end-of-day",RUN_LOST:"game-over",RUN_WON:"victory"},
    night:{NIGHT_RETURNED:"day",RUN_LOST:"game-over"}, "end-of-day":{NEXT_DAY:"day",RUN_LOST:"game-over",RUN_WON:"victory"},
    "game-over":{RESTART:"title"},victory:{RESTART:"title"}
  }));
  define("modal-interaction","game.js + cinematic_systems.js","derived",graph("exploration",["exploration","dialogue","panel","battle","end-of-day","cinematic","paused"],{
    exploration:{DIALOG_OPENED:"dialogue",PANEL_OPENED:"panel",BATTLE_STARTED:"battle",CINEMATIC_STARTED:"cinematic",PAUSED:"paused"},
    dialogue:{CLOSED:"exploration",BATTLE_STARTED:"battle",CINEMATIC_STARTED:"cinematic"},panel:{CLOSED:"exploration",DIALOG_OPENED:"dialogue"},
    battle:{CLOSED:"exploration",DAY_COMPLETED:"end-of-day"}, "end-of-day":{NEXT_DAY:"exploration"},cinematic:{COMPLETED:"exploration",SKIPPED:"exploration"},paused:{RESUMED:"exploration"}
  }));
  define("bootstrap","production_bootstrap.js + bg_noc.js","derived",graph("idle",["idle","waiting","loading","ready","failed"],{
    idle:{BOOT:"waiting"},waiting:{PARSER_READY:"loading",TIMEOUT:"failed"},loading:{READY:"ready",LOAD_ERROR:"failed"},failed:{RETRY:"loading"}
  }));
  define("mode-shell","runtime_mode_shell.js","explicit",graph("day",["day","night"],{day:{ENTER_NIGHT:"night"},night:{EXIT_NIGHT:"day"}}));
  define("presentation","cinematic_systems.js","explicit",graph("idle",["idle","claimed","blocked"],{
    idle:{CLAIMED:"claimed",BLOCKING_SURFACE_VISIBLE:"blocked"},claimed:{RELEASED:"idle",BLOCKING_SURFACE_VISIBLE:"blocked"},blocked:{CLAIMED:"claimed",RELEASED:"idle"}
  }));
  define("day-notice","game.js","contextual",graph("scheduled",["scheduled","waiting","fired","expired"],{
    scheduled:{DELAY_ELAPSED:"waiting",INVALIDATED:"expired",FIRED:"fired"},waiting:{UNBLOCKED:"fired",INVALIDATED:"expired"}
  }));
  define("ticket-lifecycle","game.js","contextual",graph("queued",["queued","interviewed","diagnosed","portal-ready","in-battle","stabilized","verified","closed","escalated"],{
    queued:{INTERVIEW:"interviewed",ESCALATE:"escalated"},interviewed:{DIAGNOSE:"diagnosed"},diagnosed:{PORTAL_OPENED:"portal-ready"},
    "portal-ready":{BATTLE_STARTED:"in-battle",DEVICE_FIXED:"closed"}, "in-battle":{HP_ZERO:"stabilized",FAILED:"escalated"},
    stabilized:{VERIFIED:"verified"},verified:{DOCUMENTED:"closed"},closed:{CHAIN_ESCALATED:"escalated"},escalated:{INTERVIEW:"interviewed",BATTLE_STARTED:"in-battle"}
  }));
  define("battle-workflow","game.js","contextual",graph("observe",["observe","hypothesis-choice","execute","stabilized","verified","documented","lost"],{
    observe:{HYPOTHESIZE:"hypothesis-choice",EXECUTE:"execute",HP_ZERO:"stabilized",PLAYER_DOWN:"lost"},
    "hypothesis-choice":{CONFIRMED:"execute",REJECTED:"observe",PLAYER_DOWN:"lost"},execute:{OBSERVE:"observe",HP_ZERO:"stabilized",PLAYER_DOWN:"lost"},
    stabilized:{VERIFY:"verified"},verified:{DOCUMENT:"documented"}
  }));
  define("day-case","runtime_day_cases.js","explicit",graph("inspect",["inspect","authorize","remediate","technical","requester","complete"],{
    inspect:{HYPOTHESIZE:"authorize"},authorize:{AUTHORIZE:"remediate"},remediate:{REMEDIATE:"technical"},technical:{VERIFY_TECHNICAL:"requester"},requester:{VERIFY_REQUESTER:"complete"}
  }));
  define("campaign-opening","campaign_act1.js","explicit",graph("morning",["morning","workstation","day_shift","night_walker","complete"],{
    morning:{STANDUP_COMPLETE:"workstation"},workstation:{WORK_UNLOCKED:"day_shift"},day_shift:{NIGHT_STARTED:"night_walker",CAMPAIGN_COMPLETE:"complete"},night_walker:{DAY_RETURNED:"day_shift",CAMPAIGN_COMPLETE:"complete"}
  }));
  define("campaign-investigation","campaign_act1_investigations.js","explicit",graph("gather",["gather","remediate","technical_check","human_verify","workaround_verify","complete"],{
    gather:{HYPOTHESIZE:"remediate"},remediate:{FIX_APPLIED:"technical_check"},technical_check:{TECHNICAL_VERIFIED:"human_verify",WORKAROUND:"workaround_verify"},human_verify:{REQUESTER_VERIFIED:"complete"},workaround_verify:{REQUESTER_VERIFIED:"complete"}
  }));
  define("act4-trust","campaign_act2.js","explicit",graph("observe",["observe","investigate","hypothesize","respond","report","technical_verify","requester_verify","complete"],{
    observe:{OBSERVED:"investigate"},investigate:{EVIDENCE_COMPLETE:"hypothesize"},hypothesize:{HYPOTHESIS_CONFIRMED:"respond"},respond:{RESPONDED:"report"},report:{REPORTED:"technical_verify"},technical_verify:{TECHNICAL_VERIFIED:"requester_verify"},requester_verify:{REQUESTER_VERIFIED:"complete"}
  }));
  define("nightwalker-investigation","campaign_nightwalker.js","explicit",graph("briefing",["briefing","investigate","hypothesize","insight_ready","relay_ready","verify","complete"],{
    briefing:{STARTED:"investigate"},investigate:{EVIDENCE_COMPLETE:"hypothesize"},hypothesize:{INSIGHT_USED:"insight_ready"},insight_ready:{DEPENDENCY_REVEALED:"relay_ready"},relay_ready:{RELAY_SEVERED:"verify"},verify:{VERIFIED:"complete"}
  }));
  define("dead-air-investigation","campaign_dead_air.js","explicit",graph("briefing",["briefing","triangulate","choose","verify","complete"],{
    briefing:{STARTED:"triangulate"},triangulate:{TRIANGULATED:"choose"},choose:{ROUTE_CHOSEN:"verify"},verify:{VERIFIED:"complete"}
  }));

  define("good-dogs-mission","good_boys_progression_authority.js","explicit",graph("m1",["m1","m2","m3","m4","m5","m6","m7","m8","complete"],{
    m1:{MISSION_ADVANCED:"m2"},m2:{MISSION_ADVANCED:"m3"},m3:{MISSION_ADVANCED:"m4"},m4:{MISSION_ADVANCED:"m5"},
    m5:{MISSION_ADVANCED:"m6"},m6:{MISSION_ADVANCED:"m7"},m7:{MISSION_ADVANCED:"m8"},m8:{CAMPAIGN_COMPLETE:"complete"}
  }));
  define("good-dogs-objective","production_gameplay_experience.js","derived",graph("objective",["objective","security","interlock","breach","terminal","counterattack","exfil","investigate","release","ambush","secured","index","node","initializing","decrypt","failed","final-wave","warden","escape","home","complete"],{
    objective:{OBJECTIVE_CHANGED:"security"},security:{CLEARED:"interlock"},interlock:{SOLVED:"objective"},breach:{WAVE_CLEARED:"terminal"},terminal:{RELAY_USED:"counterattack"},counterattack:{WAVE_CLEARED:"exfil"},exfil:{EXIT_REACHED:"complete"},
    investigate:{CLUES_FOUND:"release"},release:{RELEASED:"ambush",WALDO_FREED:"secured"},ambush:{CLEARED:"secured"},index:{BOSS_DEFEATED:"security"},node:{SEIZED:"secured"},
    initializing:{UPLINK_READY:"decrypt",UPLINK_LOST:"failed"},decrypt:{DECRYPTED:"final-wave",UPLINK_LOST:"failed"}, "final-wave":{CLEARED:"release"},warden:{DEFEATED:"escape"},escape:{SHUTTLE_REACHED:"home"},home:{CAMPAIGN_COMPLETE:"complete"},failed:{RETRIED:"initializing"}
  }));
  define("prison-breach","good_boys_prison_gameplay_v2.js","explicit",graph("breach",["breach","terminal","counterattack","exfil","complete"],{
    breach:{WAVE_CLEARED:"terminal"},terminal:{RELAY_USED:"counterattack"},counterattack:{WAVE_CLEARED:"exfil"},exfil:{EXIT_REACHED:"complete"}
  }));
  define("ship-flight","good_boys_ship_flight.js","derived",graph("idle",["idle","loading","ready","flight","flight-complete","flight-cancelled","asset-error"],{
    idle:{LAUNCH:"loading"},loading:{ASSET_READY:"ready",ASSET_FAILED:"asset-error",CANCELLED:"flight-cancelled"},ready:{FRAME_STARTED:"flight",CANCELLED:"flight-cancelled"},
    flight:{ARRIVED:"flight-complete",CANCELLED:"flight-cancelled"}, "flight-cancelled":{RETRY:"loading"}, "asset-error":{RETRY:"loading"}
  }));
  define("night-player-action","night_combat.js","derived",graph("idle",["idle","windup","recovery","grab","dash","stunned","down"],{
    idle:{ATTACK:"windup",GRAB:"grab",DASH:"dash",HURT:"stunned",KO:"down"},windup:{ACTIVE:"recovery",HURT:"stunned",KO:"down"},
    recovery:{COMPLETE:"idle",JUMP_CANCEL:"idle",GRAB:"grab",HURT:"stunned",KO:"down"},grab:{THROW:"recovery",ESCAPE:"idle",HURT:"stunned"},
    dash:{COMPLETE:"idle",GRAB:"grab",HURT:"stunned"},stunned:{RECOVERED:"idle",KO:"down"}
  }));
  define("night-enemy-reaction","night_combat.js","derived",graph("grounded",["grounded","held","airborne","stunned","recovering","down"],{
    grounded:{GRABBED:"held",LAUNCHED:"airborne",HIT:"stunned",KO:"down"},held:{THROWN:"airborne",ESCAPED:"stunned",KO:"down"},
    airborne:{LANDED:"recovering",HIT:"airborne",KO:"down"},stunned:{RECOVERED:"grounded",LAUNCHED:"airborne",KO:"down"},recovering:{RECOVERED:"grounded",LAUNCHED:"airborne",KO:"down"}
  }));
  define("night-travel","runtime_night.js + night_hooks.js","derived",graph("street",["street","driving","transition","blocked","down"],{
    street:{DRIVE_STARTED:"driving",TRANSITION_STARTED:"transition",BLOCKED:"blocked",KO:"down"},driving:{ARRIVED:"street",BLOCKED:"blocked"},
    transition:{COMPLETED:"street",RETURNED_DAY:"blocked"},blocked:{UNBLOCKED:"street",TRANSITION_STARTED:"transition"},down:{RESTARTED:"street"}
  }));
  define("night-input","night_combat_input.js","contextual",graph("idle",["idle","pressed","held","dash-armed","buffered","blocked"],{
    idle:{PRESS:"pressed",BLOCKED:"blocked"},pressed:{HOLD:"held",RELEASE:"idle",DOUBLE_TAP:"dash-armed"},held:{RELEASE:"idle",BLOCKED:"blocked"},
    "dash-armed":{ATTACK:"idle",EXPIRED:"idle"},buffered:{CONSUMED:"idle",CANCELLED:"idle"},blocked:{UNBLOCKED:"idle"}
  }));
  define("animation-state","cinematic_systems.js","contextual",graph("idle",["idle","locomotion","air","dash","attack","block","hit","down"],{
    idle:{MOVE:"locomotion",JUMP:"air",DASH:"dash",ATTACK:"attack",BLOCK:"block",HIT:"hit",DOWN:"down"},
    locomotion:{STOP:"idle",JUMP:"air",DASH:"dash",ATTACK:"attack",HIT:"hit",DOWN:"down"},air:{LAND:"idle",ATTACK:"attack",HIT:"hit",DOWN:"down"},
    dash:{COMPLETE:"idle",HIT:"hit",DOWN:"down"},attack:{COMPLETE:"idle",HIT:"hit",DOWN:"down"},block:{RELEASE:"idle",HIT:"hit",DOWN:"down"},hit:{RECOVERED:"idle",DOWN:"down"}
  }));
  define("checkpoint","runtime_night.js + game.js","explicit",graph("empty",["empty","active","ready","complete","invalid","unavailable"],{
    empty:{SAVED:"ready",UNAVAILABLE:"unavailable"},active:{READ:"ready",COMPLETED:"complete",INVALIDATED:"invalid",UNAVAILABLE:"unavailable"},
    ready:{RESUMED:"active",INVALIDATED:"invalid",UNAVAILABLE:"unavailable"},complete:{NEW_RUN:"active"},invalid:{EXPLICIT_REPLACE:"active",UNAVAILABLE:"unavailable"},unavailable:{RETRY:"empty"}
  }));
  define("day-audio-playback","runtime_day_audio.js","derived",graph("idle",["idle","pending","playing","muted","not-found","unavailable","cancelled","error"],{
    idle:{PLAY_REQUESTED:"pending"},pending:{PLAY_CONFIRMED:"playing",MUTED:"muted",NOT_FOUND:"not-found",UNAVAILABLE:"unavailable",CANCELLED:"cancelled",ERROR:"error"},
    playing:{STOPPED:"idle",MUTED:"muted",CANCELLED:"cancelled",ERROR:"error"},muted:{RETRY:"pending"}, "not-found":{RETRY:"pending"},unavailable:{RETRY:"pending"},cancelled:{RETRY:"pending"},error:{RETRY:"pending"}
  }));
  define("music-request","game.js","contextual",graph("idle",["idle","loading","ready","requested","playing","paused","muted","unavailable"],{
    idle:{ENABLE:"loading"},loading:{WIDGET_READY:"ready",FAILED:"unavailable"},ready:{PLAY_REQUESTED:"requested"},requested:{PLAYING:"playing",MUTED:"muted"},
    playing:{PAUSED:"paused",MUTED:"muted"},paused:{PLAY_REQUESTED:"requested",MUTED:"muted"},muted:{ENABLE:"requested"},unavailable:{RETRY:"loading"}
  }));
  define("audio-ducking","runtime_day_audio.js","derived",graph("clear",["clear","ducked"],{clear:{DUCKED:"ducked"},ducked:{ALL_REASONS_RELEASED:"clear"}}));
  define("asset-loading","cinematic_systems.js + production_asset_registry.js","derived",graph("idle",["idle","loading","ready","missing","error"],{
    idle:{LOAD:"loading"},loading:{READY:"ready",MISSING:"missing",ERROR:"error"},missing:{RETRY:"loading"},error:{RETRY:"loading"}
  }));
  define("cutscene-sequence","good_dogs_cutscene_bridge.js","derived",graph("idle",["idle","running","media-wait-or-error","complete","error"],{
    idle:{START:"running"},running:{MEDIA_BLOCKED:"media-wait-or-error",COMPLETE:"complete",ERROR:"error"}, "media-wait-or-error":{RETRY:"running",COMPLETE:"complete"},error:{RETRY:"running"}
  }));
  define("cutscene-playback","good_dogs_cutscenes_v2_2.js","derived",graph("idle",["idle","loading","awaiting-gesture","playing","paused","unavailable","completed","user-skipped","error"],{
    idle:{LOAD:"loading"},loading:{PLAY:"playing",GESTURE_REQUIRED:"awaiting-gesture",UNSUPPORTED:"unavailable",ERROR:"error"},
    "awaiting-gesture":{PLAY:"playing",SKIP:"user-skipped",UNSUPPORTED:"unavailable"},playing:{PAUSE:"paused",ENDED:"completed",SKIP:"user-skipped",HIDDEN:"paused",ERROR:"error"},
    paused:{RESUME:"playing",SKIP:"user-skipped"},unavailable:{SKIP:"user-skipped"},error:{RETRY:"loading",SKIP:"user-skipped"}
  }));
  define("save-recovery","game.js","derived",graph("clean",["clean","migrated","backup-restored","backup-memory-only","quarantined","failed"],{
    clean:{MIGRATED:"migrated",PRIMARY_RECOVERED:"backup-restored",MEMORY_RECOVERED:"backup-memory-only",CORRUPT_QUARANTINED:"quarantined",FAILED:"failed"},
    migrated:{SAVED:"clean",FAILED:"failed"}, "backup-restored":{SAVED:"clean",FAILED:"failed"}, "backup-memory-only":{SAVED:"clean",FAILED:"failed"},quarantined:{SAVED:"clean",FAILED:"failed"},failed:{RETRIED:"clean"}
  }));

  function game(){try{return typeof S!=="undefined"?S:root.S||null;}catch(_){return root.S||null;}}
  function world(){var s=game();return s&&s.nightMode&&typeof s.nightMode==="object"?s.nightMode:root.NM||null;}
  function visible(id){
    try{var el=root.document&&root.document.getElementById(id);if(!el||el.hidden||el.classList&&el.classList.contains("hidden"))return false;var style=root.getComputedStyle?root.getComputedStyle(el):el.style;return !style||style.display!=="none"&&style.visibility!=="hidden";}catch(_){return false;}
  }
  function campaignRaw(){
    try{var raw=root.localStorage&&root.localStorage.getItem("techops_hero_campaign_v1");if(!raw)return null;var value=JSON.parse(raw);return value&&typeof value==="object"?value:null;}catch(_){return null;}
  }
  function state(value){return typeof value==="string"?value:"unavailable";}
  var SELECTORS={
    "title-readiness":function(){var api=root.TechOpsProductionTitleExperience;return api&&api.state?api.state().phase:"unavailable";},
    "night-launch":function(){return root.__productionNightLaunchPhase||"idle";},
    "run-lifecycle":function(){var s=game();if(!s)return visible("title-screen")?"title":"unavailable";if(s.gameOver)return"game-over";if(s.won)return"victory";if(s.nightMode)return"night";if(visible("eod"))return"end-of-day";if(s.inDialog&&!s.map)return"difficulty";return s.map?"day":"difficulty";},
    "modal-interaction":function(){var s=game(),director=root.TechOpsPresentationDirector;if(director&&director.current){var current=director.current();if(current.claims&&current.claims.length)return"cinematic";}if(s&&s.inBattle)return"battle";if(visible("eod"))return"end-of-day";if(visible("panel"))return"panel";if(s&&s.inDialog)return"dialogue";if(director&&director.isBlocking&&director.isBlocking())return"cinematic";return s&&s.paused?"paused":"exploration";},
    bootstrap:function(){if(root.__productionBootstrapReady)return"ready";if(root.__productionBootstrapError||root.__productionBootstrapWireError)return"failed";return root.TechOpsProductionBootstrap?"loading":root.v736&&root.v737?"loading":"waiting";},
    "mode-shell":function(){var api=root.TechOpsModeShell;return api&&api.health?api.health().mode:game()&&game().nightMode?"night":"day";},
    presentation:function(){var api=root.TechOpsPresentationDirector;if(!api||!api.current)return"unavailable";var current=api.current();return current.blocking?"blocked":current.claims.length?"claimed":"idle";},
    "campaign-opening":function(){var c=campaignRaw();return c&&c.campaign&&c.campaign.phase||"unavailable";},
    "campaign-investigation":function(){var c=campaignRaw(),store=c&&c.investigations||{},ids=Object.keys(store);return ids.length?store[ids[0]].phase:"unavailable";},
    "act4-trust":function(){var c=campaignRaw();return c&&c.trust&&c.trust.stage||"unavailable";},
    "good-dogs-mission":function(){var s=game(),n=world(),c=n&&n._v736||s&&s.meta&&s.meta._v736;if(s&&s.meta&&s.meta.goodDogs&&s.meta.goodDogs.good_dogs_protocol_complete)return"complete";return c&&c.m?"m"+Number(c.m):"unavailable";},
    "good-dogs-objective":function(){var api=root.TechOpsGameplayExperience,o=api&&api.objective&&api.objective();return o&&o.phase||"unavailable";},
    "prison-breach":function(){var api=root.TechOpsGoodBoysPrisonGameplayV2,a=api&&api.acceptance&&api.acceptance();return a&&a.phase||"unavailable";},
    "ship-flight":function(){var s=root.__goodBoysShipFlightState;return s&&s.phase||"idle";},
    "night-player-action":function(){var n=world(),c=n&&n._nightCombat;if(!n||!c)return"unavailable";if(n.hp<=0)return"down";if(c.grab)return"grab";if(c.stunUntil>c.time)return"stunned";if(c.attack)return c.time-c.attack.at<(c.attack.windup||70)?"windup":"recovery";if(c.dash&&!c.dash.spent&&c.time<=c.dash.until)return"dash";return"idle";},
    "night-enemy-reaction":function(input){var n=world(),e=input&&input.enemy;if(!e&&n&&Array.isArray(n.enemies))e=n.enemies.filter(function(row){return row&&row.alive&&row._nightCombat;})[0]||n.enemies.filter(function(row){return row&&row.alive;})[0];var c=e&&e._nightCombat;if(!e||!c)return"unavailable";if(!e.alive||e.hp<=0)return"down";if(c.held)return"held";if(c.air)return"airborne";if(c.recoverUntil>(n._nightCombat&&n._nightCombat.time||0))return"recovering";if(c.stunUntil>(n._nightCombat&&n._nightCombat.time||0))return"stunned";return"grounded";},
    "night-travel":function(){var n=world(),api=root.TechOpsNightRuntime;if(!n)return"unavailable";if(api&&api.health&&api.health().transitioning)return"transition";if(n.drive)return"driving";if(n.hp<=0)return"down";return api&&api.blocked&&api.blocked()?"blocked":"street";},
    checkpoint:function(){var api=root.TechOpsNightRuntime;return api&&api.checkpointStatus?api.checkpointStatus().status:"unavailable";},
    "day-audio-playback":function(){var api=root.TechOpsDayAudio,d=api&&api.diagnostics&&api.diagnostics();return d&&d.playback&&d.playback.status||"idle";},
    "audio-ducking":function(){var api=root.TechOpsDayAudio,d=api&&api.diagnostics&&api.diagnostics();return d&&d.duckReasons&&d.duckReasons.length?"ducked":"clear";},
    "asset-loading":function(){var api=root.TechOpsArtHandoff,h=api&&api.health&&api.health();return h&&h.status||"unavailable";},
    "cutscene-sequence":function(){var s=root.__goodDogsCutsceneSequence;return s&&s.status||"idle";},
    "cutscene-playback":function(){var gesture=root.__goodDogsCutsceneNeedsGesture,exit=root.__goodDogsCutsceneExit;if(gesture){if(gesture.reason==="codec-unsupported")return"unavailable";if(gesture.reason==="media-error")return"error";if(gesture.reason==="tab-hidden"||gesture.reason==="user-paused")return"paused";return"awaiting-gesture";}if(exit)return exit.status==="USER_SKIPPED"?"user-skipped":"completed";if(visible("good-dogs-cutscene-overlay"))return"playing";return"idle";},
    "save-recovery":function(){if(root.__techopsSaveLoadError||root.__techopsSaveError)return"failed";if(root.__techopsSaveRecovery)return root.__techopsSaveRecovery;if(root.__techopsSaveMigration&&root.__techopsSaveMigration.migrated)return"migrated";return"clean";}
  };

  function record(entry){history.push(entry);if(history.length>HISTORY_LIMIT)history.splice(0,history.length-HISTORY_LIMIT);return entry;}
  function transition(id,from,event,details){
    var machine=DEFINITIONS[id],target=machine&&machine.transitions[from]&&machine.transitions[from][event],accepted=typeof target==="string";
    var result={sequence:++sequence,machine:id,from:from,event:event,to:accepted?target:from,accepted:accepted,details:details||null,at:Date.now()};
    if(!machine)result.reason="unknown-machine";else if(!machine.transitions[from])result.reason="unknown-state";else if(!accepted)result.reason="unexpected-transition";
    record(result);
    try{if(root.dispatchEvent&&root.CustomEvent)root.dispatchEvent(new root.CustomEvent("techops:state-transition",{detail:clone(result)}));}catch(_){}
    return result;
  }
  function next(id,from,event,fallback,details){
    var result=transition(id,from,event,details),machine=DEFINITIONS[id];
    if(result.accepted)return result.to;
    // Compatibility seam: never change legacy behavior because instrumentation
    // discovered an undocumented edge. Make the edge visible and preserve it.
    result.requested=fallback!==undefined?fallback:from;result.to=result.requested;
    if(machine&&machine.states.indexOf(result.to)<0)result.reason="unregistered-legacy-state";
    return result.to;
  }
  function read(id,input){
    var machine=DEFINITIONS[id];if(!machine)return{id:id,available:false,state:"unknown",reason:"unknown-machine"};
    var selector=SELECTORS[id];if(!selector)return{id:id,file:machine.file,kind:machine.kind,available:false,state:"context-required",reason:"Pass the owning record or actor to inspect this contextual machine."};
    try{var value=selector(input||{}),current=state(value);return{id:id,file:machine.file,kind:machine.kind,available:current!=="unavailable",state:current,registered:machine.states.indexOf(current)>=0};}catch(error){return{id:id,file:machine.file,kind:machine.kind,available:false,state:"error",reason:String(error&&error.message||error)};}
  }
  function inspect(){var machines={};Object.keys(DEFINITIONS).forEach(function(id){machines[id]=read(id);});return{version:VERSION,at:Date.now(),machineCount:Object.keys(DEFINITIONS).length,machines:machines};}
  function inventory(){return Object.keys(DEFINITIONS).map(function(id){return clone(DEFINITIONS[id]);});}
  root.TechOpsStateMachines=Object.freeze({
    VERSION:VERSION,transition:transition,next:next,read:read,inspect:inspect,inventory:inventory,
    history:function(){return clone(history);},clearHistory:function(){history=[];sequence=0;return true;}
  });
  if(typeof module!=="undefined"&&module.exports)module.exports=root.TechOpsStateMachines;
})(typeof globalThis!=="undefined"?globalThis:this);
