const assert = require("assert");
const fs = require("fs");
const source = fs.readFileSync("good_boys_intro_repair.js", "utf8");
new Function(source);

assert.ok(source.includes('VERSION=9'), "direct cinematic intro must be v9");
assert.ok(!source.includes('SCENES=['), "legacy four-card intro must remain removed");
assert.ok(source.includes('GoodDogsCutscenes.play("GD_CUT_01"'), "opening must start with GD_CUT_01");
assert.ok(source.includes('showShipInterlude()'), "playable ship interlude must exist between opening clips");
assert.ok(source.indexOf('GoodDogsCutscenes.play("GD_CUT_01"') < source.indexOf('showShipInterlude()'), "clip 1 must precede ship gameplay");
assert.ok(source.indexOf('showShipInterlude()') < source.indexOf('GoodDogsCutscenes.play("GD_CUT_02"'), "ship gameplay must precede clip 2");
assert.ok(source.includes('good-boys-ship-interlude'), "ship gameplay overlay contract must exist");
assert.ok(source.includes('APPROACH THE CREWMAN · INTERACT'), "ship gameplay objective must be explicit");
assert.ok(source.includes('data-interact'), "ship gameplay requires an interaction action");
assert.ok(source.includes('if(first&&first.skipped)return first'), "skipping clip 1 must still exit the authored opening chain");
assert.ok(source.includes('premise.id="good-boys-campaign-intro"'), "single TAKE CONTROL premise must remain");
assert.ok(source.includes('dataset.gbdBypass="1"'), "legacy director intro interception must be bypassed");
assert.ok(source.includes('FOLLOW\\s+THE\\s+TRAIL'), "obsolete FOLLOW THE TRAIL CTA must have a rescue/retirement guard");
assert.ok(source.includes('legacy.remove()'), "obsolete director overlay must be removed when detected");
assert.ok(source.includes('e.stopImmediatePropagation()'), "launch must not leak into the legacy director");
assert.ok(source.includes('start.click()'), "handoff must use canonical CLOCK IN initialization");
assert.ok(source.includes('root.v736.start({mission:1})'), "initial campaign start must pass explicit mission 1");
assert.ok(source.includes('root.__gbiSkipBuiltinM1=true'), "duplicate legacy mission-1 cinematic must be suppressed");
assert.ok(source.includes('gbiRepairInstalled==="9"'), "launch capture listener must install idempotently");
assert.ok(source.includes('if(launching||attached())return false'), "campaign launch must remain single-flight");

console.log("Good Boys clip1 -> gameplay -> clip2 intro contract: PASS");
