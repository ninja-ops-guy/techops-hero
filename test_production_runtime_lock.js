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
let enforced=0;
context.TechOpsProductionWrapperGuard={
  enforce(){enforced++;return true;},
  health(){return{installed:true,globalDrawAligned:true,globalStepAligned:true};}
};
vm.createContext(context);
vm.runInContext(src,context,{filename:"production_runtime_lock.js"});
assert.ok(context.TechOpsProductionRuntimeLock,"runtime lock must export authority");
assert.strictEqual(context.TechOpsProductionRuntimeLock.VERSION,1);
assert.strictEqual(context.TechOpsProductionRuntimeLock.locked(),true,"runtime lock must engage after ready bootstrap");
assert.deepStrictEqual(cleared.sort((a,b)=>a-b),[11,12,13],"all legacy feature wrapper timers must be cleared");
assert.strictEqual(context.TechOpsGoodBoysGameplayLoop.timer,null);
assert.strictEqual(context.TechOpsGoodBoysCanon.timer,null);
assert.strictEqual(context.TechOpsGoodDogsProduction.timer,null);
assert.ok(enforced>=1,"single compositor must be re-enforced after timer shutdown");
assert.strictEqual(context.__productionFeatureWrapperTimersStopped,true);
assert.strictEqual(context.__productionRuntimeLockError,null);
console.log("Production runtime lock: PASS");
