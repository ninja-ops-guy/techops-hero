"use strict";
const assert = require("assert");

global.__techopsCampaignNativeAct1Assets = null;
global.dlg = function () { return true; };
global.closeDlg = function () { return true; };

const visuals = require("./campaign_native_act1_visuals.js");

assert.strictEqual(visuals.url("shipping.dock_background"), "assets/campaign/shipping.dock_background.png");
assert.strictEqual(visuals.sceneForDialog("CAMPAIGN STANDUP"), "standup");
assert.strictEqual(visuals.sceneForDialog("WORKSTATION // COMPANY"), "workstation");
assert.strictEqual(visuals.sceneForDialog("SHIPPING CANNOT PRINT"), "shipping");
assert.strictEqual(visuals.sceneForDialog("PLATING WORKSTATION DOWN"), "plating");
assert.strictEqual(visuals.sceneForDialog("IMPOSSIBLE ACCESS EVENT"), "access");

global.__techopsCampaignNativeAct1Assets = { id: "plating" };
assert.strictEqual(visuals.sceneForDialog("ANY DIALOG"), "plating");
assert.strictEqual(visuals.SCENES.shipping.background, "shipping.dock_background");
assert.strictEqual(visuals.SCENES.shipping.actor, "shipping.clerk.idle");
assert.deepStrictEqual(visuals.SCENES.plating.props, ["plating.workstation_cracked", "plating.line_stopped_display"]);
assert.deepStrictEqual(visuals.SCENES.workstation.props, ["workstation.felicia.video_frame", "workstation.orpheus.glitch_frame"]);

console.log("Campaign Day 1 reference visuals: PASS");
