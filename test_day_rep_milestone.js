/* Contract tests for day_rep_milestone.js (verifier v11) — Node, no browser. */
"use strict";
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const SRC = fs.readFileSync(path.join(__dirname, "day_rep_milestone.js"), "utf8");

let passed = 0, failed = 0;
function ok(cond, name) {
  if (cond) { passed++; console.log("  ✓ " + name); }
  else { failed++; console.log("  ✗ " + name); }
}

const mkRep = (v) => ({ IT: v, Engineering: 1, Executives: 1 });

function mkSandbox(opts = {}) {
  const calls = { toasts: [], sfx: [], step: 0 };
  const domcbs = [];
  const S = opts.S === undefined ? { rep: mkRep(1) } : opts.S;
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
  // module assigns window.TechOpsRepMilestone; bare S/step/toast/sfx resolve via sandbox globals
  vm.createContext(sandbox);
  vm.runInContext(SRC, sandbox, { filename: "day_rep_milestone.js" });
  return { sandbox, S, calls, fireDOM: () => domcbs.forEach(cb => cb()) };
}

// 1. surface
{
  const { sandbox } = mkSandbox();
  const api = sandbox.window.TechOpsRepMilestone;
  ok(api && api.MAX_REP === 5 && typeof api.reset === "function",
    "exposes TechOpsRepMilestone with MAX_REP=5 + reset()");
}

// 2. baseline: first poll never fires, even with a department already at 5
{
  const { sandbox, S, calls } = mkSandbox();
  S.rep.IT = 5;
  sandbox.step(16);
  ok(calls.toasts.length === 0 && calls.sfx.length === 0, "loaded save with rep 5 → silent baseline");
}

// 3. 4 → 5 crossing: toast names the department + sfx("promote"), once
{
  const { sandbox, S, calls } = mkSandbox();
  S.rep.IT = 4;
  sandbox.step(16); // baseline
  S.rep.IT = 5;
  sandbox.step(16);
  ok(calls.toasts.length === 1 && calls.toasts[0].html.includes("REPUTATION MAXED") &&
     calls.toasts[0].html.includes("IT") && calls.toasts[0].html.includes("(5/5)") && calls.toasts[0].ms === 3400,
    "4→5 crossing → REPUTATION MAXED toast naming the department");
  ok(calls.sfx.length === 1 && calls.sfx[0] === "promote", "crossing plays sfx('promote') once");
}

// 4. hovering at 5 across frames: no repeat fire while latched
{
  const { sandbox, S, calls } = mkSandbox();
  S.rep.IT = 4; sandbox.step(16);
  S.rep.IT = 5; sandbox.step(16); // fires
  sandbox.step(16); sandbox.step(16); // stays 5
  ok(calls.toasts.length === 1 && calls.sfx.length === 1, "sitting at 5 fires once");
}

// 5. drop below 5 re-arms; next rise to 5 celebrates again
{
  const { sandbox, S, calls } = mkSandbox();
  S.rep.IT = 4; sandbox.step(16);
  S.rep.IT = 5; sandbox.step(16); // fires
  S.rep.IT = 3; sandbox.step(16); // re-arm
  S.rep.IT = 5; sandbox.step(16); // celebrates again
  ok(calls.toasts.length === 2 && calls.sfx.length === 2, "drop below 5 re-arms; next rise celebrates again");
}

// 6. two departments crossing on one frame → single combined toast
{
  const { sandbox, S, calls } = mkSandbox();
  S.rep.IT = 4; S.rep.Engineering = 4;
  sandbox.step(16); // baseline
  S.rep.IT = 5; S.rep.Engineering = 5;
  sandbox.step(16);
  ok(calls.toasts.length === 1 && calls.toasts[0].html.includes("IT") &&
     calls.toasts[0].html.includes("Engineering") && calls.sfx.length === 1,
    "two departments same frame → one combined toast naming both");
}

