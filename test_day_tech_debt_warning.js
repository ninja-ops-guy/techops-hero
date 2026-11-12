/* Contract tests for day_tech_debt_warning.js (verifier v10) — Node, no browser. */
"use strict";
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const SRC = fs.readFileSync(path.join(__dirname, "day_tech_debt_warning.js"), "utf8");

let passed = 0, failed = 0;
function ok(cond, name) {
  if (cond) { passed++; console.log("  ✓ " + name); }
  else { failed++; console.log("  ✗ " + name); }
}

function mkSandbox(opts = {}) {
  const calls = { toasts: [], sfx: [], step: 0 };
  const domcbs = [];
  const S = opts.S === undefined ? { meta: { debt: 0 } } : opts.S;
  const sandbox = {
    console,
    S,
    step: function (dt) { calls.step++; return "step-ret"; },
    toast: (html, ms) => calls.toasts.push({ html, ms }),
    sfx: k => calls.sfx.push(k),
    document: { addEventListener: (ev, cb) => { if (ev === "DOMContentLoaded") domcbs.push(cb); } },
  };
  if (opts.noStep) delete sandbox.step;
  if (opts.noToast) delete sandbox.toast;
  if (opts.noSfx) delete sandbox.sfx;
  if (opts.throwing) sandbox.step = function () { throw new Error("boom"); };
  sandbox.window = {};
  // module assigns window.TechOpsTechDebtWarning; bare S/step/toast/sfx resolve via sandbox globals
  vm.createContext(sandbox);
  vm.runInContext(SRC, sandbox, { filename: "day_tech_debt_warning.js" });
  return { sandbox, S, calls, fireDOM: () => domcbs.forEach(cb => cb()) };
}

// 1. surface
{
  const { sandbox } = mkSandbox();
  const api = sandbox.window.TechOpsTechDebtWarning;
  ok(api && api.WARN_AT === 5 && typeof api.reset === "function",
    "exposes TechOpsTechDebtWarning with WARN_AT=5 + reset()");
}

// 2. baseline: first poll never fires, even when debt already ≥ 5
{
  const { sandbox, S, calls } = mkSandbox();
  S.meta.debt = 6;
  sandbox.step(16);
  ok(calls.toasts.length === 0 && calls.sfx.length === 0, "loaded save with debt 6 → silent baseline");
}

// 3. 4 → 6 crossing: toast (3400ms, includes current value) + sfx, once
{
  const { sandbox, S, calls } = mkSandbox();
  S.meta.debt = 4;
  sandbox.step(16); // baseline 4
  S.meta.debt = 6;
  sandbox.step(16);
  ok(calls.toasts.length === 1 && calls.toasts[0].html.includes("TECH DEBT HIGH (6)") &&
     calls.toasts[0].html.includes("repeat tickets are becoming more likely") && calls.toasts[0].ms === 3400,
    "4→6 crossing → TECH DEBT HIGH toast with current value");
  ok(calls.sfx.length === 1 && calls.sfx[0] === "bad", "crossing plays sfx('bad') once");
}

// 4. hovering at 6→7→6: no repeat fire while latched
{
  const { sandbox, S, calls } = mkSandbox();
  S.meta.debt = 4; sandbox.step(16);
  S.meta.debt = 6; sandbox.step(16); // fires
  S.meta.debt = 7; sandbox.step(16); // latched
  S.meta.debt = 6; sandbox.step(16); // latched
  ok(calls.toasts.length === 1 && calls.sfx.length === 1, "hovering above threshold fires once");
}

// 5. dip below 5 re-arms; next rise warns again
{
  const { sandbox, S, calls } = mkSandbox();
  S.meta.debt = 4; sandbox.step(16);
  S.meta.debt = 6; sandbox.step(16); // fires
  S.meta.debt = 2; sandbox.step(16); // re-arm
  S.meta.debt = 5; sandbox.step(16); // warns again
  ok(calls.toasts.length === 2 && calls.sfx.length === 2, "dip below 5 re-arms; next rise warns again");
}

