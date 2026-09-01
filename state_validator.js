/* TechOps Hero — production state validator v1.
 * Focused campaign invariants. Runtime comparison is optional so normal saves
 * remain valid while Night mode is not attached.
 */
(function(root){
  "use strict";
  if(!root||root.TechOpsStateValidator)return;
  var VERSION=1;
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
  function validate(state,runtime){var meta=state&&state.meta&&state.meta._v736;return validateCampaign(meta,runtime||null);}
  function assertBeforeSave(state,runtime){var r=validate(state,runtime);if(!r.valid){root.__stateValidationFailure=r;try{console.error("[StateValidator] Save rejected",r.errors);}catch(_){}return false;}root.__lastStateValidation=r;return true;}
  root.TechOpsStateValidator={VERSION:VERSION,validate:validate,validateCampaign:validateCampaign,assertBeforeSave:assertBeforeSave};
})(typeof globalThis!=="undefined"?globalThis:this);
