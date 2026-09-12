'use strict';
// Production-script integration fixtures, not a browser or physical-device gate.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const hooks=fs.readFileSync('night_hooks.js','utf8'),v55=fs.readFileSync('v55_hooks.js','utf8');
function extract(source,start,end){const a=source.indexOf(start),b=source.indexOf(end,a);assert.ok(a>=0&&b>a,start);return source.slice(a,b);}
const interaction=extract(hooks,'const __origInteractV50 = interact;','// ---------- day-end suppression');
const combatStep=extract(hooks,'function nmJab()','// ---------- night rendering');
const frameBridge=extract(v55,'const __origStepNMV55 =','// show/hide the night buttons');
let passed=0;
function test(name,fn){fn();passed++;console.log('PASS '+name);}
function fixture(district='downtown'){
 const n={district,street:1,x:650,y:396,w:22,h:34,hp:100,face:1,onGround:true,vx:0,vy:0,done:{},enemies:[],platforms:[],cash:0,kills:0,jHeld:false,jumps:0,dashCD:0,dashT:0,ifr:0,hitStop:0};
 const s={day:1,clock:900,budget:100,weather:'storm',meta:{},tickets:[{age:8}],nightMode:null,inDialog:false};
 const listeners={},store=new Map();let now=1000;
 const c={console,seedS:s,seedNM:n,document:null,cv:{width:960,height:540},performance:{now:()=>now},
  clamp:(v,a,b)=>Math.max(a,Math.min(b,v)),drawNM(){},draw(){},interact(){c.dayCalls++;},dayCalls:0,carCalls:0,
  nmCarMenu(){c.carCalls++;c.dlg('CHARGER','route',[]);},nmLoadDistrict(id){n.district=id;},nmNextStage(){},
  advanceClock(m){s.clock+=m;s.tickets[0].age+=m;},fmtClock(){return '';},save(){return true;},updateHUD(){},sfx(){},
  localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)},
  closeDlg(){s.inDialog=false;},dlg(title,body,opts){c.dialog={title,body,opts};s.inDialog=true;},
  v725:{h:{},register(){},play(id,done){c.scene={id,done};return true;},skip(){c.scene.done();}},
  exitNight(){s.budget+=n.cash;vm.runInContext('S.nightMode=null; NM=null;',c);c.TechOpsNightRuntime.endVisit(s);},
  addEventListener(type,fn,capture){(listeners[type]||=[]).push({fn,capture});},removeEventListener(){},
  setInterval(){return 1;},clearInterval(){},setTimeout(){return 1;},matchMedia(){return {matches:false};}};
 c.globalThis=c;c.window=c;vm.createContext(c);
 // Top-level lexical state deliberately has no window.S/window.NM mirror.
 vm.runInContext('let S=seedS;let NM=seedNM;const keys={};let joy={x:0,y:0};const NM_W=1800,NM_FLOOR=430,NM_GRAV=.48,NM_CAR_X=26;',c);
 for(const name of ['cinematic_systems.js','night_combat.js','night_combat_input.js'])vm.runInContext(fs.readFileSync(name,'utf8'),c,{filename:name});
 vm.runInContext(interaction+'\n'+combatStep+'\n'+frameBridge,c);
 vm.runInContext(fs.readFileSync('production_wrapper_guard.js','utf8'),c);
 vm.runInContext(fs.readFileSync('runtime_night.js','utf8'),c);
 c.TechOpsNightRuntime.beforeEnter(s);s.nightMode=n;c.TechOpsNightRuntime.onEntered(s,n);
 const key=(code,target={})=>{const e={code,key:({KeyE:'e',KeyJ:'j',KeyG:'g',Space:' ',Enter:'Enter'})[code]||code,repeat:false,target,preventDefault(){this.prevented=true;},stopImmediatePropagation(){this.stopped=true;}};for(const {fn}of listeners.keydown||[]){fn(e);if(e.stopped)break;}return e;};
 const frame=(count=1,dt=.016)=>{for(let i=0;i<count;i++){now+=dt*1000;c.TechOpsNightRuntime.frame(dt);}};
 const enemy=(x=690)=>{const e={x,y:396,w:24,h:34,hp:500,maxHp:500,alive:true,kind:'thug',name:'Fixture',spd:0,dmg:0,cd:999,windup:0,kb:0,cash:[10,10]};n.enemies=[e];return e;};
 return {c,n,s,api:c.TechOpsNightInput,core:c.TechOpsNightCombat,rt:c.TechOpsNightRuntime,frame,key,enemy,eval:src=>vm.runInContext(src,c)};
}
test('classic-script lexical state routes keyboard E through the real Home interaction',()=>{
 const f=fixture('home');f.n.x=1489;assert.equal(f.c.S,undefined);assert.equal(f.c.NM,undefined);const e=f.key('KeyE');assert.equal(e.prevented,true);assert.equal(f.c.dialog.title,"MIKE'S HOUSE");assert.ok(f.c.dialog.opts.some(o=>/Sleep/.test(o.t)));assert.equal(f.n._nightCombat,undefined);
});
test('punch-use delegates to the canonical Charger menu instead of attacking',()=>{
 const f=fixture();f.n.x=110;f.api.dispatch('punch');assert.equal(f.c.carCalls,1);assert.equal(f.n._nightCombat,undefined);
});
test('a nearby hostile keeps E in combat even beside the Charger',()=>{
 const f=fixture();f.n.x=110;const e=f.enemy(150);f.key('KeyE');f.frame(10);assert.equal(f.c.carCalls,0);assert.equal(f.n._nightCombat.grab,null);assert.ok(e.hp<500);
});
test('live joystick uppercut survives canonical interact and the actual v55 bridge',()=>{
 const f=fixture(),e=f.enemy();f.eval('joy.y=-1');f.key('KeyE');f.frame(8);assert.ok(e._nightCombat.air);assert.ok(f.n.onGround);assert.equal(f.n._nightCombat.attack.kind,'uppercut');
});
test('explicit direction survives canonical punch-use dispatch without mutating held keys',()=>{
 const f=fixture(),e=f.enemy();f.api.dispatch('punch',{arrowup:true});f.frame(8);assert.ok(e._nightCombat.air);assert.equal(f.n._nightCombat.attack.kind,'uppercut');assert.equal(f.eval('keys.arrowup'),undefined);assert.ok(f.n.onGround);
});
test('stationary keyboard grab works with the actual production step wrapper',()=>{
 const f=fixture(),e=f.enemy(675);f.key('KeyG');f.frame(10);assert.equal(f.n._nightCombat.grab.enemy,e);assert.equal(e.hp,500);f.eval('joy.y=1');f.frame(10);assert.equal(f.n._nightCombat.grab,null);assert.ok(e.hp<500);
});
test('one lifecycle frame advances the clock once after adding directional input',()=>{
 const f=fixture();f.frame(100,.05);assert.equal(f.s.clock,1081);assert.equal(f.s.tickets[0].age,8);assert.equal(f.c.TechOpsProductionWrapperGuard.health().baseStepCount,100);
});
for(const key of ['inDialog','inBattle','paused','gameOver'])test(key+' rejects actions and pauses both player and combat',()=>{
 const f=fixture(),e=f.enemy();f.s[key]=true;assert.equal(f.api.dispatch('kick'),false);assert.equal(f.core.attack(f.n,{},'kick'),false);f.api.runStep(f.c.stepNM,.05,f.eval('keys'),{});assert.equal(e.hp,500);assert.equal(f.n.x,650);assert.equal(f.n._nightCombat,undefined);
});
test('hidden-tab and settings-modal input cannot queue an attack',()=>{
 for(const mode of ['hidden','settings']){const f=fixture();f.enemy();f.c.document={hidden:mode==='hidden',getElementById:id=>mode==='settings'&&id==='v67-settings'?{hidden:false,classList:{contains:()=>false},style:{display:'block'}}:null};assert.equal(f.api.dispatch('kick'),false);assert.equal(f.api.dispatch('jump'),false);assert.equal(f.core.attack(f.n,{},'punch'),false);}
});
test('real home presentation claim survives the production guard and rejects all attacks',()=>{
 const f=fixture('home');f.n.x=1489;f.enemy(1530);f.rt.sleep();const before={x:f.n.x,hp:f.n.enemies[0].hp,clock:f.s.clock};for(let i=0;i<30;i++){f.c.TechOpsProductionWrapperGuard.enforce();for(const a of ['punch','kick','grab','jump'])assert.equal(f.api.dispatch(a),false);f.frame();}assert.deepEqual({x:f.n.x,hp:f.n.enemies[0].hp,clock:f.s.clock},before);assert.equal(f.s.inDialog,true);
});
test('home return clears input ownership and retains exactly one reward settlement',()=>{
 const f=fixture('home');f.n.x=1489;f.n.cash=37;f.rt.sleep();const done=f.c.scene.done;done();done();assert.equal(f.api.owns(),false);assert.equal(f.s.budget,137);assert.equal(f.s.nightMode,null);assert.equal(f.c.__productionActiveMode,'day');
});
test('travel continues through the input adapter but an explicit pause freezes travel',()=>{
 const f=fixture();f.n.drive={t:0,dur:1500,to:'home'};f.frame(5,.05);assert.equal(f.n.drive.t,250);f.s.paused=true;f.api.runStep(f.c.stepNM,.05,f.eval('keys'),{});assert.equal(f.n.drive.t,250);
});
test('stale night world cannot receive input after state ownership changes',()=>{
 const f=fixture();f.enemy();f.s.nightMode={district:'home'};assert.equal(f.api.owns(),false);assert.equal(f.api.dispatch('kick'),false);assert.equal(f.n._nightCombat,undefined);
});
test('Good Dogs, Sector 04 and Waldo retain their original key ownership',()=>{
 for(const mode of ['dogs','sector','waldo']){const f=fixture();if(mode==='dogs')f.n._v736={};if(mode==='sector')f.n._sector04={};if(mode==='waldo')f.n.district='waldo';const e=f.key('KeyJ');assert.equal(f.api.owns(),false);assert.equal(e.stopped,undefined);assert.equal(f.n._nightCombat,undefined);}
});
test('Space and Enter preserve native focused-button activation without a gameplay action',()=>{
 const f=fixture();f.enemy();for(const code of ['Space','Enter']){const e=f.key(code,{closest:selector=>selector.includes('button')?{}:null});assert.equal(e.stopped,true);assert.equal(e.prevented,undefined);assert.equal(f.n._nightCombat,undefined);}
});
test('unavailable shared WebAudio cannot interrupt a directional KO or reward',()=>{
 const f=fixture(),e=f.enemy();e.hp=14;const game=fs.readFileSync('game.js','utf8');vm.runInContext(extract(game,'let AC = null;','// ---------- achievements'),f.c);f.c.AudioContext=function(){throw new Error('WebAudio unavailable fixture');};f.key('KeyE');f.frame(8);assert.equal(e.alive,false);assert.equal(f.n.kills,1);assert.equal(f.n.cash,10);
});
console.log(JSON.stringify({suite:'night-input-lifecycle',passed,failed:0}));
