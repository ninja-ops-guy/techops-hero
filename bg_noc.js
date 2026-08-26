window.TO_BG_NOC = (function(){ try { return window.__GK_BG_NOC || undefined; } catch(e) { return undefined; } })();
/* Production bootstrap entrypoint.
 * bg_noc.js is parsed before v7.34-v7.37 and the campaign runtime stack, so
 * starting production immediately from here races later parser-owned wrappers.
 * Defer only until DOMContentLoaded: every classic script in index.html has then
 * executed, while we still start before the player can meaningfully interact.
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
  try{
    if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
    else boot();
  }catch(e){window.__productionBootstrapWireError=String(e&&e.stack||e);}
})();