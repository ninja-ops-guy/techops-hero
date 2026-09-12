/* TechOps Hero — Good Boys ship approach compatibility shim v2.
 * The canonical M2 -> M3 flight now lives in good_boys_ship_flight.js. This file
 * remains parser-loaded for save/startup compatibility only; it must never wrap
 * GoodDogsCutscenes or create a second ship-flight authority.
 */
(function(root){
  "use strict";
  if(!root||root.TechOpsGoodBoysShipApproach)return;
  var VERSION=2;
  function flight(){return root.TechOpsGoodBoysShipFlight||null;}
  function runFlight(done){
    var f=flight();
    if(!f||typeof f.launch!=="function"){
      root.__goodBoysShipApproachCompatibilityError="canonical TechOpsGoodBoysShipFlight unavailable";
      return Promise.resolve({completed:false,missingCanonicalFlight:true});
    }
    return new Promise(function(resolve){
      var started=f.launch(function(){try{if(typeof done==="function")done();}finally{resolve({completed:true,delegated:true});}});
      if(started===false)resolve({completed:false,busy:true,delegated:true});
    });
  }
  function install(){
    root.__goodBoysShipApproachCompatibilityShim=true;
    return !!flight();
  }
  root.TechOpsGoodBoysShipApproach={VERSION:VERSION,compatibilityOnly:true,install:install,runFlight:runFlight,runApproachCutscene:function(done){var f=flight();if(!f){if(typeof done==="function")done();return false;}return runFlight(done);},finish:function(){return false;},active:function(){var f=flight();return !!(f&&typeof f.active==="function"&&f.active());}};
  install();
})(typeof globalThis!=="undefined"?globalThis:this);