// 6. S null / meta missing → silent; return preserved; exceptions propagate
{
  const { sandbox, calls } = mkSandbox({ S: null });
  const r = sandbox.step(16);
  ok(calls.toasts.length === 0 && r === "step-ret", "S null → silent, step return preserved");
  const m = mkSandbox({ S: {} });
  m.sandbox.step(16);
  ok(m.calls.toasts.length === 0, "meta missing → silent");
  const t = mkSandbox({ throwing: true });
  let threw = false;
  try { t.sandbox.step(16); } catch (e) { threw = e.message === "boom"; }
  ok(threw && t.calls.toasts.length === 0, "original exceptions propagate without warning");
}

// 7. missing toast/sfx → no throw
{
  const { sandbox, S } = mkSandbox({ noToast: true, noSfx: true });
  S.meta.debt = 4; sandbox.step(16);
  S.meta.debt = 8;
  let threw = false;
  try { sandbox.step(16); } catch (e) { threw = true; }
  ok(!threw, "missing toast/sfx → no throw");
}

// 8. no window → no-op; late-bound step via DOMContentLoaded
{
  const bare = { console };
  vm.createContext(bare);
  let threw = false;
  try { vm.runInContext(SRC, bare, { filename: "day_tech_debt_warning.js" }); } catch (e) { threw = true; }
  ok(!threw && bare.window === undefined, "loads without window (no-op)");

  const { sandbox, S, calls, fireDOM } = mkSandbox({ noStep: true });
  ok(typeof sandbox.step === "undefined", "no step at load → module defers");
  vm.runInContext("step = function (dt) { return 'late-ret'; };", sandbox);
  fireDOM();
  S.meta.debt = 4; sandbox.step(16);
  S.meta.debt = 6; sandbox.step(16);
  ok(calls.toasts.length === 1 && calls.toasts[0].html.includes("TECH DEBT HIGH"),
    "late-bound step wrapped after DOMContentLoaded");
}

// 9. watcher errors contained to window.__techopsDebtError
{
  const sandbox = {
    console,
    S: { meta: { debt: 4 } },
    step: function () {},
    toast: function () { throw new Error("toast-broken"); },
    sfx: function () {},
    document: { addEventListener: function () {} },
  };
  sandbox.window = {};
  vm.createContext(sandbox);
  vm.runInContext(SRC, sandbox, { filename: "day_tech_debt_warning.js" });
  sandbox.step(16);              // baseline 4
  sandbox.S.meta.debt = 6;
  sandbox.step(16);              // crossing → toast throws → contained
  ok(typeof sandbox.window.__techopsDebtError === "string" && sandbox.window.__techopsDebtError.includes("toast-broken"),
    "watcher errors contained to window.__techopsDebtError");
}

// 10. reset() restores silent-baseline behaviour
{
  const { sandbox, S, calls } = mkSandbox();
  S.meta.debt = 4; sandbox.step(16);
  S.meta.debt = 6; sandbox.step(16); // fires
  sandbox.window.TechOpsTechDebtWarning.reset();
  sandbox.step(16);                  // new silent baseline at 6
  S.meta.debt = 7; sandbox.step(16); // no crossing (baseline 6, latched at 6>=5)
  ok(calls.toasts.length === 1, "reset() restores silent-baseline behaviour");
}

// 11. double-load does not double-wrap
{
  const sandbox = {
    console,
    S: { meta: { debt: 4 } },
    step: function () {},
    toast: function () { sandbox.__toasts = (sandbox.__toasts || 0) + 1; },
    sfx: function () {},
    document: { addEventListener: function () {} },
  };
  sandbox.window = {};
  vm.createContext(sandbox);
  vm.runInContext(SRC, sandbox, { filename: "day_tech_debt_warning.js" });
  vm.runInContext(SRC, sandbox, { filename: "day_tech_debt_warning.js" }); // second load
  sandbox.step(16);                 // baseline 4
  sandbox.S.meta.debt = 6;
  sandbox.step(16);                 // crossing → exactly one toast
  ok(sandbox.__toasts === 1, "double load → single wrap, warning fires once");
}

console.log("\n" + passed + " passed, " + failed + " failed");
process.exit(failed === 0 ? 0 : 1);
