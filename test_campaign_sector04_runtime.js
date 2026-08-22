const assert = require("assert");

global.TechOpsCampaign = require("./campaign_act1.js");
global.TechOpsCampaignAssets = require("./campaign_assets.js");
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
assert.strictEqual(night.enemies[0].assetSlot, "sector04.access_guard.idle");
assert.strictEqual(Runtime.assetFilename("sector04.access_guard.idle"), "sector04.access_guard.idle.png");
assert.strictEqual(Runtime.assetUrl("sector04.access_guard.idle"), "assets/campaign/sector04.access_guard.idle.png");
assert.strictEqual(Runtime.atlasUrl("sector04.access_guard.respawn"), "assets/campaign/sector04.access_guard.respawn.atlas.json");
assert.strictEqual(night._sector04.assets.get("sector04.access_guard.idle").status, "unavailable");
assert.ok(night._sector04.inspectables.some(p => p.assetSlot === "sector04.terminal.symptoms"));
assert.strictEqual(global.TechOpsSector04.snapshot(campaign).active, true);

let resolver = Runtime.createAssetResolver({ basePath: "/runtime-assets" });
let record = resolver.requestSlot("sector04.identity_controller.active");
assert.strictEqual(record.url, "/runtime-assets/sector04.identity_controller.active.png");
assert.strictEqual(record.status, "unavailable");

let fakeSrc = "";
function FakeImage() {}
Object.defineProperty(FakeImage.prototype, "src", {
  set(value) {
    fakeSrc = value;
    if (this.onload) this.onload();
  }
});
resolver = Runtime.createAssetResolver({ basePath: "packs", Image: FakeImage });
record = resolver.requestSlot("sector04.locked_violin_door");
assert.strictEqual(fakeSrc, "packs/sector04.locked_violin_door.png");
assert.strictEqual(record.status, "ready");
assert.ok(record.image);

assert.strictEqual(Runtime.generatedAssetSpec("sector04.violin_note.fx").kind, "violin_note");
assert.strictEqual(Runtime.generatedAssetSpec("sector04.terminal.symptoms").kind, "terminal");

function fakeCtx() {
  const calls = [];
  return {
    calls,
    canvas: { width: 960 },
    save() { calls.push("save"); },
    restore() { calls.push("restore"); },
    fillRect() { calls.push("fillRect"); },
    strokeRect() { calls.push("strokeRect"); },
    fillText() { calls.push("fillText"); },
    drawImage() { calls.push("drawImage"); },
    beginPath() { calls.push("beginPath"); },
    arc() { calls.push("arc"); },
    moveTo() { calls.push("moveTo"); },
    lineTo() { calls.push("lineTo"); },
    stroke() { calls.push("stroke"); },
    fill() { calls.push("fill"); },
    set font(value) { this._font = value; },
    set textAlign(value) { this._textAlign = value; },
    set fillStyle(value) { this._fillStyle = value; },
    set strokeStyle(value) { this._strokeStyle = value; },
    set globalAlpha(value) { this._globalAlpha = value; }
  };
}

let ctx = fakeCtx();
assert.strictEqual(Runtime.drawGeneratedAsset(ctx, "sector04.terminal.symptoms", 100, 100, 126, 68), true);
assert.ok(ctx.calls.includes("strokeRect"));
assert.ok(ctx.calls.filter(call => call === "fillRect").length >= 3);

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