// 7. S null / rep missing → silent; return preserved; exceptions propagate
{
  const { sandbox, calls } = mkSandbox({ S: null });
  const r = sandbox.step(16);
  ok(calls.toasts.length === 0 && r === "step-ret", "S null → silent, step return preserved");
  const m = mkSandbox({ S: {} });
  m.sandbox.step(16);
  ok(m.calls.toasts.length === 0, "rep missing → silent");
  const t = mkSandbox({ throwing: true });
  let threw = false;
  try { t.sandbox.step(16); } catch (e) { threw = e.message === "boom"; }
  ok(threw && t.calls.toasts.length === 0, "original exceptions propagate without celebration");
}

// 8. missing toast/sfx → no throw
{
  const { sandbox, S } = mkSandbox({ noToast: true, noSfx: true });
  S.rep.IT = 4; sandbox.step(16);
  S.rep.IT = 5;
  let threw = false;
  try { sandbox.step(16); } catch (e) { threw = true; }
  ok(!threw, "missing toast/sfx → no throw");
}

// 9. no window → no-op; late-bound step via DOMContentLoaded
{
  const bare = { console };
  vm.createContext(bare);
  let threw = false;
  try { vm.runInContext(SRC, bare, { filename: "day_rep_milestone.js" }); } catch (e) { threw = true; }
  ok(!threw && bare.window === undefined, "loads without window (no-op)");

  const { sandbox, S, calls, fireDOM } = mkSandbox({ noStep: true });
  ok(typeof sandbox.step === "undefined", "no step at load → module defers");
  vm.runInContext("step = function (dt) { return 'late-ret'; };", sandbox);
  fireDOM();
  S.rep.IT = 4; sandbox.step(16);
  S.rep.IT = 5; sandbox.step(16);
  ok(calls.toasts.length === 1 && calls.toasts[0].html.includes("REPUTATION MAXED"),
    "late-bound step wrapped after DOMContentLoaded");
}

// 10. watcher errors contained to window.__techopsRepError
{
  const sandbox = {
    console,
    S: { rep: { IT: 4 } },
    step: function () {},
    toast: function () { throw new Error("toast-broken"); },
    sfx: function () {},
    document: { addEventListener: function () {} },
  };
  sandbox.window = {};
  vm.createContext(sandbox);
  vm.runInContext(SRC, sandbox, { filename: "day_rep_milestone.js" });
  sandbox.step(16);              // baseline 4
  sandbox.S.rep.IT = 5;
  sandbox.step(16);              // crossing → toast throws → contained
  ok(typeof sandbox.window.__techopsRepError === "string" && sandbox.window.__techopsRepError.includes("toast-broken"),
    "watcher errors contained to window.__techopsRepError");
}

// 11. reset() restores silent-baseline behaviour
{
  const { sandbox, S, calls } = mkSandbox();
  S.rep.IT = 4; sandbox.step(16);
  S.rep.IT = 5; sandbox.step(16); // fires
  sandbox.window.TechOpsRepMilestone.reset();
  sandbox.step(16);               // new silent baseline at 5
  S.rep.IT = 4; sandbox.step(16); // drop re-arms
  S.rep.IT = 5; sandbox.step(16); // crossing after re-arm → fires again
  ok(calls.toasts.length === 2, "reset() restores baseline; re-armed crossing fires again");
}

// 12. double-load does not double-wrap
{
  const sandbox = {
    console,
    S: { rep: { IT: 4 } },
    step: function () {},
    toast: function () { sandbox.__toasts = (sandbox.__toasts || 0) + 1; },
    sfx: function () {},
    document: { addEventListener: function () {} },
  };
  sandbox.window = {};
  vm.createContext(sandbox);
  vm.runInContext(SRC, sandbox, { filename: "day_rep_milestone.js" });
  vm.runInContext(SRC, sandbox, { filename: "day_rep_milestone.js" }); // second load
  sandbox.step(16);                 // baseline 4
  sandbox.S.rep.IT = 5;
  sandbox.step(16);                 // crossing → exactly one toast
  ok(sandbox.__toasts === 1, "double load → single wrap, celebration fires once");
}

console.log("\n" + passed + " passed, " + failed + " failed");
process.exit(failed === 0 ? 0 : 1);
