/* Contract tests for day_perfect_streak.js (verifier v7) — Node, no browser. */
"use strict";
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const SRC = fs.readFileSync(path.join(__dirname, "day_perfect_streak.js"), "utf8");

let passed = 0, failed = 0;
function ok(cond, name) {
  if (cond) { passed++; console.log("  ✓ " + name); }
  else { failed++; console.log("  ✗ " + name); }
}

function mkSandbox(opts = {}) {
  const els = { "eod-title": { textContent: "" }, "eod-summary": { innerHTML: "" } };
  const calls = { addXP: [], sfx: [] };
  const domcbs = [];
  const mem = Object.assign({}, opts.store || {});
  const sandbox = {
    console,
    window: {
      document: {
        getElementById: id => els[id] || null,
        addEventListener: (ev, cb) => { if (ev === "DOMContentLoaded") domcbs.push(cb); },
      },
      localStorage: {
        getItem: k => (k in mem ? mem[k] : null),
        setItem: (k, v) => { mem[k] = String(v); },
        removeItem: k => { delete mem[k]; },
      },
      addXP: opts.noAddXP ? undefined : n => calls.addXP.push(n),
      sfx: k => calls.sfx.push(k),
    },
  };
  const render = (title, summary) => {
    sandbox.window.endOfDay = function () {
      els["eod-title"].textContent = title;
      els["eod-summary"].innerHTML = summary;
      return "orig-ret";
    };
  };
  vm.createContext(sandbox);
  return { sandbox, els, calls, mem, render, fireDOM: () => domcbs.forEach(cb => cb()) };
}
const PERFECT = d => [`DAY ${d} COMPLETE`, "🎫 Tickets: 5/5 — <b>ZERO BACKLOG!</b> 👑"];
const MESSY = d => [`DAY ${d} COMPLETE`, "🎫 Tickets: 4/5 (1 unresolved)"];

// 1. surface
{
  const { sandbox } = mkSandbox();
  vm.runInContext(SRC, sandbox, { filename: "day_perfect_streak.js" });
  const api = sandbox.window.TechOpsPerfectStreak;
  ok(api && typeof api.peek === "function" && typeof api.reset === "function" && api.KEY === "techops_perfect_streak",
    "exposes TechOpsPerfectStreak with peek()/reset()");
}

// helper: load module, then bind endOfDay + DOMContentLoaded
function boot(opts) {
  const env = mkSandbox(opts);
  vm.runInContext(SRC, env.sandbox, { filename: "day_perfect_streak.js" });
  env.render(...(opts.first || PERFECT(3)));
  env.fireDOM();
  return env;
}

// 2. consecutive perfect day → streak 2, +15 XP, banner, persisted
{
  const env = boot({ store: { techops_perfect_streak: JSON.stringify({ day: 2, streak: 1 }) } });
  env.sandbox.window.endOfDay();
  ok(env.calls.addXP.length === 1 && env.calls.addXP[0] === 15, "streak 2 → +15 XP");
  ok(env.els["eod-summary"].innerHTML.includes("PERFECT STREAK ×2"), "streak banner ×2 appended");
  ok(env.calls.sfx.length === 1 && env.calls.sfx[0] === "promote", "sfx fired");
  ok(env.mem.techops_perfect_streak === JSON.stringify({ day: 3, streak: 2 }), "state persisted {day:3,streak:2}");
}

// 3. fresh perfect day → streak 1, no extra payout, state saved
{
  const env = boot({});
  env.sandbox.window.endOfDay();
  ok(env.calls.addXP.length === 0 && !env.els["eod-summary"].innerHTML.includes("PERFECT STREAK"),
    "streak 1 → no extra XP or banner");
  ok(env.mem.techops_perfect_streak === JSON.stringify({ day: 3, streak: 1 }), "state saved for tomorrow");
}

// 4. non-consecutive day restarts at 1
{
  const env = boot({ store: { techops_perfect_streak: JSON.stringify({ day: 1, streak: 4 }) }, first: PERFECT(5) });
  env.sandbox.window.endOfDay();
  ok(env.calls.addXP.length === 0 && env.mem.techops_perfect_streak === JSON.stringify({ day: 5, streak: 1 }),
    "gap in days → streak restarts at 1");
}

