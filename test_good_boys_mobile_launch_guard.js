"use strict";
const assert=require("assert"),fs=require("fs"),vm=require("vm");
const src=fs.readFileSync("good_boys_mobile_launch_guard.js","utf8");
const timeouts=[];
function flush(limit=1000){let n=0;while(timeouts.length&&n++<limit){const fn=timeouts.shift();fn();}if(n>=limit)throw new Error("timer runaway");}
function el(){return{classList:{add(){}},remove(){this.removed=true;},style:{},onclick:null,innerHTML:""};}
const elements={};
const body={appendChild(e){elements[e.id]=e;}};
let playBaseCalls=0,combatCbCalls=0;
const context={console,
  setInterval(){return 1;},
  setTimeout(fn){timeouts.push(fn);return timeouts.length;},
  document:{body,createElement(){return el();},getElementById(id){if(id==="gb-mobile-retry"&&elements["good-boys-mobile-recovery"]){return elements[id]||(elements[id]=el());}return elements[id]||null;}},
  S:{nightMode:false,inDialog:true},NM:null,
  drawNM(){},stepNM(){},
  enterNight(){context.S.nightMode=true;context.NM={x:100,y:200};},
  v722:{active(){return false;},skip(){}},
  v725:{play(id,cb){playBaseCalls++;if(cb)cb();return true;}},
  TechOpsGoodBoysCanon:{tick(){}},TechOpsGoodBoysGameplayLoop:{tick(){}},TechOpsGoodDogsProduction:{tick(){}},TechOpsGoodBoysReferenceMechanics:{tick(){}}
};
context.globalThis=context;vm.createContext(context);vm.runInContext(src,context,{filename:"good_boys_mobile_launch_guard.js"});
const api=context.TechOpsGoodBoysMobileLaunchGuard;
assert.ok(api);assert.strictEqual(api.VERSION,2);
assert.strictEqual(api.isGoodBoysCombat("b736m1"),true);assert.strictEqual(api.isGoodBoysCombat("b736m8"),false);
assert.strictEqual(api.nightReady(),false);assert.strictEqual(api.pairReady(),false);

context.v725.play("other",()=>{});assert.strictEqual(playBaseCalls,1,"non-Good-Boys cinematics must pass through");
context.v725.play("b736m1",()=>{combatCbCalls++;context.NM._v736={active:"katrin",chars:{katrin:{hp:120},manchez:{hp:120}},partner:{x:40,y:200}};});
flush();
assert.strictEqual(combatCbCalls,1,"Good Boys callback should execute once Night is ready");
assert.strictEqual(api.nightReady(),true);assert.strictEqual(api.pairReady(),true);
assert.strictEqual(context.__goodBoysCoreBroken,null);
assert.ok(context.__goodBoysMobileLaunchState&&context.__goodBoysMobileLaunchState.pair,"launch telemetry must confirm pair attachment");

// Race case: first combat callback sees Night but fails to attach pair; guard retries once.
context.NM={x:100,y:200};context.S.nightMode=true;combatCbCalls=0;let attachAttempt=0;
context.v725.play("b736m2",()=>{combatCbCalls++;attachAttempt++;if(attachAttempt>=2)context.NM._v736={active:"manchez",chars:{katrin:{hp:120},manchez:{hp:120}},partner:{x:50,y:200}};});
flush();
assert.strictEqual(combatCbCalls,2,"pair attach race should receive one idempotent callback retry");
assert.strictEqual(api.pairReady(),true);assert.strictEqual(context.__goodBoysCoreBroken,null);

// Failure path must show recovery instead of silently leaving generic shell.
context.NM={x:100,y:200};context.S.nightMode=true;combatCbCalls=0;
context.v725.play("b736m3",()=>{combatCbCalls++;});
flush();
assert.strictEqual(context.__goodBoysCoreBroken,"pair_attach_failed");
assert.ok(elements["good-boys-mobile-recovery"],"pair attach failure must create visible recovery UI");
assert.ok(elements["gb-mobile-retry"]&&typeof elements["gb-mobile-retry"].onclick==="function","recovery must expose a working retry action");
console.log("Good Boys mobile launch guard: PASS");
