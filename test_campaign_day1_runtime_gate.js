"use strict";
const assert = require("assert");
const Campaign = require("./campaign_act1.js");

const memory = {};
global.localStorage = {
  getItem(key) { return memory[key] || null; },
  setItem(key, value) { memory[key] = String(value); }
};

global.TechOpsCampaign = Campaign;
global.TechOpsCampaignRuntime = require("./campaign_runtime.js");
global.TechOpsSector04 = require("./campaign_sector04.js");
global.TechOpsCampaignAssets = require("./campaign_assets.js");

global.adjacent = function (a, b) { return Math.abs(a.x - b.x) + Math.abs(a.y - b.y) <= 1; };
let lastDialog = null;
global.dlg = function (name, body, options) { lastDialog = { name, body, options }; global.S.inDialog = true; };
global.closeDlg = function () { global.S.inDialog = false; };
global.toast = function () {};

let originalClockCalls = 0;
let originalInteractCalls = 0;
global.advanceClock = function (minutes) {
  originalClockCalls++;
  global.S.clock += minutes;
  global.S.tickets[0].age += minutes;
  global.S.repPenalty = true;
  global.S.majorIncident = true;
  global.S.cascade = true;
  if (global.S.clock >= 17 * 60) global.S.forceEnded = true;
  return global.S.clock;
};
global.interact = function () { originalInteractCalls++; return "base-interaction"; };

global.S = {
  day: 1,
  clock: 9 * 60,
  px: 10,
  py: 10,
  inDialog: false,
  inBattle: false,
  nightMode: false,
  meta: {},
  npcs: [{ id: 1, x: 11, y: 10, ambient: false, done: false }],
  portals: [],
  devices: [],
  tickets: [{ age: 0 }]
};

const state = Campaign.createInitialState();
Campaign.assignTicket(state, "shipping_cannot_print", "mike");
Campaign.assignTicket(state, "plating_workstation_down", "amit");
Campaign.assignTicket(state, "impossible_access_event", "mike");
Campaign.completeStandup(state);
Campaign.save(state, global.localStorage);

const native = require("./campaign_native_act1.js");
assert.strictEqual(native.install(), true);
assert.strictEqual(native.dayWorkLocked(), true);
assert.strictEqual(global.S.meta.ticketTimersActive, false);

// Positive time is frozen before explicit CLOCK IN. None of the base aging side effects run.
assert.strictEqual(global.advanceClock(600), 9 * 60);
assert.strictEqual(originalClockCalls, 0);
assert.strictEqual(global.S.clock, 9 * 60);
assert.strictEqual(global.S.tickets[0].age, 0);
assert.strictEqual(global.S.repPenalty, undefined);
assert.strictEqual(global.S.majorIncident, undefined);
assert.strictEqual(global.S.cascade, undefined);
assert.strictEqual(global.S.forceEnded, undefined);

// Procedural ticket work is blocked, but the player is routed back to the authored workstation.
global.interact();
assert.strictEqual(originalInteractCalls, 0);
assert.strictEqual(lastDialog.name, "SHIFT PAUSED");
assert.ok(lastDialog.body.includes("clock has not started"));
assert.strictEqual(lastDialog.options[0].t, "Open workstation");
global.S.inDialog = false;

// Ambient/non-work exploration still falls through to the base runtime.
global.S.npcs[0].ambient = true;
assert.strictEqual(global.interact(), "base-interaction");
assert.strictEqual(originalInteractCalls, 1);

// Complete the canonical workstation contract and explicitly unlock the shift.
let unlocked = Campaign.load(global.localStorage);
Campaign.checkWorkstation(unlocked);
Campaign.hearRedInMirror(unlocked);
Campaign.findFeliciaBlog(unlocked);
Campaign.completeFeliciaVideo(unlocked, { started: true });
Campaign.unlockDayWork(unlocked);
Campaign.save(unlocked, global.localStorage);
native.syncDayWorkMeta();
assert.strictEqual(native.dayWorkLocked(), false);
assert.strictEqual(global.S.meta.ticketTimersActive, true);

// After CLOCK IN the untouched base clock/aging path resumes.
global.S.npcs[0].ambient = false;
assert.strictEqual(global.advanceClock(600), 19 * 60);
assert.strictEqual(originalClockCalls, 1);
assert.strictEqual(global.S.tickets[0].age, 600);
assert.strictEqual(global.S.repPenalty, true);
assert.strictEqual(global.S.majorIncident, true);
assert.strictEqual(global.S.cascade, true);
assert.strictEqual(global.S.forceEnded, true);
assert.strictEqual(global.interact(), "base-interaction");
assert.strictEqual(originalInteractCalls, 2);

console.log("Canonical Day 1 runtime gate: PASS");
