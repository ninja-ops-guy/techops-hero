'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const core=fs.readFileSync('night_combat.js','utf8');
const input=fs.readFileSync('night_combat_input.js','utf8');
let passed=0;
function test(name,fn){fn();passed++;console.log('PASS '+name);}
function fixture(withInput=false){
 const r={console,performance:{now:()=>1000},S:{nightMode:true,inDialog:false},joy:{x:0,y:0},keys:{},sfx(){},nmCheckClear(){r.clears=(r.clears||0)+1;}};
 r.window=r;r.globalThis=r;vm.runInNewContext(core,r);
 const e={x:150,y:396,w:24,h:34,hp:500,maxHp:500,alive:true,windup:20,kb:0,cash:[10,10]};
 const n={district:'downtown',x:100,y:396,w:22,h:34,hp:100,face:1,onGround:true,vx:0,vy:0,enemies:[e],platforms:[],kills:0,cash:0,jHeld:false,jumps:0};
 r.NM=n;if(withInput)vm.runInNewContext(input,r);
 return {r,n,e,api:r.TechOpsNightCombat,controls:r.TechOpsNightInput};
}
function advance(f,ms,k={},physics=false){for(let t=0;t<ms;t+=10){f.api.tick(f.n,.01,k);if(physics)for(const e of f.n.enemies)if(e.alive)f.api.stepEnemy(f.n,e,.01);}}
function hit(f,k,action){assert.equal(f.api.attack(f.n,k,action),true);advance(f,130);}
function plain(x){return JSON.parse(JSON.stringify(x));}

