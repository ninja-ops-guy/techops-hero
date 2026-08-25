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

function choose(text) {
  const option = lastDialog.options.find(o => o.t === text);
  assert.ok(option, `Missing option '${text}' in ${lastDialog.name}`);
  option.f();
}

resetGame();
const native = require("./campaign_native_act1.js");
assert.strictEqual(native.ensureWorld(), true);
assert.deepStrictEqual(native.WORKSTATION_TABS, ["QUEUE", "TEAMS", "ALERTS", "COMPANY", "MUSIC"]);
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

global.S.px = global.S.meta.campaignAct1Native.standup.x;
global.S.py = global.S.meta.campaignAct1Native.standup.y + 1;
native.openStandup();
assert.strictEqual(lastDialog.name, "CAMPAIGN STANDUP");
choose("Assign queue: Mike investigates access");
let state = global.TechOpsCampaign.load(global.localStorage);
assert.strictEqual(state.flags.ticket_assignments_confirmed, true);
assert.strictEqual(state.flags.standup_completed, true);
assert.strictEqual(state.flags.day_work_unlocked, false);

choose("Open workstation");
assert.strictEqual(lastDialog.name, "MIKE // WORKSTATION");
state = global.TechOpsCampaign.load(global.localStorage);
assert.strictEqual(state.flags.workstation_checked, true);
assert.strictEqual(state.flags.red_in_mirror_heard, false);
assert.strictEqual(state.flags.felicia_video_watched, false);
assert.strictEqual(state.flags.day_work_unlocked, false);

// Day work cannot start merely because the workstation was opened.
native.resolveTicket("shipping_cannot_print");
assert.strictEqual(lastDialog.name, "DAY WORK LOCKED");
state = global.TechOpsCampaign.load(global.localStorage);
assert.strictEqual(state.tickets.shipping_cannot_print, undefined);

// MUSIC is ordinary listening, not ORPHEUS investigation state.
native.openWorkstationTab("MUSIC");
assert.strictEqual(lastDialog.name, "WORKSTATION // MUSIC");
choose("Play Red in the Mirror");
state = global.TechOpsCampaign.load(global.localStorage);
assert.strictEqual(state.flags.red_in_mirror_heard, true);
assert.strictEqual(state.orpheusSignatures.impossibleRecords, 0);

// Company blog must be found before the video; video supports finish or deliberate skip.
native.openWorkstationTab("COMPANY");
assert.strictEqual(lastDialog.name, "WORKSTATION // COMPANY");
choose("Open Felicia profile");
state = global.TechOpsCampaign.load(global.localStorage);
assert.strictEqual(state.flags.felicia_blog_found, true);
choose("Play Engineering the Human Connection");
assert.strictEqual(lastDialog.name, "ENGINEERING THE HUMAN CONNECTION");
choose("Finish video");
state = global.TechOpsCampaign.load(global.localStorage);
assert.strictEqual(state.flags.felicia_video_watched, true);
assert.strictEqual(state.flags.day_work_unlocked, false);
choose("CLOCK IN — START DAY SHIFT");
state = global.TechOpsCampaign.load(global.localStorage);
assert.strictEqual(state.flags.day_work_unlocked, true);
assert.strictEqual(global.S.meta.ticketTimersActive, true);

native.resolveTicket("shipping_cannot_print");
state = global.TechOpsCampaign.load(global.localStorage);
assert.strictEqual(state.humanOutcomes.shipping_cannot_print, "restored");
native.resolveTicket("plating_workstation_down");
state = global.TechOpsCampaign.load(global.localStorage);
assert.strictEqual(state.humanOutcomes.plating_workstation_down, "restored");

native.recordAccessEvidence();
state = global.TechOpsCampaign.load(global.localStorage);
assert.strictEqual(state.evidence.ghostIdentityEvidence.bestPerspective, "firsthand");

native.sector04Door();
assert.strictEqual(lastDialog.name, "SECTOR 04 - NIGHT WALKER");
choose("Enter Sector 04");
assert.strictEqual(lastDialog.name, "ACCESS GUARD");
choose("Suppress manifestation");
assert.strictEqual(lastDialog.name, "ACCESS GUARD SUPPRESSED");
choose("Sever identity controller");
state = global.TechOpsCampaign.load(global.localStorage);
assert.strictEqual(state.flags.tuesday_morning_reached, true);
assert.strictEqual(state.campaign.day, 2);

// Deliberate company-video skip commits required state but still requires MUSIC before clock-in.
resetGame();
native.ensureWorld();
global.TechOpsCampaignRuntime.confirmAssignments("firsthand");
native.openWorkstation();
native.openWorkstationTab("COMPANY");
choose("Open Felicia profile");
choose("Play Engineering the Human Connection");
choose("Skip video");
state = global.TechOpsCampaign.load(global.localStorage);
assert.strictEqual(state.flags.felicia_video_watched, true);
assert.strictEqual(state.flags.day_work_unlocked, false);
assert.strictEqual(lastDialog.name, "WORKSTATION // COMPANY");
assert.ok(lastDialog.body.includes("MUSIC"));

// Delegated ownership changes evidence perspective rather than silently converting to firsthand.
native.openMusicTab();
if (!global.TechOpsCampaign.load(global.localStorage).flags.red_in_mirror_heard) choose("Play Red in the Mirror");
native.openCompanyTab();
choose("CLOCK IN — START DAY SHIFT");
resetGame();
native.ensureWorld();
global.TechOpsCampaignRuntime.confirmAssignments("delegated");
native.openWorkstation();
native.openMusicTab();
choose("Play Red in the Mirror");
native.openCompanyTab();
choose("Open Felicia profile");
choose("Play Engineering the Human Connection");
choose("Finish video");
choose("CLOCK IN — START DAY SHIFT");
native.recordAccessEvidence();
state = global.TechOpsCampaign.load(global.localStorage);
assert.strictEqual(state.evidence.ghostIdentityEvidence.bestPerspective, "delegated_verified");

console.log("Campaign native Act I workstation integration: PASS");
