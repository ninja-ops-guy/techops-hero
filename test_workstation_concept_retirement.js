"use strict";
const assert = require("assert");
const fs = require("fs");
const vm = require("vm");

const src = fs.readFileSync("workstation_cinematic_clarity_patch.js", "utf8");
let currentOverlay = null;
let hideCalls = 0;

function overlay(classNames) {
  const classes = new Set(String(classNames || "").split(/\s+/).filter(Boolean));
  const node = {
    id: "act1-reference",
    classList: { contains(name) { return classes.has(name); } },
    parentNode: {
      removeChild(child) {
        if (child === currentOverlay) currentOverlay = null;
      }
    }
  };
  return node;
}

const document = {
  documentElement: {},
  getElementById(id) { return id === "act1-reference" ? currentOverlay : null; },
  querySelector() { return null; }
};

function MutationObserver(callback) {
  this.callback = callback;
  this.observe = function () {};
  this.disconnect = function () {};
}

const context = {
  console,
  document,
  MutationObserver,
  __techopsAct1ReferenceScene: null,
  TechOpsCampaignNativeAct1Visuals: {
    hide(immediate) {
      assert.strictEqual(immediate, true, "retired workstation board must be removed synchronously");
      hideCalls++;
      currentOverlay = null;
      context.__techopsAct1ReferenceScene = null;
      return true;
    }
  },
  dlg(name) {
    // Simulate the legacy Day 1 visual wrapper mounting the obsolete board
    // immediately before the actual dialogue UI is returned.
    if (/WORKSTATION|COMPANY|ENGINEERING THE HUMAN CONNECTION|09:00 \/\/ DAY SHIFT/i.test(String(name || ""))) {
      currentOverlay = overlay("act1-reference a1-from-world a1-first_person a1-company_video");
      context.__techopsAct1ReferenceScene = "workstation";
    }
    return { name };
  }
};
context.globalThis = context;
vm.createContext(context);
vm.runInContext(src, context, { filename: "workstation_cinematic_clarity_patch.js" });

const guard = context.TechOpsWorkstationClarityPatch;
assert.ok(guard, "retirement guard must install");
assert.strictEqual(guard.VERSION, 2);
assert.strictEqual(guard.RETIRED, true);
assert.strictEqual(typeof guard.retireConceptOverlay, "function");

// Ordinary user/NPC dialogue must remain ordinary dialogue and must not create
// or remove unrelated presentation state.
const before = hideCalls;
const normal = context.dlg("USER // SHIPPING REQUESTER");
assert.deepStrictEqual(normal, { name: "USER // SHIPPING REQUESTER" });
assert.strictEqual(currentOverlay, null);
assert.strictEqual(hideCalls, before, "ordinary dialogue must not trip the workstation retirement path");

// The obsolete concept board may still be mounted by historical Day 1 code,
// but the guard must remove it inside the same dialogue call stack.
const retired = context.dlg("MIKE // WORKSTATION");
assert.deepStrictEqual(retired, { name: "MIKE // WORKSTATION" });
assert.strictEqual(currentOverlay, null, "workstation concept board must never survive the dialogue call");
assert.strictEqual(context.__techopsAct1ReferenceScene, null);
assert.ok(hideCalls > before, "workstation retirement must invoke the canonical visual hide path");

// Do not erase legitimate Day 1 authored presentation such as standup/ticket scenes.
currentOverlay = overlay("act1-reference a1-from-world a1-board a1-owned");
context.__techopsAct1ReferenceScene = "standup";
const hideBeforeStandup = hideCalls;
assert.strictEqual(guard.retireConceptOverlay(), false);
assert.ok(currentOverlay, "non-workstation Day 1 presentation must remain available");
assert.strictEqual(hideCalls, hideBeforeStandup);

const loader = fs.readFileSync("campaign_native_act1_visuals.js", "utf8");
assert.ok(/workstation_cinematic_clarity_patch\.js\?v=20260904-workstation-retired-v2/.test(loader),
  "Day 1 visual loader must request the retired v2 workstation guard instead of the old clarity build");

console.log("Workstation concept retirement regression: PASS");
