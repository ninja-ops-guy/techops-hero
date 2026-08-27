window.TO_BG_NOC = (function(){ try { return window.__GK_BG_NOC || undefined; } catch(e) { return undefined; } })();
/* Production bootstrap entrypoint.
 * Several parser-loaded campaign modules register DOMContentLoaded installers
 * (notably Sector 04) instead of wrapping immediately. Production must start
 * after those listeners have finished or they can capture a production wrapper
 * as their "original" and close a drawNM cycle. Queue boot one task after the
 * DOMContentLoaded dispatch so the entire legacy/campaign chain is final first.
 *
 * Before production loads, publish the exact final parser-owned Night draw/step
 * functions. The production compositor consumes these immutable snapshots
 * instead of trying to infer a clean base from mutable window bindings.
 *
 * IMPORTANT: advertise compositor intent synchronously. Feature runtimes use
 * this latch to refuse legacy drawNM/stepNM ownership even before the async
 * production bootstrap has installed the stable compositor. This closes the
 * load-order window that allowed Good Boys wrappers to capture one another.
 */
(function(root){
  root.__productionCompositorPlanned=true;
  var BUILD="20260827-goodboys-combos-v2";
  function snapshotParserChain(){
    try{root.__techopsFinalParserDrawNM=(typeof drawNM==="function"?drawNM:null);}catch(e){root.__techopsFinalParserDrawNM=null;}
    try{root.__techopsFinalParserStepNM=(typeof stepNM==="function"?stepNM:null);}catch(e){root.__techopsFinalParserStepNM=null;}
    root.__techopsFinalParserChainReady=!!(root.__techopsFinalParserDrawNM&&root.__techopsFinalParserStepNM);
    return root.__techopsFinalParserChainReady;
  }
  function loadGoodBoysFix(){
    try{
      var old=document.querySelector('script[data-good-boys-mobile-runtime-fix]');if(old&&old.parentNode)old.parentNode.removeChild(old);
      var f=document.createElement('script');
      f.src='good_boys_mobile_runtime_fix.js?v='+BUILD;
      f.async=false;
      f.dataset.goodBoysMobileRuntimeFix='1';
      f.onerror=function(){root.__goodBoysMobileRuntimeFixWireError='good_boys_mobile_runtime_fix.js';};
      (document.head||document.documentElement).appendChild(f);
    }catch(e){root.__goodBoysMobileRuntimeFixWireError=String(e&&e.stack||e);}
  }
  function loadRuntimeLock(){
    try{
      if(document.querySelector('script[data-techops-production-runtime-lock]')){loadGoodBoysFix();return;}
      var l=document.createElement('script');
      l.src='production_runtime_lock.js?v='+BUILD;
      l.async=false;
      l.dataset.techopsProductionRuntimeLock='1';
      l.onload=loadGoodBoysFix;
      l.onerror=function(){root.__productionRuntimeLockWireError='production_runtime_lock.js';loadGoodBoysFix();};
      (document.head||document.documentElement).appendChild(l);
    }catch(e){root.__productionRuntimeLockWireError=String(e&&e.stack||e);loadGoodBoysFix();}
  }
  function boot(){
    try{
      if(document.querySelector('script[data-techops-production-bootstrap]')){loadRuntimeLock();return;}
      snapshotParserChain();
      var s=document.createElement('script');
      s.src='production_bootstrap.js?v='+BUILD;
      s.async=false;
      s.dataset.techopsProductionBootstrap='1';
      s.onload=loadRuntimeLock;
      s.onerror=function(){root.__productionBootstrapWireError='production_bootstrap.js';loadGoodBoysFix();};
      (document.head||document.documentElement).appendChild(s);
    }catch(e){root.__productionBootstrapWireError=String(e&&e.stack||e);loadGoodBoysFix();}
  }
  function queueBoot(){try{(root.setTimeout||setTimeout)(boot,0);}catch(e){boot();}}
  try{
    if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',queueBoot,{once:true});
    else queueBoot();
  }catch(e){root.__productionBootstrapWireError=String(e&&e.stack||e);}
  root.__techopsSnapshotFinalParserChain=snapshotParserChain;
})(window);