#!/usr/bin/env node
// test_save_background_guard.js — contracts for the background-tab save flush.
// The bug class: a backgrounded tab killed by the OS loses every action since
// the last gameplay-triggered save(). The guard must flush on pagehide and on
// visibilitychange(hidden), stay silent on visible, and never let a save
// failure break the page lifecycle.
"use strict";
const fs = require("fs");
const vm = require("vm");

const src = fs.readFileSync("save_background_guard.js", "utf8");
let passed = 0, failed = 0;
function check(name, ok) {
  if (ok) { passed++; console.log("PASS", name); }
  else { failed++; console.error("FAIL", name); }
}

function makeWorld({ saveImpl } = {}) {
  const listeners = { window: {}, document: {} };
  const sandbox = {
    console,
    window: {
      addEventListener: (type, fn) => { (listeners.window[type] = listeners.window[type] || []).push(fn); },
    },
    document: {
      visibilityState: "visible",
      addEventListener: (type, fn) => { (listeners.document[type] = listeners.document[type] || []).push(fn); },
    },
  };
  sandbox.window.document = sandbox.document;
  sandbox.save = saveImpl || (() => true);
  vm.createContext(sandbox);
  vm.runInContext(src, sandbox);
  return { sandbox, listeners };
}

// 1. registers both listeners
{
  const { listeners } = makeWorld();
  check("registers pagehide listener", (listeners.window.pagehide || []).length === 1);
  check("registers visibilitychange listener", (listeners.document.visibilitychange || []).length === 1);
}

// 2. pagehide flushes the save
{
  let calls = 0;
  const { listeners } = makeWorld({ saveImpl: () => { calls++; return true; } });
  listeners.window.pagehide[0]();
  check("pagehide triggers save()", calls === 1);
}

// 3. visibilitychange -> hidden flushes; visible stays silent
{
  let calls = 0;
  const { sandbox, listeners } = makeWorld({ saveImpl: () => { calls++; return true; } });
  sandbox.document.visibilityState = "hidden";
  listeners.document.visibilitychange[0]();
  check("visibilitychange(hidden) triggers save()", calls === 1);
  sandbox.document.visibilityState = "visible";
  listeners.document.visibilitychange[0]();
  check("visibilitychange(visible) does not save", calls === 1);
}

// 4. a throwing save() is contained and recorded, never rethrown
{
  const { sandbox, listeners } = makeWorld({ saveImpl: () => { throw new Error("quota exceeded"); } });
  let threw = false;
  try { listeners.window.pagehide[0](); } catch (e) { threw = true; }
  check("save failure does not escape the lifecycle handler", !threw);
  check("save failure is recorded on window.__techopsSaveError", /quota exceeded/.test(String(sandbox.window.__techopsSaveError || "")));
}

// 5. no window (non-browser embedding) is a safe no-op
{
  let threw = false;
  try { vm.runInNewContext(src, { console }); } catch (e) { threw = true; }
  check("loads safely without a window object", !threw);
}

// 6. missing save() (script loaded standalone) does not throw on events
{
  const sandbox = {
    console,
    window: { addEventListener: (t, f) => { (sandbox._l = sandbox._l || {})[t] = f; } },
    document: { visibilityState: "hidden", addEventListener: () => {} },
  };
  vm.createContext(sandbox);
  vm.runInContext(src, sandbox);
  let threw = false;
  try { sandbox._l.pagehide(); } catch (e) { threw = true; }
  check("pagehide without save() is a no-op", !threw);
}

console.log(`\nsave-background-guard contracts: ${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
