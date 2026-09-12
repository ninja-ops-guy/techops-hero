"use strict";
const assert = require("node:assert/strict"), fs = require("node:fs"), vm = require("node:vm");
const source = fs.readFileSync("runtime_night.js", "utf8");
let passed = 0;
function test(name, run) { run(); passed++; console.log("PASS " + name); }
function fixture() {
  const store = new Map(), events = new Map(), claims = new Set();
  const c = { console, Math, Number, String, Object, Array, JSON, Date, Set, Map, document: null,
    S: { day: 1, clock: 900, budget: 100, weather: "storm", meta: {}, tickets: [{ age: 8 }], nightMode: null, inDialog: false },
    keys: { d: true }, joy: { x: 1, y: 0 }, oldClockCalls: 0, steps: 0, draws: 0, exits: 0, saves: 0,
    localStorage: { getItem: k => store.get(k) || null, setItem: (k, v) => store.set(k, String(v)), removeItem: k => store.delete(k) },
    addEventListener: (name, fn) => events.set(name, fn), dispatchEvent: e => { if (events.has(e.type)) events.get(e.type)(e); },
    CustomEvent: class { constructor(type, { detail }) { this.type = type; this.detail = detail; } },
    TechOpsPresentationDirector: { begin: () => { if (claims.size) return null; claims.add("claim"); return "claim"; }, end: t => claims.delete(t), isBlocking: () => claims.size > 0 },
    v725: { h: {}, definitions: {}, register(id, def) { this.definitions[id] ||= def; return true; }, play(id, done) { c.scene = { id, done }; return true; }, skip() { c.scene.done(); } },
    stepNM() { c.steps++; }, drawNM() { c.draws++; }, draw() {}, fmtClock: () => "old", save() { c.saves++; return true; },
    advanceClock(minutes) { c.oldClockCalls++; c.S.clock += minutes; c.S.tickets[0].age += minutes; },
    interact: () => "old-interact", closeDlg() { c.S.inDialog = false; },
    dlg(title, body, opts) { c.dialog = { title, body, opts }; c.S.inDialog = true; },
    exitNight() { if (!c.S.nightMode) return; c.exits++; c.S.budget += c.S.nightMode.cash; c.S.nightMode = null; c.TechOpsNightRuntime.endVisit(c.S); }
  };
  c.globalThis = c; c.window = c; vm.createContext(c); vm.runInContext(source, c);
  const api = c.TechOpsNightRuntime;
  c.enter = () => { api.beforeEnter(c.S); c.S.clock = Math.max(1080, c.S.clock); const n = { district: "home", street: 1, x: 1489, y: 396, w: 22, h: 34, cash: 37, kills: 2, done: {}, platforms: [], enemies: [] }; c.S.nightMode = n; api.onEntered(c.S, n); return n; };
  return { c, api, claims };
}
test("live Night clock advances independently of work tickets", () => {
  const { c, api } = fixture(); c.enter(); for (let i = 0; i < 100; i++) api.frame(.05);
  assert.equal(c.S.clock, 1081); assert.equal(c.steps, 100); assert.equal(c.oldClockCalls, 0); assert.equal(c.S.tickets[0].age, 8);
  assert.equal(c.advanceClock(20), true); assert.equal(c.S.clock, 1101); assert.equal(c.oldClockCalls, 0);
  assert.equal(c.S.weather, "storm"); assert.equal(c.S.nightMode._nightLifecycle.weather, "rain");
});
test("clock pauses for dialogue and does not catch up after a suspended frame", () => {
  const { c, api } = fixture(); c.enter(); c.S.inDialog = true; for (let i = 0; i < 100; i++) api.frame(.1); assert.equal(c.S.clock, 1080); assert.equal(c.steps, 0);
  c.S.inDialog = false; api.tick(3600); assert.equal(c.S.clock, 1080); assert.ok(c.S.nightMode._nightLifecycle.seconds <= .1);
});
test("midnight wraps display without incrementing the day or losing elapsed time", () => {
  const { c, api } = fixture(); c.enter(); c.S.clock = 1439; c.advanceClock(3); assert.equal(c.S.clock, 1442); assert.equal(c.fmtClock(c.S.clock), "00:02"); assert.equal(c.S.day, 1);
  assert.equal(api.advance(Infinity), false); assert.equal(api.advance(-20), false); assert.equal(c.S.clock, 1442);
});
test("travel time flows; Good Dogs and the day loop retain their own owners", () => {
  const { c, api } = fixture(); const n = c.enter(); n.drive = { t: 0, dur: 1500, to: "downtown" }; for (let i = 0; i < 50; i++) api.frame(.1); assert.equal(c.S.clock, 1081);
  n._v736 = { m: 3 }; const clock = c.S.clock, steps = c.steps; assert.equal(api.frame(.1), false); assert.equal(api.tick(5), false); assert.equal(c.S.clock, clock); assert.equal(c.steps, steps);
  delete n._v736; c.__productionDesiredMode = "goodboys"; assert.equal(api.frame(.1), false); c.__productionDesiredMode = null;
  c.S.nightMode = null; c.advanceClock(5); assert.equal(c.oldClockCalls, 1);
});
test("home entry requires the door, ground level, an idle drive, and the correct mode", () => {
  const { c, api } = fixture(), n = c.enter(); assert.equal(api.atHome(), true); n.x = 1770; assert.equal(api.atHome(), false); assert.equal(api.sleep(), false);
  n.x = 1489; n.y = 220; assert.equal(api.atHome(), false); n.y = 396; n._sector04 = {}; assert.equal(api.atHome(), false); delete n._sector04;
  n.drive = {}; assert.equal(api.atHome(), false); n.drive = null; assert.equal(api.openHome(), true); assert.match(c.dialog.title, /MIKE/); assert.equal(c.exits, 0);
  c.dialog.opts.find(o => /Stay out/.test(o.t)).f(); assert.equal(c.S.inDialog, false); assert.equal(c.S.nightMode, n);
});
test("sleep is cinematic, skippable, and settles the night exactly once", () => {
  const { c, api, claims } = fixture(); c.enter(); c.S.meta._char = "nightcrawler"; c.localStorage.setItem("techops_char", "nightcrawler"); c.__productionActiveMode = "nightcrawler";
  assert.equal(api.sleep(), true); assert.equal(c.scene.id, "night_home_return"); assert.equal(c.S.inDialog, true); assert.equal(c.exits, 0); assert.equal(api.sleep(), false);
  for (let i = 0; i < 100; i++) api.frame(.1); assert.equal(c.S.clock, 1080);
  c.v725.skip(); c.scene.done(); c.exitNight(true);
  assert.equal(c.exits, 1); assert.equal(c.S.budget, 137); assert.equal(c.S.nightMode, null); assert.equal(c.S.inDialog, false); assert.equal(claims.size, 0);
  assert.equal(c.localStorage.getItem("techops_char"), null); assert.equal(c.S.meta._char, undefined); assert.equal(c.__productionActiveMode, "day"); assert.equal(c.S.meta.nightVisit.active, false);
  assert.equal(c.keys.d, false); assert.equal(c.joy.x, 0);
});
test("a stale cinematic callback cannot exit or pay a replacement run", () => {
  const { c, api, claims } = fixture(); c.enter(); api.sleep(); const next = { day: 8, clock: 600, budget: 444, meta: {}, nightMode: null }; c.S = next; c.scene.done(); assert.equal(c.S, next); assert.equal(c.S.budget, 444); assert.equal(c.exits, 0); assert.equal(claims.size, 0);
});
test("a missing cinematic renderer offers an explicit continuation without a softlock", () => {
  const { c, api, claims } = fixture(); c.enter(); c.v725 = null; assert.equal(api.sleep(), true); assert.equal(c.exits, 0); c.dialog.opts[0].f(); assert.equal(c.exits, 1); assert.equal(claims.size, 0);
});
test("campaign menu is discoverable but does not grant missing evidence or progress", () => {
  const { c, api } = fixture(); c.enter(); const story = { campaign: { day: 1 }, flags: { day_work_unlocked: false }, evidence: {} }; c.TechOpsCampaign = { load: () => story };
  const before = JSON.stringify(story); api.openCampaign(); assert.match(c.dialog.body, /standup/); assert.equal(c.dialog.opts.some(o => /Enter Sector/.test(o.t)), false); assert.equal(JSON.stringify(story), before);
  story.flags.day_work_unlocked = true; api.openCampaign(); assert.match(c.dialog.body, /Identity evidence missing/); assert.equal(c.dialog.opts.some(o => /Enter Sector/.test(o.t)), true); assert.equal(story.evidence.ghostIdentityEvidence, undefined);
});
test("return to the same daytime investigation preserves facts and restores the pre-night clock", () => {
  const { c, api } = fixture(); c.enter(); const story = { campaign: { day: 1 }, flags: {}, evidence: { preserved: true } }; c.TechOpsCampaign = { load: () => story };
  api.resumeDay(); c.scene.done(); assert.equal(c.S.nightMode, null); assert.equal(c.S.clock, 900); assert.equal(c.S.day, 1); assert.equal(c.S.weather, "storm"); assert.equal(c.S.budget, 137); assert.deepEqual(story.evidence, { preserved: true });
});
test("day notices are scoped to state, day and mode generation", () => {
  const src = fs.readFileSync("game.js", "utf8"), body = src.slice(src.indexOf("function dayNotice("), src.indexOf("// ---------- game loop ----------"));
  const c = { S: { day: 1 }, hit: 0 }; c.window = c; vm.createContext(c); vm.runInContext(body, c);
  const original = c.dayNotice(() => c.hit++); original(); assert.equal(c.hit, 1); c.S.nightMode = {}; original(); assert.equal(c.hit, 1); c.S.nightMode = null; c.S._modeEpoch = 1; original(); assert.equal(c.hit, 1);
  const nextDay = c.dayNotice(() => c.hit++); c.S.day++; nextDay(); assert.equal(c.hit, 1); c.S = { day: 2 }; nextDay(); assert.equal(c.hit, 1);
});
test("Night loop bypasses day handlers without another parser script or private interval", () => {
  assert.match(fs.readFileSync("game.js", "utf8"), /!nightRuntime\.frame\(dt\)/);
  assert.match(fs.readFileSync("production_bootstrap.js", "utf8"), /"runtime_night\.js"/);
  assert.doesNotMatch(source, /setInterval\s*\(/);
  const hooks = fs.readFileSync("night_hooks.js", "utf8"); assert.doesNotMatch(hooks, /NM\.district === "home" && NM\.x[^\n]*exitNight/);
  assert.match(hooks, /!NM\._sector04 && NM\.x > NM_W - 110/);
  assert.match(fs.readFileSync("v735_hooks.js", "utf8"), /function canBattle\(s\)[^\n]*!s\.nightMode/);
});
// Exercise the real Sector 04 adapter's asynchronous launch and resume path.
const Campaign = require("./campaign_act1.js"), Sector = require("./campaign_sector04.js");
function sectorFixture() {
  const { c, api } = fixture(); c.TechOpsCampaign = Campaign; c.TechOpsSector04 = Sector;
  const story = Campaign.createInitialState(); Campaign.assignTicket(story, "shipping_cannot_print", "mike"); Campaign.assignTicket(story, "plating_workstation_down", "amit"); Campaign.assignTicket(story, "impossible_access_event", "mike"); Campaign.completeStandup(story); Campaign.completeWorkstation(story, { redInTheMirrorHeard: true, feliciaVideoSeen: true }); Campaign.save(story, c.localStorage);
  c.enterCalls = 0; c.enterNight = () => { c.enterCalls++; }; c.nmJab = () => {};
  vm.runInContext(fs.readFileSync("campaign_sector04_runtime.js", "utf8"), c); c.TechOpsSector04Runtime.install();
  return { c, api, rt: c.TechOpsSector04Runtime };
}
test("Sector 04 attaches once after Night Drive, without a second enter/reset", () => {
  const { c, rt } = sectorFixture(); assert.equal(rt.enterBrowser().pending, true); assert.equal(c.enterCalls, 1); c.enter(); assert.equal(c.S.nightMode.district, "sector04"); const n = c.S.nightMode; n.x = 750; rt.enterBrowser(); assert.equal(c.S.nightMode, n); assert.equal(n.x, 750); assert.equal(c.enterCalls, 1);
});
test("pending campaign entry is discarded if a different run takes over", () => {
  const { c, rt } = sectorFixture(); rt.enterBrowser(); c.S = { day: 1, clock: 900, meta: {}, nightMode: null }; c.enter(); assert.equal(c.S.nightMode.district, "home");
});
console.log(`Night lifecycle: ${passed} regression groups passed`);
