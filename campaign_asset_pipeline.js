/* TechOps Hero - campaign asset extraction and QC pipeline contract.
 * Maps source concept sheets to transparent runtime export targets.
 */
(function (root, factory) {
  var api = factory(root);
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.TechOpsCampaignAssetPipeline = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function (root) {
  "use strict";

  function assetsApi() {
    if (!root || !root.TechOpsCampaignAssets) throw new Error("TechOpsCampaignAssets is required");
    return root.TechOpsCampaignAssets;
  }

  var SOURCE_IMAGES = {
    act1_sector04_runtime_pack_20260822: {
      filename: "784A8C9E-0374-41E5-A2A6-B241ABA4A7D7.jpeg",
      type: "source_sheet",
      qcStatus: "reference_only",
      reason: "Composite JPEG source sheet with white background; usable for slicing reference but not direct runtime rendering.",
      coveredSheets: [
        "access_guard_combat",
        "sector04_identity_controller",
        "sector04_clue_terminal",
        "felicia_workstation_media",
        "standup_board_ui",
        "shipping_environment",
        "plating_environment"
      ]
    }
  };

  var EXTRACTION_BATCHES = [
    {
      id: "sector04_runtime_transparent_pack",
      source: "act1_sector04_runtime_pack_20260822",
      priority: "p0",
      targetKind: "runtime_png",
      purpose: "Make the Sector 04 Night Walker encounter render real assets instead of runtime markers.",
      targets: [
        { slot: "sector04.access_guard.idle", perspective: "side", frames: 1 },
        { slot: "sector04.access_guard.attack", perspective: "side", frames: 1 },
        { slot: "sector04.access_guard.suppressed", perspective: "side", frames: 1 },
        { slot: "sector04.access_guard.respawn", perspective: "side", frames: 4, atlas: true },
        { slot: "sector04.purple_damage.enemy", perspective: "side", frames: 1 },
        { slot: "sector04.purple_damage.fx", perspective: "side", frames: 4, atlas: true },
        { slot: "sector04.identity_controller.active", perspective: "top", frames: 1 },
        { slot: "sector04.identity_controller.severed", perspective: "top", frames: 1 },
        { slot: "sector04.identity_controller.spark_fx", perspective: "top", frames: 4, atlas: true },
        { slot: "sector04.locked_violin_door", perspective: "side", frames: 1 },
        { slot: "sector04.violin_note.fx", perspective: "side", frames: 5, atlas: true },
        { slot: "sector04.terminal.symptoms", perspective: "screen", frames: 1, allowBakedText: true }
      ]
    },
    {
      id: "act1_day_job_transparent_pack",
      source: "act1_sector04_runtime_pack_20260822",
      priority: "p1",
      targetKind: "runtime_png",
      purpose: "Replace native Act I placeholders for Shipping, Plating, Felicia workstation, and standup UI.",
      targets: [
        { slot: "workstation.felicia.video_frame", perspective: "screen", frames: 1 },
        { slot: "workstation.orpheus.glitch_frame", perspective: "screen", frames: 1, allowBakedText: true },
        { slot: "workstation.corporate_aircraft_panel", perspective: "screen", frames: 1 },
        { slot: "ui.standup.board", perspective: "screen", frames: 1, allowBakedText: false },
        { slot: "ui.standup.ticket_card", perspective: "screen", frames: 5 },
        { slot: "ui.standup.owner_badge", perspective: "screen", frames: 4 },
        { slot: "shipping.clerk.idle", perspective: "side", frames: 1 },
        { slot: "shipping.label_printer", perspective: "side", frames: 1 },
        { slot: "shipping.printed_label_success", perspective: "screen", frames: 1 },
        { slot: "shipping.dock_background", perspective: "side", frames: 1 },
        { slot: "plating.operator.idle", perspective: "side", frames: 1 },
        { slot: "plating.workstation_cracked", perspective: "side", frames: 1 },
        { slot: "plating.line_stopped_display", perspective: "screen", frames: 1, allowBakedText: true },
        { slot: "plating.line_background", perspective: "side", frames: 1 }
      ]
    }
  ];

  function expectedFilename(target) {
    return assetsApi().slotFilename(target.slot);
  }

  function expectedAtlasFilename(target) {
    return target.slot + ".atlas.json";
  }

  function batchById(id) {
    return EXTRACTION_BATCHES.find(function (batch) { return batch.id === id; }) || null;
  }

  function allTargets() {
    return EXTRACTION_BATCHES.reduce(function (out, batch) {
      return out.concat(batch.targets.map(function (target) {
        return Object.assign({ batch: batch.id, source: batch.source, targetKind: batch.targetKind }, target);
      }));
    }, []);
  }

  function targetSpec(slotId) {
    return allTargets().find(function (target) { return target.slot === slotId; }) || null;
  }

  function qcCandidateFor(target, overrides) {
    overrides = overrides || {};
    var kind = target.atlas ? "animated_atlas" : "runtime_png";
    return Object.assign({
      kind: kind,
      filename: expectedFilename(target),
      format: "png",
      transparent: true,
      perspective: target.perspective,
      hasBakedLabels: false
    }, overrides);
  }

  function atlasStub(target) {
    var frames = Math.max(1, target.frames || 1);
    return {
      asset: target.slot,
      image: expectedFilename(target),
      frames: Array.from({ length: frames }, function (_, index) {
        return {
          id: target.slot + "." + String(index).padStart(2, "0"),
          index: index,
          anchor: target.perspective === "side" ? "feet" : "center"
        };
      })
    };
  }

  function validateBatch(id) {
    var batch = batchById(id);
    var errors = [];
    var warnings = [];
    if (!batch) return { ok: false, errors: ["Unknown extraction batch: " + id], warnings: warnings };
    if (!SOURCE_IMAGES[batch.source]) errors.push("Unknown source image: " + batch.source);
    batch.targets.forEach(function (target) {
      var slot = assetsApi().byId(target.slot);
      if (!slot) errors.push("Unknown asset slot: " + target.slot);
      var candidate = qcCandidateFor(target);
      var qc = assetsApi().validateCandidate(target.slot, candidate);
      errors = errors.concat(qc.errors);
      warnings = warnings.concat(qc.warnings);
      if (target.atlas && (!target.frames || target.frames < 2)) errors.push("Atlas target needs multiple frames: " + target.slot);
      if (target.allowBakedText && slot && ["terminal", "ui", "verification", "presentation"].indexOf(slot.role) < 0) {
        warnings.push("Baked text should be avoided for " + target.slot);
      }
    });
    return { ok: errors.length === 0, errors: errors, warnings: warnings };
  }

  function validateAll() {
    var errors = [];
    var warnings = [];
    EXTRACTION_BATCHES.forEach(function (batch) {
      var result = validateBatch(batch.id);
      errors = errors.concat(result.errors);
      warnings = warnings.concat(result.warnings);
    });
    return { ok: errors.length === 0, errors: errors, warnings: warnings };
  }

  return {
    SOURCE_IMAGES: SOURCE_IMAGES,
    EXTRACTION_BATCHES: EXTRACTION_BATCHES,
    expectedFilename: expectedFilename,
    expectedAtlasFilename: expectedAtlasFilename,
    batchById: batchById,
    allTargets: allTargets,
    targetSpec: targetSpec,
    qcCandidateFor: qcCandidateFor,
    atlasStub: atlasStub,
    validateBatch: validateBatch,
    validateAll: validateAll
  };
});
