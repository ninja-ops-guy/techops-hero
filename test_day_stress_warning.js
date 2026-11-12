/* Contract tests for day_stress_warning.js (verifier v9) — Node, no browser. */
"use strict";
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const SRC = fs.readFileSync(path.join(__dirname, "day_stress_warning.js"), "utf8");

let passed = 0, failed = 0;
function ok(cond, name) {
  if (cond) { passed++; console.log("  ✓ " + name); }
  else { failed++; console.log("  ✗ " + name); }
}

function mkSandbox(opts = {}) {
  const calls = { toasts: [], sfx: [] };
  const domcbs = [];
  const S = opts.S === undefined ? { stress: 0 } : opts.S;
  const sandbox = {
    console,
    S,
    addStress: function (n) { if (S) S.stress += n; return "orig-ret"; },
    toast: (html, ms) => calls.toasts.push({ html, ms }),
    sfx: k => calls.sfx.push(k),
    document: { addEventListener: (ev, cb) => { if (ev === "DOMContentLoaded") domcbs.push(cb); } },
  };
  if (opts.noAddStress) delete sandbox.addStress;
  if (opts.noToast) delete sandbox.toast;
  if (opts.noSfx) delete sandbox.sfx;
  if (opts.throwing) sandbox.addStress = function () { throw new Error("boom"); };
  sandbox.window = {};
  // module assigns window.TechOpsStressWarning; bare S/addStress/toast/sfx resolve via sandbox globals
  vm.createContext(sandbox);
  vm.runInContext(SRC, sandbox, { filename: "day_stress_warning.js" });
  return { sandbox, S, calls, fireDOM: () => domcbs.forEach(cb => cb()) };
}

// 1. surface
{
  const { sandbox } = mkSandbox();
  const api = sandbox.window.TechOpsStressWarning;
  ok(api && api.WARN_AT === 80 && api.MAX_AT === 100 && api.REARM_BELOW === 50 && typeof api.reset === "function",
    "exposes TechOpsStressWarning with thresholds + reset()");
}

// 2. 60 → 82: high-stress toast + sfx("bad"), once
{
  const { sandbox, S, calls } = mkSandbox();
  S.stress = 60;
  sandbox.addStress(22);
  ok(calls.toasts.length === 1 && calls.toasts[0].html.includes("STRESS HIGH") && calls.toasts[0].ms === 3400,
    "60→82 crossing → STRESS HIGH toast (3400ms)");
  ok(calls.sfx.length === 1 && calls.sfx[0] === "bad", "crossing plays sfx('bad') once");
}

// 3. hovering at 79→81→79→83: fires once until re-armed
{
  const { sandbox, S, calls } = mkSandbox();
  S.stress = 79;
  sandbox.addStress(2);  // 81 → fires
  sandbox.addStress(-2); // 79 → no re-arm (still >= 50), no fire
  sandbox.addStress(4);  // 83 → latched, no fire
  ok(calls.toasts.length === 1 && calls.sfx.length === 1, "hovering near threshold fires once");
}

// 4. reaching 100 escalates even when already warned
{
  const { sandbox, S, calls } = mkSandbox();
  S.stress = 85;
  sandbox.addStress(5);  // 90 → warn stage 1
  sandbox.addStress(10); // 100 → escalation stage 2
  ok(calls.toasts.length === 2 && calls.toasts[1].html.includes("STRESS MAXED") && calls.sfx.length === 2,
    "reaching 100 escalates to STRESS MAXED toast");
}

// 5. drop below 50 re-arms; next rise warns again
{
  const { sandbox, S, calls } = mkSandbox();
  S.stress = 90;
  sandbox.addStress(5);   // 95 → fires (stage 1)
  S.stress = 40;
  sandbox.addStress(5);   // 45 → re-arm below 50, no fire
  sandbox.addStress(40);  // 85 → warns again
  ok(calls.toasts.length === 2 && calls.sfx.length === 2, "drop below 50 re-arms; next rise warns again");
}

