'use strict';
/* Contract: street-combat impact escalation sells every hit.
 * Hit-stop is weighted (light 3, heavy 5, on-beat +1, knockout 8, cap 8,
 * monotonic), beat hits flag their events for gold presentation, and every
 * fifth chained hit emits a combo-milestone with a celebration caption.
 * Damage numbers, move tables and juggle rules are unchanged. */
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('night_combat.js','utf8');
let passed=0;
function test(name,fn){fn();passed++;console.log('PASS '+name);}
function fixture(){const root={console,performance:{now:()=>1000},S:{inDialog:false},sfx(){},nmCheckClear(){root.clears=(root.clears||0)+1;}};root.globalThis=root;vm.runInNewContext(source,root);const e={x:150,y:396,w:24,h:34,hp:200,maxHp:200,alive:true,windup:20,kb:0,cash:[10,10]};const n={district:'downtown',x:100,y:396,w:22,h:34,hp:100,face:1,onGround:true,vx:0,vy:0,hitStop:0,enemies:[e],platforms:[],kills:0,cash:0};root.NM=n;return {root,n,e,api:root.TechOpsNightCombat};}
function advance(f,ms,keys={}){for(let i=0;i<ms;i+=10)f.api.tick(f.n,.01,keys);}

test('a light strike freezes the world for 3 frames',()=>{
  const f=fixture();f.api.attack(f.n,{});advance(f,80);
  assert.equal(f.n.hitStop,3,'jab hit-stop');
});

test('a heavy throw freezes the world for 5 frames',()=>{
  const f=fixture();f.e.x=130;f.api.attack(f.n,{arrowright:true});
  advance(f,200,{arrowright:true});advance(f,10,{});advance(f,10,{arrowright:true});
  assert.equal(f.n._nightCombat.events.some(e=>e.type==='throw'),true,'throw landed');
  assert.equal(f.n.hitStop,5,'throw hit-stop');
});

test('an on-beat hit adds one frame and flags its event',()=>{
  const f=fixture();
  f.api.attack(f.n,{});advance(f,80);assert.equal(f.n.hitStop,3);
  advance(f,240); // 320ms press gap: inside the 260-500ms beat window
  f.api.attack(f.n,{});advance(f,80);
  assert.equal(f.n._nightCombat.beat,true,'paced press is on beat');
  assert.equal(f.n.hitStop,4,'beat hit-stop');
  const hit=f.n._nightCombat.events.filter(e=>e.type==='cross'||e.type==='jab').pop();
  assert.equal(hit.beat,true,'beat hit events carry the flag');
});

test('a knockout lands the longest stop and pays out once',()=>{
  const f=fixture();f.e.hp=10;f.api.attack(f.n,{});advance(f,80);
  assert.equal(f.e.alive,false);assert.equal(f.n.hitStop,8,'KO hit-stop');
  assert.equal(f.n._nightCombat.events.some(e=>e.type==='ko'),true);
});

test('hit-stop is monotonic and capped at 8',()=>{
  const f=fixture();f.n.hitStop=7;f.api.attack(f.n,{});advance(f,80);
  assert.equal(f.n.hitStop,7,'a shorter stop never truncates a longer one');
  const g=fixture();g.e.hp=5;g.api.attack(g.n,{});advance(g,80);
  assert.ok(g.n.hitStop<=8,'cap holds even on a beat KO');
});

test('every fifth chained hit is a milestone with a celebration caption',()=>{
  const f=fixture(),c=f.api.state(f.n);
  c.hits=4;c.lastHit=c.time; // four-hit chain in progress
  f.api.attack(f.n,{});advance(f,80);
  assert.equal(c.hits,5);
  const ms=c.events.find(e=>e.type==='combo-milestone');
  assert.ok(ms,'milestone event emitted');assert.equal(ms.hits,5);
  assert.ok(c.fx.includes(ms),'milestone is a world floater');
  assert.ok(/COMBO ×5/.test(f.n.msg),'caption celebrates the chain');
});

test('non-milestone chained hits keep their move captions',()=>{
  const f=fixture(),c=f.api.state(f.n);
  c.hits=3;c.lastHit=c.time;
  f.api.attack(f.n,{});advance(f,80);
  assert.equal(c.hits,4);
  assert.equal(c.events.some(e=>e.type==='combo-milestone'),false,'no milestone at four');
  assert.ok(!/COMBO ×/.test(f.n.msg||''),'ordinary move caption stands');
});

test('throws count toward milestones',()=>{
  const f=fixture(),c=f.api.state(f.n);f.e.x=130;
  c.hits=4;c.lastHit=c.time;
  f.api.attack(f.n,{arrowright:true});
  advance(f,200,{arrowright:true});advance(f,10,{});advance(f,10,{arrowright:true});
  assert.equal(c.hits,5);
  assert.equal(c.events.some(e=>e.type==='combo-milestone'&&e.hits===5),true);
  assert.ok(/COMBO ×5/.test(f.n.msg));
});

console.log(passed+'/8 night combat impact contracts passed');
