"use strict";

const assert = require("assert");
const fs = require("fs");
const vm = require("vm");

const game = fs.readFileSync("game.js", "utf8");
const night = fs.readFileSync("night_hooks.js", "utf8");
const profileBlock = game.match(/const DIFFICULTY_PROFILES =[\s\S]*?window\.TechOpsDifficulty = Object\.freeze\([^\n]+\);/);
assert.ok(profileBlock, "difficulty profiles must have one testable authority");
const context = { Object, Number, window: {} };
vm.createContext(context);
vm.runInContext(profileBlock[0], context, { filename: "difficulty-profile-extract.js" });
const profile = context.window.TechOpsDifficulty.profile;
assert.deepStrictEqual(JSON.parse(JSON.stringify(profile(.7))), { id: "intern", value: .7, enemyHp: .7, damage: .7, bossHp: 1.8, extraTickets: 0 });
assert.deepStrictEqual(JSON.parse(JSON.stringify(profile(1))), { id: "standard", value: 1, enemyHp: 1, damage: 1, bossHp: 1.8, extraTickets: 0 });
assert.deepStrictEqual(JSON.parse(JSON.stringify(profile(1.3))), { id: "oncall", value: 1.3, enemyHp: 1, damage: 1.3, bossHp: 2, extraTickets: 1 });

assert.ok(game.includes("n += difficultyProfile(s.diff).extraTickets"), "day queue must consume the central profile");
assert.ok(game.includes("hp = Math.round(hp * difficulty.enemyHp)"), "day enemy HP must consume the central profile");
assert.ok(game.includes("difficultyProfile(s.diff).damage"), "day incoming damage must consume the central profile");
assert.ok(game.includes("const scaleDamage = amount =>"), "boss signature and ordinary incoming damage must share one scaler");
for (const scaled of ["scaleDamage(R(14, 20))", "scaleDamage(R(10, 16))", "scaleDamage(fee >= 30 ? 4 : 12)", "scaleDamage(R(12, 18))", "scaleDamage(R(9, 15))", "scaleDamage(R(5, 10)"]) {
  assert.ok(game.includes(scaled), `incoming damage path must use the difficulty scaler: ${scaled}`);
}
assert.ok(game.includes("difficulty.bossHp"), "day bosses must consume the central profile");
assert.ok(night.includes("window.TechOpsDifficulty.profile(S && S.diff)"), "Night must consume the same profile");
assert.ok(night.includes("profile.enemyHp") && night.includes("profile.damage"), "Night HP and damage must honor difficulty");

console.log("Unified Day/Night difficulty contract: PASS");
