const assert = require("assert");
const fs = require("fs");
const path = require("path");

const html = fs.readFileSync("index.html", "utf8");

function attrs(tag) {
  const out = {};
  for (const match of tag.matchAll(/\s([a-zA-Z0-9:-]+)="([^"]*)"/g)) out[match[1]] = match[2];
  return out;
}

function isExternal(ref) {
  return /^(https?:)?\/\//.test(ref) || ref.startsWith("data:") || ref.startsWith("#");
}
function localPath(ref) { return ref.split(/[?#]/, 1)[0]; }
function assertLocalFile(ref, owner) {
  if (ref.includes("?")) assert.ok(/^[A-Za-z0-9_./-]+\.(?:js|css)\?v=[A-Za-z0-9._-]+$/.test(ref), `${owner} uses an invalid cache-version query: ${ref}`);
  assert.ok(fs.existsSync(path.join(__dirname, localPath(ref))), `${owner} references missing local file: ${ref}`);
}

const scriptTags = [...html.matchAll(/<script\b[^>]*><\/script>/g)].map((m) => m[0]);
const localScriptRefs = [];
const localScripts = [];
for (const tag of scriptTags) {
  const src = attrs(tag).src;
  if (!src || isExternal(src)) continue;
  localScriptRefs.push(src);localScripts.push(localPath(src));assertLocalFile(src, "index.html script");
}
const duplicateScripts = localScripts.filter((src, index) => localScripts.indexOf(src) !== index);
assert.deepStrictEqual(duplicateScripts, [], "index.html must not load duplicate local scripts");
const bgNocRef=localScriptRefs.find(ref=>localPath(ref)==="bg_noc.js");
assert.ok(/^bg_noc\.js\?v=/.test(bgNocRef||""),"production bootstrap entrypoint must be cache-versioned");

const stylesheetTags = [...html.matchAll(/<link\b[^>]*>/g)].map((m) => m[0]);
for (const tag of stylesheetTags) {
  const a = attrs(tag);
  if (a.rel !== "stylesheet" || !a.href || isExternal(a.href)) continue;
  assertLocalFile(a.href, "index.html stylesheet");
}

[
  "campaign_act1.js",
  "campaign_assets.js",
  "campaign_story.js",
  "campaign_runtime.js",
  "campaign_sector04.js",
  "campaign_sector04_runtime.js",
  "campaign_native_act1.js",
  "good_boys_intro_repair.js",
  "good_dogs_cutscenes_v2_2.js",
  "good_dogs_cutscene_bridge.js"
].forEach((src) => {
  assert.strictEqual(localScripts.filter((candidate) => candidate === src).length,1,`${src} must be loaded exactly once`);
});

const order = (src) => localScripts.indexOf(src);
assert.ok(order("campaign_act1.js") < order("campaign_runtime.js"), "campaign runtime must load after campaign_act1.js");
assert.ok(order("campaign_assets.js") < order("campaign_sector04_runtime.js"), "Sector 04 runtime must load after campaign_assets.js");
assert.ok(order("campaign_sector04.js") < order("campaign_sector04_runtime.js"), "Sector 04 runtime must load after campaign_sector04.js");
assert.ok(order("campaign_sector04_runtime.js") < order("campaign_native_act1.js"), "native Act I must load after Sector 04 runtime");
assert.ok(order("good_boys_campaign_director.js") < order("good_boys_intro_repair.js"), "Good Boys intro repair must load after the legacy director so the director can observe its documented bypass hook");
assert.ok(order("good_boys_intro_repair.js") < order("good_dogs_cutscenes_v2_2.js"), "Good Boys intro repair must arm before source-master mission cutscenes begin");
assert.ok(order("good_boys_prison_cinematic_patch.js") < order("good_dogs_cutscene_bridge.js"), "Good Dogs cutscene bridge must load after the legacy prison cinematic patch so it can suppress overlapping cards");
assert.ok(order("good_boys_progression_authority.js") < order("good_dogs_cutscene_bridge.js"), "Good Dogs cutscene bridge must load after canonical Good Boys progression");
assert.ok(order("good_dogs_cutscenes_v2_2.js") < order("good_dogs_cutscene_bridge.js"), "Good Dogs cutscene player must load before the campaign bridge");

const introSource = fs.readFileSync(path.join(__dirname, "good_boys_intro_repair.js"), "utf8");
new Function(introSource);
assert.ok(introSource.includes('dataset.gbdBypass="1"'), "direct intro must bypass the legacy director start interceptor");
assert.ok(introSource.includes('GoodDogsCutscenes.play("GD_CUT_01")'), "Good Boys must open with the exact source-master GD_CUT_01 cinematic");
assert.ok(!introSource.includes('SCENES=['), "retired four-card preamble must not return");
assert.ok(introSource.includes('e.stopImmediatePropagation()'), "direct intro launch must isolate the title click from legacy delegated listeners");
assert.ok(introSource.includes('start.click()'), "direct intro must use canonical CLOCK IN state initialization after the movie");
assert.ok(introSource.includes('root.v736.start()'), "direct intro must hand off into the canonical Good Boys campaign");
assert.ok(introSource.includes('function verify(attempt)'), "direct intro must verify campaign attachment after the movie");
assert.ok(introSource.includes('attempt<2'), "direct intro attachment retry must remain bounded");

const bridgeSource = fs.readFileSync(path.join(__dirname, "good_dogs_cutscene_bridge.js"), "utf8");
new Function(bridgeSource);
[
  '1:["GD_CUT_01"]',
  '3:["GD_CUT_02","GD_CUT_03"]',
  '4:["GD_CUT_04","GD_CUT_05"]',
  '5:["GD_CUT_06"]',
  '6:["GD_CUT_07"]',
  '7:["GD_CUT_08"]'
].forEach((contract) => assert.ok(bridgeSource.includes(contract), `Good Dogs mission/cutscene contract missing: ${contract}`));
assert.ok(bridgeSource.includes('write("k_identity_status","K_pending")'), "K reveal must persist K_pending identity state");
assert.ok(bridgeSource.includes('m===4)return false'), "Cell 118 legacy mission card must remain suppressed after the canonical terminal-to-K reveal pair");

console.log("Static entrypoint integrity: PASS");
