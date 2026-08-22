const assert = require("assert");

const Assets = require("./campaign_assets.js");

const validation = Assets.validate();
assert.deepStrictEqual(validation.errors, []);
assert.strictEqual(validation.ok, true);

for (const phase of ["phase_a", "phase_b", "phase_c", "phase_d"]) {
  assert.ok(Assets.slotsForPhase(phase).length > 0, `${phase} should have asset slots`);
}

const required = Assets.requiredSlots().map(slot => slot.id);
[
  "ui.standup.board",
  "workstation.felicia.video_frame",
  "shipping.clerk.idle",
  "plating.workstation_cracked",
  "sector04.access_guard.suppressed",
  "sector04.identity_controller.severed",
  "sector04.terminal.symptoms"
].forEach(id => assert.ok(required.includes(id), `${id} must be required`));

assert.strictEqual(Assets.byId("sector04.terminal.symptoms").sheet, "sector04_clue_terminal");
assert.strictEqual(Assets.byId("sector04.identity_controller.active").role, "prop");
assert.strictEqual(Assets.byId("felicia.the_violinist.secret_boss"), null);

assert.ok(Assets.QC_GATES.runtime_png.includes("transparent_background"));
assert.ok(Assets.QC_GATES.animated_atlas.includes("consistent_anchor_feet_or_center"));
assert.strictEqual(Assets.slotFilename("sector04.access_guard.idle"), "sector04.access_guard.idle.png");

const latestReview = Assets.sheetReview("act1_sector04_runtime_pack_20260822");
assert.strictEqual(latestReview.visualQuality, "strong_reference");
assert.strictEqual(latestReview.runtimeReadiness, "requires_slicing_and_transparency");
assert.ok(latestReview.notes.some(note => note.includes("white background")));

let candidate = Assets.validateCandidate("sector04.access_guard.idle", {
  kind: "runtime_png",
  filename: "sector04.access_guard.idle.png",
  format: "png",
  transparent: true,
  perspective: "side"
});
assert.strictEqual(candidate.ok, true);
assert.deepStrictEqual(candidate.errors, []);

candidate = Assets.validateCandidate("sector04.access_guard.idle", {
  kind: "runtime_png",
  filename: "access_guard.png",
  format: "jpeg",
  transparent: false,
  hasBakedLabels: true,
  perspective: "top"
});
assert.strictEqual(candidate.ok, false);
assert.ok(candidate.errors.some(error => error.includes("Filename must be sector04.access_guard.idle.png")));
assert.ok(candidate.errors.some(error => error.includes("transparent backgrounds")));
assert.ok(candidate.warnings.some(warning => warning.includes("side-view")));

candidate = Assets.validateCandidate("sector04.terminal.symptoms", {
  kind: "runtime_png",
  filename: "sector04.terminal.symptoms.png",
  format: "png",
  transparent: true,
  exactText: "YOU ARE FIXING ALL SYMPTOMS."
});
assert.strictEqual(candidate.ok, false);
assert.ok(candidate.errors.some(error => error.includes("exact canon text")));

console.log("Campaign asset contract: PASS");
