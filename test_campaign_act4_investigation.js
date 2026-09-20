"use strict";

const assert = require("assert");
const Campaign = require("./campaign_act1.js");
const Story = require("./campaign_story.js");
global.TechOpsStory = Story;
const Act2 = require("./campaign_act2.js");

function ready() {
  const state = Campaign.createInitialState();
  Campaign.assignTicket(state, "shipping_cannot_print", "mike");
  Campaign.assignTicket(state, "plating_workstation_down", "amit");
  Campaign.assignTicket(state, "impossible_access_event", "security");
  Campaign.completeStandup(state);
  Campaign.completeWorkstation(state, { redInTheMirrorHeard: true, feliciaVideoSeen: true });
  Campaign.recordGhostEvidence(state, { id: "badge_impossible_access", perspective: "delegated_verified", discoveredBy: "security", completeness: "complete" });
  Campaign.enterSector04(state);
  Campaign.insightAccessGuard(state);
  Campaign.severAccessController(state);
  Campaign.transitionToTuesday(state);
  Story.syncAct1State(state);
  Act2.beginGhostFrequency(state);
  Act2.recordBadgeClonerEvidence(state, { physicalArtifact: true, auditContradiction: true, perspective: "delegated_verified" });
  Act2.firstDaylightFeliciaConversation(state, { approach: "professional" });
  Act2.recordMorningstarTrace(state, { component: "telemetry", source: "trace_bay", verified: true });
  Act2.recordRooftopViolinEvidence(state, { signalObserved: true, corroborated: true });
  Act2.revealViolinist(state);
  return state;
}

function memoryStorage() {
  const values = new Map();
  return { getItem: key => values.get(key) || null, setItem: (key, value) => values.set(key, value) };
}

