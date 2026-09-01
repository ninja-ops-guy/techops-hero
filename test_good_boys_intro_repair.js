const assert = require("assert");
const fs = require("fs");
const source = fs.readFileSync("good_boys_intro_repair.js", "utf8");
new Function(source);

// The low-quality four-card preamble is retired. Good Boys opens on the
// source-master movie and only then enters the canonical campaign.
assert.ok(source.includes('VERSION=5'), "direct cinematic intro must be v5");
assert.ok(!source.includes('SCENES=['), "legacy four-card intro must remain removed");
assert.ok(!source.includes('good-boys-story-cine.gbi-repaired'), "legacy slide composition CSS must remain removed");
assert.ok(source.includes('GoodDogsCutscenes.play("GD_CUT_01")'), "Good Boys must open with source-master GD_CUT_01");
assert.ok(source.includes('dataset.gbdBypass="1"'), "legacy director intro interception must be bypassed");
assert.ok(source.includes('dismissLegacy()'), "any stale legacy intro DOM must be removed before playback");
assert.ok(source.includes('e.stopImmediatePropagation()'), "launch click must not leak into the legacy director");
assert.ok(source.includes('start.click()'), "post-cutscene handoff must use canonical CLOCK IN state initialization");
assert.ok(source.includes('root.v736.start()'), "post-cutscene handoff must enter canonical Good Boys campaign");
assert.ok(source.includes('root.__gbiSkipBuiltinM1=true'), "duplicate legacy mission-1 cinematic must be suppressed");
assert.ok(source.includes('function verify(attempt)'), "campaign attachment must be verified after the movie");
assert.ok(source.includes('if(attempt<2)'), "campaign attachment retry must remain bounded");

console.log("Good Boys direct cinematic intro contract: PASS");
