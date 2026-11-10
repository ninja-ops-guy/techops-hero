const assert = require("assert");
const fs = require("fs");
const Mission = require("./campaign_nightwalker.js");

function started() {
  const state = Mission.initialState();
  Mission.start(state);
  return state;
}
function evidenced() {
  const state = started();
  Mission.inspect(state, "access_audit");
  Mission.inspect(state, "wiped_drive");
  Mission.inspect(state, "maintenance_panel");
  return state;
}
function revealed() {
  const state = evidenced();
  assert.strictEqual(Mission.hypothesize(state, "identity_bypass").supported, true);
  Mission.insight(state);
  return state;
}
function memoryStorage() {
  const data = {};
  return {
    data,
    getItem(key) { return Object.prototype.hasOwnProperty.call(data, key) ? data[key] : null; },
    setItem(key, value) { data[key] = String(value); }
  };
}

let state = Mission.initialState();
assert.strictEqual(state.stage, "briefing");
assert.strictEqual(state.completed, false);
Mission.start(state);
assert.strictEqual(state.stage, "investigate");
assert.throws(() => Mission.hypothesize(state, "identity_bypass"), /All three evidence sources/);

Mission.inspect(state, "access_audit");
Mission.inspect(state, "access_audit");
assert.deepStrictEqual(state.evidence, ["access_audit"], "inspection must be idempotent");
Mission.inspect(state, "wiped_drive");
assert.strictEqual(state.stage, "investigate");
Mission.inspect(state, "maintenance_panel");
assert.strictEqual(state.stage, "hypothesize");
assert.strictEqual(Mission.objective(state), "Review the hypotheses at the analysis console.");

let hypothesis = Mission.hypothesize(state, "ordinary_load");
assert.strictEqual(hypothesis.supported, false);
assert.strictEqual(state.controllerRevealed, false);
hypothesis = Mission.hypothesize(state, "external_actor");
assert.strictEqual(hypothesis.supported, false);
assert.deepStrictEqual(state.unsupportedHypotheses, ["ordinary_load", "external_actor"]);
assert.strictEqual(state.completed, false);
assert.throws(() => Mission.insight(state), /supported identity-presence hypothesis/);
assert.throws(() => Mission.isolateRelay(state), /Reveal the live relay/);

assert.strictEqual(Mission.hypothesize(state, "identity_bypass").supported, true);
Mission.insight(state);
assert.strictEqual(state.controllerRevealed, true);
assert.strictEqual(state.stage, "relay_ready");

let suppression = Mission.suppress(state, 1000);
assert.strictEqual(suppression.permanent, false);
assert.strictEqual(suppression.respawnAt, 16000);
Mission.tick(state, 15999);
assert.strictEqual(state.guard.respawnCount, 0);
Mission.tick(state, 16000);
assert.strictEqual(state.guard.respawnCount, 1);
assert.strictEqual(state.completed, false, "combat can never complete the investigation");

Mission.isolateRelay(state);
assert.strictEqual(state.relayIsolated, true);
assert.strictEqual(state.stage, "verify");
suppression = Mission.suppress(state, 20000);
assert.strictEqual(suppression.permanent, true, "isolation permanently ends reconstitution");
assert.throws(() => Mission.verifyWithRequester(state, { physicalBadge: false, requesterConfirmation: true }), /real badge and a real person/);
assert.throws(() => Mission.verifyWithRequester(state, { physicalBadge: true, requesterConfirmation: false }), /Security Ops must confirm/);
const verified = Mission.verifyWithRequester(state, { physicalBadge: true, requesterConfirmation: true });
assert.strictEqual(verified.completed, true);
assert.strictEqual(state.stage, "complete");
assert.strictEqual(state.requesterVerified, true);
Mission.verifyWithRequester(state, { physicalBadge: true, requesterConfirmation: true });
assert.strictEqual(state.history.filter(entry => entry.type === "requester_verified").length, 1);

const storage = memoryStorage();
storage.setItem("techops_char", "day-save-must-survive");
Mission.save(state, storage);
assert.strictEqual(storage.getItem("techops_char"), "day-save-must-survive");
const restored = Mission.load(storage);
assert.strictEqual(restored.completed, true);
assert.strictEqual(restored.relayIsolated, true);
assert.strictEqual(restored.requesterVerified, true);
assert.strictEqual(restored.objective, "Field report verified. Return to free roam when ready.");

const checkpoint = started();
Mission.inspect(checkpoint, "access_audit");
Mission.save(checkpoint, storage);
const resumed = Mission.load(storage);
assert.deepStrictEqual(resumed.evidence, ["access_audit"]);
assert.strictEqual(resumed.completed, false);
assert.strictEqual(resumed.controllerRevealed, false);

storage.setItem(Mission.STORAGE_KEY, "{not valid json");
const recovered = Mission.load(storage);
assert.strictEqual(recovered.stage, "briefing");
assert.match(recovered.recoveryNotice, /unreadable/);
assert.strictEqual(storage.getItem("techops_char"), "day-save-must-survive");

for (const filename of ["campaign_nightwalker.js", "campaign_nightwalker_runtime.js"]) {
  const source = fs.readFileSync(filename, "utf8");
  assert.ok(!/Felicia|K the EMRLD|ORPHEUS WAKES/i.test(source), `${filename} must not leak later-campaign reveals`);
}

console.log("Nightwalker West Annex contract: PASS");
