/* TechOps Hero — Acts II–III semantic proof.
 * Story Bible v1.2 / production baseline: Ghost Frequency -> Parts in Motion.
 * Keeps Evidence and Trust separate, prevents reveal-order shortcuts, and
 * defines the bounded Felicia companion/free-play contract for production.
 */
(function (root, factory) {
  var api = factory(root);
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.TechOpsCampaignAct2 = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function (root) {
  "use strict";

  var VERSION = 2;
  var COMPONENTS = Object.freeze(["telemetry", "antenna", "compute", "power", "flight_control", "sensor"]);
  var COMPANION_BOUNDS = Object.freeze({ followDistance: 5, assistRadius: 4, hardLeash: 9, actionCooldownMs: 1200 });
  var TRUST_APPROACHES = Object.freeze(["trace", "contain", "confront"]);

  function assert(condition, message) { if (!condition) throw new Error(message); }
  function clone(value) { return JSON.parse(JSON.stringify(value)); }
  function hasOpeningFlag(state, canonical, legacy) {
    var flags = state.flags || {};
    if (typeof flags[canonical] === "boolean") return flags[canonical];
    return !!flags[legacy];
  }
  function facts(state) {
    state.story = state.story || { completedActs: [], facts: {} };
    state.story.facts = state.story.facts || {};
    return state.story.facts;
  }
  function storyApi() { return root && root.TechOpsStory && typeof root.TechOpsStory.transitionStatus === "function" ? root.TechOpsStory : null; }
  function actCompleted(state, id) { return !!(state.story && Array.isArray(state.story.completedActs) && state.story.completedActs.indexOf(id) >= 0); }
  function syncStoryAct(state, id) {
    var api = storyApi();
    if (!api) return false;
    try {
      if (typeof api.syncAct1State === "function") api.syncAct1State(state);
      if (actCompleted(state, id)) return true;
      var status = api.transitionStatus(state, id);
      if (!status.eligible) return false;
      api.completeAct(state, id);
      return true;
    } catch (error) {
      if (root) root.__campaignAct2StorySyncError = String(error && error.stack || error);
      return false;
    }
  }
  function syncGhostFrequencyAct(state) {
    var p1 = ensure(state);
    if (!p1.evidence.badgeClonerVerified || !p1.trust.feliciaDaylightConversation || !p1.morningstar.signatureFound) return false;
    return syncStoryAct(state, "act_2");
  }
  function ensure(state) {
    assert(state && typeof state === "object", "Campaign state is required");
    state.p1 = state.p1 || {
      schemaVersion: VERSION,
      chapter: "ghost_frequency",
      evidence: { score: 0, records: [], badgeClonerVerified: false, rooftopViolinVerified: false },
      trust: { score: 0, feliciaDaylightConversation: false, history: [] },
      morningstar: { traces: [], components: {}, signatureFound: false },
      reveal: { violinistRevealed: false },
      history: []
    };
    var p1 = state.p1;
    p1.schemaVersion = VERSION;
    p1.evidence = p1.evidence || { score: 0, records: [], badgeClonerVerified: false, rooftopViolinVerified: false };
    p1.trust = p1.trust || { score: 0, feliciaDaylightConversation: false, history: [] };
    p1.morningstar = p1.morningstar || { traces: [], components: {}, signatureFound: false };
    p1.reveal = p1.reveal || { violinistRevealed: false };
    p1.history = p1.history || [];
    p1.companion = p1.companion || {
      mode: "locked",
      followDistance: COMPANION_BOUNDS.followDistance,
      assistRadius: COMPANION_BOUNDS.assistRadius,
      hardLeash: COMPANION_BOUNDS.hardLeash,
      actionCooldownMs: COMPANION_BOUNDS.actionCooldownMs,
      readable: true
    };
    p1.duet = p1.duet || { protocolCompleted: false, freeplayUnlocked: false };
    p1.trustEarned = p1.trustEarned || { stage: "locked", investigation: null, report: null, completed: false, history: [] };
    p1.trustEarned.history = p1.trustEarned.history || [];
    if (actCompleted(state, "act_4")) { p1.trustEarned.stage = "complete"; p1.trustEarned.completed = true; }
    return p1;
  }
  function requireTuesday(state) {
    assert(hasOpeningFlag(state, "tuesday_morning_reached", "tuesdayMorningReached"), "Ghost Frequency requires Tuesday Morning");
  }
  function record(state, type, detail) {
    var p1 = ensure(state);
    p1.history.push({ type: type, detail: detail || null });
  }

  function beginGhostFrequency(state) {
    requireTuesday(state);
    var p1 = ensure(state);
    syncStoryAct(state, "act_1");
    p1.chapter = "ghost_frequency";
    facts(state).tuesday_morning = true;
    record(state, "ghost_frequency_started");
    return clone(p1);
  }

  function recordBadgeClonerEvidence(state, input) {
    requireTuesday(state);
    var p1 = ensure(state);
    input = input || {};
    assert(input.physicalArtifact === true, "Badge-cloner investigation requires a physical artifact");
    assert(input.auditContradiction === true, "Badge-cloner investigation requires an audit contradiction");
    var perspective = input.perspective || "firsthand";
    assert(["firsthand", "delegated_verified", "corroborated"].indexOf(perspective) >= 0, "Invalid evidence perspective");
    if (!p1.evidence.badgeClonerVerified) {
      p1.evidence.badgeClonerVerified = true;
      p1.evidence.score += perspective === "firsthand" ? 2 : 1;
      p1.evidence.records.push({ id: "badge_cloner", perspective: perspective, reliability: input.reliability || "high" });
    }
    facts(state).ghost_identity_established = true;
    record(state, "badge_cloner_verified", perspective);
    syncGhostFrequencyAct(state);
    return clone(p1.evidence);
  }

  function firstDaylightFeliciaConversation(state, input) {
    requireTuesday(state);
    assert(hasOpeningFlag(state, "felicia_video_watched", "feliciaVideoSeen"), "Felicia company video must precede the first daylight conversation");
    var p1 = ensure(state);
    input = input || {};
    assert(!p1.trust.feliciaDaylightConversation, "First daylight Felicia conversation already completed");
    var approach = input.approach || "professional";
    assert(["professional", "curious", "accusatory"].indexOf(approach) >= 0, "Unknown Felicia conversation approach");
    var delta = approach === "professional" ? 2 : approach === "curious" ? 1 : -1;
    p1.trust.feliciaDaylightConversation = true;
    p1.trust.score += delta;
    p1.trust.history.push({ id: "first_daylight_felicia", approach: approach, delta: delta });
    facts(state).felicia_contact = true;
    record(state, "felicia_daylight_contact", approach);
    syncGhostFrequencyAct(state);
    return clone(p1.trust);
  }

  function recordMorningstarTrace(state, input) {
    requireTuesday(state);
    var p1 = ensure(state);
    input = input || {};
    assert(COMPONENTS.indexOf(input.component) >= 0, "Unknown MORNINGSTAR component: " + input.component);
    assert(typeof input.source === "string" && input.source.trim(), "MORNINGSTAR trace requires a source");
    if (!p1.morningstar.components[input.component]) {
      p1.morningstar.components[input.component] = { firstSource: input.source, verified: input.verified === true };
      p1.morningstar.traces.push({ component: input.component, source: input.source, verified: input.verified === true });
    } else if (input.verified === true) {
      p1.morningstar.components[input.component].verified = true;
    }
    p1.morningstar.signatureFound = p1.morningstar.traces.some(function (trace) { return trace.verified; });
    if (p1.morningstar.signatureFound) facts(state).morningstar_signature_found = true;
    record(state, "morningstar_trace", input.component);
    syncGhostFrequencyAct(state);
    return clone(p1.morningstar);
  }

  function recordRooftopViolinEvidence(state, input) {
    requireTuesday(state);
    var p1 = ensure(state);
    input = input || {};
    assert(input.signalObserved === true, "Rooftop investigation requires an observed signal");
    assert(input.corroborated === true, "Rooftop violin evidence must be corroborated before it can support a reveal");
    if (!p1.evidence.rooftopViolinVerified) {
      p1.evidence.rooftopViolinVerified = true;
      p1.evidence.score += 2;
      p1.evidence.records.push({ id: "rooftop_violin_signal", perspective: input.perspective || "firsthand", reliability: "high" });
    }
    record(state, "rooftop_violin_verified");
    return clone(p1.evidence);
  }

  function violinistRevealEligible(state) {
    var p1 = ensure(state), f = facts(state);
    return !!(f.ghost_identity_established && f.morningstar_signature_found && f.felicia_contact && p1.evidence.rooftopViolinVerified);
  }

  function companionPolicy(state) {
    var p1 = ensure(state), revealed = !!p1.reveal.violinistRevealed;
    return {
      enabled: revealed,
      mode: revealed ? p1.companion.mode : "locked",
      followDistance: p1.companion.followDistance,
      assistRadius: p1.companion.assistRadius,
      hardLeash: p1.companion.hardLeash,
      actionCooldownMs: p1.companion.actionCooldownMs,
      readable: p1.companion.readable === true,
      freeplayUnlocked: !!p1.duet.freeplayUnlocked
    };
  }

  function setCompanionMode(state, mode) {
    requireTuesday(state);
    var p1 = ensure(state);
    assert(p1.reveal.violinistRevealed, "Felicia companion support requires The Violinist reveal");
    assert(["off", "follow", "support"].indexOf(mode) >= 0, "Unknown companion mode");
    p1.companion.mode = mode;
    record(state, "felicia_companion_mode", mode);
    return companionPolicy(state);
  }

  function feliciaFreeplayEligible(state) {
    var p1 = ensure(state);
    return !!(p1.duet.protocolCompleted && p1.duet.freeplayUnlocked && facts(state).duet_protocol_complete);
  }

  function completeDuetProtocol(state) {
    requireTuesday(state);
    var p1 = ensure(state);
    assert(p1.reveal.violinistRevealed, "Duet Protocol requires The Violinist reveal");
    var api = storyApi();
    assert(api, "TechOpsStory is required to complete Duet Protocol");
    var status = api.transitionStatus(state, "act_6");
    if (!status.completed) {
      assert(status.eligible, "Duet Protocol requires completed MORNINGSTAR / Act V");
      api.completeAct(state, "act_6");
    }
    if (!p1.duet.protocolCompleted) {
      p1.duet.protocolCompleted = true;
      p1.duet.freeplayUnlocked = true;
      p1.companion.mode = "follow";
      facts(state).duet_protocol_complete = true;
      record(state, "duet_protocol_completed");
    }
    return { protocolCompleted: true, freeplayUnlocked: feliciaFreeplayEligible(state), companion: companionPolicy(state) };
  }

  function revealViolinist(state) {
    requireTuesday(state);
    var p1 = ensure(state);
    assert(!p1.reveal.violinistRevealed, "The Violinist reveal already completed");
    assert(violinistRevealEligible(state), "The Violinist reveal prerequisites are not met");
    p1.reveal.violinistRevealed = true;
    p1.chapter = "parts_in_motion";
    p1.companion.mode = "support";
    facts(state).violinist_revealed = true;
    record(state, "violinist_revealed");
    syncGhostFrequencyAct(state);
    syncStoryAct(state, "act_3");
    return clone(p1.reveal);
  }

  function trustIsEarnedEligible(state) {
    var p1 = ensure(state), api = storyApi();
    if (actCompleted(state, "act_4")) return false;
    if (api) return api.transitionStatus(state, "act_4").unlocked;
    return !!(p1.reveal.violinistRevealed && facts(state).violinist_revealed);
  }

  function beginTrustInvestigation(state) {
    requireTuesday(state);
    var p1 = ensure(state), trust = p1.trustEarned;
    if (trust.completed) return clone(trust);
    assert(trustIsEarnedEligible(state), "Trust Is Earned requires completed Parts in Motion / Act III");
    if (trust.stage === "locked") {
      trust.stage = "investigate";
      trust.history.push({ type: "trust_investigation_started" });
      record(state, "trust_investigation_started");
    }
    return clone(trust);
  }

  function recordTrustInvestigation(state, input) {
    requireTuesday(state);
    var p1 = ensure(state), trust = p1.trustEarned;
    input = input || {};
    assert(trustIsEarnedEligible(state), "Trust Is Earned requires completed Parts in Motion / Act III");
    assert(trust.stage === "investigate" || trust.stage === "report", "Begin the Trust Is Earned investigation first");
    assert(TRUST_APPROACHES.indexOf(input.approach) >= 0, "Unknown Trust Is Earned investigation approach");
    if (trust.investigation) {
      assert(trust.investigation.approach === input.approach, "Trust Is Earned investigation approach is already committed");
      return clone(trust);
    }
    trust.investigation = { approach: input.approach, verified: true, source: "unauthorized_internal_traffic" };
    trust.stage = "report";
    trust.history.push({ type: "trust_investigation_verified", approach: input.approach });
    record(state, "trust_investigation_verified", input.approach);
    return clone(trust);
  }

  function completeTrustReport(state, input) {
    requireTuesday(state);
    var p1 = ensure(state), trust = p1.trustEarned, f = facts(state), api = storyApi();
    input = input || {};
    if (trust.completed && actCompleted(state, "act_4")) return clone(trust);
    assert(api, "TechOpsStory is required to complete Trust Is Earned");
    assert(trust.stage === "report" && trust.investigation && trust.investigation.verified, "A verified Trust Is Earned investigation must precede the report");
    assert(input.reported === true, "Trust Is Earned requires an explicit report");
    assert(input.sharedOwnership === true, "Trust Is Earned requires shared ownership of the response");
    var alreadyReported = f.trust_investigation_reported === true;
    f.trust_investigation_reported = true;
    try {
      if (!syncStoryAct(state, "act_4")) throw new Error("Trust Is Earned could not complete its canonical story transition");
    } catch (error) {
      if (!alreadyReported) delete f.trust_investigation_reported;
      throw error;
    }
    trust.report = { reported: true, sharedOwnership: true, approach: trust.investigation.approach };
    trust.stage = "complete";
    trust.completed = true;
    trust.history.push({ type: "trust_report_shared", approach: trust.investigation.approach });
    p1.trust.score += 2;
    p1.trust.history.push({ id: "trust_is_earned", approach: trust.investigation.approach, delta: 2 });
    record(state, "trust_is_earned_completed", trust.investigation.approach);
    return clone(trust);
  }

  function snapshot(state) {
    var p1 = ensure(state);
    return {
      chapter: p1.chapter,
      evidenceScore: p1.evidence.score,
      trustScore: p1.trust.score,
      badgeClonerVerified: p1.evidence.badgeClonerVerified,
      feliciaDaylightConversation: p1.trust.feliciaDaylightConversation,
      morningstarSignatureFound: p1.morningstar.signatureFound,
      rooftopViolinVerified: p1.evidence.rooftopViolinVerified,
      violinistRevealEligible: violinistRevealEligible(state),
      violinistRevealed: p1.reveal.violinistRevealed,
      trustIsEarnedEligible: trustIsEarnedEligible(state),
      trustIsEarned: clone(p1.trustEarned),
      companion: companionPolicy(state),
      duetProtocolCompleted: !!p1.duet.protocolCompleted,
      feliciaFreeplayUnlocked: feliciaFreeplayEligible(state)
    };
  }

  return {
    VERSION: VERSION,
    COMPONENTS: COMPONENTS,
    COMPANION_BOUNDS: COMPANION_BOUNDS,
    TRUST_APPROACHES: TRUST_APPROACHES,
    ensure: ensure,
    beginGhostFrequency: beginGhostFrequency,
    recordBadgeClonerEvidence: recordBadgeClonerEvidence,
    firstDaylightFeliciaConversation: firstDaylightFeliciaConversation,
    recordMorningstarTrace: recordMorningstarTrace,
    recordRooftopViolinEvidence: recordRooftopViolinEvidence,
    violinistRevealEligible: violinistRevealEligible,
    revealViolinist: revealViolinist,
    trustIsEarnedEligible: trustIsEarnedEligible,
    beginTrustInvestigation: beginTrustInvestigation,
    recordTrustInvestigation: recordTrustInvestigation,
    completeTrustReport: completeTrustReport,
    companionPolicy: companionPolicy,
    setCompanionMode: setCompanionMode,
    completeDuetProtocol: completeDuetProtocol,
    feliciaFreeplayEligible: feliciaFreeplayEligible,
    snapshot: snapshot
  };
});
