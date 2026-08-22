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

console.log("Campaign asset contract: PASS");
