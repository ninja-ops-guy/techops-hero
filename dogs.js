window.TO_DOGS = (function(){ try { return window.__GK_DOGS || undefined; } catch(e) { return undefined; } })();
/* Production lexical bridge. game.js/night_hooks.js use top-level let/const, so
 * window properties are otherwise absent even though later classic scripts can
 * resolve the identifiers. Publish live getters for production modules. */
(function(root){
  function bridge(name,getter,setter){try{var d=Object.getOwnPropertyDescriptor(root,name);if(d&&!d.configurable)return;var spec={configurable:true,enumerable:false,get:getter};if(setter)spec.set=setter;Object.defineProperty(root,name,spec);}catch(e){}}
  bridge("S",function(){try{return typeof S!=="undefined"?S:null;}catch(e){return null;}},function(v){try{S=v;}catch(e){}});
  bridge("NM",function(){try{return typeof NM!=="undefined"?NM:null;}catch(e){return null;}},function(v){try{NM=v;}catch(e){}});
  bridge("ctx",function(){try{return typeof ctx!=="undefined"?ctx:null;}catch(e){return null;}});
  bridge("cv",function(){try{return typeof cv!=="undefined"?cv:null;}catch(e){return null;}});
  bridge("keys",function(){try{return typeof keys!=="undefined"?keys:null;}catch(e){return null;}});
  bridge("NM_DISTRICTS",function(){try{return typeof NM_DISTRICTS!=="undefined"?NM_DISTRICTS:null;}catch(e){return null;}});
  bridge("NM_KINDS",function(){try{return typeof NM_KINDS!=="undefined"?NM_KINDS:null;}catch(e){return null;}});
  bridge("NM_FLOOR",function(){try{return typeof NM_FLOOR!=="undefined"?NM_FLOOR:null;}catch(e){return null;}});
  bridge("NM_W",function(){try{return typeof NM_W!=="undefined"?NM_W:null;}catch(e){return null;}});
  try{root.__techopsPreProductionDrawNM=(typeof drawNM==="function"?drawNM:null);}catch(e){}
  try{root.__techopsPreProductionStepNM=(typeof stepNM==="function"?stepNM:null);}catch(e){}
  root.__techopsLexicalBridgeVersion=2;
})(window);
(function(){
  try {
    var existing=document.getElementById("good-boys-mobile-launch-guard");
    if (existing) existing.remove();
    var s=document.createElement("script");
    s.id="good-boys-mobile-launch-guard";
    s.src="good_boys_mobile_launch_guard.js?v=5";
    (document.head||document.documentElement).appendChild(s);

    var routerExisting=document.getElementById("production-mode-router");
    if (routerExisting) routerExisting.remove();
    var r=document.createElement("script");
    r.id="production-mode-router";
    r.src="production_mode_router.js?v=5";
    (document.head||document.documentElement).appendChild(r);

    var safetyExisting=document.getElementById("production-runtime-safety");
    if (safetyExisting) safetyExisting.remove();
    var q=document.createElement("script");
    q.id="production-runtime-safety";
    q.src="production_runtime_safety.js?v=1";
    (document.head||document.documentElement).appendChild(q);

    var guardExisting=document.getElementById("production-wrapper-guard");
    if (guardExisting) guardExisting.remove();
    var w=document.createElement("script");
    w.id="production-wrapper-guard";
    w.src="production_wrapper_guard.js?v=2";
    (document.head||document.documentElement).appendChild(w);
  } catch(e) { window.__goodBoysMobileGuardLoaderError=String(e&&e.stack||e); }
})();
