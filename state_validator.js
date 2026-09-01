/* TechOps Hero — production state validator v2.
 * Keeps Good Boys mission invariants isolated while adding structural validation
 * for main-campaign MORNINGSTAR, Watchdog and ending state.
 */
(function(root){
  "use strict";
  if(!root||root.TechOpsStateValidator)return;
  var VERSION=2,ENDINGS=["shutdown","control","open_network"];
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
    return{valid:errors.length===0,errors:errors,version:VERSION,at:Date.now()};
  }
  function validate(state,runtime){
    var campaign=validateCampaign(state&&state.meta&&state.meta._v736,runtime||null),story=validateStory(state||null),errors=(campaign.errors||[]).concat(story.errors||[]);
    return{valid:errors.length===0,errors:errors,version:VERSION,campaign:campaign,story:story,at:Date.now()};
  }
  function assertBeforeSave(state,runtime){var r=validate(state,runtime);if(!r.valid){root.__stateValidationFailure=r;try{console.error("[StateValidator] Save rejected",r.errors);}catch(_){}return false;}root.__lastStateValidation=r;return true;}
  root.TechOpsStateValidator={VERSION:VERSION,validate:validate,validateCampaign:validateCampaign,validateStory:validateStory,assertBeforeSave:assertBeforeSave};
})(typeof globalThis!=="undefined"?globalThis:this);
