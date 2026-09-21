/* TechOps Hero — production runtime bootstrap v48.
 * Infrastructure / Night / Good Boys production stack only. Story Bible campaign
 * completion is loaded by campaign_late_game_bootstrap.js after canonical
 * campaign and native Act II dependencies exist, eliminating duplicate loaders.
 * v42 adds reference models and grounded M5 corridor movement; physical-iPhone world/render cohesion remains last.
 */
(function(root){
  "use strict";
  if(!root||root.TechOpsProductionBootstrap)return;
  var VERSION=48,BUILD="20260921-startup-r1",started=false,done=false;
  var FILES=[
    "runtime_mode_shell.js",
    "production_asset_registry.js",
    "night_production_assets.js",
    "good_boys_campaign_assets.js",
    "state_validator.js",
    "runtime_combat_audio.js",
    "night_combat.js",
    "night_move_atlas.js",
    "night_move_visuals.js",
    "runtime_scene_art.js",
    "night_combat_input.js",
    "night_mobile_visual_cohesion.js",
    "production_gameplay_experience.js",
    "orbital_scene_staging.js",
    "good_boys_legacy_hud_filter.js",
    "good_dogs_actor_contract.js",
    "good_dogs_grounded.js",
    "good_dogs_3d_presentation.js",
    "production_wrapper_guard.js",
    "good_dogs_production_runtime.js",
    "good_boys_visual_polish.js",
    "good_boys_mobile_cinematic_polish.js",
    "good_boys_reference_mechanics.js",
    "good_boys_canon_runtime.js",
    "good_boys_gameplay_loop.js",
    "good_boys_prison_gameplay_v2.js",
    "good_boys_mobile_controls_layout.js",
    "good_boys_reference_ui_v1.js",
    "visual_cohesion_live_crawl.js",
    "good_boys_mobile_launch_guard.js",
    "good_boys_ship_flight.js",
    "good_dogs_cutscenes_v2_2.js",
    "good_dogs_cutscene_bridge.js",
    "day_cinematic_mobile_guard.js",
    "production_runtime_safety.js",
    "production_mode_router.js",
    "production_presentation_guard.js",
    "runtime_night.js",
    "gameplay_recording_cohesion.js",
    "recording_world_cohesion.js"
  ];
  var DEFER_FROM="good_dogs_production_runtime.js",FREEZE_AT="production_wrapper_guard.js";
  // Fetch ahead, never execute ahead. The serial load/install boundaries below
  // still own dependency order and wrapper/timer installation. Unsupported or
  // failed preload hints simply fall back to the existing script request.
  var PRELOAD_AHEAD=4,preloads=Object.create(null);
  function warmNext(index){
    if(!root.document)return;
    for(var j=index+1;j<Math.min(FILES.length,index+1+PRELOAD_AHEAD);j++){
      var src=FILES[j];if(preloads[src]||has(src))continue;
      try{var link=root.document.createElement("link");link.rel="preload";link.as="script";link.href=src+"?v="+BUILD;(root.document.head||root.document.documentElement).appendChild(link);preloads[src]=link;}catch(e){}
    }
  }
  function retirePreload(src){var link=preloads[src];if(!link)return;try{if(link.parentNode)link.parentNode.removeChild(link);}catch(e){}delete preloads[src];}
  function has(src){try{return !!(root.document&&root.document.querySelector('script[data-production-bootstrap="'+src+'"]'));}catch(e){return false;}}
  function load(src){return new Promise(function(resolve){try{if(!root.document||has(src)){resolve(true);return;}var s=document.createElement("script");s.src=src+"?v="+BUILD;s.async=false;s.dataset.productionBootstrap=src;s.onload=function(){resolve(true);};s.onerror=function(){root.__productionBootstrapError=src;resolve(false);};(root.document.head||root.document.documentElement).appendChild(s);}catch(e){root.__productionBootstrapError=String(e&&e.stack||e);resolve(false);}});}
  async function start(){
    if(started)return;started=true;
    var tries=0;
    while(!(root.v736&&typeof root.v736.start==="function"&&root.v737)&&tries++<400)await new Promise(function(r){(root.setTimeout||setTimeout)(r,10);});
    root.__productionParserStackReady=!!(root.v736&&root.v737);
    var nativeSetInterval=root.setInterval?root.setInterval.bind(root):null;
    var nativeClearInterval=root.clearInterval?root.clearInterval.bind(root):null;
    var deferred=[],deferOn=false,nextFake=-7000;
    function beginTimerDeferral(){if(deferOn||!nativeSetInterval)return;deferOn=true;root.setInterval=function(fn,ms){var rec={fake:nextFake--,fn:fn,ms:Math.max(1,Number(ms)||1),args:Array.prototype.slice.call(arguments,2),cancelled:false,real:null};deferred.push(rec);return rec.fake;};if(nativeClearInterval)root.clearInterval=function(id){for(var i=0;i<deferred.length;i++)if(deferred[i].fake===id&&!deferred[i].real){deferred[i].cancelled=true;return;}return nativeClearInterval(id);};root.__productionTimersDeferred=true;}
    function parkTimers(){if(!deferOn)return;deferOn=false;if(nativeSetInterval)root.setInterval=nativeSetInterval;if(nativeClearInterval)root.clearInterval=nativeClearInterval;for(var i=0;i<deferred.length;i++)deferred[i].cancelled=true;root.__productionParkedMaintenanceTimers=deferred.length;root.__productionTimersDeferred=false;}
    try{for(var i=0;i<FILES.length;i++){var src=FILES[i];warmNext(i);if(src===DEFER_FROM)beginTimerDeferral();if(src===FREEZE_AT&&deferOn){root.setInterval=nativeSetInterval;if(nativeClearInterval)root.clearInterval=nativeClearInterval;}await load(src);retirePreload(src);if(src==="good_dogs_actor_contract.js"){try{if(root.TechOpsGoodDogsActorContract)root.TechOpsGoodDogsActorContract.enforce();}catch(e){root.__productionGoodDogsActorContractError=String(e&&e.stack||e);}}if(src===FREEZE_AT){try{if(root.TechOpsProductionWrapperGuard)root.TechOpsProductionWrapperGuard.enforce();}catch(e){root.__productionWrapperFreezeError=String(e&&e.stack||e);}parkTimers();}}}finally{Object.keys(preloads).forEach(retirePreload);if(deferOn)parkTimers();}
    try{if(root.TechOpsProductionAssets)await root.TechOpsProductionAssets.install();}catch(e){root.__productionAssetInstallError=String(e&&e.stack||e);}
    try{if(root.TechOpsNightProductionAssets)await root.TechOpsNightProductionAssets.install();}catch(e){}
    try{if(root.TechOpsGoodBoysCampaignAssets){root.TechOpsGoodBoysCampaignAssets.aliasBackgrounds();root.TechOpsGoodBoysCampaignAssets.installDistricts();}}catch(e){}
    try{if(root.TechOpsGoodDogsActorContract)root.TechOpsGoodDogsActorContract.enforce();}catch(e){root.__productionGoodDogsActorContractError=String(e&&e.stack||e);}
    try{if(root.TechOpsGoodBoysVisualPolish)root.TechOpsGoodBoysVisualPolish.install();}catch(e){root.__productionVisualPolishInstallError=String(e&&e.stack||e);}
    try{if(root.TechOpsGoodBoysMobileCinematicPolish)root.TechOpsGoodBoysMobileCinematicPolish.apply();}catch(e){root.__productionMobileCinePolishError=String(e&&e.stack||e);}
    try{if(root.TechOpsGoodBoysPrisonGameplayV2)root.TechOpsGoodBoysPrisonGameplayV2.tick();}catch(e){root.__productionGoodBoysPrisonGameplayError=String(e&&e.stack||e);}
    try{if(root.TechOpsGoodBoysMobileControlsLayout)root.TechOpsGoodBoysMobileControlsLayout.apply();}catch(e){root.__productionGoodBoysControlLayoutError=String(e&&e.stack||e);}
    try{if(root.TechOpsGoodBoysReferenceUI)root.TechOpsGoodBoysReferenceUI.apply();}catch(e){root.__productionGoodBoysReferenceUIError=String(e&&e.stack||e);}
    try{if(root.TechOpsGoodBoysShipFlight)root.TechOpsGoodBoysShipFlight.install();}catch(e){root.__productionGoodBoysShipFlightError=String(e&&e.stack||e);}
    try{if(root.TechOpsGoodDogsCutsceneBridge)root.TechOpsGoodDogsCutsceneBridge.tick();}catch(e){root.__productionGoodDogsCutsceneBridgeError=String(e&&e.stack||e);}
    try{if(root.TechOpsDayCinematicMobileGuard)root.TechOpsDayCinematicMobileGuard.install();}catch(e){root.__productionDayCineGuardError=String(e&&e.stack||e);}
    try{if(root.TechOpsProductionWrapperGuard)root.TechOpsProductionWrapperGuard.enforce();}catch(e){}
    try{if(root.TechOpsProductionPresentationGuard)root.TechOpsProductionPresentationGuard.clean();}catch(e){}
    try{if(root.TechOpsLiveCrawlVisualCohesion)root.TechOpsLiveCrawlVisualCohesion.tick();}catch(e){root.__productionLiveCrawlVisualError=String(e&&e.stack||e);}
    try{if(root.TechOpsNightMobileVisualCohesion)root.TechOpsNightMobileVisualCohesion.sync();}catch(e){root.__productionNightMobileVisualError=String(e&&e.stack||e);}
    try{if(root.TechOpsGameplayRecordingCohesion)root.TechOpsGameplayRecordingCohesion.mode();}catch(e){root.__productionRecordingCohesionError=String(e&&e.stack||e);}
    try{if(root.TechOpsRecordingWorldCohesion)root.TechOpsRecordingWorldCohesion.install();}catch(e){root.__productionRecordingWorldError=String(e&&e.stack||e);}
    done=true;root.__productionBootstrapReady=true;root.__productionBootstrapBuild=BUILD;root.__productionCampaignLoaderSeparated=true;
    try{if(root.dispatchEvent&&root.CustomEvent)root.dispatchEvent(new root.CustomEvent("techops:production-ready",{detail:{version:VERSION,build:BUILD}}));}catch(e){}
  }
  root.TechOpsProductionBootstrap={VERSION:VERSION,BUILD:BUILD,FILES:FILES,start:start,ready:function(){return done;}};
  start();
})(typeof globalThis!=="undefined"?globalThis:this);
