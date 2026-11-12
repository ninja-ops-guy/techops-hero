/* Contract tests for day_quitting_time.js (verifier v12) — Node, no browser. */
"use strict";
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const SRC = fs.readFileSync(path.join(__dirname, "day_quitting_time.js"), "utf8");

let passed = 0, failed = 0;
function ok(cond, name) {
  if (cond) { passed++; console.log("  ✓ " + name); }
  else { failed++; console.log("  ✗ " + name); }
}

const mkS = (clock, total, done, day) => ({
  day: day === undefined ? 1 : day,
  clock: clock === undefined ? 900 : clock,
  ticketsTotal: total === undefined ? 5 : total,
  ticketsDone: done === undefined ? 1 : done,
});

function mkSandbox(opts = {}) {
  const calls = { toasts: [], sfx: [], step: 0 };
  const domcbs = [];
  const S = opts.S === undefined ? mkS(900, 5, 1) : opts.S;
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
  // module assigns window.TechOpsQuittingTime; bare S/step/toast/sfx resolve via sandbox globals
  vm.createContext(sandbox);
  vm.runInContext(SRC, sandbox, { filename: "day_quitting_time.js" });
  return { sandbox, S, calls, fireDOM: () => domcbs.forEach(cb => cb()) };
}

// 1. surface
{
  const { sandbox } = mkSandbox();
  const api = sandbox.window.TechOpsQuittingTime;
  ok(api && api.WARN_AT === 990 && typeof api.reset === "function",
    "exposes TechOpsQuittingTime with WARN_AT=990 (16:30) + reset()");
}

// 2. baseline: first poll never fires, even past 4:30 with tickets open
{
  const { sandbox, calls } = mkSandbox({ S: mkS(1000, 5, 1) });
  sandbox.step(16);
  ok(calls.toasts.length === 0 && calls.sfx.length === 0, "loaded save at 16:40 → silent baseline");
}

// 3. crossing 16:30 with open tickets → warning toast + sfx("bad"), once
{
  const { sandbox, S, calls } = mkSandbox({ S: mkS(900, 5, 2) });
  sandbox.step(16); // baseline
  S.clock = 990;
  sandbox.step(16);
  ok(calls.toasts.length === 1 && calls.toasts[0].html.includes("4:30 PM") &&
     calls.toasts[0].html.includes("3 tickets") && calls.toasts[0].html.includes("roll to the backlog") &&
     calls.toasts[0].ms === 3400,
    "16:30 crossing with 3 open → quitting-time toast with live count");
  ok(calls.sfx.length === 1 && calls.sfx[0] === "bad", "crossing plays sfx('bad') once");
}

// 4. singular phrasing for exactly one open ticket
{
  const { sandbox, S, calls } = mkSandbox({ S: mkS(900, 5, 4) });
  sandbox.step(16);
  S.clock = 991;
  sandbox.step(16);
  ok(calls.toasts.length === 1 && calls.toasts[0].html.includes("1 ticket") &&
     !calls.toasts[0].html.includes("1 tickets"), "one open ticket → singular phrasing");
}

// 5. staying past 16:30 all afternoon: no repeat fire that day
{
  const { sandbox, S, calls } = mkSandbox({ S: mkS(900, 5, 1) });
  sandbox.step(16);
  S.clock = 990; sandbox.step(16); // fires
  S.clock = 1000; sandbox.step(16);
  S.clock = 1010; sandbox.step(16);
  ok(calls.toasts.length === 1 && calls.sfx.length === 1, "rest of the afternoon stays silent");
}

// 6. queue already clear at 16:30 → no toast, and stays latched
{
  const { sandbox, S, calls } = mkSandbox({ S: mkS(900, 5, 5) });
  sandbox.step(16);
  S.clock = 990; sandbox.step(16); // clear queue: latch silently
  S.ticketsTotal = 7;              // late tickets arrive
  S.clock = 1000; sandbox.step(16);
  ok(calls.toasts.length === 0, "clear queue at 16:30 → silent; latch survives late tickets");
}

// 7. next day re-arms and warns again
{
  const { sandbox, S, calls } = mkSandbox({ S: mkS(900, 5, 1) });
  sandbox.step(16);
  S.clock = 990; sandbox.step(16); // fires day 1
  S.day = 2; S.clock = 540; S.ticketsTotal = 6; S.ticketsDone = 0; // new shift
  sandbox.step(16); // 9:00 day 2
  S.clock = 990; sandbox.step(16); // 16:30 day 2
  ok(calls.toasts.length === 2 && calls.sfx.length === 2 &&
     calls.toasts[1].html.includes("6 tickets"), "new day re-arms; warns again with fresh count");
}