// 5. messy day breaks the streak, persisted
{
  const env = boot({ store: { techops_perfect_streak: JSON.stringify({ day: 2, streak: 2 }) }, first: MESSY(3) });
  env.sandbox.window.endOfDay();
  ok(env.calls.addXP.length === 0 && env.mem.techops_perfect_streak === JSON.stringify({ day: 3, streak: 0 }),
    "messy day → streak reset to 0 and persisted");
}

// 6. game-over title breaks the streak, no payout
{
  const env = boot({ store: { techops_perfect_streak: JSON.stringify({ day: 2, streak: 3 }) }, first: ["🏥 RUN TERMINATED", "ZERO BACKLOG flavor"] });
  env.sandbox.window.endOfDay();
  ok(env.calls.addXP.length === 0 && env.mem.techops_perfect_streak === JSON.stringify({ day: -1, streak: 0 }),
    "game-over → streak reset, no payout");
}

// 7. same day twice → no double count
{
  const env = boot({ store: { techops_perfect_streak: JSON.stringify({ day: 2, streak: 1 }) } });
  env.sandbox.window.endOfDay();
  env.sandbox.window.endOfDay();
  ok(env.calls.addXP.length === 1 && env.mem.techops_perfect_streak === JSON.stringify({ day: 3, streak: 2 }),
    "same day repeated → awarded once");
}

// 8. streak 3+ → +35 XP, banner ×3
{
  const env = boot({ store: { techops_perfect_streak: JSON.stringify({ day: 2, streak: 2 }) } });
  env.sandbox.window.endOfDay();
  ok(env.calls.addXP[0] === 35 && env.els["eod-summary"].innerHTML.includes("PERFECT STREAK ×3"),
    "streak 3 → +35 XP, banner ×3");
}

// 9. corrupt localStorage → treated as fresh
{
  const env = boot({ store: { techops_perfect_streak: "{not json" } });
  env.sandbox.window.endOfDay();
  ok(env.mem.techops_perfect_streak === JSON.stringify({ day: 3, streak: 1 }) && env.calls.addXP.length === 0,
    "corrupt stored value → streak starts at 1");
}

// 10. return preserved; exception propagates without state change
{
  const env = mkSandbox({});
  vm.runInContext(SRC, env.sandbox, { filename: "day_perfect_streak.js" });
  env.sandbox.window.endOfDay = function () {
    env.els["eod-title"].textContent = "DAY 1 COMPLETE";
    env.els["eod-summary"].innerHTML = "ZERO BACKLOG";
    return "orig-ret";
  };
  env.fireDOM();
  ok(env.sandbox.window.endOfDay() === "orig-ret", "original return value preserved");
  const env2 = mkSandbox({});
  vm.runInContext(SRC, env2.sandbox, { filename: "day_perfect_streak.js" });
  env2.sandbox.window.endOfDay = function () { throw new Error("boom"); };
  env2.fireDOM();
  let msg = null;
  try { env2.sandbox.window.endOfDay(); } catch (e) { msg = e.message; }
  ok(msg === "boom" && env2.mem.techops_perfect_streak === undefined, "original exception propagates; no state written");
}

// 11. addXP missing → no throw, banner still lands
{
  const env = boot({ store: { techops_perfect_streak: JSON.stringify({ day: 2, streak: 1 }) }, noAddXP: true });
  let threw = false;
  try { env.sandbox.window.endOfDay(); } catch (e) { threw = true; }
  ok(!threw && env.els["eod-summary"].innerHTML.includes("PERFECT STREAK ×2"),
    "missing addXP → banner still applied, no throw");
}

// 12. late-bound endOfDay via DOMContentLoaded (also exercised by boot); missing window safe
{
  let threw = false;
  try {
    const sb = { console };
    vm.createContext(sb);
    vm.runInContext(SRC, sb, { filename: "day_perfect_streak.js" });
  } catch (e) { threw = true; }
  ok(!threw, "loads cleanly without window");
}

// 13. reset() clears stored state
{
  const env = boot({ store: { techops_perfect_streak: JSON.stringify({ day: 2, streak: 4 }) } });
  env.sandbox.window.TechOpsPerfectStreak.reset();
  ok(env.sandbox.window.TechOpsPerfectStreak.peek() === null && env.mem.techops_perfect_streak === undefined,
    "reset() clears stored streak");
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
