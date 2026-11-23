"use strict";
const assert = require("assert");
const fs = require("fs");
const vm = require("vm");
const world = require("./runtime_day_world.js");
const gameSource = fs.readFileSync(require.resolve("./game.js"), "utf8");
const mapSource = gameSource.slice(gameSource.indexOf("const SRV ="), gameSource.indexOf("function freeSpot("));
// Exercise the legacy step wrapper that used to let the standup board wander.
const legacyHooks = fs.readFileSync(require.resolve("./v67_hooks.js"), "utf8");
const wanderHook = legacyHooks.slice(legacyHooks.indexOf("  // ambient NPC wander"), legacyHooks.indexOf("  // ================= night parallax depth"));
const board = { x: 34, y: 12, ambient: true, campaignAct1: "campaign_standup" };
const ambient = { x: 25, y: 12, ambient: true };
const wanderContext = vm.createContext({
  S: { map: Array.from({ length: 20 }, () => Array(42).fill(0)), npcs: [board, ambient] },
  step() {}, performance: { now: () => 3000 }, pick: items => items[0], R: (() => {
    const offsets = [-1, 1];
    return () => offsets.shift();
  })()
});
vm.runInContext("Math.random = () => 0.1;\n" + wanderHook + "\nstep(0);", wanderContext);
assert.deepStrictEqual([board.x, board.y], [34, 12]);
assert.deepStrictEqual([ambient.x, ambient.y], [24, 13]);

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

// A marked field route that crosses an automatic side-room boundary keeps its
// floor scene. Walking the same tiles for the standup retains native room entry.
{
  const original = s;
  const field = setup(10); world.ensureWorld();
  const toSecurity = world.route("access"); assertPath(toSecurity);
  const [start, next] = toSecurity.path;
  assert(next, "fixture crosses a biome boundary along its active floor route");
  const detour = [[0, 1], [-1, 0], [1, 0], [0, -1]].map(([dx, dy]) => ({ x: start.x + dx, y: start.y + dy })).find(p =>
    field.map[p.y]?.[p.x] === 0 && (p.x !== next.x || p.y !== next.y) && !field.npcs.some(n => n.x === p.x && n.y === p.y));
  assert(detour, "fixture also has a non-route doorway step");
  const roomScript = fs.readFileSync(require.resolve("./v69_hooks.js"), "utf8");
  const roomStep = roomScript.slice(roomScript.indexOf("// ---------- enter/exit detection"), roomScript.indexOf("// ---------- interaction ----------"));
  let move = null;
  const settings = {};
  const roomContext = vm.createContext({ S: field, SIDE_BIOMES: ["itdept"], V67SET: settings, window: { V67SET: settings, TechOpsDayWorld: world },
    biomeAt: (x, y) => [next, detour].some(p => x === p.x && y === p.y) ? { id: "itdept" } : null,
    enterRoom: room => { field.room = room; }, nearClueOrFel: () => false,
    step: () => { if (move) { field.px = move.x; field.py = move.y; } } });
  vm.runInContext(roomStep, roomContext);
  roomContext.step(0);
  // The outer movement owner can arrive before this wrapper observes the entry.
  field.px = next.x; field.py = next.y;
  roomContext.step(0);
  assert.strictEqual(field.room, undefined, "follow the marked Security route across the floor");
  assert(world.followsFloorRoute(start.x, start.y));
  assert(!world.followsFloorRoute(next.x, next.y), "standing still cannot suppress auto-entry");
  move = start; roomContext.step(0);
  move = detour; roomContext.step(0);
  assert.strictEqual(field.room.id, "itdept", "a route marker does not block a deliberate detour");
  delete field.room;
  move = start; roomContext.step(0);
  world.route("standup");
  move = next; roomContext.step(0);
  assert.strictEqual(field.room.id, "itdept", "keep the authored standup approach through the IT side room");
  delete field.room;
  move = start; roomContext.step(0);
  world.route(null);
  field.day = 2;
  field.map = field.map.map(row => row.slice());
  move = next; roomContext.step(0);
  assert.strictEqual(field.room, undefined, "a new Tuesday map seeds its own spawn biome without entering a side room");
  move = start; roomContext.step(0);
  move = next; roomContext.step(0);
  assert.strictEqual(field.room.id, "itdept", "a later walk into a side room still works on Tuesday");
  global.S = original;
}

