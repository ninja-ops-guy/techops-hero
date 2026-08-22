/* TechOps Hero - canonical campaign asset contract.
 * This is an integration manifest, not a binary asset loader. It gives art,
 * slicing, and runtime code stable IDs for the Act I production push.
 */
(function (root, factory) {
  var api = factory(root);
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.TechOpsCampaignAssets = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  var PHASES = {
    phase_a: "Native standup and workstation",
    phase_b: "Shipping, plating, and impossible access",
    phase_c: "Sector 04 native Night Walker",
    phase_d: "Tuesday morning transition"
  };

  var SHEETS = {
    act1_transition_panels: {
      label: "Act I transition panels",
      expectedSource: "alarm clock / commute / badge / IT room / queue / office ambience storyboard sheet",
      status: "concept_sheet"
    },
    standup_board_ui: {
      label: "Standup board UI",
      expectedSource: "all tickets owned standup board concept",
      status: "concept_sheet"
    },
    shipping_environment: {
      label: "Shipping and receiving kit",
      expectedSource: "shipping clerk, dock, label printer, packages, forklift, truck, D4 dock sheet",
      status: "concept_sheet"
    },
    plating_environment: {
      label: "Plating area kit",
      expectedSource: "plating line, bath, robot arms, workstation, alarms, operator, line-stopped displays",
      status: "concept_sheet"
    },
    felicia_workstation_media: {
      label: "Felicia public video and workstation media",
      expectedSource: "Felicia violin/profile/ORPHEUS aircraft and satellite concept sheet",
      status: "concept_sheet"
    },
    sector04_clue_terminal: {
      label: "Sector 04 clue, door, note, and terminal",
      expectedSource: "purple-damaged enemy clue, locked violin door, note VFX, YOU ARE FIXING THE SYMPTOMS terminal",
      status: "concept_sheet"
    },
    sector04_identity_controller: {
      label: "Sector 04 identity controller",
      expectedSource: "controller node intact/active/damaged/severed/powered-down sheet",
      status: "concept_sheet"
    },
    access_guard_combat: {
      label: "Access Guard combat set",
      expectedSource: "armored purple Night Walker guard frames and FX",
      status: "concept_sheet"
    },
    sector04_tileset: {
      label: "Sector 04 room and tileset",
      expectedSource: "top-down Sector 04 chamber tiles, walls, doors, platforms, props",
      status: "concept_sheet"
    },
    sector04_integration_board: {
      label: "Sector 04 integration overview",
      expectedSource: "combined Sector 04 gameplay, Felicia, terminal, shipping, plating, transition board",
      status: "concept_sheet"
    }
  };

  var SLOTS = [
    { id: "ui.standup.board", phase: "phase_a", sheet: "standup_board_ui", role: "ui", required: true },
    { id: "ui.standup.ticket_card", phase: "phase_a", sheet: "standup_board_ui", role: "ui", required: true },
    { id: "ui.standup.owner_badge", phase: "phase_a", sheet: "standup_board_ui", role: "ui", required: true },
    { id: "cutscene.act1.alarm_clock", phase: "phase_d", sheet: "act1_transition_panels", role: "cutscene", required: false },
    { id: "cutscene.act1.car_exterior", phase: "phase_d", sheet: "act1_transition_panels", role: "cutscene", required: false },
    { id: "cutscene.act1.badge_green", phase: "phase_d", sheet: "act1_transition_panels", role: "cutscene", required: false },
    { id: "cutscene.act1.it_arrival", phase: "phase_d", sheet: "act1_transition_panels", role: "cutscene", required: false },
    { id: "workstation.felicia.video_frame", phase: "phase_a", sheet: "felicia_workstation_media", role: "presentation", required: true },
    { id: "workstation.orpheus.glitch_frame", phase: "phase_a", sheet: "felicia_workstation_media", role: "presentation", required: true },
    { id: "workstation.corporate_aircraft_panel", phase: "phase_a", sheet: "felicia_workstation_media", role: "presentation", required: true },
    { id: "shipping.clerk.idle", phase: "phase_b", sheet: "shipping_environment", role: "npc", required: true },
    { id: "shipping.label_printer", phase: "phase_b", sheet: "shipping_environment", role: "prop", required: true },
    { id: "shipping.printed_label_success", phase: "phase_b", sheet: "shipping_environment", role: "verification", required: true },
    { id: "shipping.dock_background", phase: "phase_b", sheet: "shipping_environment", role: "environment", required: true },
    { id: "plating.operator.idle", phase: "phase_b", sheet: "plating_environment", role: "npc", required: true },
    { id: "plating.workstation_cracked", phase: "phase_b", sheet: "plating_environment", role: "prop", required: true },
    { id: "plating.line_stopped_display", phase: "phase_b", sheet: "plating_environment", role: "verification", required: true },
    { id: "plating.line_background", phase: "phase_b", sheet: "plating_environment", role: "environment", required: true },
    { id: "sector04.tiles.floor", phase: "phase_c", sheet: "sector04_tileset", role: "environment", required: true },
    { id: "sector04.tiles.wall", phase: "phase_c", sheet: "sector04_tileset", role: "environment", required: true },
    { id: "sector04.access_guard.idle", phase: "phase_c", sheet: "access_guard_combat", role: "enemy", required: true },
    { id: "sector04.access_guard.attack", phase: "phase_c", sheet: "access_guard_combat", role: "enemy", required: true },
    { id: "sector04.access_guard.suppressed", phase: "phase_c", sheet: "access_guard_combat", role: "enemy", required: true },
    { id: "sector04.access_guard.respawn", phase: "phase_c", sheet: "access_guard_combat", role: "fx", required: true },
    { id: "sector04.purple_damage.enemy", phase: "phase_c", sheet: "sector04_clue_terminal", role: "clue", required: true },
    { id: "sector04.purple_damage.fx", phase: "phase_c", sheet: "sector04_clue_terminal", role: "fx", required: true },
    { id: "sector04.identity_controller.active", phase: "phase_c", sheet: "sector04_identity_controller", role: "prop", required: true },
    { id: "sector04.identity_controller.severed", phase: "phase_c", sheet: "sector04_identity_controller", role: "prop", required: true },
    { id: "sector04.identity_controller.spark_fx", phase: "phase_c", sheet: "sector04_identity_controller", role: "fx", required: true },
    { id: "sector04.locked_violin_door", phase: "phase_c", sheet: "sector04_clue_terminal", role: "prop", required: true },
    { id: "sector04.violin_note.fx", phase: "phase_c", sheet: "sector04_clue_terminal", role: "foreshadow", required: true },
    { id: "sector04.terminal.symptoms", phase: "phase_c", sheet: "sector04_clue_terminal", role: "terminal", required: true }
  ];

  var CANON_RULES = [
    {
      id: "felicia_public_before_violinist",
      text: "Felicia workstation/video assets may identify Felicia, but must not label her The Violinist before the rooftop reveal.",
      forbiddenSlotText: ["the_violinist", "secret_boss"]
    },
    {
      id: "damage_suppresses_understanding_defeats",
      text: "Access Guard defeat slots must distinguish suppressed frames from identity-controller severed frames.",
      requiredSlots: ["sector04.access_guard.suppressed", "sector04.identity_controller.severed"]
    },
    {
      id: "terminal_exact_text",
      text: "Sector 04 terminal art must preserve the exact line: YOU ARE FIXING THE SYMPTOMS.",
      requiredSlots: ["sector04.terminal.symptoms"]
    }
  ];

  function byId(id) {
    return SLOTS.find(function (slot) { return slot.id === id; }) || null;
  }

  function slotsForPhase(phase) {
    return SLOTS.filter(function (slot) { return slot.phase === phase; });
  }

  function requiredSlots() {
    return SLOTS.filter(function (slot) { return slot.required; });
  }

  function validate() {
    var errors = [];
    var ids = {};
    SLOTS.forEach(function (slot) {
      if (ids[slot.id]) errors.push("Duplicate asset slot: " + slot.id);
      ids[slot.id] = true;
      if (!PHASES[slot.phase]) errors.push("Unknown phase for " + slot.id + ": " + slot.phase);
      if (!SHEETS[slot.sheet]) errors.push("Unknown source sheet for " + slot.id + ": " + slot.sheet);
      CANON_RULES.forEach(function (rule) {
        (rule.forbiddenSlotText || []).forEach(function (text) {
          if (slot.id.indexOf(text) >= 0) errors.push("Canon violation in " + slot.id + ": " + rule.id);
        });
      });
    });
    CANON_RULES.forEach(function (rule) {
      (rule.requiredSlots || []).forEach(function (id) {
        if (!ids[id]) errors.push("Missing canon-required slot: " + id);
      });
    });
    return { ok: errors.length === 0, errors: errors };
  }

  return {
    PHASES: PHASES,
    SHEETS: SHEETS,
    SLOTS: SLOTS,
    CANON_RULES: CANON_RULES,
    byId: byId,
    slotsForPhase: slotsForPhase,
    requiredSlots: requiredSlots,
    validate: validate
  };
});
