/* TechOps Hero — Campaign Director v2 / Story Bible v1.2 opening contract.
 * Authored beats determine meaning. Systems determine how the player reaches them.
 * Canonical opening state is snake_case; camelCase aliases remain for legacy hooks/saves.
 */
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.TechOpsCampaign = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  var VERSION = 2;
  var SAVE_KEY = "techops_hero_campaign_v1";
  var TICKETS = ["shipping_cannot_print", "plating_workstation_down", "impossible_access_event"];
  var TICKET_TEMPLATES = {
    shipping_cannot_print: {
      id: "shipping_cannot_print", requester: "Shipping clerk", department: "Shipping",
      humanNeed: "Shipping must print customs labels so outgoing avionics work can move.",
      visibleSymptom: "Printer shows ready, but customs-label jobs disappear from the queue.",
      operationalContext: "Shipment must clear before the production handoff window or downstream work stalls.",
      hypotheses: ["driver_issue", "spooler_queue", "permissions", "network_path"],
      verificationCondition: "Requester prints the required customs label and confirms the label is accurate.",
      nightManifestation: null, campaignOutputs: [], ordinary: true
    },
    plating_workstation_down: {
      id: "plating_workstation_down", requester: "Plating operator", department: "Manufacturing",
      humanNeed: "Production needs the workstation restored so the plating line can move.",
      visibleSymptom: "Workstation restarted overnight and never returned to usable service.",
      operationalContext: "A physical line is waiting on a digital dependency.",
      hypotheses: ["stale_service", "credential_state", "integration_failure", "local_workstation_fault"],
      verificationCondition: "Operator completes a real production interaction and confirms the line can resume.",
      nightManifestation: null, campaignOutputs: [], ordinary: true
    },
    impossible_access_event: {
      id: "impossible_access_event", requester: "Security operations", department: "Security",
      humanNeed: "Security must understand a valid access record that conflicts with physical reality.",
      visibleSymptom: "Mike's badge appears to open SECTOR04-EAST at 02:13 when he was not present.",
      operationalContext: "Identity, physical presence, and audit trust no longer align.",
      hypotheses: ["credential_clone", "controller_replay", "camera_gap", "orpheus_interference"],
      verificationCondition: "Document the unresolved inconsistency without falsely closing it.",
      nightManifestation: "sector_04_access_guard", campaignOutputs: ["ghost_identity_evidence"], ordinary: false
    }
  };
  var TUESDAY_MORNING_CONTRACT = {
    persists: ["campaign flags", "evidence sources", "evidence provenance", "trust state", "team health", "verification history", "human outcomes", "completed tickets", "unresolved tickets", "ORPHEUS signature exposure", "workstation discoveries", "MORNINGSTAR inventory", "player behavior history"],
    resets: ["Night Walker temporary sector state", "active combat state", "manifestation suppression timers", "current night position"],
    transforms: ["Night evidence becomes daytime hypotheses", "unresolved tickets age", "verified work creates future opportunities", "poor verification becomes recurrence risk"],
    requiredBoundary: "New Game through Sector 04 must cut cleanly to Day 2 / Ghost Frequency."
  };
  var PERSPECTIVE_RANK = { unverified: 0, inferred: 1, delegated_partial: 2, delegated_verified: 3, firsthand: 4, corroborated_firsthand: 5 };
  var FLAG_ALIASES = {
    standup_started: "standupStarted",
    ticket_assignments_confirmed: "ticketAssignmentsConfirmed",
    workstation_checked: "workstationOpened",
    red_in_mirror_heard: "redInTheMirrorHeard",
    felicia_video_watched: "feliciaVideoSeen",
    sector04_entered: "sector04Entered",
    sector04_completed: "sector04Completed",
    tuesday_morning_reached: "tuesdayMorningReached"
  };

  function clone(value) { return JSON.parse(JSON.stringify(value)); }
  function now() { return new Date().toISOString(); }
  function assert(condition, message) { if (!condition) throw new Error(message); }
  function emptyFact() { return { status: "unknown", sources: [], bestPerspective: null, corroborated: false }; }

  function canonicalFlags() {
    return {
      standup_started: true,
      ticket_assignments_confirmed: false,
      standup_completed: false,
      workstation_checked: false,
      red_in_mirror_heard: false,
      felicia_blog_found: false,
      felicia_video_watched: false,
      day_work_unlocked: false,
      sector04_entered: false,
      sector04_completed: false,
      tuesday_morning_reached: false
    };
  }

  function syncLegacyFlags(state) {
    state.flags = state.flags || {};
    Object.keys(FLAG_ALIASES).forEach(function (canonical) {
      state.flags[FLAG_ALIASES[canonical]] = !!state.flags[canonical];
    });
    return state;
  }

  function initialState() {
    var state = {
      schemaVersion: VERSION,
      campaign: { day: 1, act: 1, chapter: "the_queue", phase: "standup", storyModeVersion: "1.2" },
      flags: canonicalFlags(), assignments: {}, tickets: {},
      evidence: { ghostIdentityEvidence: emptyFact() },
      trust: { felicia: { state: "suspicious", history: [] } },
      teamHealth: {}, verificationHistory: [], humanOutcomes: {},
      orpheusSignatures: { impossibleRecords: 0, unauthorizedCorrections: 0, behavioralPrediction: 0, inhumanOptimization: 0 },
      night: { sector: null, position: null, combatActive: false, accessGuard: { health: 100, suppressed: false, suppressionEndsAt: null, dependencyKnown: false, dependencyLocated: false, dependencyIsolated: false, restorationVerified: false, permanentlyDefeated: false } },
      morningstar: { components: [] }, playerBehaviorHistory: [],
      history: [{ type: "campaign_started", at: now() }]
    };
    return syncLegacyFlags(state);
  }

  function migrate(state) {
    assert(state && typeof state === "object", "Campaign state is required");
    state.flags = state.flags || {};
    var old = state.flags;
    var sourceVersion = Number(state.schemaVersion || 1);
    var fresh = canonicalFlags();

    Object.keys(fresh).forEach(function (key) {
      if (typeof old[key] === "boolean") fresh[key] = old[key];
    });

    // Only legacy saves are allowed to infer canonical progress from camelCase aliases.
    // v2 saves already contain canonical flags; re-applying the v1 collapse would cause
    // feliciaVideoSeen/workstationOpened aliases to silently unlock day work on every load.
    if (sourceVersion < VERSION) {
      Object.keys(FLAG_ALIASES).forEach(function (canonical) {
        var legacy = FLAG_ALIASES[canonical];
        if (typeof old[legacy] === "boolean") fresh[canonical] = old[legacy];
      });
      if (old.ticketAssignmentsConfirmed) fresh.standup_completed = true;
      if (old.workstationOpened) fresh.workstation_checked = true;
      if (old.feliciaVideoSeen) {
        fresh.felicia_blog_found = true;
        fresh.felicia_video_watched = true;
      }
      if (old.workstationOpened && old.feliciaVideoSeen) {
        fresh.red_in_mirror_heard = old.redInTheMirrorHeard !== false;
        fresh.day_work_unlocked = true;
      }
    }

    state.flags = Object.assign(old, fresh);
    state.schemaVersion = VERSION;
    state.campaign = state.campaign || { day: 1, act: 1, chapter: "the_queue", phase: "standup" };
    state.campaign.storyModeVersion = "1.2";
    if (!state.history) state.history = [];
    if (!state.evidence) state.evidence = { ghostIdentityEvidence: emptyFact() };
    if (!state.evidence.ghostIdentityEvidence) state.evidence.ghostIdentityEvidence = emptyFact();
    return syncLegacyFlags(state);
  }

  function getTicketTemplate(ticketId) { assert(TICKETS.indexOf(ticketId) >= 0, "Unknown Act I ticket: " + ticketId); return clone(TICKET_TEMPLATES[ticketId]); }
  function listTicketTemplates() { return TICKETS.map(getTicketTemplate); }
  function getTuesdayMorningContract() { return clone(TUESDAY_MORNING_CONTRACT); }

  function validate(state) {
    assert(state && state.schemaVersion === VERSION, "Unsupported campaign schema");
    assert(state.campaign && Number.isInteger(state.campaign.day), "Campaign day is required");
    assert(state.flags && typeof state.flags.day_work_unlocked === "boolean", "Canonical opening flags are required");
    assert(state.evidence && state.evidence.ghostIdentityEvidence, "Evidence store is required");
    TICKETS.forEach(function (id) {
      if (state.flags.ticket_assignments_confirmed) assert(!!state.assignments[id], "Confirmed standup requires one owner per ticket: " + id);
    });
    if (state.flags.day_work_unlocked) {
      assert(state.flags.standup_completed && state.flags.workstation_checked && state.flags.red_in_mirror_heard && state.flags.felicia_blog_found && state.flags.felicia_video_watched, "Day work cannot unlock before the authored opening completes");
    }
    return true;
  }

  function assignTicket(state, ticketId, ownerId) {
    assert(TICKETS.indexOf(ticketId) >= 0, "Unknown Act I ticket: " + ticketId);
    assert(typeof ownerId === "string" && ownerId.trim(), "Ticket owner is required");
    assert(!state.flags.standup_completed, "Ticket ownership is locked after standup completes");
    state.assignments[ticketId] = ownerId.trim();
    state.history.push({ type: "ticket_assigned", ticketId: ticketId, ownerId: ownerId.trim(), at: now() });
    return state;
  }

  function completeStandup(state) {
    TICKETS.forEach(function (id) { assert(!!state.assignments[id], "Every active ticket must have exactly one owner: " + id); });
    state.flags.ticket_assignments_confirmed = true;
    state.flags.standup_completed = true;
    state.flags.standup_started = false;
    state.campaign.phase = "workstation";
    state.history.push({ type: "standup_completed", at: now() });
    return syncLegacyFlags(state);
  }

  function checkWorkstation(state) {
    assert(state.flags.standup_completed, "Standup must complete before workstation sequence");
    state.flags.workstation_checked = true;
    state.campaign.phase = "workstation";
    state.history.push({ type: "workstation_checked", at: now() });
    return syncLegacyFlags(state);
  }
  function hearRedInMirror(state) {
    assert(state.flags.workstation_checked, "Workstation must be checked before music can become opening state");
    state.flags.red_in_mirror_heard = true;
    state.history.push({ type: "red_in_mirror_heard", context: "ordinary_listening", at: now() });
    return syncLegacyFlags(state);
  }
  function findFeliciaBlog(state) {
    assert(state.flags.workstation_checked, "Workstation must be checked before the company blog");
    state.flags.felicia_blog_found = true;
    state.history.push({ type: "felicia_blog_found", at: now() });
    return state;
  }
  function completeFeliciaVideo(state, data) {
    data = data || {};
    assert(state.flags.felicia_blog_found, "Felicia company-blog post must be found before the video");
    assert(data.started !== false, "Video must be started before completion or deliberate skip");
    state.flags.felicia_video_watched = true;
    state.history.push({ type: data.skipped ? "felicia_video_skipped" : "felicia_video_completed", deliberate: !!data.skipped, at: now() });
    return syncLegacyFlags(state);
  }
  function unlockDayWork(state) {
    assert(state.flags.standup_completed && state.flags.workstation_checked && state.flags.red_in_mirror_heard && state.flags.felicia_blog_found && state.flags.felicia_video_watched, "Standup, workstation, music, company blog, and Felicia video must complete before day work unlocks");
    state.flags.day_work_unlocked = true;
    state.campaign.phase = "day_shift";
    state.history.push({ type: "day_work_unlocked", at: now() });
    return syncLegacyFlags(state);
  }
  function completeWorkstation(state, data) {
    data = data || {};
    checkWorkstation(state);
    if (data.redInTheMirrorHeard !== false) hearRedInMirror(state);
    findFeliciaBlog(state);
    completeFeliciaVideo(state, { started: true, skipped: !!data.feliciaVideoSkipped });
    unlockDayWork(state);
    state.history.push({ type: "workstation_sequence_completed", at: now() });
    return state;
  }

  function deriveFact(fact) {
    var best = null;
    fact.sources.forEach(function (source) { if (!best || (PERSPECTIVE_RANK[source.perspective] || 0) > (PERSPECTIVE_RANK[best.perspective] || 0)) best = source; });
    fact.status = fact.sources.length ? "established" : "unknown";
    fact.bestPerspective = best ? best.perspective : null;
    fact.corroborated = fact.sources.length > 1 || !!fact.sources.find(function (s) { return s.perspective === "corroborated_firsthand"; });
  }
  function recordGhostEvidence(state, source) {
    assert(state.flags.day_work_unlocked, "Day 1 work is locked until the workstation sequence completes");
    assert(source && source.id, "Evidence source id is required");
    assert(PERSPECTIVE_RANK[source.perspective] !== undefined, "Invalid evidence perspective");
    var fact = state.evidence.ghostIdentityEvidence;
    var normalized = { id: source.id, perspective: source.perspective, reliability: source.reliability || "high", completeness: source.completeness || "partial", discoveredBy: source.discoveredBy || "mike", authority: source.authority || null, day: state.campaign.day, at: now() };
    var existing = fact.sources.findIndex(function (item) { return item.id === normalized.id; });
    if (existing >= 0) fact.sources[existing] = normalized; else fact.sources.push(normalized);
    deriveFact(fact);
    if (source.id === "badge_impossible_access") state.orpheusSignatures.impossibleRecords = Math.max(1, state.orpheusSignatures.impossibleRecords);
    state.history.push({ type: "evidence_recorded", fact: "ghostIdentityEvidence", sourceId: normalized.id, at: now() });
    return fact;
  }
  function resolveTicket(state, ticketId, result) {
    assert(state.flags.day_work_unlocked, "Day 1 work is locked until the workstation sequence completes");
    assert(TICKETS.indexOf(ticketId) >= 0, "Unknown Act I ticket: " + ticketId);
    assert(state.assignments[ticketId], "Ticket must have an owner before resolution");
    result = result || {};
    assert(result.technicalResolution === true, "Technical resolution must be explicit");
    assert(["partial", "strong"].indexOf(result.verification) >= 0, "Verification must be partial or strong");
    assert(["restored", "degraded", "unmet"].indexOf(result.humanOutcome) >= 0, "Human outcome is required");
    state.tickets[ticketId] = { status: "resolved", ownerId: state.assignments[ticketId], technicalResolution: true, verification: result.verification, humanOutcome: result.humanOutcome, completedAt: now() };
    state.verificationHistory.push({ ticketId: ticketId, strength: result.verification, at: now() });
    state.humanOutcomes[ticketId] = result.humanOutcome;
    return state.tickets[ticketId];
  }
  function enterSector04(state) {
    assert(state.flags.day_work_unlocked, "Day shift must unlock before Night Walker");
    state.flags.sector04_entered = true; state.campaign.phase = "night_walker";
    state.night.sector = "sector_04"; state.night.combatActive = true;
    state.night.accessGuard.dependencyKnown = state.evidence.ghostIdentityEvidence.status === "established";
    state.history.push({ type: "sector04_entered", at: now() });
    syncLegacyFlags(state); return state.night.accessGuard;
  }
  function insightAccessGuard(state) {
    var known = state.evidence.ghostIdentityEvidence.status === "established";
    state.night.accessGuard.dependencyKnown = known;
    if (!known) return { success: false, message: "Unknown controller—daytime investigation required." };
    state.night.accessGuard.dependencyLocated = true;
    return { success: true, message: "VALID IDENTITY ≠ VERIFIED PRESENCE. Trace assertion source.", dependency: "identity_controller" };
  }
  function suppressAccessGuard(state, durationMs) {
    var guard = state.night.accessGuard; guard.health = 0; guard.suppressed = true;
    guard.suppressionEndsAt = Date.now() + (durationMs || 15000);
    state.history.push({ type: "manifestation_suppressed", manifestation: "access_guard", at: now() }); return guard;
  }
  function severAccessController(state) {
    var guard = state.night.accessGuard;
    assert(guard.dependencyKnown && guard.dependencyLocated, "Controller dependency is not understood");
    guard.dependencyIsolated = true; guard.restorationVerified = true; guard.permanentlyDefeated = true; guard.suppressed = true;
    state.flags.sector04_completed = true; state.night.combatActive = false;
    state.history.push({ type: "dependency_isolated", dependency: "identity_controller", at: now() });
    syncLegacyFlags(state); return guard;
  }
  // The first workday boundary materializes a bounded, deterministic handoff.
  // Day 1 closures/evidence stay immutable; new work gets its own provenance.
  var FOLLOWUP_TICKETS = ["shipping_cannot_print", "plating_workstation_down"];
  function followupTicket(ticketId) {
    assert(FOLLOWUP_TICKETS.indexOf(ticketId) >= 0, "Unknown ordinary follow-up ticket: " + ticketId);
  }
  function handoffItem(state, ticketId) {
    var ticket = (state.tickets || {})[ticketId], outcome = (state.humanOutcomes || {})[ticketId];
    var conflict = !!ticket && !!outcome && ticket.humanOutcome !== outcome;
    var kind = !ticket ? "carryover" : conflict ? "reconcile" :
      ticket.status === "resolved" && ticket.technicalResolution === true && ticket.verification === "strong" && ticket.humanOutcome === "restored" ? "stable" :
      ticket.humanOutcome === "degraded" || ticket.humanOutcome === "unmet" ? "restore" : "recheck";
    return { id:"day2:"+ticketId, ticketId:ticketId, day:2, sourceDay:1, kind:kind,
      phase:kind === "stable" ? "complete" : kind === "carryover" ? "carryover" : "gather",
      source:{ assignedOwner:state.assignments[ticketId] || null, completionOwner:ticket && ticket.ownerId || null,
        verification:ticket && ticket.verification || null, humanOutcome:ticket && ticket.humanOutcome || null,
        recordedOutcome:outcome || null, completedAt:ticket && ticket.completedAt || null },
      evidence:[], ruledOut:[], hypothesis:null, events:[], result:null };
  }
  function workdayHandoff(state) {
    assert(state && state.campaign && state.flags, "Campaign state is required");
    if (!state.flags.tuesday_morning_reached || state.campaign.day < 2) return [];
    var saved = state.workdayContinuity && state.workdayContinuity.day2;
    return FOLLOWUP_TICKETS.map(function (ticketId) {
      var record = saved && saved[ticketId] ? clone(saved[ticketId]) : handoffItem(state, ticketId);
      // Carried, never-closed Day 1 work still uses its original investigation.
      // A later verified closure is read, not retroactively inserted into the snapshot.
      if (record.kind === "carryover") {
        var current = handoffItem(state, ticketId);
        if (current.kind === "stable") { record.phase="complete"; record.result={ verification:"strong", humanOutcome:"restored", ownerId:current.source.completionOwner, fromCarryover:true }; }
      }
      return record;
    });
  }
  function initializeWorkdayHandoff(state) {
    if (state.workdayContinuity && state.workdayContinuity.day2) return;
    var records = workdayHandoff(state), day2 = {};
    records.forEach(function (record) { day2[record.ticketId] = record; });
    state.workdayContinuity = Object.assign({}, state.workdayContinuity || {}, { version:1, day2:day2 });
    state.history.push({ type:"workday_handoff_created", day:2, at:now() });
  }
  function followupDefinition(record) {
    followupTicket(record.ticketId);
    var shipping = record.ticketId === "shipping_cannot_print", repair = record.kind === "restore";
    var template = getTicketTemplate(record.ticketId);
    var correct = repair ? (shipping ? "shift_access_gap" : "startup_dependency_gap") : "confirm_real_work";
    return { title:shipping ? "SHIPPING // NEXT SHIFT" : "PLATING // NEXT SHIFT", humanNeed:template.humanNeed,
      reason:record.kind === "stable" ? "Strong verification and a restored human outcome carried forward. No repeat work is required." :
        record.kind === "carryover" ? "This ticket was not closed on Day 1. Resume the original investigation; nothing has been reset." :
        record.kind === "restore" ? "The previous closure explicitly recorded degraded or unmet service. Find what is still blocking the next shift." :
        record.kind === "reconcile" ? "The two saved outcome records disagree. Neither is silently rewritten. Establish a new, separately recorded outcome." :
        "Verification was incomplete. A recheck is due; that is not evidence that the fault has returned.",
      correctHypothesis:correct,
      evidence:[
        {id:"requester",label:"Ask the next-shift requester",text:repair ? (shipping ? "The new shift cannot print customs labels under its own approved Shipping account." : "The operator reports the integration drops out again after a controlled restart; the line is waiting.") : (shipping ? "Shipping reports usable customs labels on the next shift. The report still needs a direct task check." : "The next operator reports the line is available. Verify the real production interaction, not only that report.")},
        {id:"technical",label:shipping ? "Trace the next-shift label job" : "Check integration across a controlled restart",text:repair ? (shipping ? "The printer self-test passes. The new shift account is authorized in the role catalogue but absent from the queue's approved group. Its job fails authorization." : "Local sign-in and the controller path are healthy. The integration dependency starts manually but is not enabled to return at boot.") : (shipping ? "A label job from the next-shift session passes authorization and reaches the printer. The shipment details still need requester verification." : "The integration dependency survives a controlled restart and the controller session reconnects. The operator still needs to test production.")},
        {id:"handoff",label:"Review the previous handoff",text:"Previous verification: "+(record.source.verification || "not recorded")+". Closure outcome: "+(record.source.humanOutcome || "not recorded")+". Outcome ledger: "+(record.source.recordedOutcome || "not recorded")+". These are historical records, not new observations."}
      ],
      hypotheses:repair ? [
        {id:correct,label:shipping ? "Next-shift queue authorization gap" : "Integration dependency not persistent at boot"},
        {id:"replace_hardware",label:shipping ? "Replace the printer" : "Replace the workstation"},
        {id:"close_from_status",label:"Close from a healthy status indicator"}
      ] : [
        {id:"confirm_real_work",label:"Technical path is healthy; verify the real task"},
        {id:"assume_recurrence",label:"Assume the original fault has returned"},
        {id:"close_from_status",label:"Close from a healthy status indicator"}
      ],
      remediation:shipping ? "Apply the approved queue-group membership for the next shift and refresh that session. Keep unrelated permissions unchanged." : "Restore the integration dependency's automatic start, then bring up the service and controller session.",
      technicalCheck:shipping ? "A fresh next-shift label job passes authorization and arrives at the printer." : "The dependency returns after a controlled restart and the controller session reconnects.",
      humanVerification:shipping ? "The next-shift clerk prints the actual customs label, checks the shipment details, and confirms it is usable." : "The next operator completes the real production interaction and confirms the line can resume." };
  }
  function performWorkdayFollowup(state, ticketId, action, value) {
    followupTicket(ticketId);
    assert(state.flags.tuesday_morning_reached && state.campaign.day >= 2 && state.flags.day_work_unlocked, "Next-shift follow-up requires Tuesday");
    var before = workdayHandoff(state).find(function (item) { return item.ticketId === ticketId; });
    assert(before && before.kind !== "stable" && before.kind !== "carryover", "This ticket has no separate next-shift investigation");
    var def = followupDefinition(before);
    assert(["observe","hypothesis","remediate","technical_check","verify_requester"].indexOf(action) >= 0, "Unknown follow-up action");
    if (action === "observe") assert(def.evidence.some(function (e) { return e.id === value; }), "Unknown follow-up evidence");
    if (action === "hypothesis") assert(def.hypotheses.some(function (h) { return h.id === value; }), "Unknown follow-up hypothesis");
    // Work on a copy. Rejected/stale callbacks cannot partially mutate the save.
    var record = clone(before), event = { type:action, at:now(), actor:"mike" };
    if (record.phase === "complete") return record;
    if (action === "observe") {
      if (record.evidence.indexOf(value) >= 0) return record;
      record.evidence.push(value); event.evidenceId=value;
    } else if (action === "hypothesis") {
      assert(record.evidence.indexOf("requester") >= 0 && record.evidence.indexOf("technical") >= 0, "Requester and technical observations are both required");
      if (record.hypothesis === value) return record;
      assert(record.phase === "gather", "The supported hypothesis cannot be replaced after remediation begins");
      event.hypothesis=value;
      if (value !== def.correctHypothesis) {
        if (record.ruledOut.indexOf(value) >= 0) return record;
        record.ruledOut.push(value); event.result="ruled_out";
      } else { record.hypothesis=value; record.phase=record.kind === "restore" ? "remediate" : "human_verify"; event.result="supported"; }
    } else if (action === "remediate") {
      if (record.fixApplied) return record;
      assert(record.phase === "remediate" && record.hypothesis === def.correctHypothesis, "A supported repair hypothesis is required");
      record.fixApplied=true; record.phase="technical_check";
    } else if (action === "technical_check") {
      if (record.technicalCheckPassed) return record;
      assert(record.phase === "technical_check" && record.fixApplied, "Remediation must precede the technical recheck");
      record.technicalCheckPassed=true; record.phase="human_verify";
    } else {
      assert(record.phase === "human_verify" && record.hypothesis === def.correctHypothesis, "Technical validation and a supported conclusion must precede requester verification");
      assert(record.kind !== "restore" || record.technicalCheckPassed === true, "A repaired service must pass its technical recheck");
      record.phase="complete"; record.completedAt=event.at;
      record.result={ ownerId:"mike", perspective:"firsthand", verification:"strong", humanOutcome:"restored", at:event.at };
    }
    record.events.push(event);
    initializeWorkdayHandoff(state);
    state.workdayContinuity.day2[ticketId]=record;
    state.history.push({ type:"workday_followup", ticketId:ticketId, followupId:record.id, action:action, at:event.at });
    return clone(record);
  }

  function transitionToTuesday(state) {
    assert(state.flags.sector04_completed, "Sector 04 must be understood and verified before Tuesday");
    if (state.flags.tuesday_morning_reached) { validate(state); return state; }
    state.campaign.day = 2; state.campaign.chapter = "ghost_frequency"; state.campaign.phase = "morning";
    state.flags.tuesday_morning_reached = true; state.night = initialState().night;
    initializeWorkdayHandoff(state);
    state.history.push({ type: "day_transition", fromDay: 1, toDay: 2, at: now() });
    syncLegacyFlags(state); validate(state); return state;
  }
  function save(state, storage) {
    syncLegacyFlags(state); validate(state);
    storage = storage || (typeof localStorage !== "undefined" ? localStorage : null);
    assert(storage && storage.setItem, "A storage adapter is required");
    if (typeof globalThis !== "undefined" && globalThis.TechOpsUniverse) globalThis.TechOpsUniverse.beforeCampaign(state, storage);
    var payload = JSON.stringify(state);
    try {
      storage.setItem(SAVE_KEY, payload);
      assert(storage.getItem(SAVE_KEY) === payload, "Campaign save verification failed");
    } catch (error) {
      if (state.universe && typeof globalThis !== "undefined" && globalThis.TechOpsUniverse) state.universe.revision--;
      throw error;
    }
    if (typeof globalThis !== "undefined" && globalThis.TechOpsUniverse) globalThis.TechOpsUniverse.afterSave();
    return true;
  }
  function load(storage) {
    storage = storage || (typeof localStorage !== "undefined" ? localStorage : null);
    if (!storage || !storage.getItem) return initialState();
    var raw = storage.getItem(SAVE_KEY); if (!raw) return initialState();
    var state = migrate(JSON.parse(raw)); validate(state); return state;
  }
  function reset(storage) {
    storage = storage || (typeof localStorage !== "undefined" ? localStorage : null);
    assert(storage && typeof storage.removeItem === "function", "A storage adapter with removeItem is required");
    storage.removeItem(SAVE_KEY);
    if (typeof globalThis !== "undefined" && globalThis.TechOpsUniverse) globalThis.TechOpsUniverse.afterReset(storage);
    return initialState();
  }

  var api = {
    VERSION: VERSION, SAVE_KEY: SAVE_KEY, TICKETS: TICKETS.slice(), TICKET_TEMPLATES: clone(TICKET_TEMPLATES), TUESDAY_MORNING_CONTRACT: clone(TUESDAY_MORNING_CONTRACT),
    createInitialState: initialState, clone: clone, migrate: migrate, syncLegacyFlags: syncLegacyFlags, validate: validate,
    getTicketTemplate: getTicketTemplate, listTicketTemplates: listTicketTemplates, getTuesdayMorningContract: getTuesdayMorningContract,
    assignTicket: assignTicket, completeStandup: completeStandup,
    checkWorkstation: checkWorkstation, hearRedInMirror: hearRedInMirror, findFeliciaBlog: findFeliciaBlog, completeFeliciaVideo: completeFeliciaVideo, unlockDayWork: unlockDayWork, completeWorkstation: completeWorkstation,
    recordGhostEvidence: recordGhostEvidence, resolveTicket: resolveTicket, enterSector04: enterSector04,
    insightAccessGuard: insightAccessGuard, suppressAccessGuard: suppressAccessGuard, severAccessController: severAccessController, transitionToTuesday: transitionToTuesday,
    workdayHandoff: workdayHandoff, followupDefinition: followupDefinition, performWorkdayFollowup: performWorkdayFollowup,
    save: save, load: load, reset: reset
  };
  if (typeof window !== "undefined" && window.addEventListener) window.dispatchEvent(new CustomEvent("techops:campaign-ready", { detail: { version: VERSION, api: api } }));
  return api;
});

