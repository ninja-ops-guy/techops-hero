"use strict";
const assert=require("assert"),fs=require("fs"),vm=require("vm");
const src=fs.readFileSync("production_wrapper_guard.js","utf8");

const context={console,setInterval(){return 1;},clearInterval(){},document:null};
context.globalThis=context;
context.S={nightMode:true,inDialog:false};
context.NM={x:100,y:100};
context.ctx={};
context.drawCount=0;context.stepCount=0;
context.drawNM=function(){context.drawCount++;};
context.stepNM=function(){context.stepCount++;};
vm.createContext(context);
vm.runInContext(src,context,{filename:"production_wrapper_guard.js"});

const guard=context.TechOpsProductionWrapperGuard;
assert.ok(guard,"wrapper guard must export production compositor authority");
assert.ok(guard.VERSION>=5,"single-compositor contract requires guard v5+");
assert.ok(context.drawNM.__productionStableCompositor,"global drawNM must be the stable compositor");
assert.ok(context.stepNM.__productionStableCompositor,"global stepNM must be the stable compositor");
assert.strictEqual(guard.health().globalDrawAligned,true,"lexical/global draw authority must stay aligned");
assert.strictEqual(guard.health().globalStepAligned,true,"lexical/global step authority must stay aligned");

const stableDraw=context.drawNM,stableStep=context.stepNM;
stableDraw();stableStep();
assert.strictEqual(context.drawCount,1,"stable draw must call immutable base exactly once");
assert.strictEqual(context.stepCount,1,"stable step must call immutable base exactly once");

// Simulate a late feature trying to replace the global bindings. enforce() must
// restore the same compositor rather than wrapping/capturing the replacement.
context.drawNM=function badDraw(){return context.drawNM();};
context.stepNM=function badStep(){return context.stepNM();};
guard.enforce();
assert.strictEqual(context.drawNM,stableDraw,"enforce must restore stable global drawNM");
assert.strictEqual(context.stepNM,stableStep,"enforce must restore stable global stepNM");
assert.strictEqual(guard.health().globalDrawAligned,true);
assert.strictEqual(guard.health().globalStepAligned,true);

console.log("Production single compositor: PASS");