// Checkpoint restoration retains exact physical positions and occupied props.
const saved = JSON.parse(JSON.stringify(s)); global.S = saved;
assert(world.ensureWorld());
assert.deepStrictEqual(world.stations(), s.meta.dayStations.items);
assert(world.deskNearby());
global.S.nightMode = true;
assert.strictEqual(world.ensureWorld(), false); assert.strictEqual(world.at("mike_desk"), false);
assert.deepStrictEqual(world.nearby(), []); assert.strictEqual(world.nextObjective(), null);
global.S.nightMode = false;
global.S.room = { id: "office", x: 180 };
assert.strictEqual(world.at("mike_desk"), false, "a side-room's stale entry coordinates cannot authorize floor work");
assert.strictEqual(world.deskNearby(), false);
assert.deepStrictEqual(world.nearby(), []);
assert.strictEqual(world.route("mike_desk").status, "unavailable");
assert.strictEqual(world.currentRoute(), null);
assert.strictEqual(world.render({}), false, "floor markers must not paint over side-view interiors");
global.S.room = null;
assert(world.deskNearby(), "exiting the room restores physical floor proximity");

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
assert.strictEqual(world.ticketObjective("shipping_cannot_print", campaign), null);
campaign.flags.workstation_checked = true;
assert.strictEqual(world.nextObjective().phase, "music");
campaign.flags.red_in_mirror_heard = true;
assert.strictEqual(world.nextObjective().phase, "company");
campaign.flags.felicia_video_watched = true;
assert.strictEqual(world.nextObjective().phase, "clock_in");
campaign.flags.day_work_unlocked = true;
assert.strictEqual(world.nextObjective().target, "shipping");
const beforeBriefings = JSON.stringify(campaign);
assert(world.markBriefed("plating"));
assert(!world.markBriefed("plating"), "repeated briefing is idempotent");
assert(!world.markBriefed("unknown"));
assert.strictEqual(world.nextObjective().target, "plating_workstation", "existing field work takes priority over unanswered intake");
assert(world.markBriefed("shipping"));
assert.strictEqual(JSON.stringify(campaign), beforeBriefings, "briefing and guidance do not change campaign evidence or gates");
assert.strictEqual(world.nextObjective().target, "shipping_printer");
campaign.investigations.shipping_cannot_print = { phase: "gather", evidence: ["printer_self_test"] };
assert.strictEqual(world.nextObjective().target, "shipping_workstation");
campaign.investigations.shipping_cannot_print.evidence = ["queue_trace", "compare_user"];
assert.strictEqual(world.nextObjective().phase, "diagnose", "sufficient screen evidence does not require a redundant printer test");
campaign.investigations.shipping_cannot_print.phase = "remediate";
assert.strictEqual(world.nextObjective().phase, "repair");
campaign.investigations.shipping_cannot_print.phase = "technical_check";
assert.strictEqual(world.nextObjective().phase, "technical");
campaign.investigations.shipping_cannot_print.phase = "human_verify";
assert.strictEqual(world.nextObjective().target, "shipping");
s.room = { id: "itdept" };
assert.strictEqual(world.ticketObjective("shipping_cannot_print", campaign).target, "shipping", "Doors can read a ticket route from the side-view desk");
s.room = null;
campaign.tickets.shipping_cannot_print = { status: "resolved" };
assert.strictEqual(world.ticketObjective("shipping_cannot_print", campaign), null);
assert.strictEqual(world.nextObjective().target, "plating_workstation");
campaign.investigations.plating_workstation_down = { phase: "remediate", evidence: ["local_login", "integration_service"] };
assert.strictEqual(world.nextObjective().phase, "coordinate");
s.meta.dayOperatorHolds = { plating_workstation_down: true };
assert.strictEqual(world.nextObjective().phase, "repair");
campaign.tickets.plating_workstation_down = { status: "resolved" };
assert.strictEqual(world.nextObjective().target, "access");
assert(world.markBriefed("access"));
assert.strictEqual(world.nextObjective().target, "security_workstation");
campaign.assignments = { impossible_access_event: "security" };
assert.match(world.nextObjective().detail, /Security’s findings/);
campaign.evidence.ghostIdentityEvidence = { sources: [{ id: "badge_impossible_access" }] };
assert.strictEqual(world.nextObjective().target, "sector04Door");
campaign.flags.tuesday_morning_reached = true;
s.day = 2;
assert.strictEqual(world.nextObjective().target, "mike_desk");
const nextShiftShipping = { ticketId: "shipping_cannot_print", kind: "stable", phase: "complete", evidence: [] };
const nextShiftPlating = { ticketId: "plating_workstation_down", kind: "restore", phase: "gather", evidence: [] };
global.TechOpsCampaign.workdayHandoff = () => [nextShiftShipping, nextShiftPlating];
assert.strictEqual(world.nextObjective().target, "plating");
nextShiftPlating.evidence.push("requester");
assert.strictEqual(world.nextObjective().target, "plating_workstation");
nextShiftPlating.evidence.push("technical");
assert.strictEqual(world.nextObjective().phase, "diagnose");
nextShiftPlating.phase = "technical_check";
assert.strictEqual(world.nextObjective().phase, "technical");
nextShiftPlating.phase = "human_verify";
assert.strictEqual(world.nextObjective().target, "plating");
nextShiftPlating.phase = "complete";
assert.strictEqual(world.nextObjective().target, "mike_desk");
nextShiftShipping.kind = "carryover";
nextShiftShipping.phase = "carryover";
assert.strictEqual(world.nextObjective().target, "mike_desk", "the original incident cannot be reopened after a later closure");
delete campaign.tickets.shipping_cannot_print;
delete campaign.investigations.shipping_cannot_print;
assert.strictEqual(world.nextObjective().phase, "briefing", "yesterday’s briefing does not count as this morning’s intake");

