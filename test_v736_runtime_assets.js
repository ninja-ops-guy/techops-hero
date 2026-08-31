const assert = require("assert");
const fs = require("fs");

const v736 = fs.readFileSync("v736_hooks.js", "utf8");
const v737 = fs.readFileSync("v737_hooks.js", "utf8");
const index = fs.readFileSync("index.html", "utf8");
const atlasJs = fs.readFileSync("katrin_manchez.atlas.js", "utf8");
const manifest = JSON.parse(fs.readFileSync("assets/v736/katrin_manchez_manifest.json", "utf8"));
const scriptPaths=[...index.matchAll(/<script\b[^>]*\bsrc="([^"]+)"[^>]*><\/script>/g)].map(m=>m[1].split(/[?#]/,1)[0]);
const scriptIndex=(src)=>scriptPaths.indexOf(src);

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

const duoStart = v736.indexOf("function duoFig736");
const duoEnd = v736.indexOf("function waldoFig736", duoStart);
assert(duoStart > -1 && duoEnd > duoStart, "duoFig736 block must exist");
const duoBlock = v736.slice(duoStart, duoEnd);

assert(
  duoBlock.indexOf('atlasFrame736("KATRIN_MANCHEZ"') < duoBlock.indexOf('drawPairFig736(x, "katrin"'),
  "True duo atlas frames must still be attempted before the composed dog-action fallback"
);

assert(
  /drawPairFig736\(x,\s*"katrin"/.test(duoBlock) && /drawPairFig736\(x,\s*"manchez"/.test(duoBlock),
  "Tandem finisher fallback must compose the actual Good Dogs animation frames instead of effect-only placeholders"
);

assert(
  !/procedural starburst fallback/.test(v736),
  "Tandem finisher comments and code must not describe the active fallback as the old placeholder starburst"
);

assert(
  /function\s+drawGoodDogActive737\s*\(/.test(v737) &&
    /NM\s*&&\s*NM\._v736/.test(v737) &&
    /drawGoodDogActive737\(ctx,\s*NM/.test(v737),
  "The final render wrapper must replace the active campaign fighter with the production Good Dogs atlas"
);

assert(
  /NM\.w\s*=\s*0;\s*NM\.h\s*=\s*0;\s*NM\.block\s*=\s*false/.test(v737) &&
    /NM\.w\s*=\s*svW;\s*NM\.h\s*=\s*svH;\s*NM\.block\s*=\s*svB/.test(v737),
  "Good Dogs render bridge must suppress the generic Mike body only during drawing and restore collision dimensions"
);

for (const stateKey of ["roll", "wall_hit", "strike", "shield", "leap", "down"]) {
  assert(v737.includes(`p + "${stateKey}"`) || v737.includes(`_${stateKey}`) || v737.includes(`\"${stateKey}\"`), `active Good Dogs bridge should account for ${stateKey}`);
}

assert(
  /There is no authored walk row/.test(v737) && /idle0/.test(v737),
  "Ground movement must use clean authored motion/idle frames rather than fake attack-as-walk poses"
);

assert(
  scriptIndex("katrin_manchez.atlas.js") > -1 &&
    scriptIndex("katrin_manchez.atlas.js") < scriptIndex("v736_hooks.js") &&
    scriptIndex("v736_hooks.js") < scriptIndex("v737_hooks.js"),
  "KATRIN_MANCHEZ metadata must load before v7.36 and the final v7.37 render bridge"
);

assert(
  !scriptPaths.includes("manchez_katrin_hits_p1.js") && !scriptPaths.includes("manchez_katrin_hits_p5.js"),
  "The old partial manchez_katrin_hits chunk payload must stay unloaded from the static entrypoint"
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
  "kat_roll",
  "kat_wall_hit",
  "kat_leap",
  "kat_strike",
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
  "man_roll",
  "man_wall_hit",
  "man_leap",
  "man_strike",
]) {
  assert(atlasJs.includes(`"${key}":[`), `atlas metadata must include ${key}`);
  assert(manifest.frames[key], `manifest must include ${key}`);
  assert(fs.existsSync(manifest.frames[key].png), `source-derived frame PNG must exist for ${key}`);
}

assert(fs.existsSync("assets/v736/katrin_manchez_atlas.png"), "packed KATRIN_MANCHEZ runtime atlas PNG must exist");
assert(manifest.frame_count >= 49, "manifest must track the recovered Good Dogs frame set");

console.log("v736 runtime asset wiring checks passed");
