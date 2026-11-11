"use strict";
const assert = require("assert");
const fs = require("fs");
const night = fs.readFileSync("night_hooks.js", "utf8");

assert.ok(night.includes('S.meta._standaloneMode === "nightcrawler"'), "standalone Night must have its own dispatch");
assert.ok(night.includes('dlg("🌃 After Hours Dispatch"'), "Night dispatch must not reuse the Day CIO title");
assert.ok(night.includes("Take the Charger ▶"), "Night dispatch should begin with the Charger fantasy");
assert.ok(night.includes("Run Menu [C]"), "Night onboarding must expose authored field reports");
assert.ok(night.includes("Every fight is a symptom. Investigate what is driving it."), "Night onboarding must retain investigation-first meaning");

const spawnExpression = night.match(/const n = ([^;]+);/)[1];
function count(st, dist, diff) {
  const D = { danger: dist === "wooster" ? 1.45 : 1 };
  return Function("S", "st", "dist", "D", "onboardingIntern", `const n = ${spawnExpression}; return n;`)({ diff }, st, dist, D, st === 1 && dist === "downtown" && diff === .7);
}
assert.strictEqual(count(1, "downtown", .7), 2, "Intern gets two onboarding enemies");
assert.strictEqual(count(1, "downtown", 1), 3, "Standard preserves the intended opening");
assert.strictEqual(count(1, "downtown", 1.3), 3, "On-Call preserves the harder opening");
assert.strictEqual(count(1, "wooster", .7), 4, "later districts preserve their own composition");
assert.strictEqual(count(2, "downtown", .7), 4, "Intern's second street escalates normally");

assert.ok(night.includes("Move: WASD / arrows · E: punch / interact · J: kick · Space: jump · K: block · C: field reports"), "first guidance must be concise and actionable");
assert.ok(!night.includes("Double-tap ← / → to dash · Attack after dash to grab · ↑ / ↓ aim · Jump to follow launches"), "dense first-toast combo instructions must be retired");
console.log("Night onboarding and Intern pacing: PASS");
