window.TO_BG_NOC = (function(){ try { return window.__GK_BG_NOC || undefined; } catch(e) { return undefined; } })();
/* Production bootstrap entrypoint. */
(function(root){
  root.__productionCompositorPlanned=true;
  var BUILD="20260827-goodboys-progression-v1";
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
  function loadProgression(){
    if(!appendScript('data-good-boys-progression-authority','good_boys_progression_authority.js',null,function(){root.__goodBoysProgressionWireError='good_boys_progression_authority.js';}))root.__goodBoysProgressionWireError='append_failed';
  }
  function loadPrisonPatch(){
    if(!appendScript('data-good-boys-prison-cinematic-patch','good_boys_prison_cinematic_patch.js',loadProgression,function(){root.__goodBoysPrisonCinematicWireError='good_boys_prison_cinematic_patch.js';loadProgression();}))loadProgression();
  }
  function loadDirector(){
    if(!appendScript('data-good-boys-campaign-director','good_boys_campaign_director.js',loadPrisonPatch,function(){root.__goodBoysCampaignDirectorWireError='good_boys_campaign_director.js';loadPrisonPatch();}))loadPrisonPatch();
  }
  function loadGoodBoysFix(){
    if(!appendScript('data-good-boys-mobile-runtime-fix','good_boys_mobile_runtime_fix.js',loadDirector,function(){root.__goodBoysMobileRuntimeFixWireError='good_boys_mobile_runtime_fix.js';loadDirector();}))loadDirector();
  }
  function loadRuntimeLock(){
    try{
      if(document.querySelector('script[data-techops-production-runtime-lock]')){loadGoodBoysFix();return;}
      if(!appendScript('data-techops-production-runtime-lock','production_runtime_lock.js',loadGoodBoysFix,function(){root.__productionRuntimeLockWireError='production_runtime_lock.js';loadGoodBoysFix();}))loadGoodBoysFix();
    }catch(e){root.__productionRuntimeLockWireError=String(e&&e.stack||e);loadGoodBoysFix();}
  }
  function boot(){
    try{
      if(document.querySelector('script[data-techops-production-bootstrap]')){loadRuntimeLock();return;}
      snapshotParserChain();
      if(!appendScript('data-techops-production-bootstrap','production_bootstrap.js',loadRuntimeLock,function(){root.__productionBootstrapWireError='production_bootstrap.js';loadGoodBoysFix();}))loadGoodBoysFix();
    }catch(e){root.__productionBootstrapWireError=String(e&&e.stack||e);loadGoodBoysFix();}
  }
  function queueBoot(){try{(root.setTimeout||setTimeout)(boot,0);}catch(e){boot();}}
  try{if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',queueBoot,{once:true});else queueBoot();}catch(e){root.__productionBootstrapWireError=String(e&&e.stack||e);}
  root.__techopsSnapshotFinalParserChain=snapshotParserChain;
})(window);
