/* TechOps Hero - campaign runtime adapter.
 * Bridges Story Bible v1.2 Campaign Director state into existing browser hooks.
 * This file adapts UI/runtime; campaign_act1.js remains the semantic authority.
 */
(function (root, factory) {
  var api = factory(root);
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.TechOpsCampaignRuntime = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function (root) {
  "use strict";

  var OWNER = { mike: "Mike Olivefield", amit: "Amit", security: "Security Ops" };
  var DAY1_ASSIGNMENTS = {
    firsthand: { shipping_cannot_print: "mike", plating_workstation_down: "amit", impossible_access_event: "mike" },
    delegated: { shipping_cannot_print: "mike", plating_workstation_down: "amit", impossible_access_event: "security" }
  };

  function hasDOM() { return !!(root && root.document && root.document.getElementById); }
  function getAct1() { if (!root || !root.TechOpsCampaign) throw new Error("TechOpsCampaign is required"); return root.TechOpsCampaign; }
  function getStory() { return root && root.TechOpsStory ? root.TechOpsStory : null; }
  function getStorage() { return root && root.localStorage ? root.localStorage : null; }
  function loadState() { return getAct1().load(getStorage()); }
  function saveState(state) { getAct1().save(state, getStorage()); return state; }
  function syncStory(state) {
    var story = getStory();
    if (!story || !story.syncAct1State) return null;
    var storyState = story.createInitialState ? story.createInitialState() : state;
    return story.syncAct1State(storyState || state, state);
  }
  function dialog(title, body, options) {
    options = options || [];
    if (root && typeof root.dlg === "function") {
      root.dlg(title, body, options.map(function (opt) { return { t: opt.text, f: opt.action }; })); return true;
    }
    return false;
  }
  function closeDialog() { if (root && typeof root.closeDlg === "function") root.closeDlg(); }
  function toast(message) { if (root && typeof root.toast === "function") root.toast(message, 3600); }
  function ownerName(id) { return OWNER[id] || id; }

  function confirmAssignments(mode) {
    var act1 = getAct1(), state = loadState(), selected = DAY1_ASSIGNMENTS[mode || "firsthand"];
    Object.keys(selected).forEach(function (ticketId) { act1.assignTicket(state, ticketId, selected[ticketId]); });
    act1.completeStandup(state); saveState(state);
    toast("Campaign queue assigned. Every problem has exactly one owner."); return state;
  }

  function runWorkstation(options) {
    options = options || {};
    var act1 = getAct1(), state = loadState();
    if (!state.flags.workstation_checked) act1.checkWorkstation(state);
    if (options.redInTheMirrorHeard !== false && !state.flags.red_in_mirror_heard) act1.hearRedInMirror(state);
    if (!state.flags.felicia_blog_found) act1.findFeliciaBlog(state);
    if (!state.flags.felicia_video_watched) act1.completeFeliciaVideo(state, { started: true, skipped: !!options.skipVideo });
    if (!state.flags.day_work_unlocked) act1.unlockDayWork(state);
    saveState(state); return state;
  }

  function recordImpossibleAccess() {
    var act1 = getAct1(), state = loadState();
    act1.recordGhostEvidence(state, { id: "badge_impossible_access", perspective: "firsthand", reliability: "high", completeness: "partial", discoveredBy: "mike", authority: "access_control" });
    saveState(state); return state;
  }
  function resolveDayTickets() {
    var act1 = getAct1(), state = loadState();
    [["shipping_cannot_print", "strong", "restored"], ["plating_workstation_down", "strong", "restored"]].forEach(function (item) {
      if (!state.tickets[item[0]]) act1.resolveTicket(state, item[0], { technicalResolution: true, verification: item[1], humanOutcome: item[2] });
    });
    saveState(state); return state;
  }
  function enterSector04() { var act1 = getAct1(), state = loadState(); act1.enterSector04(state); saveState(state); return state; }
  function insightAccessGuard() { var act1 = getAct1(), state = loadState(), result = act1.insightAccessGuard(state); saveState(state); return result; }
  function defeatAccessGuard() {
    var act1 = getAct1(), state = loadState();
    act1.suppressAccessGuard(state, 15000); act1.insightAccessGuard(state); act1.severAccessController(state); act1.transitionToTuesday(state);
    saveState(state); syncStory(state); return state;
  }
  function currentSummary() {
    var state = loadState(), f = state.flags, evidence = state.evidence.ghostIdentityEvidence;
    return {
      day: state.campaign.day, phase: state.campaign.phase,
      assignmentsConfirmed: f.ticket_assignments_confirmed,
      standupComplete: f.standup_completed,
      workstationChecked: f.workstation_checked,
      redInMirrorHeard: f.red_in_mirror_heard,
      feliciaBlogFound: f.felicia_blog_found,
      feliciaVideoWatched: f.felicia_video_watched,
      dayWorkUnlocked: f.day_work_unlocked,
      evidencePerspective: evidence.bestPerspective,
      sector04Complete: f.sector04_completed,
      tuesdayMorningReached: f.tuesday_morning_reached
    };
  }
  function assignmentBody(mode) {
    var selected = DAY1_ASSIGNMENTS[mode];
    return ["<b>Every problem belongs to someone before it can be solved.</b>", "", "Shipping cannot print -> " + ownerName(selected.shipping_cannot_print), "Plating workstation down -> " + ownerName(selected.plating_workstation_down), "Impossible Access Event -> " + ownerName(selected.impossible_access_event)].join("<br>");
  }

  /* Compatibility desk route. Native Day 1 remains the production route; this is a recovery/debug adapter. */
  function openDeskFlow() {
    var state = loadState(), f = state.flags, options = [];
    if (!f.ticket_assignments_confirmed) {
      options.push({ text: "Assign queue: Mike investigates access", action: function () { confirmAssignments("firsthand"); dialog("CAMPAIGN STANDUP", assignmentBody("firsthand"), [{ text: "Continue", action: openDeskFlow }]); } });
      options.push({ text: "Assign queue: delegate access", action: function () { confirmAssignments("delegated"); dialog("CAMPAIGN STANDUP", assignmentBody("delegated"), [{ text: "Continue", action: openDeskFlow }]); } });
    } else if (!f.day_work_unlocked) {
      options.push({ text: "Complete opening workstation sequence", action: function () {
        runWorkstation();
        dialog("ENGINEERING THE HUMAN CONNECTION", "QUEUE / TEAMS / ALERTS / COMPANY / MUSIC committed.<br><br>Red in the Mirror remains ordinary listening. The company video briefly corrupts with ORPHEUS telemetry, then normal work unlocks.", [{ text: "The clock begins", action: openDeskFlow }]);
      } });
    } else if (state.evidence.ghostIdentityEvidence.status !== "established") {
      options.push({ text: "Document Impossible Access Event", action: function () { recordImpossibleAccess(); dialog("IMPOSSIBLE ACCESS EVENT", "Badge ID: M.OLIVEFIELD<br>Door: SECTOR04-EAST<br>Timestamp: 02:13<br>Controller ACK: VALID<br><br><b>VALID IDENTITY != VERIFIED PRESENCE</b>", [{ text: "Continue", action: openDeskFlow }]); } });
      options.push({ text: "Continue without daytime access evidence", action: function () { enterSector04(); var result = insightAccessGuard(); dialog("SECTOR 04 INSIGHT", result.message, [{ text: "Back", action: openDeskFlow }]); } });
    } else if (!state.tickets.shipping_cannot_print || !state.tickets.plating_workstation_down) {
      options.push({ text: "Verify Shipping and Plating tickets", action: function () { resolveDayTickets(); dialog("DAY SHIFT VERIFIED", "Shipping prints customs labels and confirms accuracy.<br>Plating workstation returns to service and the operator verifies the line can move.", [{ text: "Continue", action: openDeskFlow }]); } });
    } else if (!f.sector04_completed) {
      options.push({ text: "Enter Sector 04", action: function () {
        enterSector04(); var result = insightAccessGuard();
        dialog("ACCESS GUARD", result.message + "<br><br>Damage suppresses the manifestation. Understanding defeats it.", [{ text: "Sever identity controller", action: function () {
          var finalState = defeatAccessGuard();
          dialog("TUESDAY MORNING", "An enemy collapses with purple damage already burned through its body.<br>A locked door. One violin note.<br><br><b>YOU ARE FIXING THE SYMPTOMS.</b><br><br>Day " + finalState.campaign.day + ": the queue is waiting.", [{ text: "Close", action: closeDialog }]);
        } }]);
      } });
    } else options.push({ text: "Review Tuesday state", action: function () { var summary = currentSummary(); dialog("CAMPAIGN STATE", JSON.stringify(summary, null, 2).replace(/\n/g, "<br>").replace(/ /g, "&nbsp;"), [{ text: "Back", action: openDeskFlow }]); } });
    options.push({ text: "Back", action: closeDialog });
    dialog("ACT I CAMPAIGN QUEUE", "Compatibility route for the canonical New Game -> Tuesday Morning contract.", options);
  }

  function installDeskButton() {
    if (!hasDOM() || root.__techopsCampaignRuntimeInstalled) return false;
    root.__techopsCampaignRuntimeInstalled = true;
    var original = typeof root.mikeDesk === "function" ? root.mikeDesk : null;
    if (!original) return false;
    root.mikeDesk = function () {
      original.apply(this, arguments);
      var nameEl = root.document.getElementById("dlg-name"), optsEl = root.document.getElementById("dlg-options");
      if (!nameEl || !optsEl || !nameEl.textContent || nameEl.textContent.indexOf("MIKE") < 0) return;
      if ([].slice.call(optsEl.children).some(function (button) { return button.textContent.indexOf("Act I Campaign") >= 0; })) return;
      var button = root.document.createElement("button"), first = optsEl.querySelector("button");
      if (first) button.className = first.className;
      button.textContent = "Act I Campaign Queue"; button.onclick = openDeskFlow; optsEl.insertBefore(button, optsEl.firstChild || null);
    };
    return true;
  }

  var api = { DAY1_ASSIGNMENTS: DAY1_ASSIGNMENTS, confirmAssignments: confirmAssignments, runWorkstation: runWorkstation, recordImpossibleAccess: recordImpossibleAccess, resolveDayTickets: resolveDayTickets, enterSector04: enterSector04, insightAccessGuard: insightAccessGuard, defeatAccessGuard: defeatAccessGuard, currentSummary: currentSummary, openDeskFlow: openDeskFlow, installDeskButton: installDeskButton };
  if (hasDOM()) { if (root.document.readyState === "loading") root.document.addEventListener("DOMContentLoaded", installDeskButton); else installDeskButton(); }
  return api;
});
