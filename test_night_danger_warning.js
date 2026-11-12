/* Contract tests for night_danger_warning.js (verifier v8) — Node, no browser. */
"use strict";
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const SRC = fs.readFileSync(path.join(__dirname, "night_danger_warning.js"), "utf8");

let passed = 0, failed = 0;
function ok(cond, name) {
  if (cond) { passed++; console.log("  ✓ " + name); }
  else { failed++; console.log("  ✗ " + name); }
}

function mkSandbox(opts = {}) {
  const NM = opts.NM || null;
  const calls = { sfx: [], step: 0 };
  const domcbs = [];
  const sandbox = {
    console,
    performance: { now: () => sandbox.__now },
    __now: 1000,
    S: opts.hasNight === false ? {} : { nightMode: NM },
    step: function (dt) { calls.step++; return "step-ret"; },
    sfx: k => calls.sfx.push(k),
    document: { addEventListener: (ev, cb) => { if (ev === "DOMContentLoaded") domcbs.push(cb); } },
  };
  if (opts.noStep) delete sandbox.step;
  sandbox.window = {};
  if (opts.combatActive) sandbox.window.TechOpsNightCombat = { active: () => true };
  // module assigns window.TechOpsNightDanger; bare S/step/sfx resolve via sandbox globals
  vm.createContext(sandbox);
  vm.runInContext(SRC, sandbox, { filename: "night_danger_warning.js" });
  return { sandbox, NM, calls, fireDOM: () => domcbs.forEach(cb => cb()) };
}

const mkNM = (hp) => ({ hp, msg: "", msgT: 0, x: 200, w: 22, enemies: [], clear: false });

// 1. surface
{
  const { sandbox } = mkSandbox();
  const api = sandbox.window.TechOpsNightDanger;
  ok(api && api.WARN_HP === 25 && api.CRIT_HP === 10 && api.REARM_HP === 45 && typeof api.reset === "function",
    "exposes TechOpsNightDanger with thresholds + reset()");
}

// 2. hp 60 → 24: critical warning + sfx, once
{
  const NM = mkNM(60);
  const { sandbox, calls } = mkSandbox({ NM });
  sandbox.step(16); // healthy frame
  NM.hp = 24;
  sandbox.step(16);
  ok(NM.msg.includes("CRITICAL HP") && NM.msgT === 2600 && calls.sfx.length === 1 && calls.sfx[0] === "bad",
    "hp drops to 24 → critical warning + sfx('bad')");
}

// 3. warning fires once per crossing
{
  const NM = mkNM(24);
  const { sandbox, calls } = mkSandbox({ NM });
  sandbox.step(16); sandbox.step(16); sandbox.step(16);
  ok(calls.sfx.length === 1, "warning fires once while hp stays low");
  ok(NM.msg.includes("CRITICAL HP"), "message remains the warning");
}

// 4. hp ≤ 10 escalates even when already warned
{
  const NM = mkNM(24);
  const { sandbox, calls } = mkSandbox({ NM });
  sandbox.__now = 1000; sandbox.step(16); // warn stage 1
  sandbox.__now = 5000; NM.hp = 8; NM.msgT = 0; NM.msg = "";
  sandbox.step(16);
  ok(NM.msg.includes("ONE HIT FROM DOWN") && calls.sfx.length === 2, "hp ≤ 10 → urgent escalation");
}

// 5. heal above 45 re-arms
{
  const NM = mkNM(24);
  const { sandbox, calls } = mkSandbox({ NM });
  sandbox.step(16); // warned
  NM.hp = 60; sandbox.step(16); // re-arm
  NM.hp = 20; NM.msgT = 0; sandbox.step(16);
  ok(calls.sfx.length === 2 && NM.msg.includes("CRITICAL HP"), "heal above 45 re-arms the warning");
}

// 6. live message not stomped; warning lands after expiry
{
  const NM = mkNM(24);
  NM.msg = "💥 Street Thug hits you!"; NM.msgT = 5000;
  const { sandbox, calls } = mkSandbox({ NM });
  sandbox.step(16); // msgT 5000 > now 1000 → blocked
  ok(NM.msg === "💥 Street Thug hits you!" && calls.sfx.length === 0, "live hit message not stomped");
  sandbox.__now = 6000; NM.msg = "";
  sandbox.step(16);
  ok(NM.msg.includes("CRITICAL HP") && calls.sfx.length === 1, "warning lands after message expires");
}

// 7. no night mode → silent
{
  const { sandbox, calls } = mkSandbox({ hasNight: false });
  sandbox.step(16);
  ok(calls.sfx.length === 0, "no night mode → silent");
}

// 8. TechOpsNightCombat active → silent
{
  const NM = mkNM(10);
  const { sandbox, calls } = mkSandbox({ NM, combatActive: true });
  sandbox.step(16);
  ok(calls.sfx.length === 0 && NM.msg === "", "TechOpsNightCombat active → silent");
}

// 9. new NM object resets state
{
  const NM1 = mkNM(24);
  const { sandbox, calls } = mkSandbox({ NM: NM1 });
  sandbox.step(16); // warned on NM1
  const NM2 = mkNM(24);
  sandbox.S.nightMode = NM2; // new night, new object
  sandbox.__now = 5000;
  sandbox.step(16);
  ok(calls.sfx.length === 2 && NM2.msg.includes("CRITICAL HP"), "new night (new NM object) warns again");
}

// 10. original step return preserved; exceptions propagate
{
  const NM = mkNM(24);
  const { sandbox } = mkSandbox({ NM });
  ok(sandbox.step(16) === "step-ret", "original step return value preserved");
  // module wraps at load, so a throwing original must throw BEFORE module load:
  let msg = null;
  const sb4 = {
    console, __now: 1000,
    performance: { now() { return this.__now; } },
    S: { nightMode: mkNM(24) },
    step: function () { throw new Error("boom"); },
    sfx: () => { }, window: {},
    document: { addEventListener: () => { } },
  };
  vm.createContext(sb4);
  vm.runInContext(SRC, sb4, { filename: "night_danger_warning.js" });
  try { sb4.step(16); } catch (e) { msg = e.message; }
  ok(msg === "boom", "original step exception propagates");
}

// 11. loads without window; late-bound step via DOMContentLoaded
{
  let threw = false;
  try {
    const sb = { console };
    vm.createContext(sb);
    vm.runInContext(SRC, sb, { filename: "night_danger_warning.js" });
  } catch (e) { threw = true; }
  ok(!threw, "loads cleanly without window");

  const NM = mkNM(24);
  const sb = {
    console, __now: 1000,
    performance: { now() { return this.__now; } },
    S: { nightMode: NM },
    sfx: k => (sb.calls = sb.calls || []).push(k),
    window: {},
    document: { addEventListener: (ev, cb) => { if (ev === "DOMContentLoaded") sb.__cb = cb; } },
  };
  vm.createContext(sb);
  vm.runInContext(SRC, sb, { filename: "night_danger_warning.js" });
  sb.step = function () { return 1; }; // step defined after module load
  sb.__cb();
  sb.step(16);
  ok(NM.msg.includes("CRITICAL HP") && sb.calls.length === 1, "late-bound step wrapped after DOMContentLoaded");
}

// 12. reset() re-arms immediately
{
  const NM = mkNM(24);
  const { sandbox, calls } = mkSandbox({ NM });
  sandbox.step(16); // warned
  sandbox.window.TechOpsNightDanger.reset();
  NM.msgT = 0; NM.msg = ""; sandbox.__now = 5000;
  sandbox.step(16);
  ok(calls.sfx.length === 2, "reset() re-arms the warning");
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
