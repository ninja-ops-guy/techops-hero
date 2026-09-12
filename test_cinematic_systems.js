"use strict";

const assert = require("assert");
const fs = require("fs");
const vm = require("vm");

const elements = Object.create(null);
function element(id, classes = []) {
  const set = new Set(classes);
  return elements[id] = {
    id,
    style: { display: "", visibility: "", opacity: "1" },
    classList: { contains: value => set.has(value), add: value => set.add(value), remove: value => set.delete(value) }
  };
}
element("dialogue", ["hidden"]);
element("good-dogs-cutscene-overlay");

const nightDistricts = {};
for (const id of ["downtown", "longwharf", "industrial", "wooster", "airport", "suburbs"]) {
  nightDistricts[id] = { name: id.toUpperCase(), streets: 2, accent: "#55dfff" };
}
const ticketTypes = Array.from({ length: 17 }, (_, i) => ({
  id: `ticket_${i + 1}`, world: `TICKET WORLD ${i + 1}`, label: `ROOT CAUSE ${i + 1}`,
  enemy: `enemy_${i + 1}`, stat: "logic", wbg: "#123456"
}));
const context = {
  console,
  Date,
  Math,
  Object,
  Array,
  Number,
  String,
  isFinite,
  TechOpsNightDistricts: nightDistricts,
  TechOpsNightOrder: Object.keys(nightDistricts),
  TechOpsTicketTypes: ticketTypes,
  document: { getElementById: id => elements[id] || null },
  getComputedStyle: el => el.style
};
context.globalThis = context;
vm.createContext(context);
vm.runInContext(fs.readFileSync("cinematic_systems.js", "utf8"), context, { filename: "cinematic_systems.js" });

const registry = context.TechOpsLevelRegistry;
assert.ok(registry && registry.VERSION === 1, "level registry must be available at parser time");
const health = registry.validate();
assert.deepStrictEqual(JSON.parse(JSON.stringify(health)), {
  valid: true, errors: [], goodDogs: 8, nightCrawler: 12, ticketWorlds: 17, daySpaces: 5, total: 42
});
assert.strictEqual(registry.CAMPAIGN_DISPLAY_NAME, "GOOD DOGS");
assert.strictEqual(registry.goodDogsMission(1).nextMission, "gooddogs.m2");
assert.strictEqual(registry.goodDogsMission(8).nextMission, null);
assert.strictEqual(registry.goodDogsMission(3).environment.primaryAsset, "assets/cinematic/m3_orbital_prison_breach.png");
assert.deepStrictEqual(Array.from(registry.goodDogsEncounter(2).waves[0]), ["guard", "guard"]);
assert.strictEqual(registry.goodDogsEncounter(2).towers, undefined, "Hidden Bay may not inherit the obsolete uplink-tower objective");
assert.ok(Object.isFrozen(registry.goodDogsMission(1)) && Object.isFrozen(registry.goodDogsMission(1).stage), "canonical records must be immutable");
const stage = registry.mutableStage("gooddogs.m3");
stage.platforms[0][0] = -1;
assert.strictEqual(registry.goodDogsMission(3).stage.platforms[0][0], 280, "runtime stage clones may not mutate canon");
assert.strictEqual(registry.resolveRuntimeContext({ nightMode: true }, { _v736: { m: 6 }, district: "downtown" }).levelId, "gooddogs.m6", "Good Dogs must outrank inherited Night context");
assert.strictEqual(registry.resolveRuntimeContext({ nightMode: true }, { _sector04: true, district: "downtown" }).levelId, "day.sector04", "Sector 04 must outrank ordinary Night context");
assert.strictEqual(registry.resolveRuntimeContext({ nightMode: true }, { district: "wooster", street: 2 }).levelId, "nightcrawler.wooster.2");

