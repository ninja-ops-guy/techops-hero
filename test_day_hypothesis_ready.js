/* Contract tests for day_hypothesis_ready.js (verifier v14) — Node, no browser. */
"use strict";
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const SRC = fs.readFileSync(path.join(__dirname, "day_hypothesis_ready.js"), "utf8");

let passed = 0, failed = 0;
function ok(cond, name) {
  if (cond) { passed++; console.log("  ✓ " + name); }
  else { failed++; console.log("  ✗ " + name); }
}

const mkB = (conf) => ({ confidence: conf === undefined ? 20 : conf, hyp: false, hypFailed: false });

function mkSandbox(opts = {}) {
  const calls = { toasts: [], sfx: [], step: 0 };
  const domcbs = [];
  const B = opts.B === undefined ? mkB(20) : opts.B;
  const sandbox = {
    console,
    B,
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
  // module assigns window.TechOpsHypothesisReady; bare B/step/toast/sfx resolve via sandbox globals
  vm.createContext(sandbox);
  vm.runInContext(SRC, sandbox, { filename: "day_hypothesis_ready.js" });
  return { sandbox, B, calls, fireDOM: () => domcbs.forEach(cb => cb()) };
}

// 1. surface
{
  const { sandbox } = mkSandbox();
  const api = sandbox.window.TechOpsHypothesisReady;
  ok(api && api.READY_AT === 60 && typeof api.reset === "function",
    "exposes TechOpsHypothesisReady with READY_AT=60 + reset()");
}

// 2. baseline: first poll never fires, even with confidence already >= 60
{
  const { sandbox, calls } = mkSandbox({ B: mkB(70) });
  sandbox.step(16);
  ok(calls.toasts.length === 0 && calls.sfx.length === 0, "loaded save mid-battle at 70 → silent baseline");
}

// 3. crossing <60 → >=60: toast names the unlock + sfx("win"), once
{
  const { sandbox, B, calls } = mkSandbox({ B: mkB(45) });
  sandbox.step(16); // baseline
  B.confidence = 62;
  sandbox.step(16);
  ok(calls.toasts.length === 1 && calls.toasts[0].html.includes("HYPOTHESIS READY") &&
     calls.toasts[0].html.includes("Form Hypothesis") && calls.toasts[0].html.includes("+50% fix damage") &&
     calls.toasts[0].ms === 3400,
    "45→62 crossing → HYPOTHESIS READY toast");
  ok(calls.sfx.length === 1 && calls.sfx[0] === "win", "crossing plays sfx('win') once");
}

// 4. hovering at >= 60 across frames: no repeat fire
{
  const { sandbox, B, calls } = mkSandbox({ B: mkB(50) });
  sandbox.step(16);
  B.confidence = 60; sandbox.step(16); // fires
  B.confidence = 66; sandbox.step(16);
  B.confidence = 71; sandbox.step(16);
  ok(calls.toasts.length === 1 && calls.sfx.length === 1, "sitting above 60 fires once");
}

// 5. false positive knocks confidence below 60 → re-arm; next rise announces again
{
  const { sandbox, B, calls } = mkSandbox({ B: mkB(50) });
  sandbox.step(16);
  B.confidence = 60; sandbox.step(16); // fires
  B.confidence = 52; sandbox.step(16); // false positive (-8)
  B.confidence = 61; sandbox.step(16); // announces again
  ok(calls.toasts.length === 2 && calls.sfx.length === 2, "drop below 60 re-arms; next rise announces again");
}

// 6. hypothesis already formed/failed → silent
{
  const { sandbox, B, calls } = mkSandbox({ B: mkB(50) });
  sandbox.step(16);
  B.hyp = true;
  B.confidence = 80; sandbox.step(16);
  ok(calls.toasts.length === 0, "hyp already formed → no announcement");
}

// 7. leaving battle (B null) re-arms the next battle
{
  const { sandbox, B, calls } = mkSandbox({ B: mkB(50) });
  sandbox.step(16);
  B.confidence = 60; sandbox.step(16); // fires battle 1
  sandbox.B = null; sandbox.step(16);  // battle over
  sandbox.B = mkB(10); sandbox.step(16); // battle 2 baseline
  sandbox.B.confidence = 63; sandbox.step(16);
  ok(calls.toasts.length === 2 && calls.sfx.length === 2, "new battle re-arms and announces again");
}

// 8. B null from the start → silent; return preserved; exceptions propagate
{
  const { sandbox, calls } = mkSandbox({ B: null });
  const r = sandbox.step(16);
  ok(calls.toasts.length === 0 && r === "step-ret", "B null → silent, step return preserved");
  const m = mkSandbox({ B: {} });
  m.sandbox.step(16);
  ok(m.calls.toasts.length === 0, "confidence missing → silent");
  const t = mkSandbox({ throwing: true });
  let threw = false;
  try { t.sandbox.step(16); } catch (e) { threw = e.message === "boom"; }
  ok(threw && t.calls.toasts.length === 0, "original exceptions propagate without announcement");
}

// 9. missing toast/sfx → no throw
{
  const { sandbox, B } = mkSandbox({ B: mkB(50), noToast: true, noSfx: true });
  sandbox.step(16);
  B.confidence = 62;
  let threw = false;
  try { sandbox.step(16); } catch (e) { threw = true; }
  ok(!threw, "missing toast/sfx → no throw");
}

// 10. no window → no-op; late-bound step via DOMContentLoaded
{
  const bare = { console };
  vm.createContext(bare);
  let threw = false;
  try { vm.runInContext(SRC, bare, { filename: "day_hypothesis_ready.js" }); } catch (e) { threw = true; }
  ok(!threw && bare.window === undefined, "loads without window (no-op)");

  const { sandbox, B, calls, fireDOM } = mkSandbox({ B: mkB(50), noStep: true });
  ok(typeof sandbox.step === "undefined", "no step at load → module defers");
  vm.runInContext("step = function (dt) { return 'late-ret'; };", sandbox);
  fireDOM();
  sandbox.step(16); // baseline 50
  B.confidence = 62; sandbox.step(16);
  ok(calls.toasts.length === 1 && calls.toasts[0].html.includes("HYPOTHESIS READY"),
    "late-bound step wrapped after DOMContentLoaded");
}

// 11. watcher errors contained to window.__techopsHypError
{
  const sandbox = {
    console,
    B: mkB(50),
    step: function () {},
    toast: function () { throw new Error("toast-broken"); },
    sfx: function () {},
    document: { addEventListener: function () {} },
  };
  sandbox.window = {};
  vm.createContext(sandbox);
  vm.runInContext(SRC, sandbox, { filename: "day_hypothesis_ready.js" });
  sandbox.step(16);               // baseline 50
  sandbox.B.confidence = 62;
  sandbox.step(16);               // crossing → toast throws → contained
  ok(typeof sandbox.window.__techopsHypError === "string" && sandbox.window.__techopsHypError.includes("toast-broken"),
    "watcher errors contained to window.__techopsHypError");
}

// 12. reset() restores silent-baseline behaviour
{
  const { sandbox, B, calls } = mkSandbox({ B: mkB(50) });
  sandbox.step(16);
  B.confidence = 60; sandbox.step(16); // fires
  sandbox.window.TechOpsHypothesisReady.reset();
  sandbox.step(16);               // new silent baseline at 60
  B.confidence = 52; sandbox.step(16); // drop re-arms
  B.confidence = 61; sandbox.step(16); // crossing after re-arm → fires again
  ok(calls.toasts.length === 2, "reset() restores baseline; re-armed crossing fires again");
}

// 13. double-load does not double-wrap
{
  const sandbox = {
    console,
    B: mkB(50),
    step: function () {},
    toast: function () { sandbox.__toasts = (sandbox.__toasts || 0) + 1; },
    sfx: function () {},
    document: { addEventListener: function () {} },
  };
  sandbox.window = {};
  vm.createContext(sandbox);
  vm.runInContext(SRC, sandbox, { filename: "day_hypothesis_ready.js" });
  vm.runInContext(SRC, sandbox, { filename: "day_hypothesis_ready.js" }); // second load
  sandbox.step(16);                 // baseline 50
  sandbox.B.confidence = 62;
  sandbox.step(16);                 // crossing → exactly one toast
  ok(sandbox.__toasts === 1, "double load → single wrap, announcement fires once");
}

console.log("\n" + passed + " passed, " + failed + " failed");
process.exit(failed === 0 ? 0 : 1);
