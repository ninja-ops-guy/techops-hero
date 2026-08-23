const assert = require("assert");
const fs = require("fs");

const v736 = fs.readFileSync("v736_hooks.js", "utf8");
const index = fs.readFileSync("index.html", "utf8");

assert(
  /function\s+dogFig736\s*\(/.test(v736),
  "v7.36 pair fallback must render the Good Dogs as animated dogs, not static humanoid placeholders"
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

assert(
  !/kat_sleep|man_sleep/.test(drawPair),
  "Good Dogs gameplay must not map downed combat bodies to sleep placeholders"
);

assert(
  /Math\.sin\(t\s*\/\s*90\)/.test(v736) && /quadraticCurveTo\(dx - 42 \* u \+ lean/.test(v736),
  "Animated dog fallback must preserve the wagging-tail motion from the previous Good Dogs placeholder"
);

assert(
  fs.existsSync("manchez_katrin_hits_p1.js") &&
    fs.existsSync("manchez_katrin_hits_p2.js") &&
    fs.existsSync("manchez_katrin_hits_p3.js") &&
    fs.existsSync("manchez_katrin_hits_p4.js"),
  "Committed Manchez/Katrin payload chunks must remain tracked for restoration"
);

assert(
  !fs.existsSync("manchez_katrin_hits_p5.js") &&
    !index.includes("manchez_katrin_hits_p1.js") &&
    !index.includes("katrin_manchez.atlas.js"),
  "Partial Manchez/Katrin payload must stay unwired until the remaining chunks restore a usable src"
);

console.log("v736 runtime asset wiring checks passed");