test('joystick intent sampled at action time, outside the temporary key bridge',()=>{
 const f=fixture();f.e.x=130;f.n.face=-1;f.r.joy.x=1;
 assert.equal(f.api.attack(f.n,{}),true);assert.equal(f.n._nightCombat.grab.enemy,f.e);assert.equal(f.n.face,1);
 assert.deepEqual(f.r.keys,{});
});
test('explicit stationary grab, released movement and a new direction throw',()=>{
 const f=fixture(true);f.e.x=130;assert.equal(f.controls.dispatch('grab'),true);assert.equal(f.e.hp,500);
 advance(f,140);f.r.joy.y=-1;advance(f,10);
 assert.equal(f.n._nightCombat.grab,null);assert.equal(f.e._nightCombat.air,true);assert.ok(f.e._nightCombat.vy<-10);
});
test('live joystick chooses left-facing punch before the next frame',()=>{
 const f=fixture(true);f.r.joy.x=-1;f.e.x=65;assert.equal(f.controls.dispatch('punch'),true);advance(f,80);
 assert.ok(f.e.hp<500);assert.equal(f.n.face,-1);assert.equal(f.n._nightCombat.grab,null);
});
test('explicit punch never becomes an accidental close-range grab',()=>{const f=fixture();f.e.x=130;hit(f,{arrowright:true},'punch');assert.equal(f.n._nightCombat.grab,null);assert.ok(f.e.hp<500);});
test('up punch uppercuts and launches on contact, not on input',()=>{
 const f=fixture();f.api.attack(f.n,{arrowup:true},'punch');advance(f,70);assert.equal(f.e.hp,500);
 advance(f,20);assert.equal(f.n._nightCombat.attack.kind,'uppercut');assert.equal(f.e.hp,480);assert.equal(f.e._nightCombat.air,true);
});
test('down punch hits low without launching',()=>{const f=fixture();hit(f,{arrowdown:true},'punch');assert.equal(f.n._nightCombat.attack.kind,'low');assert.equal(f.e.hp,488);assert.equal(f.e._nightCombat.air,false);});
for(const [keys,kind] of [[{},'kick'],[{arrowup:true},'rising-kick']])test(kind+' launches a grounded opponent',()=>{
 const f=fixture();hit(f,keys,'kick');assert.equal(f.n._nightCombat.attack.kind,kind);assert.equal(f.e._nightCombat.air,true);assert.ok(f.e._nightCombat.vy<0);
});
test('down kick sweeps with bounded ground recovery',()=>{const f=fixture();hit(f,{arrowdown:true},'kick');assert.equal(f.n._nightCombat.attack.kind,'sweep');assert.ok(f.e._nightCombat.recoverUntil>f.n._nightCombat.time);assert.equal(f.e._nightCombat.air,false);advance(f,500);assert.equal(f.api.stepEnemy(f.n,f.e,.016),false);});
test('low attacks cannot hit a hovering or launched opponent',()=>{
 for(const field of ['hover','air']){const f=fixture();if(field==='hover')f.e.hover=true;else{hit(f,{arrowup:true},'kick');advance(f,300);}
 const hp=f.e.hp;hit(f,{arrowdown:true},'punch');assert.equal(f.e.hp,hp);assert.equal(f.n.combo,0);}
});
test('kick range differs from punch range',()=>{
 const f=fixture();f.e.x=195;hit(f,{},'punch');assert.equal(f.e.hp,500);advance(f,250);hit(f,{},'kick');assert.ok(f.e.hp<500);
});
test('attack facing remains fixed at contact after movement turns',()=>{const f=fixture();f.e.x=65;f.api.attack(f.n,{arrowleft:true},'punch');f.n.face=1;advance(f,80);assert.equal(f.e.hp,486);});
test('grab rejects air, hover, disabled grab, and out-of-range targets',()=>{
 for(const mutate of [f=>f.e.hover=true,f=>f.e.grabbable=false,f=>f.e.x=900,f=>f.n.onGround=false]){const f=fixture();f.e.x=130;mutate(f);assert.equal(f.api.grab(f.n,{}),false);assert.equal(f.e.hp,500);}
});
test('grab uses feet alignment for different character heights',()=>{const f=fixture();f.e.x=130;f.e.h=56;f.e.y=374;assert.equal(f.api.grab(f.n,{}),true);});
test('grab expiry and incoming damage release both actors',()=>{
 for(const hurt of [false,true]){const f=fixture();f.e.x=130;f.api.grab(f.n,{});if(hurt)f.api.hurt(f.n);else advance(f,1700);assert.equal(f.n._nightCombat.grab,null);assert.equal(f.e._nightCombat.held,false);}
});
test('early throw confirm is buffered rather than dropped',()=>{const f=fixture();f.e.x=130;f.api.grab(f.n,{});f.api.grab(f.n,{arrowleft:true});advance(f,130);assert.equal(f.n._nightCombat.grab,null);assert.ok(f.e._nightCombat.vx<0);});
test('removed enemy cannot leave a stuck grab',()=>{const f=fixture();f.e.x=130;f.api.grab(f.n,{});f.n.enemies=[];advance(f,10);assert.equal(f.n._nightCombat.grab,null);assert.equal(f.e._nightCombat.held,false);});
test('recovery buffer retains kick type and direction at press time',()=>{
 const f=fixture();f.api.attack(f.n,{},'punch');advance(f,180);f.api.attack(f.n,{arrowup:true},'kick');advance(f,60);
 assert.equal(f.n._nightCombat.attack.kind,'rising-kick');assert.equal(f.n._nightCombat.lastInput,180);
});
test('a grounded relaunch never resets an existing air-combo count',()=>{
 const f=fixture();hit(f,{arrowup:true},'punch');advance(f,200);
 for(let i=0;i<3;i++){hit(f,{arrowup:true},'punch');advance(f,200);}
 assert.equal(f.e._nightCombat.airHits,3);assert.equal(f.e._nightCombat.locked,true);
 const hp=f.e.hp;hit(f,{arrowup:true},'punch');assert.equal(f.e.hp,hp);
});
test('air punches/kicks stop at three hits and force descent',()=>{
 const f=fixture();hit(f,{arrowup:true},'kick');advance(f,250);f.n.onGround=false;
 for(const action of ['punch','kick','punch']){hit(f,{},action);advance(f,150);}
 assert.equal(f.e._nightCombat.airHits,3);assert.equal(f.e._nightCombat.locked,true);assert.ok(f.e._nightCombat.vy>0);
 const hp=f.e.hp;hit(f,{},'kick');assert.equal(f.e.hp,hp);
});
test('down-air kick slams early, with no infinite lift',()=>{const f=fixture();hit(f,{arrowup:true},'kick');advance(f,250);f.n.onGround=false;hit(f,{arrowdown:true},'kick');assert.equal(f.n._nightCombat.attack.kind,'air-slam');assert.equal(f.e._nightCombat.locked,true);assert.ok(f.e._nightCombat.vy>0);});
test('only a connected launcher may cancel recovery into jump',()=>{
 const f=fixture();f.api.attack(f.n,{arrowup:true},'kick');assert.equal(f.api.jumpCancel(f.n),false);advance(f,120);assert.equal(f.api.jumpCancel(f.n),true);assert.equal(f.n._nightCombat.attack,null);
 const g=fixture();g.e.x=900;g.api.attack(g.n,{arrowup:true},'kick');advance(g,120);assert.equal(g.api.jumpCancel(g.n),false);
});
test('pause does not advance combat or accept actions',()=>{const f=fixture();f.api.attack(f.n,{},'punch');f.r.S.inDialog=true;advance(f,1000);assert.equal(f.n._nightCombat.time,0);assert.equal(f.api.kick(f.n,{}),false);assert.equal(f.e.hp,500);});
test('KO reward resolves once even on repeated inputs',()=>{const f=fixture();f.e.hp=14;hit(f,{},'punch');advance(f,300);for(let i=0;i<5;i++){hit(f,{},'punch');advance(f,300);}assert.equal(f.n.cash,10);assert.equal(f.n.kills,1);});
test('Good Dogs, Sector 04 and Waldo remain excluded',()=>{
 for(const mutate of [f=>f.n._v736={},f=>f.n._sector04={},f=>f.n.district='waldo']){const f=fixture(true);mutate(f);assert.equal(f.controls.owns(),false);assert.equal(f.controls.dispatch('kick'),false);assert.equal(f.api.grab(f.n,{}),false);assert.equal(f.n._nightCombat,undefined);}
});
test('opposite directions cancel and no caller keys are mutated',()=>{const f=fixture();const keys={a:true,d:true,w:true,s:true};const before={...keys};const k=f.api.normalizeInput(keys,{});assert.equal(k.a,false);assert.equal(k.d,false);assert.equal(k.w,false);assert.equal(k.s,false);assert.deepEqual(keys,before);});
test('adapter keeps up as aim, supplies a distinct jump edge, restores keys on exceptions',()=>{
 const f=fixture(true);const keys={a:false,w:true};f.r.keys=keys;f.controls.runStep(()=>{},.016,keys,{}); // bind current runtime
 const before={...keys};f.controls.runStep(()=>{assert.equal(keys.w,false);assert.equal(keys.arrowup,false);assert.equal(f.controls.snapshot().arrowup,true);},.016,keys,{});assert.deepEqual(keys,before);
 f.controls.dispatch('jump');f.controls.runStep(()=>{assert.equal(keys.arrowup,true);assert.equal(f.controls.snapshot().arrowup,true);},.016,keys,{});
 assert.deepEqual(keys,before);assert.throws(()=>f.controls.runStep(()=>{throw Error('probe');},.016,keys,{}),/probe/);assert.deepEqual(keys,before);
});
test('jump substitution is not mistaken for uppercut aim',()=>{
 const f=fixture(true);f.controls.runStep(()=>{},.016,f.r.keys,f.r.joy);f.controls.dispatch('jump');
 f.controls.runStep(()=>{assert.equal(f.r.keys.arrowup,true);assert.equal(f.api.readInput(f.r.keys).arrowup,false);},.016,f.r.keys,f.r.joy);
});
test('a jump pressed before the first frame survives runtime binding',()=>{
 const f=fixture(true);assert.equal(f.controls.dispatch('jump'),true);
 f.controls.runStep(()=>assert.equal(f.r.keys.arrowup,true),.016,f.r.keys,f.r.joy);
});
test('tap-jump queue survives hit-stop and is consumed exactly once afterward',()=>{
 const f=fixture(true);f.n.hitStop=3;f.controls.dispatch('jump');
 f.controls.runStep(()=>assert.equal(f.r.keys.arrowup,false),.016,f.r.keys,f.r.joy);
 f.n.hitStop=0;f.controls.runStep(()=>assert.equal(f.r.keys.arrowup,true),.016,f.r.keys,f.r.joy);
 f.controls.runStep(()=>assert.equal(f.r.keys.arrowup,false),.016,f.r.keys,f.r.joy);
});
test('normalization reaches both arrow and letter inputs in the real frame bridge',()=>{
 const f=fixture(true);f.r.keys.arrowleft=true;f.r.joy.x=1;
 const before={...f.r.keys};f.controls.runStep(()=>{
  for(const k of ['a','d','arrowleft','arrowright'])assert.equal(f.r.keys[k],false);
 },.016,f.r.keys,f.r.joy);assert.deepEqual(f.r.keys,before);
});
test('pause cancels a queued jump rather than releasing it on resume',()=>{
 const f=fixture(true);f.controls.dispatch('jump');f.r.S.inDialog=true;
 f.controls.runStep(()=>{},.016,f.r.keys,f.r.joy);f.r.S.inDialog=false;
 f.controls.runStep(()=>assert.equal(f.r.keys.arrowup,false),.016,f.r.keys,f.r.joy);
});
test('input adapter uses the existing frame caller and core owns no listener or extra loop',()=>{assert.ok(!/setInterval|requestAnimationFrame|addEventListener/.test(core));assert.ok(!/setInterval|requestAnimationFrame/.test(input));});
console.log(JSON.stringify({suite:'night-directional-combat',passed,failed:0}));
