/* Contract tests for day_perfect_shift.js (verifier v6) — Node, no browser.
   Loads the module in a vm sandbox with a fake window/document. */
"use strict";
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const SRC = fs.readFileSync(path.join(__dirname, "day_perfect_shift.js"), "utf8");

let passed = 0, failed = 0;
function ok(cond, name) {
  if (cond) { passed++; console.log("  ✓ " + name); }
  else { failed++; console.log("  ✗ " + name); }
}

function mkEls() {
  return {
    "eod-title": { textContent: "" },
    "eod-summary": { innerHTML: "" },
  };
}

// Build a sandbox. opts.endOfDay: function to install (or null for late binding).
function mkSandbox(opts = {}) {
  const els = mkEls();
  const calls = { addXP: [], sfx: [], orig: 0 };
  const domcbs = [];
  const sandbox = {
    console,
    window: {
      document: {
        getElementById: id => els[id] || null,
        addEventListener: (ev, cb) => { if (ev === "DOMContentLoaded") domcbs.push(cb); },
      },
      addXP: opts.noAddXP ? undefined : n => calls.addXP.push(n),
      sfx: opts.noSfx ? undefined : k => calls.sfx.push(k),
    },
  };
  if (opts.endOfDay) {
    sandbox.window.endOfDay = function () {
      calls.orig++;
      els["eod-title"].textContent = opts.title;
      els["eod-summary"].innerHTML = opts.summary;
      if (opts.throws) throw new Error("boom");
      return "orig-ret";
    };
  }
  vm.createContext(sandbox);
  vm.runInContext(SRC, sandbox, { filename: "day_perfect_shift.js" });
  return { sandbox, els, calls, fireDOM: () => domcbs.forEach(cb => cb()) };
}

const PERFECT = { title: "DAY 3 COMPLETE", summary: "🎫 Tickets: 5/5 — <b>ZERO BACKLOG!</b> 👑<br>✨ Total XP: 100" };
const MESSY = { title: "DAY 3 COMPLETE", summary: "🎫 Tickets: 4/5 <span>(1 unresolved · handed off, -rep)</span>" };

// 1. surface
{
  const { sandbox } = mkSandbox({ endOfDay: () => { }, title: "", summary: "" });
  const api = sandbox.window.TechOpsPerfectShift;
  ok(api && typeof api.reset === "function" && api.BONUS_XP === 25, "exposes TechOpsPerfectShift with reset()");
}

// 2. wraps endOfDay present at load; return value preserved
{
  const { sandbox } = mkSandbox({ endOfDay: () => { }, ...MESSY });
  const ret = sandbox.window.endOfDay();
  ok(ret === "orig-ret", "wraps endOfDay at load; original return value preserved");
}

// 3. perfect shift pays out: XP + banner + sfx, original ran first
{
  const { sandbox, els, calls } = mkSandbox({ endOfDay: () => { }, ...PERFECT });
  sandbox.window.endOfDay();
  ok(calls.orig === 1 && calls.addXP.length === 1 && calls.addXP[0] === 25, "perfect shift → addXP(25) once");
  ok(els["eod-summary"].innerHTML.includes("PERFECT SHIFT") && els["eod-summary"].innerHTML.includes("ZERO BACKLOG"),
    "banner appended to summary (original markup intact)");
  ok(calls.sfx.length === 1 && calls.sfx[0] === "promote", "sfx('promote') fired");
}

// 4. messy day: no payout
{
  const { sandbox, els, calls } = mkSandbox({ endOfDay: () => { }, ...MESSY });
  sandbox.window.endOfDay();
  ok(calls.addXP.length === 0 && calls.sfx.length === 0 && !els["eod-summary"].innerHTML.includes("PERFECT SHIFT"),
    "non-perfect day → no XP, no banner, no sfx");
}

// 5. idempotent per day
{
  const { sandbox, calls } = mkSandbox({ endOfDay: () => { }, ...PERFECT });
  sandbox.window.endOfDay();
  sandbox.window.endOfDay();
  ok(calls.addXP.length === 1 && calls.sfx.length === 1, "same day twice → awarded once");
}

