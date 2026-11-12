/* Contract tests for day_stress_recovery.js (verifier v13) — Node, no browser. */
"use strict";
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const SRC = fs.readFileSync(path.join(__dirname, "day_stress_recovery.js"), "utf8");

let passed = 0, failed = 0;
function ok(cond, name) {
  if (cond) { passed++; console.log("  ✓ " + name); }
  else { failed++; console.log("  ✗ " + name); }
}

const mkS = (stress) => ({ stress: stress === undefined ? 40 : stress });

function mkSandbox(opts = {}) {
  const calls = { toasts: [], sfx: [], adds: 0 };
  const domcbs = [];
  const S = opts.S === undefined ? mkS(40) : opts.S;
  const sandbox = {
    console,
    S,
    addStress: function (n) {
      calls.adds++;
      if (typeof n === "number" && sandbox.S && typeof sandbox.S.stress === "number") sandbox.S.stress = Math.max(0, Math.min(100, sandbox.S.stress + n));
      return "add-ret";
    },
    toast: (html, ms) => calls.toasts.push({ html, ms }),
    sfx: k => calls.sfx.push(k),
    document: { addEventListener: (ev, cb) => { if (ev === "DOMContentLoaded") domcbs.push(cb); } },
  };
  if (opts.noAdd) delete sandbox.addStress;
  if (opts.noToast) delete sandbox.toast;
  if (opts.noSfx) delete sandbox.sfx;
  if (opts.throwing) sandbox.addStress = function () { throw new Error("boom"); };
  sandbox.window = {};
  // module assigns window.TechOpsStressRecovery; bare S/addStress/toast/sfx resolve via sandbox globals
  vm.createContext(sandbox);
  vm.runInContext(SRC, sandbox, { filename: "day_stress_recovery.js" });
  return { sandbox, S, calls, fireDOM: () => domcbs.forEach(cb => cb()) };
}

// 1. surface
{
  const { sandbox } = mkSandbox();
  const api = sandbox.window.TechOpsStressRecovery;
  ok(api && api.HIGH_AT === 80 && api.CALM_BELOW === 50 && typeof api.reset === "function",
    "exposes TechOpsStressRecovery with HIGH_AT=80 / CALM_BELOW=50 + reset()");
}

// 2. baseline: first observation never fires, even dropping low later without a high
{
  const { sandbox, S, calls } = mkSandbox({ S: mkS(30) });
  sandbox.addStress(-10); // baseline 30 → 20
  ok(calls.toasts.length === 0 && calls.sfx.length === 0, "never been high → no recovery toast");
}

// 3. high then recovered: 85 → 40 fires once with live value + sfx("win")
{
  const { sandbox, S, calls } = mkSandbox({ S: mkS(60) });
  sandbox.addStress(0);   // baseline 60
  sandbox.addStress(25);  // 85 — strained
  sandbox.addStress(-45); // 40 — recovered
  ok(calls.toasts.length === 1 && calls.toasts[0].html.includes("BACK IN THE ZONE") &&
     calls.toasts[0].html.includes("40") && calls.toasts[0].ms === 3400,
    "85 → 40 → BACK IN THE ZONE toast with live value");
  ok(calls.sfx.length === 1 && calls.sfx[0] === "win", "recovery plays sfx('win') once");
}

// 4. partial relief (85 → 60) does not fire; finishing the job (60 → 45) does
{
  const { sandbox, S, calls } = mkSandbox({ S: mkS(85) });
  sandbox.addStress(0);   // baseline 85 (strained from baseline)
  sandbox.addStress(-25); // 60 — still above calm floor
  sandbox.addStress(-15); // 45 — recovered
  ok(calls.toasts.length === 1 && calls.toasts[0].html.includes("45"),
    "partial relief silent; crossing below 50 fires with final value");
}

// 5. loaded save already high: recovering still celebrates (positive beat)
{
  const { sandbox, S, calls } = mkSandbox({ S: mkS(90) });
  sandbox.addStress(0);   // silent baseline at 90
  ok(calls.toasts.length === 0, "baseline at 90 stays silent");
  sandbox.addStress(-50); // 40
  ok(calls.toasts.length === 1 && calls.sfx.length === 1, "loaded high then recovered → celebrates once");
}

// 6. after recovery, staying low fires nothing; a new high re-arms
{
  const { sandbox, S, calls } = mkSandbox({ S: mkS(85) });
  sandbox.addStress(0);
  sandbox.addStress(-40); // 45 — fires
  sandbox.addStress(-5);  // 40 — quiet
  ok(calls.toasts.length === 1, "staying low after recovery stays silent");
  sandbox.addStress(45);  // 85 — strained again
  sandbox.addStress(-40); // 45 — fires again
  ok(calls.toasts.length === 2 && calls.sfx.length === 2, "new high re-arms; next recovery celebrates again");
}

// 7. hovering above the floor while strained: no repeat fire
{
  const { sandbox, S, calls } = mkSandbox({ S: mkS(90) });
  sandbox.addStress(0);
  sandbox.addStress(-30); // 60
  sandbox.addStress(5);   // 65
  sandbox.addStress(-10); // 55 — never below 50
  ok(calls.toasts.length === 0, "hovering 55–65 while strained → silent");
}