// 8. S null / clock missing → silent; return preserved; exceptions propagate
{
  const { sandbox, calls } = mkSandbox({ S: null });
  const r = sandbox.step(16);
  ok(calls.toasts.length === 0 && r === "step-ret", "S null → silent, step return preserved");
  const m = mkSandbox({ S: { day: 1, ticketsTotal: 5, ticketsDone: 1 } });
  m.sandbox.step(16);
  ok(m.calls.toasts.length === 0, "clock missing → silent");
  const t = mkSandbox({ throwing: true });
  let threw = false;
  try { t.sandbox.step(16); } catch (e) { threw = e.message === "boom"; }
  ok(threw && t.calls.toasts.length === 0, "original exceptions propagate without warning");
}

// 9. missing toast/sfx → no throw
{
  const { sandbox, S } = mkSandbox({ S: mkS(900, 5, 1), noToast: true, noSfx: true });
  sandbox.step(16);
  S.clock = 990;
  let threw = false;
  try { sandbox.step(16); } catch (e) { threw = true; }
  ok(!threw, "missing toast/sfx → no throw");
}

// 10. no window → no-op; late-bound step via DOMContentLoaded
{
  const bare = { console };
  vm.createContext(bare);
  let threw = false;
  try { vm.runInContext(SRC, bare, { filename: "day_quitting_time.js" }); } catch (e) { threw = true; }
  ok(!threw && bare.window === undefined, "loads without window (no-op)");

  const { sandbox, S, calls, fireDOM } = mkSandbox({ S: mkS(900, 5, 1), noStep: true });
  ok(typeof sandbox.step === "undefined", "no step at load → module defers");
  vm.runInContext("step = function (dt) { return 'late-ret'; };", sandbox);
  fireDOM();
  sandbox.step(16); // baseline 900
  S.clock = 990; sandbox.step(16);
  ok(calls.toasts.length === 1 && calls.toasts[0].html.includes("4:30 PM"),
    "late-bound step wrapped after DOMContentLoaded");
}

// 11. watcher errors contained to window.__techopsClockError
{
  const sandbox = {
    console,
    S: mkS(900, 5, 1),
    step: function () {},
    toast: function () { throw new Error("toast-broken"); },
    sfx: function () {},
    document: { addEventListener: function () {} },
  };
  sandbox.window = {};
  vm.createContext(sandbox);
  vm.runInContext(SRC, sandbox, { filename: "day_quitting_time.js" });
  sandbox.step(16);               // baseline 900
  sandbox.S.clock = 990;
  sandbox.step(16);               // crossing → toast throws → contained
  ok(typeof sandbox.window.__techopsClockError === "string" && sandbox.window.__techopsClockError.includes("toast-broken"),
    "watcher errors contained to window.__techopsClockError");
}

// 12. reset() restores silent-baseline behaviour
{
  const { sandbox, S, calls } = mkSandbox({ S: mkS(900, 5, 1) });
  sandbox.step(16);
  S.clock = 990; sandbox.step(16); // fires
  sandbox.window.TechOpsQuittingTime.reset();
  sandbox.step(16);               // new silent baseline at 990, same day
  S.day = 2; S.clock = 540; sandbox.step(16);
  S.clock = 990; sandbox.step(16);
  ok(calls.toasts.length === 2, "reset() restores baseline; next day crossing fires again");
}

// 13. double-load does not double-wrap
{
  const sandbox = {
    console,
    S: mkS(900, 5, 1),
    step: function () {},
    toast: function () { sandbox.__toasts = (sandbox.__toasts || 0) + 1; },
    sfx: function () {},
    document: { addEventListener: function () {} },
  };
  sandbox.window = {};
  vm.createContext(sandbox);
  vm.runInContext(SRC, sandbox, { filename: "day_quitting_time.js" });
  vm.runInContext(SRC, sandbox, { filename: "day_quitting_time.js" }); // second load
  sandbox.step(16);                 // baseline 900
  sandbox.S.clock = 990;
  sandbox.step(16);                 // crossing → exactly one toast
  ok(sandbox.__toasts === 1, "double load → single wrap, warning fires once");
}

console.log("\n" + passed + " passed, " + failed + " failed");
process.exit(failed === 0 ? 0 : 1);
