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

function assertLocalFile(ref, owner) {
  assert.ok(!ref.includes("?"), `${owner} must not use cache-busting query strings for local static files: ${ref}`);
  assert.ok(fs.existsSync(path.join(__dirname, ref)), `${owner} references missing local file: ${ref}`);
}

const scriptTags = [...html.matchAll(/<script\b[^>]*><\/script>/g)].map((m) => m[0]);
const localScripts = [];

for (const tag of scriptTags) {
  const src = attrs(tag).src;
  if (!src || isExternal(src)) continue;
  localScripts.push(src);
  assertLocalFile(src, "index.html script");
}

const duplicateScripts = localScripts.filter((src, index) => localScripts.indexOf(src) !== index);
assert.deepStrictEqual(duplicateScripts, [], "index.html must not load duplicate local scripts");

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
  "campaign_native_act1.js"
].forEach((src) => {
  assert.strictEqual(
    localScripts.filter((candidate) => candidate === src).length,
    1,
    `${src} must be loaded exactly once`
  );
});

const order = (src) => localScripts.indexOf(src);
assert.ok(order("campaign_act1.js") < order("campaign_runtime.js"), "campaign runtime must load after campaign_act1.js");
assert.ok(order("campaign_assets.js") < order("campaign_sector04_runtime.js"), "Sector 04 runtime must load after campaign_assets.js");
assert.ok(order("campaign_sector04.js") < order("campaign_sector04_runtime.js"), "Sector 04 runtime must load after campaign_sector04.js");
assert.ok(order("campaign_sector04_runtime.js") < order("campaign_native_act1.js"), "native Act I must load after Sector 04 runtime");

console.log("Static entrypoint integrity: PASS");
