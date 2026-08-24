const assert = require("assert");
const fs = require("fs");

const v736 = fs.readFileSync("v736_hooks.js", "utf8");
const index = fs.readFileSync("index.html", "utf8");
const atlasJs = fs.readFileSync("katrin_manchez.atlas.js", "utf8");
const manifest = JSON.parse(fs.readFileSync("assets/v736/katrin_manchez_manifest.json", "utf8"));

assert(
  /function\s+dogFig736\s*\(/.test(v736),
  "v7.36 pair fallback must render animated dogs if the atlas cannot decode"
);

assert(
  /const\s+frame\s*=\s*Math\.floor\(\(tm\s*\|\|\s*0\)\s*\/\s*140\)\s*%\s*7/.test(v736),
  "v7.36 pair atlas selection must advance through the seven idle frames"
);

assert(
  /"kat_idle"\s*\+\s*frame/.test(v736) && /"man_idle"\s*\+\s*frame/.test(v736),
  "Katrin and Manchez idle gameplay must use animated atlas frame keys"
);

assert(
  /pose\s*===\s*"down"\s*\?\s*"kat_down"/.test(v736) &&
    /pose\s*===\s*"down"\s*\?\s*"man_down"/.test(v736),
  "Downed gameplay sprites must use combat-down frames, not sleeping poses"
);

const drawPairStart = v736.indexOf("function drawPairFig736");
const drawPairEnd = v736.indexOf("function duoFig736", drawPairStart);
assert(drawPairStart > -1 && drawPairEnd > drawPairStart, "drawPairFig736 block must exist");
const drawPair = v736.slice(drawPairStart, drawPairEnd);

assert(
  drawPair.indexOf('atlasFrame736("KATRIN_MANCHEZ"') < drawPair.indexOf("dogFig736("),
  "KATRIN_MANCHEZ atlas must remain the first draw attempt before animated fallback"
);

assert(!/kat_sleep|man_sleep/.test(drawPair), "Good Dogs gameplay must not map downed combat bodies to sleep placeholders");

assert(
  index.includes('script src="katrin_manchez.atlas.js"') &&
    index.indexOf('script src="katrin_manchez.atlas.js"') < index.indexOf('script src="v736_hooks.js"'),
  "KATRIN_MANCHEZ atlas metadata must load before the v7.36 gameplay hook"
);

assert(
  !index.includes("manchez_katrin_hits_p1.js") && !index.includes("manchez_katrin_hits_p5.js"),
  "The old partial manchez_katrin_hits chunk payload must stay unloaded"
);

assert(
  atlasJs.includes('"src":"assets/v736/katrin_manchez_atlas.png"') &&
    !atlasJs.includes("__GK_KATRIN_MANCHEZ"),
  "KATRIN_MANCHEZ must point at the source-derived PNG atlas, not the missing chunk global"
);

for (const key of [
  "kat_idle0",
  "kat_idle1",
  "kat_idle2",
  "kat_idle3",
  "kat_idle4",
  "kat_idle5",
  "kat_idle6",
  "kat_hack",
  "kat_shield",
  "kat_pounce",
  "kat_down",
  "man_idle0",
  "man_idle1",
  "man_idle2",
  "man_idle3",
  "man_idle4",
  "man_idle5",
  "man_idle6",
  "man_hack",
  "man_shield",
  "man_pounce",
  "man_down",
]) {
  assert(atlasJs.includes(`"${key}":[`), `atlas metadata must include ${key}`);
  assert(manifest.frames[key], `manifest must include ${key}`);
  assert(fs.existsSync(manifest.frames[key].png), `source-derived frame PNG must exist for ${key}`);
}

assert(fs.existsSync("assets/v736/katrin_manchez_atlas.png"), "packed KATRIN_MANCHEZ runtime atlas PNG must exist");
assert(manifest.frame_count >= 49, "manifest must track the recovered Good Dogs frame set");

console.log("v736 runtime asset wiring checks passed");