// Real native contact placement can put a requester in a one-tile service bay.
// Reproduce that full map/contact/world stack; geometry-only checks missed it.
const fullMapSource = gameSource.slice(gameSource.indexOf("const SRV ="), gameSource.indexOf("// ---------- day setup"));
const nativeSources = ["campaign_act1.js", "campaign_native_act1.js", "runtime_day_world.js"].map(name => fs.readFileSync(require.resolve("./" + name), "utf8"));
for (let seed = 1; seed <= 60; seed++) {
  let randomState = seed;
  function random() { randomState = (Math.imul(randomState, 1664525) + 1013904223) >>> 0; return randomState / 4294967296; }
  const math = Object.create(Math); math.random = random;
  const storage = new Map();
  const context = vm.createContext({
    MAPW: 42, MAPH: 32, Math: math, R: (a, b) => a + Math.floor(random() * (b - a + 1)), pick: a => a[Math.floor(random() * a.length)], clamp: (x, a, b) => Math.max(a, Math.min(b, x)),
    localStorage: { getItem: k => storage.get(k) || null, setItem: (k, v) => storage.set(k, String(v)) }
  });
  vm.runInContext(fullMapSource, context);
  vm.runInContext("S={day:1,map:genMap(),px:21,py:16,npcs:[],meta:{}};", context);
  nativeSources.forEach(source => vm.runInContext(source, context));
  const n = context.TechOpsCampaignNativeAct1, w = context.TechOpsDayWorld, game = context.S;
  if (game.map[26][8] === 0 && seed % 2 === 0) game.devices = [{ x: 8, y: 26 }];
  if (game.map[26][8] === 0 && seed % 2 === 1) game._nightObjs = { ramps: [{ id: "dock", x: 8, y: 26 }] };
  if (game.map[26][18] === 0 && seed % 3 === 0) game.npcs.push({ id: "production-coworker", x: 18, y: 26 });
  n.ensureWorld();
  for (const [id, x, y, district] of [["shipping", 8, 26, "factory"], ["plating", 18, 26, "factory"], ["access", 38, 12, "office"]]) {
    const p = game.meta.campaignAct1Native[id];
    assert.strictEqual(context.zoneAt(p.x, p.y), district, `native seed ${seed}: ${id} belongs in ${district}`);
    assert(Math.abs(p.x - x) + Math.abs(p.y - y) <= 3, `native seed ${seed}: ${id} lost its work area`);
    assert(w.route(id).ok, `native seed ${seed}: ${id} unreachable from arrival`);
    assert(!(game.devices || []).some(device => device.x === p.x && device.y === p.y), `${id} overlaps a device`);
    assert(!game._nightObjs?.ramps.some(ramp => ramp.x === p.x && ramp.y === p.y), `${id} overlaps a ramp`);
    assert.strictEqual(game.npcs.filter(npc => npc.x === p.x && npc.y === p.y).length, 1, `${id} overlaps another person`);
  }
  const initiallyReachable = ["standup", "shipping", "plating", "access"].filter(id => w.route(id).ok);
  assert(w.ensureWorld());
  initiallyReachable.forEach(id => assert(w.route(id).ok, `native seed ${seed}: station placement blocked ${id}`));
  const placed = w.stations();
  assert.strictEqual(placed.length, 13);
  placed.forEach(item => {
    assert(item.available, `native seed ${seed}: missing ${item.id}`);
    assert.strictEqual(game.map[item.approach.y][item.approach.x], 0, "stored approach must survive all later placements");
    assert(!game.npcs.some(npc => npc.x === item.approach.x && npc.y === item.approach.y));
    const route = w.route(item.id);
    assert(route.ok, `native seed ${seed}: station-to-station route ${item.id} blocked`);
    const end = route.path[route.path.length - 1];
    game.px = end.x; game.py = end.y;
    assert(w.at(item.id));
  });
  initiallyReachable.forEach(id => assert(w.route(id).ok, `native seed ${seed}: requester inaccessible from final station ${id}`));
}