// 8. S null / stress missing → silent; return preserved; exceptions propagate
{
  const { sandbox, calls } = mkSandbox({ S: null });
  const r = sandbox.addStress(5);
  ok(calls.toasts.length === 0 && r === "add-ret", "S null → silent, addStress return preserved");
  const m = mkSandbox({ S: {} });
  m.sandbox.addStress(5);
  ok(m.calls.toasts.length === 0, "stress missing → silent");
  const t = mkSandbox({ throwing: true });
  let threw = false;
  try { t.sandbox.addStress(5); } catch (e) { threw = e.message === "boom"; }
  ok(threw && t.calls.toasts.length === 0, "original exceptions propagate without celebration");
}

// 9. missing toast/sfx → no throw
{
  const { sandbox, S } = mkSandbox({ S: mkS(85), noToast: true, noSfx: true });
  sandbox.addStress(0);
  let threw = false;
  try { sandbox.addStress(-45); } catch (e) { threw = true; }
  ok(!threw, "missing toast/sfx → no throw");
}

// 10. no window → no-op; late-bound addStress via DOMContentLoaded
{
  const bare = { console };
  vm.createContext(bare);
  let threw = false;
  try { vm.runInContext(SRC, bare, { filename: "day_stress_recovery.js" }); } catch (e) { threw = true; }
  ok(!threw && bare.window === undefined, "loads without window (no-op)");

  const { sandbox, S, calls, fireDOM } = mkSandbox({ S: mkS(85), noAdd: true });
  ok(typeof sandbox.addStress === "undefined", "no addStress at load → module defers");
  vm.runInContext("addStress = function (n) { S.stress = Math.max(0, Math.min(100, S.stress + n)); return 'late-ret'; };", sandbox);
  fireDOM();
  sandbox.addStress(0);   // baseline 85
  sandbox.addStress(-45); // 40
  ok(calls.toasts.length === 1 && calls.toasts[0].html.includes("BACK IN THE ZONE"),
    "late-bound addStress wrapped after DOMContentLoaded");
}

// 11. watcher errors contained to window.__techopsCalmError
{
  const sandbox = {
    console,
    S: mkS(85),
    addStress: function (n) { this.S.stress = Math.max(0, Math.min(100, this.S.stress + n)); },
    toast: function () { throw new Error("toast-broken"); },
    sfx: function () {},
    document: { addEventListener: function () {} },
  };
  sandbox.window = {};
  vm.createContext(sandbox);
  vm.runInContext(SRC, sandbox, { filename: "day_stress_recovery.js" });
  sandbox.addStress(0);    // baseline 85
  sandbox.addStress(-45);  // 40 → toast throws → contained
  ok(typeof sandbox.window.__techopsCalmError === "string" && sandbox.window.__techopsCalmError.includes("toast-broken"),
    "watcher errors contained to window.__techopsCalmError");
}

// 12. reset() restores silent-baseline behaviour
{
  const { sandbox, S, calls } = mkSandbox({ S: mkS(85) });
  sandbox.addStress(0);
  sandbox.addStress(-45); // fires
  sandbox.window.TechOpsStressRecovery.reset();
  sandbox.addStress(5);   // new silent baseline at 45
  sandbox.addStress(40);  // 85 — strained
  sandbox.addStress(-40); // 45 — fires again
  ok(calls.toasts.length === 2, "reset() restores baseline; re-strained recovery fires again");
}

// 13. double-load does not double-wrap
{
  const sandbox = {
    console,
    S: mkS(85),
    addStress: function (n) { this.S.stress = Math.max(0, Math.min(100, this.S.stress + n)); },
    toast: function () { sandbox.__toasts = (sandbox.__toasts || 0) + 1; },
    sfx: function () {},
    document: { addEventListener: function () {} },
  };
  sandbox.window = {};
  vm.createContext(sandbox);
  vm.runInContext(SRC, sandbox, { filename: "day_stress_recovery.js" });
  vm.runInContext(SRC, sandbox, { filename: "day_stress_recovery.js" }); // second load
  sandbox.addStress(0);    // baseline 85
  sandbox.addStress(-45);  // 40 → exactly one toast
  ok(sandbox.__toasts === 1, "double load → single wrap, celebration fires once");
}

// 14. chains after the v9 wrapper: both see the same call
{
  const v9 = fs.readFileSync(path.join(__dirname, "day_stress_warning.js"), "utf8");
  const sandbox = {
    console,
    S: mkS(70),
    addStress: function (n) { this.S.stress = Math.max(0, Math.min(100, this.S.stress + n)); },
    toast: function (html) { (sandbox.__t = sandbox.__t || []).push(html); },
    sfx: function () {},
    document: { addEventListener: function () {} },
  };
  sandbox.window = {};
  vm.createContext(sandbox);
  vm.runInContext(v9, sandbox, { filename: "day_stress_warning.js" });
  vm.runInContext(SRC, sandbox, { filename: "day_stress_recovery.js" });
  sandbox.addStress(0);    // both baselines at 70
  sandbox.addStress(15);   // 85 → v9 warns, v13 marks strained
  sandbox.addStress(-45);  // 40 → v13 celebrates
  const joined = (sandbox.__t || []).join(" | ");
  ok(joined.includes("STRESS HIGH") && joined.includes("BACK IN THE ZONE"),
    "chains after v9 wrapper: warning and recovery both fire");
}

console.log("\n" + passed + " passed, " + failed + " failed");
process.exit(failed === 0 ? 0 : 1);
