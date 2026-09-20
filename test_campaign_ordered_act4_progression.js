"use strict";

const assert = require("assert");
const fs = require("fs");
const vm = require("vm");
const Campaign = require("./campaign_act1.js");
const Story = require("./campaign_story.js");

global.TechOpsStory = Story;
const Act2 = require("./campaign_act2.js");

function memoryStorage() {
  const values = new Map();
  return {
    getItem(key) { return values.has(key) ? values.get(key) : null; },
    setItem(key, value) { values.set(key, String(value)); },
    removeItem(key) { values.delete(key); }
  };
}

function completeOpening(state) {
  for (const [ticket, owner] of [
    ["shipping_cannot_print", "mike"],
    ["plating_workstation_down", "amit"],
    ["impossible_access_event", "mike"]
  ]) Campaign.assignTicket(state, ticket, owner);
  Campaign.completeStandup(state);
  Campaign.completeWorkstation(state, { redInTheMirrorHeard: true, feliciaVideoSeen: true });
  Campaign.resolveTicket(state, "shipping_cannot_print", { technicalResolution: true, verification: "strong", humanOutcome: "restored" });
  Campaign.resolveTicket(state, "plating_workstation_down", { technicalResolution: true, verification: "strong", humanOutcome: "restored" });
  Campaign.recordGhostEvidence(state, { id: "badge_impossible_access", perspective: "firsthand", discoveredBy: "mike", completeness: "complete" });
  Campaign.resolveTicket(state, "impossible_access_event", { technicalResolution: true, verification: "strong", humanOutcome: "restored" });
  Campaign.enterSector04(state);
  assert.equal(Campaign.insightAccessGuard(state).success, true);
  Campaign.severAccessController(state);
  Campaign.transitionToTuesday(state);
  Story.syncAct1State(state);
}

// This route uses only public campaign actions. No story fact, act-completion,
// MORNINGSTAR phase, or Felicia unlock is seeded into the progression path.
const storage = memoryStorage();
let state = Campaign.createInitialState();
completeOpening(state);
assert.deepEqual(state.story.completedActs, ["prologue", "act_1"]);

Act2.beginGhostFrequency(state);
Act2.recordBadgeClonerEvidence(state, { physicalArtifact: true, auditContradiction: true, perspective: "firsthand" });
assert.equal(state.story.completedActs.includes("act_2"), false, "one evidence item cannot complete Ghost Frequency");
Act2.firstDaylightFeliciaConversation(state, { approach: "professional" });
assert.equal(state.story.completedActs.includes("act_2"), false, "contact without a verified MORNINGSTAR trace cannot complete Ghost Frequency");
Act2.recordMorningstarTrace(state, { component: "telemetry", source: "trace_bay_telemetry_bus", verified: true });
assert.ok(state.story.completedActs.includes("act_2"), "the natural Ghost Frequency evidence path completes Act II");
Act2.recordRooftopViolinEvidence(state, { signalObserved: true, corroborated: true, perspective: "firsthand" });
Act2.revealViolinist(state);
assert.deepEqual(state.story.completedActs.slice(0, 4), ["prologue", "act_1", "act_2", "act_3"]);

const lockedStorage = memoryStorage();
Campaign.save(state, lockedStorage);
let lockedHubDialogs = 0;
const lockedRoot = {
  console, Date, Math, JSON, Object, Array, String, Number, Boolean, RegExp,
  globalThis: null,
  localStorage: lockedStorage,
  S: null,
  TechOpsCampaign: Campaign,
  TechOpsStory: Story,
  setTimeout() { return 0; },
  toast() {},
  dlg() { lockedHubDialogs++; }
};
lockedRoot.globalThis = lockedRoot;
vm.runInContext(fs.readFileSync("morningstar_build.js", "utf8"), vm.createContext(lockedRoot), { filename: "morningstar_build.js" });
assert.equal(lockedRoot.TechOpsMORNINGSTARBuild.snapshot().eligible, false, "MORNINGSTAR stays hidden before Trust Is Earned");
assert.equal(lockedRoot.TechOpsMORNINGSTARBuild.openHub(), false, "the locked MORNINGSTAR hub cannot open directly");
assert.equal(lockedHubDialogs, 0);
assert.equal(lockedRoot.TechOpsMORNINGSTARBuild.onTicketResolved("hangar_allocation_dispute"), false, "locked day work cannot bank MORNINGSTAR progress");
assert.equal(lockedRoot.TechOpsMORNINGSTARBuild.onNightRecovery("airframe_recovered"), false, "locked Night recovery cannot bank MORNINGSTAR progress");
assert.deepEqual(lockedRoot.TechOpsMORNINGSTARBuild.snapshot().completedDayTickets, []);
assert.deepEqual(lockedRoot.TechOpsMORNINGSTARBuild.snapshot().nightRecoveredItems, []);

assert.equal(Story.transitionStatus(state, "act_4").unlocked, true);
assert.equal(Story.transitionStatus(state, "act_4").eligible, false, "Act IV cannot complete before its investigate/report mechanic");
assert.throws(() => Story.completeAct(state, "act_4"), /completion requirements/);
assert.equal(state.story.facts.felicia_alliance, undefined);

