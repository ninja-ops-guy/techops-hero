const assert = require("assert");
const Campaign = require("./campaign_act1.js");

global.localStorage = {
  data: {},
  getItem(key) { return this.data[key] || null; },
  setItem(key, value) { this.data[key] = String(value); },
  removeItem(key) { delete this.data[key]; }
};

global.TechOpsCampaign = Campaign;
global.TechOpsCampaignRuntime = require("./campaign_runtime.js");
global.TechOpsSector04 = require("./campaign_sector04.js");

let lastDialog = null;
global.dlg = function (name, body, options) {
  lastDialog = { name, body, options };
  global.S.inDialog = true;
};
global.closeDlg = function () { global.S.inDialog = false; };
global.toast = function () {};
global.adjacent = function (a, b) { return Math.abs(a.x - b.x) + Math.abs(a.y - b.y) <= 1; };

function makeMap() { return Array.from({ length: 44 }, () => Array.from({ length: 44 }, () => 0)); }
function bootGame() {
  global.S = { day: 1, map: makeMap(), npcs: [], meta: {}, inDialog: false, inBattle: false, nightMode: false, _nightObjs: { door: { x: 20, y: 28 } }, px: 0, py: 0 };
  lastDialog = null;
}
function choose(text) {
  const option = lastDialog.options.find(o => o.t === text);
  assert.ok(option, `Missing option '${text}' in ${lastDialog.name}`);
  option.f();
}
function reloadCheckpoint(label, verify) {
  const before = Campaign.load(global.localStorage);
  const serialized = global.localStorage.getItem(Campaign.SAVE_KEY);
  assert.ok(serialized, label + " should be saved");
  bootGame();
  const after = Campaign.load(global.localStorage);
  assert.deepStrictEqual(after, before, label + " should survive reload");
  verify(after);
  native.ensureWorld();
  return after;
}

global.localStorage.removeItem(Campaign.SAVE_KEY);
bootGame();
const native = require("./campaign_native_act1.js");
native.ensureWorld();

native.openStandup();
choose("Assign queue: Mike investigates access");
reloadCheckpoint("standup ownership", state => {
  assert.strictEqual(state.flags.ticket_assignments_confirmed, true);
  assert.strictEqual(state.flags.standup_completed, true);
  assert.strictEqual(state.assignments.impossible_access_event, "mike");
});

native.openWorkstation();
reloadCheckpoint("workstation checked", state => {
  assert.strictEqual(state.flags.workstation_checked, true);
  assert.strictEqual(state.flags.red_in_mirror_heard, false);
  assert.strictEqual(state.flags.felicia_video_watched, false);
  assert.strictEqual(state.flags.day_work_unlocked, false);
});

native.openMusicTab();
choose("Play Red in the Mirror");
reloadCheckpoint("music playback", state => {
  assert.strictEqual(state.flags.red_in_mirror_heard, true);
  assert.strictEqual(state.flags.day_work_unlocked, false);
});

native.openCompanyTab();
choose("Open Felicia profile");
reloadCheckpoint("company profile found", state => {
  assert.strictEqual(state.flags.felicia_blog_found, true);
  assert.strictEqual(state.flags.felicia_video_watched, false);
});

native.openCompanyTab();
choose("Play Engineering the Human Connection");
choose("Finish video");
reloadCheckpoint("company video complete", state => {
  assert.strictEqual(state.flags.felicia_video_watched, true);
  assert.strictEqual(state.flags.day_work_unlocked, false);
});

native.openCompanyTab();
choose("CLOCK IN — START DAY SHIFT");
reloadCheckpoint("day work unlocked", state => {
  assert.strictEqual(state.flags.day_work_unlocked, true);
  assert.strictEqual(state.campaign.phase, "day_shift");
});

native.resolveTicket("shipping_cannot_print");
reloadCheckpoint("shipping verification", state => {
  assert.strictEqual(state.tickets.shipping_cannot_print.verification, "strong");
  assert.strictEqual(state.humanOutcomes.shipping_cannot_print, "restored");
});

native.resolveTicket("plating_workstation_down");
reloadCheckpoint("plating verification", state => {
  assert.strictEqual(state.tickets.plating_workstation_down.verification, "strong");
});

native.recordAccessEvidence();
reloadCheckpoint("impossible access evidence", state => {
  assert.strictEqual(state.evidence.ghostIdentityEvidence.status, "established");
  assert.strictEqual(state.evidence.ghostIdentityEvidence.bestPerspective, "firsthand");
});

native.sector04Door();
choose("Enter Sector 04");
assert.strictEqual(lastDialog.name, "ACCESS GUARD");
reloadCheckpoint("sector 04 entered", state => {
  assert.strictEqual(state.flags.sector04_entered, true);
  assert.strictEqual(state.night.accessGuard.dependencyLocated, true);
});

native.insightSector04();
choose("Suppress manifestation");
reloadCheckpoint("access guard suppressed", state => {
  assert.strictEqual(state.night.accessGuard.suppressed, true);
  assert.strictEqual(state.night.accessGuard.permanentlyDefeated, false);
});

native.completeSector04();
reloadCheckpoint("tuesday morning", state => {
  assert.strictEqual(state.flags.tuesday_morning_reached, true);
  assert.strictEqual(state.campaign.day, 2);
  assert.strictEqual(state.campaign.chapter, "ghost_frequency");
});

// Delegated compatibility route remains valid and keeps diagnosis unavailable until evidence arrives.
global.localStorage.removeItem(Campaign.SAVE_KEY);
bootGame();
native.ensureWorld();
global.TechOpsCampaignRuntime.confirmAssignments("delegated");
global.TechOpsCampaignRuntime.runWorkstation();
reloadCheckpoint("delegated access before night", state => {
  assert.strictEqual(state.assignments.impossible_access_event, "security");
  assert.strictEqual(state.flags.day_work_unlocked, true);
  assert.strictEqual(state.evidence.ghostIdentityEvidence.status, "unknown");
});

native.sector04Door();
choose("Enter Sector 04");
assert.strictEqual(lastDialog.name, "SECTOR 04 INSIGHT");
assert.ok(lastDialog.body.includes("Unknown controller"));
reloadCheckpoint("delegated unknown controller", state => {
  assert.strictEqual(state.flags.sector04_entered, true);
  assert.strictEqual(state.night.accessGuard.dependencyKnown, false);
  assert.strictEqual(state.flags.tuesday_morning_reached, false);
});

console.log("Campaign save/reload traversal: PASS");
