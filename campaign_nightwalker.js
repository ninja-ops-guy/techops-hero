/* TechOps Hero — Nightwalker: West Annex standalone field-report contract.
 * Owns evidence, hypotheses, suppression, dependency resolution, and human
 * verification. It deliberately does not read or write Day-campaign state.
 */
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.TechOpsNightwalker = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  var VERSION = 1;
  var STORAGE_KEY = "techops_nightwalker_west_annex_v1";
  var SUPPRESSION_MS = 15000;
  var MISSION_ID = "west_annex";
  var EVIDENCE = Object.freeze({
    access_audit: {
      label: "Access audit contradiction",
      text: "At 02:16 an unknown identity is accepted. At 02:17 Mike's real badge is denied. Valid identity and verified presence are not the same record."
    },
    wiped_drive: {
      label: "Wiped drive WA-773",
      text: "The physical drive is wiped, but its enclosure preserves a camera-gap window. The artifact supports deliberate erasure; it does not identify an actor."
    },
    maintenance_panel: {
      label: "Fresh tool marks",
      text: "The bypass was opened before Mike arrived. The tool marks are fresh, and the relay is still live. Someone left a dependency active, not merely a broken log."
    }
  });
  var HYPOTHESES = Object.freeze([
    { id: "ordinary_load", label: "Ordinary overnight load", supported: false, feedback: "Ordinary load does not explain the accepted unknown identity, the physical camera gap, and the freshly opened bypass. Test the narrower contradiction." },
    { id: "external_actor", label: "A confirmed outside actor", supported: false, feedback: "The records support deliberate access, but not identity, location, or intent. Preserve that uncertainty instead of naming an actor the evidence cannot establish." },
    { id: "identity_bypass", label: "A live identity-presence bypass", supported: true, feedback: "The audit separates identity from presence, the drive establishes the missing interval, and the fresh panel supplies the live dependency. Insight can now expose the relay." }
  ]);

  function assert(condition, message) { if (!condition) throw new Error(message); }
  function clone(value) { return JSON.parse(JSON.stringify(value)); }
  function initialState() {
    return {
      schemaVersion: VERSION,
      missionId: MISSION_ID,
      stage: "briefing",
      evidence: [],
      hypothesis: null,
      unsupportedHypotheses: [],
      controllerRevealed: false,
      relayIsolated: false,
      requesterVerified: false,
      completed: false,
      guard: { suppressed: false, suppressionEndsAt: null, respawnCount: 0 },
      history: []
    };
  }
  function ensure(state) {
    assert(state && typeof state === "object", "Nightwalker state is required");
    assert(state.missionId === MISSION_ID, "Unknown Nightwalker mission");
    state.schemaVersion = VERSION;
    state.stage = state.stage || "briefing";
    if (!Array.isArray(state.evidence)) state.evidence = [];
    else if (state.evidence.some(function (id, index, all) { return !EVIDENCE[id] || all.indexOf(id) !== index; })) state.evidence = state.evidence.filter(function (id, index, all) { return EVIDENCE[id] && all.indexOf(id) === index; });
    state.unsupportedHypotheses = Array.isArray(state.unsupportedHypotheses) ? state.unsupportedHypotheses : [];
    state.guard = state.guard || { suppressed: false, suppressionEndsAt: null, respawnCount: 0 };
    state.history = Array.isArray(state.history) ? state.history : [];
    if (state.relayIsolated) {
      state.controllerRevealed = true;
      state.guard.suppressed = false;
      state.guard.suppressionEndsAt = null;
    }
    if (state.completed) {
      state.relayIsolated = true;
      state.requesterVerified = true;
      state.stage = "complete";
    }
    return state;
  }
  function record(state, type, detail) {
    state.history.push({ sequence: state.history.length + 1, type: type, detail: detail || null });
  }
  function start(state) {
    ensure(state);
    if (state.stage === "briefing") {
      state.stage = state.evidence.length === Object.keys(EVIDENCE).length ? "hypothesize" : "investigate";
      record(state, "field_report_started");
    }
    return snapshot(state);
  }
  function inspect(state, id) {
    ensure(state);
    assert(EVIDENCE[id], "Unknown West Annex evidence: " + id);
    assert(!state.completed, "The field report is already complete");
    if (state.evidence.indexOf(id) < 0) {
      state.evidence.push(id);
      record(state, "evidence_recorded", id);
    }
    if (state.evidence.length === Object.keys(EVIDENCE).length && !state.controllerRevealed) state.stage = "hypothesize";
    return { id: id, label: EVIDENCE[id].label, text: EVIDENCE[id].text, evidenceCount: state.evidence.length };
  }
  function hypothesize(state, id) {
    ensure(state);
    assert(state.evidence.length === Object.keys(EVIDENCE).length, "All three evidence sources are required before hypothesizing");
    assert(!state.controllerRevealed, "The dependency is already revealed");
    var hypothesis = HYPOTHESES.find(function (entry) { return entry.id === id; });
    assert(hypothesis, "Unknown West Annex hypothesis: " + id);
    state.hypothesis = id;
    if (!hypothesis.supported) {
      if (state.unsupportedHypotheses.indexOf(id) < 0) state.unsupportedHypotheses.push(id);
      state.stage = "hypothesize";
      record(state, "hypothesis_not_supported", id);
      return { supported: false, feedback: hypothesis.feedback };
    }
    state.stage = "insight_ready";
    record(state, "hypothesis_supported", id);
    return { supported: true, feedback: hypothesis.feedback };
  }
  function insight(state) {
    ensure(state);
    assert(state.hypothesis === "identity_bypass", "Insight requires the supported identity-presence hypothesis");
    assert(state.evidence.length === Object.keys(EVIDENCE).length, "Insight requires complete evidence");
    if (!state.controllerRevealed) {
      state.controllerRevealed = true;
      state.stage = "relay_ready";
      record(state, "controller_revealed");
    }
    return { revealed: true, dependency: "live_identity_relay", objective: objective(state) };
  }
  function isolateRelay(state) {
    ensure(state);
    assert(state.controllerRevealed, "Reveal the live relay before isolating it");
    if (!state.relayIsolated) {
      state.relayIsolated = true;
      state.stage = "verify";
      state.guard.suppressed = false;
      state.guard.suppressionEndsAt = null;
      record(state, "relay_isolated");
    }
    return { isolated: true, permanent: true, objective: objective(state) };
  }
  function verifyWithRequester(state, input) {
    ensure(state);
    input = input || {};
    assert(state.relayIsolated, "Isolate the live relay before verification");
    assert(input.physicalBadge === true, "Verification requires a real badge and a real person");
    assert(input.requesterConfirmation === true, "Security Ops must confirm the restored outcome");
    if (!state.completed) {
      state.requesterVerified = true;
      state.completed = true;
      state.stage = "complete";
      record(state, "requester_verified");
    }
    return { verified: true, completed: true, outcome: "valid_identity_and_verified_presence_restored" };
  }
  function suppress(state, atMs) {
    ensure(state);
    if (state.relayIsolated) return { suppressed: false, permanent: true };
    state.guard.suppressed = true;
    state.guard.suppressionEndsAt = atMs + SUPPRESSION_MS;
    record(state, "guard_suppressed");
    return { suppressed: true, permanent: false, respawnAt: state.guard.suppressionEndsAt };
  }
  function tick(state, atMs) {
    ensure(state);
    if (!state.relayIsolated && state.guard.suppressed && state.guard.suppressionEndsAt <= atMs) {
      state.guard.suppressed = false;
      state.guard.suppressionEndsAt = null;
      state.guard.respawnCount += 1;
      record(state, "guard_reconstituted");
    }
    return state;
  }
  function objective(state) {
    ensure(state);
    if (state.completed) return "Field report verified. Return to free roam when ready.";
    if (state.relayIsolated) return "Return to the Security Ops uplink. Verify with a real badge and a real person.";
    if (state.controllerRevealed) return "Isolate the live relay at the maintenance panel. Combat is optional.";
    if (state.stage === "insight_ready") return "Use Insight at the hypothesis console to reveal the dependency.";
    if (state.evidence.length === Object.keys(EVIDENCE).length) return "Review the hypotheses at the analysis console.";
    if (state.guard.suppressed) return "The Access Guard is suppressed. Continue collecting evidence.";
    return "Inspect the access audit, wiped drive, and maintenance panel: " + state.evidence.length + "/3.";
  }
  function snapshot(state) {
    var copy = clone(ensure(state));
    copy.objective = objective(state);
    copy.evidenceCount = copy.evidence.length;
    copy.evidenceTotal = Object.keys(EVIDENCE).length;
    return copy;
  }
  function save(state, storage) {
    storage = storage || (typeof localStorage !== "undefined" ? localStorage : null);
    assert(storage && typeof storage.setItem === "function", "Nightwalker storage is unavailable");
    var snap = snapshot(state);
    if (snap.completed) assert(snap.relayIsolated && snap.requesterVerified, "Completion requires relay isolation and requester verification");
    storage.setItem(STORAGE_KEY, JSON.stringify({ version: VERSION, missionId: MISSION_ID, state: snap }));
    return true;
  }
  function load(storage) {
    storage = storage || (typeof localStorage !== "undefined" ? localStorage : null);
    if (!storage || typeof storage.getItem !== "function") return initialState();
    try {
      var raw = storage.getItem(STORAGE_KEY);
      if (!raw) return initialState();
      var record = JSON.parse(raw);
      if (!record || record.version !== VERSION || record.missionId !== MISSION_ID || !record.state) throw new Error("invalid field report");
      var state = ensure(record.state);
      state.stage = state.completed ? "complete" : state.stage;
      return state;
    } catch (error) {
      var recovered = initialState();
      recovered.recoveryNotice = "The saved West Annex report was unreadable. A fresh field report was started; other saves were not changed.";
      return recovered;
    }
  }

  return {
    VERSION: VERSION,
    STORAGE_KEY: STORAGE_KEY,
    SUPPRESSION_MS: SUPPRESSION_MS,
    EVIDENCE: EVIDENCE,
    HYPOTHESES: HYPOTHESES,
    initialState: initialState,
    ensure: ensure,
    start: start,
    inspect: inspect,
    hypothesize: hypothesize,
    insight: insight,
    isolateRelay: isolateRelay,
    verifyWithRequester: verifyWithRequester,
    suppress: suppress,
    tick: tick,
    objective: objective,
    snapshot: snapshot,
    save: save,
    load: load
  };
});
