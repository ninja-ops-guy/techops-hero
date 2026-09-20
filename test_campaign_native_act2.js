"use strict";
const assert = require("assert");

global.localStorage = {
  data: {},
  getItem(key) { return this.data[key] || null; },
  setItem(key, value) { this.data[key] = String(value); },
  removeItem(key) { delete this.data[key]; }
};

global.TechOpsCampaign = require("./campaign_act1.js");
global.TechOpsStory = require("./campaign_story.js");
global.TechOpsCampaignAct2 = require("./campaign_act2.js");
global.TechOpsCampaignVisuals = require("./campaign_visual_direction.js");
let lastDialog = null;
global.dlg = function (name, body, options) { lastDialog = { name, body, options }; global.S.inDialog = true; };
global.closeDlg = function () { global.S.inDialog = false; };
global.toast = function () {};
global.adjacent = function (a,b) { return Math.abs(a.x-b.x)+Math.abs(a.y-b.y) <= 1; };
global.interact = function () { return "base"; };
global.setupDay = function () { return true; };

function makeMap() { return Array.from({length:44},()=>Array.from({length:44},()=>0)); }
function choose(text) { const option = lastDialog.options.find(o=>o.t===text); assert.ok(option, `missing ${text} in ${lastDialog.name}`); option.f(); }
function load() { return global.TechOpsCampaign.load(global.localStorage); }

let campaign = global.TechOpsCampaign.freshState ? global.TechOpsCampaign.freshState() : global.TechOpsCampaign.load(global.localStorage);
for (const [ticket, owner] of [["shipping_cannot_print", "mike"], ["plating_workstation_down", "amit"], ["impossible_access_event", "mike"]]) global.TechOpsCampaign.assignTicket(campaign, ticket, owner);
global.TechOpsCampaign.completeStandup(campaign);
global.TechOpsCampaign.completeWorkstation(campaign, { redInTheMirrorHeard:true, feliciaVideoSeen:true });
global.TechOpsCampaign.recordGhostEvidence(campaign, { id:"badge_impossible_access", perspective:"firsthand", discoveredBy:"mike" });
global.TechOpsCampaign.enterSector04(campaign);
global.TechOpsCampaign.insightAccessGuard(campaign);
global.TechOpsCampaign.severAccessController(campaign);
global.TechOpsCampaign.transitionToTuesday(campaign);
global.TechOpsStory.syncAct1State(campaign);
global.TechOpsCampaign.save(campaign, global.localStorage);

global.S = { day:2, map:makeMap(), npcs:[], meta:{}, px:0, py:0, inDialog:false };
const native = require("./campaign_native_act2.js");
assert.strictEqual(native.ensureWorld(), true);
assert.ok(global.S.npcs.some(n=>n.campaignAct2 === "badge_cloner"));
assert.ok(global.S.npcs.some(n=>n.campaignAct2 === "felicia_daylight"));
assert.ok(global.S.npcs.some(n=>n.campaignAct2 === "morningstar_trace"));
assert.ok(global.S.npcs.some(n=>n.campaignAct2 === "rooftop_violin"));

native.badgeCloner();
assert.strictEqual(lastDialog.name, "SECURITY LAB // BADGE CLONER");
choose("Compare physical badge to audit");
assert.strictEqual(global.TechOpsCampaignAct2.snapshot(load()).badgeClonerVerified, true);

native.feliciaDaylight();
assert.strictEqual(lastDialog.name, "FELICIA // DAYLIGHT");
choose("Professional — ask about systems integration");
assert.strictEqual(global.TechOpsCampaignAct2.snapshot(load()).trustScore, 2);

native.morningstarTrace();
assert.strictEqual(lastDialog.name, "TRACE BAY // MORNINGSTAR");
choose("Verify telemetry signature");
assert.strictEqual(global.TechOpsCampaignAct2.snapshot(load()).morningstarSignatureFound, true);

native.rooftop();
assert.strictEqual(lastDialog.name, "ROOFTOP // SIGNAL");
choose("Observe signal timing");
assert.strictEqual(global.TechOpsCampaignAct2.snapshot(load()).rooftopViolinVerified, true);
assert.strictEqual(global.TechOpsCampaignAct2.snapshot(load()).violinistRevealEligible, true);
choose("Recognize Felicia");
assert.strictEqual(global.TechOpsCampaignAct2.snapshot(load()).violinistRevealed, true);
assert.ok(load().story.completedActs.includes("act_3"));

