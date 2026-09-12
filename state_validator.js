/* TechOps Hero — production state validator v3.
 * Keeps Good Boys mission invariants isolated while validating canonical Good
 * Dogs semantic writeback plus main-campaign MORNINGSTAR, Watchdog and endings.
 */
(function(root){
  "use strict";
  if(!root||root.TechOpsStateValidator)return;
  var VERSION=3,ENDINGS=["shutdown","control","open_network"];
  function validateCampaign(meta,runtime){
    var errors=[];meta=meta||null;runtime=runtime||null;
    if(!meta)return{valid:true,errors:errors,version:VERSION,skipped:true};
    var m=Number(meta.m);
    if(!Number.isFinite(m)||m<1||m>8)errors.push("Invalid Good Boys mission: "+meta.m);
    if(m>=5&&!meta.k)errors.push("Mission 5+ requires k=true");
    if(m>=7&&!meta.waldo)errors.push("Mission 7+ requires waldo=true");
    if(runtime&&Number(runtime.m)!==m)errors.push("DIVERGENCE: runtime="+runtime.m+", persisted="+meta.m);
    return{valid:errors.length===0,errors:errors,version:VERSION,mission:m,at:Date.now()};
  }
  function validateGoodDogs(state){
    var errors=[],meta=state&&state.meta||{},g=meta.goodDogs||{};
    function flag(k){return g[k]===true||meta[k]===true;}
    var kFreed=flag("k_freed"),waldoFreed=flag("waldo_freed"),warden=flag("warden_null_defeated"),returned=flag("crew_returned_to_earth"),done=flag("good_dogs_protocol_complete");
    if(kFreed&&!(flag("cell_118_reached")||flag("k_seen")))errors.push("Good Dogs: k_freed requires Cell 118 reach/identity encounter");
    if(waldoFreed&&!kFreed)errors.push("Good Dogs: waldo_freed requires K freed first");
    if(warden&&!waldoFreed)errors.push("Good Dogs: Warden defeat requires Waldo freed");
    if(done&&!(kFreed&&waldoFreed&&warden&&returned))errors.push("Good Dogs: completion missing rescue/return prerequisites");
    if(done&&!(flag("watchdog_k_available")&&flag("watchdog_waldo_available")&&flag("watchdog_good_dogs_available")))errors.push("Good Dogs: completion must unlock Watchdog participation");
    if(g.k_identity_status==="K"&&!kFreed)errors.push("Good Dogs: confirmed K identity requires K freed");
    if(g.waldo_relationship_k==="accepted"&&!waldoFreed)errors.push("Good Dogs: Waldo/K acceptance requires Waldo encounter completion");
    return{valid:errors.length===0,errors:errors,version:VERSION,at:Date.now()};
  }
  function validateStory(state){
    var errors=[],late=state&&state.lateGame||{},ms=late.morningstar||null,ch=late.chapters||null,story=state&&state.story||{},facts=story.facts||{};
    if(ms){var phase=Number(ms.phase);if(!Number.isFinite(phase)||phase<0||phase>5)errors.push("Invalid MORNINGSTAR phase: "+ms.phase);if(ms.completedDayTickets&&!Array.isArray(ms.completedDayTickets))errors.push("MORNINGSTAR completedDayTickets must be an array");if(ms.nightRecoveredItems&&!Array.isArray(ms.nightRecoveredItems))errors.push("MORNINGSTAR nightRecoveredItems must be an array");}
    if(ch){
      if(ch.ending&&ENDINGS.indexOf(ch.ending)<0)errors.push("Unknown late-game ending: "+ch.ending);
      if(ch.watchdogDefeated&&!facts.k_personhood_affirmed)errors.push("Watchdog completion requires K personhood affirmation");
      if(ch.watchdogDefeated&&!facts.duet_protocol_complete)errors.push("Watchdog completion requires Duet Protocol");
      if(ch.ending==="open_network"){
        if(!ms||Number(ms.phase)<5)errors.push("Open Network requires MORNINGSTAR phase 5");
        if(!facts.k_personhood_affirmed)errors.push("Open Network requires Ghost Fork recognition");
        if(!facts.watchdog_defeated)errors.push("Open Network requires Watchdog completion");
      }
      if(ch.campaignComplete&&!ch.ending&&!story.ending)errors.push("Campaign completion requires an ending");
    }
    if(facts.good_dogs_protocol_complete&&!(facts.k_freed&&facts.waldo_freed&&facts.warden_null_defeated&&facts.crew_returned_to_earth))errors.push("Story facts: Good Dogs completion missing canonical rescue facts");
    return{valid:errors.length===0,errors:errors,version:VERSION,at:Date.now()};
  }
  function validate(state,runtime){
    var campaign=validateCampaign(state&&state.meta&&state.meta._v736,runtime||null),goodDogs=validateGoodDogs(state||null),story=validateStory(state||null),errors=(campaign.errors||[]).concat(goodDogs.errors||[],story.errors||[]);
    return{valid:errors.length===0,errors:errors,version:VERSION,campaign:campaign,goodDogs:goodDogs,story:story,at:Date.now()};
  }
  function assertBeforeSave(state,runtime){var r=validate(state,runtime);if(!r.valid){root.__stateValidationFailure=r;try{console.error("[StateValidator] Save rejected",r.errors);}catch(_){}return false;}root.__lastStateValidation=r;return true;}
  root.TechOpsStateValidator={VERSION:VERSION,validate:validate,validateCampaign:validateCampaign,validateGoodDogs:validateGoodDogs,validateStory:validateStory,assertBeforeSave:assertBeforeSave};
})(typeof globalThis!=="undefined"?globalThis:this);
