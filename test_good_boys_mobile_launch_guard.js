"use strict";
const assert=require("assert"),fs=require("fs"),vm=require("vm");
const src=fs.readFileSync("good_boys_mobile_launch_guard.js","utf8");
const timeouts=[];
function flush(limit=3000){let n=0;while(timeouts.length&&n++<limit){const fn=timeouts.shift();fn();}if(n>=limit)throw new Error("timer runaway");}
function classes(){const s=new Set();return{add(v){s.add(v);},remove(v){s.delete(v);},contains(v){return s.has(v);}};}
function el(){return{classList:classes(),dataset:{},remove(){this.removed=true;},style:{},onclick:null,innerHTML:""};}
const elements={};elements["title-screen"]=el();elements["title-screen"].classList.add("hidden");elements["touch-ui"]=el();elements.hud=el();
const body={appendChild(e){elements[e.id]=e;}};
let playBaseCalls=0,combatCbCalls=0,resumeStarts=0;
const context={console,Date,isFinite,
  setInterval(){return 1;},clearInterval(){},setTimeout(fn){timeouts.push(fn);return timeouts.length;},
  document:{body,createElement(){return el();},getElementById(id){if(id==="gb-mobile-retry"&&elements["good-boys-mobile-recovery"]){return elements[id]||(elements[id]=el());}return elements[id]||null;}},
  drawNM(){},stepNM(){},
  v722:{active(){return false;},skip(){}},
  v725:{play(id,cb){playBaseCalls++;if(cb)cb();return true;}},
  TechOpsGoodBoysCanon:{tick(){}},TechOpsGoodBoysGameplayLoop:{tick(){}},TechOpsGoodDogsProduction:{tick(){}},TechOpsGoodBoysReferenceMechanics:{tick(){}}
};
context.globalThis=context;vm.createContext(context);
// Mirror the browser: S/NM are lexical globals, not window properties.
vm.runInContext(`let S={nightMode:false,inDialog:true,meta:{_v736:{m:1,done:false}}}; let NM=null;
function enterNight(){S.nightMode=true;NM={x:100,y:200};}
globalThis.__setState=(v)=>{S=v};globalThis.__getState=()=>S;globalThis.__setWorld=(v)=>{NM=v};globalThis.__getWorld=()=>NM;`,context);
context.v736={start(){resumeStarts++;const S=context.__getState();const m=S.meta._v736.m;context.v725.play("b736m"+m,()=>{combatCbCalls++;const NM=context.__getWorld();NM._v736={m,active:"katrin",chars:{katrin:{hp:120},manchez:{hp:120}},partner:{x:40,y:200}};});}};
vm.runInContext(src,context,{filename:"good_boys_mobile_launch_guard.js"});
const api=context.TechOpsGoodBoysMobileLaunchGuard;
assert.ok(api);assert.strictEqual(api.VERSION,7);
assert.ok(/Wrapper installation is one-shot/.test(src),"v7 must retain one-shot wrapper installation authority");
assert.ok(/never invokes feature tick\(\) methods that can recursively re-wrap drawNM/.test(src),"watchdog must not restore recursive feature ticks");
assert.ok(!src.includes("root.S&&root.S.nightMode"),"guard must not read lexical S through window/root");
assert.ok(!src.includes("root.NM&&root.NM._v736"),"guard must not read lexical NM through window/root");
assert.strictEqual(api.isGoodBoysCombat("b736m1"),true);assert.strictEqual(api.isGoodBoysCombat("b736m7"),true);assert.strictEqual(api.isGoodBoysCombat("b736m8"),false);
assert.strictEqual(api.nightReady(),false);assert.strictEqual(api.pairReady(),false);

// Regression: the authored campaign-director cinematic is a hard launch blocker.
elements["good-boys-story-cine"]=el();
assert.strictEqual(api.introVisible(),true,"director story cinematic must block mobile handoff");
assert.strictEqual(api.primeNight(),false,"Night must not prime underneath authored story cinematic");
assert.strictEqual(api.nightReady(),false,"authored cinematic must leave Night runtime untouched");
elements["good-boys-story-cine"].classList.add("hidden");
assert.strictEqual(api.introVisible(),false);

context.v725.play("other",()=>{});assert.strictEqual(playBaseCalls,1,"non-Good-Boys cinematics must pass through");
context.v725.play("b736m1",()=>{combatCbCalls++;const NM=context.__getWorld();NM._v736={active:"katrin",chars:{katrin:{hp:120},manchez:{hp:120}},partner:{x:40,y:200}};});
flush();
assert.strictEqual(api.nightReady(),true);assert.strictEqual(api.pairReady(),true);assert.strictEqual(context.__goodBoysCoreBroken,null);
assert.ok(context.__goodBoysMobileLaunchState&&context.__goodBoysMobileLaunchState.pair);

let NM={x:100,y:200};context.__setWorld(NM);let S=context.__getState();S.nightMode=NM;combatCbCalls=0;let attachAttempt=0;
context.v725.play("b736m2",()=>{combatCbCalls++;attachAttempt++;if(attachAttempt>=2){const n=context.__getWorld();n._v736={active:"manchez",chars:{katrin:{hp:120},manchez:{hp:120}},partner:{x:50,y:200}};}});flush();
assert.strictEqual(combatCbCalls,2,"pair attach race should receive one idempotent callback retry");assert.strictEqual(api.pairReady(),true);

S={nightMode:false,meta:{_v736:{m:6}}};context.__setState(S);context.__setWorld(null);combatCbCalls=0;
context.v736.start();flush();
assert.strictEqual(resumeStarts,1);assert.strictEqual(context.__getState().meta._v736.m,6);assert.strictEqual(api.pairReady(),true,"Cell 1984 resume must attach Katrin + Manchez");
assert.strictEqual(context.__getWorld()._v736.m,6);assert.ok(context.__goodBoysMobileLaunchState&&context.__goodBoysMobileLaunchState.id==="b736m6");

NM={x:100,y:200};context.__setWorld(NM);S=context.__getState();S.nightMode=NM;combatCbCalls=0;
context.v725.play("b736m3",()=>{combatCbCalls++;});flush();
assert.strictEqual(context.__goodBoysCoreBroken,"pair_attach_failed");assert.ok(elements["good-boys-mobile-recovery"]);assert.ok(elements["gb-mobile-retry"]&&typeof elements["gb-mobile-retry"].onclick==="function");
console.log("Good Boys mobile launch guard/resume lexical runtime: PASS");