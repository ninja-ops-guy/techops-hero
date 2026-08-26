window.TO_BG_NOC = (function(){ try { return window.__GK_BG_NOC || undefined; } catch(e) { return undefined; } })();
/* Production bootstrap entrypoint.
 * Several parser-loaded campaign modules register DOMContentLoaded installers
 * (notably Sector 04) instead of wrapping immediately. Production must start
 * after those listeners have finished or they can capture a production wrapper
 * as their "original" and close a drawNM cycle. Queue boot one task after the
 * DOMContentLoaded dispatch so the entire legacy/campaign chain is final first.
 */
(function(){
  function boot(){
    try{
      if(document.querySelector('script[data-techops-production-bootstrap]'))return;
      var s=document.createElement('script');
      s.src='production_bootstrap.js';
      s.async=false;
      s.dataset.techopsProductionBootstrap='1';
      (document.head||document.documentElement).appendChild(s);
    }catch(e){window.__productionBootstrapWireError=String(e&&e.stack||e);}
  }
  function queueBoot(){try{(window.setTimeout||setTimeout)(boot,0);}catch(e){boot();}}
  try{
    if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',queueBoot,{once:true});
    else queueBoot();
  }catch(e){window.__productionBootstrapWireError=String(e&&e.stack||e);}
})();