"use strict";
const assert = require("assert");
const schema = require("./campaign_scene_schema.js");

const result = schema.validateScenes(schema.OPENING_SCENES);
assert.strictEqual(result.valid, true);
assert.ok(result.scenes >= 10, "canonical opening scene manifest should cover the full Day 1 -> Tuesday spine");

function clone(value) { return JSON.parse(JSON.stringify(value)); }
function expectFailure(mutator, pattern) {
  const scenes = clone(schema.OPENING_SCENES);
  mutator(scenes);
  assert.throws(() => schema.validateScenes(scenes), pattern);
}

expectFailure(scenes => scenes.push(clone(scenes[0])), /Duplicate scene id/);
expectFailure(scenes => { scenes[0].speaker = "UNKNOWN PERSON"; }, /Unknown speaker/);
expectFailure(scenes => { scenes[0].lines = ["X".repeat(schema.MAX_LINE_CHARS + 1)]; }, /Scene line overflow/);
expectFailure(scenes => { scenes[0].writes = []; }, /Missing state writes/);
expectFailure(scenes => { scenes[1].branches[0].to = "missing_scene"; }, /Unknown branch target/);
expectFailure(scenes => { delete scenes[2].next; delete scenes[2].branches; }, /Dead-end scene/);
expectFailure(scenes => { scenes[scenes.length - 1].next = "day1_standup"; }, /Terminal scene cannot branch/);

const ids = new Set(schema.OPENING_SCENES.map(scene => scene.id));
assert.ok(ids.has("day1_standup"));
assert.ok(ids.has("day1_workstation"));
assert.ok(ids.has("day1_felicia_video"));
assert.ok(ids.has("day1_impossible_access"));
assert.ok(ids.has("sector04_terminal"));
assert.ok(ids.has("tuesday_morning"));

const video = schema.OPENING_SCENES.find(scene => scene.id === "day1_felicia_video");
assert.ok(video.writes.includes("felicia_video_watched"));
assert.deepStrictEqual(video.branches.map(branch => branch.label), ["Finish video", "Skip video"]);
const clockIn = schema.OPENING_SCENES.find(scene => scene.id === "day1_clock_in");
assert.ok(clockIn.writes.includes("day_work_unlocked"));
const red = schema.OPENING_SCENES.find(scene => scene.id === "day1_music");
assert.ok(!red.writes.some(write => /orpheus/i.test(write)), "Red in the Mirror must not create ORPHEUS investigation state");

console.log("Campaign scene schema / Story Bible v1.2: PASS");