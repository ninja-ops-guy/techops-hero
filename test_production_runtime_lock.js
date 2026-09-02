"use strict";
const assert=require("assert"),fs=require("fs"),vm=require("vm");
const src=fs.readFileSync("production_runtime_lock.js","utf8");
const cleared=[];
const context={console,globalThis:null,setInterval(){throw new Error("poll should not be needed when bootstrap is ready");},clearInterval(id){cleared.push(id);}};
context.globalThis=context;
context.TechOpsProductionBootstrap={ready(){return true;}};
context.TechOpsGoodBoysGameplayLoop={timer:11};
context.TechOpsGoodBoysCanon={timer:12};
context.TechOpsGoodDogsProduction={timer:13};
let actorEnforced=0,wrapperEnforced=0;
context.TechOpsGoodDogsActorContract={
  enforce(){actorEnforced++;return true;},
  health(){return{atlasReady:true,atlas:"KATRIN_MANCHEZ",legacyWrapperBlocked:true};}
};
context.TechOpsProductionWrapperGuard={
  enforce(){wrapperEnforced++;return true;},
  health(){return{installed:true,globalDrawAligned:true,globalStepAligned:true};}
};
vm.createContext(context);
vm.runInContext(src,context,{filename:"production_runtime_lock.js"});
assert.ok(context.TechOpsProductionRuntimeLock,"runtime lock must export authority");
assert.strictEqual(context.TechOpsProductionRuntimeLock.VERSION,2);
assert.strictEqual(context.TechOpsProductionRuntimeLock.locked(),true,"runtime lock must engage after ready bootstrap");
assert.deepStrictEqual(cleared.sort((a,b)=>a-b),[11,12,13],"all legacy feature wrapper timers must be cleared");
assert.strictEqual(context.TechOpsGoodBoysGameplayLoop.timer,null);
assert.strictEqual(context.TechOpsGoodBoysCanon.timer,null);
assert.strictEqual(context.TechOpsGoodDogsProduction.timer,null);
assert.ok(actorEnforced>=1,"Good Dogs actor contract must be enforced before final lock");
assert.ok(wrapperEnforced>=1,"single compositor must be re-enforced after timer shutdown");
assert.strictEqual(context.__productionFeatureWrapperTimersStopped,true);
assert.strictEqual(context.__productionRuntimeLockError,null);
assert.strictEqual(context.__productionRuntimeLockVersion,2);
assert.strictEqual(context.__productionRuntimeLockReadyEventSeen,false,"already-ready bootstrap should lock synchronously without waiting for event/watchdog");
console.log("Production runtime lock v2: PASS");
