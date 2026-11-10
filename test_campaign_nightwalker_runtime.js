const assert = require("assert");
const fs = require("fs");

global.TechOpsNightwalker = require("./campaign_nightwalker.js");
global.TechOpsSector04Runtime = require("./campaign_sector04_runtime.js");
const Mission = global.TechOpsNightwalker;
const Runtime = require("./campaign_nightwalker_runtime.js");

function FakeImage() {}
Object.defineProperty(FakeImage.prototype, "src", {
  set(value) { this._src = value; if (this.onload) this.onload(); },
  get() { return this._src; }
});
global.Image = FakeImage;

function nightState() {
  return {
    x: 88, y: 396, w: 22, h: 34, hp: 100, cash: 0, kills: 0,
    enemies: [], platforms: [], done: {}, drive: null,
    msg: "", msgT: 0, clear: false, cam: 0
  };
}
function started() {
  const state = Mission.initialState();
  const night = nightState();
  Runtime.createEncounter(state, night);
  return { state, night };
}
function inspectAll(mission) {
  for (const id of ["access_audit", "wiped_drive", "maintenance_panel"]) {
    const point = Runtime.POINTS.find(p => p.id === id);
    const result = Runtime.inspectNearest(mission.state, mission.night, point.x, point.y);
    assert.strictEqual(result.id, id);
  }
}
function revealed() {
  const mission = started();
  inspectAll(mission);
  assert.strictEqual(Runtime.chooseHypothesis(mission.state, mission.night, "identity_bypass").supported, true);
  Runtime.useInsight(mission.state, mission.night);
  return mission;
}
function fakeCtx() {
  return {
    calls: [], images: [], canvas: { width: 1280, height: 720 },
    save() { this.calls.push("save"); }, restore() { this.calls.push("restore"); },
    fillRect(...args) { this.calls.push("fillRect"); }, strokeRect(...args) { this.calls.push("strokeRect"); },
    fillText(...args) { this.calls.push("fillText"); }, drawImage(...args) { this.images.push(args); this.calls.push("drawImage"); },
    beginPath() {}, moveTo() {}, lineTo() {}, stroke() {}, fill() {}, arc() {},
    measureText(text) { return { width: String(text).length * 7 }; }
  };
}

let mission = started();
assert.strictEqual(mission.state.stage, "investigate");
assert.strictEqual(mission.night.district, "industrial");
assert.strictEqual(mission.night._nightwalker.active, true);
assert.strictEqual(mission.night.enemies.length, 0, "first evidence site begins as a safe onboarding space");
assert.strictEqual(mission.night.platforms.length, 6);
assert.notDeepStrictEqual(mission.night.platforms.map(p => [p.x, p.y, p.w]), [
  [300, 330, 130], [560, 262, 110], [820, 340, 150], [1100, 270, 120], [1380, 338, 140]
]);
assert.strictEqual(Runtime.POINTS.length, 5);
assert.strictEqual(Runtime.nearestInspectable(mission.night, 390, 343).id, "access_audit");
assert.strictEqual(Runtime.nearestInspectable(mission.night, 10, 10), null);

const earlyConsole = Runtime.inspectNearest(mission.state, mission.night, 1530, 413);
assert.strictEqual(earlyConsole.blocked, true);
inspectAll(mission);
assert.strictEqual(mission.night.enemies.length, 1);
assert.strictEqual(mission.night.enemies[0].campaignNightwalkerGuard, true);
assert.strictEqual(mission.night.enemies[0].campaignSector04Guard, undefined);
assert.strictEqual(mission.night.enemies[0].x, 960);
assert.strictEqual(mission.night.enemies[0].spd, 0);
assert.strictEqual(mission.night.enemies[0].dashes, false);
assert.strictEqual(mission.state.evidence.length, 3);
assert.strictEqual(Runtime.inspectNearest(mission.state, mission.night, 1530, 413).requiresHypothesis, true);
assert.strictEqual(Runtime.chooseHypothesis(mission.state, mission.night, "external_actor").supported, false);
assert.strictEqual(mission.state.controllerRevealed, false);
assert.strictEqual(Runtime.chooseHypothesis(mission.state, mission.night, "identity_bypass").supported, true);
Runtime.useInsight(mission.state, mission.night);
assert.strictEqual(mission.state.controllerRevealed, true);
const isolated = Runtime.inspectNearest(mission.state, mission.night, 1220, 268);
assert.strictEqual(isolated.isolated, true);
assert.strictEqual(mission.night.enemies.some(e => e.alive), false);
const verification = Runtime.inspectNearest(mission.state, mission.night, 130, 413);
assert.strictEqual(verification.verified, true);
assert.strictEqual(mission.state.completed, true);
assert.strictEqual(mission.night._nightwalker.hudStatus, "VERIFIED");