// 6. negative deltas (stress relief) never fire
{
  const { sandbox, S, calls } = mkSandbox();
  S.stress = 70;
  sandbox.addStress(25);  // 95 → legitimate upward crossing, fires (stage 1 latched)
  const firedAfterWarn = calls.toasts.length;
  sandbox.addStress(-10); // 85 → relief while latched, must stay silent
  sandbox.addStress(-20); // 65 → further relief, silent
  ok(firedAfterWarn === 1 && calls.toasts.length === 1 && calls.sfx.length === 1,
    "stress relief after a latched warning never re-fires");
}

// 7. S null → silent; return preserved; exceptions propagate without warning
{
  const { sandbox, calls } = mkSandbox({ S: null });
  const r = sandbox.addStress(50);
  ok(calls.toasts.length === 0 && calls.sfx.length === 0, "S null → silent");
  ok(r === "orig-ret", "original return value preserved");
  const t = mkSandbox({ throwing: true });
  let threw = false;
  try { t.sandbox.addStress(5); } catch (e) { threw = e.message === "boom"; }
  ok(threw && t.calls.toasts.length === 0, "original exceptions propagate without warning");
}

// 8. missing toast/sfx → no throw
{
  const { sandbox, S } = mkSandbox({ noToast: true, noSfx: true });
  S.stress = 60;
  let threw = false;
  try { sandbox.addStress(30); } catch (e) { threw = true; }
  ok(!threw && S.stress === 90, "missing toast/sfx → no throw, stress still applied");
}

// 9. late-bound addStress via DOMContentLoaded
{
  const { sandbox, S, calls, fireDOM } = mkSandbox({ noAddStress: true });
  ok(typeof sandbox.addStress === "undefined", "no addStress at load → module defers");
  sandbox.S = S; // S already bound
  vm.runInContext("addStress = function (n) { S.stress += n; return 'late-ret'; };", sandbox);
  fireDOM();
  S.stress = 60;
  sandbox.addStress(25);
  ok(calls.toasts.length === 1 && calls.toasts[0].html.includes("STRESS HIGH"),
    "late-bound addStress wrapped after DOMContentLoaded");
}

// 10. no window → module no-ops
{
  const sandbox = { console };
  vm.createContext(sandbox);
  let threw = false;
  try { vm.runInContext(SRC, sandbox, { filename: "day_stress_warning.js" }); } catch (e) { threw = true; }
  ok(!threw && sandbox.window === undefined, "loads without window (no-op)");
}

// 11. watcher errors contained to window.__techopsStressError
{
  const sandbox = {
    console,
    S: { stress: 60 },
    addStress: function (n) { this.S.stress += n; },
    toast: function () { throw new Error("toast-broken"); },
    sfx: function () {},
    document: { addEventListener: function () {} },
  };
  sandbox.window = {};
  vm.createContext(sandbox);
  vm.runInContext(SRC, sandbox, { filename: "day_stress_warning.js" });
  sandbox.addStress(30);
  ok(typeof sandbox.window.__techopsStressError === "string" && sandbox.window.__techopsStressError.includes("toast-broken"),
    "watcher errors contained to window.__techopsStressError");
}

// 12. reset() re-arms from latched state
{
  const { sandbox, S, calls } = mkSandbox();
  S.stress = 60;
  sandbox.addStress(25); // 85 → fires
  sandbox.window.TechOpsStressWarning.reset();
  sandbox.addStress(5);  // 90 → fires again after reset
  ok(calls.toasts.length === 2, "reset() re-arms warnings");
}

// 13. double-load does not double-wrap
{
  const sandbox = {
    console,
    S: { stress: 60 },
    addStress: function (n) { this.S.stress += n; },
    toast: function () { sandbox.__toasts = (sandbox.__toasts || 0) + 1; },
    sfx: function () {},
    document: { addEventListener: function () {} },
  };
  sandbox.window = {};
  vm.createContext(sandbox);
  vm.runInContext(SRC, sandbox, { filename: "day_stress_warning.js" });
  vm.runInContext(SRC, sandbox, { filename: "day_stress_warning.js" }); // second load
  sandbox.addStress(25);
  ok(sandbox.__toasts === 1, "double load → single wrap, warning fires once");
}

console.log("\n" + passed + " passed, " + failed + " failed");
process.exit(failed === 0 ? 0 : 1);