/* BEGIN GENERATED LINKED PROGRESSION BROWSER BUNDLE */
if (typeof window !== 'undefined' && window.document) {

/* source: see-world/universe-core.js */
/* SEE WORLD / TECHOPS HERO — shared, pure chronology contract. No save mutations. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.TechOpsUniverseCore=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const VERSION=1, RULES='linked-2026-11-07.1';
const KEYS=Object.freeze({source:'theemrld:universe:source:v1',profile:'theemrld:universe:profile:v1',campaign:'techops_hero_campaign_v1',game:'techops_save',see:'theemrld:universe:see:v2:'});
const ORDER=['prologue','act_1','act_2','act_3','act_4','act_5','act_6','interlude','act_7','act_8','act_9','epilogue'];
const CAMPAIGNS=['iona','felicia','k','waldo'];
const SECTION_IDS=['felicia_signal','felicia_stop','k_anchor','waldo_route','iona_freight','iona_workshop','iona_witness'];
const object=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
const own=(x,k)=>object(x)&&Object.prototype.hasOwnProperty.call(x,k);
const clone=x=>JSON.parse(JSON.stringify(x));
const binding=x=>object(x)&&x.schema===1&&typeof x.profileId==='string'&&/^p_[a-zA-Z0-9-]{8,80}$/.test(x.profileId)&&typeof x.playthroughId==='string'&&/^r_[a-zA-Z0-9-]{8,80}$/.test(x.playthroughId);
const same=(a,b)=>binding(a)&&binding(b)&&a.profileId===b.profileId&&a.playthroughId===b.playthroughId;
function parse(raw,max=2000000){if(typeof raw!=='string'||raw.length>max)throw Error('Missing or oversized save.');const d=JSON.parse(raw);if(!object(d))throw Error('Invalid save object.');return d;}
function ordered(acts){if(!Array.isArray(acts)||acts.length>ORDER.length||new Set(acts).size!==acts.length)throw Error('Invalid native act list.');for(let i=0;i<acts.length;i++)if(acts[i]!==ORDER[i])throw Error('Native story acts are not an ordered prefix.');return acts.length;}
function standalone(p){const m=p&&p.meta||{},g=m._v736||{};return !!m._standaloneMode||g.campaignOrigin==='standalone';}
function normalize(c,p,completedSections=[]){
 if(!object(c)||c.schemaVersion!==2||!object(p)||!same(c.universe,p.meta&&p.meta.universe)||standalone(p))throw Error('Native save pair is unbound or belongs to standalone play.');
 const st=c.story||{},f=st.facts||{},n=ordered(st.completedActs||[]), reached=id=>n>ORDER.indexOf(id),yes=k=>f[k]===true;
 const violinist=reached('act_3')&&yes('violinist_revealed');
 const duet=violinist&&reached('act_6')&&yes('duet_protocol_complete')&&yes('orbital_signal_found');
 const g=p.meta&&p.meta.goodDogs||{}, origin=p.meta&&p.meta._v736&&p.meta._v736.campaignOrigin;
 // Intermediate rescues must come from the same bound native profile, never the standalone slot.
 const nativeDogs=duet&&origin!== 'standalone';
 const returned=duet&&reached('interlude')&&['k_freed','waldo_freed','warden_null_defeated','crew_returned_to_earth'].every(yes);
 const kSeen=returned||(nativeDogs&&g.cell_118_reached===true&&g.k_seen===true);
 const kFreed=returned||(kSeen&&nativeDogs&&g.k_freed===true);
 const ozFreed=returned||(kFreed&&nativeDogs&&g.waldo_freed===true);
 const warden=returned||(ozFreed&&nativeDogs&&g.warden_null_defeated===true);
 const ghostFork=returned&&reached('act_7')&&yes('mike_meets_k')&&yes('k_personhood_affirmed');
 const disclosure=c.universe.disclosures||{};
 const iona=ghostFork&&disclosure.iona_arrest=== 'player-cutaway-v1';
 return {violinist,duet,orbital:duet,kSeen,kFreed,ozKnown:duet&&(returned||g.cell_1984_known===true),ozFreed,warden,returned,ghostFork,iona,
   complete:reached('epilogue')&&yes('campaign_complete'),completedActs:(st.completedActs||[]).slice(),
   completedSections:completedSections.filter(id=>SECTION_IDS.includes(id))};
}
function stamp(text){let a=2166136261,b=2246822519;for(let i=0;i<text.length;i++){const n=text.charCodeAt(i);a=Math.imul(a^n,16777619);b=Math.imul(b^n,3266489917);}return text.length+':'+(a>>>0).toString(16)+':'+(b>>>0).toString(16);}
function validateSource(s){return object(s)&&s.schema===VERSION&&s.rules===RULES&&s.status==='ready'&&binding(s.binding)&&Number.isSafeInteger(s.sequence)&&s.sequence>0&&Number.isSafeInteger(s.campaignRevision)&&s.campaignRevision>0&&Number.isSafeInteger(s.profileRevision)&&s.profileRevision>0&&object(s.milestones)&&Array.isArray(s.milestones.completedSections);}
function readSource(storage){
 try{
  const s=parse(storage.getItem(KEYS.source),64000);if(!validateSource(s))return {status:s.status==='reset'?'reset':'unavailable',reason:'Start or continue the linked TechOps Hero story run.'};
  const cRaw=storage.getItem(KEYS.campaign),pRaw=storage.getItem(KEYS.game),c=parse(cRaw),p=parse(pRaw);
  if(!same(s.binding,c.universe)||!same(s.binding,p.meta&&p.meta.universe)||standalone(p))return {status:'unavailable',reason:'The active native playthrough changed. Return to TechOps Hero.'};
  if(c.universe.revision!==s.campaignRevision||p._saveRevision!==s.profileRevision||stamp(cRaw)!==s.campaignStamp||stamp(pRaw)!==s.profileStamp||storage.getItem(KEYS.campaign)!==cRaw||storage.getItem(KEYS.game)!==pRaw)return {status:'stale',reason:'Native progress is awaiting a successful sync. Return to TechOps Hero.'};
  return s;
 }catch{return {status:'unavailable',reason:'No readable linked TechOps Hero save is available in this browser.'};}
}
const denied=reason=>({allowed:false,reason}),allowed=()=>({allowed:true,reason:''});
function gate(id,node,s){
 if(!validateSource(s))return denied(s&&s.reason||'Start or continue TechOps Hero to discover this perspective.');
 const m=s.milestones,sections=m.completedSections||[];
 if(!CAMPAIGNS.includes(id))return denied('Unknown perspective.');
 if(id==='felicia'){
  if(!m.violinist)return denied('Continue the main investigation in TechOps Hero.');
  if(!['rooftop','relay','crossing'].includes(node)&&!sections.includes('felicia_signal'))return denied('Complete the unlocked signal investigation in Night Walker.');
  return allowed();
 }
 if(id==='iona'){
  if(!m.iona)return denied('Continue the main story and read the newly available interlude in the native Story Timeline.');
  const required={'burn-end':'iona_freight','take-end':'iona_workshop','witness-end':'iona_witness'}[node];
  if(required&&!sections.includes(required))return denied('Complete this branch’s unlocked Night Walker follow-up.');
  return allowed();
 }
 if(id==='k'){
  if(!m.kSeen)return denied('Continue the orbital investigation in TechOps Hero.');
  if(['release','alcove','warden','shuttle','record-end','shared-end','quiet-end'].includes(node)&&!m.kFreed)return denied('Continue the first prison release in TechOps Hero.');
  if(['alcove','warden','shuttle','record-end','shared-end','quiet-end'].includes(node)&&!m.ozFreed)return denied('Complete the next prison release in TechOps Hero.');
  if(['shuttle','record-end','shared-end','quiet-end'].includes(node)&&!m.warden)return denied('Resolve the custody barrier in TechOps Hero.');
  if(node.endsWith('-end')&&(!m.returned||!sections.includes('k_anchor')))return denied('Complete the return and the unlocked memory investigation in Night Walker.');
  return allowed();
 }
 if(!m.ozKnown||!m.kSeen)return denied('Continue the orbital investigation in TechOps Hero.');
 if(['wait','freed','alcove','route','warden','shuttle','return-choice','shelter-end','introduction-end','record-end'].includes(node)&&!m.kFreed)return denied('Continue the first prison release in TechOps Hero.');
 if(['freed','alcove','route','warden','shuttle','return-choice','shelter-end','introduction-end','record-end'].includes(node)&&!m.ozFreed)return denied('Complete the next prison release in TechOps Hero.');
 if(['shuttle','return-choice','shelter-end','introduction-end','record-end'].includes(node)&&!m.warden)return denied('Resolve the custody barrier in TechOps Hero.');
 if(node.endsWith('-end')&&(!m.returned||!sections.includes('waldo_route')))return denied('Complete the return and the unlocked companion section in Night Walker.');
 return allowed();
}
const ENTRIES={iona:'rehearsal',felicia:'rooftop',k:'cell',waldo:'1984'};
const PLACEMENT={
 iona:'Earlier interlude: after Red’s arrest, before voice-window contact. Player perspective; Mike does not inherit it.',
 felicia:'After The Violinist. Independent preparation precedes formal Duet Protocol.',
 k:'Prison recollection and release, then return. Good Dogs precedes Ghost Fork.',
 waldo:'Good Dogs: Cell 118 first, then Cell 1984, custody barrier, return.'
};
function grants(runs,s){
 if(!validateSource(s))return [];
 const m=s.milestones,has=(id,node)=>!!runs[id]&&runs[id].history.some(x=>x.node===node),out=[];
 const add=(id,campaign,checkpoint)=>out.push({id,campaign,checkpoint,playthroughId:s.binding.playthroughId,sourceSequence:s.sequence});
 if(m.violinist&&has('felicia','relay'))add('felicia_signal','felicia','relay');
 if(m.violinist&&has('felicia','swarm'))add('felicia_stop','felicia','swarm');
 if(m.returned&&runs.k&&runs.k.flags.loopObserved&&has('k','alcove'))add('k_anchor','k','alcove');
 if(m.returned&&runs.waldo&&runs.waldo.flags.carePause&&has('waldo','alcove'))add('waldo_route','waldo','alcove');
 const i=runs.iona;
 if(m.iona&&i&&i.flags.ledger&&i.flags.rescue&&i.flags.allClear&&has('iona','fate')){
  const id={burned:'iona_freight',workshop:'iona_workshop',witnesses:'iona_witness'}[i.flags.depot];if(id)add(id,'iona','fate');
 }
 return out;
}
function sourceSignature(s){return validateSource(s)?`${s.binding.profileId}/${s.binding.playthroughId}/${s.sequence}/${s.campaignRevision}/${s.profileRevision}`:'unavailable';}
return Object.freeze({VERSION,RULES,KEYS,ORDER,CAMPAIGNS,SECTION_IDS,ENTRIES,PLACEMENT,object,own,clone,binding,same,parse,stamp,ordered,standalone,normalize,validateSource,readSource,gate,grants,sourceSignature});
});


/* source: universe-sections.js */
/* Authored Night Walker casebook sections. No main-story auto-completion. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.TechOpsUniverseSections=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const c=(id,label,to,feedback='')=>({id,label,to,feedback});
const n=(id,text,choices)=>({id,text,choices});
const cases={
 felicia_signal:{title:'The missing interval',actor:'Felicia',placement:'After The Violinist; solo investigation before Duet.',start:'observe',nodes:[
  n('observe','On the rooftop, one log claims the relay answered before the note. The independent clock records the answer after it. Which evidence do you preserve?',[c('both','Preserve both clocks and the original trace','compare'),c('headline','Keep only the dramatic timestamp','observe','A selected timestamp cannot resolve a disagreement. Preserve the comparison.')]),
  n('compare','The silent reference trial has no response. The repeated-note trial has a delayed return. What is supported?',[c('intent','The relay has confessed its intention','compare','Response timing is not evidence of intention.'),c('bounded','A repeatable local response, with one inconsistent clock','verify')]),
  n('verify','Felicia uses a second independent clock and repeats the test. The delayed return remains. The early timestamp does not. Record the result without inventing a sender.',[c('retest','Retain the reference, countertest, and uncertainty','report')]),
  n('report','The casebook now contains a reproducible local behavior. This report is player knowledge from Felicia’s viewpoint. Mike has not received it.',[c('file','File the bounded result; return to See World','done')]),n('done','Signal investigation complete. Felicia’s next See World chapter is now available.',[])]},
 felicia_stop:{title:'A stop outside your hands',actor:'Felicia',placement:'Grounded preparation; this does not clear MORNINGSTAR for flight.',start:'scope',nodes:[
  n('scope','A grounded rig reports STOPPED. Its actuator indicator remains lit. Choose what the next test must establish.',[c('report','Accept the controller’s report','scope','The reported state and observed state disagree.'),c('external','Test an external stop that a second operator controls','assign')]),
  n('assign','The second operator holds the stop. Felicia runs a harmless reference movement, then yields the test timing.',[c('yield','Let the other operator stop the test without a cue','observe')]),
  n('observe','The physical contact opens. The actuator stops. A restart request is rejected while the external stop remains held.',[c('bounded','Record only this tested stop boundary','done'),c('flight','Certify the aircraft from this result','observe','A grounded stop test is not an aircraft flight qualification.')]),n('done','Independent stop test complete. No Duet or flight-completion flag was awarded.',[])]},
 k_anchor:{title:'What the mark can prove',actor:'K',placement:'After the Good Dogs return; a bounded review of captivity, not a second escape.',start:'mark',nodes:[
  n('mark','K compares a remembered corridor with his note about a physical mark. The two accounts disagree. Which claim can the note support?',[c('identity','The note proves his complete origin','mark','A bounded observation does not explain a life.'),c('location','He recorded a specific observed mark; the memory remains uncertain','feed')]),
  n('feed','A familiar feeling arrives without a verifiable source. The review separates borrowed recognition from a prison encounter actually shared with Oz.',[c('separate','Keep the sources in separate columns','boundary')]),
  n('boundary','The review asks what may be shared. K can retain the note or authorize a limited account. Neither choice changes who he is.',[c('private','Keep the detailed record private','done'),c('limited','Share only the bounded discrepancy','done')]),n('done','Memory review complete. K’s final See World reflection is available. No new power or origin reveal was granted.',[])]},
 waldo_route:{title:'Count the people, not the light',actor:'Waldo / Oz',placement:'After the Good Dogs return; a practical rescue debrief.',start:'reports',nodes:[
  n('reports','Katrin hesitated at a shutter. Manchez investigated the clear path. What belongs in the rescue record?',[c('one','Treat both dogs as one obedient sensor','reports','Their caution and curiosity are distinct observations.'),c('distinct','Record each dog’s behavior and what was actually seen','order')]),
  n('order','Reconstruct the physical releases, not the order someone wishes they happened.',[c('wrong','Oz first, then K','order','Cell 118 was opened first. K and the dogs then opened Cell 1984.'),c('actual','Dogs free K; K and dogs free Oz','count')]),
  n('count','A shuttle panel reports READY. The final record must account for the passengers independently.',[c('names','Check K, Oz, Katrin and Manchez by name','done')]),n('done','Companion debrief complete. The return is preserved without crediting one person for everyone’s work.',[])]},
 iona_freight:{title:'After the fire',actor:'Iona',placement:'Earlier Low Quarter interlude; Burn branch only.',start:'route',nodes:[
  n('route','The depot is gone. Patrols recognize Iona, so Mara proposes an underground rehearsal entrance. The custody ledger remains outside the destroyed archive.',[c('ledger','Keep the original ledger with Mara; take a route copy','contact')]),
  n('contact','A neighborhood contact can arrange a meeting near North Intake. Is that proof of who ordered the research?',[c('claim','Name the contact’s rumor as the authorizer','contact','North Intake is still an investigative lead.'),c('lead','Request the original continuation order without naming a culprit','family')]),
  n('family','The sister needs an address, not a declaration of victory. Iona reads the ledger entry slowly enough for her to write.',[c('address','Give the address and distinguish what remains unknown','done')]),n('done','Freight follow-up complete. Underground access is recorded; the depot remains destroyed in this narrative branch.',[])]},
 iona_workshop:{title:'No one owns the voices',actor:'Iona',placement:'Earlier Low Quarter interlude; Take branch only.',start:'watch',nodes:[
  n('watch','The isolated workshop is a new responsibility. A recovery crew asks who controls the archive.',[c('shared','Establish a shared watch and keep the recovered ledger separate','privacy')]),
  n('privacy','An archived voice sounds familiar. Possessing its hardware does not establish permission to play or publish it.',[c('broadcast','Use the recordings to advertise the workshop','privacy','Possession is not consent.'),c('consent','Keep recordings private while the families decide what may be returned','handoff')]),
  n('handoff','Mara ends one watch and a bandmate takes the next. Iona records the North Intake lead without turning the workshop into a new unquestionable authority.',[c('rota','Commit the shared repair rota and bounded lead','done')]),n('done','Workshop follow-up complete. Defense duties and private archive custody persist for this branch.',[])]},
 iona_witness:{title:'Write down what I did, too',actor:'Iona',placement:'Earlier Low Quarter interlude; Witness branch only.',start:'custody',nodes:[
  n('custody','Independent witnesses accept the installation. Iona can accompany the ledger, but cannot select which inconvenient records are ignored.',[c('handoff','Document custody and retain a copy of the transfer receipt','testimony')]),
  n('testimony','The hearing asks what the ledger establishes. The family has an address; the research authorizer remains unknown.',[c('complete','Claim the larger conspiracy is solved','testimony','This local record does not establish the complete authorization chain.'),c('bounded','State the transfer evidence and disclose the remaining uncertainty','cost')]),
  n('cost','Public allies offer a rehearsal venue. The crew is identifiable now, and independent custody means the archive is out of Iona’s control.',[c('accept','Accept the public consequences without reclaiming the archive','done')]),n('done','Witness follow-up complete. Civic access and independent custody persist for this branch.',[])]}
};
function definition(id){return Object.prototype.hasOwnProperty.call(cases,id)?cases[id]:null;}
function replay(id,history){const d=definition(id);if(!d||!Array.isArray(history)||history.length>40)throw Error('Invalid native section history.');let node=d.start;for(const step of history){const current=d.nodes.find(n=>n.id===node),option=current&&current.choices.find(c=>c.id===step.choice);if(!step||step.node!==node||!option||option.to===node)throw Error('Invalid or unsuccessful native section action.');node=option.to;}const current=d.nodes.find(n=>n.id===node);return {id,node,complete:current.choices.length===0,history:history.map(s=>({node:s.node,choice:s.choice}))};}
function choose(id,history,choiceId){const run=replay(id,history),d=definition(id),current=d.nodes.find(n=>n.id===run.node),option=current.choices.find(c=>c.id===choiceId);if(!option)throw Error('That section action is no longer available.');if(option.to===run.node)return {run,feedback:option.feedback};return {run:replay(id,[...history,{node:run.node,choice:option.id}]),feedback:''};}
return Object.freeze({REVISION:'native-sections-2026-11-07.1',definition,replay,choose,ids:Object.keys(cases)});
});


/* source: universe-native.js */
/* Native owner for linked playthrough identity, milestone publication, and Night sections.
 * Publishing follows successful native persistence; See World never edits native flags.
 */
(function(root){
'use strict';
if(!root||root.TechOpsUniverse)return;
const U=root.TechOpsUniverseCore,Q=root.TechOpsUniverseSections;
if(!U||!Q)throw Error('Linked progression dependencies missing.');
let session=null,pending=Promise.resolve(false),lastError='',busy=false,storeModule=null,dialogOwner=false;
const game=()=>{try{return typeof S!=='undefined'?S:root.S;}catch{return root.S;}};
const storage=()=>root.localStorage;
const qa=()=>{try{const p=new URLSearchParams(root.location?.search||'');return p.has('qa')||p.has('dev')||p.has('test')||root.__K_QA__===true;}catch{return false;}};
const eligibleGame=()=>{const s=game();return !!s&&!U.standalone(s)&&!qa();};
const freshId=prefix=>prefix+(root.crypto&&root.crypto.randomUUID?root.crypto.randomUUID():Date.now().toString(36)+'-'+Math.random().toString(36).slice(2)+'-'+Math.random().toString(36).slice(2));
function fail(e){lastError=String(e&&e.message||e);root.__universeProgressError=lastError;return false;}
function rawObject(st,key){const raw=st.getItem(key);return raw?U.parse(raw):null;}
function profileId(st){let id=st.getItem(U.KEYS.profile);if(id===null){id=freshId('p_');st.setItem(U.KEYS.profile,id);}if(!/^p_[a-zA-Z0-9-]{8,80}$/.test(id))throw Error('Invalid linked profile identity; saved data was preserved.');return id;}
function freshBinding(st){return {schema:1,profileId:profileId(st),playthroughId:freshId('r_')};}
function attachSession(b){const id={schema:1,profileId:b.profileId,playthroughId:b.playthroughId};session=id;const s=game();if(s&&!U.standalone(s)){s.meta=s.meta||{};if(s.meta.universe&&!U.same(s.meta.universe,b))throw Error('A different playthrough is loaded in this tab. Continue the current run before saving.');s.meta.universe=U.clone(id);}}
function beforeCampaign(c,st){
 if(qa()||game()&&U.standalone(game()))return;
 const prior=rawObject(st,U.KEYS.campaign);
 if(c.universe){
  if(!U.binding(c.universe))throw Error('Invalid native linked identity.');
  if(prior&&prior.universe){
   if(!U.same(c.universe,prior.universe)||c.universe.revision!==prior.universe.revision)throw Error('Stale native campaign save; another tab changed the playthrough.');
  }else if(prior)throw Error('Cannot replace a legacy run with another run’s linked history.');
  const live=game();if(live&&live.meta&&live.meta.universe&&!U.same(live.meta.universe,c.universe))throw Error('Wrong active native playthrough.');
 }else if(prior){
  if(prior.universe)throw Error('Unbound state cannot replace the active linked campaign.');
  return; // Existing unbound saves require explicit migration from the journal.
 }else c.universe={...freshBinding(st),revision:0,disclosures:{},sections:{}};
 if(!Number.isSafeInteger(c.universe.revision)||c.universe.revision<0)throw Error('Invalid native save revision.');
 c.universe.revision++;
 attachSession(c.universe);
}
function beforeProfile(s,st){
 if(qa()||U.standalone(s))return;
 const c=rawObject(st,U.KEYS.campaign);if(!c||!U.binding(c.universe))return;
 s.meta=s.meta||{};
 if(s.meta.universe&&!U.same(s.meta.universe,c.universe))throw Error('This tab belongs to an older native playthrough.');
 if(!s.meta.universe){if(!session||!U.same(session,c.universe))return;s.meta.universe={schema:1,profileId:c.universe.profileId,playthroughId:c.universe.playthroughId};}
}
function completed(c){
 const out=[];
 if(Object.keys(c.universe.sections||{}).filter(id=>id.startsWith('iona_')).length>1)throw Error('Mutually exclusive Iona sections cannot share a linked run.');
 for(const [id,record] of Object.entries(c.universe.sections||{})){
  if(!Q.definition(id)||!record||record.revision!==Q.REVISION||!U.same(record.binding,c.universe)||!record.grant||record.grant.id!==id||!Number.isSafeInteger(record.grant.sourceSequence)||record.grant.sourceSequence<1)throw Error('Invalid native linked-section record.');
  if(Q.replay(id,record.history).complete)out.push(id);
 }
 return out;
}
function publish(){
 if(qa()||game()&&U.standalone(game()))return Promise.resolve(false);
 const locks=root.navigator&&root.navigator.locks;
 if(!locks||!locks.request){fail('Linked synchronization requires Web Locks support. Native progress remains saved.');return Promise.resolve(false);}
 const job=locks.request('techops-universe-native-source',{mode:'exclusive'},()=>{
  const st=storage(),cRaw=st.getItem(U.KEYS.campaign),pRaw=st.getItem(U.KEYS.game);
  if(!cRaw||!pRaw)return false;
  const c=U.parse(cRaw),p=U.parse(pRaw);
  if(!U.binding(c.universe)||!U.same(c.universe,p.meta&&p.meta.universe)||U.standalone(p))return false;
  const live=game();if(live&&live.meta&&live.meta.universe&&!U.same(live.meta.universe,c.universe))throw Error('The loaded run is stale; no source snapshot was published.');
  const milestones=U.normalize(c,p,completed(c));
  if(!Number.isSafeInteger(c.universe.revision)||c.universe.revision<1||!Number.isSafeInteger(p._saveRevision)||p._saveRevision<1)throw Error('Native save revisions are missing.');
  const previous=(()=>{try{return rawObject(st,U.KEYS.source);}catch{return null;}})();
  const campaignStamp=U.stamp(cRaw),profileStamp=U.stamp(pRaw);
  if(U.validateSource(previous)&&U.same(previous.binding,c.universe)&&previous.campaignStamp===campaignStamp&&previous.profileStamp===profileStamp)return previous;
  const counterKey=U.KEYS.source+':sequence:'+c.universe.playthroughId,rawCounter=st.getItem(counterKey),counter=rawCounter===null?0:Number(rawCounter);
  if(!Number.isSafeInteger(counter)||counter<0)throw Error('Invalid source sequence counter. Recovery is required.');
  const sequence=Math.max(counter,U.validateSource(previous)&&U.same(previous.binding,c.universe)?previous.sequence:0)+1;
  const s={schema:U.VERSION,rules:U.RULES,status:'ready',binding:{schema:1,profileId:c.universe.profileId,playthroughId:c.universe.playthroughId},sequence,campaignRevision:c.universe.revision,profileRevision:p._saveRevision,campaignStamp,profileStamp,milestones};
  if(st.getItem(U.KEYS.campaign)!==cRaw||st.getItem(U.KEYS.game)!==pRaw)throw Error('Native save changed during synchronization. Retry from the current run.');
  st.setItem(counterKey,String(sequence));st.setItem(U.KEYS.source,JSON.stringify(s));
  if(!U.validateSource(U.readSource(st)))throw Error('Source publication could not be verified.');
  lastError='';root.__universeProgressError=null;
  try{root.dispatchEvent(new CustomEvent('techops:universe-source',{detail:{sequence}}));}catch{}
  return s;
 }).catch(fail);
 pending=job;return job;
}
function afterSave(){void publish();}
function afterReset(st){
 session=null;
 try{st.setItem(U.KEYS.source,JSON.stringify({schema:U.VERSION,rules:U.RULES,status:'reset'}));}catch(e){fail(e);}
}
function nativeSave(){try{if(typeof save==='function')return save();if(typeof root.save==='function')return root.save();return false;}catch(e){return fail(e);}}
function dlg(title,text,options){
 const f=typeof root.dlg==='function'?root.dlg:typeof globalThis.dlg==='function'?globalThis.dlg:null;
 if(!f)return false;dialogOwner=true;f(title,text,options);return true;
}
function close(){dialogOwner=false;if(typeof root.closeDlg==='function')root.closeDlg();}
const escape=t=>String(t).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
async function module(){if(!storeModule)storeModule=import(new URL('../theemrld-portfolio/see-world/linked-store.mjs',root.location.href).href).then(M=>{if(M.U.RULES!==U.RULES)throw Error('The two deployments use incompatible progression rules.');return M;}).catch(e=>{storeModule=null;throw e;});return storeModule;}
async function context(){await publish();const source=U.readSource(storage());if(!U.validateSource(source))throw Error(source.reason||lastError||'No linked native run.');const M=await module(),record=M.inspectLinkedSave(storage(),source);return {source,record,grants:U.grants(record.runs,source)};}
function openError(e){fail(e);return dlg('LINKED STORY — NOT CHANGED',escape(lastError),[{t:'Return to Story Timeline',f:openJournal},{t:'Close',f:close}]);}
function storyUrl(){return new URL('../theemrld-portfolio/#/see-world',root.location.href).href;}
async function goSeeWorld(){try{if(!nativeSave())throw Error('Save the current native run before leaving.');await publish();if(!U.validateSource(U.readSource(storage())))throw Error(lastError||'The current run could not be synchronized.');root.location.assign(storyUrl());}catch(e){openError(e);}}
async function linkLegacy(){
 if(!eligibleGame())return openError(Error('Start or continue the main story run first. Standalone and QA sessions cannot link.'));
 try{
  const st=storage(),C=root.TechOpsCampaign,c=C.load(st);if(c.universe)return openJournal();
  // Explicit user adoption writes the loaded native profile, not a union of unrelated save files.
  U.ordered(c.story&&c.story.completedActs||[]);
  const b=freshBinding(st);c.universe={...b,revision:0,disclosures:{},sections:{}};
  session=b;game().meta=game().meta||{};game().meta.universe=U.clone(b);
  // Preserve both originals before the one-time migration. A failure is recoverable and publishes no grant.
  const oldC=st.getItem(U.KEYS.campaign),oldP=st.getItem(U.KEYS.game);
  if(oldC)st.setItem(U.KEYS.campaign+':pre-linked',oldC);if(oldP)st.setItem(U.KEYS.game+':pre-linked',oldP);
  c.universe.revision=1;C.validate(c);st.setItem(U.KEYS.campaign,JSON.stringify(c));
  if(!nativeSave())throw Error('Native profile migration could not be saved. Original bytes remain in recovery slots.');
  await publish();return openJournal();
 }catch(e){return openError(e);}
}
function migrationPrompt(){return dlg('CONNECT THIS STORY RUN','This links the <b>currently loaded main story</b> and its campaign record. Original save bytes are retained. Standalone Good Dogs/Night sessions and old See World preview completions are not imported.<br><br>Continue the intended story run before confirming.',[{t:'Link this loaded story run',f:linkLegacy},{t:'Cancel',f:close}]);}
async function showIonaDisclosure(){
 try{const {source}=await context();if(!eligibleGame()||!source.milestones.ghostFork)throw Error('Continue the main story before opening this interlude.');
  return dlg('EARLIER INTERLUDE — LOW QUARTER','<b>Player viewpoint: Iona, speaking to Mara.</b><br>After Red’s arrest; before her voice-window contact. This is a narrative cutaway, not a recording Mike possesses.<br><br><b>IONA:</b> “Red was arrested. AeroTech stamped his transfer.”<br><b>MARA:</b> “Do you know where they took him?”<br><b>IONA:</b> “No. I’ve got two names on tonight’s flight. I need you on the ground.”<br><br>The authorizer remains unknown. This scene does not transfer Iona’s private knowledge to Mike.',[
   {t:'Record this viewpoint and its place in the timeline',f:async()=>{try{const ctx=await context();if(!ctx.source.milestones.ghostFork||!eligibleGame())throw Error('Native story context changed.');const c=root.TechOpsCampaign.load(storage());c.universe.disclosures=c.universe.disclosures||{};c.universe.disclosures.iona_arrest='player-cutaway-v1';root.TechOpsCampaign.save(c,storage());await publish();openJournal();}catch(e){openError(e);}}},
   {t:'Read later — keep the chapter locked',f:openJournal}]);
 }catch(e){return openError(e);}
}
function nativeSectionAllowed(){const s=game(),r=root.TechOpsNightRuntime;return eligibleGame()&&s.nightMode&&!s.nightMode._v736&&!s.nightMode._sector04&&!s.inBattle&&!s.gameOver&&r&&r.active(s.nightMode)&&!(r.health&&r.health().transitioning);}
async function playSection(id){
 try{
  if(!nativeSectionAllowed())throw Error('Enter Night Walker from this main story run, then open CAMPAIGN → Linked Story Timeline. Standalone Night runs cannot consume linked unlocks.');
  const ctx=await context(),grant=ctx.grants.find(g=>g.id===id),def=Q.definition(id);if(!grant||!def)throw Error('This section is not earned in the active playthrough.');
  const c=root.TechOpsCampaign.load(storage()),record=c.universe.sections&&c.universe.sections[id],run=Q.replay(id,record?record.history:[]),node=def.nodes.find(n=>n.id===run.node);
  const actions=node.choices.map(option=>({t:option.label,f:()=>sectionAction(id,option.id,run.history)}));
  if(run.complete)actions.push({t:'Return to See World — result saved',f:goSeeWorld});
  actions.push({t:run.complete?'Back to the timeline':'Pause section — keep progress',f:openJournal});
  return dlg(escape(def.actor+' — '+def.title),'<small>'+escape(def.placement)+'</small><br><br>'+escape(node.text)+'<br><br><small>Optional Night Walker story section. It does not complete a main campaign act.</small>',actions);
 }catch(e){return openError(e);}
}
async function sectionAction(id,choiceId,expectedHistory){
 if(busy)return;busy=true;
 try{
  const {source}=await context();
  await root.navigator.locks.request('techops-universe-action:'+source.binding.playthroughId,{mode:'exclusive'},async()=>{
   if(!nativeSectionAllowed())throw Error('Night Walker context changed; no section progress was written.');
   const ctx=await context();if(!U.same(ctx.source.binding,source.binding))throw Error('Active native run changed.');
   const grant=ctx.grants.find(g=>g.id===id);if(!grant)throw Error('The required See World checkpoint is no longer valid.');
   const c=root.TechOpsCampaign.load(storage());if(!U.same(c.universe,source.binding))throw Error('Native playthrough mismatch.');
   c.universe.sections=c.universe.sections||{};const old=c.universe.sections[id],history=old?old.history:[];
   if(JSON.stringify(history)!==JSON.stringify(expectedHistory))throw Error('This section advanced in another tab. Reopen the saved scene.');
   const result=Q.choose(id,history,choiceId);
   if(result.feedback){dlg('CHECK THE EVIDENCE',escape(result.feedback),[{t:'Return to the observation',f:()=>playSection(id)}]);return;}
   c.universe.sections[id]={revision:Q.REVISION,binding:U.clone(ctx.source.binding),grant:{id:grant.id,campaign:grant.campaign,checkpoint:grant.checkpoint,sourceSequence:ctx.source.sequence},history:result.run.history};
   if(root.TechOpsCampaign.save(c,storage())!==true)throw Error('Native section save was rejected.');
   await publish();await playSection(id);
  });
 }catch(e){openError(e);}finally{busy=false;}
}
async function openJournal(){
 if(!eligibleGame())return dlg('LINKED STORY TIMELINE','Start or continue the main TechOps Hero story. Standalone modes and QA sessions remain separate.',[{t:'Close',f:close}]);
 try{
  const c=root.TechOpsCampaign.load(storage());if(!U.binding(c.universe))return migrationPrompt();
  const {source,record,grants}=await context(),m=source.milestones,lines=['<b>ONE PLAYTHROUGH / MULTIPLE VIEWPOINTS</b>','Native completion opens See World chapters. See World checkpoints open optional Night Walker sections. Availability is not completion.'],options=[];
  for(const id of U.CAMPAIGNS){const visible=U.gate(id,U.ENTRIES[id],source).allowed,r=record.runs[id];lines.push(visible?'<br><b>'+escape({iona:'Iona',felicia:'Felicia',k:'K',waldo:'Waldo / Oz'}[id])+'</b> — '+(r&&r.ended?'episode completed':r&&r.history.length?'in progress':'available')+'<br><small>'+escape(U.PLACEMENT[id])+'</small>':'<br>Undiscovered perspective — continue the main story.');}
  for(const grant of grants){const d=Q.definition(grant.id),done=m.completedSections.includes(grant.id);options.push({t:(done?'Review completed: ':'Enter unlocked: ')+d.title,f:()=>playSection(grant.id)});}
  if(m.ghostFork&&!m.iona)options.push({t:'Read an earlier interlude — new player viewpoint',f:showIonaDisclosure});
  options.push({t:'Open See World — save and continue there',f:goSeeWorld},{t:'Back to the game',f:close});
  if(!nativeSectionAllowed()&&grants.length)lines.push('<br><br>To play unlocked sections: enter Night Walker in this story run, then reopen this timeline.');
  return dlg('LINKED STORY TIMELINE',lines.join('<br>'),options);
 }catch(e){return openError(e);}
}
function install(){
 if(!root.document)return;
 const hud=root.document.getElementById('hud-right');if(hud&&!root.document.getElementById('btn-universe')){const b=root.document.createElement('button');b.id='btn-universe';b.className='hud-btn';b.textContent='◈';b.setAttribute('aria-label','Open linked Story Timeline');b.onclick=openJournal;hud.append(b);}
 root.addEventListener('focus',()=>{void publish();});
 root.addEventListener('storage',event=>{if([U.KEYS.campaign,U.KEYS.game].includes(event.key)){void publish();if(dialogOwner)close();}});
 void module().catch(fail);void publish();
}
root.TechOpsUniverse={VERSION:1,beforeCampaign,beforeProfile,afterSave,afterReset,publish,settled:()=>pending,openJournal,playSection,showIonaDisclosure,goSeeWorld,health:()=>({lastError,linked:U.readSource(storage()).status,session:session&&session.playthroughId})};
if(root.document){if(root.document.readyState==='loading')root.document.addEventListener('DOMContentLoaded',install,{once:true});else install();}
})(typeof globalThis!=='undefined'?globalThis:this);

}
/* END GENERATED LINKED PROGRESSION BROWSER BUNDLE */
