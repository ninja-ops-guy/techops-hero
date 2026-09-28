"use strict";
const assert = require("assert");
const fs = require("fs");
const vm = require("vm");
const world = require("./runtime_day_world.js");
const gameSource = fs.readFileSync(require.resolve("./game.js"), "utf8");
const mapSource = gameSource.slice(gameSource.indexOf("const SRV ="), gameSource.indexOf("function freeSpot("));
let campaign = { flags: {}, tickets: {}, investigations: {}, evidence: {} };
global.TechOpsCampaign = { load() { return campaign; } };
function makeMap(seed) {
  function rand() { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; }
  const math = Object.create(Math); math.random = rand;
  const context = vm.createContext({ MAPW: 42, MAPH: 32, Math: math, R: (a, b) => a + Math.floor(rand() * (b - a + 1)), pick: a => a[Math.floor(rand() * a.length)] });
  vm.runInContext(mapSource, context);
  return JSON.parse(JSON.stringify(context.genMap()));
}
function setup(seed = 1) {
  const map = makeMap(seed);
  const contacts = [
    { id: "campaign_standup", name: "Standup board", x: 34, y: 12 },
    { id: "campaign_shipping", name: "Shipping clerk", x: 8, y: 26 },
    { id: "campaign_plating", name: "Plating operator", x: 18, y: 26 },
    { id: "campaign_access", name: "Security Ops", x: 38, y: 12 }
  ];
  contacts.forEach(n => { map[n.y][n.x] = 0; });
  global.S = { day: 1, px: 21, py: 16, map, npcs: contacts, meta: { campaignAct1Native: { standup: { x: 34, y: 12 }, shipping: { x: 8, y: 26 }, plating: { x: 18, y: 26 }, access: { x: 38, y: 12 }, sector04Door: { x: 20, y: 28 } } } };
  return global.S;
}
function assertPath(route) {
  assert(route.ok, route.message);
  const s = global.S;
  assert.deepStrictEqual(route.path[0], { x: s.px, y: s.py });
  route.path.forEach((p, i) => {
    assert.strictEqual(s.map[p.y][p.x], 0, "route crosses a solid tile");
    assert(!s.npcs.some(n => n.x === p.x && n.y === p.y), "route crosses an NPC");
    if (i) assert.strictEqual(Math.abs(p.x - route.path[i - 1].x) + Math.abs(p.y - route.path[i - 1].y), 1, "route skips a tile");
  });
  const end = route.path[route.path.length - 1];
  assert.strictEqual(Math.abs(end.x - route.target.x) + Math.abs(end.y - route.target.y), 1);
}
// Exercise the actual procedural floor generator, rather than an all-floor fake.
for (let seed = 1; seed <= 24; seed++) {
  const s = setup(seed), start = { x: s.px, y: s.py }, canon = JSON.stringify(campaign), before = s.map.map(row => row.slice());
  assert(world.ensureWorld());
  const stations = world.stations();
  assert.strictEqual(stations.length, 13);
  assert.strictEqual(new Set(stations.map(a => `${a.x},${a.y}`)).size, 13);
  stations.forEach(item => {
    assert(item.available, `${seed}: ${item.id} unavailable`);
    assert.strictEqual(before[item.y][item.x], 0, "must not overwrite a wall or production equipment");
    assertPath(world.route(item.id));
  });
  assert.deepStrictEqual({ x: s.px, y: s.py }, start, "wayfinding must never teleport Mike");
  assert.strictEqual(JSON.stringify(campaign), canon, "world operations must not mutate campaign authority");
  const snapshot = JSON.stringify({ map: s.map, stations: s.meta.dayStations });
  assert(world.ensureWorld());
  assert.strictEqual(JSON.stringify({ map: s.map, stations: s.meta.dayStations }), snapshot, "setup is idempotent");
}
let s = setup(10); world.ensureWorld();
const desk = world.stations().find(a => a.id === "mike_desk");
s.px = s.meta.campaignAct1Native.standup.x; s.py = s.meta.campaignAct1Native.standup.y + 1;
assert(!world.deskNearby(), "standup cannot double as Mike's computer");
assert(!world.at("shipping_workstation"));
let route = world.route("mike_desk"); assertPath(route);
let end = route.path[route.path.length - 1]; s.px = end.x; s.py = end.y;
assert(world.deskNearby());
assert(world.nearby().some(a => a.id === "mike_desk"));
assert.strictEqual(world.route("mike_desk").status, "arrived");
const visibleCopies = world.stations(); visibleCopies[0].x = -100;
assert.notStrictEqual(world.stations()[0].x, -100, "UI cannot mutate stored locations");
assert.strictEqual(world.route("missing_device").status, "unavailable");

// Checkpoint restoration retains exact physical positions and occupied props.
const saved = JSON.parse(JSON.stringify(s)); global.S = saved;
assert(world.ensureWorld());
assert.deepStrictEqual(world.stations(), s.meta.dayStations.items);
assert(world.deskNearby());
global.S.nightMode = true;
assert.strictEqual(world.ensureWorld(), false); assert.strictEqual(world.at("mike_desk"), false);
assert.deepStrictEqual(world.nearby(), []); assert.strictEqual(world.nextObjective(), null);
global.S.nightMode = false;

// A blocked route is explicit; no wall removal, teleport or fabricated arrival.
s = setup(5); world.ensureWorld();
const blocked = world.stations().find(a => a.id === "mike_desk");
[[0, 1], [-1, 0], [1, 0], [0, -1]].forEach(([dx, dy]) => { s.map[blocked.y + dy][blocked.x + dx] = 1; });
const blockedPlayer = { x: s.px, y: s.py };
assert.strictEqual(world.route("mike_desk").status, "unreachable");
assert.deepStrictEqual({ x: s.px, y: s.py }, blockedPlayer);

// A changed procedural day must not reuse last day's saved map metadata.
s = setup(8); world.ensureWorld();
s.day = 2; s.map = makeMap(12); s.px = 21; s.py = 16; s.npcs = [];
assert(world.ensureWorld());
assert.strictEqual(s.meta.dayStations.day, 2);
world.stations().forEach(a => assertPath(world.route(a.id)));

// Objectives derive from the real campaign progression, never optional tickets.
s = setup(2); world.ensureWorld();
campaign = { flags: {}, tickets: {}, investigations: {}, evidence: {} };
assert.strictEqual(world.nextObjective().target, "standup");
campaign.flags.standup_completed = true;
assert.strictEqual(world.nextObjective().target, "mike_desk");
campaign.flags.day_work_unlocked = true;
assert.strictEqual(world.nextObjective().target, "shipping_printer");
campaign.investigations.shipping_cannot_print = { phase: "gather", evidence: ["printer_self_test"] };
assert.strictEqual(world.nextObjective().target, "shipping_workstation");
campaign.investigations.shipping_cannot_print.phase = "human_verify";
assert.strictEqual(world.nextObjective().target, "shipping");
campaign.tickets.shipping_cannot_print = { status: "resolved" };
assert.strictEqual(world.nextObjective().target, "plating_workstation");
campaign.tickets.plating_workstation_down = { status: "resolved" };
assert.strictEqual(world.nextObjective().target, "security_workstation");
campaign.evidence.ghostIdentityEvidence = { sources: [{ id: "badge_impossible_access" }] };
assert.strictEqual(world.nextObjective().target, "sector04Door");
campaign.flags.tuesday_morning_reached = true;
assert.strictEqual(world.nextObjective().target, "mike_desk");
console.log("PASS: Day physical world, 24 procedural maps, paths, proximity, checkpoint, mode and canon objectives");
