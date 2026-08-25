"use strict";
const assert = require("assert");
const manifest = require("./mike_animation_manifest.js");
const world = require("./campaign_world_visuals.js");

assert.strictEqual(manifest.VERSION, 2);
assert.strictEqual(manifest.WALK_FRAME_MS, 135);
assert.strictEqual(manifest.DAY_SHIFT.atlas, "PLAYER_ATLAS");
assert.strictEqual(manifest.ACTION_ATLAS.atlas, "MIKE_ACTIONS");
assert.strictEqual(manifest.ACTION_ATLAS.frameCount, 182);
assert.strictEqual(manifest.ACTION_ATLAS.status, "unclassified");
assert.strictEqual(manifest.ACTION_ATLAS.sourceStatus, "metadata_only");
assert.deepStrictEqual(manifest.ACTION_ATLAS.payloadGlobals, ["TO_MIKE_ACTIONS", "__GK_MIKE_ACTIONS"]);
assert.deepStrictEqual(manifest.ACTION_ATLAS.approvedStates, {});
assert.strictEqual(manifest.actionFrameApproved("f000"), false);
assert.strictEqual(manifest.actionFrameApproved("f181"), false);

const expected = {
  down: ["down0", "down1", "down0", "down2"],
  up: ["up0", "up1", "up0", "up2"],
  right: ["right0", "right1", "right0", "right2"],
  left: ["right0", "right1", "right0", "right2"]
};
assert.deepStrictEqual(world.SAFE_WALK_FRAMES, expected);
assert.deepStrictEqual(manifest.DAY_SHIFT.states.walk_down.frames, expected.down);
assert.deepStrictEqual(manifest.DAY_SHIFT.states.walk_up.frames, expected.up);
assert.deepStrictEqual(manifest.DAY_SHIFT.states.walk_right.frames, expected.right);
assert.deepStrictEqual(manifest.DAY_SHIFT.states.walk_left.frames, expected.left);
assert.strictEqual(manifest.DAY_SHIFT.states.walk_left.flip, true);
assert.strictEqual(world.SAFE_WALK_FRAME_MS, manifest.WALK_FRAME_MS);

assert.deepStrictEqual(manifest.resolveDayShift({fx:"down", moving:false}, 0), {state:"idle", semantic:"idle_down", key:"down0", flip:false, index:0});
assert.strictEqual(manifest.resolveDayShift({fx:"down", moving:true}, 135).key, "down1");
assert.strictEqual(manifest.resolveDayShift({fx:"down", moving:true}, 270).key, "down0");
assert.strictEqual(manifest.resolveDayShift({fx:"down", moving:true}, 405).key, "down2");
assert.strictEqual(manifest.resolveDayShift({fx:"left", moving:true}, 135).flip, true);
assert.strictEqual(manifest.resolveDayShift({fx:"right", moving:false, inDialog:true}, 0).key, "laptop");

// The metadata-only sheet is not render-ready unless a real source payload is present.
const frames = {};
for (let i = 0; i < 182; i++) frames["f" + String(i).padStart(3, "0")] = [i % 18, Math.floor(i / 18)];
const metadataOnly = { MIKE_ACTIONS: { src: "", frames } };
assert.strictEqual(manifest.actionAtlasSource(metadataOnly), null);
assert.strictEqual(manifest.actionAtlasReady(metadataOnly), false);
const payloadReady = { MIKE_ACTIONS: { src: "", frames }, TO_MIKE_ACTIONS: "data:image/png;base64,abc" };
assert.strictEqual(manifest.actionAtlasSource(payloadReady).kind, "payload");
assert.strictEqual(manifest.actionAtlasReady(payloadReady), true);
const srcReady = { MIKE_ACTIONS: { src: "assets/mike_actions.png", frames } };
assert.strictEqual(manifest.actionAtlasSource(srcReady).kind, "atlas_src");
assert.strictEqual(manifest.actionAtlasReady(srcReady), true);

// The gameplay renderer must consume the canonical manifest when present.
assert.strictEqual(world.animations(), manifest);
assert.strictEqual(world.playerFrame({fx:"right", moving:true}, 135).key, "right1");
assert.strictEqual(world.playerFrame({fx:"left", moving:true}, 405).flip, true);

console.log("Mike canonical animation manifest + source readiness: PASS");
