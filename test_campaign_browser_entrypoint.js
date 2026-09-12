const assert = require("assert");
const fs = require("fs");

const html = fs.readFileSync("index.html", "utf8");

function scriptIndex(src) {
  const urls = [...html.matchAll(/<script src="([^"]+)"><\/script>/g)];
  const match = urls.find(m => m[1].split("?")[0] === src);
  const index = match ? match.index : -1;
  assert.notStrictEqual(index, -1, `${src} must be loaded by index.html`);
  return index;
}

function requiredElement(id) {
  assert.ok(html.includes(`id="${id}"`), `index.html must include #${id}`);
}

assert.ok(
  html.includes('name="viewport"') &&
    html.includes("maximum-scale=1.0") &&
    html.includes("viewport-fit=cover"),
  "index.html must keep the mobile viewport contract"
);

requiredElement("game");
requiredElement("touch-ui");
requiredElement("dpad");
requiredElement("tb-interact");
requiredElement("tb-menu");
requiredElement("dialogue");

const lastHistoricalHook = scriptIndex("v737_hooks.js");
const campaignAct1 = scriptIndex("campaign_act1.js?v=20260912-gameplay-feedback-r1");
const campaignAssets = scriptIndex("campaign_assets.js");
const campaignRuntime = scriptIndex("campaign_runtime.js");
const sector04 = scriptIndex("campaign_sector04.js");
const sector04Runtime = scriptIndex("campaign_sector04_runtime.js");
const nativeAct1 = scriptIndex("campaign_native_act1.js?v=20260912-gameplay-feedback-r1");

assert.ok(lastHistoricalHook < campaignAct1, "canonical campaign authority must load after the historical version-hook stack");
assert.ok(campaignAct1 < campaignRuntime, "campaign runtime must load after campaign state contract");
assert.ok(campaignAssets < sector04Runtime, "Sector 04 runtime must load after campaign asset authority");
assert.ok(sector04 < sector04Runtime, "Sector 04 runtime must load after Sector 04 contract");
assert.ok(sector04Runtime < nativeAct1, "native Act I must see the Sector 04 browser runtime at install time");
assert.strictEqual(html.indexOf("_hooks.js", nativeAct1), -1, "no historical version hook may load after canonical native Act I authority");

const sectorRuntimeSource = fs.readFileSync("campaign_sector04_runtime.js", "utf8");
assert.ok(
  sectorRuntimeSource.includes("Return to daytime investigation"),
  "browser runtime must expose a player-visible recovery option"
);
assert.ok(
  sectorRuntimeSource.includes("retreatToDayInvestigation"),
  "browser runtime must wire the recovery action, not just the message"
);

console.log("Campaign browser entrypoint: PASS");
