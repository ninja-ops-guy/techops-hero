'use strict';
// Test the repository's actual Night step, not a second physics implementation.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const core=fs.readFileSync('night_combat.js','utf8'),input=fs.readFileSync('night_combat_input.js','utf8');
const hooks=fs.readFileSync('night_hooks.js','utf8');
const start=hooks.indexOf('function stepNM(dt)'),end=hooks.indexOf('// ---------- night rendering');
assert.ok(start>=0&&end>start,'Night step extraction anchors must exist');
const step=hooks.slice(start,end);
let passed=0;
for(const dt of [.016,.1,.25])for(const kind of ['uppercut','rising-kick','kick']){
 const r={console,Math,performance:{now:()=>1000},S:{nightMode:true,inDialog:false},keys:{},joy:{x:0,y:0},NM_W:1800,NM_FLOOR:430,NM_GRAV:.48,cv:{width:960,height:540},sfx(){},nmCheckClear(){},clamp:(v,a,b)=>Math.max(a,Math.min(b,v))};r.window=r;r.globalThis=r;
 const n=r.NM={district:'downtown',x:100,y:396,w:22,h:34,hp:100,vx:0,vy:0,onGround:true,face:1,jHeld:false,jumps:0,flip:0,dashT:0,dashCD:0,ifr:0,hitStop:0,clear:false,platforms:[]};
 const e={x:150,y:396,w:24,h:34,hp:1000,maxHp:1000,alive:true,kind:'thug',name:'fixture',spd:0,dmg:0,cd:999,kb:0,windup:0,cash:[0,0]};n.enemies=[e];
 vm.runInNewContext(core+'\n'+input+'\n'+step,r);
 const frame=()=>r.TechOpsNightInput.runStep(r.stepNM,dt,r.keys,r.joy);
 const until=(pred,msg)=>{for(let i=0;i<240&&!pred();i++)frame();assert.ok(pred(),msg+' dt='+dt+' '+kind+' '+JSON.stringify({x:n.x,y:n.y,enemy:{x:e.x,y:e.y},events:n._nightCombat.events}));};
 frame();if(kind!=='kick')r.joy.y=-1;
 r.TechOpsNightInput.dispatch(kind==='uppercut'?'punch':'kick');until(()=>e._nightCombat?.air,'launch');r.joy.y=0;
 r.TechOpsNightInput.dispatch('jump');until(()=>!n.onGround,'jump');
 // No enemy/player repositioning after the initial encounter fixture.
 for(let i=0;i<3;i++){
  until(()=>!n._nightCombat.attack,'attack recovery');r.TechOpsNightInput.dispatch(i===1?'kick':'punch');
  until(()=>e._nightCombat.airHits>=i+1,'air contact '+i);
 }
 assert.equal(e._nightCombat.locked,true);assert.ok(e._nightCombat.vy>0);passed++;
 console.log('PASS production Night step: '+kind+' -> jump -> 3 air hits at '+dt+' seconds/frame');
}

// Regression for Runtime bot #821: preserve the confirmed-hit follow trajectory so
// the next aerial kick remains inside the existing 92px targeting window. The
// production hit criteria are unchanged; this exercises the real Night step.
{
 const dt=1/120,r={console,Math,performance:{now:()=>1000},S:{nightMode:true,inDialog:false},keys:{},joy:{x:0,y:0},NM_W:1800,NM_FLOOR:430,NM_GRAV:.48,cv:{width:960,height:540},sfx(){},nmCheckClear(){},clamp:(v,a,b)=>Math.max(a,Math.min(b,v))};r.window=r;r.globalThis=r;
 const n=r.NM={district:'downtown',x:650,y:396,w:22,h:34,hp:100,vx:0,vy:0,onGround:true,face:1,jHeld:false,jumps:0,flip:0,dashT:0,dashCD:0,ifr:0,hitStop:0,clear:false,platforms:[]};
 const e={x:700,y:396,w:24,h:34,hp:500,maxHp:500,alive:true,kind:'thug',name:'WebKit timing fixture',spd:0,dmg:0,cd:999,kb:0,windup:0,cash:[0,0]};n.enemies=[e];
 vm.runInNewContext(core+'\n'+input+'\n'+step,r);
 const frame=()=>r.TechOpsNightInput.runStep(r.stepNM,dt,r.keys,r.joy),combat=()=>n._nightCombat;
 const until=(pred,msg)=>{for(let i=0;i<1000&&!pred();i++)frame();assert.ok(pred(),msg+' '+JSON.stringify({time:combat()?.time,player:{x:n.x,y:n.y,vy:n.vy},enemy:{x:e.x,y:e.y,vy:e._nightCombat?.vy},events:combat()?.events}));};
 const advanceTo=t=>until(()=>combat()&&combat().time+1e-7>=t,'advance to '+t);
 advanceTo(36);r.joy.y=-1;assert.equal(r.TechOpsNightInput.dispatch('kick'),true);r.joy.y=0;until(()=>e._nightCombat?.air,'rising kick launch');
 advanceTo(325);assert.equal(r.TechOpsNightInput.dispatch('jump'),true);until(()=>!n.onGround,'explicit jump');
 advanceTo(467);assert.equal(r.TechOpsNightInput.dispatch('punch'),true);until(()=>combat().events.filter(ev=>ev.type==='air'&&ev.damage>0).length>=1,'first aerial punch');
 advanceTo(854);assert.equal(r.TechOpsNightInput.dispatch('kick'),true);until(()=>combat().events.some(ev=>ev.type==='air-kick'&&ev.damage>0),'aerial kick after recovery');
 until(()=>!combat().attack,'kick recovery');assert.equal(r.TechOpsNightInput.dispatch('punch'),true);until(()=>e._nightCombat.airHits===3,'third aerial contact');
 const kick=combat().events.find(ev=>ev.type==='air-kick'&&ev.damage>0);assert.ok(kick?.targeting);assert.equal(kick.targeting.reason,'eligible');assert.ok(Math.abs(kick.targeting.feet)<kick.targeting.verticalTolerance);
 assert.equal(e._nightCombat.locked,true);assert.equal(combat().events.filter(ev=>ev.type==='whiff').length,0);passed++;console.log('PASS Runtime #821 follow trajectory keeps punch/kick/punch contacts inside existing target window');
}
// Diagnostic metadata must explain a rejected strike without changing the result.
{
 const r={console,Math,performance:{now:()=>1000},S:{nightMode:true,inDialog:false},sfx(){},nmCheckClear(){}};r.window=r;r.globalThis=r;vm.runInNewContext(core,r);
 const e={x:150,y:0,w:24,h:34,hp:500,maxHp:500,alive:true,windup:0,kb:0,cash:[0,0]},n={district:'downtown',x:100,y:200,w:22,h:34,hp:100,face:1,onGround:false,vx:0,vy:0,enemies:[e],platforms:[]};
 assert.equal(r.TechOpsNightCombat.attack(n,{},'punch'),true);r.TechOpsNightCombat.tick(n,.04,{});r.TechOpsNightCombat.tick(n,.04,{});
 const whiff=n._nightCombat.events.find(ev=>ev.type==='whiff');assert.equal(whiff?.reason,'no-target');assert.equal(whiff?.targeting?.[0]?.reason,'vertical');assert.ok(Number.isFinite(whiff.targeting[0].feet));passed++;console.log('PASS rejected strike records geometry and rejection reason');
}
console.log(JSON.stringify({suite:'night-directional-physics',passed,failed:0}));
