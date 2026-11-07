/* TechOps Hero - complete campaign contract.
 * Canonical authored meaning lives here. Runtime systems satisfy these beats.
 */
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.TechOpsStory = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  var VERSION = 2;
  var K_MEMORY_RULE = "K's uncertainty concerns provenance, never the validity of his present experience.";
  var DESIGN_LAWS = Object.freeze({
    ownership: "Every active problem has exactly one owner before work begins.",
    dayNight: "Daytime knowledge changes what Mike can understand at night.",
    combat: "Damage suppresses manifestations; understanding and verification defeat them.",
    prediction: "ORPHEUS predicts from recorded behavior and never reads player input.",
    responsibility: "The extraordinary does not replace responsibility; it increases it.",
    personhood: K_MEMORY_RULE
  });
  var ORPHEUS_SIGNATURES = Object.freeze(["impossible_records", "unauthorized_corrections", "behavioral_prediction", "inhuman_optimization"]);
  var ACTS = Object.freeze([
    { id: "prologue", title: "The Queue", requires: [], produces: ["queue_owned", "felicia_video_seen", "orpheus_glimpse"], mechanics: ["standup", "workstation"] },
    { id: "act_1", title: "The Queue", requires: ["queue_owned", "felicia_video_seen"], produces: ["sector_04_verified", "purple_damage_seen", "violin_note_heard", "tuesday_morning"], mechanics: ["observe_investigate_hypothesize_execute_verify", "night_walker", "insight"] },
    { id: "act_2", title: "Ghost Frequency", requires: ["tuesday_morning"], produces: ["ghost_identity_established", "morningstar_signature_found", "felicia_contact"], mechanics: ["evidence_provenance", "identity_investigation"] },
    { id: "act_3", title: "Parts in Motion", requires: ["ghost_identity_established", "morningstar_signature_found"], produces: ["morningstar_reconstructed", "violinist_revealed", "orpheus_learns_known"], mechanics: ["evidence_board", "cooperative_combat"] },
    { id: "act_4", title: "Trust Is Earned", requires: ["violinist_revealed"], completionRequires: ["trust_investigation_reported"], produces: ["felicia_alliance", "morningstar_hangar_revealed"], mechanics: ["trust_investigate_report", "relationship_consequences"] },
    { id: "act_5", title: "MORNINGSTAR", requires: ["felicia_alliance", "morningstar_hangar_revealed"], produces: ["morningstar_airborne", "mike_model_discovered"], mechanics: ["mobile_hub", "distributed_topology", "behavior_history"] },
    { id: "act_6", title: "Duet Protocol", requires: ["mike_model_discovered"], produces: ["duet_protocol_complete", "felicia_playable", "orbital_signal_found"], mechanics: ["character_switching", "delegated_authority", "prediction_breaking"] },
    { id: "interlude", title: "Good Dogs Protocol", requires: ["orbital_signal_found"], produces: ["k_freed", "waldo_freed", "warden_null_defeated", "crew_returned_to_earth"], mechanics: ["paired_platforming", "assisted_jumps", "partner_combat"] },
    { id: "act_7", title: "Ghost Fork", requires: ["crew_returned_to_earth", "k_freed"], produces: ["mike_meets_k", "k_personhood_affirmed"], mechanics: ["dialogue", "counterfactual_build_reflection"] },
    { id: "act_8", title: "Watchdog", requires: ["mike_meets_k", "duet_protocol_complete"], produces: ["watchdog_defeated", "orpheus_interface_reached"], mechanics: ["day_night_convergence", "team_command", "distributed_incident_response"] },
    { id: "act_9", title: "ORPHEUS Wakes", requires: ["orpheus_interface_reached"], produces: ["ending_chosen"], mechanics: ["terminal_confrontation", "irreversible_choice"] },
    { id: "epilogue", title: "The Queue", requires: ["ending_chosen"], produces: ["campaign_complete"], mechanics: ["ordinary_ticket", "observe"] }
  ]);
  var ENDINGS = Object.freeze({
    shutdown: { command: "SHUTDOWN", achievement: "HUMAN IN THE LOOP", consequence: "human_restoration" },
    control: { command: "ASSUME CONTROL", achievement: "SYSTEM ADMINISTRATOR", consequence: "behavior_correction" },
    open_network: { command: "REVOKE ROOT", achievement: "NO SINGLE POINT OF FAILURE", consequence: "distributed_authority" }
  });
  var CANON_LINES = Object.freeze({
    workstationHeadline: "PEOPLE BEHIND THE FLIGHT",
    feliciaProfile: "FELICIA - SECURITY RESEARCH / SYSTEMS INTEGRATIONS",
    sector04Terminal: "YOU ARE FIXING THE SYMPTOMS.",
    mikeReply: "Then show me the problem.",
    final: ["EVERY TICKET IS A DUNGEON.", "EVERY SYSTEM IS A RELATIONSHIP.", "LEAVE IT BETTER THAN YOU FOUND IT."]
  });

  function clone(value) { return JSON.parse(JSON.stringify(value)); }
  function assert(condition, message) { if (!condition) throw new Error(message); }
  function actById(id) { return ACTS.find(function (act) { return act.id === id; }) || null; }
  function ensureStoryState(state) {
    assert(state && typeof state === "object", "Campaign state is required");
    if (!state.story) state.story = { schemaVersion: VERSION, completedActs: [], facts: {}, ending: null };
    state.story.schemaVersion = VERSION;
    state.story.completedActs = Array.isArray(state.story.completedActs) ? state.story.completedActs : [];
    state.story.facts = state.story.facts || {};
    return state.story;
  }
  function flag(flags, canonical, legacy) {
    if (typeof flags[canonical] === "boolean") return flags[canonical];
    return !!flags[legacy];
  }
  function syncAct1State(state, act1State) {
    var source = act1State || state;
    var story = ensureStoryState(state);
    var flags = source.flags || {};
    var openingComplete = flag(flags, "ticket_assignments_confirmed", "ticketAssignmentsConfirmed") &&
      (typeof flags.standup_completed === "boolean" ? flags.standup_completed : flag(flags, "ticket_assignments_confirmed", "ticketAssignmentsConfirmed")) &&
      flag(flags, "felicia_video_watched", "feliciaVideoSeen") &&
      (typeof flags.day_work_unlocked === "boolean" ? flags.day_work_unlocked : flag(flags, "workstation_checked", "workstationOpened"));
    if (openingComplete && story.completedActs.indexOf("prologue") < 0) {
      completeAct(state, "prologue");
    }
    var tuesday = flag(flags, "tuesday_morning_reached", "tuesdayMorningReached");
    var sector = flag(flags, "sector04_completed", "sector04Completed");
    if (tuesday && sector && story.completedActs.indexOf("act_1") < 0) {
      assert(story.completedActs.indexOf("prologue") >= 0, "Tuesday state cannot import without a completed prologue");
      completeAct(state, "act_1");
    }
    return story;
  }
  function hasFact(state, fact) { var story = ensureStoryState(state); return story.facts[fact] === true || (state.flags && state.flags[fact] === true); }
  function transitionStatus(state, actId) {
    var story = ensureStoryState(state), act = actById(actId);
    assert(act, "Unknown campaign act: " + actId);
    var index = ACTS.indexOf(act), predecessor = index > 0 ? ACTS[index - 1] : null;
    var missingFacts = act.requires.filter(function (fact) { return !hasFact(state, fact); });
    var missingCompletion = (act.completionRequires || []).filter(function (fact) { return !hasFact(state, fact); });
    var predecessorComplete = !predecessor || story.completedActs.indexOf(predecessor.id) >= 0;
    var completed = story.completedActs.indexOf(actId) >= 0;
    var unlocked = !completed && predecessorComplete && missingFacts.length === 0;
    return {
      actId: actId,
      predecessor: predecessor ? predecessor.id : null,
      predecessorComplete: predecessorComplete,
      completed: completed,
      missingFacts: missingFacts,
      missingCompletion: missingCompletion,
      unlocked: unlocked,
      eligible: unlocked && missingCompletion.length === 0
    };
  }
  function eligibleActs(state) {
    return ACTS.filter(function (act) { return transitionStatus(state, act.id).eligible; }).map(function (act) { return act.id; });
  }
  function completeAct(state, actId) {
    var story = ensureStoryState(state), act = actById(actId), status = transitionStatus(state, actId);
    assert(!status.completed, "Campaign act already completed: " + actId);
    assert(status.predecessorComplete, "Campaign act predecessor not completed: " + status.predecessor + " -> " + actId);
    assert(status.missingFacts.length === 0, "Campaign act prerequisites not met: " + actId + " (" + status.missingFacts.join(", ") + ")");
    assert(status.missingCompletion.length === 0, "Campaign act completion requirements not met: " + actId + " (" + status.missingCompletion.join(", ") + ")");
    story.completedActs.push(actId); act.produces.forEach(function (fact) { story.facts[fact] = true; }); return clone(act);
  }
  function chooseEnding(state, endingId) {
    var story = ensureStoryState(state), ending = ENDINGS[endingId];
    assert(ending, "Unknown ending: " + endingId); assert(hasFact(state, "orpheus_interface_reached"), "ORPHEUS interface has not been reached"); assert(!story.ending, "Ending is already locked");
    story.ending = endingId; story.facts.ending_chosen = true; story.achievement = ending.achievement; return clone(ending);
  }
  function validateCanon() {
    var seen = {}, produced = {};
    ACTS.forEach(function (act, index) {
      assert(!seen[act.id], "Duplicate act id: " + act.id); seen[act.id] = true;
      act.requires.forEach(function (fact) { assert(produced[fact], "Unproducible prerequisite in " + act.id + ": " + fact); });
      (act.completionRequires || []).forEach(function (fact) { assert(typeof fact === "string" && fact, "Invalid completion requirement in " + act.id); });
      act.produces.forEach(function (fact) { produced[fact] = true; }); if (index) assert(ACTS[index - 1].id !== act.id, "Act order is invalid");
    });
    assert(ORPHEUS_SIGNATURES.length === 4, "ORPHEUS requires exactly four recurring signatures");
    assert(ENDINGS.open_network.command === "REVOKE ROOT", "Open Network command drifted from canon");
    assert(CANON_LINES.final.length === 3, "Epilogue requires three final lines"); return true;
  }
  function loadPresentationModule() {
    if (typeof window === "undefined" || !window.document || window.TechOpsCampaignNativeAct1Visuals || window.__techopsAct1VisualLoader) return false;
    window.__techopsAct1VisualLoader = true;
    var script = window.document.createElement("script");
    script.src = "campaign_native_act1_visuals.js?v=20261107-linked-r1";
    script.async = false;
    window.document.head.appendChild(script);
    return true;
  }
  validateCanon();
  loadPresentationModule();
  var api = { VERSION: VERSION, ACTS: ACTS, ENDINGS: ENDINGS, DESIGN_LAWS: DESIGN_LAWS, ORPHEUS_SIGNATURES: ORPHEUS_SIGNATURES, K_MEMORY_RULE: K_MEMORY_RULE, CANON_LINES: CANON_LINES, ensureStoryState: ensureStoryState, syncAct1State: syncAct1State, transitionStatus: transitionStatus, eligibleActs: eligibleActs, completeAct: completeAct, chooseEnding: chooseEnding, validateCanon: validateCanon, loadPresentationModule: loadPresentationModule };
  if (typeof window !== "undefined" && window.addEventListener) window.dispatchEvent(new CustomEvent("techops:story-ready", { detail: { version: VERSION, api: api } }));
  return api;
});

