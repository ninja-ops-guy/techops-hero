/* TechOps Hero — production runtime bootstrap v4.
 * Loads the complete asset registry first, then production authorities, only
 * after parser-loaded v7.36 + v7.37 gameplay wrappers are installed.
 */
(function(root){
  "use strict";
  if(!root||root.TechOpsProductionBootstrap)return;
  var VERSION=4,started=false,done=false;
  var FILES=[
    "production_asset_registry.js",
    "night_production_assets.js",
    "good_boys_campaign_assets.js",
    "good_dogs_production_runtime.js",
    "good_boys_reference_mechanics.js",
    "good_boys_canon_runtime.js",
    "good_boys_gameplay_loop.js",
    "good_boys_mobile_launch_guard.js",
    "production_runtime_safety.js",
    "production_wrapper_guard.js",
    "production_mode_router.js",
    "production_presentation_guard.js"
  ];
  function has(src){try{return !!(root.document&&root.document.querySelector('script[data-production-bootstrap="'+src+'"]'));}catch(e){return false;}}
  function load(src){return new Promise(function(resolve){try{if(!root.document||has(src)){resolve(true);return;}var s=root.document.createElement("script");s.src=src;s.async=false;s.dataset.productionBootstrap=src;s.onload=function(){resolve(true);};s.onerror=function(){root.__productionBootstrapError=src;resolve(false);};(root.document.head||root.document.documentElement).appendChild(s);}catch(e){root.__productionBootstrapError=String(e&&e.stack||e);resolve(false);}});}
  async function start(){
    if(started)return;started=true;
    var tries=0;
    while(!(root.v736&&typeof root.v736.start==="function"&&root.v737)&&tries++<400)await new Promise(function(r){(root.setTimeout||setTimeout)(r,10);});
    root.__productionParserStackReady=!!(root.v736&&root.v737);
    for(var i=0;i<FILES.length;i++){
      await load(FILES[i]);
      if(FILES[i]==="production_asset_registry.js")try{if(root.TechOpsProductionAssets)await root.TechOpsProductionAssets.install();}catch(e){root.__productionAssetInstallError=String(e&&e.stack||e);}
    }
    try{if(root.TechOpsNightProductionAssets)await root.TechOpsNightProductionAssets.install();}catch(e){}
    try{if(root.TechOpsGoodBoysCampaignAssets){root.TechOpsGoodBoysCampaignAssets.aliasBackgrounds();root.TechOpsGoodBoysCampaignAssets.installDistricts();}}catch(e){}
    try{if(root.TechOpsGoodBoysCanon)root.TechOpsGoodBoysCanon.tick();}catch(e){}
    try{if(root.TechOpsGoodBoysGameplayLoop)root.TechOpsGoodBoysGameplayLoop.tick();}catch(e){}
    try{if(root.TechOpsProductionWrapperGuard)root.TechOpsProductionWrapperGuard.enforce();}catch(e){}
    try{if(root.TechOpsProductionPresentationGuard)root.TechOpsProductionPresentationGuard.clean();}catch(e){}
    done=true;root.__productionBootstrapReady=true;
  }
  root.TechOpsProductionBootstrap={VERSION:VERSION,FILES:FILES,start:start,ready:function(){return done;}};
  start();
})(typeof globalThis!=="undefined"?globalThis:this);
