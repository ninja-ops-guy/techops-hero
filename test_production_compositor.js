"use strict";
const assert=require("assert"),fs=require("fs"),vm=require("vm");
const src=fs.readFileSync("production_wrapper_guard.js","utf8");

const context={console,setInterval(){return 1;},clearInterval(){},document:null};
context.globalThis=context;
context.S={nightMode:true,inDialog:false};
context.NM={x:100,y:100};
context.ctx={};
context.drawCount=0;context.stepCount=0;
const finalParserDraw=function(){context.drawCount++;};
const finalParserStep=function(){context.stepCount++;};
context.__techopsFinalParserDrawNM=finalParserDraw;
context.__techopsFinalParserStepNM=finalParserStep;
// Mutable globals deliberately point somewhere else. v6 must trust the explicit
// parser snapshots rather than infer a base from current bindings.
context.drawNM=function mutableDraw(){throw new Error("mutable draw captured")};
context.stepNM=function mutableStep(){throw new Error("mutable step captured")};
vm.createContext(context);
vm.runInContext(src,context,{filename:"production_wrapper_guard.js"});

const guard=context.TechOpsProductionWrapperGuard;
assert.ok(guard,"wrapper guard must export production compositor authority");
assert.ok(guard.VERSION>=6,"immutable parser-chain contract requires guard v6+");
assert.ok(context.drawNM.__productionStableCompositor,"global drawNM must be the stable compositor");
assert.ok(context.stepNM.__productionStableCompositor,"global stepNM must be the stable compositor");
assert.strictEqual(guard.health().globalDrawAligned,true,"lexical/global draw authority must stay aligned");
assert.strictEqual(guard.health().globalStepAligned,true,"lexical/global step authority must stay aligned");
assert.strictEqual(guard.health().baseSource,"final-parser","compositor must prefer explicit final parser chain");
assert.strictEqual(context.__techopsWrapperGuardInstalled,true,"browser telemetry marker must be set on install");

const stableDraw=context.drawNM,stableStep=context.stepNM;
stableDraw();stableStep();
assert.strictEqual(context.drawCount,1,"stable draw must call immutable parser base exactly once");
assert.strictEqual(context.stepCount,1,"stable step must call immutable parser base exactly once");

context.drawNM=function badDraw(){return context.drawNM();};
context.stepNM=function badStep(){return context.stepNM();};
guard.enforce();
assert.strictEqual(context.drawNM,stableDraw,"enforce must restore stable global drawNM");
assert.strictEqual(context.stepNM,stableStep,"enforce must restore stable global stepNM");
assert.strictEqual(guard.health().globalDrawAligned,true);
assert.strictEqual(guard.health().globalStepAligned,true);

console.log("Production immutable parser compositor: PASS");
