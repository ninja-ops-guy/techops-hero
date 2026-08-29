"use strict";
const assert = require("assert");
const fs = require("fs");

const index = fs.readFileSync("index.html", "utf8");
const kAction = fs.readFileSync("k_action.atlas.js", "utf8");
const kStudio = fs.readFileSync("k_studio.atlas.js", "utf8");
const v742 = fs.readFileSync("v742_hooks.js", "utf8");
const guard = fs.readFileSync("good_boys_cinematic_ui_guard.js", "utf8");

function has(s) {
  assert.ok(index.includes(s), "index should load " + s);
}
function before(a, b) {
  assert.ok(index.indexOf(a) >= 0, "missing " + a);
  assert.ok(index.indexOf(b) >= 0, "missing " + b);
  assert.ok(index.indexOf(a) < index.indexOf(b), a + " must load before " + b);
}

has("k_action.atlas.js?v=20260829-goodboys-art-ui-v2");
has("v742_hooks.js?v=20260829-goodboys-art-ui-v2");
has("good_boys_prison_cinematic_patch.js?v=20260829-goodboys-art-ui-v2");
has("good_boys_earthfall_ending.js?v=20260829-goodboys-art-ui-v2");
has("good_boys_cinematic_ui_guard.js?v=20260829-goodboys-art-ui-v2");
before("k_action.atlas.js", "v736_hooks.js");
before("k_studio.atlas.js", "v736_hooks.js");
before("v736_hooks.js", "v742_hooks.js");
before("v742_hooks.js", "good_boys_prison_cinematic_patch.js");
before("good_boys_earthfall_ending.js", "good_boys_progression_authority.js");

assert.ok(kAction.includes("assets/v736/k_action_atlas.png"));
assert.ok(kStudio.includes("assets/v736/k_studio_atlas.png"));
assert.ok(v742.includes("b736m4"));
assert.ok(v742.includes("b736m8"));
assert.ok(v742.includes("GOOD_BOYS_CUTSCENE_PLATES"));
assert.ok(guard.includes("good-boys-ui-blocked"));
assert.ok(guard.includes("root.__goodBoysHideHud=on"));

console.log("Good Boys Pages visual contract: PASS");
