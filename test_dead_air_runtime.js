const assert = require("assert");
const fs = require("fs");
global.TechOpsDeadAir = require("./campaign_dead_air.js");
global.TechOpsSector04Runtime = require("./campaign_sector04_runtime.js");
const Mission = global.TechOpsDeadAir;
const Runtime = require("./campaign_dead_air_runtime.js");
const WestAnnex = require("./campaign_nightwalker_runtime.js");

function FakeImage() {}
Object.defineProperty(FakeImage.prototype, "src", { set(value) { this._src = value; if (this.onload) this.onload(); }, get() { return this._src; } });
global.Image = FakeImage;
function nightState() { return { x: 88, y: 396, w: 22, h: 34, hp: 100, cash: 0, kills: 0, enemies: [], platforms: [], done: {}, drive: null, msg: "", msgT: 0, clear: false, cam: 0 }; }
function started() { const state = Mission.initialState(), night = nightState(); Runtime.createEncounter(state, night); return { state, night }; }
function tuneAll(mission) {
  for (const [id, filter] of [["pier_gate", "narrowband"], ["crane4", "sideband"], ["bait_tackle", "pulse"]]) Runtime.tuneRelay(mission.state, mission.night, id, filter);
}
function fakeCtx() {
  return {
    calls: [], images: [], canvas: { width: 1280, height: 720 },
    save() {}, restore() {}, fillRect() { this.calls.push("fillRect"); }, strokeRect() {}, fillText() { this.calls.push("fillText"); },
    drawImage(...args) { this.images.push(args); }, beginPath() {}, moveTo() {}, lineTo() {}, stroke() {}, fill() {}, arc() {},
    measureText(text) { return { width: String(text).length * 7 }; }
  };
}

let mission = started();
assert.strictEqual(mission.night.district, "longwharf");
assert.strictEqual(mission.night._nightwalker.runtimeId, "deadAir");
assert.strictEqual(mission.night._nightwalker.districtName, "LONG WHARF");
assert.strictEqual(mission.night.enemies.length, 0, "first relay is safe before tuning begins");
assert.notDeepStrictEqual(mission.night.platforms, WestAnnex.platformLayout(), "Pier 7 must not reuse West Annex geometry");
assert.strictEqual(Runtime.nearestInspectable(mission.night, 360, 333).id, "pier_gate");
assert.strictEqual(Runtime.inspectNearest(mission.state, mission.night, 1530, 413).blocked, true);
assert.strictEqual(Runtime.tuneRelay(mission.state, mission.night, "pier_gate", "pulse").tuned, false);
assert.strictEqual(mission.state.recordingIntegrity, 90);
assert.strictEqual(mission.night.enemies.length, 0, "a filter mismatch does not spawn the skimmer");
Runtime.tuneRelay(mission.state, mission.night, "pier_gate", "narrowband");
assert.strictEqual(mission.night.enemies.length, 1);
assert.strictEqual(mission.night.enemies[0].spd, 0);
Runtime.tuneRelay(mission.state, mission.night, "crane4", "sideband");
Runtime.tuneRelay(mission.state, mission.night, "bait_tackle", "pulse");
assert.strictEqual(mission.state.triangulated, true);
assert.strictEqual(Runtime.inspectNearest(mission.state, mission.night, 1530, 413).requiresRecoveryChoice, true);
Mission.damageRecording(mission.state, 45);
assert.throws(() => Mission.choose(mission.state, "broadcast"), /at least 60%/);
Runtime.restoreRecording(mission.state, mission.night);
assert.strictEqual(mission.state.recordingIntegrity, 100);
Runtime.chooseRecovery(mission.state, mission.night, "isolate");
assert.strictEqual(mission.state.sourceProtected, true);
const verified = Runtime.inspectNearest(mission.state, mission.night, 130, 413);
assert.strictEqual(verified.verified, true);
assert.strictEqual(verified.outcome, "manifest_restored_and_source_protected");
assert.strictEqual(mission.state.completed, true);

mission = started();
Runtime.tuneRelay(mission.state, mission.night, "pier_gate", "narrowband");
mission.night.hp = 90;
Runtime.tick(mission.state, mission.night, 1000);
assert.strictEqual(mission.state.recordingIntegrity, 95, "player damage also damages the recording");
Runtime.tick(mission.state, mission.night, 1100);
assert.strictEqual(mission.state.recordingIntegrity, 95, "the same hit cannot count twice");
let guard = mission.night.enemies[0];
guard.hp = 0; guard.alive = false;
let combat = Runtime.syncCombat(mission.state, mission.night, 1000);
assert.strictEqual(combat.changed, true);
assert.strictEqual(combat.respawnAt, 16000);
assert.strictEqual(mission.state.completed, false);
Runtime.tick(mission.state, mission.night, 15999);
assert.strictEqual(mission.night.enemies.some(e => e.alive), false);
assert.strictEqual(Runtime.tick(mission.state, mission.night, 16000).respawned, true);
assert.strictEqual(mission.night.enemies.some(e => e.alive), true);
assert.strictEqual(mission.state.guard.respawnCount, 1);

const drawMission = started();
tuneAll(drawMission);
drawMission.night.cam = 300;
const ctx = fakeCtx();
assert.strictEqual(Runtime.drawOverlay(ctx, drawMission.night, drawMission.state, 1280, 720), true);
assert.ok(ctx.calls.includes("fillText"));
assert.ok(ctx.images.some(args => String(args[0] && args[0]._src).includes("violin_note")), "triangulation uses the existing violin-note asset");

global.S = { diff: "intern" };
global.TechOpsDifficulty = { profile: () => ({ enemyHp: 0.7, damage: 0.7 }) };
const scaled = started();
Runtime.tuneRelay(scaled.state, scaled.night, "pier_gate", "narrowband");
assert.strictEqual(scaled.night.enemies[0].maxHp, 28);
assert.strictEqual(scaled.night.enemies[0].dmg, 4);
delete global.S;
delete global.TechOpsDifficulty;

console.log("Dead Air runtime: PASS");
