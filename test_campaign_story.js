"use strict";
const assert = require("assert");
const Story = require("./campaign_story.js");

assert.equal(Story.validateCanon(), true);
assert.deepEqual(Story.ORPHEUS_SIGNATURES, [
  "impossible_records",
  "unauthorized_corrections",
  "behavioral_prediction",
  "inhuman_optimization"
]);
assert.match(Story.K_MEMORY_RULE, /provenance/);
assert.match(Story.K_MEMORY_RULE, /present experience/);

const state = {};
assert.deepEqual(Story.eligibleActs(state), ["prologue"]);
Story.completeAct(state, "prologue");
assert(Story.eligibleActs(state).includes("act_1"));
assert.throws(() => Story.completeAct({}, "act_2"), /prerequisites/);
assert.throws(() => Story.chooseEnding(state, "shutdown"), /not been reached/);

[
  "act_1", "act_2", "act_3", "act_4", "act_5", "act_6",
  "interlude", "act_7", "act_8"
].forEach(id => Story.completeAct(state, id));

const ending = Story.chooseEnding(state, "open_network");
assert.equal(ending.command, "REVOKE ROOT");
assert.equal(ending.achievement, "NO SINGLE POINT OF FAILURE");
assert.throws(() => Story.chooseEnding(state, "control"), /already locked/);
Story.completeAct(state, "act_9");
Story.completeAct(state, "epilogue");
assert.equal(state.story.facts.campaign_complete, true);
assert.deepEqual(Story.CANON_LINES.final, [
  "EVERY TICKET IS A DUNGEON.",
  "EVERY SYSTEM IS A RELATIONSHIP.",
  "LEAVE IT BETTER THAN YOU FOUND IT."
]);

console.log("Complete campaign contract: PASS");
