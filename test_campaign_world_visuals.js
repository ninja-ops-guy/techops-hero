"use strict";
const assert = require("assert");

const visuals = require("./campaign_world_visuals.js");
assert.strictEqual(visuals.VERSION, 2);
assert.strictEqual(visuals.INTERACT_RANGE, 2.15);
assert.strictEqual(visuals.WALK_FRAME_MS, 135);
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

// Day Shift locomotion deliberately uses the known neutral directional atlas,
// not unclassified frames from the 182-frame combat/action sheet. This prevents
// walk cycles from accidentally selecting attack poses while still using every
// authored directional step frame in the verified player atlas.
assert.deepStrictEqual(visuals.WALK_FRAMES.down, ["down0", "down1", "down0", "down2"]);
assert.deepStrictEqual(visuals.WALK_FRAMES.up, ["up0", "up1", "up0", "up2"]);
assert.deepStrictEqual(visuals.WALK_FRAMES.right, ["right0", "right1", "right0", "right2"]);

let f = visuals.playerFrame({ fx: "down", moving: false }, 0);
assert.strictEqual(f.key, "down0");
assert.strictEqual(f.state, "idle");
f = visuals.playerFrame({ fx: "left", moving: false }, 0);
assert.strictEqual(f.key, "right0");
assert.strictEqual(f.flip, true);
f = visuals.playerFrame({ fx: "down", moving: true }, 135);
assert.strictEqual(f.key, "down1");
f = visuals.playerFrame({ fx: "down", moving: true }, 270);
assert.strictEqual(f.key, "down0");
f = visuals.playerFrame({ fx: "down", moving: true }, 405);
assert.strictEqual(f.key, "down2");
f = visuals.playerFrame({ fx: "right", moving: true }, 135);
assert.strictEqual(f.key, "right1");
f = visuals.playerFrame({ fx: "left", moving: true }, 405);
assert.strictEqual(f.key, "right2");
assert.strictEqual(f.flip, true);
f = visuals.playerFrame({ fx: "up", moving: false, inDialog: true }, 0);
assert.strictEqual(f.key, "laptop");
assert.strictEqual(f.state, "interact");

console.log("Campaign playable world visuals + Day Shift locomotion: PASS");
