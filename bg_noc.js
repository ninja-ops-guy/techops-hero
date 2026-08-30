window.TO_BG_NOC = (function(){ try { return window.__GK_BG_NOC || undefined; } catch(e) { return undefined; } })();
/* Production bootstrap entrypoint. */
(function(root){
  root.__productionCompositorPlanned=true;
  root.__goodBoysDirectorPlanned=true;
  root.__goodBoysEarthfallPlanned=true;
  var BUILD="20260829-goodboys-visual-polish-v4";
  function snapshotParserChain(){
    try{root.__techopsFinalParserDrawNM=(typeof drawNM==="function"?drawNM:null);}catch(e){root.__techopsFinalParserDrawNM=null;}
    try{root.__techopsFinalParserStepNM=(typeof stepNM==="function"?stepNM:null);}catch(e){root.__techopsFinalParserStepNM=null;}
    root.__techopsFinalParserChainReady=!!(root.__techopsFinalParserDrawNM&&root.__techopsFinalParserStepNM);
    return root.__techopsFinalParserChainReady;
  }
  function appendScript(attr,src,onload,onerror){
    try{
      var old=document.querySelector('script['+attr+']');if(old&&old.parentNode)old.parentNode.removeChild(old);
      var s=document.createElement('script');s.src=src+'?v='+BUILD;s.async=false;s.setAttribute(attr,'1');s.onload=onload||null;s.onerror=onerror||null;(document.head||document.documentElement).appendChild(s);return true;
    }catch(e){return false;}
  }
  function loadHudLite(){if(!appendScript('data-good-boys-hud-lite','good_boys_hud_lite.js',null,function(){root.__goodBoysHudLiteWireError='good_boys_hud_lite.js';}))root.__goodBoysHudLiteWireError='append_failed';}
  function loadDepthLite(){if(!appendScript('data-good-boys-depth-lite','good_boys_depth_lite.js',loadHudLite,function(){root.__goodBoysDepthLiteWireError='good_boys_depth-lite.js';loadHudLite();}))loadHudLite();}
  function loadProgression(){if(!appendScript('data-good-boys-progression-authority','good_boys_progression_authority.js',loadDepthLite,function(){root.__goodBoysProgressionWireError='good_boys_progression_authority.js';loadDepthLite();}))loadDepthLite();}
  function loadEarthfall(){if(!appendScript('data-good-boys-earthfall-ending','good_boys_earthfall_ending.js',loadProgression,function(){root.__goodBoysEarthfallWireError='good_boys_earthfall_ending.js';loadProgression();}))loadProgression();}
  function loadAccessCore(){if(!appendScript('data-good-boys-access-core-authority','good_boys_access_core_authority.js',loadEarthfall,function(){root.__goodBoysAccessCoreWireError='good_boys_access_core_authority.js';loadEarthfall();}))loadEarthfall();}
  function loadBibleWorld(){if(!appendScript('data-good-boys-bible-world','good_boys_bible_world.js',loadAccessCore,function(){root.__goodBoysBibleWorldWireError='good_boys_bible_world.js';loadAccessCore();}))loadAccessCore();}
  function loadBackgroundAuthority(){if(!appendScript('data-good-boys-background-authority','good_boys_background_authority.js',loadBibleWorld,function(){root.__goodBoysBackgroundWireError='good_boys_background_authority.js';loadBibleWorld();}))loadBibleWorld();}
  function loadPrisonPatch(){if(!appendScript('data-good-boys-prison-cinematic-patch','good_boys_prison_cinematic_patch.js',loadBackgroundAuthority,function(){root.__goodBoysPrisonCinematicWireError='good_boys_prison_cinematic_patch.js';loadBackgroundAuthority();}))loadBackgroundAuthority();}
  function loadDirector(){if(!appendScript('data-good-boys-campaign-director','good_boys_campaign_director.js',loadPrisonPatch,function(){root.__goodBoysCampaignDirectorWireError='good_boys_campaign_director.js';loadPrisonPatch();}))loadPrisonPatch();}
  function loadRuntimeLock(){
    try{
      if(document.querySelector('script[data-techops-production-runtime-lock]')){loadDirector();return;}
      if(!appendScript('data-techops-production-runtime-lock','production_runtime_lock.js',loadDirector,function(){root.__productionRuntimeLockWireError='production_runtime_lock.js';loadDirector();}))loadDirector();
    }catch(e){root.__productionRuntimeLockWireError=String(e&&e.stack||e);loadDirector();}
  }
  function boot(){
    try{
      if(document.querySelector('script[data-techops-production-bootstrap]')){loadRuntimeLock();return;}
      snapshotParserChain();
      if(!appendScript('data-techops-production-bootstrap','production_bootstrap.js',loadRuntimeLock,function(){root.__productionBootstrapWireError='production_bootstrap.js';loadDirector();}))loadDirector();
    }catch(e){root.__productionBootstrapWireError=String(e&&e.stack||e);loadDirector();}
  }
  function queueBoot(){try{(root.setTimeout||setTimeout)(boot,0);}catch(e){boot();}}
  try{if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',queueBoot,{once:true});else queueBoot();}catch(e){root.__productionBootstrapWireError=String(e&&e.stack||e);}
  root.__techopsSnapshotFinalParserChain=snapshotParserChain;
})(window);