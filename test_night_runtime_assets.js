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

assert.ok(/function drawNightPlayerAtlas/.test(nightHooks) && /PLAYER_ATLAS/.test(nightHooks));
assert.ok(/loadNightReference/.test(world));
assert.ok(/night_walker_reference_v1\.js/.test(world));
assert.ok(/night_reference_visuals\.js/.test(world));
assert.ok(/var VERSION = 2/.test(reference));
assert.ok(/root\.drawNightPlayerAtlas = drawReferenceNightWalker/.test(reference),
  "production Night mode must override the daytime PLAYER_ATLAS consumer");
assert.ok(!/typeof\s+PLAYER_ATLAS/.test(reference) && !/\bplayerImg\b/.test(reference),
  "reference-locked Night Walker renderer must not execute against the Day Shift atlas");
assert.ok(/Math\.max\(92, \(NM\.h \|\| 34\) \* 2\.9\)/.test(reference),
  "Night Walker must render at the larger reference-readable scale");

assert.ok(/NIGHT_WALKER_REFERENCE_V1/.test(referenceAtlas));
assert.ok(/production Night Walker combat atlas v2/.test(referenceAtlas),
  "Night Walker atlas must declare current production authority");
assert.ok(/Static transparent PNG sprite sheet: 5x2 cells, 128x128 each/.test(referenceAtlas),
  "Night Walker production atlas geometry must remain explicit");
assert.ok(/src:"data:image\/png;base64,/.test(referenceAtlas),
  "Night Walker reference must ship a static image source");
assert.ok(/Runtime procedural player fallback is no longer the normal production path/.test(referenceAtlas),
  "Night Walker must not silently regress to procedural player art");
["idle0","light0","heavy0","guard0","hit0","down0"].forEach(frame =>
  assert.ok(referenceAtlas.includes(frame + ":["), `reference atlas missing ${frame}`));

assert.ok(/four-door Dodge Charger/.test(reference));
assert.ok(/four-door glasshouse/.test(reference));
assert.ok(/door seams/.test(reference));
assert.ok(/root\.nmCar = drawCharger/.test(reference));
assert.ok(/function portraitCoverCanvas/.test(reference));
assert.ok(/#v722-cine canvas/.test(reference));
assert.ok(/MutationObserver/.test(reference));
assert.ok(/overflow = "hidden"/.test(reference));
assert.ok(/vh \* aspect/.test(reference),
  "portrait cinematic must use cover sizing rather than contain-letterboxing");

assert.ok(/function nwSourceRect/.test(v737Hooks) && /pixel offsets/.test(v737Hooks));
assert.ok(fs.existsSync("night_walker_payload_p3.js"));
assert.ok(fs.existsSync("night_walker_payload_p4.js"));
assert.ok(fs.existsSync("night_walker_payload_p5.js"));
assert.ok(fs.existsSync("night_walker_payload_p7.js"));
assert.ok(!fs.existsSync("night_walker_payload_p1.js") && !fs.existsSync("night_walker_payload_p2.js"));

const ncPlayerStart = v737Hooks.indexOf("function drawNCPlayer");
const ncPlayerEnd = v737Hooks.indexOf("// ---------- satellite beam special", ncPlayerStart);
assert.ok(ncPlayerStart > -1 && ncPlayerEnd > ncPlayerStart, "Night Crawler production draw block must exist");
const ncPlayer = v737Hooks.slice(ncPlayerStart, ncPlayerEnd);
assert.ok(/TechOpsNightReferenceVisuals/.test(ncPlayer) && /drawReferenceNightWalker/.test(ncPlayer),
  "Night Crawler form must delegate to the production reference visual authority");
assert.ok(!/nwFrame\(/.test(ncPlayer),
  "retired NIGHT_WALKER payload must not be the normal Night Crawler production sprite path");

assert.ok(/function clearStaleNightSelectionForNormalStart/.test(v737Hooks),
  "normal CLOCK IN must clear a stale Night Crawler selector");
assert.ok(/__productionDesiredMode === "nightcrawler"/.test(v737Hooks) && /__v737NightStartIntent/.test(v737Hooks),
  "normal-run cleanup must preserve intentional Night Crawler launches");
assert.ok(/localStorage\.removeItem\("techops_char"\)/.test(v737Hooks),
  "normal-run cleanup must remove persisted Night Crawler selection before newState()");

console.log("Night reference visual authority + normal-run isolation: PASS");