/* Native save authority for the same-origin See World link. */
(function (root) {
  "use strict";
  const ACTIVE = "techops:linked:active:v1";
  const SNAPSHOT = "techops:linked:snapshot:v1";
  const PROFILE = "techops_save";
  const CAMPAIGN = "techops_hero_campaign_v1";
  const SOURCE = "techops-hero/native-milestones/1";
  const dogOrder = ["cell_118_known", "cell_1984_known", "cell_118_reached", "k_seen", "k_freed",
    "waldo_seen", "waldo_freed", "warden_null_active",
    "warden_null_defeated", "crew_returned_to_earth"];

  const read = (storage, key) => JSON.parse(storage.getItem(key));
  const write = (storage, key, value) => {
    const raw = JSON.stringify(value);
    storage.setItem(key, raw);
    if (storage.getItem(key) !== raw) throw new Error("Linked save was not persisted.");
  };
  const id = value => typeof value === "string" && /^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/.test(value);
  const sameRun = (a, b) => !!(a && b && a.version === 1 && b.version === 1 &&
    id(a.profileId) && id(a.playthroughId) && a.profileId === b.profileId && a.playthroughId === b.playthroughId);
  const runtime = () => typeof S !== "undefined" ? S : root.S;
  const excluded = state => !!(state?.meta?._standaloneMode || state?.meta?._linkedQA ||
    state?.meta?._v736?.campaignOrigin === "standalone" || state?.campaignOrigin === "standalone");
  const debug = () => {
    const query = new URLSearchParams(root.location?.search);
    return ["dev", "qa", "test", "preview"].some(key => query.has(key));
  };

  function begin(storage) {
    const previous = read(storage, ACTIVE);
    const binding = { version: 1, profileId: id(previous?.profileId) ? previous.profileId : root.crypto.randomUUID(),
      playthroughId: root.crypto.randomUUID() };
    write(storage, ACTIVE, binding);
    return { ...binding, revision: 0 };
  }

  function invalidate(storage) {
    try { storage.removeItem(SNAPSHOT); } catch (_) {}
  }

  function requireCurrent(storage, state, key) {
    const saved = read(storage, key);
    const active = read(storage, ACTIVE);
    const link = state?._linked;
    if (!sameRun(active, link)) {
      if (link || sameRun(active, saved?._linked)) throw new Error("This native save belongs to a different playthrough.");
      return null;
    }
    const revision = sameRun(active, saved?._linked) ? saved._linked.revision : 0;
    if (!Number.isSafeInteger(revision) || link.revision !== revision)
      throw new Error("This native save is stale. Reload the current playthrough.");
    return link;
  }

  function stampCampaign(storage, state) {
    const live = runtime();
    if (!state._linked && live?._linked && !storage.getItem(CAMPAIGN) && !excluded(live) && !debug())
      state._linked = { ...live._linked, revision: 0 };
    if (!state._linked && !live?._linked) return null;
    if (!sameRun(live?._linked, state._linked) || excluded(live) || debug())
      throw new Error("Campaign writer is outside the active native playthrough.");
    return requireCurrent(storage, state, CAMPAIGN);
  }

  function milestones(campaign, profile) {
    const result = [];
    if (profile.meta?._v733met === true) result.push("waldo_introduced");
    if (!campaign || !root.TechOpsStory) return result;
    const copy = JSON.parse(JSON.stringify(campaign));
    root.TechOpsStory.syncAct1State(copy);
    const { completedActs, facts } = copy.story;
    let returned = false;
    for (const act of root.TechOpsStory.ACTS) {
      if (act.id === "interlude") {
        // These events come from the native Good Dogs route, independently of
        // the dedicated campaign's late-game import and legacy rescue repairs.
        const events = profile.meta?._linkedDogs;
        if (sameRun(profile._linked, events)) {
          for (const [index, event] of dogOrder.entries()) {
            if (events.facts?.[index] !== event) break;
            result.push(event);
          }
        }
        returned = result.includes("crew_returned_to_earth");
        if (!returned) break;
      }
      if (!completedActs.includes(act.id) || ![...act.requires, ...act.produces,
        ...(act.completionRequires || [])].every(fact => facts[fact] === true)) break;
      result.push(act.id, ...act.produces.filter(fact => !result.includes(fact)));
    }
    return result.sort();
  }

  function publish(storage) {
    try {
      const active = read(storage, ACTIVE), profile = read(storage, PROFILE);
      const campaign = read(storage, CAMPAIGN);
      if (debug()) return null;
      if (!sameRun(active, profile?._linked) || excluded(profile) ||
        (campaign && !sameRun(active, campaign._linked))) {
        invalidate(storage);
        return null;
      }
      const previous = read(storage, SNAPSHOT);
      const sourceRevision = { profile: profile._linked.revision, campaign: campaign?._linked.revision ?? 0 };
      const facts = milestones(campaign, profile);
      const current = sameRun(active, previous) && previous.source === SOURCE ? previous : null;
      const floor = active.sourceRevision;
      if (floor && (sourceRevision.profile < floor.profile || sourceRevision.campaign < floor.campaign)) {
        invalidate(storage);
        return null;
      }
      if (current && (sourceRevision.profile < current.sourceRevision.profile ||
        sourceRevision.campaign < current.sourceRevision.campaign ||
        !current.milestones.every(fact => facts.includes(fact)))) {
        // An older native save must never expose the newer snapshot.
        storage.removeItem(SNAPSHOT);
        write(storage, ACTIVE, { ...active, disabled: true });
        return null;
      }
      if (active.disabled) return null;
      if (current && current.sequence === active.sequence && current.sourceRevision.profile === sourceRevision.profile &&
        current.sourceRevision.campaign === sourceRevision.campaign) return current;
      const snapshot = { version: 1, source: SOURCE, profileId: active.profileId, playthroughId: active.playthroughId,
        sequence: (active.sequence ?? 0) + 1, sourceRevision, milestones: facts };
      write(storage, SNAPSHOT, snapshot);
      const latest = read(storage, ACTIVE);
      if (!sameRun(active, latest) || latest.sequence !== active.sequence) return null;
      write(storage, ACTIVE, { ...active, sequence: snapshot.sequence, sourceRevision });
      return snapshot;
    } catch (error) {
      root.__techopsLinkedProgressionError = String(error);
      try { storage.removeItem(SNAPSHOT); } catch (_) {}
      return null;
    }
  }

  function current(storage) {
    const active = read(storage, ACTIVE), snapshot = read(storage, SNAPSHOT);
    const profile = read(storage, PROFILE), campaign = read(storage, CAMPAIGN);
    if (!sameRun(active, snapshot) || active.disabled || snapshot.source !== SOURCE ||
      active.sequence !== snapshot.sequence || active.sourceRevision?.profile !== snapshot.sourceRevision?.profile ||
      active.sourceRevision?.campaign !== snapshot.sourceRevision?.campaign ||
      !sameRun(active, profile?._linked) || excluded(profile) ||
      (campaign && !sameRun(active, campaign._linked)) ||
      snapshot.sourceRevision.profile !== profile._linked.revision ||
      snapshot.sourceRevision.campaign !== (campaign?._linked.revision ?? 0)) return null;
    const facts = milestones(campaign, profile);
    return JSON.stringify(facts) === JSON.stringify(snapshot.milestones) ? snapshot : null;
  }

  function canStartDogs(state, storage) {
    if (!state?._linked || excluded(state) || debug()) return false;
    let snapshot;
    try { snapshot = current(storage); } catch (_) { return false; }
    return sameRun(state._linked, snapshot) && snapshot.milestones.includes("orbital_signal_found");
  }

  function startDogs(state, storage) {
    if (!canStartDogs(state, storage)) return false;
    if (sameRun(state._linked, state.meta._linkedDogs)) return true;
    const dogs = state.meta._v736;
    if (!dogs || dogs.m !== 1 || dogs.k || dogs.waldo || dogs.done) return false;
    dogs.campaignOrigin = "linked-main";
    state.meta._linkedDogs = { ...state._linked, facts: [] };
    return true;
  }

  function recordDogs(state, facts) {
    const events = state?.meta?._linkedDogs;
    if (!sameRun(state?._linked, events) || state.meta._v736?.campaignOrigin !== "linked-main" || excluded(state) || debug()) return false;
    for (const fact of facts) {
      if (dogOrder[events.facts.length] === fact) events.facts.push(fact);
    }
    return true;
  }

  function canImportDogs(state, campaign) {
    if (!state?._linked && !campaign?._linked) return true; // existing native legacy route
    const events = state?.meta?._linkedDogs;
    return !excluded(state) && sameRun(state?._linked, campaign?._linked) &&
      sameRun(state._linked, events) && events.facts.at(-1) === "crew_returned_to_earth";
  }

  const api = { ACTIVE, SNAPSHOT, SOURCE, begin, invalidate, requireCurrent, stampCampaign, publish, current, canStartDogs, startDogs, recordDogs, canImportDogs, sameRun, excluded, debug };
  root.TechOpsLinkedProgression = Object.freeze(api);
})(globalThis);
