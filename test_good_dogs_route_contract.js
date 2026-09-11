"use strict";

const assert = require("assert");
const fs = require("fs");
const vm = require("vm");

const read = file => fs.readFileSync(file, "utf8");
const hard = read("good_boys_button_hard_fix.js");
const flight = read("good_boys_ship_flight.js");
const progression = read("good_boys_progression_authority.js");
const world = read("good_boys_bible_world.js");
const runtime = read("v736_hooks.js");
const board = read("katrin_manchez.atlas.js");
const browserDriver = read("scripts/good_dogs_route_driver.mjs");
const html = read("index.html");
for (const [file, source] of [["hard", hard], ["flight", flight], ["progression", progression], ["world", world], ["runtime", runtime], ["board", board]]) {
  assert.doesNotThrow(() => new Function(source), `${file} must parse`);
}

assert.ok(hard.includes("VERSION=14"));
assert.ok(hard.includes("function freshConfig(){return{mission:1"), "a fresh campaign must begin at M1");
const openingSignal = hard.indexOf('GoodDogsCutscenes.play("GD_CUT_01"');
assert.ok(openingSignal >= 0 && hard.indexOf("return mount(cfg,source)", openingSignal) > openingSignal, "GD_CUT_01 must hand off to playable M1");
assert.ok(hard.includes("freshStoryStart:cfg.fresh") && hard.includes("resume:!cfg.fresh"), "fresh and resume routes must remain explicit");
assert.ok(!html.includes('src="good_boys_intro_repair.js'), "obsolete direct-to-M2 intro may not be parser loaded");
assert.ok(html.indexOf("cinematic_systems.js") < html.indexOf("night_hooks.js"), "shared cinematic contracts must exist before runtime consumers");

assert.ok(world.includes("_gbWaldoTrailComplete") && world.includes("x>=1425"), "M1 must make the Waldo trail playable through the Hidden Bay");
assert.ok(/_gbHiddenBayEntered\s*=\s*true/.test(runtime) && runtime.includes('missionWin736();'), "M1 requires an explicit Hidden Bay interaction");
assert.ok(!runtime.includes("cs.towers.every"), "M2 may not retain obsolete uplink-tower completion");
assert.ok(runtime.includes("Hidden Bay completion is owned by the explicit BOARD action"));
assert.ok(runtime.includes("clearMissionTransients736()"), "mission-local discovery/boarding flags must not leak into the next level");
assert.ok(board.includes('BOARD_X=1210')&&board.includes('s.p.advance(3,"boarded-secret-ship-button")'), "the mounted M2 BOARD action must require reaching the ship and request the exit sequence");
assert.ok(browserDriver.includes("GOOD_DOGS_CONTRACT_VERSION=14"), "browser acceptance must track the M1-first v14 contract");
assert.ok(browserDriver.includes("page.keyboard.down('ArrowRight')")&&browserDriver.includes("page.keyboard.press('KeyE')"), "browser acceptance must traverse M1/M2 through player input");
assert.ok(!browserDriver.includes("testPrimeClear")&&!browserDriver.includes("testPrimeComplete"), "M1/M2 browser acceptance may not use encounter fixtures");

const order = [
  "showDeckInteraction()",
  'c.play("GD_CUT_02"',
  "return flightPromise()",
  "o.showCrashScene()",
  "n._gbBoardSequenceComplete=true",
  'origAdvance(3,"m2-board-flight-crash-complete")'
].map(marker => {
  const i = flight.indexOf(marker);
  assert.ok(i >= 0, `boarding sequence missing ${marker}`);
  return i;
});
for (let i = 1; i < order.length; i++) assert.ok(order[i] > order[i - 1], "M2 must remain persisted until deck → film → flight → crash all complete");
assert.ok(flight.includes("Canonical Good Ship asset failed to load") && flight.includes("resetBoard()"), "asset/media failure must fail closed in M2 with a recoverable board action");

const context = {
  console,
  Date,
  Math,
  Object,
  Array,
  Number,
  String,
  isFinite,
  performance: { now: () => 1000 },
  S: { inDialog: false, meta: { _v736: { m: 1, evidence: [], k: false, waldo: false, done: false } } },
  NM: {
    x: 100,
    enemies: [],
    _v736: { m: 1, ending: false, chars: { katrin: {}, manchez: {} }, partner: { x: 110 }, evidence: [] }
  },
  save() {},
  setInterval() { return 1; },
  clearInterval() {},
  setTimeout() { return 1; },
  clearTimeout() {},
  document: { documentElement: {}, querySelectorAll() { return []; }, getElementById() { return null; } }
};
context.globalThis = context;
vm.createContext(context);
vm.runInContext(read("cinematic_systems.js"), context, { filename: "cinematic_systems.js" });
vm.runInContext(progression, context, { filename: "good_boys_progression_authority.js" });
const authority = context.TechOpsGoodBoysProgressionAuthority;

function setMission(m) {
  context.S.meta._v736.m = m;
  context.NM._v736 = { m, ending: false, chars: { katrin: {}, manchez: {} }, partner: { x: context.NM.x + 10 }, evidence: [] };
  return context.NM._v736;
}
let c = setMission(1);
assert.strictEqual(authority.completionStatus(1).ok, false);
context.NM._gbWaldoTrailComplete = true;
context.NM._gbHiddenBayEntered = true;
assert.strictEqual(authority.completionStatus(1).ok, true);
c = setMission(2);
assert.strictEqual(authority.completionStatus(2).ok, false);
context.NM._gbBoardSequenceComplete = true; c._gbBoardSequenceComplete = true;
assert.strictEqual(authority.completionStatus(2).ok, true);
c = setMission(3); c.prisonOpsV2 = { complete: true };
assert.strictEqual(authority.completionStatus(3).ok, true);
c = setMission(4); c.evidence = [{ found: true }, { found: true }, { found: true }]; c.cellOpened = true; c._gbCell118AmbushCommitted = true; c._gbCell118AmbushCleared = true;
assert.strictEqual(authority.completionStatus(4).ok, true);
c = setMission(5); c._gbAccessNodeSeized = true;
assert.strictEqual(authority.completionStatus(5).ok, true);
c = setMission(6); c._gbDecryptComplete = true; c._gbFinalWaveComplete = true; c._gbWaldoFreed = true; c.uplink = { hp: 1 };
assert.strictEqual(authority.completionStatus(6).ok, true);
c = setMission(7); c._gbWardenTandemDefeated = true;
assert.strictEqual(authority.completionStatus(7).ok, false, "defeating the Warden alone may not complete M7");
c._gbShuttleReached = true;
assert.strictEqual(authority.completionStatus(7).ok, true);

console.log("Good Dogs M1→M8 objective gates and M1→M3 cinematic continuity: PASS");
