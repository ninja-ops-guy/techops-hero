const assert = require("assert");

global.TechOpsCampaignAssets = require("./campaign_assets.js");
const Pipeline = require("./campaign_asset_pipeline.js");

const validation = Pipeline.validateAll();
assert.strictEqual(validation.ok, true);
assert.deepStrictEqual(validation.errors, []);

const sectorBatch = Pipeline.batchById("sector04_runtime_transparent_pack");
assert.strictEqual(sectorBatch.priority, "p0");
assert.strictEqual(sectorBatch.source, "act1_sector04_runtime_pack_20260822");
assert.ok(sectorBatch.targets.some(target => target.slot === "sector04.access_guard.idle"));
assert.ok(sectorBatch.targets.some(target => target.slot === "sector04.identity_controller.severed"));
assert.ok(sectorBatch.targets.some(target => target.slot === "sector04.terminal.symptoms" && target.allowBakedText));

const dayBatch = Pipeline.batchById("act1_day_job_transparent_pack");
assert.strictEqual(dayBatch.priority, "p1");
assert.ok(dayBatch.targets.some(target => target.slot === "shipping.clerk.idle"));
assert.ok(dayBatch.targets.some(target => target.slot === "plating.workstation_cracked"));
assert.ok(dayBatch.targets.some(target => target.slot === "workstation.orpheus.glitch_frame"));

const target = Pipeline.targetSpec("sector04.access_guard.respawn");
assert.strictEqual(target.atlas, true);
assert.strictEqual(Pipeline.expectedFilename(target), "sector04.access_guard.respawn.png");
assert.strictEqual(Pipeline.expectedAtlasFilename(target), "sector04.access_guard.respawn.atlas.json");

const atlas = Pipeline.atlasStub(target);
assert.strictEqual(atlas.asset, "sector04.access_guard.respawn");
assert.strictEqual(atlas.frames.length, 4);
assert.strictEqual(atlas.frames[0].anchor, "feet");

let candidate = Pipeline.qcCandidateFor(Pipeline.targetSpec("sector04.terminal.symptoms"), {
  exactText: "YOU ARE FIXING THE SYMPTOMS.",
  hasBakedLabels: true
});
let qc = global.TechOpsCampaignAssets.validateCandidate("sector04.terminal.symptoms", candidate);
assert.strictEqual(qc.ok, true);

candidate = Pipeline.qcCandidateFor(Pipeline.targetSpec("sector04.terminal.symptoms"), {
  exactText: "YOU ARE FIXING ALL SYMPTOMS.",
  hasBakedLabels: true
});
qc = global.TechOpsCampaignAssets.validateCandidate("sector04.terminal.symptoms", candidate);
assert.strictEqual(qc.ok, false);
assert.ok(qc.errors.some(error => error.includes("exact canon text")));

assert.strictEqual(
  Pipeline.SOURCE_IMAGES.act1_sector04_runtime_pack_20260822.qcStatus,
  "reference_only"
);

console.log("Campaign asset pipeline: PASS");
