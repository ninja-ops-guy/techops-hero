/* TechOps Hero — Day 1 presentation/bootstrap compatibility entrypoint.
 * Browser: load the preserved visual implementation plus Story Bible v1.2
 * content gap passes. Node/tests: export the preserved implementation unchanged.
 */
(function(root){
  "use strict";
  if(typeof module==="object"&&module.exports){module.exports=require("./campaign_native_act1_visuals_impl.js");return;}
  if(!root||!root.document)return;
  function load(src,flag){
    if(root[flag])return false;root[flag]=true;
    var script=root.document.createElement("script");script.src=src;script.async=false;(root.document.head||root.document.documentElement).appendChild(script);return true;
  }
  if(!root.TechOpsCampaignNativeAct1Visuals)load("campaign_native_act1_visuals_impl.js","__techopsAct1VisualImplLoader");
  if(!root.TechOpsGoodBoysHandoffUIPatch)load("good_boys_handoff_ui_patch.js?v=20260901-handoff-ui-v1","__techopsGoodBoysHandoffUIPatchLoader");
  if(!root.TechOpsCampaignBibleGapPass)load("campaign_bible_gap_pass.js","__techopsBibleGapLoader");
  if(!root.TechOpsLateGameBootstrap)load("campaign_late_game_bootstrap.js","__techopsLateGameBootstrapLoader");
})(typeof globalThis!=="undefined"?globalThis:this);
