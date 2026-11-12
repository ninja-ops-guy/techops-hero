/* Contract tests for day_stress_critical.js (verifier v15) — Node, no browser. */
"use strict";
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const SRC = fs.readFileSync(path.join(__dirname, "day_stress_critical.js"), "utf8");
const V9_SRC = fs.readFileSync(path.join(__dirname, "day_stress_warning.js"), "utf8");

let passed = 0, failed = 0;
function ok(cond, name) {
  if (cond) { passed++; console.log("  ✓ " + name); }
  else { failed++; console.log("  ✗ " + name); }
}

function mkSandbox(opts = {}) {
  const calls = { toasts: [], sfx: [], adds: 0 };
  const domcbs = [];
  const sandbox = {
    console,
    S: opts.S === undefined ? { stress: 20 } : opts.S,
    // mirrors game.js: clamp 0..100, burnout at 100 resets to 70
    addStress: function (n) {
      calls.adds++;
      if (typeof n === "number" && sandbox.S && typeof sandbox.S.stress === "number") {
        sandbox.S.stress = Math.max(0, Math.min(100, sandbox.S.stress + n));
        if (sandbox.S.stress >= 100) sandbox.S.stress = 70;
      }
      return "stress-ret";
    },
    toast: (html, ms) => calls.toasts.push({ html, ms }),
    sfx: k => calls.sfx.push(k),
    document: { addEventListener: (ev, cb) => { if (ev === "DOMContentLoaded") domcbs.push(cb); } },
  };
  if (opts.noAddStress) delete sandbox.addStress;
  if (opts.noToast) delete sandbox.toast;
  if (opts.noSfx) delete sandbox.sfx;
  if (opts.throwing) sandbox.addStress = function () { throw new Error("boom"); };
  if (opts.loadV9) vm.runInContext; // marker only
  sandbox.window = {};
  vm.createContext(sandbox);
  if (opts.loadV9) vm.runInContext(V9_SRC, sandbox, { filename: "day_stress_warning.js" });
  vm.runInContext(SRC, sandbox, { filename: "day_stress_critical.js" });
  return { sandbox, calls, fireDOM: () => domcbs.forEach(cb => cb()) };
}

// 1. surface
{
  const { sandbox } = mkSandbox();
  const api = sandbox.window.TechOpsStressCritical;
  ok(api && api.CRIT_AT === 90 && typeof api.reset === "function",
    "exposes TechOpsStressCritical with CRIT_AT=90 + reset()");
}

// 2. baseline: first poll never fires, even at 95
{
  const { sandbox, calls } = mkSandbox({ S: { stress: 95 } });
  sandbox.addStress(0);
  ok(calls.toasts.length === 0 && calls.sfx.length === 0, "loaded save at 95 → silent baseline");
}

// 3. crossing <90 → >=90: toast names criticality + consequence, sfx("bad"), once
{
  const { sandbox, calls } = mkSandbox({ S: { stress: 80 } });
  sandbox.addStress(0); // baseline 80
  sandbox.addStress(12); // 92
  ok(calls.toasts.length === 1 && calls.toasts[0].html.includes("STRESS CRITICAL") &&
     calls.toasts[0].html.includes("92/100") && calls.toasts[0].html.includes("-10 HP") &&
     calls.toasts[0].ms === 3400,
    "80→92 crossing → STRESS CRITICAL toast with value + consequence");
  ok(calls.sfx.length === 1 && calls.sfx[0] === "bad", "crossing plays sfx('bad') once");
}

// 4. hovering at >= 90: no repeat fire
{
  const { sandbox, calls } = mkSandbox({ S: { stress: 85 } });
  sandbox.addStress(0);
  sandbox.addStress(5); // 90 → fires
  sandbox.addStress(3); // 93
  sandbox.addStress(2); // 95
  ok(calls.toasts.length === 1 && calls.sfx.length === 1, "sitting above 90 fires once");
}

// 5. drop below 90 re-arms; next rise announces again
{
  const { sandbox, calls } = mkSandbox({ S: { stress: 85 } });
  sandbox.addStress(0);
  sandbox.addStress(7);  // 92 → fires
  sandbox.addStress(-25); // 67 (coffee)
  sandbox.addStress(30); // 97 → fires again
  ok(calls.toasts.length === 2 && calls.sfx.length === 2, "drop below 90 re-arms; next rise announces again");
}

// 6. burnout at 100 resets stress to 70 within addStress itself → the spike
//    overshoot never lingers at >= 90 (BURNOUT toast already fires there);
//    the reset re-arms the watcher, so the post-burnout rise warns again
{
  const { sandbox, calls } = mkSandbox({ S: { stress: 88 } });
  sandbox.addStress(0);
  sandbox.addStress(20); // 108 → clamped 100 → burnout reset to 70 (game's own toast, not ours)
  ok(calls.toasts.length === 0 && sandbox.S.stress === 70, "direct overshoot to burnout: watcher sees the reset to 70, stays silent");
  sandbox.addStress(25); // 95 → crossing → fires
  ok(calls.toasts.length === 1 && calls.sfx.length === 1 && calls.toasts[0].html.includes("95/100"),
    "post-burnout rise to 95 announces");
}

