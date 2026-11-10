/* TechOps Hero — Nightwalker: Dead Air at Pier 7 contract.
 * Independent standalone state. No Day-campaign reads or writes.
 */
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.TechOpsDeadAir = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";
  var VERSION = 1;
  var STORAGE_KEY = "techops_nightwalker_dead_air_v1";
  var SUPPRESSION_MS = 15000;
  var MISSION_ID = "dead_air";
  var FILTERS = ["narrowband", "sideband", "pulse"];
  var RELAYS = Object.freeze({
    pier_gate: { label: "Pier 7 gate relay", filter: "narrowband", observation: "The manifest carrier is audible beneath a broad noise floor. A narrow filter preserves the carrier and rejects the static." },
    crane4: { label: "Crane 4 relay", filter: "sideband", observation: "The timing repeats in alternating sidebands. Matching that rhythm separates the cargo packets from the crane telemetry." },
    bait_tackle: { label: "Bait & Tackle relay", filter: "pulse", observation: "The remaining bursts arrive as discrete pulses rather than a continuous tone. A pulse filter preserves their timestamps." }
  });
  function assert(condition, message) { if (!condition) throw new Error(message); }
  function clone(value) { return JSON.parse(JSON.stringify(value)); }
  function initialState() {
    return {
      schemaVersion: VERSION,
      missionId: MISSION_ID,
      stage: "briefing",
      tunedRelays: [],
      recordingIntegrity: 100,
      triangulated: false,
      sourceIdentity: "unproven",
      choice: null,
      sourceProtected: null,
      requesterVerified: false,
      completed: false,
      mistakes: [],
      guard: { suppressed: false, suppressionEndsAt: null, respawnCount: 0 },
      history: []
    };
  }
  function ensure(state) {
    assert(state && typeof state === "object", "Dead Air state is required");
    assert(state.missionId === MISSION_ID, "Unknown Nightwalker mission");
    state.schemaVersion = VERSION;
    state.stage = state.stage || "briefing";
    if (!Array.isArray(state.tunedRelays)) state.tunedRelays = [];
    else if (state.tunedRelays.some(function (id, index, all) { return !RELAYS[id] || all.indexOf(id) !== index; })) state.tunedRelays = state.tunedRelays.filter(function (id, index, all) { return RELAYS[id] && all.indexOf(id) === index; });
    state.recordingIntegrity = Math.max(0, Math.min(100, Number(state.recordingIntegrity) || 0));
    state.triangulated = state.tunedRelays.length === Object.keys(RELAYS).length;
    if (!Array.isArray(state.mistakes)) state.mistakes = [];
    if (!Array.isArray(state.history)) state.history = [];
    state.guard = state.guard || { suppressed: false, suppressionEndsAt: null, respawnCount: 0 };
    if (state.completed) {
      assert(state.choice, "Completion requires a broadcast/isolate choice");
      state.requesterVerified = true;
      state.stage = "complete";
    }
    return state;
  }
  function record(state, type, detail) { state.history.push({ sequence: state.history.length + 1, type: type, detail: detail === undefined ? null : detail }); }
  function start(state) {
    ensure(state);
    if (state.stage === "briefing") {
      state.stage = state.triangulated ? "choose" : "triangulate";
      record(state, "field_report_started");
    }
    return snapshot(state);
  }
  function tune(state, id, filter) {
    ensure(state);
    var relay = RELAYS[id];
    assert(relay, "Unknown Pier 7 relay: " + id);
    assert(FILTERS.indexOf(filter) >= 0, "Unknown signal filter: " + filter);
    assert(!state.completed, "The field report is already complete");
    if (state.tunedRelays.indexOf(id) >= 0) return { tuned: true, alreadyTuned: true, integrity: state.recordingIntegrity };
    if (relay.filter !== filter) {
      var mistake = id + ":" + filter;
      if (state.mistakes.indexOf(mistake) < 0) {
        state.mistakes.push(mistake);
        state.recordingIntegrity = Math.max(0, state.recordingIntegrity - 10);
        record(state, "filter_mismatch", mistake);
      }
      return { tuned: false, integrity: state.recordingIntegrity, feedback: "That filter distorts the recording instead of separating it. Re-read the relay's waveform and try another filter." };
    }
    state.tunedRelays.push(id);
    state.triangulated = state.tunedRelays.length === Object.keys(RELAYS).length;
    if (state.triangulated) {
      state.stage = "choose";
      record(state, "source_triangulated");
    } else record(state, "relay_tuned", id);
    return { tuned: true, integrity: state.recordingIntegrity, triangulated: state.triangulated, observation: relay.observation };
  }
  function damageRecording(state, amount) {
    ensure(state);
    var damage = Math.max(0, Math.round(Number(amount) || 0));
    if (damage > 0 && state.recordingIntegrity > 0) {
      state.recordingIntegrity = Math.max(0, state.recordingIntegrity - damage);
      record(state, "recording_damaged", damage);
    }
    return state.recordingIntegrity;
  }
  function restoreRecording(state) {
    ensure(state);
    assert(state.triangulated, "Triangulate all three relays before restoring the recording");
    if (state.recordingIntegrity < 100) {
      state.recordingIntegrity = 100;
      record(state, "recording_restored");
    }
    return state.recordingIntegrity;
  }
  function choose(state, choice) {
    ensure(state);
    assert(state.triangulated, "All three relays are required before choosing a recovery approach");
    assert(["broadcast", "isolate"].indexOf(choice) >= 0, "Unknown recovery choice");
    if (choice === "broadcast") assert(state.recordingIntegrity >= 60, "Broadcast requires at least 60% recording integrity; restore the recording or isolate it");
    if (state.choice !== choice) {
      state.choice = choice;
      state.sourceProtected = choice === "isolate";
      state.stage = "verify";
      record(state, "recovery_choice", choice);
    }
    return { choice: choice, sourceProtected: state.sourceProtected, objective: objective(state) };
  }
  function verifyWithRequester(state, input) {
    ensure(state);
    input = input || {};
    assert(state.choice, "Choose broadcast or isolate before verification");
    assert(input.physicalSeal === true, "Verification requires the physical A17 cargo seal");
    assert(input.requesterConfirmation === true, "The dockworker must confirm the restored manifest");
    if (!state.completed) {
      state.requesterVerified = true;
      state.completed = true;
      state.stage = "complete";
      record(state, "requester_verified", state.choice);
    }
    return { verified: true, completed: true, outcome: state.choice === "broadcast" ? "manifest_restored_and_recording_shared" : "manifest_restored_and_source_protected" };
  }
  function suppress(state, atMs) {
    ensure(state);
    if (state.completed) return { suppressed: false, permanent: true };
    state.guard.suppressed = true;
    state.guard.suppressionEndsAt = atMs + SUPPRESSION_MS;
    record(state, "skimmer_suppressed");
    return { suppressed: true, permanent: false, respawnAt: state.guard.suppressionEndsAt };
  }
  function tick(state, atMs) {
    ensure(state);
    if (!state.completed && state.guard.suppressed && state.guard.suppressionEndsAt <= atMs) {
      state.guard.suppressed = false;
      state.guard.suppressionEndsAt = null;
      state.guard.respawnCount += 1;
      record(state, "skimmer_reconstituted");
    }
    return state;
  }
  function objective(state) {
    ensure(state);
    if (state.completed) return "Field report verified. Return to free roam when ready.";
    if (state.choice) return "Return to the dockworker with the A17 seal and restored manifest.";
    if (state.triangulated) return "Restore the recording if needed, then broadcast or isolate the recovery.";
    return "Tune the Pier 7 gate, Crane 4, and Bait & Tackle relays: " + state.tunedRelays.length + "/3.";
  }
  function snapshot(state) {
    var copy = clone(ensure(state));
    copy.objective = objective(state);
    copy.tunedCount = copy.tunedRelays.length;
    copy.relayTotal = Object.keys(RELAYS).length;
    return copy;
  }
  function save(state, storage) {
    storage = storage || (typeof localStorage !== "undefined" ? localStorage : null);
    assert(storage && typeof storage.setItem === "function", "Dead Air storage is unavailable");
    var snap = snapshot(state);
    if (snap.completed) assert(snap.choice && snap.requesterVerified, "Completion requires a choice and requester verification");
    storage.setItem(STORAGE_KEY, JSON.stringify({ version: VERSION, missionId: MISSION_ID, state: snap }));
    return true;
  }
  function load(storage) {
    storage = storage || (typeof localStorage !== "undefined" ? localStorage : null);
    if (!storage || typeof storage.getItem !== "function") return initialState();
    try {
      var raw = storage.getItem(STORAGE_KEY);
      if (!raw) return initialState();
      var parsed = JSON.parse(raw);
      if (!parsed || parsed.version !== VERSION || parsed.missionId !== MISSION_ID || !parsed.state) throw new Error("invalid field report");
      return ensure(parsed.state);
    } catch (error) {
      var recovered = initialState();
      recovered.recoveryNotice = "The saved Pier 7 report was unreadable. A fresh field report was started; other saves were not changed.";
      return recovered;
    }
  }
  return {
    VERSION: VERSION,
    STORAGE_KEY: STORAGE_KEY,
    SUPPRESSION_MS: SUPPRESSION_MS,
    FILTERS: FILTERS,
    RELAYS: RELAYS,
    initialState: initialState,
    ensure: ensure,
    start: start,
    tune: tune,
    damageRecording: damageRecording,
    restoreRecording: restoreRecording,
    choose: choose,
    verifyWithRequester: verifyWithRequester,
    suppress: suppress,
    tick: tick,
    objective: objective,
    snapshot: snapshot,
    save: save,
    load: load
  };
});
