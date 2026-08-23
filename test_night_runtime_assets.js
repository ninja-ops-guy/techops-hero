const assert = require("assert");
const fs = require("fs");

const html = fs.readFileSync("index.html", "utf8");
const nightHooks = fs.readFileSync("night_hooks.js", "utf8");
const v737Hooks = fs.readFileSync("v737_hooks.js", "utf8");

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

assert.ok(playerScript < nightHooksScript, "Night mode can only use PLAYER_ATLAS if player.js loads first");
assert.ok(nightHooksScript < glitchScript, "Night mode must lazy-load TO_GLITCH because glitch.js loads later");
assert.ok(glitchScript < v737Script, "Night Walker hook should install after core combat art packs");

assert.ok(
  /function drawNightPlayerAtlas/.test(nightHooks) &&
    /PLAYER_ATLAS/.test(nightHooks) &&
    /playerImg/.test(nightHooks),
  "Night mode must prefer the existing player atlas before procedural fallback"
);

assert.ok(
  /function drawNightEnemyAtlas/.test(nightHooks) &&
    /TO_GLITCH/.test(nightHooks) &&
    /nmGlitchImg/.test(nightHooks),
  "Night mode must prefer the existing glitch enemy atlas before procedural fallback"
);

assert.ok(
  /if \(!drawNightEnemyAtlas\(ctx, e, ex, now\)\)/.test(nightHooks),
  "Enemy procedural silhouettes must be fallback-only when sprite assets are available"
);

assert.ok(
  /if \(!drawNightPlayerAtlas\(ctx, NM, px, py, now\)\)/.test(nightHooks),
  "Player procedural body must be fallback-only when sprite assets are available"
);

assert.ok(
  /function nwSourceRect/.test(v737Hooks) &&
    /pixel offsets/.test(v737Hooks) &&
    !/fr\\[0\\] \\* C, fr\\[1\\] \\* C/.test(v737Hooks),
  "Night Walker atlas consumer must support pixel-coordinate frames without multiplying offsets"
);

assert.ok(
  fs.existsSync("night_walker_payload_p3.js") &&
    fs.existsSync("night_walker_payload_p4.js") &&
    fs.existsSync("night_walker_payload_p5.js") &&
    fs.existsSync("night_walker_payload_p7.js"),
  "Committed Night Walker payload chunks must remain tracked for restoration"
);

assert.ok(
  !fs.existsSync("night_walker_payload_p1.js") && !fs.existsSync("night_walker_payload_p2.js"),
  "Night Walker source image is intentionally incomplete until P1/P2 are restored"
);

console.log("Night runtime asset integration: PASS");
