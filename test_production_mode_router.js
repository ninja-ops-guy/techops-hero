"use strict";
const assert=require("assert"),fs=require("fs"),vm=require("vm");
const src=fs.readFileSync("production_mode_router.js","utf8");
const q=[];function flush(limit=2000){let n=0;while(q.length&&n++<limit)q.shift()();if(n>=limit)throw new Error("timer runaway");}
const styles={};
function el(initialHidden=false){
  const classes=new Set(initialHidden?["hidden"]:[]);
  return{
    style:{setProperty(k,v){styles[k]=v;this[k]=v;},removeProperty(k){delete this[k];}},
    textContent:"",
    classList:{add(k){classes.add(k);},remove(k){classes.delete(k);},contains(k){return classes.has(k);}},
    addEventListener(){}
  };
}
const elements={hud:el(),"touch-ui":el(true),dialogue:el(true),panel:el(),battle:el(),eod:el(),"title-screen":el(),"btn-start":el()};
let enterCalls=0,startCalls=0,v736Calls=0;
const context={console,setInterval(){return 1;},clearInterval(){},setTimeout(fn){q.push(fn);return q.length;},isFinite,
  localStorage:{data:{},setItem(k,v){this.data[k]=v;},getItem(k){return this.data[k]||null;},removeItem(k){delete this.data[k];}},
  document:{getElementById(id){return elements[id]||null;},addEventListener(){}},
  getComputedStyle(node){return{display:node&&node.style&&node.style.display||"block",visibility:"visible",opacity:"1"};},
  S:null,NM:null,drawNM(){},stepNM(){},
  startRun(){startCalls++;if(!context.S)context.S={nightMode:false,clock:540,meta:{},inDialog:false};context.S.map=[[0]];context.S.inDialog=false;elements.dialogue.classList.add("hidden");},
  enterNight(){enterCalls++;context.S.nightMode=true;context.NM={x:100,y:220};},
  v736:{start(){v736Calls++;if(!context.S)context.S={nightMode:false,meta:{_v736:{m:6}},inDialog:false};if(!context.S.nightMode)context.enterNight();context.NM._v736={active:"katrin",chars:{katrin:{hp:120},manchez:{hp:120}},partner:{x:60,y:220}};}},
  TechOpsGoodBoysGameplayLoop:{tick(){}},TechOpsGoodDogsProduction:{tick(){}},TechOpsGoodBoysReferenceMechanics:{tick(){}},TechOpsGoodBoysCanon:{tick(){}},TechOpsNightReferenceVisuals:{install(){}},TechOpsProductionWrapperGuard:{enforce(){}}
};
elements["btn-start"].click=function(){context.S={nightMode:false,clock:540,meta:{},inDialog:true};elements.dialogue.classList.remove("hidden");};
context.globalThis=context;vm.createContext(context);vm.runInContext(src,context,{filename:"production_mode_router.js"});
const api=context.TechOpsProductionModeRouter;assert.ok(api);assert.ok(api.VERSION>=7,`production mode router must retain v7+ authority, found v${api.VERSION}`);
context.__productionModeRouterError="stale";api.setDesired("nightcrawler");api.launchNightCrawler();
assert.ok(context.S,"canonical title click must create state before difficulty selection");
assert.strictEqual(context.S.map,undefined,"Night entry must wait for the canonical difficulty selection to initialize the run");
assert.strictEqual(enterCalls,0,"Night entry cannot bypass the canonical difficulty selection");
assert.notStrictEqual(elements.dialogue.style.display,"none","router must keep the difficulty dialogue visible until startRun initializes S.map");
context.startRun();flush();
assert.ok(context.S.nightMode,"Night Crawler launch must end in night mode");assert.ok(context.NM,"Night Crawler launch must create Night world");assert.strictEqual(context.S.inDialog,false,"Night launch must clear the CIO/dialogue input lock before stepNM");assert.strictEqual(context.S.meta._char,"nightcrawler");assert.strictEqual(context.localStorage.getItem("techops_char"),"nightcrawler");assert.ok(enterCalls>=1);assert.strictEqual(context.__productionModeRouterError,null,"successful Night launch clears stale errors");
assert.strictEqual(startCalls,1,"difficulty selection must initialize the canonical run exactly once");

// Reset the mocked legacy dialogue to visible to prove the Good Boys handoff also
// clears a real blocking shell instead of benefiting from the previous launch.
elements.dialogue.classList.remove("hidden");
context.S={nightMode:false,meta:{_v736:{m:6}},inDialog:true};context.NM=null;context.__productionModeRouterError="good_boys_pair_timeout";api.launchGoodBoys();flush();
assert.ok(context.S.nightMode,"Good Boys resume must enter Night engine");assert.ok(api.pairReady(),"Good Boys resume must attach Katrin and Manchez");assert.strictEqual(context.S.inDialog,false,"Good Boys handoff must not leave a hidden dialog blocking pair input");assert.ok(v736Calls>=1);assert.strictEqual(context.localStorage.getItem("techops_char"),null,"Good Boys cannot inherit Night Crawler character selection");assert.strictEqual(context.__productionModeRouterError,null,"successful pair attach clears stale timeout telemetry");

const raw=src.toUpperCase();assert.ok(raw.includes("NIGHT CRAWLER"));assert.ok(raw.includes("118/1984"));assert.ok(raw.includes("GOOD_BOYS_PAIR_TIMEOUT"));assert.ok(raw.includes("CLEARBLOCKINGDIALOG"));assert.ok(src.includes('typeof S!=="undefined"'));assert.ok(src.includes('typeof NM!=="undefined"'));assert.ok(src.includes("never calls feature tick()"),"v7+ router must not re-enter feature wrapper installers");assert.ok(src.includes("defers authored Good Boys title-button launches to the campaign director"),"v7+ router must preserve single-authority title launch routing");assert.ok(!src.includes('root.NM&&'));
console.log(`Production mode router v${api.VERSION} input/coop regression: PASS`);
