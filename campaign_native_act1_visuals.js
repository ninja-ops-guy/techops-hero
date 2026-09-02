/* TechOps Hero — Day 1 presentation/bootstrap compatibility entrypoint.
 * Browser: load the preserved visual implementation plus Story Bible v1.2
 * content gap passes. Node/tests: export the preserved implementation unchanged.
 */
(function(root){
  "use strict";
  if(typeof module==="object"&&module.exports){module.exports=require("./campaign_native_act1_visuals_impl.js");return;}
  if(!root||!root.document)return;
  function load(src,flag){if(root[flag])return false;root[flag]=true;var script=root.document.createElement("script");script.src=src;script.async=false;(root.document.head||root.document.documentElement).appendChild(script);return true;}
  if(!root.TechOpsCampaignNativeAct1Visuals)load("campaign_native_act1_visuals_impl.js","__techopsAct1VisualImplLoader");
  /* Reload the cutscene player when a cached pre-2.8 copy is present. v2.8 is
     the first iPhone authority that cannot silently auto-skip a missing frame. */
  if(!root.GoodDogsCutscenes||parseFloat(root.GoodDogsCutscenes.VERSION||0)<2.8)load("good_dogs_cutscenes_v2_2.js?v=20260902-ios-visible-v28","__techopsGoodDogsCutsceneV28Loader");
  if(!root.TechOpsGoodDogsSingleAtlasAuthority)load("good_dogs_single_atlas_authority.js?v=20260902-single-atlas-v1","__techopsGoodDogsSingleAtlasLoader");
  if(!root.TechOpsGoodBoysOpeningV4)load("good_boys_opening_sequence_v4.js?v=20260902-opening-v4","__techopsGoodBoysOpeningV4Loader");
  if(!root.TechOpsGoodBoysButtonHardFix||Number(root.TechOpsGoodBoysButtonHardFix.VERSION||0)<5)load("good_boys_button_hard_fix.js?v=20260902-hard-button-v5","__techopsGoodBoysButtonHardFixLoaderV5");
  if(!root.TechOpsGoodDogsMobileVisualPolish)load("good_dogs_mobile_visual_polish.js?v=20260901-mobile-polish-v1","__techopsGoodDogsMobileVisualPolishLoader");
  if(!root.TechOpsWorkstationClarityPatch)load("workstation_cinematic_clarity_patch.js?v=20260901-workstation-clarity-v1","__techopsWorkstationClarityPatchLoader");
  if(!root.TechOpsCampaignBibleGapPass)load("campaign_bible_gap_pass.js","__techopsBibleGapLoader");
  if(!root.TechOpsLateGameBootstrap)load("campaign_late_game_bootstrap.js","__techopsLateGameBootstrapLoader");
})(typeof globalThis!=="undefined"?globalThis:this);
