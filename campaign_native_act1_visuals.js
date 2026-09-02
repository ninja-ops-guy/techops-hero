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
  if(!root.GoodDogsCutscenes||parseFloat(root.GoodDogsCutscenes.VERSION||0)<2.9)load("good_dogs_cutscenes_v2_2.js?v=20260902-explicit-v29","__techopsGoodDogsCutsceneV29Loader");
  if(!root.TechOpsGoodDogsSingleAtlasAuthority||Number(root.TechOpsGoodDogsSingleAtlasAuthority.VERSION||0)<2)load("good_dogs_single_atlas_authority.js?v=20260902-single-atlas-v2","__techopsGoodDogsSingleAtlasLoaderV2");
  if(!root.GOOD_BOYS_SHIP_DECK_USER_ASSET)load("good_boys_ship_deck_user_asset.js?v=20260902-user-deck-v1","__techopsGoodBoysUserDeckAssetLoaderV1");
  if(!root.TechOpsGoodBoysOpeningV4)load("good_boys_opening_sequence_v4.js?v=20260902-opening-v4","__techopsGoodBoysOpeningV4Loader");
  if(!root.TechOpsGoodBoysShipDeckScene)load("good_boys_ship_deck_scene.js?v=20260902-user-deck-scene-v1","__techopsGoodBoysShipDeckSceneLoaderV1");
  if(!root.TechOpsGoodBoysButtonHardFix||Number(root.TechOpsGoodBoysButtonHardFix.VERSION||0)<6)load("good_boys_button_hard_fix.js?v=20260902-hard-button-v6","__techopsGoodBoysButtonHardFixLoaderV6");
  if(!root.TechOpsGoodDogsMobileVisualPolish)load("good_dogs_mobile_visual_polish.js?v=20260901-mobile-polish-v1","__techopsGoodDogsMobileVisualPolishLoader");
  if(!root.TechOpsWorkstationClarityPatch)load("workstation_cinematic_clarity_patch.js?v=20260901-workstation-clarity-v1","__techopsWorkstationClarityPatchLoader");
  if(!root.TechOpsCampaignBibleGapPass)load("campaign_bible_gap_pass.js","__techopsBibleGapLoader");
  if(!root.TechOpsLateGameBootstrap)load("campaign_late_game_bootstrap.js","__techopsLateGameBootstrapLoader");
})(typeof globalThis!=="undefined"?globalThis:this);
