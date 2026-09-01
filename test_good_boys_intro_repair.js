const assert = require("assert");
const fs = require("fs");
const source = fs.readFileSync("good_boys_intro_repair.js", "utf8");
new Function(source);

// The low-quality four-card preamble is retired. Good Boys opens on the
// source-master movies, SKIP exits the whole opening, then TAKE CONTROL enters gameplay.
assert.ok(source.includes('VERSION=7'), "direct cinematic intro must be v7");
assert.ok(!source.includes('SCENES=['), "legacy four-card intro must remain removed");
assert.ok(!source.includes('good-boys-story-cine.gbi-repaired'), "legacy slide composition CSS must remain removed");
assert.ok(source.includes('GoodDogsCutscenes.play("GD_CUT_01")'), "Good Boys must open with source-master GD_CUT_01");
assert.ok(source.includes('GoodDogsCutscenes.play("GD_CUT_02")'), "natural opening playback must continue into GD_CUT_02");
assert.ok(source.includes('if(first&&first.skipped)return first'), "SKIP on the first opening movie must skip the remaining opening movies");
assert.ok(source.includes('premise.id="good-boys-campaign-intro"'), "TAKE CONTROL premise must use the authored blocker contract");
assert.ok(source.includes('dataset.gbdBypass="1"'), "legacy director intro interception must be bypassed");
assert.ok(source.includes('dismissLegacy()'), "any stale legacy intro DOM must be removed before playback");
assert.ok(source.includes('e.stopImmediatePropagation()'), "launch click must not leak into the legacy director");
assert.ok(source.includes('start.click()'), "post-cutscene handoff must use canonical CLOCK IN state initialization");
assert.ok(source.includes('root.v736.start()'), "post-cutscene handoff must enter canonical Good Boys campaign");
assert.ok(source.includes('root.__gbiSkipBuiltinM1=true'), "duplicate legacy mission-1 cinematic must be suppressed");
assert.ok(source.includes('function verify(attempt,epoch)'), "campaign attachment must be verified against the active launch epoch");
assert.ok(source.includes('if(attempt<3)'), "campaign attachment retry must remain bounded");
assert.ok(source.includes('gbiRepairInstalled==="7"'), "launch capture listener must install idempotently");
assert.ok(source.includes('if(launching||attached())return false'), "campaign launch must remain single-flight");

console.log("Good Boys direct cinematic intro contract: PASS");
