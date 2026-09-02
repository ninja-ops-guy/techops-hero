/* TechOps Hero — production runtime lock v2.
 * Final browser authority for Night draw/step ownership.
 *
 * Production ownership is now event-driven first: production_bootstrap emits
 * techops:production-ready, then this lock parks legacy feature timers, enforces
 * the canonical Good Dogs actor contract and verifies the immutable compositor.
 * A bounded poll remains only as a watchdog for historical entrypoints.
 */
(function(root){
  "use strict";
  if(!root||root.TechOpsProductionRuntimeLock)return;
  var VERSION=2,poll=null,locked=false,cleared=[],readyEventSeen=false;

  function stopTimer(owner,label){
    try{
      if(!owner||owner.timer==null)return false;
      if(root.clearInterval)root.clearInterval(owner.timer);
      owner.timer=null;
      if(cleared.indexOf(label)<0)cleared.push(label);
      return true;
    }catch(e){return false;}
  }

  function ready(){
    try{return !!(root.TechOpsProductionBootstrap&&root.TechOpsProductionBootstrap.ready&&root.TechOpsProductionBootstrap.ready());}
    catch(e){return false;}
  }

  function enforceActorContract(){
    try{
      var actor=root.TechOpsGoodDogsActorContract;
      if(!actor||typeof actor.enforce!=="function"){
        root.__productionRuntimeLockError="good_dogs_actor_contract_unavailable";
        return false;
      }
      if(!actor.enforce()){
        root.__productionRuntimeLockError="good_dogs_actor_contract_failed";
        return false;
      }
      var h=typeof actor.health==="function"?actor.health():null;
      if(h&&(!h.atlasReady||h.atlas!=="KATRIN_MANCHEZ"||!h.legacyWrapperBlocked)){
        root.__productionRuntimeLockError="good_dogs_actor_contract_unhealthy";
        return false;
      }
      return true;
    }catch(e){
      root.__productionRuntimeLockError=String(e&&e.stack||e);
      return false;
    }
  }

  function enforce(){
    if(!ready())return false;
    stopTimer(root.TechOpsGoodBoysGameplayLoop,"good_boys_gameplay_loop");
    stopTimer(root.TechOpsGoodBoysCanon,"good_boys_canon_runtime");
    stopTimer(root.TechOpsGoodDogsProduction,"good_dogs_production_runtime");
    if(!enforceActorContract())return false;
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
    root.__productionRuntimeLockReadyEventSeen=readyEventSeen;
    return true;
  }

  function stopPoll(){if(poll==null)return;try{(root.clearInterval||clearInterval)(poll);}catch(e){}poll=null;}
  function startWatchdog(){
    if(poll!=null||locked)return false;
    var tries=0;
    poll=(root.setInterval||setInterval)(function(){
      tries++;
      if(enforce()||tries>200){
        stopPoll();
        if(!locked&&!root.__productionRuntimeLockError)root.__productionRuntimeLockError="bootstrap_timeout";
      }
    },50);
    return true;
  }
  function onReady(){readyEventSeen=true;if(enforce())stopPoll();}
  function start(){
    if(enforce())return true;
    try{if(root.addEventListener)root.addEventListener("techops:production-ready",onReady,{once:true});}catch(e){}
    startWatchdog();
    return false;
  }

  root.TechOpsProductionRuntimeLock={VERSION:VERSION,start:start,enforce:enforce,ready:ready,locked:function(){return locked;},cleared:function(){return cleared.slice();},enforceActorContract:enforceActorContract};
  start();
})(typeof globalThis!=="undefined"?globalThis:this);
