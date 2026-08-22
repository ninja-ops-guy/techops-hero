"use strict";
const assert = require("assert");
const C = require("./campaign_act1.js");

function assignAll(state, impossibleOwner) {
  C.assignTicket(state, "shipping_cannot_print", "mike");
  C.assignTicket(state, "plating_workstation_down", "mike");
  C.assignTicket(state, "impossible_access_event", impossibleOwner || "mike");
  C.completeStandup(state);
  C.completeWorkstation(state, { redInTheMirrorHeard: true, feliciaVideoSeen: true });
}

// Canonical firsthand route: daytime understanding enables permanent Night Walker defeat.
const direct = C.createInitialState();
assert.throws(() => C.completeStandup(direct), /exactly one owner/);
assignAll(direct, "mike");
C.resolveTicket(direct, "shipping_cannot_print", { technicalResolution: true, verification: "strong", humanOutcome: "restored" });
C.resolveTicket(direct, "plating_workstation_down", { technicalResolution: true, verification: "strong", humanOutcome: "restored" });
C.recordGhostEvidence(direct, { id: "badge_impossible_access", perspective: "firsthand", discoveredBy: "mike", completeness: "complete" });
C.resolveTicket(direct, "impossible_access_event", { technicalResolution: true, verification: "strong", humanOutcome: "restored" });
C.enterSector04(direct);
assert.equal(C.insightAccessGuard(direct).success, true);
C.suppressAccessGuard(direct);
assert.equal(direct.flags.sector04Completed, false, "damage only suppresses");
C.severAccessController(direct);
C.transitionToTuesday(direct);
assert.equal(direct.campaign.day, 2);
assert.equal(direct.campaign.chapter, "ghost_frequency");
assert.equal(direct.evidence.ghostIdentityEvidence.bestPerspective, "firsthand");
assert.equal(direct.night.sector, null, "temporary night state resets");

// Delegated/no-evidence route: combat remains available, diagnosis remains unavailable.
const delegated = C.createInitialState();
assignAll(delegated, "access_team");
C.enterSector04(delegated);
const unknown = C.insightAccessGuard(delegated);
assert.equal(unknown.success, false);
assert.match(unknown.message, /daytime investigation required/);
C.suppressAccessGuard(delegated);
assert.throws(() => C.severAccessController(delegated), /not understood/);
assert.equal(delegated.flags.sector04Completed, false);

// Persistence contract.
const memory = new Map();
const storage = { setItem: (k, v) => memory.set(k, v), getItem: k => memory.get(k) || null };
C.save(direct, storage);
assert.deepEqual(C.load(storage), direct);

console.log("Campaign Director v1: Act I contract PASS");
