const assert = require("assert");
const fs = require("fs");

const html = fs.readFileSync("index.html", "utf8");
const nightHooks = fs.readFileSync("night_hooks.js", "utf8");
const v737Hooks = fs.readFileSync("v737_hooks.js", "utf8");
const world = fs.readFileSync("campaign_world_visuals.js", "utf8");
const reference = fs.readFileSync("night_reference_visuals.js", "utf8");
const referenceAtlas = fs.readFileSync("night_walker_reference_v1.js", "utf8");

function scriptIndex(src) {
  const marker = `<script src="${src}"></script>`;
  const index = html.indexOf(marker);
  assert.notStrictEqual(index, -1, `${src} must be loaded by index.html`);
  return index;
}

const playerScript = scriptIndex("player.js");
const nightHooksScript = scriptIndex("night_hooks.js");
const glitchScript = scriptIndex("glitch.js");
const v737Script = scriptIndex("v737_hooks.js");
const worldScript = scriptIndex("campaign_world_visuals.js");
assert.ok(playerScript < nightHooksScript);
assert.ok(nightHooksScript < glitchScript);
assert.ok(glitchScript < v737Script);
assert.ok(v737Script < worldScript, "stable production visual authority must load after historical hooks");

// Historical Night code is allowed to retain its fallback, but production must
// explicitly replace that fallback with the supplied-reference visual authority.
assert.ok(/function drawNightPlayerAtlas/.test(nightHooks) && /PLAYER_ATLAS/.test(nightHooks));
assert.ok(/loadNightReference/.test(world));
assert.ok(/night_walker_reference_v1\.js/.test(world));
assert.ok(/night_reference_visuals\.js/.test(world));
assert.ok(/root\.drawNightPlayerAtlas = drawReferenceNightWalker/.test(reference),
  "production Night mode must override the daytime PLAYER_ATLAS consumer");
assert.ok(!/PLAYER_ATLAS/.test(reference),
  "reference-locked Night Walker renderer must not depend on the Day Shift atlas");

// The embedded atlas is derived from the supplied Mike/Night Walker reference,
// not the incomplete legacy night_walker payload chunks.
assert.ok(/NIGHT_WALKER_REFERENCE_V1/.test(referenceAtlas));
assert.ok(/user_reference_0425E082/.test(referenceAtlas));
["idle0","light0","heavy0","guard0","hit0","down0"].forEach(frame =>
  assert.ok(referenceAtlas.includes(frame + ":["), `reference atlas missing ${frame}`));

// Vehicle regression: the old slab/coupe must not remain production authority.
assert.ok(/four-door Dodge Charger/.test(reference));
assert.ok(/four-door glasshouse/.test(reference));
assert.ok(/door seams/.test(reference));
assert.ok(/root\.nmCar = drawCharger/.test(reference));

// Legacy restoration metadata remains available for archaeology only.
assert.ok(/function nwSourceRect/.test(v737Hooks) && /pixel offsets/.test(v737Hooks));
assert.ok(fs.existsSync("night_walker_payload_p3.js"));
assert.ok(fs.existsSync("night_walker_payload_p4.js"));
assert.ok(fs.existsSync("night_walker_payload_p5.js"));
assert.ok(fs.existsSync("night_walker_payload_p7.js"));
assert.ok(!fs.existsSync("night_walker_payload_p1.js") && !fs.existsSync("night_walker_payload_p2.js"));

console.log("Night reference visual authority: PASS");