// 6. new day re-arms
{
  const els = mkEls();
  const calls = { addXP: [], sfx: [] };
  const sandbox = {
    console,
    window: {
      document: { getElementById: id => els[id] || null, addEventListener: () => { } },
      addXP: n => calls.addXP.push(n),
      sfx: k => calls.sfx.push(k),
      __day: 3,
    },
  };
  sandbox.window.endOfDay = function () {
    els["eod-title"].textContent = `DAY ${sandbox.window.__day} COMPLETE`;
    els["eod-summary"].innerHTML = "🎫 Tickets: 5/5 — <b>ZERO BACKLOG!</b> 👑";
  };
  vm.createContext(sandbox);
  vm.runInContext(SRC, sandbox, { filename: "day_perfect_shift.js" });
  sandbox.window.endOfDay();
  sandbox.window.__day = 4;
  sandbox.window.endOfDay();
  ok(calls.addXP.length === 2 && calls.addXP.every(n => n === 25), "next perfect day re-arms the bonus");
}

// 7. game-over screen never qualifies (even with ZERO BACKLOG text)
{
  const { sandbox, calls } = mkSandbox({
    endOfDay: () => { }, title: "🏥 RUN TERMINATED",
    summary: "ZERO BACKLOG mentioned in flavor text",
  });
  sandbox.window.endOfDay();
  ok(calls.addXP.length === 0 && calls.sfx.length === 0, "game-over title never awards");
}

// 8. addXP missing → no throw, banner + sfx still land
{
  const { sandbox, els, calls } = mkSandbox({ endOfDay: () => { }, ...PERFECT, noAddXP: true });
  let threw = false;
  try { sandbox.window.endOfDay(); } catch (e) { threw = true; }
  ok(!threw && els["eod-summary"].innerHTML.includes("PERFECT SHIFT") && calls.sfx.length === 1,
    "missing addXP → banner + sfx still applied, no throw");
}

// 9. original exception propagates; no award
{
  const { sandbox, calls } = mkSandbox({ endOfDay: () => { }, ...PERFECT, throws: true });
  let msg = null;
  try { sandbox.window.endOfDay(); } catch (e) { msg = e.message; }
  ok(msg === "boom" && calls.addXP.length === 0, "original exception propagates; no award on failure");
}

// 10. late-bound endOfDay picked up via DOMContentLoaded
{
  const { sandbox, calls, fireDOM } = mkSandbox({ endOfDay: null });
  const els = mkEls();
  sandbox.window.document.getElementById = id => els[id] || null;
  sandbox.window.endOfDay = function () {
    els["eod-title"].textContent = "DAY 1 COMPLETE";
    els["eod-summary"].innerHTML = "🎫 3/3 — <b>ZERO BACKLOG!</b> 👑";
  };
  fireDOM();
  sandbox.window.endOfDay();
  ok(calls.addXP.length === 1 && calls.addXP[0] === 25, "late-bound endOfDay wrapped after DOMContentLoaded");
}

// 11. double DOMContentLoaded retry does not double-wrap
{
  const { sandbox, calls, fireDOM } = mkSandbox({ endOfDay: null });
  const els = mkEls();
  sandbox.window.document.getElementById = id => els[id] || null;
  sandbox.window.endOfDay = function () {
    els["eod-title"].textContent = "DAY 2 COMPLETE";
    els["eod-summary"].innerHTML = "ZERO BACKLOG";
    calls.orig2 = (calls.orig2 || 0) + 1;
  };
  fireDOM(); fireDOM();
  sandbox.window.endOfDay();
  ok(calls.orig2 === 1 && calls.addXP.length === 1, "retry is idempotent — original invoked once per call");
}

// 12. reset() re-arms the same day
{
  const { sandbox, calls } = mkSandbox({ endOfDay: () => { }, ...PERFECT });
  sandbox.window.endOfDay();
  sandbox.window.TechOpsPerfectShift.reset();
  sandbox.window.endOfDay();
  ok(calls.addXP.length === 2, "reset() re-arms the same day");
}

// 13. loads without window
{
  let threw = false;
  try {
    const sb = { console };
    vm.createContext(sb);
    vm.runInContext(SRC, sb, { filename: "day_perfect_shift.js" });
  } catch (e) { threw = true; }
  ok(!threw, "loads cleanly without window");
}

// 14. missing DOM elements → no throw, no award
{
  const calls = { addXP: [] };
  const sandbox = {
    console,
    window: {
      document: { getElementById: () => null, addEventListener: () => { } },
      addXP: n => calls.addXP.push(n),
      sfx: () => { },
      endOfDay: function () { return 1; },
    },
  };
  vm.createContext(sandbox);
  vm.runInContext(SRC, sandbox, { filename: "day_perfect_shift.js" });
  let threw = false;
  try { sandbox.window.endOfDay(); } catch (e) { threw = true; }
  ok(!threw && calls.addXP.length === 0, "missing #eod elements → safe no-op");
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
