'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const core=fs.readFileSync('night_combat.js','utf8'),input=fs.readFileSync('night_combat_input.js','utf8');
let passed=0;
function test(name,fn){fn();passed++;console.log('PASS '+name);}
function fixture(iona=true){
 const id={runId:'iona-combo-fixture',profileId:'local-primary'};
 const e={x:650,y:280,w:24,h:34,hp:500,alive:true,windup:0,kb:0,cash:[10,10],spd:0,dmg:0,cd:999};
 const n={district:'industrial',x:600,y:280,w:22,h:34,hp:100,face:1,onGround:false,vx:0,vy:0,enemies:[e],platforms:[],kills:0,cash:0,jHeld:false,jumps:0,flip:0,dashT:0,dashCD:0,ifr:0,hitStop:0,clear:false};
 const r={console,Math,performance:{now:()=>1000},S:{nightMode:n,meta:{seeWorldLink:id}},NM:n,keys:{},joy:{x:0,y:0},NM_W:1800,NM_FLOOR:430,NM_GRAV:.48,cv:{width:960,height:540},sfx(){},nmCheckClear(){},clamp:(v,a,b)=>Math.max(a,Math.min(b,v))};
 r.TechOpsLinked={mission:()=>({actor:iona?'iona':'mike',district:n.district,...id}),health:()=>({selected:true})};r.window=r;r.globalThis=r;vm.runInNewContext(core+'\n'+input,r);
 const api=r.TechOpsNightCombat;api.target(n,{},false,api.MOVES.air);e._nightCombat.air=true;
 const advance=ms=>{for(let t=0;t<ms;t+=5)api.tick(n,.005,{});};
 return {r,n,e,api,advance};
}
test('down + light is a distinct quick aerial attack on keyboard and joystick',()=>{
 for(const stick of [false,true]){const f=fixture();f.e.y+=70;if(stick)f.r.joy.y=1;
  f.api.attack(f.n,stick?{}:{arrowdown:true},'punch');assert.equal(f.n._nightCombat.attack.kind,'air-down');
  f.advance(45);assert.equal(f.e.hp,500);f.advance(5);assert.equal(f.e.hp,488);
  assert.equal(f.e._nightCombat.airHits,1);assert.equal(f.e._nightCombat.locked,false);assert.ok(f.e._nightCombat.vy>0);
 }
});
test('down light cannot strike above or outside its lower reach',()=>{
 for(const dy of [-30,140]){const f=fixture();f.e.y+=dy;f.api.attack(f.n,{s:true},'punch');f.advance(60);assert.equal(f.e.hp,500);}
});
test('down light hits grounded enemies below without launching or bouncing the player',()=>{
 const f=fixture();f.e._nightCombat.air=false;f.e.y+=90;f.n.vy=2;
 f.api.attack(f.n,{s:true},'punch');f.advance(55);assert.equal(f.e.hp,488);assert.equal(f.e._nightCombat.air,false);assert.equal(f.n.vy,2);
});
test('Iona up + aerial kick pedals three contacts on the simulation clock',()=>{
 const f=fixture();f.api.kick(f.n,{w:true});assert.equal(f.n._nightCombat.attack.kind,'bicycle-kick');
 for(const [ms,hp,hits] of [[70,500,0],[5,494,1],[70,488,2],[70,482,3]]){f.advance(ms);assert.equal(f.e.hp,hp);assert.equal(f.e._nightCombat.airHits,hits);}
 assert.equal(f.e._nightCombat.locked,true);assert.ok(f.e._nightCombat.vy>0);f.advance(200);assert.equal(f.e.hp,482);
});
test('bicycle respects contacts already spent by previous air attacks',()=>{
 for(const prior of [1,2]){const f=fixture();f.e._nightCombat.airHits=prior;f.api.kick(f.n,{w:true});f.advance(350);
  assert.equal(f.e._nightCombat.airHits,3);assert.equal(f.e.hp,500-(3-prior)*6);assert.equal(f.n.combo,3-prior);
 }
});
test('non-Iona retains the existing aerial kick and Iona ground-up retains rising kick',()=>{
 const f=fixture(false);f.api.kick(f.n,{w:true});assert.equal(f.n._nightCombat.attack.kind,'air-kick');
 const g=fixture();g.n.onGround=true;g.api.kick(g.n,{w:true});assert.equal(g.n._nightCombat.attack.kind,'rising-kick');
});
test('bicycle cannot farm grounded enemies or retarget a new victim between contacts',()=>{
 const f=fixture();f.e._nightCombat.air=false;f.api.kick(f.n,{w:true});f.advance(350);assert.equal(f.e.hp,500);
 const g=fixture();g.api.kick(g.n,{w:true});g.advance(75);const other={...g.e,hp:500,_nightCombat:{...g.e._nightCombat,airHits:0}};g.n.enemies=[other];g.advance(250);assert.equal(other.hp,500);
});
test('pause, interruption and leaving Iona viewpoint stop later contacts',()=>{
 for(const reason of ['pause','hurt','actor']){const f=fixture();f.api.kick(f.n,{w:true});f.advance(75);
  if(reason==='pause')f.r.S.paused=true;else if(reason==='hurt')f.api.hurt(f.n);else f.r.TechOpsLinked.mission=()=>null;
  f.advance(500);assert.equal(f.e.hp,494,reason);
  if(reason==='pause'){f.r.S.paused=false;f.advance(140);assert.equal(f.e.hp,482);}
 }
});
test('multi-contact KO settles cash once and does not touch another enemy',()=>{
 const f=fixture();f.e.hp=7;const other={...f.e,x:675,hp:500,_nightCombat:undefined};f.n.enemies.push(other);
 f.api.kick(f.n,{w:true});f.advance(500);assert.equal(f.n.kills,1);assert.equal(f.n.cash,10);assert.equal(other.hp,500);
});
test('buffered down-light preserves directional intent after aerial light recovery',()=>{
 const f=fixture();f.api.attack(f.n,{},'punch');f.advance(170);f.api.attack(f.n,{s:true},'punch');f.advance(65);
 assert.equal(f.n._nightCombat.attack.kind,'air-down');f.advance(50);assert.equal(f.e._nightCombat.airHits,2);
});
test('pre-resolved throw poses never gain a duplicate delayed jab',()=>{
 const f=fixture();f.n._nightCombat.attack={kind:'throw',at:0,hit:true,connected:true,duration:270,face:1};f.advance(100);assert.equal(f.e.hp,500);
});

