"use strict";
const assert = require("assert");
const P1 = require("./campaign_act2.js");

function base() {
  return {
    flags: {
      tuesday_morning_reached: true,
      felicia_video_watched: true
    },
    story: { completedActs: ["prologue", "act_1"], facts: { tuesday_morning: true } }
  };
}

// Ghost Frequency cannot begin before Tuesday.
const early = { flags: { tuesday_morning_reached: false, felicia_video_watched: true }, story: { facts: {} } };
assert.throws(() => P1.beginGhostFrequency(early), /requires Tuesday Morning/);

const state = base();
P1.beginGhostFrequency(state);
let snap = P1.snapshot(state);
assert.strictEqual(snap.chapter, "ghost_frequency");
assert.strictEqual(snap.evidenceScore, 0);
assert.strictEqual(snap.trustScore, 0);

// Badge-cloner evidence changes Evidence, never Trust.
assert.throws(() => P1.recordBadgeClonerEvidence(state, { physicalArtifact: true, auditContradiction: false }), /audit contradiction/);
P1.recordBadgeClonerEvidence(state, { physicalArtifact: true, auditContradiction: true, perspective: "firsthand" });
snap = P1.snapshot(state);
assert.strictEqual(snap.badgeClonerVerified, true);
assert.strictEqual(snap.evidenceScore, 2);
assert.strictEqual(snap.trustScore, 0);
assert.strictEqual(state.story.facts.ghost_identity_established, true);

// First daylight Felicia conversation changes Trust, never Evidence.
const evidenceBeforeFelicia = snap.evidenceScore;
P1.firstDaylightFeliciaConversation(state, { approach: "professional" });
snap = P1.snapshot(state);
assert.strictEqual(snap.feliciaDaylightConversation, true);
assert.strictEqual(snap.trustScore, 2);
assert.strictEqual(snap.evidenceScore, evidenceBeforeFelicia);
assert.strictEqual(state.story.facts.felicia_contact, true);
assert.throws(() => P1.firstDaylightFeliciaConversation(state, { approach: "curious" }), /already completed/);

// Company-video ordering is enforced even if Tuesday state exists.
const noVideo = base();
noVideo.flags.felicia_video_watched = false;
assert.throws(() => P1.firstDaylightFeliciaConversation(noVideo, { approach: "professional" }), /company video must precede/);

// MORNINGSTAR is progressive: unverified traces populate the ledger but do not produce the signature fact.
P1.recordMorningstarTrace(state, { component: "antenna", source: "maintenance telemetry", verified: false });
snap = P1.snapshot(state);
assert.strictEqual(snap.morningstarSignatureFound, false);
assert.strictEqual(state.story.facts.morningstar_signature_found, undefined);
P1.recordMorningstarTrace(state, { component: "telemetry", source: "aircraft rack capture", verified: true });
snap = P1.snapshot(state);
assert.strictEqual(snap.morningstarSignatureFound, true);
assert.strictEqual(state.story.facts.morningstar_signature_found, true);
assert.throws(() => P1.recordMorningstarTrace(state, { component: "magic_engine", source: "bad fixture", verified: true }), /Unknown MORNINGSTAR component/);

// Rooftop signal must be corroborated. It is Evidence, not Trust.
const trustBeforeRooftop = snap.trustScore;
assert.throws(() => P1.recordRooftopViolinEvidence(state, { signalObserved: true, corroborated: false }), /must be corroborated/);
P1.recordRooftopViolinEvidence(state, { signalObserved: true, corroborated: true, perspective: "firsthand" });
snap = P1.snapshot(state);
assert.strictEqual(snap.rooftopViolinVerified, true);
assert.strictEqual(snap.trustScore, trustBeforeRooftop);
assert.strictEqual(snap.violinistRevealEligible, true);

// Reveal cannot be shortcut by trust alone or a single clue.
const shortcut = base();
P1.beginGhostFrequency(shortcut);
P1.firstDaylightFeliciaConversation(shortcut, { approach: "professional" });
assert.strictEqual(P1.violinistRevealEligible(shortcut), false);
assert.throws(() => P1.revealViolinist(shortcut), /prerequisites are not met/);

P1.revealViolinist(state);
snap = P1.snapshot(state);
assert.strictEqual(snap.violinistRevealed, true);
assert.strictEqual(snap.chapter, "parts_in_motion");
assert.strictEqual(state.story.facts.violinist_revealed, true);
assert.throws(() => P1.revealViolinist(state), /already completed/);

console.log("Campaign Acts II-III semantic proof / Story Bible v1.2: PASS");