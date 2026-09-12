'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('night_combat.js','utf8');
function fixture(){const root={console,performance:{now:()=>1000},S:{inDialog:false},sfx(){},nmCheckClear(){root.clears=(root.clears||0)+1;}};root.globalThis=root;vm.runInNewContext(source,root);const e={x:150,y:396,w:24,h:34,hp:200,maxHp:200,alive:true,windup:20,kb:0,cash:[10,10]};const n={district:'downtown',x:100,y:396,w:22,h:34,hp:100,face:1,onGround:true,vx:0,vy:0,enemies:[e],platforms:[],kills:0,cash:0};root.NM=n;return {root,n,e,api:root.TechOpsNightCombat};}
function advance(f,ms,keys={},physics=false){for(let i=0;i<ms;i+=10){f.api.tick(f.n,.01,keys);if(physics)for(const e of f.n.enemies)if(e.alive)f.api.stepEnemy(f.n,e,.01);}}
{
 const f=fixture();assert.equal(f.api.attack(f.n,{}),true);assert.equal(f.e.hp,200,'wind-up may not damage');advance(f,60);assert.equal(f.e.hp,200);advance(f,20);assert.equal(f.e.hp,186,'contact frame damages exactly once');advance(f,160);assert.equal(f.e.hp,186);assert.equal(f.n.combo,1);
 advance(f,80);assert.equal(f.api.attack(f.n,{}),true);advance(f,80);assert.equal(f.n.combo,2);assert.equal(f.n._nightCombat.stage,1);assert.equal(f.n._nightCombat.beat,true);assert.equal(f.e.hp,165);
 advance(f,240);f.api.attack(f.n,{});advance(f,80);assert.equal(f.e._nightCombat.air,true,'third paced hit launches');assert.equal(f.n._nightCombat.stage,2);
}
{
 const f=fixture();f.e.x=800;f.api.attack(f.n,{});advance(f,240);assert.equal(f.n.combo,0,'whiffs cannot earn combo');assert.equal(f.e.hp,200);assert.equal(f.n._nightCombat.events.filter(e=>e.type==='whiff').length,1);
 f.e.x=150;f.api.attack(f.n,{});for(let i=0;i<10;i++)f.api.attack(f.n,{});advance(f,100);assert.equal(f.e.hp,186,'mashing cannot multiply contact damage');assert.equal(f.n._nightCombat.stage,0);
 advance(f,100);f.api.attack(f.n,{});advance(f,120);assert.equal(f.n._nightCombat.beat,false,'an early buffered press is not a timed combo');assert.equal(f.n._nightCombat.stage,0);
}
for(const dir of ['left','right','up']){
 const f=fixture();f.e.x=130;f.api.attack(f.n,{arrowright:true});assert.equal(f.n._nightCombat.grab.enemy,f.e);assert.equal(f.e.hp,200,'grab initiation deals no free damage');advance(f,200,{arrowright:true});assert.ok(f.n._nightCombat.grab,'held entry direction cannot auto-throw');advance(f,10,{});advance(f,10,{['arrow'+dir]:true});assert.equal(f.n._nightCombat.grab,null);assert.equal(f.e._nightCombat.air,true);assert.equal(f.e._nightCombat.held,false);assert.equal(Math.sign(f.e._nightCombat.vx),dir==='left'?-1:1);if(dir==='up')assert.ok(f.e._nightCombat.vy<-10);else assert.ok(Math.abs(f.e._nightCombat.vx)>8);
}
{
 const f=fixture();f.e.x=130;f.api.attack(f.n,{});assert.equal(f.n._nightCombat.grab,null,'stationary close attacks remain punches');
 const g=fixture();g.e.x=130;g.api.attack(g.n,{arrowright:true});advance(g,1700,{arrowright:true});assert.equal(g.n._nightCombat.grab,null,'grab hold is bounded');assert.equal(g.e._nightCombat.held,false);
}
{
 const f=fixture();f.api.attack(f.n,{});advance(f,80);assert.equal(f.api.stepEnemy(f.n,f.e,.016),true,'stun owns enemy step before attack AI');assert.equal(f.e.windup,0);advance(f,400);assert.equal(f.api.stepEnemy(f.n,f.e,.016),false,'stun expires');
 f.e.x=130;f.api.attack(f.n,{arrowright:true});f.api.hurt(f.n);assert.equal(f.n._nightCombat.grab,null);assert.equal(f.e._nightCombat.held,false);assert.equal(f.api.attack(f.n,{}),false,'player hit-stun interrupts grabs and attacks');advance(f,190);assert.equal(f.api.attack(f.n,{}),true);
}
{
 const f=fixture();f.e.x=130;f.api.attack(f.n,{arrowright:true});advance(f,150);f.api.attack(f.n,{arrowup:true});advance(f,280);f.n.onGround=false;f.n.y=f.e.y;f.e.x=150;
 for(let i=0;i<3;i++){f.api.attack(f.n,{});advance(f,240);}
 assert.equal(f.e._nightCombat.airHits,3);assert.equal(f.e._nightCombat.locked,true,'three air hits end the juggle');assert.ok(f.e._nightCombat.vy>0);const hp=f.e.hp;f.api.attack(f.n,{});advance(f,240);assert.equal(f.e.hp,hp,'juggle lock prevents infinite stun');advance(f,1000,{},true);assert.equal(f.e._nightCombat.air,false,'air targets land');
}
{
 const f=fixture();f.e.x=130;f.api.attack(f.n,{arrowright:true});advance(f,150);f.api.attack(f.n,{arrowright:true});const other={...f.e,x:f.e.x+20,hp:18,alive:true,_nightCombat:undefined};f.n.enemies.push(other);advance(f,20,{},true);assert.equal(other.alive,false,'thrown enemies collide with crowds');assert.equal(f.n.cash,10);advance(f,500,{},true);assert.equal(f.n.cash,10,'collision rewards are paid once');assert.equal(f.n.kills,1);
}
{
 const f=fixture();f.api.attack(f.n,{});f.root.S.inDialog=true;advance(f,2000);assert.equal(f.n._nightCombat.time,0,'dialog pauses combat simulation');assert.equal(f.e.hp,200);assert.equal(f.api.attack(f.n,{}),false);f.root.S.inDialog=false;advance(f,80);assert.equal(f.e.hp,186);
 for(const flag of ['_v736','_sector04']){const other={...f.n,[flag]:{}};assert.equal(f.api.active(other),false);assert.equal(f.api.attack(other,{}),false);assert.equal(f.api.stepEnemy(other,f.e,.016),false);}
}
// Verify the actual integration surfaces retain one loop and apply damage at contact.
const hooks=fs.readFileSync('night_hooks.js','utf8'),boot=fs.readFileSync('production_bootstrap.js','utf8');
// Run the real player/enemy step at normal and slow render cadences. A launched
// enemy must remain reachable when the follow-up attack reaches its contact frame.
for(const dt of [.016,.1,.25]){
 const f=fixture(),r=f.root;r.window=r;r.keys={};r.clamp=(v,a,b)=>Math.max(a,Math.min(b,v));r.NM_W=1800;r.NM_FLOOR=430;r.NM_GRAV=.48;r.cv={width:960,height:540};
 Object.assign(f.n,{hitStop:0,jHeld:false,jumps:0,dashT:0,dashCD:0,ifr:0,flip:0,clear:false});
 Object.assign(f.e,{kind:'thug',spd:0,dmg:0,cd:999,windup:0});
 vm.runInNewContext(hooks.slice(hooks.indexOf('function stepNM(dt)'),hooks.indexOf('// ---------- night rendering')),r);
 const until=pred=>{for(let i=0;i<150&&!pred();i++)r.stepNM(dt);assert.ok(pred(),'condition must resolve at dt='+dt);};
 for(let i=0;i<3;i++){
  if(i)until(()=>!f.n._nightCombat.attack&&f.n._nightCombat.time-f.n._nightCombat.lastInput>=310);
  f.api.attack(f.n,{});until(()=>!f.n._nightCombat.attack);
  assert.equal(f.n._nightCombat.hits,i+1,'knockback must keep a spaced ground chain in reach at dt='+dt);
 }
 assert.equal(f.n._nightCombat.stage,2);assert.ok(f.e._nightCombat.air);
 // Reset the encounter, then exercise the up-throw follow-up with real physics.
 f.api.cancel(f.n);delete f.n._nightCombat;delete f.e._nightCombat;
 Object.assign(f.n,{x:100,y:396,vx:0,vy:0,onGround:true,hitStop:0});Object.assign(f.e,{x:130,y:396,kb:0,alive:true,hp:200});
 f.e.x=130;f.api.attack(f.n,{arrowright:true});until(()=>f.n._nightCombat.time>=150);
 r.keys.arrowup=true;r.stepNM(dt);r.keys.arrowup=false;until(()=>!f.n._nightCombat.attack);
 assert.ok(!f.n.onGround,'player must still be airborne when throw recovers at dt='+dt);
 r.keys.arrowright=true;f.api.attack(f.n,r.keys);until(()=>f.n._nightCombat.events.some(e=>e.type==='air'||e.type==='whiff'));
 assert.ok(f.n._nightCombat.events.some(e=>e.type==='air'&&e.damage>0),'slow frames must preserve the real up-throw air follow-up at dt='+dt);
}
assert.ok(hooks.indexOf('streetCombat.stepEnemy(NM,e,dt)')<hooks.indexOf('// launch / downed states first'));
assert.ok(hooks.includes('streetCombat.hurt(NM)'));assert.ok(hooks.includes('TechOpsNightCombat.attack(NM, keys)'));
assert.ok(boot.includes('"night_combat.js"'));assert.ok(!/setInterval|requestAnimationFrame|addEventListener/.test(source),'combat service must not add a competing loop or input handler');
console.log('Night contextual combat: contact timing, rhythm, grabs, throws, stun, finite juggles, collision rewards and campaign isolation PASS');
