"use strict";
const assert = require("assert");
const fs = require("fs");

const html = fs.readFileSync("index.html", "utf8");
const gameSource = fs.readFileSync("game.js", "utf8");

// Presentation/input contract: desktop and mobile must converge on the same interaction path.
assert.ok(html.includes('id="touch-ui"'), "mobile touch UI must remain in the production entrypoint");
assert.ok(html.includes('id="tb-interact"'), "mobile interact control must remain in the production entrypoint");
assert.ok(html.includes('id="dialogue"'), "dialogue layer must remain in the production entrypoint");
assert.ok(html.includes('id="hud-clock"'), "HUD clock must remain in the production entrypoint");
assert.ok(gameSource.includes('if (["e", "enter", " "].includes(e.key.toLowerCase())) interact();'), "desktop keyboard interaction must call interact()");
assert.ok(gameSource.includes('$("tb-interact").addEventListener("touchstart", e => { e.preventDefault(); interact(); });'), "mobile touch interaction must call the same interact() path");

// Canonical campaign modules must load after the base runtime so their wrappers own final authority.
function scriptIndex(src) {
  const escaped = src.replace(/[.*+?^${}()|[\]\\]/g, "\\function scriptIndex(src) {
  const marker = `<script src="${src}"></script>`;
  const index = html.indexOf(marker);
  assert.notStrictEqual(index, -1, `${src} must be loaded by index.html`);
  return index;
}");
  const match = new RegExp(`<script src="${escaped}(?:[?#][^"]*)?"></script>`).exec(html);
  assert.ok(match, `${src} must be loaded by index.html`);
  return match.index;
}
assert.ok(scriptIndex("game.js") < scriptIndex("campaign_act1.js"), "campaign authority must load after base game runtime");
assert.ok(scriptIndex("campaign_act1.js") < scriptIndex("campaign_native_act1.js"), "native presentation must load after canonical campaign state");

// Minimal production journey: New Day -> standup -> workstation -> MUSIC -> COMPANY
// -> CLOCK IN -> ordinary ticket -> Impossible Access -> Sector 04 -> Tuesday Morning.
global.localStorage = {
  data: {},
  getItem(key) { return this.data[key] || null; },
  setItem(key, value) { this.data[key] = String(value); },
  removeItem(key) { delete this.data[key]; }
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
function boot() {
  global.localStorage.data = {};
  global.S = {
    day: 1,
    clock: 9 * 60,
    map: makeMap(),
    npcs: [],
    portals: [],
    devices: [],
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
  assert.ok(lastDialog, `Expected a dialog before choosing '${text}'`);
  const option = lastDialog.options.find(o => o.t === text);
  assert.ok(option, `Missing option '${text}' in ${lastDialog.name}`);
  option.f();
}
function state() { return global.TechOpsCampaign.load(global.localStorage); }

boot();
const native = require("./campaign_native_act1.js");
assert.strictEqual(native.ensureWorld(), true);

native.openStandup();
assert.strictEqual(lastDialog.name, "CAMPAIGN STANDUP");
choose("Assign queue: Mike investigates access");
assert.strictEqual(state().flags.day_work_unlocked, false);

choose("Open workstation");
assert.strictEqual(lastDialog.name, "MIKE // WORKSTATION");
assert.strictEqual(state().flags.workstation_checked, true);
assert.strictEqual(state().flags.day_work_unlocked, false);

native.openWorkstationTab("MUSIC");
choose("Play Red in the Mirror");
assert.strictEqual(state().flags.red_in_mirror_heard, true);
assert.strictEqual(state().flags.day_work_unlocked, false);

native.openWorkstationTab("COMPANY");
choose("Open Felicia profile");
choose("Play Engineering the Human Connection");
choose("Finish video");
assert.strictEqual(state().flags.felicia_video_watched, true);
assert.strictEqual(state().flags.day_work_unlocked, false);

choose("CLOCK IN — START DAY SHIFT");
assert.strictEqual(state().flags.day_work_unlocked, true);
assert.strictEqual(global.S.meta.ticketTimersActive, true);

native.resolveTicket("shipping_cannot_print");
assert.strictEqual(state().humanOutcomes.shipping_cannot_print, "restored");

native.recordAccessEvidence();
assert.strictEqual(state().evidence.ghostIdentityEvidence.bestPerspective, "firsthand");

native.sector04Door();
assert.strictEqual(lastDialog.name, "SECTOR 04 - NIGHT WALKER");
choose("Enter Sector 04");
assert.strictEqual(lastDialog.name, "ACCESS GUARD");
choose("Suppress manifestation");
assert.strictEqual(lastDialog.name, "ACCESS GUARD SUPPRESSED");
choose("Sever identity controller");

assert.strictEqual(state().flags.tuesday_morning_reached, true);
assert.strictEqual(state().campaign.day, 2);
assert.strictEqual(lastDialog.name, "TUESDAY MORNING");

console.log("Campaign production opening acceptance: PASS");
