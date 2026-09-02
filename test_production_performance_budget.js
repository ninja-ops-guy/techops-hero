"use strict";
const assert = require("assert");
const fs = require("fs");
const path = require("path");

const html = fs.readFileSync("index.html", "utf8");
const scripts = [...html.matchAll(/<script\s+src="([^"]+)"/g)].map(m => m[1]);
const local = scripts.filter(s => !/^https?:\/\//.test(s));
const duplicates = local.filter((s, i) => local.indexOf(s) !== i);
assert.deepStrictEqual(duplicates, [], "duplicate local script tags increase startup work");

// Browser cache-version query/hash components are not part of the filesystem path.
// Keep the versioned URL in the startup contract while normalizing only for local
// existence/stat checks.
const localFiles = local.map(s => s.split(/[?#]/, 1)[0]);
const missing = local.filter((s, i) => !fs.existsSync(localFiles[i]));
assert.deepStrictEqual(missing, [], "every startup script must exist");

const indexBytes = fs.statSync("index.html").size;
const styleBytes = fs.statSync("style.css").size;
assert.ok(indexBytes < 250 * 1024, `index.html exceeds 250 KiB structural budget: ${indexBytes}`);
assert.ok(styleBytes < 160 * 1024, `style.css exceeds 160 KiB structural budget: ${styleBytes}`);
// Baseline was already 261 startup scripts. Good Dogs v2.2 adds exactly two small
// authored-cutscene modules (player + campaign bridge). Keep one slot of headroom
// but fail any unreviewed growth beyond this integration.
assert.ok(local.length <= 265, `startup script count ${local.length} exceeds reviewed Good Dogs + ship approach ceiling 265`);
for(const required of ["good_dogs_cutscenes_v2_2.js","good_boys_ship_approach.js","good_dogs_cutscene_bridge.js"]){
  assert.strictEqual(localFiles.filter(f=>f===required).length,1,`${required} must be present exactly once in startup budget`);
  assert.ok(fs.statSync(required).size < 32 * 1024,`${required} exceeds 32 KiB cutscene concern-module budget`);
}

let startupBytes = 0;
let largest = { file: "", bytes: 0 };
for (let i = 0; i < local.length; i++) {
  const url = local[i];
  const file = localFiles[i];
  const bytes = fs.statSync(file).size;
  startupBytes += bytes;
  if (bytes > largest.bytes) largest = { file: url, bytes };
  assert.ok(bytes < 3 * 1024 * 1024, `${url} exceeds 3 MiB single-script decode/parse guard`);
}
assert.ok(startupBytes < 40 * 1024 * 1024, `local startup JS exceeds 40 MiB structural ceiling: ${startupBytes}`);

// Production modules should remain small concern layers; large payloads belong in assets.
for (const file of [
  "campaign_act1.js","campaign_act2.js","campaign_native_act1.js","campaign_native_act2.js",
  "campaign_world_visuals.js","good_dogs_production_runtime.js","good_boys_reference_mechanics.js",
  "good_boys_canon_runtime.js","good_boys_gameplay_loop.js","good_dogs_cutscenes_v2_2.js","good_boys_ship_approach.js","good_dogs_cutscene_bridge.js"
]) {
  assert.ok(fs.existsSync(file), `${file} missing`);
  assert.ok(fs.statSync(file).size < 180 * 1024, `${file} exceeds 180 KiB concern-module budget`);
}

const report = {
  localStartupScripts: local.length,
  indexKiB: +(indexBytes / 1024).toFixed(1),
  styleKiB: +(styleBytes / 1024).toFixed(1),
  startupJsMiB: +(startupBytes / 1024 / 1024).toFixed(2),
  largestScript: largest.file,
  largestScriptKiB: +(largest.bytes / 1024).toFixed(1)
};
console.log("Production static performance budget: PASS", JSON.stringify(report));