/* TechOps Hero — canonical scene schema validation.
 * Validates authored scene manifests before runtime wiring.
 */
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.TechOpsSceneSchema = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  var VERSION = 1;
  var MAX_LINE_CHARS = 260;
  var MAX_SCENE_CHARS = 1200;
  var SPEAKERS = Object.freeze([
    "SYSTEM", "MIKE", "AMIT", "FELICIA", "SHIPPING CLERK",
    "PLATING OPERATOR", "SECURITY OPS", "ACCESS GUARD"
  ]);

  var OPENING_SCENES = Object.freeze([
    { id: "day1_standup", speaker: "SYSTEM", lines: ["Every active problem has exactly one owner before work begins."], commits: true, writes: ["ticket_assignments_confirmed", "standup_completed"], objectives: ["open_workstation"], next: "day1_workstation" },
    { id: "day1_workstation", speaker: "MIKE", lines: ["QUEUE. TEAMS. ALERTS. COMPANY. MUSIC. The shift does not begin until the workstation opening is complete."], commits: true, writes: ["workstation_checked"], objectives: ["hear_red_in_mirror", "find_felicia_profile"], branches: [{ label: "MUSIC", to: "day1_music" }, { label: "COMPANY", to: "day1_company" }] },
    { id: "day1_music", speaker: "SYSTEM", lines: ["RED IN THE MIRROR plays as ordinary music. It does not create ORPHEUS investigation evidence."], commits: true, writes: ["red_in_mirror_heard"], objectives: ["find_felicia_profile"], next: "day1_company" },
    { id: "day1_company", speaker: "SYSTEM", lines: ["ENGINEERING THE HUMAN CONNECTION. Felicia — Security Research / Systems Integrations."], commits: true, writes: ["felicia_blog_found"], objectives: ["watch_felicia_video"], next: "day1_felicia_video" },
    { id: "day1_felicia_video", speaker: "FELICIA", lines: ["Factories. Aircraft. Antennas. Racks. Drones. A telemetry graphic corrupts for less than a second: ORPHEUS."], commits: true, writes: ["felicia_video_watched"], objectives: ["clock_in"], branches: [{ label: "Finish video", to: "day1_clock_in" }, { label: "Skip video", to: "day1_clock_in" }] },
    { id: "day1_clock_in", speaker: "SYSTEM", lines: ["The opening state is coherent. The ticket clock can begin now."], commits: true, writes: ["day_work_unlocked"], objectives: ["resolve_shipping", "resolve_plating", "investigate_impossible_access"], next: "day1_shipping" },
    { id: "day1_shipping", speaker: "SHIPPING CLERK", lines: ["The queue accepts jobs, then drops customs labels before they print. Trucks are waiting."], commits: true, writes: ["shipping_cannot_print"], objectives: ["resolve_plating", "investigate_impossible_access"], next: "day1_plating" },
    { id: "day1_plating", speaker: "PLATING OPERATOR", lines: ["The workstation restarted overnight and never came back. The production line cannot move."], commits: true, writes: ["plating_workstation_down"], objectives: ["investigate_impossible_access"], next: "day1_impossible_access" },
    { id: "day1_impossible_access", speaker: "SECURITY OPS", lines: ["Badge ID M.OLIVEFIELD. SECTOR04-EAST. 02:13. Controller ACK: VALID. Mike was not there."], commits: true, writes: ["ghost_identity_evidence"], objectives: ["enter_sector04"], next: "sector04_intro" },
    { id: "sector04_intro", speaker: "SYSTEM", lines: ["Damage can suppress the Access Guard. Understanding can defeat it."], commits: true, writes: ["sector04_entered"], objectives: ["understand_access_guard", "suppress_access_guard"], next: "sector04_terminal" },
    { id: "sector04_terminal", speaker: "ACCESS GUARD", lines: ["YOU ARE FIXING THE SYMPTOMS."], commits: true, writes: ["sector04_completed"], objectives: ["reach_tuesday_morning"], next: "tuesday_morning" },
    { id: "tuesday_morning", speaker: "MIKE", lines: ["Then show me the problem."], commits: true, writes: ["tuesday_morning_reached"], objectives: [], terminal: true }
  ]);

  function validateScenes(scenes, options) {
    options = options || {};
    var knownSpeakers = options.speakers || SPEAKERS;
    var maxLineChars = options.maxLineChars || MAX_LINE_CHARS;
    var maxSceneChars = options.maxSceneChars || MAX_SCENE_CHARS;
    if (!Array.isArray(scenes) || !scenes.length) throw new Error("Scene manifest must be a non-empty array");

    var ids = Object.create(null);
    var objectiveProducers = Object.create(null);
    scenes.forEach(function (scene) {
      if (!scene || typeof scene !== "object") throw new Error("Scene entry must be an object");
      if (!scene.id || typeof scene.id !== "string") throw new Error("Scene id is required");
      if (ids[scene.id]) throw new Error("Duplicate scene id: " + scene.id);
      ids[scene.id] = true;
      if (knownSpeakers.indexOf(scene.speaker) < 0) throw new Error("Unknown speaker in " + scene.id + ": " + scene.speaker);
      if (!Array.isArray(scene.lines) || !scene.lines.length) throw new Error("Scene text is required: " + scene.id);
      var total = 0;
      scene.lines.forEach(function (line) {
        if (typeof line !== "string" || !line.trim()) throw new Error("Empty scene line: " + scene.id);
        if (line.length > maxLineChars) throw new Error("Scene line overflow in " + scene.id);
        total += line.length;
      });
      if (total > maxSceneChars) throw new Error("Scene text overflow in " + scene.id);
      if (scene.commits && (!Array.isArray(scene.writes) || !scene.writes.length)) throw new Error("Missing state writes in " + scene.id);
      if (scene.objectives && !Array.isArray(scene.objectives)) throw new Error("Objectives must be an array in " + scene.id);
      (scene.objectives || []).forEach(function (objective) {
        if (!objective || typeof objective !== "string") throw new Error("Invalid objective in " + scene.id);
        objectiveProducers[objective] = (objectiveProducers[objective] || 0) + 1;
      });
      if (!scene.terminal && !scene.next && !(scene.branches && scene.branches.length)) throw new Error("Dead-end scene: " + scene.id);
      if (scene.branches) {
        if (!Array.isArray(scene.branches)) throw new Error("Branches must be an array in " + scene.id);
        scene.branches.forEach(function (branch) {
          if (!branch || typeof branch.label !== "string" || !branch.label.trim()) throw new Error("Invalid branch label in " + scene.id);
          if (!branch.to && !branch.terminal) throw new Error("Invalid branch target in " + scene.id + ": " + branch.label);
        });
      }
    });

    scenes.forEach(function (scene) {
      if (scene.next && !ids[scene.next]) throw new Error("Unknown next scene from " + scene.id + ": " + scene.next);
      (scene.branches || []).forEach(function (branch) {
        if (branch.to && !ids[branch.to]) throw new Error("Unknown branch target from " + scene.id + ": " + branch.to);
      });
      if (scene.terminal && (scene.next || (scene.branches && scene.branches.length))) throw new Error("Terminal scene cannot branch: " + scene.id);
    });

    return { valid: true, scenes: scenes.length, objectives: Object.keys(objectiveProducers).length };
  }

  validateScenes(OPENING_SCENES);
  return { VERSION: VERSION, MAX_LINE_CHARS: MAX_LINE_CHARS, MAX_SCENE_CHARS: MAX_SCENE_CHARS, SPEAKERS: SPEAKERS, OPENING_SCENES: OPENING_SCENES, validateScenes: validateScenes };
});