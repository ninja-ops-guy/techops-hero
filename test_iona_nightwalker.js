'use strict';
const assert = require('node:assert/strict'), fs = require('node:fs'), vm = require('node:vm');
const r = {}; r.globalThis = r;
const images = [];
class TestImage {
  constructor() { images.push(this); }
  set src(value) { this.source = value; this.complete = true; this.naturalWidth = value.includes('bicycle') ? 1254 : 1536; this.naturalHeight = value.includes('bicycle') ? 1254 : 1024; }
}
r.Image = TestImage;
for (const file of ['night_combat.js', 'night_move_atlas.js', 'night_move_visuals.js', 'iona_nightwalker.js', 'night_reference_visuals.js']) {
  vm.runInNewContext(fs.readFileSync(file, 'utf8'), r);
}
const binding = {runId: 'test-iona-run', profileId: 'local-primary'};
let selected = true, mission = {actor: 'iona', district: 'industrial', ...binding};
const n = {district: 'industrial', hp: 100, face: 1, onGround: true, w: 22, h: 34, enemies: []};
r.S = {meta: {seeWorldLink: binding}, nightMode: n};
r.TechOpsLinked = {mission: () => mission, health: () => ({selected})};
const art = r.TechOpsIonaNightwalker;
assert.ok(art.owns(n));
for (const actor of ['mike', 'felicia', 'k', 'waldo']) { mission.actor = actor; assert.equal(art.owns(n), false); }
mission.actor = 'iona';
for (const field of ['_v736', '_sector04', 'drive']) { n[field] = {}; assert.equal(art.owns(n), false); delete n[field]; }
n.district = 'downtown'; assert.equal(art.owns(n), false); n.district = 'industrial';
selected = false; assert.equal(art.owns(n), false); selected = true;
mission.runId = 'another-run'; assert.equal(art.owns(n), false); mission.runId = binding.runId;
assert.equal(art.owns({...n}), false, 'stale Night object cannot claim the current viewpoint');
const op = mission; mission = null; assert.equal(art.owns(n), false); mission = op;
for (const [kind, move] of Object.entries(r.TechOpsNightCombat.MOVES)) {
  n._nightCombat = {time: move.windup, attack: {kind, at: 0, windup: move.windup, duration: move.recovery, face: -1}};
  const before = JSON.stringify(n), pose = art.sample(n, 99999);
  assert.equal(pose.kind, kind); assert.equal(pose.face, -1, 'locked combat facing');
  if(kind === 'bicycle-kick') assert.ok(pose.bicycle && pose.cell === 1);
  else assert.ok(Number.isInteger(pose.cell) && pose.cell >= 7 && pose.cell <= 17);
  assert.equal(JSON.stringify(n), before, 'rendering cannot mutate combat');
  n._nightCombat.time = move.recovery - 1;
  assert.equal(art.sample(n).cell, kind === 'bicycle-kick' ? 0 : 6, 'attack recovers through guard');
}
n._nightCombat = {time: 0}; n.vx = 3;
const walk = [];
for (const time of [0,125,250,375]) { n._nightCombat.time = time; walk.push(art.sample(n).cell); }
assert.equal(new Set(walk).size, 4);
assert.equal(art.sample(n, 999999).cell, art.sample(n, 0).cell, 'paused simulation clock freezes locomotion');
n.vx = 0; n.onGround = false; assert.equal(art.sample(n).kind, 'jump'); n.onGround = true;
n.hp = 0; assert.equal(art.sample(n).cell, 23); n.hp = 100;
const calls = [], ctx = new Proxy({}, {get: (_, key) => (...args) => calls.push([key, ...args]), set: () => true});
assert.equal(r.TechOpsNightReferenceVisuals.drawReferenceNightWalker(ctx, n, 100, 396, 0), true);
assert.ok(calls.some(([name, im]) => name === 'drawImage' && im.source === art.SRC), 'live renderer selects Iona before Mike');
mission.actor='k';const controlledBefore=JSON.stringify(n),missionBefore=JSON.stringify(mission);calls.length=0;
assert.equal(art.draw(ctx,n,100,396,0),false,'passive drawing must not transfer control to Iona');
assert.equal(art.drawCompanion(ctx,{x:120,face:-1,vx:3,_nightCombat:{attack:{kind:'air-down'}}},250,75),true);
assert.ok(calls.some(([name,im])=>name==='drawImage'&&im.source===art.SRC));
assert.equal(JSON.stringify(n),controlledBefore);assert.equal(JSON.stringify(mission),missionBefore);
assert.ok(calls.some(([name,x])=>name==='scale'&&x===-1),'companion facing is independent');
mission.actor='iona';
const im = images.find(x => x.source === art.SRC); im.complete = false;
calls.length = 0;
assert.equal(r.TechOpsNightReferenceVisuals.drawReferenceNightWalker(ctx, n, 100, 396, 0), true);
assert.equal(calls.some(([name]) => name === 'drawImage'), false, 'pending Iona never falls through to Mike');
assert.ok(calls.some(([name, text]) => name === 'fillText' && /Iona/.test(text)));
console.log('Iona actor isolation, simulation timing, combat mapping, rendering priority and unavailable-image behavior: PASS');
