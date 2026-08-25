"use strict";
const assert=require("assert"),fs=require("fs"),vm=require("vm");
const src=fs.readFileSync("production_mode_router.js","utf8");
const q=[];function flush(limit=2000){let n=0;while(q.length&&n++<limit)q.shift()();if(n>=limit)throw new Error("timer runaway");}
const styles={};function el(){return{style:{setProperty(k,v){styles[k]=v;},removeProperty(){}},textContent:"",classList:{add(){},remove(){}},addEventListener(){}};}
const elements={hud:el(),"touch-ui":el(),dialogue:el(),panel:el(),battle:el(),eod:el()};
let enterCalls=0,startCalls=0,v736Calls=0;
const context={console,setInterval(){return 1;},clearInterval(){},setTimeout(fn){q.push(fn);return q.length;},isFinite,
  localStorage:{data:{},setItem(k,v){this.data[k]=v;},getItem(k){return this.data[k]||null;},removeItem(k){delete this.data[k];}},
  document:{getElementById(id){return elements[id]||null;},addEventListener(){}},
  S:null,NM:null,drawNM(){},stepNM(){},
  startRun(){startCalls++;context.S={nightMode:false,clock:540,meta:{}};},
  enterNight(){enterCalls++;context.S.nightMode=true;context.NM={x:100,y:220};},
  v736:{start(){v736Calls++;if(!context.S)context.S={nightMode:false,meta:{_v736:{m:6}}};if(!context.S.nightMode)context.enterNight();context.NM._v736={active:"katrin",chars:{katrin:{hp:120},manchez:{hp:120}},partner:{x:60,y:220}};}},
  TechOpsGoodBoysGameplayLoop:{tick(){}},TechOpsGoodDogsProduction:{tick(){}},TechOpsGoodBoysReferenceMechanics:{tick(){}},TechOpsGoodBoysCanon:{tick(){}},TechOpsNightReferenceVisuals:{install(){}},TechOpsProductionWrapperGuard:{enforce(){}}
};
context.globalThis=context;vm.createContext(context);vm.runInContext(src,context,{filename:"production_mode_router.js"});
const api=context.TechOpsProductionModeRouter;assert.ok(api);assert.strictEqual(api.VERSION,3);
context.__productionModeRouterError="stale";api.setDesired("nightcrawler");api.launchNightCrawler();flush();
assert.ok(context.S.nightMode,"Night Crawler launch must end in night mode");assert.ok(context.NM,"Night Crawler launch must create Night world");assert.strictEqual(context.S.meta._char,"nightcrawler");assert.strictEqual(context.localStorage.getItem("techops_char"),"nightcrawler");assert.ok(enterCalls>=1);assert.strictEqual(context.__productionModeRouterError,null,"successful Night launch clears stale errors");

context.S={nightMode:false,meta:{_v736:{m:6}}};context.NM=null;context.__productionModeRouterError="good_boys_pair_timeout";api.launchGoodBoys();flush();
assert.ok(context.S.nightMode,"Good Boys resume must enter Night engine");assert.ok(api.pairReady(),"Good Boys resume must attach Katrin and Manchez");assert.ok(v736Calls>=1);assert.strictEqual(context.localStorage.getItem("techops_char"),null,"Good Boys cannot inherit Night Crawler character selection");assert.strictEqual(context.__productionModeRouterError,null,"successful pair attach clears stale timeout telemetry");

const raw=src.toUpperCase();assert.ok(raw.includes("NIGHT CRAWLER"));assert.ok(raw.includes("118/1984"));assert.ok(raw.includes("GOOD_BOYS_PAIR_TIMEOUT"));assert.ok(src.includes('typeof S!=="undefined"'));assert.ok(src.includes('typeof NM!=="undefined"'));assert.ok(!src.includes('return root.S||null'));assert.ok(!src.includes('root.NM&&'));
console.log("Production mode router v3 lexical-runtime regression: PASS");
