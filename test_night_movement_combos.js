'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const hooks=fs.readFileSync('night_hooks.js','utf8'),step=hooks.slice(hooks.indexOf('function stepNM(dt)'),hooks.indexOf('// ---------- night rendering'));
const source=['night_combat.js','night_combat_input.js'].map(p=>fs.readFileSync(p,'utf8')).join('\n')+'\n'+step;
let passed=0;
function fixture(dt=.016){
 let wallTime=1000;
 const listeners={},r={console,performance:{now:()=>wallTime},S:{nightMode:true},keys:{},joy:{x:0,y:0},sfx(){},nmCheckClear(){},addEventListener(type,fn){listeners[type]=fn;},NM_W:1800,NM_FLOOR:430,NM_GRAV:.48,cv:{width:1048,height:720},clamp:(v,a,b)=>Math.max(a,Math.min(b,v))};r.window=r;r.globalThis=r;
 const n=r.NM={district:'industrial',x:400,y:396,w:22,h:34,hp:100,face:1,vx:0,vy:0,onGround:true,dashT:0,dashCD:0,ifr:0,hitStop:0,jumps:0,jHeld:false,flip:0,platforms:[],clear:false};
 const e={x:440,y:396,w:24,h:34,hp:1000,maxHp:1000,alive:true,kind:'thug',spd:0,dmg:0,windup:0,kb:0,cd:999,cash:[0,0]};n.enemies=[e];vm.runInNewContext(source,r);
 const f={r,n,e,listeners,api:r.TechOpsNightCombat,input:r.TechOpsNightInput,elapse(ms){wallTime+=ms;},frame(){wallTime+=dt*1000;r.TechOpsNightInput.runStep(r.stepNM,dt,r.keys,r.joy);},until(pred,label){for(let i=0;i<400&&!pred();i++)f.frame();assert.ok(pred(),label+' '+JSON.stringify({dt,n:{x:n.x,y:n.y,onGround:n.onGround},e:{x:e.x,y:e.y},events:n._nightCombat?.events}));}};
 f.frame();return f;
}
function test(name,fn){fn();passed++;console.log('PASS '+name);}
function tap(f,dir){f.r.keys[dir]=true;f.frame();f.r.keys[dir]=false;f.frame();}
function events(f,type){return f.n._nightCombat.events.filter(e=>e.type===type);}
test('double-tap both keyboard directions, with no repeat while held',()=>{
 for(const dir of ['a','d','arrowleft','arrowright']){const f=fixture();f.n.enemies=[];tap(f,dir);tap(f,dir);assert.equal(events(f,'dash').length,1);assert.equal(f.n.face,/left|^a$/.test(dir)?-1:1);f.r.keys[dir]=true;for(let i=0;i<90;i++)f.frame();assert.equal(events(f,'dash').length,1);}
});
test('late taps and alternating directions do not dash',()=>{
 const f=fixture();tap(f,'d');for(let i=0;i<22;i++)f.frame();tap(f,'d');assert.equal(events(f,'dash').length,0);tap(f,'a');tap(f,'d');assert.equal(events(f,'dash').length,0);
});
test('keyboard taps shorter than a render frame are retained, repeats are ignored',()=>{
 const f=fixture();f.listeners.keydown({code:'ArrowRight',repeat:false});f.listeners.keydown({code:'ArrowRight',repeat:true});f.listeners.keyup({code:'ArrowRight'});f.frame();assert.equal(events(f,'dash').length,0);
 f.listeners.keydown({code:'ArrowRight',repeat:false});f.listeners.keyup({code:'ArrowRight'});f.frame();assert.equal(events(f,'dash').length,1);
 const g=fixture();const target={closest:()=>true};g.listeners.keydown({code:'KeyD',target});g.listeners.keydown({code:'KeyD',target});g.frame();assert.equal(events(g,'dash').length,0,'typing is not movement');
});
test('overlapping direction aliases require a complete release before the next tap',()=>{
 for(const [letter,arrow,key] of [['KeyA','ArrowLeft','a'],['KeyD','ArrowRight','d']]){
  const f=fixture();f.n.enemies=[];
  f.listeners.keydown({code:letter});f.r.keys[key]=true;f.frame();
  f.listeners.keydown({code:arrow});f.frame();assert.equal(events(f,'dash').length,0,'a held alias is not a second tap');
  f.listeners.keyup({code:letter});f.r.keys[key]=false;f.r.keys[arrow.toLowerCase()]=true;f.frame();
  f.listeners.keydown({code:letter});f.frame();assert.equal(events(f,'dash').length,0,'releasing only one alias is not neutral');
  f.listeners.keyup({code:letter});f.listeners.keyup({code:arrow});f.r.keys[arrow.toLowerCase()]=false;f.frame();
  f.listeners.keydown({code:letter});f.r.keys[key]=true;f.frame();assert.equal(events(f,'dash').length,1,'full release allows the second tap');
 }
});
test('tap expiry uses elapsed input time even during hit-stop or a stalled frame',()=>{
 for(const stalled of [true,false]){
  const f=fixture();f.n.enemies=[];
  f.listeners.keydown({code:'KeyD'});f.listeners.keyup({code:'KeyD'});f.frame();
  if(stalled)f.elapse(300);else{f.n.hitStop=100;for(let i=0;i<20;i++)f.frame();f.n.hitStop=0;}
  f.listeners.keydown({code:'KeyD'});f.listeners.keyup({code:'KeyD'});f.frame();
  assert.equal(events(f,'dash').length,0,'expired presses cannot dash: stalled='+stalled);
 }
});
test('joystick double flicks need neutral; analog jitter cannot retrigger',()=>{
 const f=fixture();for(const x of [1,.4,.8,.35,1]){f.r.joy.x=x;f.frame();}assert.equal(events(f,'dash').length,0);
 f.r.joy.x=0;f.frame();f.r.joy.x=1;f.frame();assert.equal(events(f,'dash').length,1);
});
test('opposed keyboard and joystick inputs cannot create a dash',()=>{
 const f=fixture();f.r.joy.x=-1;tap(f,'d');tap(f,'d');assert.equal(events(f,'dash').length,0);
});
test('cooldown, block and stun cannot create additional dash windows',()=>{
 const f=fixture();assert.equal(f.api.dash(f.n,1),true);const first=f.n._nightCombat.dash;assert.equal(f.api.dash(f.n,1),false);assert.equal(f.n._nightCombat.dash,first);f.n.dashCD=0;f.n.block=true;assert.equal(f.api.dash(f.n,1),false);f.n.block=false;f.api.hurt(f.n);assert.equal(f.api.dash(f.n,1),false);
});
test('pause/blur cleanup clears tap history and the dash-to-grab window',()=>{
 const f=fixture();tap(f,'d');f.input.reset();tap(f,'d');assert.equal(events(f,'dash').length,0);tap(f,'d');assert.ok(f.n._nightCombat.dash);f.r.S.paused=true;f.frame();assert.equal(f.n._nightCombat.dash,null);f.r.S.paused=false;f.r.keys.d=true;f.frame();assert.equal(events(f,'dash').length,1);
});
test('real movement: double tap, approach, attack grabs and stops the dash',()=>{
 const f=fixture();f.e.x=520;tap(f,'d');f.r.keys.d=true;f.frame();f.until(()=>f.e.x-f.n.x<45,'dash reaches enemy');assert.equal(f.input.dispatch('punch'),true);assert.equal(f.n._nightCombat.grab.enemy,f.e);assert.equal(f.n.dashT,0);assert.equal(f.n.vx,0);assert.equal(events(f,'grab')[0].fromDash,true);assert.equal(f.e.hp,1000);
});
test('outside the dash window, normal forward attacks stay punches',()=>{
 const f=fixture();f.api.dash(f.n,1);f.until(()=>f.n._nightCombat.time>400,'dash expires');f.e.x=f.n.x+32;f.input.dispatch('punch');assert.equal(f.n._nightCombat.grab,null);assert.equal(f.n._nightCombat.attack.kind,'jab');
});
test('dash attacks never pull distant/hovering targets into a grab',()=>{
 for(const mutate of [f=>f.e.x=1500,f=>f.e.hover=true]){const f=fixture();mutate(f);f.api.dash(f.n,1);f.input.dispatch('punch');assert.equal(f.n._nightCombat.grab,null);assert.equal(f.n._nightCombat.attack.kind,'jab');}
});
test('high/low aim remains available immediately after dashing',()=>{
 for(const [aim,action,kind] of [['w','punch','uppercut'],['s','kick','sweep']]){const f=fixture();f.api.dash(f.n,1);f.r.keys[aim]=true;f.input.dispatch(action);assert.equal(f.n._nightCombat.attack.kind,kind);assert.equal(f.n._nightCombat.grab,null);}
});
test('unchanged owners: Good Dogs, Sector 04 and social Waldo',()=>{
 for(const alter of [n=>n._v736={},n=>n._sector04={},n=>n.district='waldo']){const f=fixture();alter(f.n);assert.equal(f.input.owns(),false);assert.equal(f.input.dispatch('dash'),false);assert.equal(f.api.dash(f.n,1),false);}
});
let airSequences=0,maxGap=0;
for(const dt of [.016,.033,.1])for(const direction of ['left','right','up'])for(const delay of [0,100,180])for(const height of [34,56]){
 const f=fixture(dt);f.e.h=height;f.e.y=430-height;
 if(direction==='left'){f.n.face=-1;f.e.x=f.n.x-32;}
 assert.equal(f.input.dispatch('grab'),true);f.until(()=>f.n._nightCombat.time-f.n._nightCombat.grab.at>=140,'hold established');
 f.r.keys['arrow'+direction]=true;f.frame();f.r.keys['arrow'+direction]=false;
 assert.ok(f.e._nightCombat.air);const launched=f.n._nightCombat.time;
 f.until(()=>f.n._nightCombat.time-launched>=delay,'human follow-up delay');
 assert.equal(f.input.dispatch('jump'),true);f.until(()=>!f.n.onGround,'explicit jump');
 for(let i=0;i<3;i++){
  f.until(()=>!f.n._nightCombat.attack,'recovery');f.input.dispatch(i===1?'kick':'punch');
  f.until(()=>f.e._nightCombat.airHits>=i+1,'throw '+direction+' delay='+delay+' height='+height+' contact '+i);
  maxGap=Math.max(maxGap,Math.abs(f.e.x+f.e.w/2-f.n.x-f.n.w/2));
 }
 assert.equal(f.e._nightCombat.locked,true);f.until(()=>!f.e._nightCombat.air,'finite juggle landing');assert.ok(f.e._nightCombat.recoverUntil>f.n._nightCombat.time);airSequences++;
}
let delayedTouchSequences=0;
// WebKit's real touch action arrived 200 ms after recovery. Keep that latency
// in the physics regression: an air kick must still leave a third hit reachable.
for(const dt of [.016,.033,.05,.1])for(const kind of ['uppercut','rising-kick','kick']){
 const f=fixture(dt);f.e.x=450;
 if(kind!=='kick')f.r.joy.y=-1;
 f.input.dispatch(kind==='uppercut'?'punch':'kick');f.until(()=>f.e._nightCombat?.air,'touch launch');f.r.joy.y=0;
 const launchAt=f.n._nightCombat.time;f.until(()=>f.n._nightCombat.time-launchAt>=120,'touch jump latency');
 f.input.dispatch('jump');f.until(()=>!f.n.onGround,'delayed explicit jump');
 for(let i=0;i<3;i++){
  f.until(()=>!f.n._nightCombat.attack,'touch recovery');
  if(i===1){const at=f.n._nightCombat.time;f.until(()=>f.n._nightCombat.time-at>=200,'touch kick latency');}
  assert.equal(f.n.onGround,false,'touch sequence stays airborne: '+kind+' '+dt+' hit '+i);
  f.input.dispatch(i===1?'kick':'punch');f.until(()=>f.e._nightCombat.airHits>=i+1,'delayed touch '+kind+' contact '+i);
 }
 assert.equal(f.e._nightCombat.locked,true);f.until(()=>!f.e._nightCombat.air&&f.n.onGround,'delayed combo still lands');delayedTouchSequences++;
}
console.log(JSON.stringify({suite:'night-movement-combos',passed,airSequences,delayedTouchSequences,maxObservedHorizontalGap:Number(maxGap.toFixed(1)),failed:0}));
