'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const core=fs.readFileSync('night_combat.js','utf8');
let passed=0;
function test(name,fn){fn();passed++;console.log('PASS '+name);}
function fixture(){
  const r={console,performance:{now:()=>1000},S:{nightMode:true,inDialog:false},sfx(){},nmCheckClear(){}};
  r.window=r;r.globalThis=r;vm.runInNewContext(core,r);
  const e={x:150,y:396,w:24,h:34,hp:500,maxHp:500,alive:true,windup:20,kb:0,cash:[0,0]};
  const n={district:'downtown',x:100,y:396,w:22,h:34,hp:100,face:1,onGround:true,vx:0,vy:0,enemies:[e],platforms:[],kills:0,cash:0};
  return {r,n,e,api:r.TechOpsNightCombat};
}
function advance(f,ms,k={}){for(let t=0;t<ms;t+=10)f.api.tick(f.n,.01,k);}
function engageLauncherFollow(f){
  assert.equal(f.api.attack(f.n,{arrowup:true},'kick'),true);
  advance(f,120);
  assert.equal(f.e._nightCombat.air,true);
  assert.ok(f.n._nightCombat.follow);
  assert.equal(f.n._nightCombat.follow.engaged,false);
  assert.equal(f.api.jumpCancel(f.n),true);
  assert.equal(f.n._nightCombat.follow.engaged,true);
}

test('normal airborne targeting keeps the authored 92px window',()=>{
  const f=fixture();f.n.onGround=false;f.e.y=286;
  f.api.target(f.n,{},false,f.api.MOVES.air);
  f.e._nightCombat.air=true;
  assert.equal(f.api.target(f.n,{},false,f.api.MOVES.air),null);
});

test('engaged follow overrides only vertical tolerance inside the bounded follow envelope',()=>{
  const f=fixture();f.n.onGround=false;f.e.y=286;
  f.api.target(f.n,{},false,f.api.MOVES.air);f.e._nightCombat.air=true;
  f.n._nightCombat.follow={enemy:f.e,engaged:true};
  assert.equal(f.api.target(f.n,{},false,f.api.MOVES.air),f.e);
  f.e.y=230;
  assert.equal(f.api.target(f.n,{},false,f.api.MOVES.air),null);
});

test('follow never bypasses horizontal reach, facing, recovery, lock, or target identity',()=>{
  for(const mutate of [
    f=>{f.e.x=500;},
    f=>{f.n.face=-1;},
    f=>{f.e._nightCombat.recoverUntil=1000;},
    f=>{f.e._nightCombat.locked=true;},
    f=>{f.n._nightCombat.follow={enemy:{alive:true},engaged:true};}
  ]){
    const f=fixture();f.n.onGround=false;f.e.y=286;f.api.target(f.n,{},false,f.api.MOVES.air);f.e._nightCombat.air=true;f.n._nightCombat.follow={enemy:f.e,engaged:true};mutate(f);
    assert.equal(f.api.target(f.n,{},false,f.api.MOVES.air),null);
  }
});

test('launcher follow is inert until the player explicitly jumps',()=>{
  const f=fixture();
  assert.equal(f.api.attack(f.n,{arrowup:true},'kick'),true);advance(f,120);
  assert.equal(f.n._nightCombat.follow.engaged,false);
  f.e.y=286;f.n.onGround=true;advance(f,210);
  assert.equal(f.api.attack(f.n,{},'punch'),true);
  assert.equal(f.n._nightCombat.attack.kind,'jab');
});

test('engaged follow keeps a transient grounded third punch classified as air and consumes on contact',()=>{
  const f=fixture();engageLauncherFollow(f);
  f.n.onGround=true;f.n.y=396;f.e.y=286;f.e.x=150;
  const hp=f.e.hp;
  assert.equal(f.api.attack(f.n,{},'punch'),true);
  assert.equal(f.n._nightCombat.attack.kind,'air');
  advance(f,80);
  assert.ok(f.e.hp<hp);
  assert.equal(f.n._nightCombat.follow,null);
  assert.ok(f.n._nightCombat.events.some(e=>e.type==='air'));
  assert.equal(f.n._nightCombat.events.some(e=>e.type==='jab'&&e.damage),false);
});

test('a whiff preserves follow ownership so a still-airborne juggle remains recoverable',()=>{
  const f=fixture();engageLauncherFollow(f);f.n.onGround=false;f.n.y=396;f.e.y=286;
  const follow=f.n._nightCombat.follow;f.e.x=500;
  assert.equal(f.api.attack(f.n,{},'punch'),true);advance(f,80);
  assert.equal(f.n._nightCombat.follow,follow);
  assert.ok(f.n._nightCombat.events.some(e=>e.type==='whiff'));
  advance(f,180);f.e.x=150;
  const hp=f.e.hp;assert.equal(f.api.attack(f.n,{},'punch'),true);advance(f,80);
  assert.ok(f.e.hp<hp);
  assert.notEqual(f.n._nightCombat.follow,follow);
  assert.equal(f.n._nightCombat.follow.enemy,f.e);
  assert.equal(f.n._nightCombat.follow.engaged,true);
});

test('landing ends follow ownership even without a timeout',()=>{
  const f=fixture();f.api.target(f.n,{},false,f.api.MOVES.air);f.e._nightCombat.air=true;f.e._nightCombat.vy=2;f.e.y=396;
  f.n._nightCombat.follow={enemy:f.e,engaged:true};
  assert.equal(f.api.stepEnemy(f.n,f.e,.016),true);
  assert.equal(f.e._nightCombat.air,false);
  assert.equal(f.n._nightCombat.follow,null);
});

console.log(JSON.stringify({suite:'night-follow-window',passed,failed:0}));
