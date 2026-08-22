const assert = require("assert");

global.localStorage = {
  data: {},
  getItem(key) { return this.data[key] || null; },
  setItem(key, value) { this.data[key] = String(value); }
};

global.TechOpsCampaign = require("./campaign_act1.js");
global.TechOpsStory = require("./campaign_story.js");
global.mikeDesk = function () {
  global.__mikeDeskOpened = true;
};
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
  createElement(tag) {
    return { tagName: tag.toUpperCase(), textContent: "", className: "", onclick: null };
  }
};

const runtime = require("./campaign_runtime.js");

global.mikeDesk();
assert.strictEqual(global.__mikeDeskOpened, true);
assert.strictEqual(fakeOptions.children[0].textContent, "Act I Campaign Queue");
assert.strictEqual(typeof fakeOptions.children[0].onclick, "function");

function resetStorage() {
  global.localStorage.data = {};
}

resetStorage();
let state = runtime.confirmAssignments("firsthand");
assert.strictEqual(state.flags.ticketAssignmentsConfirmed, true);
assert.strictEqual(state.assignments.impossible_access_event, "mike");

state = runtime.runWorkstation();
assert.strictEqual(state.flags.feliciaVideoSeen, true);
assert.strictEqual(state.flags.redInTheMirrorHeard, true);

state = runtime.recordImpossibleAccess();
assert.strictEqual(state.evidence.ghostIdentityEvidence.status, "established");
assert.strictEqual(state.evidence.ghostIdentityEvidence.bestPerspective, "firsthand");

state = runtime.resolveDayTickets();
assert.strictEqual(state.humanOutcomes.shipping_cannot_print, "restored");
assert.strictEqual(state.humanOutcomes.plating_workstation_down, "restored");

state = runtime.enterSector04();
assert.strictEqual(state.night.accessGuard.dependencyKnown, true);

const insight = runtime.insightAccessGuard();
assert.strictEqual(insight.success, true);
assert.strictEqual(insight.dependency, "identity_controller");

state = runtime.defeatAccessGuard();
assert.strictEqual(state.flags.tuesdayMorningReached, true);
assert.strictEqual(state.campaign.day, 2);
assert.strictEqual(state.night.accessGuard.permanentlyDefeated, false, "Tuesday transition resets temporary Night Walker state");

const summary = runtime.currentSummary();
assert.strictEqual(summary.day, 2);
assert.strictEqual(summary.tuesdayMorningReached, true);

resetStorage();
runtime.confirmAssignments("delegated");
runtime.runWorkstation();
runtime.enterSector04();
const blocked = runtime.insightAccessGuard();
assert.strictEqual(blocked.success, false);
assert.strictEqual(blocked.message, "Unknown controller—daytime investigation required.");

console.log("Campaign runtime adapter: PASS");
