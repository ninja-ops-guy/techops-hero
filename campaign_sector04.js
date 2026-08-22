/* TechOps Hero - Sector 04 native encounter sandbox.
 * Contract layer for Access Guard, inspectables, suppression/respawn,
 * identity-controller resolution, terminal beat, and Tuesday transition.
 */
(function (root, factory) {
  var api = factory(root);
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.TechOpsSector04 = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function (root) {
  "use strict";

  var SUPPRESSION_MS = 15000;
  var INSPECTABLES = {
    purple_damage: {
      id: "purple_damage",
      label: "Purple-damaged enemy",
      text: "An enemy collapses with purple damage already burned through its body. Mike did not cause it."
    },
    locked_violin_door: {
      id: "locked_violin_door",
      label: "Locked door",
      text: "A locked door stands beyond the arena. From behind it: one violin note. Then silence."
    },
    symptoms_terminal: {
      id: "symptoms_terminal",
      label: "Sector 04 terminal",
      text: "YOU ARE FIXING THE SYMPTOMS."
    },
    identity_controller: {
      id: "identity_controller",
      label: "Identity controller",
      text: "The controller asserts valid identity without verified presence."
    }
  };

  function act1() {
    if (!root || !root.TechOpsCampaign) throw new Error("TechOpsCampaign is required");
    return root.TechOpsCampaign;
  }

  function nowMs() {
    return Date.now();
  }

  function event(state, type, data) {
    state.history = state.history || [];
    var out = { type: type, at: new Date().toISOString() };
    Object.keys(data || {}).forEach(function (key) { out[key] = data[key]; });
    state.history.push(out);
    return out;
  }

  function ensure(state) {
    state.night = state.night || {};
    state.night.accessGuard = state.night.accessGuard || {};
    if (!state.night.sector04) {
      state.night.sector04 = {
        active: false,
        arena: "sector_04_access_guard",
        accessGuardSpawned: false,
        purpleDamageInspected: false,
        violinNoteHeard: false,
        terminalViewed: false,
        controllerRevealed: false,
        controllerSevered: false,
        respawnAt: null,
        respawnCount: 0,
        resolved: false
      };
    }
    return state.night.sector04;
  }

  function enter(state) {
    var sector = ensure(state);
    if (sector.resolved || state.flags && state.flags.sector04Completed) {
      sector.active = false;
      sector.accessGuardSpawned = false;
      return sector;
    }
    act1().enterSector04(state);
    sector.active = true;
    sector.accessGuardSpawned = true;
    event(state, "sector04_native_entered", { arena: sector.arena });
    return sector;
  }

  function inspect(state, inspectableId) {
    var sector = ensure(state);
    if (!INSPECTABLES[inspectableId]) throw new Error("Unknown Sector 04 inspectable: " + inspectableId);
    if (inspectableId === "purple_damage") sector.purpleDamageInspected = true;
    if (inspectableId === "locked_violin_door") sector.violinNoteHeard = true;
    if (inspectableId === "symptoms_terminal") sector.terminalViewed = true;
    if (inspectableId === "identity_controller") sector.controllerRevealed = true;
    event(state, "sector04_inspected", { inspectableId: inspectableId });
    return {
      id: inspectableId,
      label: INSPECTABLES[inspectableId].label,
      text: INSPECTABLES[inspectableId].text
    };
  }

  function insight(state) {
    var result = act1().insightAccessGuard(state);
    var sector = ensure(state);
    if (result.success) {
      sector.controllerRevealed = true;
      inspect(state, "identity_controller");
    }
    return result;
  }

  function suppress(state, atMs) {
    var sector = ensure(state);
    act1().suppressAccessGuard(state, SUPPRESSION_MS);
    sector.accessGuardSpawned = false;
    sector.respawnAt = (atMs || nowMs()) + SUPPRESSION_MS;
    event(state, "sector04_access_guard_suppressed", { respawnAt: sector.respawnAt });
    return {
      suppressed: true,
      respawnAt: sector.respawnAt,
      permanent: false
    };
  }

  function tick(state, atMs) {
    var sector = ensure(state);
    var guard = state.night.accessGuard;
    if (!sector.active || sector.resolved || guard.permanentlyDefeated) return sector;
    if (guard.suppressed && sector.respawnAt && (atMs || nowMs()) >= sector.respawnAt) {
      guard.health = 100;
      guard.suppressed = false;
      guard.suppressionEndsAt = null;
      sector.accessGuardSpawned = true;
      sector.respawnAt = null;
      sector.respawnCount += 1;
      event(state, "sector04_access_guard_respawned", { respawnCount: sector.respawnCount });
    }
    return sector;
  }

  function severController(state) {
    var sector = ensure(state);
    if (!sector.controllerRevealed) insight(state);
    act1().severAccessController(state);
    sector.controllerSevered = true;
    sector.resolved = true;
    sector.active = false;
    sector.accessGuardSpawned = false;
    event(state, "sector04_identity_controller_severed", { permanent: true });
    return sector;
  }

  function terminal(state) {
    var sector = ensure(state);
    var inspected = inspect(state, "symptoms_terminal");
    return {
      id: inspected.id,
      message: inspected.text,
      mikeResponse: "Then show me the problem.",
      canTransition: !!sector.controllerSevered
    };
  }

  function complete(state) {
    var sector = ensure(state);
    if (!sector.controllerSevered) severController(state);
    if (!sector.terminalViewed) terminal(state);
    act1().transitionToTuesday(state);
    sector.active = false;
    sector.accessGuardSpawned = false;
    sector.resolved = true;
    return state;
  }

  function snapshot(state) {
    var sector = ensure(state);
    return {
      active: sector.active,
      spawned: sector.accessGuardSpawned,
      purpleDamageInspected: sector.purpleDamageInspected,
      violinNoteHeard: sector.violinNoteHeard,
      terminalViewed: sector.terminalViewed,
      controllerRevealed: sector.controllerRevealed,
      controllerSevered: sector.controllerSevered,
      respawnCount: sector.respawnCount,
      resolved: sector.resolved,
      guardSuppressed: !!state.night.accessGuard.suppressed,
      permanentlyDefeated: !!state.night.accessGuard.permanentlyDefeated
    };
  }

  return {
    SUPPRESSION_MS: SUPPRESSION_MS,
    INSPECTABLES: INSPECTABLES,
    ensure: ensure,
    enter: enter,
    inspect: inspect,
    insight: insight,
    suppress: suppress,
    tick: tick,
    severController: severController,
    terminal: terminal,
    complete: complete,
    snapshot: snapshot
  };
});
