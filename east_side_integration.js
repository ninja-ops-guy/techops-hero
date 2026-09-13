/* TechOps Hero — EAST SIDE convergence integration v1. */
(function(root){
  'use strict';
  if(!root||root.TechOpsEastSideIntegration)return;
  var PNG=[
    'assets/eastside/east_side_actors.png',
    'assets/eastside/east_side_environment.png',
    'assets/eastside/east_side_porch_sequence.png',
    'assets/eastside/east_side_props_fx.png'
  ];
  var AUDIO=['assets/audio/eastside/east-side.mp3'];
  function uniquePush(list,value){if(Array.isArray(list)&&list.indexOf(value)<0)list.push(value);}
  function registerProductionAssets(){
    var reg=root.TechOpsProductionAssets;
    if(reg&&Array.isArray(reg.PNG_ASSETS))PNG.forEach(function(p){uniquePush(reg.PNG_ASSETS,p);});
    if(root.__productionAssetInventory&&Array.isArray(root.__productionAssetInventory.png))PNG.forEach(function(p){uniquePush(root.__productionAssetInventory.png,p);});
    root.__eastSideProductionAssets={png:PNG.slice(),audio:AUDIO.slice(),registered:!!reg};
    return root.__eastSideProductionAssets;
  }
  function bindGasFallback(){
    var api=root.TechOpsEastSide;if(!api||api.__gasPhaseFallback)return false;
    function attempt(){
      var s=api.snapshot&&api.snapshot();
      if(!s||s.gasChoice||s.phase!=='orbital'||!api.nearestInteractable||!api.chooseGas)return false;
      var near=api.nearestInteractable(s);if(!near||near.type!=='gas')return false;
      var enter=true;try{if(typeof root.confirm==='function')enter=!!root.confirm('Enter the gas-station memory? Cancel = walk past.');}catch(_){}
      api.chooseGas(enter);return true;
    }
    var baseStart=api.start;
    api.start=function(){var ok=baseStart.apply(api,arguments);if(!ok||!root.document)return ok;root.setTimeout(function(){
      var use=root.document.getElementById('es-use');if(use&&!use.__eastSideGasFallback){use.__eastSideGasFallback=true;use.addEventListener('pointerdown',function(){attempt();});}
    },0);return ok;};
    if(root.addEventListener)root.addEventListener('keydown',function(e){if((e.key==='e'||e.key==='E'||e.key===' ')&&api.isActive&&api.isActive())attempt();},true);
    api.__gasPhaseFallback=true;return true;
  }
  function install(){registerProductionAssets();return bindGasFallback();}
  root.TechOpsEastSideIntegration={VERSION:1,PNG:PNG,AUDIO:AUDIO,registerProductionAssets:registerProductionAssets,bindGasFallback:bindGasFallback,install:install};
  install();
})(typeof globalThis!=='undefined'?globalThis:this);