const outcomes = [];
for (const approach of Act2.TRUST_APPROACHES) {
  let state = ready();
  const storage = memoryStorage();
  const assignments = JSON.stringify(state.assignments);
  const originalEvidence = JSON.stringify(state.evidence);
  const trustBefore = Act2.snapshot(state).trustScore;
  const evidenceBefore = Act2.snapshot(state).evidenceScore;
  function reload() {
    const before = JSON.stringify(state.p1.trustEarned);
    Campaign.save(state, storage);
    state = Campaign.load(storage);
    assert.equal(JSON.stringify(Act2.ensure(state).trustEarned), before, "reload preserves every investigation boundary");
    assert.ok(Act2.trustObjective(state).length > 20, "every boundary has a recoverable next objective");
  }
  function noAlliance() {
    assert.equal(state.story.facts.felicia_alliance, undefined);
    assert.equal(state.story.facts.morningstar_hangar_revealed, undefined);
    assert.equal(Act2.snapshot(state).trustScore, trustBefore, "investigation cannot award relationship points");
    assert.equal(JSON.stringify(state.assignments), assignments, "Act IV cannot overwrite authoritative Day ownership");
    assert.equal(JSON.stringify(state.evidence), originalEvidence, "Act IV cannot rewrite badge evidence provenance");
    assert.throws(() => Act2.completeTrustReport(state, { reported: true, sharedOwnership: true }), /verified/);
  }

  Act2.beginTrustInvestigation(state);
  reload();
  Act2.recordTrustInvestigation(state, { approach });
  const planned = JSON.stringify(state.p1.trustEarned);
  Act2.recordTrustInvestigation(state, { approach });
  assert.equal(JSON.stringify(state.p1.trustEarned), planned, "duplicate cinematic completion cannot advance an approach choice");
  reload();
  noAlliance();
  assert.equal(state.p1.trustEarned.investigation.verified, false, "a cinematic choice is not evidence");
  assert.throws(() => Act2.evaluateTrustHypothesis(state, "stale_mirror"), /Review the requester/);
  assert.throws(() => Act2.applyTrustResponse(state), /supported hypothesis/);
  assert.throws(() => Act2.verifyTrustResponse(state, "requester"), /Technical verification/);

  for (const id of ["comparison", "ledger", "requester"]) {
    Act2.observeTrustEvidence(state, id);
    const count = state.p1.trustEarned.observations.length;
    Act2.observeTrustEvidence(state, id);
    assert.equal(state.p1.trustEarned.observations.length, count, "duplicate observation cannot invent another source");
    reload();
    noAlliance();
  }
  assert.equal(state.p1.trustEarned.stage, "hypothesize");
  for (const id of ["external_actor", "normal_load"]) {
    Act2.evaluateTrustHypothesis(state, id);
    Act2.evaluateTrustHypothesis(state, id);
    assert.equal(state.p1.trustEarned.ruledOut.filter(value => value === id).length, 1);
    assert.equal(state.p1.trustEarned.stage, "hypothesize", "unsupported conclusions stay recoverable");
    assert.equal(Act2.snapshot(state).evidenceScore, evidenceBefore, "wrong and repeated choices cannot farm Evidence");
    reload();
  }
  Act2.evaluateTrustHypothesis(state, "stale_mirror");
  reload();
  Act2.applyTrustResponse(state);
  const response = JSON.stringify(state.p1.trustEarned.response);
  Act2.applyTrustResponse(state);
  assert.equal(JSON.stringify(state.p1.trustEarned.response), response);
  assert.equal(state.p1.trustEarned.response.liveServicePreserved, true);
  outcomes.push(state.p1.trustEarned.response.consequence);
  reload();
  noAlliance();
  Act2.verifyTrustResponse(state, "technical");
  reload();
  noAlliance();
  assert.equal(state.p1.trustEarned.investigation.verified, false, "a healthy route is not requester confirmation");
  Act2.verifyTrustResponse(state, "requester");
  Act2.verifyTrustResponse(state, "requester");
  reload();
  assert.equal(state.p1.trustEarned.stage, "report");
  assert.equal(Act2.snapshot(state).evidenceScore, evidenceBefore + 2);
  assert.equal(Act2.snapshot(state).trustScore, trustBefore);
  assert.equal(state.p1.evidence.records.filter(entry => entry.id === "trust_internal_mirror").length, 1);
  assert.equal(state.p1.evidence.records.find(entry => entry.id === "trust_internal_mirror").identityAttribution, "unproven");
  assert.throws(() => Act2.completeTrustReport(state, { reported: true, sharedOwnership: false }), /shared ownership/);
  Act2.completeTrustReport(state, { reported: true, sharedOwnership: true });
  const completed = JSON.stringify(state.p1);
  Act2.completeTrustReport(state, { reported: true, sharedOwnership: true });
  assert.equal(JSON.stringify(state.p1), completed, "double report is fully idempotent");
  reload();
  assert.equal(Act2.snapshot(state).trustScore, trustBefore + 2);
  assert.equal(Act2.snapshot(state).evidenceScore, evidenceBefore + 2);
  assert.equal(state.story.facts.felicia_alliance, true);
  assert.equal(state.story.facts.morningstar_hangar_revealed, true);
  assert.equal(state.p1.trustEarned.report.responseOwner, "mike");
  assert.equal(state.p1.trustEarned.report.verificationPartner, "felicia");
  assert.equal(state.p1.trustEarned.report.humanOutcome, "inspection_acknowledgement_restored");
  assert.equal(Act2.snapshot(state).feliciaFreeplayUnlocked, false, "Act IV cannot bypass Duet Protocol");
}
assert.equal(new Set(outcomes).size, 3, "response plans retain distinct operational consequences");

const early = Campaign.createInitialState();
assert.throws(() => Act2.beginTrustInvestigation(early), /Tuesday Morning/);
const legacy = ready();
legacy.p1.trustEarned = { stage: "report", investigation: { approach: "contain", verified: true }, completed: false, history: [] };
Act2.ensure(legacy);
assert.equal(legacy.p1.trustEarned.stage, "observe", "old approach-only progress must gather evidence");
assert.equal(legacy.p1.trustEarned.investigation.approach, "contain", "migration preserves the chosen response");
assert.equal(legacy.p1.trustEarned.investigation.verified, false);
assert.throws(() => Act2.completeTrustReport(legacy, { reported: true, sharedOwnership: true }), /verified/);

// Previously completed saves retain earned continuity; migration cannot invent
// new observations, rewards, or a retrospective requester verification.
const historical = ready();
historical.story.facts.trust_investigation_reported = true;
Story.completeAct(historical, "act_4");
historical.p1.trustEarned = { stage: "complete", investigation: { approach: "trace", verified: true }, completed: true, history: [] };
const scores = [historical.p1.evidence.score, historical.p1.trust.score];
Act2.ensure(historical);
assert.equal(historical.p1.trustEarned.completed, true);
assert.deepEqual(historical.p1.trustEarned.observations, []);
assert.equal(historical.p1.trustEarned.requesterVerified, false);
assert.deepEqual([historical.p1.evidence.score, historical.p1.trust.score], scores);

console.log("Act IV investigation: 3 responses, every-boundary reload, reasoning, verification, ownership and migration PASS");
