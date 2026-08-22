/* TechOps Hero — Campaign Director v1 / Act I contract.
 * Authored beats determine meaning. Systems determine how the player reaches them.
 */
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.TechOpsCampaign = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  var VERSION = 1;
  var SAVE_KEY = "techops_hero_campaign_v1";
  var TICKETS = ["shipping_cannot_print", "plating_workstation_down", "impossible_access_event"];
  var TICKET_TEMPLATES = {
    shipping_cannot_print: {
      id: "shipping_cannot_print",
      requester: "Shipping clerk",
      department: "Shipping",
      humanNeed: "Shipping must print customs labels so outgoing avionics work can move.",
      visibleSymptom: "Printer shows ready, but customs-label jobs disappear from the queue.",
      operationalContext: "Shipment must clear before the production handoff window or downstream work stalls.",
      hypotheses: ["driver_issue", "spooler_queue", "permissions", "network_path"],
      verificationCondition: "Requester prints the required customs label and confirms the label is accurate.",
      nightManifestation: null,
      campaignOutputs: [],
      ordinary: true
    },
    plating_workstation_down: {
      id: "plating_workstation_down",
      requester: "Plating operator",
      department: "Manufacturing",
      humanNeed: "Production needs the workstation restored so the plating line can move.",
      visibleSymptom: "Workstation restarted overnight and never returned to usable service.",
      operationalContext: "A physical line is waiting on a digital dependency.",
      hypotheses: ["stale_service", "credential_state", "integration_failure", "local_workstation_fault"],
      verificationCondition: "Operator completes a real production interaction and confirms the line can resume.",
      nightManifestation: null,
      campaignOutputs: [],
      ordinary: true
    },
    impossible_access_event: {
      id: "impossible_access_event",
      requester: "Security operations",
      department: "Security",
      humanNeed: "Security must understand a valid access record that conflicts with physical reality.",
      visibleSymptom: "Mike's badge appears to open SECTOR04-EAST at 02:13 when he was not present.",
      operationalContext: "Identity, physical presence, and audit trust no longer align.",
      hypotheses: ["credential_clone", "controller_replay", "camera_gap", "orpheus_interference"],
      verificationCondition: "Document the unresolved inconsistency without falsely closing it.",
      nightManifestation: "sector_04_access_guard",
      campaignOutputs: ["ghost_identity_evidence"],
      ordinary: false
    }
  };
  var TUESDAY_MORNING_CONTRACT = {
    persists: [
      "campaign flags", "evidence sources", "evidence provenance", "trust state",
      "team health", "verification history", "human outcomes", "completed tickets",
      "unresolved tickets", "ORPHEUS signature exposure", "workstation discoveries",
      "MORNINGSTAR inventory", "player behavior history"
    ],
    resets: [
      "Night Walker temporary sector state", "active combat state",
      "manifestation suppression timers", "current night position"
    ],
    transforms: [
      "Night evidence becomes daytime hypotheses", "unresolved tickets age",
      "verified work creates future opportunities", "poor verification becomes recurrence risk"
    ],
    requiredBoundary: "New Game through Sector 04 must cut cleanly to Day 2 / Ghost Frequency."
  };
  var PERSPECTIVE_RANK = {
    unverified: 0, inferred: 1, delegated_partial: 2,
    delegated_verified: 3, firsthand: 4, corroborated_firsthand: 5
  };

  function clone(value) { return JSON.parse(JSON.stringify(value)); }
  function now() { return new Date().toISOString(); }
  function assert(condition, message) { if (!condition) throw new Error(message); }

  function emptyFact() {
    return { status: "unknown", sources: [], bestPerspective: null, corroborated: false };
  }

  function initialState() {
    return {
      schemaVersion: VERSION,
      campaign: { day: 1, act: 1, chapter: "the_queue", phase: "standup" },
      flags: {
        standupStarted: true, ticketAssignmentsConfirmed: false,
        workstationOpened: false, redInTheMirrorHeard: false,
        feliciaVideoSeen: false, sector04Entered: false,
        sector04Completed: false, tuesdayMorningReached: false
      },
      assignments: {},
      tickets: {},
      evidence: { ghostIdentityEvidence: emptyFact() },
      trust: { felicia: { state: "suspicious", history: [] } },
      teamHealth: {},
      verificationHistory: [],
      humanOutcomes: {},
      orpheusSignatures: {
        impossibleRecords: 0, unauthorizedCorrections: 0,
        behavioralPrediction: 0, inhumanOptimization: 0
      },
      night: {
        sector: null, position: null, combatActive: false,
        accessGuard: {
          health: 100, suppressed: false, suppressionEndsAt: null,
          dependencyKnown: false, dependencyLocated: false,
          dependencyIsolated: false, restorationVerified: false,
          permanentlyDefeated: false
        }
      },
      morningstar: { components: [] },
      playerBehaviorHistory: [],
      history: [{ type: "campaign_started", at: now() }]
    };
  }

  function getTicketTemplate(ticketId) {
    assert(TICKETS.indexOf(ticketId) >= 0, "Unknown Act I ticket: " + ticketId);
    return clone(TICKET_TEMPLATES[ticketId]);
  }

  function listTicketTemplates() {
    return TICKETS.map(function (id) { return getTicketTemplate(id); });
  }

  function getTuesdayMorningContract() {
    return clone(TUESDAY_MORNING_CONTRACT);
  }

  function validate(state) {
    assert(state && state.schemaVersion === VERSION, "Unsupported campaign schema");
    assert(state.campaign && Number.isInteger(state.campaign.day), "Campaign day is required");
    assert(state.evidence && state.evidence.ghostIdentityEvidence, "Evidence store is required");
    TICKETS.forEach(function (id) {
      if (state.flags.ticketAssignmentsConfirmed) assert(!!state.assignments[id], "Confirmed standup requires one owner per ticket: " + id);
    });
    return true;
  }

  function assignTicket(state, ticketId, ownerId) {
    assert(TICKETS.indexOf(ticketId) >= 0, "Unknown Act I ticket: " + ticketId);
    assert(typeof ownerId === "string" && ownerId.trim(), "Ticket owner is required");
    state.assignments[ticketId] = ownerId.trim();
    state.history.push({ type: "ticket_assigned", ticketId: ticketId, ownerId: ownerId.trim(), at: now() });
    return state;
  }

  function completeStandup(state) {
    TICKETS.forEach(function (id) { assert(!!state.assignments[id], "Every active ticket must have exactly one owner: " + id); });
    state.flags.ticketAssignmentsConfirmed = true;
    state.campaign.phase = "workstation";
    state.history.push({ type: "standup_completed", at: now() });
    return state;
  }

  function completeWorkstation(state, data) {
    data = data || {};
    assert(state.flags.ticketAssignmentsConfirmed, "Standup must complete before workstation sequence");
    state.flags.workstationOpened = true;
    state.flags.redInTheMirrorHeard = data.redInTheMirrorHeard !== false;
    state.flags.feliciaVideoSeen = data.feliciaVideoSeen !== false;
    state.campaign.phase = "day_shift";
    state.history.push({ type: "workstation_sequence_completed", at: now() });
    return state;
  }

  function deriveFact(fact) {
    var best = null;
    fact.sources.forEach(function (source) {
      if (!best || (PERSPECTIVE_RANK[source.perspective] || 0) > (PERSPECTIVE_RANK[best.perspective] || 0)) best = source;
    });
    fact.status = fact.sources.length ? "established" : "unknown";
    fact.bestPerspective = best ? best.perspective : null;
    fact.corroborated = fact.sources.length > 1 || !!fact.sources.find(function (s) { return s.perspective === "corroborated_firsthand"; });
  }

  function recordGhostEvidence(state, source) {
    assert(source && source.id, "Evidence source id is required");
    assert(PERSPECTIVE_RANK[source.perspective] !== undefined, "Invalid evidence perspective");
    var fact = state.evidence.ghostIdentityEvidence;
    var normalized = {
      id: source.id,
      perspective: source.perspective,
      reliability: source.reliability || "high",
      completeness: source.completeness || "partial",
      discoveredBy: source.discoveredBy || "mike",
      authority: source.authority || null,
      day: state.campaign.day,
      at: now()
    };
    var existing = fact.sources.findIndex(function (item) { return item.id === normalized.id; });
    if (existing >= 0) fact.sources[existing] = normalized; else fact.sources.push(normalized);
    deriveFact(fact);
    if (source.id === "badge_impossible_access") state.orpheusSignatures.impossibleRecords = Math.max(1, state.orpheusSignatures.impossibleRecords);
    state.history.push({ type: "evidence_recorded", fact: "ghostIdentityEvidence", sourceId: normalized.id, at: now() });
    return fact;
  }

  function resolveTicket(state, ticketId, result) {
    assert(TICKETS.indexOf(ticketId) >= 0, "Unknown Act I ticket: " + ticketId);
    assert(state.assignments[ticketId], "Ticket must have an owner before resolution");
    result = result || {};
    assert(result.technicalResolution === true, "Technical resolution must be explicit");
    assert(["partial", "strong"].indexOf(result.verification) >= 0, "Verification must be partial or strong");
    assert(["restored", "degraded", "unmet"].indexOf(result.humanOutcome) >= 0, "Human outcome is required");
    state.tickets[ticketId] = {
      status: "resolved", ownerId: state.assignments[ticketId],
      technicalResolution: true, verification: result.verification,
      humanOutcome: result.humanOutcome, completedAt: now()
    };
    state.verificationHistory.push({ ticketId: ticketId, strength: result.verification, at: now() });
    state.humanOutcomes[ticketId] = result.humanOutcome;
    return state.tickets[ticketId];
  }

  function enterSector04(state) {
    assert(state.flags.workstationOpened, "Day shift must begin before Night Walker");
    state.flags.sector04Entered = true;
    state.campaign.phase = "night_walker";
    state.night.sector = "sector_04";
    state.night.combatActive = true;
    state.night.accessGuard.dependencyKnown = state.evidence.ghostIdentityEvidence.status === "established";
    state.history.push({ type: "sector04_entered", at: now() });
    return state.night.accessGuard;
  }

  function insightAccessGuard(state) {
    var known = state.evidence.ghostIdentityEvidence.status === "established";
    state.night.accessGuard.dependencyKnown = known;
    if (!known) return { success: false, message: "Unknown controller—daytime investigation required." };
    state.night.accessGuard.dependencyLocated = true;
    return {
      success: true,
      message: "VALID IDENTITY ≠ VERIFIED PRESENCE. Trace assertion source.",
      dependency: "identity_controller"
    };
  }

  function suppressAccessGuard(state, durationMs) {
    var guard = state.night.accessGuard;
    guard.health = 0;
    guard.suppressed = true;
    guard.suppressionEndsAt = Date.now() + (durationMs || 15000);
    state.history.push({ type: "manifestation_suppressed", manifestation: "access_guard", at: now() });
    return guard;
  }

  function severAccessController(state) {
    var guard = state.night.accessGuard;
    assert(guard.dependencyKnown && guard.dependencyLocated, "Controller dependency is not understood");
    guard.dependencyIsolated = true;
    guard.restorationVerified = true;
    guard.permanentlyDefeated = true;
    guard.suppressed = true;
    state.flags.sector04Completed = true;
    state.night.combatActive = false;
    state.history.push({ type: "dependency_isolated", dependency: "identity_controller", at: now() });
    return guard;
  }

  function transitionToTuesday(state) {
    assert(state.flags.sector04Completed, "Sector 04 must be understood and verified before Tuesday");
    state.campaign.day = 2;
    state.campaign.chapter = "ghost_frequency";
    state.campaign.phase = "morning";
    state.flags.tuesdayMorningReached = true;
    state.night = initialState().night;
    state.history.push({ type: "day_transition", fromDay: 1, toDay: 2, at: now() });
    validate(state);
    return state;
  }

  function save(state, storage) {
    validate(state);
    storage = storage || (typeof localStorage !== "undefined" ? localStorage : null);
    assert(storage && storage.setItem, "A storage adapter is required");
    storage.setItem(SAVE_KEY, JSON.stringify(state));
    return true;
  }

  function load(storage) {
    storage = storage || (typeof localStorage !== "undefined" ? localStorage : null);
    if (!storage || !storage.getItem) return initialState();
    var raw = storage.getItem(SAVE_KEY);
    if (!raw) return initialState();
    var state = JSON.parse(raw);
    validate(state);
    return state;
  }

  var api = {
    VERSION: VERSION, SAVE_KEY: SAVE_KEY, TICKETS: TICKETS.slice(),
    TICKET_TEMPLATES: clone(TICKET_TEMPLATES),
    TUESDAY_MORNING_CONTRACT: clone(TUESDAY_MORNING_CONTRACT),
    createInitialState: initialState, clone: clone, validate: validate,
    getTicketTemplate: getTicketTemplate, listTicketTemplates: listTicketTemplates,
    getTuesdayMorningContract: getTuesdayMorningContract,
    assignTicket: assignTicket, completeStandup: completeStandup,
    completeWorkstation: completeWorkstation, recordGhostEvidence: recordGhostEvidence,
    resolveTicket: resolveTicket, enterSector04: enterSector04,
    insightAccessGuard: insightAccessGuard, suppressAccessGuard: suppressAccessGuard,
    severAccessController: severAccessController, transitionToTuesday: transitionToTuesday,
    save: save, load: load
  };

  if (typeof window !== "undefined" && window.addEventListener) {
    window.dispatchEvent(new CustomEvent("techops:campaign-ready", { detail: { version: VERSION, api: api } }));
  }
  return api;
});