let currentVisualScene = null;
const originalShow = global.TechOpsCampaignVisuals.show;
global.TechOpsCampaignVisuals.show = function (scene) { currentVisualScene = scene; return originalShow(scene); };
native.feliciaDaylight();
assert.strictEqual(lastDialog.name, "TRUST IS EARNED");
let legacyRackPlays = 0;
global.v725 = { cines: ["racks"], play() { legacyRackPlays++; return true; } };
global.S.meta._v726racks = "trace";
choose("Investigate the unauthorized traffic together");
assert.strictEqual(legacyRackPlays, 0, "canonical Act IV cannot resurrect the legacy enemy/toolkit movie before evidence");
assert.strictEqual(currentVisualScene, "morningstar_trace", "Act IV investigation must retain the authored console stage");
assert.strictEqual(lastDialog.name, "TRUST IS EARNED // INVESTIGATE", "a stale legacy racks choice cannot skip the playable investigation");
delete global.S.meta._v726racks;
const beforeFailedSave = global.localStorage.getItem(global.TechOpsCampaign.SAVE_KEY);
const originalWrite = global.localStorage.setItem;
global.localStorage.setItem = function () { throw new Error("storage quota reached"); };
choose("Trace the source");
assert.strictEqual(lastDialog.name, "TRUST IS EARNED // REVIEW CURRENT STEP");
assert.strictEqual(global.localStorage.getItem(global.TechOpsCampaign.SAVE_KEY), beforeFailedSave, "failed write preserves the last durable step");
global.localStorage.setItem = originalWrite;
choose("Review saved investigation");
assert.strictEqual(lastDialog.name, "TRUST IS EARNED // INVESTIGATE", "failed write cannot display unsaved progress");
choose("Trace the source");
assert.strictEqual(lastDialog.name, "TRUST IS EARNED // OBSERVE");
for (const item of global.TechOpsCampaignAct2.TRUST_EVIDENCE) {
  choose(item.label);
  assert.strictEqual(lastDialog.name, "TRUST IS EARNED // FINDING");
  choose("Continue investigation");
}
choose("An outside actor controls Inspection");
assert.match(lastDialog.body, /does not establish an outside actor/);
choose("Continue investigation");
choose("The diagnostic mirror was never retired");
choose("Continue investigation");
choose("Preserve the comparison and retire the stale mirror");
choose("Recheck the traffic and live service");
choose("Continue investigation");
assert.strictEqual(lastDialog.name, "TRUST IS EARNED // REQUESTER VERIFY");
assert.strictEqual(load().story.facts.felicia_alliance, undefined, "technical success is not the human outcome");
choose("Have Inspection submit and confirm a real result");
choose("Continue investigation");
assert.strictEqual(lastDialog.name, "TRUST IS EARNED // REPORT");
assert.strictEqual(load().story.facts.felicia_alliance, undefined, "investigation alone cannot produce the alliance");
const beforeNotes = global.localStorage.getItem(global.TechOpsCampaign.SAVE_KEY);
choose("Review the field notes");
assert.strictEqual(lastDialog.name, "TRUST IS EARNED // FIELD NOTES");
assert.strictEqual(global.localStorage.getItem(global.TechOpsCampaign.SAVE_KEY), beforeNotes, "field-note review cannot author progress");
choose("Resume current step");
const reportAction = lastDialog.options.find(option => option.t === "Report the finding and share ownership").f;
reportAction();
const completedSave = global.localStorage.getItem(global.TechOpsCampaign.SAVE_KEY);
reportAction();
assert.strictEqual(global.localStorage.getItem(global.TechOpsCampaign.SAVE_KEY), completedSave, "queued double-tap cannot duplicate the saved report or its rewards");
assert.strictEqual(lastDialog.name, "TRUST IS EARNED // ALLIANCE");
assert.strictEqual(load().story.facts.felicia_alliance, true);
assert.ok(load().story.completedActs.includes("act_4"));

const visual = global.TechOpsCampaignVisuals.show("rooftop_violin");
assert.strictEqual(visual.id, "rooftop_violin");
assert.ok(visual.layers.includes("cv-city-far"));
assert.ok(visual.layers.includes("cv-city-near"));
assert.ok(visual.layers.includes("cv-rooftop-floor"));

console.log("Campaign native Act II gameplay: PASS");
