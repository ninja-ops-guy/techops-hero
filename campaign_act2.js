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
  var TRUST_EVIDENCE = Object.freeze([
    { id: "requester", label: "Ask Inspection what is blocked", source: "inspection_operator", text: "Inspection can enter a result, but the acknowledgement never arrives. The next part cannot be released. The operator needs a confirmed result, not a green network icon." },
    { id: "comparison", label: "Compare traffic with the last good shift", source: "preserved_shift_comparison", text: "The inspection service still answers normally. Repeated copies return through an internal telemetry mirror after its maintenance window. The comparison shows a loop; it does not identify who left it active." },
    { id: "ledger", label: "Review the maintenance handoff with Felicia", source: "maintenance_handoff", text: "The mirror was approved for a short diagnostic window, which has ended. The handoff contains no verified removal. Felicia confirms the live inspection route must remain available while Mike addresses the stale mirror." }
  ]);
  var TRUST_HYPOTHESES = Object.freeze([
    { id: "external_actor", label: "An outside actor controls Inspection", supported: false, feedback: "An internal loop does not establish an outside actor or their intent. Preserve that uncertainty; the comparison and handoff support a narrower conclusion." },
    { id: "normal_load", label: "This is ordinary inspection load", supported: false, feedback: "The last good shift has no repeated copies, and the diagnostic window has ended. Ordinary production demand does not explain the stale mirror." },
    { id: "stale_mirror", label: "The diagnostic mirror was never retired", supported: true, feedback: "The comparison locates the repeated copies; the handoff explains why the extra route existed. Correct the stale mirror without interrupting the live inspection service." }
  ]);
  var TRUST_RESPONSES = Object.freeze({
    trace: { label: "Preserve the comparison and retire the stale mirror", text: "Mike retains the before-state, then removes the expired mirror. The live inspection route stays available. Felicia holds the comparison for the recheck.", consequence: "The route comparison is retained for the next shift; Inspection stays online." },
    contain: { label: "Isolate the mirror while keeping Inspection online", text: "Mike isolates only the expired mirror. The repeat traffic stops without isolating Inspection. Felicia records the diagnostic feed as unavailable pending its next approved window.", consequence: "Inspection stays online; the diagnostic mirror remains isolated until an approved review." },
    confront: { label: "Reconcile the handoff and retire the mirror together", text: "Mike asks Felicia to reconcile the expired maintenance window with him. They preserve the incomplete handoff and remove the stale mirror, without assigning intent that the records cannot prove.", consequence: "The incomplete handoff is acknowledged and its removal recorded; Inspection stays online." }
  });

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
    var trust = p1.trustEarned;
    if (trust.schemaVersion !== 1) {
      trust.schemaVersion = 1;
      trust.observations = [];
      trust.ruledOut = [];
      trust.hypothesis = null;
      trust.response = null;
      trust.technicalVerified = false;
      trust.requesterVerified = false;
      trust.responseOwner = "mike";
      trust.verificationPartner = "felicia";
      // Preserve completed history. An old approach-only record never proves
      // observations or a restored human outcome for an unfinished investigation.
      if (!actCompleted(state, "act_4") && trust.investigation) {
        trust.investigation.verified = false;
        trust.stage = "observe";
        trust.history.push({ type: "trust_verification_required" });
      }
    }
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
    assert(TRUST_APPROACHES.indexOf(input.approach) >= 0, "Unknown Trust Is Earned investigation approach");
    if (trust.investigation) {
      assert(trust.investigation.approach === input.approach, "Trust Is Earned investigation approach is already committed");
      return clone(trust);
    }
    assert(trust.stage === "investigate", "Begin the Trust Is Earned investigation first");
    trust.investigation = { approach: input.approach, verified: false, source: "unauthorized_internal_traffic" };
    trust.stage = "observe";
    trust.history.push({ type: "trust_response_planned", approach: input.approach });
    record(state, "trust_response_planned", input.approach);
    return clone(trust);
  }

  function activeTrust(state) {
    requireTuesday(state);
    assert(trustIsEarnedEligible(state), "Trust Is Earned requires completed Parts in Motion / Act III");
    var trust = ensure(state).trustEarned;
    assert(trust.investigation, "Choose a Trust Is Earned investigation approach first");
    return trust;
  }

  function observeTrustEvidence(state, id) {
    var trust = activeTrust(state), item = TRUST_EVIDENCE.find(function (entry) { return entry.id === id; });
    assert(item, "Unknown Trust Is Earned observation");
    if (trust.observations.some(function (entry) { return entry.id === id; })) return clone(trust);
    assert(trust.stage === "observe", "Trust observations must precede the hypothesis");
    trust.observations.push({ id: id, source: item.source, observedBy: "mike", perspective: "firsthand" });
    trust.history.push({ type: "trust_observation_recorded", id: id });
    if (TRUST_EVIDENCE.every(function (entry) { return trust.observations.some(function (seen) { return seen.id === entry.id; }); })) trust.stage = "hypothesize";
    return clone(trust);
  }

  function evaluateTrustHypothesis(state, id) {
    var trust = activeTrust(state), hypothesis = TRUST_HYPOTHESES.find(function (entry) { return entry.id === id; });
    assert(hypothesis, "Unknown Trust Is Earned hypothesis");
    if (trust.hypothesis === id || trust.ruledOut.indexOf(id) >= 0) return clone(trust);
    assert(trust.stage === "hypothesize", "Review the requester, comparison, and handoff before drawing a conclusion");
    if (!hypothesis.supported) {
      trust.ruledOut.push(id);
      trust.history.push({ type: "trust_hypothesis_not_supported", id: id });
      return clone(trust);
    }
    trust.hypothesis = id;
    trust.stage = "respond";
    trust.history.push({ type: "trust_hypothesis_supported", id: id });
    return clone(trust);
  }

  function applyTrustResponse(state) {
    var trust = activeTrust(state);
    if (trust.response) return clone(trust);
    assert(trust.stage === "respond" && trust.hypothesis === "stale_mirror", "A supported hypothesis must precede the response");
    trust.response = { approach: trust.investigation.approach, owner: trust.responseOwner, liveServicePreserved: true, consequence: TRUST_RESPONSES[trust.investigation.approach].consequence };
    trust.stage = "technical_verify";
    trust.history.push({ type: "trust_response_applied", approach: trust.response.approach });
    return clone(trust);
  }

  function verifyTrustResponse(state, kind) {
    var trust = activeTrust(state), p1 = ensure(state);
    assert(kind === "technical" || kind === "requester", "Unknown Trust Is Earned verification");
    if (kind === "technical") {
      if (trust.technicalVerified) return clone(trust);
      assert(trust.stage === "technical_verify" && trust.response, "Apply the bounded response before a technical recheck");
      trust.technicalVerified = true;
      trust.stage = "requester_verify";
    } else {
      if (trust.requesterVerified) return clone(trust);
      assert(trust.stage === "requester_verify" && trust.technicalVerified, "Technical verification must precede requester confirmation");
      trust.requesterVerified = true;
      trust.investigation.verified = true;
      trust.stage = "report";
      if (!p1.evidence.records.some(function (entry) { return entry.id === "trust_internal_mirror"; })) {
        p1.evidence.records.push({ id: "trust_internal_mirror", perspective: "firsthand", reliability: "high", sources: trust.observations.map(function (entry) { return entry.source; }), conclusion: "stale_mirror", identityAttribution: "unproven" });
        p1.evidence.score += 2;
      }
    }
    trust.history.push({ type: "trust_" + kind + "_verified" });
    return clone(trust);
  }

  function trustObjective(state) {
    var trust = ensure(state).trustEarned;
    var objectives = {
      locked: "Talk with Felicia about the unauthorized traffic.",
      investigate: "Agree how to approach the traffic investigation.",
      observe: "Hear Inspection's need, compare traffic, and review the maintenance handoff.",
      hypothesize: "Choose the explanation supported by all three observations.",
      respond: "Apply the bounded response while preserving Inspection's live service.",
      technical_verify: "Compare the result: repeated copies stop and Inspection remains reachable.",
      requester_verify: "Ask Inspection to submit a result and confirm its acknowledgement.",
      report: "Report the verified result with Felicia and name the response owner.",
      complete: "The alliance is recorded. Review the MORNINGSTAR hangar ledger."
    };
    return objectives[trust.stage] || "Review the investigation with Felicia.";
  }

  function completeTrustReport(state, input) {
    requireTuesday(state);
    var p1 = ensure(state), trust = p1.trustEarned, f = facts(state), api = storyApi();
    input = input || {};
    if (trust.completed && actCompleted(state, "act_4")) return clone(trust);
    assert(api, "TechOpsStory is required to complete Trust Is Earned");
    assert(trust.stage === "report" && trust.investigation && trust.investigation.verified && trust.technicalVerified && trust.requesterVerified, "A verified Trust Is Earned investigation must precede the report");
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
    trust.report = { reported: true, sharedOwnership: true, approach: trust.investigation.approach, responseOwner: trust.responseOwner, verificationPartner: trust.verificationPartner, humanOutcome: "inspection_acknowledgement_restored", identityAttribution: "unproven" };
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
      trustObjective: trustObjective(state),
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
    TRUST_EVIDENCE: TRUST_EVIDENCE,
    TRUST_HYPOTHESES: TRUST_HYPOTHESES,
    TRUST_RESPONSES: TRUST_RESPONSES,
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
    observeTrustEvidence: observeTrustEvidence,
    evaluateTrustHypothesis: evaluateTrustHypothesis,
    applyTrustResponse: applyTrustResponse,
    verifyTrustResponse: verifyTrustResponse,
    trustObjective: trustObjective,
    completeTrustReport: completeTrustReport,
    companionPolicy: companionPolicy,
    setCompanionMode: setCompanionMode,
    completeDuetProtocol: completeDuetProtocol,
    feliciaFreeplayEligible: feliciaFreeplayEligible,
    snapshot: snapshot
  };
});
