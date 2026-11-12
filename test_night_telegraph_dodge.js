'use strict';
/* Contract: enemy telegraphs escalate and dash-dodging a charged swing pays off.
 * Runs the real stepNM slice from night_hooks.js. Attack timing, thresholds
 * and damage are unchanged: a full windup still lands, walking away stays
 * silent, and only a mid-dash i-frame reset earns the DODGED caption. */
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const hooks=fs.readFileSync('night_hooks.js','utf8');
const slice=hooks.slice(hooks.indexOf('function stepNM(dt)'),hooks.indexOf('// ---------- night rendering'));
let passed=0;
function test(name,fn){fn();passed++;console.log('PASS '+name);}
function fixture(){
  const r={console,performance:{now:()=>1000},sfx(){},clamp:(v,a,b)=>Math.max(a,Math.min(b,v)),
    NM_W:1800,NM_FLOOR:430,NM_GRAV:.48,cv:{width:960,height:540},keys:{}};
  r.window=r;r.globalThis=r;
  r.S={inDialog:false};
  const e={kind:'thug',name:'fixture',x:130,y:396,w:24,h:34,hp:100,maxHp:100,alive:true,spd:0,dmg:10,cd:999,windup:0,kb:0,cash:[0,0]};
  r.NM={district:'downtown',x:100,y:396,w:22,h:34,hp:100,face:1,onGround:true,vx:0,vy:0,hitStop:0,jHeld:false,jumps:0,dashT:0,dashCD:0,ifr:0,flip:0,clear:false,combo:0,comboT:0,jabAnim:0,enemies:[e],platforms:[],kills:0,cash:0};
  vm.runInNewContext(slice,r);
  return {r,e,n:r.NM,step(frames=1){for(let i=0;i<frames;i++)r.stepNM(1/60);}};
}
const source=fs.readFileSync('night_hooks.js','utf8');

test('an adjacent enemy charges a windup',()=>{
  const f=fixture();f.step(14);
  assert.ok(f.e.windup>=13,'windup grows while the player is in range');
});

test('dashing through a charged swing earns the DODGED caption',()=>{
  const f=fixture();f.step(14);
  f.r.NM.dashT=3;f.r.NM.ifr=12;f.step();
  assert.equal(f.e.windup,0,'the swing is interrupted');
  assert.equal(f.r.NM.dodges,1,'dodge counted');
  assert.ok(/DODGED/.test(f.r.NM.msg),'reward caption shown');
});

test('leaving range resets the windup silently',()=>{
  const f=fixture();f.step(14);
  f.r.NM.x=400;f.step();
  assert.equal(f.e.windup,0);
  assert.ok(!/DODGED/.test(f.r.NM.msg||''),'no reward without a dash');
  assert.equal(f.r.NM.dodges,undefined);
});

test('a half-charged windup reset earns no caption even mid-dash',()=>{
  const f=fixture();f.step(8);
  assert.ok(f.e.windup>=8&&f.e.windup<13);
  f.r.NM.dashT=3;f.r.NM.ifr=12;f.step();
  assert.equal(f.e.windup,0);
  assert.ok(!/DODGED/.test(f.r.NM.msg||''));
});

test('a full windup still lands the hit (regression)',()=>{
  const f=fixture();f.step(30);
  assert.equal(f.r.NM.hp,90,'full damage lands');
  assert.ok(f.r.NM.ifr>0,'post-hit i-frames granted');
  assert.equal(f.e.windup,0,'windup consumed');
});

test('the telegraph draw escalates with charge in the real renderer',()=>{
  const marker=source.indexOf('Telegraph escalates as the attack charges');
  assert.ok(marker>0,'escalating telegraph installed');
  const block=source.slice(marker,marker+700);
  assert.ok(block.includes('"#ffd166"'),'amber while charging');
  assert.ok(block.includes('"#ff5252"'),'red when imminent');
  const compact=block.replace(/\s/g,'');
  assert.ok(compact.includes('charge>=.8'),'imminent flash at 80% charge');
  assert.ok(compact.includes('e.hover?36:26'),'drone and melee thresholds respected');
});

console.log(passed+'/6 night telegraph/dodge contracts passed');