mission = started();
Runtime.inspectNearest(mission.state, mission.night, 390, 343);
let guard = mission.night.enemies[0];
guard.hp = 0; guard.alive = false;
let combat = Runtime.syncCombat(mission.state, mission.night, 1000);
assert.strictEqual(combat.changed, true);
assert.strictEqual(combat.respawnAt, 16000);
assert.strictEqual(mission.state.completed, false);
assert.strictEqual(mission.night.clear, false);
Runtime.tick(mission.state, mission.night, 15999);
assert.strictEqual(mission.night.enemies.some(e => e.alive), false);
assert.strictEqual(Runtime.tick(mission.state, mission.night, 16000).respawned, true);
assert.strictEqual(mission.night.enemies.some(e => e.alive), true);
assert.strictEqual(mission.state.guard.respawnCount, 1);

mission = revealed();
const relay = Runtime.inspectNearest(mission.state, mission.night, 1220, 268);
assert.strictEqual(relay.isolated, true);
Runtime.tick(mission.state, mission.night, 999999);
assert.strictEqual(mission.night.enemies.some(e => e.alive), false, "isolated relay must never respawn the guard");

const drawMission = revealed();
const ctx = fakeCtx();
assert.strictEqual(Runtime.drawOverlay(ctx, drawMission.night, drawMission.state, 1280, 720), true);
assert.ok(ctx.calls.includes("fillText"));
assert.ok(ctx.calls.includes("fillRect"));
assert.ok(ctx.images.some(args => args[0] && String(args[0]._src).includes("identity_controller.active")), "revealed relay must use its production asset");

const index = fs.readFileSync("index.html", "utf8");
assert.ok(index.indexOf("campaign_nightwalker.js") > index.indexOf("campaign_sector04_runtime.js"));
assert.ok(index.indexOf("campaign_nightwalker_runtime.js") > index.indexOf("campaign_nightwalker.js"));
for (const filename of ["campaign_nightwalker.js", "campaign_nightwalker_runtime.js"]) assert.ok(fs.existsSync(filename));
const nightHooks = fs.readFileSync("night_hooks.js", "utf8");
assert.ok(/NM\._sector04 \|\| NM\._nightwalker/.test(nightHooks), "authored mission must own its exit");
assert.ok(/!NM \|\| NM\._v736 \|\| NM\._sector04 \|\| NM\._nightwalker\) return false/.test(nightHooks), "Charger travel must stay outside the authored mission");
assert.ok(/districtName \|\| "WEST ANNEX"/.test(nightHooks), "HUD must preserve West Annex as the default mission district");
const nightRuntime = fs.readFileSync("runtime_night.js", "utf8");
assert.ok(/NIGHTWALKER — West Annex field report/.test(nightRuntime));
assert.ok(/n\._nightwalker/.test(nightRuntime));

global.S = { diff: "intern" };
global.TechOpsDifficulty = { profile: () => ({ enemyHp: 0.7, damage: 0.7 }) };
const scaled = started();
Runtime.inspectNearest(scaled.state, scaled.night, 390, 343);
assert.strictEqual(scaled.night.enemies[0].maxHp, 34);
assert.strictEqual(scaled.night.enemies[0].dmg, 3);
delete global.S;
delete global.TechOpsDifficulty;

console.log("Nightwalker West Annex runtime: PASS");