// Upgrade an existing physical-world checkpoint without leaving orphan props.
s = setup(9); world.ensureWorld();
const oldItems = JSON.parse(JSON.stringify(s.meta.dayStations.items));
s.meta.dayStations.version = 1;
global.S = JSON.parse(JSON.stringify(s));
assert(world.ensureWorld());
assert.strictEqual(global.S.meta.dayStations.version, world.VERSION);
world.stations().forEach(item => assertPath(world.route(item.id)));
const currentTiles = new Set(world.stations().filter(item => item.available).map(item => `${item.x},${item.y}`));
oldItems.filter(item => item.available && !currentTiles.has(`${item.x},${item.y}`)).forEach(item => assert.strictEqual(global.S.map[item.y][item.x], 0));
console.log("PASS: Day physical world, 24 generated maps + 60 real native-placement maps, routes, service access, migration, proximity, mode and canon objectives");

// Authored office landmarks coexist with procedural stations and old checkpoints.
for(let seed=1;seed<=12;seed++){
  const s=setup(seed);world.ensureWorld();const old=world.stations().find(x=>x.id==='mike_desk');
  s.meta.dayStations.version=2;
  global.MIKE_DESK={x:31,y:15};global.COWORKERS=[{id:'nick',x:30,y:13},{id:'amit',x:33,y:13},{id:'brandon',x:36,y:13},{id:'daniel',x:35,y:16}];
  // Same authored room geometry used by office_hooks.setupDay.
  for(let y=10;y<=17;y++)for(let x=28;x<=41;x++)s.map[y][x]=(y===10||y===17||x===28||x===41)?1:0;
  s.map[17][39]=s.map[17][40]=0;s.map[15][31]=2;
  // Recreate a v2 save after authored geometry, preserving its owned props.
  s.meta.dayStations.items.filter(x=>x.available).forEach(x=>s.map[x.y][x.x]=x.art);
  global.COWORKERS.forEach(n=>s.map[n.y][n.x]=0);
  world.ensureWorld();const desk=world.stations().find(x=>x.id==='mike_desk');
  assert.equal(desk.x,31);assert.equal(desk.y,15);assert(desk.authored);assert(desk.available);assert(world.route('mike_desk').ok);
  if(old.x!==31||old.y!==15)assert.equal(s.map[old.y][old.x],0,'old phantom desk removed');
  global.COWORKERS.forEach(n=>assert.equal(s.map[n.y][n.x],0,'coworker position preserved'));
  delete global.MIKE_DESK;delete global.COWORKERS;
}
console.log('PASS authored office desk reuse, coworker positions and v2 checkpoint migration');
