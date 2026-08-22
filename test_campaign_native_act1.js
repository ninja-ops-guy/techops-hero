const assert = require("assert");

global.localStorage = {
  data: {},
  getItem(key) { return this.data[key] || null; },
  setItem(key, value) { this.data[key] = String(value); }
};

global.TechOpsCampaign = require("./campaign_act1.js");
global.TechOpsCampaignRuntime = require("./campaign_runtime.js");
global.TechOpsSector04 = require("./campaign_sector04.js");
global.TechOpsCampaignAssets = require("./campaign_assets.js");

let lastDialog = null;
global.dlg = function (name, body, options) {
  lastDialog = { name, body, options };
  global.S.inDialog = true;
};
global.closeDlg = function () { global.S.inDialog = false; };
global.toast = function () {};
global.adjacent = function (a, b) { return Math.abs(a.x - b.x) + Math.abs(a.y - b.y) <= 1; };

function makeMap() {
  return Array.from({ length: 44 }, () => Array.from({ length: 44 }, () => 0));
}

function resetGame() {
  global.localStorage.data = {};
  global.S = {
    day: 1,
    map: makeMap(),
    npcs: [],
    meta: {},
    inDialog: false,
    inBattle: false,
    nightMode: false,
    _nightObjs: { door: { x: 20, y: 28 } },
    px: 0,
    py: 0
  };
  lastDialog = null;
}

resetGame();
const native = require("./campaign_native_act1.js");
assert.strictEqual(native.ensureWorld(), true);
assert.ok(global.S.meta.campaignAct1Native);
assert.ok(global.S.npcs.some(n => n.campaignAct1 === "shipping_cannot_print"));
assert.ok(global.S.npcs.some(n => n.campaignAct1 === "impossible_access_event"));
assert.strictEqual(native.assetFilename("shipping.clerk.idle"), "shipping.clerk.idle.png");
assert.strictEqual(native.assetUrl("plating.line_background"), "assets/campaign/plating.line_background.png");
assert.deepStrictEqual(native.assetsForContext("workstation"), [
  "workstation.felicia.video_frame",
  "workstation.orpheus.glitch_frame",
  "workstation.corporate_aircraft_panel"
]);
assert.ok(native.assetUrlsForContext("shipping").some(asset => asset.url === "assets/campaign/shipping.label_printer.png"));
assert.strictEqual(global.S.npcs.find(n => n.campaignAct1 === "shipping_cannot_print").assetSlot, "shipping.clerk.idle");
assert.strictEqual(global.S.npcs.find(n => n.campaignAct1 === "plating_workstation_down").backgroundAssetSlot, "plating.line_background");

global.S.px = global.S.meta.campaignAct1Native.standup.x;
global.S.py = global.S.meta.campaignAct1Native.standup.y + 1;
native.openStandup();
assert.strictEqual(lastDialog.name, "CAMPAIGN STANDUP");
assert.deepStrictEqual(global.__techopsCampaignNativeAct1Assets.slots, [
  "ui.standup.board",
  "ui.standup.ticket_card",
  "ui.standup.owner_badge"
]);
lastDialog.options[0].f();
assert.strictEqual(global.TechOpsCampaign.load(global.localStorage).flags.ticketAssignmentsConfirmed, true);

native.openWorkstation();
assert.ok(global.__techopsCampaignNativeAct1Assets.slots.includes("workstation.orpheus.glitch_frame"));
let state = global.TechOpsCampaign.load(global.localStorage);
assert.strictEqual(state.flags.workstationOpened, true);
assert.strictEqual(state.flags.feliciaVideoSeen, true);

native.resolveTicket("shipping_cannot_print");
assert.ok(global.__techopsCampaignNativeAct1Assets.slots.includes("shipping.printed_label_success"));
state = global.TechOpsCampaign.load(global.localStorage);
assert.strictEqual(state.humanOutcomes.shipping_cannot_print, "restored");

native.resolveTicket("plating_workstation_down");
assert.ok(global.__techopsCampaignNativeAct1Assets.slots.includes("plating.line_stopped_display"));
state = global.TechOpsCampaign.load(global.localStorage);
assert.strictEqual(state.humanOutcomes.plating_workstation_down, "restored");

native.recordAccessEvidence();
state = global.TechOpsCampaign.load(global.localStorage);
assert.strictEqual(state.evidence.ghostIdentityEvidence.bestPerspective, "firsthand");

native.sector04Door();
assert.strictEqual(lastDialog.name, "SECTOR 04 - NIGHT WALKER");
lastDialog.options[0].f();
assert.strictEqual(lastDialog.name, "ACCESS GUARD");
lastDialog.options[0].f();
assert.strictEqual(lastDialog.name, "ACCESS GUARD SUPPRESSED");
lastDialog.options[0].f();
state = global.TechOpsCampaign.load(global.localStorage);
assert.strictEqual(state.flags.tuesdayMorningReached, true);
assert.strictEqual(state.campaign.day, 2);

resetGame();
native.ensureWorld();
global.TechOpsCampaignRuntime.confirmAssignments("delegated");
global.TechOpsCampaignRuntime.runWorkstation();
native.sector04Door();
lastDialog.options[0].f();
assert.strictEqual(lastDialog.name, "SECTOR 04 INSIGHT");
assert.ok(lastDialog.body.includes("Unknown controller"));

console.log("Campaign native Act I integration: PASS");
