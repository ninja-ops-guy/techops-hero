"use strict";
const assert = require("assert");
const fs = require("fs");
const Story = require("./campaign_story.js");
const Campaign = require("./campaign_act1.js");

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

// The vertical-slice state imports into the full story without duplicating state ownership.
const act1 = Campaign.createInitialState();
Campaign.assignTicket(act1, "shipping_cannot_print", "mike");
Campaign.assignTicket(act1, "plating_workstation_down", "mike");
Campaign.assignTicket(act1, "impossible_access_event", "mike");
Campaign.completeStandup(act1);
Campaign.completeWorkstation(act1, { redInTheMirrorHeard: true, feliciaVideoSeen: true });
Campaign.recordGhostEvidence(act1, { id: "badge_impossible_access", perspective: "firsthand" });
Campaign.enterSector04(act1);
Campaign.insightAccessGuard(act1);
Campaign.severAccessController(act1);
Campaign.transitionToTuesday(act1);
Story.syncAct1State(act1);
assert.deepEqual(act1.story.completedActs, ["prologue", "act_1"]);
assert(Story.eligibleActs(act1).includes("act_2"));

// Story Bible v1.2 gap pass: the three authored opening tickets remain the canonical contract.
assert.deepEqual(Campaign.TICKETS, [
  "shipping_cannot_print",
  "plating_workstation_down",
  "impossible_access_event"
]);
const gapSource = fs.readFileSync("campaign_bible_gap_pass.js", "utf8");
const visualBootstrap = fs.readFileSync("campaign_native_act1_visuals.js", "utf8");
for (const id of Campaign.TICKETS) assert(gapSource.includes(id), `Bible gap pass must guarantee ${id}`);
assert(gapSource.includes("campaign_shipping") && gapSource.includes("campaign_plating") && gapSource.includes("campaign_access"), "Day 1 guarantee must use authored world contacts");
assert(!/\.tickets\.push\s*\(/.test(gapSource), "Bible pass must not duplicate canonical contacts into the procedural ticket queue");

// Red in the Mirror is real diegetic playback on the existing SoundCloud widget, with video duck/resume.
assert.match(gapSource, /Red in the Mirror/);
assert.match(gapSource, /getSounds/);
assert.match(gapSource, /setVolume\(5\)/);
assert.match(gapSource, /setVolume\(restoreVolume\|\|18\)/);
assert.match(gapSource, /ENGINEERING THE HUMAN CONNECTION/);
assert.match(gapSource, /ordinary_listening/);

// Ghost Fork recognition uses the existing v7.25 scene registry and preserves K's personhood rule.
assert.match(gapSource, /defs\(\)/);
assert.match(gapSource, /defs&&defs\.gk6/);
assert(gapSource.includes("Red is me. You're the mirror."));
assert(gapSource.includes("You're not me."));
assert(gapSource.includes("Never was."));
assert.match(gapSource, /mike_meets_k/);
assert.match(gapSource, /k_personhood_affirmed/);

// Browser bootstrap must load both the preserved presentation implementation and the gap pass.
assert.match(visualBootstrap, /campaign_native_act1_visuals_impl\.js/);
assert.match(visualBootstrap, /campaign_bible_gap_pass\.js/);

console.log("Complete campaign contract: PASS");
