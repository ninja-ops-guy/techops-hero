/* TechOps Hero — production runtime bootstrap v15.
 * Stable production stack. v15 separates ordinary day-run cinematics from
 * Good Boys/Waldo concept-art plates and refreshes mobile Safari caches.
 */
(function(root){
  "use strict";
  if(!root||root.TechOpsProductionBootstrap)return;
  var VERSION=15,BUILD="20260830-production-v15-day-cinematic-scope",started=false,done=false;
  var FILES=[
    "production_asset_registry.js",
    "night_production_assets.js",
    "good_boys_campaign_assets.js",
    "good_boys_legacy_hud_filter.js",
    "production_wrapper_guard.js",
    "good_dogs_production_runtime.js",
    "good_boys_visual_polish.js",
    "good_boys_mobile_cinematic_polish.js",
    "good_boys_reference_mechanics.js",
    "good_boys_canon_runtime.js",
    "good_boys_gameplay_loop.js",
    "good_boys_mobile_controls_layout.js",
    "good_boys_mobile_launch_guard.js",
    "production_runtime_safety.js",
    "production_mode_router.js",
    "production_presentation_guard.js"
  ];
  var DEFER_FROM="good_dogs_production_runtime.js",FREEZE_AT="production_wrapper_guard.js";
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
    try{for(var i=0;i<FILES.length;i++){var src=FILES[i];if(src===DEFER_FROM)beginTimerDeferral();if(src===FREEZE_AT&&deferOn){root.setInterval=nativeSetInterval;if(nativeClearInterval)root.clearInterval=nativeClearInterval;}await load(src);if(src===FREEZE_AT){try{if(root.TechOpsProductionWrapperGuard)root.TechOpsProductionWrapperGuard.enforce();}catch(e){root.__productionWrapperFreezeError=String(e&&e.stack||e);}parkTimers();}}}finally{if(deferOn)parkTimers();}
    try{if(root.TechOpsProductionAssets)await root.TechOpsProductionAssets.install();}catch(e){root.__productionAssetInstallError=String(e&&e.stack||e);}
    try{if(root.TechOpsNightProductionAssets)await root.TechOpsNightProductionAssets.install();}catch(e){}
    try{if(root.TechOpsGoodBoysCampaignAssets){root.TechOpsGoodBoysCampaignAssets.aliasBackgrounds();root.TechOpsGoodBoysCampaignAssets.installDistricts();}}catch(e){}
    try{if(root.TechOpsGoodBoysVisualPolish)root.TechOpsGoodBoysVisualPolish.install();}catch(e){root.__productionVisualPolishInstallError=String(e&&e.stack||e);}
    try{if(root.TechOpsGoodBoysMobileCinematicPolish)root.TechOpsGoodBoysMobileCinematicPolish.apply();}catch(e){root.__productionMobileCinePolishError=String(e&&e.stack||e);}
    try{if(root.TechOpsProductionWrapperGuard)root.TechOpsProductionWrapperGuard.enforce();}catch(e){}
    try{if(root.TechOpsProductionPresentationGuard)root.TechOpsProductionPresentationGuard.clean();}catch(e){}
    done=true;root.__productionBootstrapReady=true;root.__productionBootstrapBuild=BUILD;
  }
  root.TechOpsProductionBootstrap={VERSION:VERSION,BUILD:BUILD,FILES:FILES,start:start,ready:function(){return done;}};
  start();
})(typeof globalThis!=="undefined"?globalThis:this);