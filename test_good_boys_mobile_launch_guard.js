"use strict";
const assert=require("assert"),fs=require("fs"),vm=require("vm");
const src=fs.readFileSync("good_boys_mobile_launch_guard.js","utf8");
const timeouts=[];
function flush(limit=2000){let n=0;while(timeouts.length&&n++<limit){const fn=timeouts.shift();fn();}if(n>=limit)throw new Error("timer runaway");}
function classes(){const s=new Set();return{add(v){s.add(v);},remove(v){s.delete(v);},contains(v){return s.has(v);}};}
function el(){return{classList:classes(),dataset:{},remove(){this.removed=true;},style:{},onclick:null,innerHTML:""};}
const elements={};elements["title-screen"]=el();elements["title-screen"].classList.add("hidden");elements["touch-ui"]=el();elements.hud=el();
const body={appendChild(e){elements[e.id]=e;}};
let playBaseCalls=0,combatCbCalls=0,resumeStarts=0;
const context={console,Date,
  setInterval(){return 1;},clearInterval(){},
  setTimeout(fn){timeouts.push(fn);return timeouts.length;},
  document:{body,createElement(){return el();},getElementById(id){if(id==="gb-mobile-retry"&&elements["good-boys-mobile-recovery"]){return elements[id]||(elements[id]=el());}return elements[id]||null;}},
  S:{nightMode:false,inDialog:true,meta:{_v736:{m:1,done:false}}},NM:null,
  drawNM(){},stepNM(){},
  enterNight(){context.S.nightMode=true;context.NM={x:100,y:200};},
  v722:{active(){return false;},skip(){}},
  v725:{play(id,cb){playBaseCalls++;if(cb)cb();return true;}},
  v736:{start(){resumeStarts++;const m=context.S.meta._v736.m;context.v725.play("b736m"+m,()=>{combatCbCalls++;context.NM._v736={m,active:"katrin",chars:{katrin:{hp:120},manchez:{hp:120}},partner:{x:40,y:200}};});}},
  TechOpsGoodBoysCanon:{tick(){}},TechOpsGoodBoysGameplayLoop:{tick(){}},TechOpsGoodDogsProduction:{tick(){}},TechOpsGoodBoysReferenceMechanics:{tick(){}}
};
context.globalThis=context;vm.createContext(context);vm.runInContext(src,context,{filename:"good_boys_mobile_launch_guard.js"});
const api=context.TechOpsGoodBoysMobileLaunchGuard;
assert.ok(api);assert.strictEqual(api.VERSION,3);
assert.strictEqual(api.isGoodBoysCombat("b736m1"),true);assert.strictEqual(api.isGoodBoysCombat("b736m7"),true);assert.strictEqual(api.isGoodBoysCombat("b736m8"),false);
assert.strictEqual(api.nightReady(),false);assert.strictEqual(api.pairReady(),false);

context.v725.play("other",()=>{});assert.strictEqual(playBaseCalls,1,"non-Good-Boys cinematics must pass through");
context.v725.play("b736m1",()=>{combatCbCalls++;context.NM._v736={active:"katrin",chars:{katrin:{hp:120},manchez:{hp:120}},partner:{x:40,y:200}};});
flush();
assert.strictEqual(api.nightReady(),true);assert.strictEqual(api.pairReady(),true);
assert.strictEqual(context.__goodBoysCoreBroken,null);
assert.ok(context.__goodBoysMobileLaunchState&&context.__goodBoysMobileLaunchState.pair);

// Race case: first callback sees Night but fails to attach pair; retry once.
context.NM={x:100,y:200};context.S.nightMode=true;combatCbCalls=0;let attachAttempt=0;
context.v725.play("b736m2",()=>{combatCbCalls++;attachAttempt++;if(attachAttempt>=2)context.NM._v736={active:"manchez",chars:{katrin:{hp:120},manchez:{hp:120}},partner:{x:50,y:200}};});
flush();
assert.strictEqual(combatCbCalls,2,"pair attach race should receive one idempotent callback retry");
assert.strictEqual(api.pairReady(),true);

// Direct resume from Cell 1984 must go through the guarded start path and attach the pair.
context.NM=null;context.S.nightMode=false;context.S.meta._v736.m=6;combatCbCalls=0;
context.v736.start();flush();
assert.strictEqual(resumeStarts,1,"guarded v736.start must preserve the legacy start call");
assert.strictEqual(context.S.meta._v736.m,6);
assert.strictEqual(api.pairReady(),true,"Cell 1984 resume must attach Katrin + Manchez");
assert.strictEqual(context.NM._v736.m,6);
assert.ok(context.__goodBoysMobileLaunchState&&context.__goodBoysMobileLaunchState.id==="b736m6","resume telemetry must identify M6");

// Failure path must show recovery instead of silently leaving generic shell.
context.NM={x:100,y:200};context.S.nightMode=true;combatCbCalls=0;
context.v725.play("b736m3",()=>{combatCbCalls++;});flush();
assert.strictEqual(context.__goodBoysCoreBroken,"pair_attach_failed");
assert.ok(elements["good-boys-mobile-recovery"],"pair attach failure must create visible recovery UI");
assert.ok(elements["gb-mobile-retry"]&&typeof elements["gb-mobile-retry"].onclick==="function","recovery must expose a working retry action");
console.log("Good Boys mobile launch guard/resume: PASS");
