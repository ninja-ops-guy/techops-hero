const assert = require("assert");

global.TechOpsCampaign = require("./campaign_act1.js");
global.TechOpsSector04 = require("./campaign_sector04.js");
const Runtime = require("./campaign_sector04_runtime.js");

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

function nightState() {
  return {
    x: 120,
    y: 396,
    w: 22,
    h: 34,
    enemies: [],
    platforms: [],
    msg: "",
    msgT: 0,
    clear: false
  };
}

let campaign = prepare(true);
let night = nightState();
Runtime.createEncounter(campaign, night);
assert.strictEqual(night.district, "sector04");
assert.strictEqual(night.enemies.length, 1);
assert.strictEqual(night.enemies[0].campaignSector04Guard, true);
assert.strictEqual(global.TechOpsSector04.snapshot(campaign).active, true);

let result = Runtime.hitGuard(campaign, night, 100, 1000);
assert.strictEqual(result.suppressed, true);
assert.strictEqual(global.TechOpsSector04.snapshot(campaign).spawned, false);
Runtime.tick(campaign, night, 15999);
assert.strictEqual(night.enemies.some(e => e.campaignSector04Guard && e.alive), false);
Runtime.tick(campaign, night, 16000);
assert.strictEqual(night.enemies.some(e => e.campaignSector04Guard && e.alive), true);
assert.strictEqual(global.TechOpsSector04.snapshot(campaign).respawnCount, 1);

campaign = prepare(true);
night = nightState();
Runtime.createEncounter(campaign, night);
let purple = Runtime.inspectNearest(campaign, night, 610, 406);
assert.strictEqual(purple.id, "purple_damage");
assert.strictEqual(global.TechOpsSector04.snapshot(campaign).purpleDamageInspected, true);
assert.strictEqual(global.TechOpsSector04.snapshot(campaign).controllerRevealed, true);

let controller = Runtime.inspectNearest(campaign, night, 1180, 292);
assert.strictEqual(controller.id, "identity_controller");
assert.strictEqual(controller.severed, true);
assert.strictEqual(global.TechOpsSector04.snapshot(campaign).resolved, true);
assert.strictEqual(night.enemies.some(e => e.campaignSector04Guard && e.alive), false);

let terminal = Runtime.inspectNearest(campaign, night, 1660, 372);
assert.strictEqual(terminal.message, "YOU ARE FIXING THE SYMPTOMS.");
assert.strictEqual(terminal.mikeResponse, "Then show me the problem.");
assert.strictEqual(campaign.flags.tuesdayMorningReached, true);
assert.strictEqual(night._sector04.completed, true);

campaign = prepare(true);
night = nightState();
Runtime.createEncounter(campaign, night);
const guard = night.enemies[0];
guard.hp = 0;
guard.alive = false;
result = Runtime.syncCombat(campaign, night, 2000);
assert.strictEqual(result.suppressed, true);
assert.strictEqual(global.TechOpsSector04.snapshot(campaign).guardSuppressed, true);

campaign = prepare(false);
night = nightState();
Runtime.createEncounter(campaign, night);
let blocked = Runtime.inspectNearest(campaign, night, 1180, 292);
assert.strictEqual(blocked.blocked, true);
assert.strictEqual(blocked.message, "Unknown controller—daytime investigation required.");
assert.strictEqual(global.TechOpsSector04.snapshot(campaign).controllerSevered, false);

console.log("Sector 04 runtime bridge: PASS");