const presentations = context.TechOpsPresentationDirector;
const token = presentations.begin({ id: "opening", owner: "test", mode: "gooddogs", blocking: true });
assert.ok(token && presentations.isBlocking("gooddogs"));
assert.strictEqual(presentations.begin({ id: "competing", owner: "test-2", mode: "gooddogs", blocking: true }), null, "one mode cannot acquire two blocking presentations");
const dayToken = presentations.begin({ id: "day", owner: "test", mode: "day", blocking: true });
assert.ok(dayToken, "independent modes may hold independent presentation claims");
assert.strictEqual(presentations.end(token, "completed"), true);
assert.strictEqual(presentations.end(token, "completed-again"), false, "presentation completion must be idempotent");
assert.strictEqual(presentations.end(dayToken, "completed"), true);
elements["good-dogs-cutscene-overlay"].classList.add("active");
assert.ok(presentations.isBlocking("gooddogs"), "registered visible surfaces must participate in input blocking");
elements["good-dogs-cutscene-overlay"].classList.remove("active");
assert.ok(!presentations.isBlocking("gooddogs"));

const cameras = context.TechOpsCameraDirector;
const night = cameras.update("night", { profile: "night.street", targetX: 500, targetY: 0, viewportW: 240, viewportH: 100, worldW: 1800, worldH: 100, nowMs: 0 });
assert.strictEqual(night.x, 400, "Night Crawler must preserve its locked legacy framing");
function settle(stepMs) {
  cameras.reset("fps-test");
  cameras.update("fps-test", { profile: "gooddogs.sideview", targetX: 400, targetY: 0, viewportW: 240, worldW: 1800, facingX: 1, nowMs: 0 });
  for (let t = stepMs; t <= 1000 + .001; t += stepMs) cameras.update("fps-test", { profile: "gooddogs.sideview", targetX: 480, targetY: 0, viewportW: 240, worldW: 1800, facingX: 1, nowMs: t });
  return cameras.get("fps-test");
}
const at60 = settle(1000 / 60), at120 = settle(1000 / 120);
assert.ok(Math.abs(at60.actorX - at120.actorX) < .15, "camera easing must remain effectively frame-rate independent");
const reduced = cameras.update("reduced", { profile: "gooddogs.sideview", targetX: 500, targetY: 0, viewportW: 240, worldW: 1800, facingX: 1, reducedMotion: true, nowMs: 0 });
assert.strictEqual(reduced.actorX, 500, "reduced-motion mode must remove cinematic lookahead");

const animations = context.TechOpsAnimationController;
const dogFrames = { kat_idle0: [0], kat_idle1: [0], kat_strike: [0], kat_pounce: [0], kat_shield: [0], kat_wall_hit: [0], kat_down: [0], kat_leap: [0], kat_roll: [0] };
const walk = animations.dogFrame("katrin", { hp: 100, onGround: true, vx: 2 }, 160, dogFrames);
assert.strictEqual(walk.coverage, "source-art-required");
assert.ok(/^kat_idle[01]$/.test(walk.key), "missing locomotion must hold approved idle art, never relabel an action/down pose");
const strike = animations.dogFrame("katrin", { hp: 100, onGround: true, jabAnim: 1 }, 0, dogFrames);
assert.strictEqual(strike.state, "attack");
assert.ok(/^kat_(strike|pounce)$/.test(strike.key));
assert.strictEqual(animations.resolve("nightcrawler", { dash: true }, 0, { heavy0: [0], heavy1: [0] }), null, "Night dash gaps must not borrow heavy-attack art");
const coverage = animations.coverage();
assert.strictEqual(coverage.goodDogs.walk, "source-art-required");
assert.strictEqual(coverage.nightCrawler.locomotion, "run-integrated-walk-required");

const atlasSource = fs.readFileSync("katrin_manchez.atlas.js", "utf8");
assert.ok(!/kat_idle[2-9]|man_idle[2-9]/.test(atlasSource), "unrelated source poses may not be aliased as extra idle/locomotion frames");

const png = fs.readFileSync("assets/cinematic/m3_orbital_prison_breach.png");
assert.strictEqual(png.toString("ascii", 1, 4), "PNG");
assert.strictEqual(png.readUInt32BE(16), 768);
assert.strictEqual(png.readUInt32BE(20), 512);
assert.ok(png.length > 100000, "M3 mixed-media backplate must be a substantive authored asset");

console.log("Cinematic systems, exact level inventory, animation semantics, camera determinism, and M3 mixed-media asset: PASS");
