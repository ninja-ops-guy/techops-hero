"use strict";
const assert=require("assert"),fs=require("fs"),vm=require("vm");
const source=fs.readFileSync("runtime_state_machines.js","utf8");
function boot(extra={}){
  const writes=[],events=[];
  const context=Object.assign({console,Date,JSON,Object,Array,Number,String,Math,
    S:null,NM:null,
    localStorage:{getItem(){return null;},setItem(...args){writes.push(args);},removeItem(...args){writes.push(args);}},
    dispatchEvent(event){events.push(event);},CustomEvent:function(type,options){this.type=type;this.detail=options.detail;}
  },extra);
  context.globalThis=context;vm.createContext(context);vm.runInContext(source,context,{filename:"runtime_state_machines.js"});
  return{context,api:context.TechOpsStateMachines,writes,events};
}
{
  const {api}=boot(),inventory=api.inventory();
  assert.equal(inventory.length,33,"the complete audited machine inventory must be registered");
  assert.equal(new Set(inventory.map(machine=>machine.id)).size,inventory.length,"machine ids must be unique");
  for(const machine of inventory){
    assert.ok(machine.file&&machine.kind&&machine.initial,`${machine.id} metadata`);
    assert.ok(machine.states.includes(machine.initial),`${machine.id} initial state must be registered`);
    for(const [from,events] of Object.entries(machine.transitions)){
      assert.ok(machine.states.includes(from),`${machine.id} has an unknown source state ${from}`);
      for(const [event,target] of Object.entries(events))assert.ok(machine.states.includes(target),`${machine.id} ${from} ${event} targets unknown state ${target}`);
    }
  }
  inventory[0].states.push("mutation-proof");
  assert.equal(api.inventory()[0].states.includes("mutation-proof"),false,"inventory must be a defensive copy");
}
{
  const {api,events}=boot();
  const path=[
    ["idle","intent.capture","intent"],["intent","launch.begin","launch"],["launch","startRun.request","start-run"],
    ["start-run","dispatch.awaiting-confirmation","dispatch"],["dispatch","dispatch.confirmed","start-run"],
    ["start-run","enterNight.request","enter-requested"],["enter-requested","v722.begin","cinematic"],
    ["cinematic","v722.end","mounting"],["mounting","router.ready","ready"],["ready","launch.failed","failed"],
    ["failed","intent.capture","intent"]
  ];
  let current="idle";
  for(const [from,event,target] of path){assert.equal(current,from);const result=api.transition("night-launch",current,event);assert.equal(result.accepted,true,`${from} ${event}`);assert.equal(result.to,target);current=result.to;}
  assert.equal(events.length,path.length,"every accepted transition must be observable");
  const rejected=api.next("night-launch","ready","dispatch.confirmed","launch",{test:true});
  assert.equal(rejected,"launch","compatibility fallback must preserve the legacy target");
  const last=api.history().at(-1);
  assert.equal(last.accepted,false);assert.equal(last.requested,"launch");assert.equal(last.reason,"unexpected-transition");
  assert.equal(api.transition("missing","idle","START").accepted,false,"unknown machines fail closed in strict transition reads");
}
{
  const {api}=boot();
  let current="loading";
  for(const [event,target] of [["runtime.ready","ready"],["launch.requested","launching"],["launch.cancelled","ready"],["launch.failed","failed"],["retry","loading"]]){current=api.next("title-readiness",current,event,current);assert.equal(current,target);}
  for(let index=0;index<180;index++)api.transition("mode-shell","day","ENTER_NIGHT");
  assert.equal(api.history().length,160,"transition history must remain bounded");
  assert.equal(api.clearHistory(),true);assert.equal(api.history().length,0);
}
{
  const campaign=JSON.stringify({campaign:{phase:"day_shift"},investigations:{shipping_cannot_print:{phase:"gather"}}});
  const {api,writes}=boot({
    S:{map:[[0]],meta:{goodDogs:{good_dogs_protocol_complete:false}},nightMode:null},NM:null,
    localStorage:{getItem(key){assert.equal(key,"techops_hero_campaign_v1");return campaign;},setItem(){throw new Error("inspector wrote storage");},removeItem(){throw new Error("inspector cleared storage");}},
    document:{getElementById(){return null;}},
    TechOpsModeShell:{health(){return{mode:"day"};}},
    TechOpsProductionTitleExperience:{state(){return{phase:"ready"};}},
    __productionNightLaunchPhase:"dispatch"
  });
  const snapshot=api.inspect();
  assert.equal(snapshot.machineCount,33);assert.equal(snapshot.machines["title-readiness"].state,"ready");
  assert.equal(snapshot.machines["night-launch"].state,"dispatch");assert.equal(snapshot.machines["run-lifecycle"].state,"day");
  assert.equal(snapshot.machines["campaign-opening"].state,"day_shift");assert.equal(snapshot.machines["campaign-investigation"].state,"gather");
  assert.equal(snapshot.machines["day-case"].state,"context-required","record-owned machines must not be invented from globals");
  assert.doesNotThrow(()=>JSON.stringify(snapshot),"agent snapshots must be serializable");
  assert.deepEqual(writes,[],"inspection must not write storage");
}
{
  const html=fs.readFileSync("index.html","utf8"),router=fs.readFileSync("production_mode_router.js","utf8"),title=fs.readFileSync("production_title_experience.js","utf8");
  const registry=html.indexOf('src="runtime_state_machines.js'),game=html.indexOf('src="game.js'),titleAt=html.indexOf('src="production_title_experience.js');
  assert.ok(registry>=0&&registry<game&&game<titleAt,"the registry must load before game and title consumers");
  assert.match(router,/machines\.next\("night-launch"/);assert.match(title,/machines\.next\("title-readiness"/);
  assert.doesNotMatch(source,/setInterval\s*\(|setTimeout\s*\(|requestAnimationFrame\s*\(/,"the registry must not own a clock");
  assert.doesNotMatch(source,/localStorage\.setItem|localStorage\.removeItem/,"the registry must not write saves");
}
console.log("Runtime state-machine registry, compatibility transitions and read-only inspection: PASS");
