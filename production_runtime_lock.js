/* TechOps Hero — production runtime lock v1.
 * Final browser authority for Night draw/step ownership.
 *
 * Feature modules still contain legacy self-maintenance timers for compatibility
 * with historical entrypoints. Production must not let those timers compete
 * with production_wrapper_guard. Once the async production bootstrap finishes,
 * this lock clears the known feature-maintenance timers and re-enforces the
 * single immutable Night compositor.
 */
(function(root){
  "use strict";
  if(!root||root.TechOpsProductionRuntimeLock)return;
  var VERSION=1,poll=null,locked=false,cleared=[];

  function stopTimer(owner,label){
    try{
      if(!owner||owner.timer==null)return false;
      if(root.clearInterval)root.clearInterval(owner.timer);
      owner.timer=null;
      cleared.push(label);
      return true;
    }catch(e){return false;}
  }

  function ready(){
    try{return !!(root.TechOpsProductionBootstrap&&root.TechOpsProductionBootstrap.ready&&root.TechOpsProductionBootstrap.ready());}
    catch(e){return false;}
  }

  function enforce(){
    if(!ready())return false;
    stopTimer(root.TechOpsGoodBoysGameplayLoop,"good_boys_gameplay_loop");
    stopTimer(root.TechOpsGoodBoysCanon,"good_boys_canon_runtime");
    stopTimer(root.TechOpsGoodDogsProduction,"good_dogs_production_runtime");
    try{
      var guard=root.TechOpsProductionWrapperGuard;
      if(!guard||typeof guard.enforce!=="function"){
        root.__productionRuntimeLockError="wrapper_guard_unavailable";
        return false;
      }
      if(!guard.enforce()){
        root.__productionRuntimeLockError="wrapper_guard_enforce_failed";
        return false;
      }
      var health=typeof guard.health==="function"?guard.health():null;
      if(health&&(!health.installed||!health.globalDrawAligned||!health.globalStepAligned)){
        root.__productionRuntimeLockError="wrapper_guard_unhealthy";
        return false;
      }
    }catch(e){
      root.__productionRuntimeLockError=String(e&&e.stack||e);
      return false;
    }
    locked=true;
    root.__productionFeatureWrapperTimersStopped=true;
    root.__productionRuntimeLockError=null;
    root.__productionRuntimeLockVersion=VERSION;
    return true;
  }

  function start(){
    if(enforce())return true;
    if(poll!=null)return false;
    var tries=0;
    poll=(root.setInterval||setInterval)(function(){
      tries++;
      if(enforce()||tries>400){
        try{(root.clearInterval||clearInterval)(poll);}catch(e){}
        poll=null;
        if(!locked&&!root.__productionRuntimeLockError)root.__productionRuntimeLockError="bootstrap_timeout";
      }
    },25);
    return false;
  }

  root.TechOpsProductionRuntimeLock={VERSION:VERSION,start:start,enforce:enforce,ready:ready,locked:function(){return locked;},cleared:function(){return cleared.slice();}};
  start();
})(typeof globalThis!=="undefined"?globalThis:this);
