"use strict";
const assert=require("assert");
const fs=require("fs");
const source=fs.readFileSync("good_boys_ship_approach.js","utf8");
new Function(source);
assert.ok(source.includes("GOOD_BOYS_SHIP_ARCADE"),"ship approach must expose the supplied-asset atlas contract");
assert.ok(source.includes('assets/good_boys/good_ship_arcade.atlas.png'),"ship approach must load the extracted supplied artwork");
for(const key of ["ship_player","asteroid_1","asteroid_2","asteroid_3","asteroid_4","asteroid_5","prison_station","lead_1","lead_2","lead_3","lead_4"]){assert.ok(source.includes(key),`missing supplied asset frame ${key}`);}
assert.ok(source.includes('id==="GD_CUT_02"'),"ship gameplay must run immediately before the existing prison-drive transition clip");
assert.ok(source.includes('p.phase==="clip2"'),"ship gameplay must only intercept the authored opening transition");
assert.ok(source.includes('AVOID ASTEROIDS'),"ship gameplay must present the asteroid-avoidance objective");
assert.ok(source.includes('PRISON VECTOR'),"ship gameplay must visually advance toward the prison");
assert.ok(source.includes('runApproachCutscene'),"ship gameplay must end in an in-engine prison approach cutscene using supplied frames");
assert.ok(source.includes('DURATION_MS=4200'),"opening flight beat must remain bounded for runtime automation and mobile pacing");
assert.ok(source.includes('root.__goodBoysShipApproach'),"ship approach must expose runtime diagnostics");
console.log("Good Boys supplied-asset ship approach contract: PASS");
