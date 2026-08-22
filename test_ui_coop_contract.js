const assert = require("assert");
const fs = require("fs");
const vm = require("vm");

const source = fs.readFileSync("ui_coop.js", "utf8");
const context = { window: {} };

for (let i = 1; i <= 15; i += 1) {
  context[`UIC_B64_${i}`] = `part${i}`;
}

vm.runInNewContext(source, context, { filename: "ui_coop.js" });

assert.strictEqual(typeof context.window.TO_UI_COOP, "string");
assert.ok(context.window.TO_UI_COOP.startsWith("data:image/webp;base64,part1part2"));
assert.strictEqual(context.window.UI_COOP_ATLAS.cols, 6);
assert.strictEqual(context.window.UI_COOP_ATLAS.rows, 6);
assert.strictEqual(JSON.stringify(context.window.UI_COOP_ATLAS.cell), JSON.stringify([104, 104]));
assert.strictEqual(JSON.stringify(context.window.UI_COOP_ATLAS.frames.avatar_mike), JSON.stringify([2, 5]));

console.log("UI co-op asset authority: PASS");
