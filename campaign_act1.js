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
      campaign: { day: 1, act: 1, chapter: "the_queue", phase: "standup" },
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
    if (!state.history) state.history = [];
    if (!state.evidence) state.evidence = { ghostIdentityEvidence: emptyFact() };
    if (!state.evidence.ghostIdentityEvidence) state.evidence.ghostIdentityEvidence = emptyFact();
    rememberAuthoredWork(state);
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
    rememberAuthoredWork(state);
    return state.tickets[ticketId];
  }

  // Ordinary work remembers outcomes without changing story evidence or old closures.
  function officeMemory(state) {
    if (!state.officeMemory) state.officeMemory = { version: 1, records: {}, order: [], knowledge: {} };
    var memory = state.officeMemory;
    assert(memory.version === 1 && memory.records && Array.isArray(memory.order) && memory.knowledge, "Unsupported office memory");
    return memory;
  }
  function recordOfficeClosure(state, source) {
    assert(source && ["authored", "procedural"].indexOf(source.kind) >= 0, "Ordinary closure source required");
    assert(typeof source.id === "string" && source.id.length > 0 && source.id.length <= 160, "Closure id required");
    assert(Number.isInteger(source.day) && source.day >= 1, "Closure day required");
    assert(["partial", "strong"].indexOf(source.verification) >= 0, "Explicit verification required");
    assert(["restored", "degraded", "unmet", "unknown"].indexOf(source.humanOutcome) >= 0, "Explicit human outcome required");
    if (source.kind === "authored") assert(TICKET_TEMPLATES[source.id] && TICKET_TEMPLATES[source.id].ordinary, "Story evidence is not ordinary follow-up work");
    var m = officeMemory(state), id = source.kind + ":" + source.day + ":" + source.id;
    if (Object.prototype.hasOwnProperty.call(m.records, id)) return clone(m.records[id]);
    // Only archive completed follow-ups when the ledger fills; never evict active work.
    if (m.order.length >= 240) {
      var old = m.order.find(function (key) { return m.records[key].followUp.phase === "closed"; });
      if (!old) return null;
      delete m.records[old]; m.order.splice(m.order.indexOf(old), 1);
    }
    function text(v, fallback) { return typeof v === "string" ? v.slice(0, 240) : fallback; }
    var record = { id: id, sourceId: source.id, kind: source.kind, day: source.day, dueDay: source.day + 1,
      title: text(source.title, "Service follow-up"), department: text(source.department, "Unrecorded"),
      ownerId: text(source.ownerId, "unrecorded"), typeId: text(source.typeId, ""),
      humanNeed: text(source.humanNeed, "The requester must complete the original task."),
      verification: source.verification, humanOutcome: source.humanOutcome,
      repeatRisk: source.verification !== "strong" || source.humanOutcome !== "restored",
      // This is a simulation seed, not an observed recurrence. It is never displayed
      // as an incident until a player performs the next-day checks.
      pendingRepeat: source.pendingRepeat === true,
      completedAt: typeof source.completedAt === "string" ? source.completedAt : null,
      followUp: { phase: "intake", observations: {}, ruledOut: [], hypothesis: null, fixApplied: false, verified: false, published: false, events: [] }
    };
    m.records[id] = record; m.order.push(id); return clone(record);
  }
  function rememberAuthoredWork(state) {
    Object.keys(TICKET_TEMPLATES).forEach(function (id) {
      var t = state.tickets && state.tickets[id], def = TICKET_TEMPLATES[id];
      if (!def.ordinary || !t || t.status !== "resolved" || t.technicalResolution !== true) return;
      if (["partial", "strong"].indexOf(t.verification) < 0 || ["restored", "degraded", "unmet"].indexOf(t.humanOutcome) < 0) return;
      recordOfficeClosure(state, { kind: "authored", id: id, day: 1, title: id === "shipping_cannot_print" ? "Shipping Cannot Print" : "Plating Workstation Down",
        department: def.department, humanNeed: def.humanNeed, ownerId: t.ownerId || state.assignments[id],
        verification: t.verification, humanOutcome: t.humanOutcome, completedAt: t.completedAt });
    });
    return state;
  }
  function officeRecords(state, day) {
    var m = state.officeMemory; if (!m) return [];
    return m.order.map(function (key) {
      var r = m.records[key], f = r.followUp;
      // Never return the unobserved recurrence seed or an answer catalogue to the UI.
      return { id: r.id, title: r.title, day: r.day, dueDay: r.dueDay, due: day >= r.dueDay,
        department: r.department, ownerId: r.ownerId, humanNeed: r.humanNeed, verification: r.verification,
        humanOutcome: r.humanOutcome, repeatRisk: r.repeatRisk, completedAt: r.completedAt,
        followUp: clone(f) };
    });
  }
  function followUpAction(state, id, day, action, value) {
    var m = officeMemory(state), r = Object.prototype.hasOwnProperty.call(m.records, id) && m.records[id];
    assert(r, "Unknown follow-up record"); assert(Number.isInteger(day) && day >= r.dueDay, "Follow-up is not due yet");
    var f = r.followUp;
    if (f.phase === "closed") return { changed: false, message: "Follow-up already closed." };
    function event(type, message) { f.events.push({ type: type, day: day, by: "mike", at: now(), message: message }); return { changed: true, message: message }; }
    if (action === "intake") {
      if (f.phase !== "intake") return { changed: false, message: "Requester context is already recorded." };
      f.phase = "evidence"; return event("requester_context", r.humanNeed);
    }
    if (action === "observe") {
      assert(f.phase === "evidence", "Gather observations before forming a hypothesis");
      assert(["service_probe", "requester_trial"].indexOf(value) >= 0, "Unknown observation");
      if (f.observations[value]) return { changed: false, message: f.observations[value].text };
      var degraded = r.humanOutcome === "degraded" || r.humanOutcome === "unmet", pass, text;
      if (value === "service_probe") { pass = !degraded; text = pass ? "The service and device checks pass. This alone does not prove the requester's work succeeds." : "The service dependency check fails; the earlier degraded outcome is still reproducible."; }
      else { pass = !degraded && !r.pendingRepeat; text = pass ? "The requester completes the original task successfully in their own session." : "The requester cannot complete the original task. Follow-up now confirms a real service problem, not just recurrence risk."; }
      f.observations[value] = { passed: pass, text: text, day: day };
      if (Object.keys(f.observations).length === 2) f.phase = "hypothesis";
      return event("observation_" + value, text);
    }
    if (action === "hypothesis") {
      assert(f.phase === "hypothesis", "Two independent observations are required");
      assert(["service_dependency", "requester_path", "verification_only"].indexOf(value) >= 0, "Unknown hypothesis");
      var expected = !f.observations.service_probe.passed ? "service_dependency" : !f.observations.requester_trial.passed ? "requester_path" : "verification_only";
      if (value !== expected) {
        if (f.ruledOut.indexOf(value) < 0) f.ruledOut.push(value);
        return { changed: true, correct: false, message: "That does not explain both observations. Compare the service check with the requester's actual result; do not repair a healthy dependency." };
      }
      f.hypothesis = value; f.phase = expected === "verification_only" ? "verify" : "remediation";
      var result = event("hypothesis_supported", expected === "verification_only" ? "No recurrence is observed. Close the verification gap without inventing a fault." : "The observed failure has a specific scope. Remediate that scope before declaring restoration."); result.correct = true; return result;
    }
    if (action === "remediate") {
      assert(f.phase === "remediation" && f.hypothesis, "Supported remediation required");
      f.fixApplied = true; f.phase = "verify";
      return event("targeted_remediation", f.hypothesis === "requester_path" ? "Restore the requester's approved service path and refresh their session, without changing healthy shared infrastructure." : "Restore the failed service dependency using its documented recovery procedure.");
    }
    if (action === "verify") {
      assert(f.phase === "verify" && (f.fixApplied || f.hypothesis === "verification_only"), "Verification requires a supported resolution");
      f.verified = true; f.verifiedDay = day; f.phase = "prevention";
      return event("follow_up_verified", "Technical checks pass and the requester repeats the real task successfully. The new verification belongs to this follow-up, not the old closure.");
    }
    if (action === "publish" || action === "close") {
      assert(f.phase === "prevention" && f.verified, "Requester verification required before closing");
      f.published = action === "publish"; f.phase = "closed";
      if (f.published && r.typeId && /^[a-z][a-z0-9_]{0,39}$/.test(r.typeId)) m.knowledge[r.typeId] = { sourceId: id, day: day, verified: true };
      return event(f.published ? "verified_handoff_published" : "follow_up_closed", f.published ? "Publish the verified method and requester check for the next shift. Future remote and staff work can reuse this knowledge." : "Close the verified follow-up without publishing a reusable method.");
    }
    throw new Error("Unknown follow-up action");
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
  function transitionToTuesday(state) {
    assert(state.flags.sector04_completed, "Sector 04 must be understood and verified before Tuesday");
    if(state.flags.tuesday_morning_reached)return state;
    rememberAuthoredWork(state);
    state.campaign.day = 2; state.campaign.chapter = "ghost_frequency"; state.campaign.phase = "morning";
    state.flags.tuesday_morning_reached = true; state.night = initialState().night;
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

  var api = {
    VERSION: VERSION, SAVE_KEY: SAVE_KEY, TICKETS: TICKETS.slice(), TICKET_TEMPLATES: clone(TICKET_TEMPLATES), TUESDAY_MORNING_CONTRACT: clone(TUESDAY_MORNING_CONTRACT),
    createInitialState: initialState, clone: clone, migrate: migrate, syncLegacyFlags: syncLegacyFlags, validate: validate,
    getTicketTemplate: getTicketTemplate, listTicketTemplates: listTicketTemplates, getTuesdayMorningContract: getTuesdayMorningContract,
    assignTicket: assignTicket, completeStandup: completeStandup,
    checkWorkstation: checkWorkstation, hearRedInMirror: hearRedInMirror, findFeliciaBlog: findFeliciaBlog, completeFeliciaVideo: completeFeliciaVideo, unlockDayWork: unlockDayWork, completeWorkstation: completeWorkstation,
    recordGhostEvidence: recordGhostEvidence, resolveTicket: resolveTicket, enterSector04: enterSector04,
    insightAccessGuard: insightAccessGuard, suppressAccessGuard: suppressAccessGuard, severAccessController: severAccessController, transitionToTuesday: transitionToTuesday,
    recordOfficeClosure: recordOfficeClosure, rememberAuthoredWork: rememberAuthoredWork, officeRecords: officeRecords, followUpAction: followUpAction,
    save: save, load: load
  };
  if (typeof window !== "undefined" && window.addEventListener) window.dispatchEvent(new CustomEvent("techops:campaign-ready", { detail: { version: VERSION, api: api } }));
  return api;
});