for (const approach of Act2.TRUST_APPROACHES) {
  const branch = Campaign.clone(state);
  Act2.beginTrustInvestigation(branch);
  Act2.recordTrustInvestigation(branch, { approach });
  Act2.TRUST_EVIDENCE.forEach(item => Act2.observeTrustEvidence(branch, item.id));
  Act2.evaluateTrustHypothesis(branch, "stale_mirror");
  Act2.applyTrustResponse(branch);
  Act2.verifyTrustResponse(branch, "technical");
  Act2.verifyTrustResponse(branch, "requester");
  Act2.completeTrustReport(branch, { reported: true, sharedOwnership: true });
  assert.ok(branch.story.completedActs.includes("act_4"), "Act IV remains completable through the authored " + approach + " response");
  assert.equal(branch.story.facts.felicia_alliance, true);
}

Act2.beginTrustInvestigation(state);
Act2.recordTrustInvestigation(state, { approach: "trace" });
Act2.TRUST_EVIDENCE.forEach(item => Act2.observeTrustEvidence(state, item.id));
Act2.evaluateTrustHypothesis(state, "stale_mirror");
Act2.applyTrustResponse(state);
Act2.verifyTrustResponse(state, "technical");
Act2.verifyTrustResponse(state, "requester");
assert.equal(state.story.facts.felicia_alliance, undefined, "investigation alone is not the alliance reward");
Campaign.save(state, storage);
state = Campaign.load(storage);
assert.equal(Act2.snapshot(state).trustIsEarned.stage, "report", "Act IV resumes at the report boundary after reload");
assert.equal(state.story.facts.felicia_alliance, undefined);

Act2.completeTrustReport(state, { reported: true, sharedOwnership: true });
assert.ok(state.story.completedActs.includes("act_4"));
assert.equal(state.story.facts.felicia_alliance, true);
assert.equal(state.story.facts.morningstar_hangar_revealed, true);
const trustAfterAct4 = Act2.snapshot(state).trustScore;
Act2.completeTrustReport(state, { reported: true, sharedOwnership: true });
assert.equal(Act2.snapshot(state).trustScore, trustAfterAct4, "replaying an Act IV report cannot farm Trust");
Campaign.save(state, storage);
state = Campaign.load(storage);
assert.equal(Act2.snapshot(state).trustIsEarned.completed, true, "Act IV completion survives reload");

// A stale choice left by the legacy racks scene cannot silently author the
// canonical Act IV investigation before the player starts that scene here.
assert.ok(!fs.readFileSync("campaign_native_act2.js", "utf8").includes("var inherited = trustApproach()"));

// A malicious fact-only shape still cannot jump over Act IV. This is an
// adversarial ordering assertion, separate from the unseeded play path above.
const forged = Campaign.clone(state);
forged.story.completedActs = forged.story.completedActs.filter(id => id !== "act_4");
assert.throws(() => Story.completeAct(forged, "act_5"), /predecessor/);

const runtimeRoot = {
  console, Date, Math, JSON, Object, Array, String, Number, Boolean, RegExp,
  globalThis: null,
  localStorage: storage,
  S: null,
  TechOpsCampaign: Campaign,
  TechOpsCampaignAct2: Act2,
  TechOpsStory: Story,
  setInterval() { return 0; },
  clearInterval() {},
  setTimeout(fn) { if (fn) fn(); return 0; },
  clearTimeout() {},
  toast() {}
};
runtimeRoot.globalThis = runtimeRoot;
vm.runInContext(fs.readFileSync("morningstar_build.js", "utf8"), vm.createContext(runtimeRoot), { filename: "morningstar_build.js" });
const Morningstar = runtimeRoot.TechOpsMORNINGSTARBuild;
assert.equal(Morningstar.snapshot().eligible, true, "MORNINGSTAR is exposed only after the Act IV alliance");

for (let phase = 0; phase < 4; phase++) {
  const definition = Morningstar.PHASES[phase];
  definition.dayTickets.forEach(id => Morningstar.onTicketResolved(id));
  assert.equal(Morningstar.getCurrentPhase(), phase, "night recovery remains required for phase " + phase);
  Morningstar.onNightRecovery(definition.nightRecovery);
  assert.equal(Morningstar.getCurrentPhase(), phase + 1);
}

state = Campaign.load(storage);
assert.ok(state.story.completedActs.includes("act_5"), "the integrated MORNINGSTAR phase completes Act V");
assert.equal(state.story.facts.morningstar_airborne, true);
assert.equal(state.story.facts.mike_model_discovered, true);
assert.equal(Story.transitionStatus(state, "act_6").unlocked, true);

Act2.completeDuetProtocol(state);
Campaign.save(state, storage);
state = Campaign.load(storage);
assert.deepEqual(state.story.completedActs.slice(0, 7), ["prologue", "act_1", "act_2", "act_3", "act_4", "act_5", "act_6"]);
assert.equal(state.story.facts.duet_protocol_complete, true);
assert.equal(state.story.facts.felicia_playable, true);
assert.equal(Act2.snapshot(state).feliciaFreeplayUnlocked, true);

console.log("Ordered natural Act I -> Act VI progression with Act IV reload: PASS");
