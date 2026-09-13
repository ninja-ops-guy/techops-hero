#!/usr/bin/env node
"use strict";
const { spawnSync } = require("child_process");

const tests = [
  "test_campaign_act1.js",
  "test_campaign_act2.js",
  "test_campaign_act2_reload_gates.js",
  "test_campaign_native_act2.js",
  "test_campaign_native_act1_visuals.js",
  "test_workstation_concept_retirement.js",
  "test_cinematic_systems.js",
  "test_art_handoff.js",
  "test_crash_playback_budget.js",
  "test_good_dogs_route_contract.js",
  "test_good_dogs_handoff_probe.mjs",
  "test_good_dogs_coop.js",
  "test_good_dogs_state_integrity.js",
  "test_campaign_world_visuals.js",
  "test_campaign_late_game_contracts.js",
  "test_good_boys_canon_runtime.js",
  "test_good_boys_combat_contract.js",
  "test_good_boys_world_isolation.js",
  "test_good_boys_completion_authority.js",
  "test_runtime_autofix.mjs",
  "test_good_boys_compositor_ownership.js",
  "test_good_boys_ui_ownership.js",
  "test_good_boys_mobile_launch_guard.js",
  "test_good_boys_ship_approach.js",
  "test_good_boys_ship_flight.js",
  "test_good_dogs_bible_contract.js",
  "test_good_boys_access_core_sequence.js",
  "test_good_boys_ship_deck_mapping.js",
  "test_production_mode_router.js",
  "test_production_runtime_safety.js",
  "test_production_compositor.js",
  "test_production_runtime_lock.js",
  "test_mobile_production_tester.js",
  "test_production_performance_budget.js",
  "test_production_asset_registry.js",
  "test_good_dogs_3d.mjs",
  "test_mike_animation_manifest.js",
  "test_runtime_arcade.js",
  "test_campaign_visual_assets.js",
  "test_campaign_assets.js",
  "test_campaign_asset_pipeline.js",
  "test_campaign_runtime_assets.js",
  "test_campaign_story.js",
  "test_campaign_scene_schema.js",
  "test_campaign_runtime.js",
  "test_campaign_native_act1.js",
  "test_campaign_casebook.js",
  "test_campaign_act1_investigations.js",
  "test_campaign_investigation_integrity.js",
  "test_campaign_workday_followups.js",
  "test_campaign_workday_followups_ui.js",
  "test_campaign_day1_runtime_gate.js",
  "test_campaign_opening_acceptance.js",
  "test_campaign_sector04.js",
  "test_campaign_sector04_runtime.js",
  "test_campaign_save_reload.js",
  "test_campaign_browser_entrypoint.js",
  "test_static_entrypoint_integrity.js",
  "test_v736_runtime_assets.js",
  "test_night_runtime_assets.js",
  "test_night_directional_combat.js",
  "test_night_directional_physics.js",
  "test_night_directional_integration.js",
  "test_night_movement_combos.js",
  "test_visual_combat_assets.js",
  "test_night_combat.js",
  "test_runtime_combat_audio.js",
  "test_quality_integration.js",
  "test_production_gameplay_experience.js",
  "test_orbital_scene_staging.js",
  "test_night_lifecycle.js",
  "test_night_mobile_visual_contract.js",
  "test_gameplay_recording_cohesion.js",
  "test_recording_world_cohesion.js",
  "test_ui_coop_contract.js"
];

let failed = 0;
console.log(`TechOps Hero production gate: ${tests.length} suites`);
for (const file of tests) {
  const r = spawnSync(process.execPath, [file], { stdio: "inherit", cwd: process.cwd() });
  if (r.status !== 0) {
    failed++;
    console.error(`\nFAIL: ${file}`);
  }
}

const quarantine = spawnSync(process.execPath, ["-e", `
global.window=global;
require('./mike_actions.atlas.js');
require('./mike_actions.js');
const manifest=require('./mike_animation_manifest.js');
if(!global.MIKE_ACTIONS||Object.keys(global.MIKE_ACTIONS.frames||{}).length!==182)throw new Error('MIKE_ACTIONS metadata contract changed');
if(global.MIKE_ACTIONS.src)throw new Error('MIKE_ACTIONS gained a source: classify/approve semantics before enabling it');
if(global.TO_MIKE_ACTIONS||global.__GK_MIKE_ACTIONS)throw new Error('Mike action payload restored: visually classify f000-f181 before enabling it');
if(manifest.actionAtlasReady(global))throw new Error('Unclassified Mike action atlas must not be render-ready');
if(Object.keys(manifest.ACTION_ATLAS.approvedStates).length)throw new Error('Unreviewed Mike action frames must remain quarantined');
console.log('Mike action atlas quarantine: PASS');
`], { stdio: "inherit", cwd: process.cwd() });
if (quarantine.status !== 0) failed++;

if (failed) {
  console.error(`\nPRODUCTION GATE: FAIL (${failed} failing group${failed===1?'':'s'})`);
  process.exit(1);
}
console.log("\nPRODUCTION GATE: PASS");
