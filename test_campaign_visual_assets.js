"use strict";
const assert = require("assert");

// Provide the shipped atlas contracts without a browser DOM.
global.MIKE_ACTIONS = { src: "", cell: 112, cellH: 120, frames: { f000: [0, 0] } };
global.TO_MIKE_ACTIONS = "data:image/png;base64,mike";
global.PORTRAITS_UI = { src: "", cell: 248, cellH: 176, frames: { port_felicia0: [4, 1], port_cast0: [7, 2] } };
global.TO_PORTRAITS_UI = "data:image/png;base64,portraits";
global.FELICIA_MUSIC = { src: "", cell: 264, cellH: 208, frames: { felicia0: [0, 0] } };
global.TO_FELICIA_MUSIC = "data:image/png;base64,felicia";
global.NM_BG734 = { downtown: { src: "data:image/png;base64,downtown" }, industrial: { src: "data:image/png;base64,industrial" } };

const bridge = require("./campaign_visual_assets.js");

assert.strictEqual(bridge.actorSpec("badge_lab", "left").atlas, "MIKE_ACTIONS");
assert.strictEqual(bridge.actorSpec("felicia_day", "right").atlas, "PORTRAITS_UI");
assert.strictEqual(bridge.actorSpec("rooftop_violin", "right").atlas, "FELICIA_MUSIC");
assert.strictEqual(bridge.sourceFor(bridge.SPECS.mike), global.TO_MIKE_ACTIONS);
assert.strictEqual(bridge.sourceFor(bridge.SPECS.felicia_rooftop), global.TO_FELICIA_MUSIC);
assert.deepStrictEqual(bridge.frameRect(bridge.SPECS.mike), { sx: 0, sy: 0, sw: 112, sh: 120 });
assert.deepStrictEqual(bridge.frameRect(bridge.SPECS.felicia_day), { sx: 4 * 248, sy: 176, sw: 248, sh: 176 });
assert.strictEqual(bridge.paintedBackground("rooftop_violin"), "data:image/png;base64,downtown");
assert.strictEqual(bridge.paintedBackground("morningstar_trace"), "data:image/png;base64,industrial");
assert.strictEqual(bridge.paintedBackground("felicia_day"), null);

console.log("Campaign production visual assets: PASS");
