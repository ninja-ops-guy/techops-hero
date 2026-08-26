window.TO_BG_NOC = (function(){ try { return window.__GK_BG_NOC || undefined; } catch(e) { return undefined; } })();
/* Static production bootstrap. Kept here because bg_noc.js is already a stable
   parser-loaded entrypoint immediately before the v7.34+ Night layers. */
(function(){
  try{
    if(document.querySelector('script[data-techops-production-bootstrap]'))return;
    var s=document.createElement('script');
    s.src='production_bootstrap.js';
    s.async=true;
    s.dataset.techopsProductionBootstrap='1';
    (document.head||document.documentElement).appendChild(s);
  }catch(e){window.__productionBootstrapWireError=String(e&&e.stack||e);}
})();
