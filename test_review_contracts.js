"use strict";

const assert = require("assert");
const fs = require("fs");
const vm = require("vm");
const { spawnSync } = require("child_process");

const read = file => fs.readFileSync(file, "utf8");
const inventory = JSON.parse(read("review_contracts.json"));
const contracts = new Map(inventory.contracts.map(item => [item.id, item]));
const refs = new Set(inventory.contracts.map(item => item.test_ref).concat(inventory.deletion_ledger.map(item => item.resurrection_check)));

assert.strictEqual(inventory.schema_version, 1);
assert.strictEqual(contracts.size, inventory.contracts.length, "contract IDs must be unique");
for (const item of inventory.contracts) {
  for (const field of ["id", "failure_mode", "invariant", "test_ref", "spot_check"]) assert.ok(item[field], item.id + " must define " + field);
  const file = item.test_ref.split("#")[0];
  assert.ok(fs.existsSync(file), item.id + " test_ref must name an existing test file");
}
for (const item of inventory.deletion_ledger) {
  assert.ok(item.id && item.removed && item.reason && item.resurrection_check, "deletion ledger entries must be complete");
  assert.ok(fs.existsSync(item.resurrection_check.split("#")[0]), item.id + " resurrection check must exist");
}

const guide = spawnSync(process.execPath, ["scripts/generate_review_guide.js", "--check"], { encoding: "utf8" });
assert.strictEqual(guide.status, 0, guide.stdout + guide.stderr);

const source = read("good_dogs_cutscenes_v2_2.js");
const context = { window: null, globalThis: null, console };
context.window = context;
context.globalThis = context;
vm.runInNewContext(source, context, { filename: "good_dogs_cutscenes_v2_2.js" });
const cutscenes = context.GoodDogsCutscenes;

assert.ok(refs.has("test_review_contracts.js#GD_CODEC_CAPABILITY"));
const unsupported = cutscenes.mediaCapability({ canPlayType: () => "" });
assert.strictEqual(unsupported.supported, false, "GD_CODEC_CAPABILITY: two negative probes must fail closed");
context.MediaSource = { isTypeSupported: () => true };
assert.strictEqual(cutscenes.mediaCapability({ canPlayType: () => "" }).supported, true, "GD_CODEC_CAPABILITY: MediaSource support is sufficient");
context.MediaSource = { isTypeSupported: () => false };
assert.strictEqual(cutscenes.mediaCapability({ canPlayType: () => "probably" }).supported, true, "GD_CODEC_CAPABILITY: element support is sufficient");
assert.ok(!/userAgent[\s\S]{0,120}mediaCapability|mediaCapability[\s\S]{0,120}userAgent/.test(source), "GD_CODEC_CAPABILITY: codec gating may not depend on a UA string");

assert.ok(refs.has("test_review_contracts.js#GD_NO_INVISIBLE_ADVANCE"));
assert.ok(source.includes('if(!capability.supported){waitForUser("codec-unsupported");return;}'), "GD_NO_INVISIBLE_ADVANCE: unsupported codecs must stop before source load");
assert.ok(source.indexOf('if(!capability.supported){waitForUser("codec-unsupported");return;}') < source.lastIndexOf('video.src=options.src||def.src'), "GD_NO_INVISIBLE_ADVANCE: capability gate must precede initial media source assignment");
assert.deepStrictEqual(Object.keys(cutscenes.STATUS).sort(), ["COMPLETED", "USER_SKIPPED"], "GD_NO_INVISIBLE_ADVANCE: only two terminal statuses are legal");

assert.ok(refs.has("test_review_contracts.js#GD_SKIP_IDEMPOTENT"));
const gate = cutscenes.createSettlementGate();
assert.strictEqual(gate.claim(), true, "GD_SKIP_IDEMPOTENT: first terminal event settles");
assert.strictEqual(gate.claim(), false, "GD_SKIP_IDEMPOTENT: double skip is a no-op");
assert.strictEqual(gate.claim(), false, "GD_SKIP_IDEMPOTENT: a late ended event is a no-op");
assert.strictEqual(gate.settled(), true);
assert.ok(source.includes("!settlement.claim()"), "GD_SKIP_IDEMPOTENT: production finish path must use the settlement gate");

assert.ok(refs.has("test_review_contracts.js#RETIRED_LEGACY_EARTHFALL_REPLAY"));
const title = read("good_boys_button_hard_fix.js");
assert.ok(title.includes("suppressDoneReplay:true"), "RETIRED_LEGACY_EARTHFALL_REPLAY: completed resume must suppress b736m8");
assert.ok(title.includes("TechOpsGoodBoysEarthfallEnding"), "RETIRED_LEGACY_EARTHFALL_REPLAY: authored Earthfall must own replay");

assert.ok(refs.has("test_review_contracts.js#RETIRED_DUPLICATE_MODE_OWNERSHIP"));
const bootstrap = read("production_bootstrap.js");
assert.strictEqual((bootstrap.match(/"runtime_mode_shell\.js"/g) || []).length, 1, "RETIRED_DUPLICATE_MODE_OWNERSHIP: bootstrap must install one shell");
const shell = read("runtime_mode_shell.js");
assert.ok(shell.includes("if(!root||root.TechOpsModeShell)return;"), "RETIRED_DUPLICATE_MODE_OWNERSHIP: repeated installs must fail closed");

console.log("Review inventory, codec boundary, idempotent skip and resurrection contracts: PASS");
