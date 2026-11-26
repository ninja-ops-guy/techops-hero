"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const src = fs.readFileSync("v736_hooks.js", "utf8");
for (const active of ["manchez", "katrin"]) {
  for (const mismatch of ["none", "mission", "world"]) {
    const campaign = { m: 3, evidence: ["signal"], playMode: "solo", campaignOrigin: "standalone" };
    const world = { x: 120, _v736: { m: 3, active, chars: {} } };
    const s = { nightMode: world, meta: { _v736: campaign } };
    const ctx = { S: s, NM: world, performance, console,
      document: { getElementById: () => null }, addEventListener() {}, exitNight() {},
      dlg(title, body, options) { ctx.dialog = { title, options }; }, closeDlg() {},
      nmLoadDistrict() { ctx.loads++; }, loads: 0,
      enterNight() { ctx.enters++; }, enters: 0,
      save() { ctx.writes++; }, writes: 0
    };
    ctx.window = ctx;
    vm.runInNewContext(src, ctx);
    // The exposed start API mounts the real campaign state and combat initializer.
    assert.ok(ctx.v736.start({ mission: 3, directGameplay: true }));
    const failed = world._v736;
    failed.active = active;
    const partner = active === "katrin" ? "manchez" : "katrin";
    failed.chars[partner].out = true;
    ctx.exitNight(false);
    assert.match(ctx.dialog.title, /MISSION FAILED/);
    const retry = ctx.dialog.options[0].f;
    if (mismatch === "mission") campaign.m = 4;
    if (mismatch === "world") s.nightMode = {};
    const before = JSON.stringify(s.meta);
    retry();
    if (mismatch === "none") {
      assert.equal(ctx.NM, world);
      assert.equal(s.nightMode, world);
      assert.notEqual(world._v736, failed);
      assert.equal(world._v736.active, active);
      assert.equal(world._v736.m, 3);
      assert.equal(world._v736.resolving, false);
      assert.equal(world.hp, world._v736.chars[active].maxHp);
      assert.equal(world._v736.chars[partner].out, false);
      retry();
      assert.equal(ctx.loads, 2);
    } else {
      assert.equal(world._v736, failed);
      assert.equal(ctx.loads, 1);
      assert.equal(ctx.dialog.title, "Retry unavailable");
    }
    assert.equal(JSON.stringify(s.meta), before);
    assert.equal(ctx.writes, 0);
    assert.equal(ctx.enters, 0);
  }
}
console.log("Good Dogs failure-dialog retry: PASS");
