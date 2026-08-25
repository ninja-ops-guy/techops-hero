const assert = require("assert");

global.localStorage = {
  data: {},
  getItem(key) { return this.data[key] || null; },
  setItem(key, value) { this.data[key] = String(value); }
};

global.TechOpsCampaign = require("./campaign_act1.js");
global.TechOpsStory = require("./campaign_story.js");
global.mikeDesk = function () { global.__mikeDeskOpened = true; };
const fakeOptions = {
  children: [],
  querySelector() { return this.children[0] || null; },
  insertBefore(button) { this.children.unshift(button); }
};
global.document = {
  readyState: "complete",
  getElementById(id) {
    if (id === "dlg-name") return { textContent: "MIKE'S DESK" };
    if (id === "dlg-options") return fakeOptions;
    return null;
  },
  createElement(tag) { return { tagName: tag.toUpperCase(), textContent: "", className: "", onclick: null }; }
};

const runtime = require("./campaign_runtime.js");

global.mikeDesk();
assert.strictEqual(global.__mikeDeskOpened, true);
assert.strictEqual(fakeOptions.children[0].textContent, "Act I Campaign Queue");
assert.strictEqual(typeof fakeOptions.children[0].onclick, "function");

function resetStorage() { global.localStorage.data = {}; }

resetStorage();
let state = runtime.confirmAssignments("firsthand");
assert.strictEqual(state.flags.ticket_assignments_confirmed, true);
assert.strictEqual(state.flags.standup_completed, true);
assert.strictEqual(state.flags.day_work_unlocked, false, "ticket timers cannot start at standup");
assert.strictEqual(state.assignments.impossible_access_event, "mike");

state = runtime.runWorkstation();
assert.strictEqual(state.flags.workstation_checked, true);
assert.strictEqual(state.flags.red_in_mirror_heard, true);
assert.strictEqual(state.flags.felicia_blog_found, true);
assert.strictEqual(state.flags.felicia_video_watched, true);
assert.strictEqual(state.flags.day_work_unlocked, true);
assert.strictEqual(state.flags.feliciaVideoSeen, true, "legacy video alias remains synchronized");

state = runtime.recordImpossibleAccess();
assert.strictEqual(state.evidence.ghostIdentityEvidence.status, "established");
assert.strictEqual(state.evidence.ghostIdentityEvidence.bestPerspective, "firsthand");

state = runtime.resolveDayTickets();
assert.strictEqual(state.humanOutcomes.shipping_cannot_print, "restored");
assert.strictEqual(state.humanOutcomes.plating_workstation_down, "restored");

state = runtime.enterSector04();
assert.strictEqual(state.flags.sector04_entered, true);
assert.strictEqual(state.night.accessGuard.dependencyKnown, true);

const insight = runtime.insightAccessGuard();
assert.strictEqual(insight.success, true);
assert.strictEqual(insight.dependency, "identity_controller");

state = runtime.defeatAccessGuard();
assert.strictEqual(state.flags.tuesday_morning_reached, true);
assert.strictEqual(state.flags.tuesdayMorningReached, true);
assert.strictEqual(state.campaign.day, 2);
assert.strictEqual(state.night.accessGuard.permanentlyDefeated, false, "Tuesday transition resets temporary Night Walker state");

const summary = runtime.currentSummary();
assert.strictEqual(summary.day, 2);
assert.strictEqual(summary.assignmentsConfirmed, true);
assert.strictEqual(summary.standupComplete, true);
assert.strictEqual(summary.dayWorkUnlocked, true);
assert.strictEqual(summary.tuesdayMorningReached, true);

// Deliberate video skip still commits the canonical watched state, but only after video start.
resetStorage();
runtime.confirmAssignments("firsthand");
state = runtime.runWorkstation({ skipVideo: true });
assert.strictEqual(state.flags.felicia_video_watched, true);
assert.strictEqual(state.flags.day_work_unlocked, true);
assert.strictEqual(state.history.some(e => e.type === "felicia_video_skipped"), true);

// Delegation changes evidence perspective/availability without blocking the campaign runtime.
resetStorage();
runtime.confirmAssignments("delegated");
runtime.runWorkstation();
runtime.enterSector04();
const blocked = runtime.insightAccessGuard();
assert.strictEqual(blocked.success, false);
assert.strictEqual(blocked.message, "Unknown controller—daytime investigation required.");

console.log("Campaign runtime adapter / Story Bible v1.2: PASS");
