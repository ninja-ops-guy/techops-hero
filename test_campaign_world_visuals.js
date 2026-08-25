"use strict";
const assert = require("assert");

const visuals = require("./campaign_world_visuals.js");
assert.strictEqual(visuals.VERSION, 1);
assert.strictEqual(visuals.INTERACT_RANGE, 2.15);
assert.strictEqual(visuals.distance(0, 0, 3, 4), 5);

const state = {
  px: 10,
  py: 10,
  npcs: [
    { id: "ambient", x: 11, y: 10, ambient: true, done: false },
    { id: "ticket", x: 10, y: 11, ambient: false, done: false }
  ],
  devices: [{ id: "device", x: 12, y: 10, fixed: false }],
  portals: [{ id: "portal", x: 10, y: 12 }]
};

let target = visuals.nearestInteractable(state);
assert.strictEqual(target.kind, "npc");
assert.strictEqual(target.source.id, "ticket");
assert.strictEqual(target.distance, 1);

state.npcs[1].done = true;
target = visuals.nearestInteractable(state);
assert.strictEqual(target.source.id, "ambient");

state.npcs[0].done = true;
target = visuals.nearestInteractable(state);
assert.strictEqual(target.kind, "device");
assert.strictEqual(target.distance, 2);

state.devices[0].fixed = true;
target = visuals.nearestInteractable(state);
assert.strictEqual(target.kind, "portal");

state.portals = [];
assert.strictEqual(visuals.nearestInteractable(state), null);

const profile = visuals.lightProfile({ px: 0, py: 0 });
assert.ok(profile.vignette >= 0 && profile.vignette < 0.5);
assert.ok(profile.warm >= 0 && profile.cool >= 0);

console.log("Campaign playable world visuals: PASS");
