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
 */
(function(root){
  function snapshotParserChain(){
    try{root.__techopsFinalParserDrawNM=(typeof drawNM==="function"?drawNM:null);}catch(e){root.__techopsFinalParserDrawNM=null;}
    try{root.__techopsFinalParserStepNM=(typeof stepNM==="function"?stepNM:null);}catch(e){root.__techopsFinalParserStepNM=null;}
    root.__techopsFinalParserChainReady=!!(root.__techopsFinalParserDrawNM&&root.__techopsFinalParserStepNM);
    return root.__techopsFinalParserChainReady;
  }
  function boot(){
    try{
      if(document.querySelector('script[data-techops-production-bootstrap]'))return;
      snapshotParserChain();
      var s=document.createElement('script');
      s.src='production_bootstrap.js';
      s.async=false;
      s.dataset.techopsProductionBootstrap='1';
      (document.head||document.documentElement).appendChild(s);
    }catch(e){root.__productionBootstrapWireError=String(e&&e.stack||e);}
  }
  function queueBoot(){try{(root.setTimeout||setTimeout)(boot,0);}catch(e){boot();}}
  try{
    if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',queueBoot,{once:true});
    else queueBoot();
  }catch(e){root.__productionBootstrapWireError=String(e&&e.stack||e);}
  root.__techopsSnapshotFinalParserChain=snapshotParserChain;
})(window);