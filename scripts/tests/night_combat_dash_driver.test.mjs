import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {test} from 'node:test';

// Offline scheduler model only. Executes the bot's actual dash segment and
// unchanged production input/combat/step functions. No browser is launched;
// synthetic listener calls do not establish trusted browser-event acceptance.
const read=name=>fs.readFileSync(new URL('../../'+name,import.meta.url),'utf8');
const bot=read('scripts/night_combat_bot.mjs'),hooks=read('night_hooks.js');
const start=bot.indexOf('  await setup(770);'),end=bot.indexOf("  for(const direction of ['left','right','up','down'])",start);
assert.ok(start>0&&end>start);
const driver=bot.slice(start,end);
const setup=bot.slice(bot.indexOf('  const setup=async'),bot.indexOf('  const idle='));
const production=read('night_combat.js')+'\n'+read('night_combat_input.js')+'\n'+hooks.slice(hooks.indexOf('function stepNM(dt)'),hooks.indexOf('// ---------- night rendering'));

function fixture({latency=0,punchDelay=0,omitFirstTap=false,stagingDelay=0}={}){
 let wallTime=1000,presses=0;
 const listeners={},calls=[],snapshots=[];
 const r={console,performance:{now:()=>wallTime},S:{nightMode:true},keys:{},joy:{x:0,y:0},sfx(){},nmCheckClear(){},addEventListener(type,fn){listeners[type]=fn;},NM_W:1800,NM_FLOOR:430,NM_GRAV:.48,cv:{width:1048,height:720},clamp:(v,a,b)=>Math.max(a,Math.min(b,v))};
 r.window=r;r.globalThis=r;
 r.NM={district:'industrial',x:650,y:396,w:22,h:34,hp:100,face:1,vx:0,vy:0,onGround:true,dashT:0,dashCD:0,ifr:0,hitStop:0,jumps:0,jHeld:false,flip:0,platforms:[],enemies:[],clear:false};
 const context=vm.createContext(r);vm.runInContext(production,context);
 function advance(ms){while(ms>0){const slice=Math.min(ms,16);wallTime+=slice;r.TechOpsNightInput.runStep(r.stepNM,slice/1000,r.keys,r.joy);ms-=slice;}}
 advance(16);
 function input(code,down){
  if(code==='KeyE'&&down)snapshots.push({time:r.NM._nightCombat.time,dash:{...r.NM._nightCombat.dash},x:r.NM.x,enemyX:r.NM.enemies[0].x});
  const event={code,repeat:false,preventDefault(){},stopImmediatePropagation(){}};
  listeners[down?'keydown':'keyup'](event);
  // Model the ordinary production direction-key bridge; combat actions remain
  // dispatched by the real canonical key listener above.
  if(code==='ArrowRight')r.keys.arrowright=down;
 }
 async function command(label,run){calls.push(label);advance(latency/2);const result=await run();advance(latency/2);return result;}
 const keyboard={
  press:async(code,{delay=0}={})=>command('press:'+code,()=>{
   if(code==='ArrowRight'&&++presses===1&&omitFirstTap){advance(delay);return;}
   if(code==='KeyE')advance(punchDelay);
   input(code,true);advance(delay);input(code,false);
  }),
  down:code=>command('down:'+code,()=>input(code,true)),
  up:code=>command('up:'+code,()=>input(code,false))
 };
 r.page={keyboard,
  evaluate:fn=>command('evaluate',()=>{if(fn.toString().includes('NM.enemies[0].x=NM.x+48'))advance(stagingDelay);return fn();}),
  waitForFunction:fn=>command('waitForFunction',()=>{
   for(let elapsed=0;elapsed<=15000;elapsed+=16){if(fn())return;advance(16);}
   throw Error('SIMULATED predicate timeout');
  })
 };
 r.shot=async label=>calls.push('shot:'+label);r.checks=[];
 return {r,calls,snapshots,run:()=>vm.runInContext('(async()=>{'+setup+driver+'})()',context)};
}

for(const latency of [0,20,60,80])test(`offline driver accepts production grab under ${latency} ms modeled command latency`,async()=>{
 const f=fixture({latency});
 try{await f.run();}catch(error){console.log('MODEL FAILURE '+JSON.stringify({latency,punch:f.snapshots[0],events:f.r.NM._nightCombat.events}));throw error;}
 const c=f.r.NM._nightCombat;
 assert.equal(c.events.filter(e=>e.type==='dash').length,1);assert.equal(c.events.filter(e=>e.type==='grab'&&e.fromDash).length,1);
 assert.equal(f.calls.filter(x=>x==='press:ArrowRight').length,2);assert.equal(f.calls.filter(x=>x==='press:KeyE').length,1);
 assert.equal(f.snapshots[0].dash.until-f.snapshots[0].dash.at,340);assert.ok(f.snapshots[0].time<=f.snapshots[0].dash.until);
 assert.equal(f.r.NM.enemies[0].hp,500);assert.equal(f.r.keys.arrowright,false);assert.equal(f.r.checks.length,1);
 console.log('MODEL '+JSON.stringify({latency,punch:f.snapshots[0],events:c.events}));
});

test('late delivered punch remains a jab and fails the unchanged fromDash assertion',async()=>{
 const f=fixture({latency:20,punchDelay:400});await assert.rejects(f.run(),/SIMULATED predicate timeout/);
 const c=f.r.NM._nightCombat;assert.equal(c.events.filter(e=>e.type==='dash').length,1);assert.equal(c.events.some(e=>e.type==='grab'&&e.fromDash),false);
 assert.ok(c.events.some(e=>e.type==='windup'&&e.kind==='jab'));assert.ok(f.snapshots[0].time>f.snapshots[0].dash.until);
 assert.equal(f.calls.filter(x=>x==='press:KeyE').length,1);assert.equal(f.r.checks.length,0);
});

test('missing first direction tap cannot be repaired by a third tap or retry',async()=>{
 const f=fixture({latency:20,omitFirstTap:true});await assert.rejects(f.run(),/SIMULATED predicate timeout/);
 assert.equal(f.r.NM._nightCombat.events.some(e=>e.type==='dash'),false);assert.equal(f.calls.filter(x=>x==='press:ArrowRight').length,2);assert.equal(f.calls.includes('press:KeyE'),false);assert.equal(f.r.checks.length,0);
});

test('window already expired at target staging fails without sending an attack',async()=>{
 const f=fixture({latency:20,stagingDelay:400});await assert.rejects(f.run(),/Dash grab fixture missed the live dash window/);
 assert.equal(f.calls.includes('press:KeyE'),false);assert.equal(f.r.NM._nightCombat.events.some(e=>e.type==='grab'),false);assert.equal(f.r.checks.length,0);
});
