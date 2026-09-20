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
    storage.setItem(SAVE_KEY, JSON.stringify(state)); return true;
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
