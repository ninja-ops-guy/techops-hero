const assert = require("assert");

global.TechOpsCampaign = require("./campaign_act1.js");
const Sector04 = require("./campaign_sector04.js");

function prepare(firsthand) {
  const state = global.TechOpsCampaign.createInitialState();
  global.TechOpsCampaign.assignTicket(state, "shipping_cannot_print", "mike");
  global.TechOpsCampaign.assignTicket(state, "plating_workstation_down", "amit");
  global.TechOpsCampaign.assignTicket(state, "impossible_access_event", firsthand ? "mike" : "security");
  global.TechOpsCampaign.completeStandup(state);
  global.TechOpsCampaign.completeWorkstation(state, { redInTheMirrorHeard: true, feliciaVideoSeen: true });
  global.TechOpsCampaign.resolveTicket(state, "shipping_cannot_print", {
    technicalResolution: true,
    verification: "strong",
    humanOutcome: "restored"
  });
  global.TechOpsCampaign.resolveTicket(state, "plating_workstation_down", {
    technicalResolution: true,
    verification: "strong",
    humanOutcome: "restored"
  });
  if (firsthand) {
    global.TechOpsCampaign.recordGhostEvidence(state, {
      id: "badge_impossible_access",
      perspective: "firsthand",
      discoveredBy: "mike"
    });
  }
  return state;
}

let state = prepare(true);
let sector = Sector04.enter(state);
assert.strictEqual(sector.active, true);
assert.strictEqual(sector.accessGuardSpawned, true);

let clue = Sector04.inspect(state, "purple_damage");
assert.ok(clue.text.includes("purple damage"));
assert.strictEqual(Sector04.snapshot(state).purpleDamageInspected, true);

const insight = Sector04.insight(state);
assert.strictEqual(insight.success, true);
assert.strictEqual(insight.dependency, "identity_controller");
assert.strictEqual(Sector04.snapshot(state).controllerRevealed, true);

const suppressed = Sector04.suppress(state, 1000);
assert.strictEqual(suppressed.respawnAt, 16000);
assert.strictEqual(Sector04.snapshot(state).spawned, false);
Sector04.tick(state, 15999);
assert.strictEqual(Sector04.snapshot(state).spawned, false);
Sector04.tick(state, 16000);
assert.strictEqual(Sector04.snapshot(state).spawned, true);
assert.strictEqual(Sector04.snapshot(state).respawnCount, 1);

Sector04.suppress(state, 20000);
Sector04.severController(state);
assert.strictEqual(Sector04.snapshot(state).resolved, true);
assert.strictEqual(Sector04.snapshot(state).permanentlyDefeated, true);

const terminal = Sector04.terminal(state);
assert.strictEqual(terminal.message, "YOU ARE FIXING THE SYMPTOMS.");
assert.strictEqual(terminal.mikeResponse, "Then show me the problem.");
Sector04.inspect(state, "locked_violin_door");
Sector04.complete(state);
assert.strictEqual(state.flags.tuesdayMorningReached, true);
assert.strictEqual(state.campaign.chapter, "ghost_frequency");

state = prepare(false);
Sector04.enter(state);
const blocked = Sector04.insight(state);
assert.strictEqual(blocked.success, false);
assert.strictEqual(blocked.message, "Unknown controller—daytime investigation required.");
assert.throws(() => Sector04.severController(state), /Controller dependency is not understood/);

console.log("Sector 04 native sandbox: PASS");
