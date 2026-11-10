const assert = require("assert");
const fs = require("fs");
const Mission = require("./campaign_dead_air.js");

function started() { const state = Mission.initialState(); Mission.start(state); return state; }
function triangulated() {
  const state = started();
  Mission.tune(state, "pier_gate", "narrowband");
  Mission.tune(state, "crane4", "sideband");
  Mission.tune(state, "bait_tackle", "pulse");
  return state;
}
function storage() {
  const data = {};
  return { data, getItem(key) { return data[key] === undefined ? null : data[key]; }, setItem(key, value) { data[key] = String(value); } };
}

let state = started();
assert.strictEqual(state.stage, "triangulate");
assert.strictEqual(state.recordingIntegrity, 100);
assert.strictEqual(Mission.tune(state, "pier_gate", "pulse").tuned, false);
assert.strictEqual(state.recordingIntegrity, 90);
assert.strictEqual(Mission.tune(state, "pier_gate", "pulse").tuned, false);
assert.strictEqual(state.recordingIntegrity, 90, "the same mistake cannot drain the recording repeatedly");
Mission.tune(state, "pier_gate", "narrowband");
assert.deepStrictEqual(state.tunedRelays, ["pier_gate"]);
assert.strictEqual(state.triangulated, false);
assert.throws(() => Mission.restoreRecording(state), /Triangulate all three relays/);
Mission.tune(state, "crane4", "sideband");
Mission.tune(state, "bait_tackle", "pulse");
assert.strictEqual(state.triangulated, true);
assert.strictEqual(state.stage, "choose");

Mission.damageRecording(state, 45);
assert.strictEqual(state.recordingIntegrity, 45);
assert.throws(() => Mission.choose(state, "broadcast"), /at least 60% recording integrity/);
Mission.restoreRecording(state);
assert.strictEqual(state.recordingIntegrity, 100);
let recovery = Mission.choose(state, "broadcast");
assert.strictEqual(recovery.choice, "broadcast");
assert.strictEqual(recovery.sourceProtected, false);
assert.throws(() => Mission.verifyWithRequester(state, { physicalSeal: false, requesterConfirmation: true }), /physical A17 cargo seal/);
assert.throws(() => Mission.verifyWithRequester(state, { physicalSeal: true, requesterConfirmation: false }), /dockworker must confirm/);
let verified = Mission.verifyWithRequester(state, { physicalSeal: true, requesterConfirmation: true });
assert.strictEqual(verified.outcome, "manifest_restored_and_recording_shared");
assert.strictEqual(state.completed, true);
assert.strictEqual(state.requesterVerified, true);
assert.strictEqual(Mission.suppress(state, 1000).permanent, true, "a completed mission cannot respawn combat");

state = triangulated();
Mission.choose(state, "isolate");
assert.strictEqual(state.sourceProtected, true);
verified = Mission.verifyWithRequester(state, { physicalSeal: true, requesterConfirmation: true });
assert.strictEqual(verified.outcome, "manifest_restored_and_source_protected");

state = triangulated();
let suppression = Mission.suppress(state, 1000);
assert.strictEqual(suppression.permanent, false);
assert.strictEqual(suppression.respawnAt, 16000);
Mission.tick(state, 15999);
assert.strictEqual(state.guard.respawnCount, 0);
Mission.tick(state, 16000);
assert.strictEqual(state.guard.respawnCount, 1);
assert.strictEqual(state.completed, false, "combat can never close the field report");

const store = storage();
store.setItem("techops_char", "day-save-must-survive");
Mission.save(state, store);
assert.strictEqual(store.getItem("techops_char"), "day-save-must-survive");
const restored = Mission.load(store);
assert.strictEqual(restored.triangulated, true);
assert.strictEqual(restored.completed, false);
assert.strictEqual(restored.guard.respawnCount, 1);
store.setItem(Mission.STORAGE_KEY, "not-json");
const recovered = Mission.load(store);
assert.strictEqual(recovered.stage, "briefing");
assert.match(recovered.recoveryNotice, /unreadable/);
assert.strictEqual(store.getItem("techops_char"), "day-save-must-survive");

for (const filename of ["campaign_dead_air.js", "campaign_dead_air_runtime.js"]) {
  const source = fs.readFileSync(filename, "utf8");
  assert.ok(!/Felicia|K the EMRLD|ORPHEUS WAKES/i.test(source), `${filename} must not reveal later-campaign identities or endings`);
}
console.log("Dead Air contract: PASS");
