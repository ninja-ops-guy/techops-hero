/* TechOps Hero - complete campaign contract.
 * Canonical authored meaning lives here. Runtime systems satisfy these beats.
 */
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.TechOpsStory = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  var VERSION = 1;
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
    { id: "act_4", title: "Trust Is Earned", requires: ["violinist_revealed"], produces: ["felicia_alliance", "morningstar_hangar_revealed"], mechanics: ["trust_investigate_report", "relationship_consequences"] },
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
    workstationHeadline: "ENGINEERING THE HUMAN CONNECTION",
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
      story.completedActs.push("prologue");
      actById("prologue").produces.forEach(function (fact) { story.facts[fact] = true; });
    }
    var tuesday = flag(flags, "tuesday_morning_reached", "tuesdayMorningReached");
    var sector = flag(flags, "sector04_completed", "sector04Completed");
    if (tuesday && sector && story.completedActs.indexOf("act_1") < 0) {
      assert(story.completedActs.indexOf("prologue") >= 0, "Tuesday state cannot import without a completed prologue");
      story.completedActs.push("act_1");
      actById("act_1").produces.forEach(function (fact) { story.facts[fact] = true; });
    }
    return story;
  }
  function hasFact(state, fact) { var story = ensureStoryState(state); return story.facts[fact] === true || (state.flags && state.flags[fact] === true); }
  function eligibleActs(state) {
    return ACTS.filter(function (act) { var story = ensureStoryState(state); return story.completedActs.indexOf(act.id) < 0 && act.requires.every(function (fact) { return hasFact(state, fact); }); }).map(function (act) { return act.id; });
  }
  function completeAct(state, actId) {
    var story = ensureStoryState(state), act = actById(actId);
    assert(act, "Unknown campaign act: " + actId);
    assert(story.completedActs.indexOf(actId) < 0, "Campaign act already completed: " + actId);
    assert(act.requires.every(function (fact) { return hasFact(state, fact); }), "Campaign act prerequisites not met: " + actId);
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
    script.src = "campaign_native_act1_visuals.js?v=20260902-gooddogs-single-authority-v5";
    script.async = false;
    window.document.head.appendChild(script);
    return true;
  }
  validateCanon();
  loadPresentationModule();
  var api = { VERSION: VERSION, ACTS: ACTS, ENDINGS: ENDINGS, DESIGN_LAWS: DESIGN_LAWS, ORPHEUS_SIGNATURES: ORPHEUS_SIGNATURES, K_MEMORY_RULE: K_MEMORY_RULE, CANON_LINES: CANON_LINES, ensureStoryState: ensureStoryState, syncAct1State: syncAct1State, eligibleActs: eligibleActs, completeAct: completeAct, chooseEnding: chooseEnding, validateCanon: validateCanon, loadPresentationModule: loadPresentationModule };
  if (typeof window !== "undefined" && window.addEventListener) window.dispatchEvent(new CustomEvent("techops:story-ready", { detail: { version: VERSION, api: api } }));
  return api;
});
