"use strict";
const assert=require("assert");
const fs=require("fs");
const flight=fs.readFileSync("good_boys_ship_flight.js","utf8");
const shim=fs.readFileSync("good_boys_ship_approach.js","utf8");
const deck=fs.readFileSync("good_boys_ship_deck_scene.js","utf8");
const hard=fs.readFileSync("good_boys_button_hard_fix.js","utf8");
const handoff=fs.readFileSync("good_boys_handoff_ui_patch.js","utf8");
const registry=fs.readFileSync("production_asset_registry.js","utf8");
const boot=fs.readFileSync("production_bootstrap.js","utf8");
for(const [name,source] of [["flight",flight],["shim",shim],["deck",deck],["hard",hard],["handoff",handoff],["registry",registry]]) assert.doesNotThrow(()=>new Function(source),`${name} must parse`);
assert.ok(flight.includes("GOOD_BOYS_SHIP_ARCADE"),"canonical flight must own the supplied atlas contract");
assert.ok(flight.includes("assets/good_boys/good_ship_arcade.atlas.png"),"canonical flight must load the supplied Good Ship atlas");
for(const key of ["ship_player","asteroid_1","asteroid_2","asteroid_3","asteroid_4","asteroid_5","prison_station","prison_dock","lead_1","lead_2","lead_3","lead_4"]){assert.ok(flight.includes(key),`canonical flight missing supplied frame ${key}`);}
assert.ok(flight.includes("AVOID ASTEROIDS")&&flight.includes("PRISON VECTOR"),"production flight must expose the authored avoidance objective and prison vector");
assert.ok(flight.includes("runApproachCutscene"),"production flight must hand off through supplied approach frames");
assert.ok(flight.includes("boarded-secret-ship")&&flight.includes("ship-flight-arrived-prison"),"production flight must own the real M2 -> M3 handoff");
assert.ok(flight.includes("softlockPrevented")&&flight.includes("asset-error"),"asset failure must be visible in diagnostics while preserving progression");
assert.ok(!flight.includes("pixelShip("),"canonical player ship must never fall back to procedural rectangles");
assert.ok(!flight.includes("assets/v742/cutscenes/orbital_approach.png"),"canonical flight must not render the old prison plate as gameplay authority");
assert.ok(!flight.includes("assets/v742/cutscenes/secret_ship_interior.png"),"canonical flight must not render the old ship interior as the player craft");
assert.ok(boot.includes('"good_boys_ship_flight.js"'),"production bootstrap must load the authoritative ship flight");
assert.ok(boot.includes("TechOpsGoodBoysShipFlight")&&boot.includes(".install()"),"production bootstrap must install the authoritative ship flight");
assert.ok(shim.includes("compatibility shim")&&shim.includes("TechOpsGoodBoysShipFlight"),"legacy approach module must delegate to the production flight");
assert.ok(!shim.includes('id===\"GD_CUT_02\"')&&!shim.includes("GoodDogsCutscenes.play"),"legacy approach module must not retain a second cinematic/flight interception point");

// Cockpit gameplay must use the extracted pilot art and require movement/proximity.
assert.ok(deck.includes("assets/v736/good_boys_ship/cockpit_pilot.jpg"),"cockpit must render the supplied pilot asset");
assert.ok(deck.includes("KATRIN_MANCHEZ"),"cockpit dogs must come from the canonical dog atlas");
assert.ok(deck.includes("nearPilot")&&deck.includes("playerX")&&deck.includes("pilotX"),"cockpit must model player-to-pilot proximity");
assert.ok(deck.includes("arrowleft")&&deck.includes("arrowright")&&deck.includes("pointerdown"),"cockpit must support keyboard and touch movement");
assert.ok(deck.includes('interaction:\"pilot\"'),"cockpit interaction must resolve against the pilot, not a generic station");
assert.ok(!deck.includes('grid-template-columns:1fr;gap:8px\";\n      controls.innerHTML=\'<button'),"cockpit must not regress to the giant one-button interaction layout");

// One terminal opening authority must auto-invoke movies and the canonical flight.
assert.ok(/VERSION=8/.test(hard),"terminal Good Boys title owner must be v8+");
assert.ok(hard.includes("TechOpsGoodBoysShipFlight")&&hard.includes("runCanonicalFlight"),"title opening must call the supplied-asset flight authority");
assert.ok(hard.includes('playMovie(\"GD_CUT_02\")')&&hard.includes('playMovie(\"GD_CUT_03\")'),"takeover and prison-approach movies must start automatically from authored flow");
assert.ok(hard.includes("GoodDogsCutscenes.play")&&hard.includes("automatic:true"),"cutscene invocation must be automatic; user gesture is recovery-only");
assert.ok(/VERSION=3/.test(handoff)&&handoff.includes("TechOpsGoodBoysButtonHardFix"),"capture handoff must delegate to the terminal opening owner");
assert.ok(!handoff.includes("repair.playOpening()"),"handoff capture must not retain a competing legacy opening path");
assert.ok(registry.includes("assets/v736/good_boys_ship/cockpit_pilot.jpg"),"production asset registry must preload the pilot asset");
assert.ok(registry.includes("assets/v736/good_boys_ship/canonical_dogs.webp"),"production asset registry must cover the extracted supplied dog source");
console.log("Good Boys canonical supplied-asset ship/cockpit opening: PASS");
