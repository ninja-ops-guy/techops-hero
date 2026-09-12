"use strict";
const assert = require("assert");
const fs = require("fs");
const vm = require("vm");
const facts = {};
const handlers = {};
const context = {
  console, Date, performance: { now: () => 1000 },
  S: { inDialog: false, inBattle: false, gameOver: false, meta: { _v736: { m: 5, k: true } } },
  NM: { x: 1070, enemies: [{ kind: "guard", hp: 50, alive: true }], _v736: { m: 5 } },
  NM_KINDS: { mikeindex: { hp: 300 }, guard: { hp: 50 }, hunter: { hp: 70 } },
  TechOpsGoodDogsCampaignState: { write: (key, value) => { facts[key] = value; } },
  document: { addEventListener: (name, fn) => { handlers[name] = fn; } }
};
context.S.nightMode = context.NM;
context.globalThis = context;
vm.runInNewContext(fs.readFileSync("good_boys_access_core_authority.js", "utf8"), context);
const api = context.TechOpsGoodBoysAccessCoreAuthority;
vm.runInNewContext(fs.readFileSync("good_boys_access_core_authority.js", "utf8"), context);
assert.strictEqual(context.TechOpsGoodBoysAccessCoreAuthority, api, "parser and deferred loads must share one authority");
const boss = context.NM.enemies.find(e => e.kind === "mikeindex");
assert.ok(boss, "M5 must spawn the Index");
assert.strictEqual(context.NM.enemies.length, 1, "premature security must wait for the Index");
assert.strictEqual(context.NM._v736._adds66, true, "legacy HP-triggered adds must remain deferred");
assert.strictEqual(api.seizeAccessNode(), false, "node cannot skip the live Index");
api.tick();
assert.strictEqual(context.NM.enemies.filter(e => e.kind === "mikeindex").length, 1, "ticks cannot duplicate the boss");
boss.hp = 0; boss.alive = false;
api.tick();
assert.strictEqual(facts.mike_index_defeated, true);
assert.strictEqual(context.NM._v736._gbMikeIndexDefeated, true);
assert.strictEqual(context.NM.enemies.filter(e => e.alive).length, 1, "deferred security must return exactly once");
assert.strictEqual(api.seizeAccessNode(), false, "security must clear before the node");
for (const enemy of context.NM.enemies) { enemy.hp = 0; enemy.alive = false; }
context.NM.x = 100;
assert.strictEqual(api.seizeAccessNode(), false, "node requires proximity");
context.NM.x = 1070;
context.S.inDialog = true;
let modalConsumed = false;
handlers.keydown({ key: "Enter", preventDefault() { modalConsumed = true; }, stopImmediatePropagation() { modalConsumed = true; } });
assert.strictEqual(modalConsumed, false, "dialogue must retain Enter ownership");
assert.strictEqual(context.NM._v736._gbAccessNodeSeized, undefined, "modal input cannot seize the Access Node");
context.S.inDialog = false;
let consumed = false;
handlers.keydown({ key: "e", preventDefault() {}, stopImmediatePropagation() { consumed = true; } });
assert.strictEqual(consumed, true);
assert.strictEqual(context.NM._v736._gbAccessNodeSeized, true, "real interaction completes the route-control objective");
api.tick();
assert.strictEqual(api.acceptance().securitySeeds, 1);
context.NM._v736 = { m: 5 };
context.NM.enemies = [];
api.tick();
assert.strictEqual(api.acceptance().mikeIndexCount, 1, "a fresh M5 retry must rebuild its encounter");
assert.strictEqual(api.seizeAccessNode(), false, "previous runtime completion cannot unlock a retry");
console.log("Good Dogs Index -> security -> Access Node sequence: PASS");