// 7. chains with real v9 module: 79→90 fires both STRESS HIGH and STRESS CRITICAL
{
  const { sandbox, calls } = mkSandbox({ S: { stress: 79 }, loadV9: true });
  sandbox.addStress(0);  // baseline 79 for both watchers
  sandbox.addStress(11); // 90
  const htmls = calls.toasts.map(t => t.html).join("\n");
  ok(htmls.includes("STRESS HIGH") && htmls.includes("STRESS CRITICAL"),
    "79→90 with v9 loaded fires both STRESS HIGH (v9) and STRESS CRITICAL (v15)");
}

// 8. missing state / missing addStress → silent; return + exceptions preserved
{
  const { sandbox, calls } = mkSandbox({ S: null });
  const r = sandbox.addStress(50);
  ok(calls.toasts.length === 0 && r === "stress-ret", "S null → silent, addStress return preserved");
  const m = mkSandbox({ S: {} });
  m.sandbox.addStress(99);
  ok(m.calls.toasts.length === 0, "stress missing → silent");
  const t = mkSandbox({ throwing: true });
  let threw = false;
  try { t.sandbox.addStress(50); } catch (e) { threw = e.message === "boom"; }
  ok(threw && t.calls.toasts.length === 0, "original exceptions propagate without announcement");
}

// 9. missing toast/sfx → no throw
{
  const { sandbox } = mkSandbox({ S: { stress: 80 }, noToast: true, noSfx: true });
  sandbox.addStress(0);
  let threw = false;
  try { sandbox.addStress(15); } catch (e) { threw = true; }
  ok(!threw, "missing toast/sfx → no throw");
}

// 10. no window → no-op; late-bound addStress via DOMContentLoaded
{
  const bare = { console };
  vm.createContext(bare);
  let threw = false;
  try { vm.runInContext(SRC, bare, { filename: "day_stress_critical.js" }); } catch (e) { threw = true; }
  ok(!threw && bare.window === undefined, "loads without window (no-op)");

  const { sandbox, calls, fireDOM } = mkSandbox({ S: { stress: 80 }, noAddStress: true });
  ok(typeof sandbox.addStress === "undefined", "no addStress at load → module defers");
  vm.runInContext("addStress = function (n) { S.stress += n; return 'late-ret'; };", sandbox);
  fireDOM();
  sandbox.addStress(0);  // baseline 80
  sandbox.addStress(12); // 92
  ok(calls.toasts.length === 1 && calls.toasts[0].html.includes("STRESS CRITICAL"),
    "late-bound addStress wrapped after DOMContentLoaded");
}

// 11. watcher errors contained to window.__techopsStressCritError
{
  const sandbox = {
    console,
    S: { stress: 80 },
    addStress: function (n) { this.S.stress += n; },
    toast: function () { throw new Error("toast-broken"); },
    sfx: function () {},
    document: { addEventListener: function () {} },
  };
  sandbox.window = {};
  vm.createContext(sandbox);
  vm.runInContext(SRC, sandbox, { filename: "day_stress_critical.js" });
  sandbox.addStress(0);  // baseline 80
  sandbox.addStress(12); // 92 → toast throws → contained
  ok(typeof sandbox.window.__techopsStressCritError === "string" && sandbox.window.__techopsStressCritError.includes("toast-broken"),
    "watcher errors contained to window.__techopsStressCritError");
}

// 12. reset() restores silent-baseline behaviour
{
  const { sandbox, calls } = mkSandbox({ S: { stress: 85 } });
  sandbox.addStress(0);
  sandbox.addStress(5);  // 90 → fires
  sandbox.window.TechOpsStressCritical.reset();
  sandbox.addStress(2);  // 92, new silent baseline
  ok(calls.toasts.length === 1, "reset() → re-baseline, no spurious fire");
  sandbox.addStress(-10); // 82, re-arm
  sandbox.addStress(15);  // 97, crossing → fires again
  ok(calls.toasts.length === 2, "reset() → re-armed crossing fires again");
}

// 13. double-load does not double-wrap
{
  const sandbox = {
    console,
    S: { stress: 80 },
    addStress: function (n) { this.S.stress += n; },
    toast: function () { sandbox.__toasts = (sandbox.__toasts || 0) + 1; },
    sfx: function () {},
    document: { addEventListener: function () {} },
  };
  sandbox.window = {};
  vm.createContext(sandbox);
  vm.runInContext(SRC, sandbox, { filename: "day_stress_critical.js" });
  vm.runInContext(SRC, sandbox, { filename: "day_stress_critical.js" }); // second load
  sandbox.addStress(0);   // baseline 80
  sandbox.addStress(12);  // 92 → exactly one toast
  ok(sandbox.__toasts === 1, "double load → single wrap, warning fires once");
}

console.log("\n" + passed + " passed, " + failed + " failed");
process.exit(failed === 0 ? 0 : 1);