const hooks=fs.readFileSync('night_hooks.js','utf8');
const step=hooks.slice(hooks.indexOf('function stepNM(dt)'),hooks.indexOf('// ---------- night rendering'));
for(const dt of [.016,.1,.25])for(const route of ['bicycle','light-bicycle','light-down'])test('actual Night physics: launch → jump → '+route+' at '+dt+'s/frame',()=>{
 const f=fixture();f.n.y=f.e.y=396;f.n.onGround=true;delete f.e._nightCombat;
 vm.runInNewContext(step,f.r);
 const controls=f.r.TechOpsNightInput,frame=()=>controls.runStep(f.r.stepNM,dt,f.r.keys,f.r.joy);
 const until=(predicate,label)=>{for(let i=0;i<240&&!predicate();i++)frame();assert.ok(predicate(),label+' '+JSON.stringify({n:{x:f.n.x,y:f.n.y},e:{x:f.e.x,y:f.e.y},events:f.n._nightCombat.events}));};
 frame();f.r.joy.y=-1;controls.dispatch('kick');until(()=>f.e._nightCombat?.air,'launch');f.r.joy.y=0;controls.dispatch('jump');until(()=>!f.n.onGround,'jump');
 if(route!=='bicycle'){until(()=>!f.n._nightCombat.attack,'recovery');controls.dispatch('punch');until(()=>f.e._nightCombat.airHits>=1,'air light');}
 until(()=>!f.n._nightCombat.attack,'follow-up recovery');
 if(route==='light-down'){controls.dispatch('jump');frame();until(()=>f.e.y+f.e.h>=f.n.y+f.n.h-8,'move above target for down light');}
 f.r.joy.y=route==='light-down'?1:-1;controls.dispatch(route==='light-down'?'punch':'kick');f.r.joy.y=0;
 until(()=>f.e._nightCombat.airHits>=(route==='light-down'?2:3),'directional follow-up');
 assert.ok(f.n._nightCombat.events.some(e=>e.type===(route==='light-down'?'air-down':'bicycle-kick')&&e.damage>0));
 if(route!=='light-down')assert.equal(f.e._nightCombat.locked,true);
});
console.log(JSON.stringify({suite:'night-aerial-combos',passed,failed:0}));
