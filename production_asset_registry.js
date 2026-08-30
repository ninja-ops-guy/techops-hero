/* TechOps Hero — complete production asset registry v6.
 * Makes every shipped visual asset discoverable by runtime, preloads physical
 * PNG assets, loads source payloads before atlas/reference manifests, and
 * fails closed when any required script/image/JSON asset cannot be loaded.
 */
(function(root){
  "use strict";
  if(!root||root.TechOpsProductionAssets)return;
  var VERSION=6;
  var SCRIPT_ASSETS=[
    "campaign_bg.js","campaign_asset_pipeline.js","campaign_native_act1_visuals.js",
    "charger_reference_v1.js","duo_kw.atlas.js","env_objects.atlas.js","env_overlays.atlas.js","env_struct.atlas.js","env_terrain.atlas.js",
    "interiors.js","interiors.atlas.js","k_action.atlas.js","k_full.atlas.js","k_studio.atlas.js","manchez_katrin_hits_p1.js","manchez_katrin_hits_p2.js","manchez_katrin_hits_p3.js","manchez_katrin_hits_p4.js",
    "mike_animation_manifest.js","night_walker_payload_p3.js","night_walker_payload_p4.js","night_walker_payload_p5.js","night_walker_payload_p7.js","night_walker.atlas.js","night_walker_reference_v1.js",
    "orbital_tiles.source.js","orbital_tiles.atlas.js","parts/shuttle_q001.js","shuttle.atlas.js","ui_lobby.js","ui_lobby.atlas.js",
    "waldo_b.atlas.js","waldo_full.atlas.js","waldo_ui.atlas.js","warden.atlas.js","weather_ov.atlas.js",
    "campaign_ui_payload_p2.js","campaign_ui_payload_p4.js","campaign_ui_payload_p5.js","campaign_ui_payload_p8.js","campaign_ui_payload_p9.js","campaign_ui.atlas.js"
  ];
  var SOURCE_PARTS=[
    "parts/campaign_bg2_bg_music_venue_p001.js","parts/campaign_bg2_bg_music_venue_p002.js","parts/campaign_bg2_bg_music_venue_p003.js",
    "parts/campaign_bg2_bg_waldo_garage_p001.js","parts/campaign_bg2_bg_waldo_garage_p002.js","parts/campaign_bg2_bg_waldo_garage_p003.js",
    "parts/campaign_bg2_bg_waldo_loft_p001.js","parts/campaign_bg2_bg_waldo_loft_p002.js",
    "parts/campaign_bg_bg_noc_twin_p001.js","parts/campaign_bg_bg_noc_twin_p002.js","parts/campaign_bg_bg_noc_twin_p003.js",
    "parts/campaign_bg_bg_orbital_eye_p001.js","parts/campaign_bg_bg_orbital_eye_p002.js","parts/campaign_bg_bg_orbital_eye_p003.js",
    "parts/campaign_bg_bg_orbital_gate_p001.js","parts/campaign_bg_bg_orbital_gate_p002.js","parts/campaign_bg_bg_orbital_gate_p003.js",
    "parts/campaign_bg_bg_suburb_rift_p001.js","parts/campaign_bg_bg_suburb_rift_p002.js"
  ];
  for(var i=1;i<=33;i++)SOURCE_PARTS.push("parts/campaign_ui_camp_ui_p"+String(i).padStart(3,"0")+".js");
  var PNG_ASSETS=[
    "assets/campaign/plating.line_background.png","assets/campaign/plating.line_stopped_display.png","assets/campaign/plating.operator.idle.png","assets/campaign/plating.workstation_cracked.png",
    "assets/campaign/sector04.access_guard.attack.png","assets/campaign/sector04.access_guard.idle.png","assets/campaign/sector04.access_guard.respawn.png","assets/campaign/sector04.access_guard.suppressed.png",
    "assets/campaign/sector04.identity_controller.active.png","assets/campaign/sector04.identity_controller.severed.png","assets/campaign/sector04.identity_controller.spark_fx.png","assets/campaign/sector04.locked_violin_door.png","assets/campaign/sector04.purple_damage.enemy.png","assets/campaign/sector04.purple_damage.fx.png","assets/campaign/sector04.terminal.symptoms.png","assets/campaign/sector04.violin_note.fx.png",
    "assets/campaign/shipping.clerk.idle.png","assets/campaign/shipping.dock_background.png","assets/campaign/shipping.label_printer.png","assets/campaign/shipping.printed_label_success.png",
    "assets/campaign/ui.standup.board.png","assets/campaign/ui.standup.owner_badge.png","assets/campaign/ui.standup.ticket_card.png",
    "assets/campaign/workstation.corporate_aircraft_panel.png","assets/campaign/workstation.felicia.video_frame.png","assets/campaign/workstation.orpheus.glitch_frame.png",
    "assets/v736/katrin_manchez_atlas.png","assets/v736/k_action_atlas.png","assets/v736/k_studio_atlas.png",
    "assets/v742/cutscenes/access_core.png","assets/v742/cutscenes/cell_118.png","assets/v742/cutscenes/cell_1984.png","assets/v742/cutscenes/crash_site.png",
    "assets/v742/cutscenes/earthfall.png","assets/v742/cutscenes/hidden_bay.png","assets/v742/cutscenes/orbital_approach.png","assets/v742/cutscenes/secret_ship_interior.png",
    "assets/v742/cutscenes/waldo_dialogue.png","assets/v742/cutscenes/waldo_garage.png","assets/v742/cutscenes/waldo_house.png","assets/v742/cutscenes/warden_shuttle_bay.png"
  ];
  var DOG_FRAMES=["kat_bark","kat_cheer","kat_crouch","kat_dizzy","kat_down","kat_down_heavy","kat_hack","kat_hack2","kat_hack_low","kat_idle0","kat_idle1","kat_idle2","kat_idle3","kat_idle4","kat_idle5","kat_idle6","kat_leap","kat_leap2","kat_leap_low","kat_look","kat_pounce","kat_pounce2","kat_pounce_low","kat_roll","kat_shield","kat_sleep","kat_stand","kat_strike","kat_wall_hit","man_bark","man_crouch","man_down","man_down_wall","man_hack","man_idle0","man_idle1","man_idle2","man_idle3","man_idle4","man_idle5","man_idle6","man_leap","man_look","man_pounce","man_roll","man_shield","man_strike","man_wall_down","man_wall_hit"];
  DOG_FRAMES.forEach(function(n){PNG_ASSETS.push("assets/v736/katrin_manchez/"+n+".png");});
  var JSON_ASSETS=["assets/campaign/production_source_manifest.json","assets/v736/katrin_manchez_manifest.json"];
  var images={},loadedScripts={},failedScripts={},failedImages={},failedJSON={},json={};
  function scriptAlready(src){try{return Array.prototype.some.call(root.document.scripts||[],function(s){return (s.getAttribute("src")||"").split("?")[0]===src;});}catch(e){return false;}}
  function loadScript(src){return new Promise(function(resolve){try{if(scriptAlready(src)){loadedScripts[src]=true;delete failedScripts[src];resolve(true);return;}var s=root.document.createElement("script");s.src=src;s.async=false;s.dataset.productionAsset=src;s.onload=function(){loadedScripts[src]=true;delete failedScripts[src];resolve(true);};s.onerror=function(){failedScripts[src]=true;resolve(false);};(root.document.head||root.document.documentElement).appendChild(s);}catch(e){failedScripts[src]=true;resolve(false);}});}
  function preloadImage(src){return new Promise(function(resolve){try{var im=new Image();images[src]=im;im.onload=function(){delete failedImages[src];resolve(true);};im.onerror=function(){failedImages[src]=true;resolve(false);};im.src=src;}catch(e){failedImages[src]=true;resolve(false);}});}
  function loadJSON(src){if(!root.fetch){failedJSON[src]=true;return Promise.resolve(false);}return root.fetch(src).then(function(r){if(!r.ok)throw new Error("HTTP "+r.status);return r.json();}).then(function(v){json[src]=v;delete failedJSON[src];return true;}).catch(function(){failedJSON[src]=true;return false;});}
  function failures(){return{scripts:Object.keys(failedScripts),images:Object.keys(failedImages),json:Object.keys(failedJSON)};}
  function flatFailures(){var f=failures();return f.scripts.concat(f.images,f.json);}
  function publish(){root.__productionAssetImages=images;root.__productionAssetJSON=json;root.__productionAssetInventory={scripts:SCRIPT_ASSETS.slice(),sourceParts:SOURCE_PARTS.slice(),png:PNG_ASSETS.slice(),json:JSON_ASSETS.slice()};root.__productionAssetFailures=failures();root.__allProductionAssetsIntegrated=flatFailures().length===0;return root.__allProductionAssetsIntegrated;}
  async function install(){if(root.__allProductionAssetsIntegrated)return true;for(var i=0;i<SOURCE_PARTS.length;i++)await loadScript(SOURCE_PARTS[i]);for(var j=0;j<SCRIPT_ASSETS.length;j++)await loadScript(SCRIPT_ASSETS[j]);await Promise.all(PNG_ASSETS.map(preloadImage));await Promise.all(JSON_ASSETS.map(loadJSON));return publish();}
  function status(){var f=failures();return{version:VERSION,integrated:!!root.__allProductionAssetsIntegrated,scripts:SCRIPT_ASSETS.length,sourceParts:SOURCE_PARTS.length,png:PNG_ASSETS.length,json:JSON_ASSETS.length,failures:f,failureCount:f.scripts.length+f.images.length+f.json.length};}
  root.TechOpsProductionAssets={VERSION:VERSION,SCRIPT_ASSETS:SCRIPT_ASSETS,SOURCE_PARTS:SOURCE_PARTS,PNG_ASSETS:PNG_ASSETS,JSON_ASSETS:JSON_ASSETS,install:install,status:status,images:images,json:json};
})(typeof globalThis!=="undefined"?globalThis:this);
