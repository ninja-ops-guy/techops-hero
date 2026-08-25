/* TechOps Hero — Acts II–III semantic proof.
 * Story Bible v1.2 / production baseline: Ghost Frequency -> Parts in Motion.
 * Keeps Evidence and Trust separate and prevents reveal-order shortcuts.
 */
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.TechOpsCampaignAct2 = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  var VERSION = 1;
  var COMPONENTS = Object.freeze(["telemetry", "antenna", "compute", "power", "flight_control", "sensor"]);

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
    return state.p1;
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
    var p1 = ensure(state);
    var f = facts(state);
    return !!(
      f.ghost_identity_established &&
      f.morningstar_signature_found &&
      f.felicia_contact &&
      p1.evidence.rooftopViolinVerified
    );
  }

  function revealViolinist(state) {
    requireTuesday(state);
    var p1 = ensure(state);
    assert(!p1.reveal.violinistRevealed, "The Violinist reveal already completed");
    assert(violinistRevealEligible(state), "The Violinist reveal prerequisites are not met");
    p1.reveal.violinistRevealed = true;
    p1.chapter = "parts_in_motion";
    facts(state).violinist_revealed = true;
    record(state, "violinist_revealed");
    return clone(p1.reveal);
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
      violinistRevealed: p1.reveal.violinistRevealed
    };
  }

  return {
    VERSION: VERSION,
    COMPONENTS: COMPONENTS,
    ensure: ensure,
    beginGhostFrequency: beginGhostFrequency,
    recordBadgeClonerEvidence: recordBadgeClonerEvidence,
    firstDaylightFeliciaConversation: firstDaylightFeliciaConversation,
    recordMorningstarTrace: recordMorningstarTrace,
    recordRooftopViolinEvidence: recordRooftopViolinEvidence,
    violinistRevealEligible: violinistRevealEligible,
    revealViolinist: revealViolinist,
    snapshot: snapshot
  };
});