"use strict";
const assert = require("assert");
const act1 = require("./campaign_act1.js");
const act2 = require("./campaign_act2.js");

const storage = {
  data: {},
  getItem(k) { return this.data[k] || null; },
  setItem(k, v) { this.data[k] = String(v); },
  removeItem(k) { delete this.data[k]; }
};
function saveReload(state) { act1.save(state, storage); return act1.load(storage); }
function freshTuesday() {
  const s = act1.freshState ? act1.freshState() : act1.load(storage);
  s.flags = s.flags || {};
  s.flags.tuesday_morning_reached = true;
  s.flags.felicia_video_watched = true;
  return saveReload(s);
}

let s = freshTuesday();
act2.beginGhostFrequency(s);
s = saveReload(s);
assert.strictEqual(act2.snapshot(s).violinistRevealed, false);

// Rooftop proximity alone can never identify Felicia.
assert.throws(() => act2.recordRooftopViolinEvidence(s, { signalObserved:true, corroborated:false }), /corroborated/);
assert.throws(() => act2.revealViolinist(s), /prerequisites/);

act2.recordBadgeClonerEvidence(s, { physicalArtifact:true, auditContradiction:true, perspective:"firsthand" });
s = saveReload(s);
assert.strictEqual(act2.snapshot(s).badgeClonerVerified, true);
assert.strictEqual(act2.snapshot(s).violinistRevealEligible, false);

act2.firstDaylightFeliciaConversation(s, { approach:"professional" });
s = saveReload(s);
assert.strictEqual(act2.snapshot(s).trustScore, 2);
assert.strictEqual(act2.snapshot(s).evidenceScore, 2, "Trust must not mutate Evidence");

act2.recordMorningstarTrace(s, { component:"compute", source:"compute_bus", verified:false });
s = saveReload(s);
assert.strictEqual(act2.snapshot(s).morningstarSignatureFound, false, "unverified component cannot unlock MORNINGSTAR signature");
assert.throws(() => act2.revealViolinist(s), /prerequisites/);

act2.recordMorningstarTrace(s, { component:"telemetry", source:"telemetry_bus", verified:true });
s = saveReload(s);
assert.strictEqual(act2.snapshot(s).morningstarSignatureFound, true);
assert.strictEqual(act2.snapshot(s).violinistRevealEligible, false, "verified MORNINGSTAR trace is not identity proof by itself");

act2.recordRooftopViolinEvidence(s, { signalObserved:true, corroborated:true, perspective:"firsthand" });
s = saveReload(s);
assert.strictEqual(act2.snapshot(s).violinistRevealEligible, true);
act2.revealViolinist(s);
s = saveReload(s);
assert.strictEqual(act2.snapshot(s).violinistRevealed, true);
assert.strictEqual(act2.snapshot(s).chapter, "parts_in_motion");
assert.throws(() => act2.revealViolinist(s), /already completed/, "reveal reward must not replay after reload");

console.log("Campaign Acts II-III reload/reveal gates: PASS");
