"use strict";
const assert=require("assert");
const fs=require("fs");
const flight=fs.readFileSync("good_boys_ship_flight.js","utf8");
const shim=fs.readFileSync("good_boys_ship_approach.js","utf8");
const deck=fs.readFileSync("good_boys_ship_deck_scene.js","utf8");
const hard=fs.readFileSync("good_boys_button_hard_fix.js","utf8");
const handoff=fs.readFileSync("good_boys_handoff_ui_patch.js","utf8");
const registry=fs.readFileSync("production_asset_registry.js","utf8");
const boot=fs.readFileSync("production_bootstrap.js","utf8");
for(const [name,source] of [["flight",flight],["shim",shim],["deck",deck],["hard",hard],["handoff",handoff],["registry",registry]]) assert.doesNotThrow(()=>new Function(source),`${name} must parse`);
assert.ok(flight.includes("GOOD_BOYS_SHIP_ARCADE"),"canonical flight must own the supplied atlas contract");
assert.ok(flight.includes("assets/good_boys/good_ship_arcade.atlas.png"),"canonical flight must load the supplied Good Ship atlas");
for(const key of ["ship_player","asteroid_1","asteroid_2","asteroid_3","asteroid_4","asteroid_5","prison_station","prison_dock","lead_1","lead_2","lead_3","lead_4"]){assert.ok(flight.includes(key),`canonical flight missing supplied frame ${key}`);}
assert.ok(flight.includes("AVOID ASTEROIDS")&&flight.includes("REACH BLACKSITE MERIDIAN"),"production flight must expose the authored avoidance objective and prison vector");
assert.ok(flight.includes("runBoardingSequence") && flight.includes("showCrashScene()"),"production flight must hand off to the authored crash");
assert.ok(flight.includes("boarded-secret-ship")&&flight.includes("m2-board-flight-crash-complete"),"production flight must own the real M2 -> M3 handoff");
assert.ok(flight.includes("resetBoard()")&&flight.includes("asset-error"),"asset failure must be visible in diagnostics while allowing boarding to retry");
assert.ok(!flight.includes("pixelShip("),"canonical player ship must never fall back to procedural rectangles");
assert.ok(!flight.includes("assets/v742/cutscenes/orbital_approach.png"),"canonical flight must not render the old prison plate as gameplay authority");
assert.ok(!flight.includes("assets/v742/cutscenes/secret_ship_interior.png"),"canonical flight must not render the old ship interior as the player craft");
assert.ok(boot.includes('"good_boys_ship_flight.js"'),"production bootstrap must load the authoritative ship flight");
assert.ok(boot.includes("TechOpsGoodBoysShipFlight")&&boot.includes(".install()"),"production bootstrap must install the authoritative ship flight");
assert.ok(shim.includes("compatibility shim")&&shim.includes("TechOpsGoodBoysShipFlight"),"legacy approach module must delegate to the production flight");
assert.ok(!shim.includes('id===\"GD_CUT_02\"')&&!shim.includes("GoodDogsCutscenes.play"),"legacy approach module must not retain a second cinematic/flight interception point");

// Cockpit gameplay must use the extracted pilot art and require movement/proximity.
assert.ok(deck.includes("assets/v736/good_boys_ship/cockpit_pilot.jpg"),"cockpit must render the supplied pilot asset");
assert.ok(deck.includes("KATRIN_MANCHEZ"),"cockpit dogs must come from the canonical dog atlas");
assert.ok(deck.includes("nearPilot")&&deck.includes("playerX")&&deck.includes("pilotX"),"cockpit must model player-to-pilot proximity");
assert.ok(deck.includes("arrowleft")&&deck.includes("arrowright")&&deck.includes("pointerdown"),"cockpit must support keyboard and touch movement");
assert.ok(deck.includes('interaction:\"pilot\"'),"cockpit interaction must resolve against the pilot, not a generic station");
assert.ok(!deck.includes('grid-template-columns:1fr;gap:8px\";\n      controls.innerHTML=\'<button'),"cockpit must not regress to the giant one-button interaction layout");

// Fresh title launch preserves playable M1/M2; the boarding owner drives flight.
assert.ok(hard.includes("freshConfig(){return{mission:1"),"fresh launch must preserve the playable opening missions");
assert.ok(flight.includes('c.play("GD_CUT_02"')&&flight.includes("flightPromise()"),"boarding must own takeover and flight");
assert.ok(!hard.includes('playMovie("GD_CUT_03"'),"retired second approach movie must not return");
assert.ok(handoff.includes("TechOpsGoodBoysButtonHardFix"),"handoff capture must delegate to title authority");
assert.ok(!handoff.includes("repair.playOpening()"),"handoff must not retain a competing opening path");
assert.ok(registry.includes("assets/v736/good_boys_ship/cockpit_pilot.jpg"),"registry must preload the pilot");
console.log("Good Boys canonical supplied-asset ship/cockpit opening: PASS");

// Exercise the production flight owner, including failed browser image loads and
// a stalled animation clock. A recovered BOARD action must not sit underneath a
// leftover full-screen flight, and expired callbacks must not complete a retry.
const vm=require("vm");
function flightHarness(){
  const nodes=new Map(),timers=new Map(),frames=new Map(),images=[],events=new Map(),docEvents=new Map(),results=[],ends=[];
  let nextId=1,clock=0,resets=0,crashes=0;
  const ctx=new Proxy({createLinearGradient:()=>({addColorStop(){}})},{get(target,key){return target[key]||(target[key]=()=>{});}});
  function element(tag){
    const children=new Map();
    return {tag,style:{},dataset:{},parentNode:null,textContent:"",addEventListener(){},appendChild(node){node.parentNode=this;},
      remove(){if(this.id&&nodes.get(this.id)===this)nodes.delete(this.id);this.parentNode=null;this.isConnected=false;},
      focus(){root.document.activeElement=this;},isConnected:true,
      querySelector(selector){if(!children.has(selector))children.set(selector,element(selector));return children.get(selector);},
      querySelectorAll(selector){return selector==="[data-dir]"?[]:[this.querySelector("[data-boost]")];},
      getContext(){return ctx;}};
  }
  const root={console,Date,Math,Object,Array,Number,String,Promise,performance:{now:()=>clock},matchMedia:()=>({matches:false}),
    document:{createElement:element,getElementById:id=>nodes.get(id)||null,hidden:false,activeElement:null,
      addEventListener(name,fn){if(!docEvents.has(name))docEvents.set(name,new Set());docEvents.get(name).add(fn);},removeEventListener(name,fn){if(docEvents.has(name))docEvents.get(name).delete(fn);},
      body:{appendChild(node){node.parentNode=this;nodes.set(node.id,node);}}},
    Image:class{constructor(){this.complete=false;this.naturalWidth=0;images.push(this);}set src(value){this._src=value;}},
    setTimeout(fn,ms){const id=nextId++;timers.set(id,{fn,ms});return id;},clearTimeout:id=>timers.delete(id),
    setInterval(){return nextId++;},clearInterval(){},
    requestAnimationFrame(fn){const id=nextId++;frames.set(id,fn);return id;},cancelAnimationFrame:id=>frames.delete(id),
    addEventListener(name,fn){if(!events.has(name))events.set(name,new Set());events.get(name).add(fn);},
    removeEventListener(name,fn){if(events.has(name))events.get(name).delete(fn);},
    S:{meta:{_v736:{m:2}}},NM:{_v736:{m:2,_gbBoardRequested:true}},
    GoodDogsCutscenes:{play:async()=>({status:"COMPLETED"})},
    TechOpsGoodBoysOpeningV4:{showDeckInteraction:async()=>({completed:true}),showCrashScene:async()=>{crashes++;return{completed:true};}},
    TechOpsGoodBoysBoardShipAction:{reset(){resets++;}},
    TechOpsPresentationDirector:{begin:()=>({id:"boarding"}),end:(token,result)=>ends.push(result)},save(){}}
  root.globalThis=root;vm.createContext(root);vm.runInContext(flight,root);
  return {root,nodes,timers,frames,images,results,ends,events,docEvents,ship:root.TechOpsGoodBoysShipFlight,
    get resets(){return resets;},get crashes(){return crashes;},
    board(){return this.ship.runBoardingSequence(result=>results.push(result));},
    image(ok){const image=images[images.length-1];image.complete=true;image.naturalWidth=ok?768:0;image.naturalHeight=ok?620:0;(ok?image.onload:image.onerror)();return image;},
    timer(ms){const entry=Array.from(timers).find(([,timer])=>timer.ms===ms);assert.ok(entry,"expected timer "+ms);timers.delete(entry[0]);entry[1].fn();},
    frame(at){const entry=frames.entries().next().value;assert.ok(entry,"expected animation frame");frames.delete(entry[0]);clock=at;entry[1](at);return entry[1];}};
}
const flush=()=>new Promise(resolve=>setImmediate(resolve));
(async()=>{
  const failed=flightHarness();
  assert.strictEqual(failed.board(),true);await flush();
  failed.image(false);await flush();
  assert.strictEqual(failed.results.length,1,"asset failure settles boarding exactly once");
  assert.strictEqual(failed.results[0].completed,false);
  assert.strictEqual(failed.ship.active(),false,"failed flight releases its active ownership");
  assert.strictEqual(failed.nodes.has("good-boys-ship-flight"),false,"asset failure must uncover the recovered BOARD action");
  assert.strictEqual(failed.resets,1);assert.deepStrictEqual(failed.ends,["error"]);
  assert.strictEqual(failed.root.S.meta._v736.m,2,"failed flight preserves M2");
  assert.strictEqual(failed.root.NM._v736._gbBoardSequenceComplete,undefined);
  assert.strictEqual(failed.crashes,0,"failed flight cannot start the crash or mark progression");
  assert.strictEqual(failed.frames.size,0);
  assert.strictEqual(failed.board(),true,"BOARD remains retryable after an image failure");await flush();
  failed.image(true);await flush();failed.frame(8200);await flush();
  assert.strictEqual(failed.results.length,2);assert.strictEqual(failed.results[1].completed,true);
  assert.strictEqual(failed.crashes,1);assert.deepStrictEqual(failed.ends,["error","completed"]);

  const stalled=flightHarness();
  assert.strictEqual(stalled.board(),true);await flush();stalled.image(true);await flush();
  const expiredFrame=stalled.frames.values().next().value;
  stalled.timer(30000);await flush();
  assert.strictEqual(stalled.results.length,1);assert.match(stalled.results[0].error,/timed out/);
  assert.strictEqual(stalled.ship.active(),false,"timeout must cancel the active flight so BOARD can retry");
  assert.strictEqual(stalled.nodes.has("good-boys-ship-flight"),false,"timeout must remove the input-blocking overlay");
  assert.strictEqual(stalled.frames.size,0,"timeout must cancel the pending animation frame");
  assert.strictEqual(stalled.root.S.meta._v736.m,2);assert.strictEqual(stalled.crashes,0);
  assert.strictEqual(stalled.board(),true);await flush();
  expiredFrame(9000);await flush();
  assert.strictEqual(stalled.results.length,1,"a callback from the expired flight cannot settle the new BOARD attempt");
  assert.strictEqual(stalled.ship.active(),true);assert.strictEqual(stalled.crashes,0);
  stalled.frame(8200);await flush();
  assert.strictEqual(stalled.results.length,2);assert.strictEqual(stalled.results[1].completed,true);
  expiredFrame(10000);await flush();
  assert.strictEqual(stalled.results.length,2,"late callbacks cannot duplicate settlement");
  assert.strictEqual(stalled.crashes,1);assert.strictEqual(stalled.resets,1);
  assert.strictEqual(stalled.nodes.has("good-boys-ship-flight"),false);

  const loading=flightHarness();
  assert.strictEqual(loading.board(),true);await flush();
  const expiredImage=loading.images[0],expiredLoad=expiredImage.onload,expiredError=expiredImage.onerror;
  loading.timer(30000);await flush();
  assert.strictEqual(loading.timers.size,0,"settling a flight cancels its unresolved asset watchdog");
  assert.strictEqual(loading.board(),true);await flush();
  const retryState=JSON.stringify(loading.ship.telemetry());
  expiredImage.complete=true;expiredImage.naturalWidth=768;expiredLoad();expiredError();await flush();
  assert.strictEqual(JSON.stringify(loading.ship.telemetry()),retryState,"expired loader callbacks cannot overwrite retry telemetry");
  assert.strictEqual(loading.frames.size,0,"expired asset completion cannot start the retry animation");
  loading.image(true);await flush();loading.frame(8200);await flush();
  assert.strictEqual(loading.results.length,2);assert.strictEqual(loading.results[1].completed,true);

  const waiting=flightHarness();let finishDeck;
  waiting.root.TechOpsGoodBoysOpeningV4.showDeckInteraction=()=>new Promise(resolve=>{finishDeck=resolve;});
  assert.strictEqual(waiting.board(),true);await flush();
  assert.strictEqual(waiting.timers.size,0,"flight watchdog must not time out a player-owned cockpit interaction");
  assert.strictEqual(waiting.results.length,0);
  finishDeck({completed:true});await flush();waiting.image(true);await flush();waiting.frame(8200);await flush();
  assert.strictEqual(waiting.results.length,1);assert.strictEqual(waiting.results[0].completed,true);

  for(const failure of ["error","empty-load"]){
    const cockpit=flightHarness();vm.runInContext(deck,cockpit.root);
    assert.strictEqual(cockpit.board(),true);await flush();
    const pilot=cockpit.images.find(image=>/cockpit_pilot/.test(image._src));
    assert.ok(pilot,"boarding mounted the real cockpit pilot loader");
    const lateLoad=pilot.onload,lateError=pilot.onerror;
    if(failure==="error")pilot.onerror();else pilot.onload();
    await flush();
    assert.strictEqual(cockpit.results.length,1,failure+" must settle the cockpit and release BOARD");
    assert.strictEqual(cockpit.results[0].completed,false);
    assert.strictEqual(cockpit.nodes.has("good-boys-deck-supplied"),false);
    assert.strictEqual(cockpit.frames.size,0,"failed cockpit cancels its animation loop");
    assert.strictEqual(cockpit.events.get("keydown").size,1,"only the flight owner's persistent keyboard listener remains");
    assert.strictEqual(cockpit.events.get("keyup").size,1);
    assert.strictEqual(cockpit.ship.active(),false);assert.strictEqual(cockpit.resets,1);
    assert.strictEqual(cockpit.root.S.meta._v736.m,2);assert.strictEqual(cockpit.crashes,0);
    assert.strictEqual(cockpit.board(),true);await flush();
    const retryHost=cockpit.nodes.get("good-boys-deck-supplied"),retryTelemetry=cockpit.root.__goodBoysDeckInteract;
    pilot.naturalWidth=620;lateLoad();lateError();await flush();
    assert.strictEqual(cockpit.nodes.get("good-boys-deck-supplied"),retryHost,"expired image callbacks cannot remove the new cockpit");
    assert.strictEqual(cockpit.root.__goodBoysDeckInteract,retryTelemetry,"expired image callbacks cannot overwrite retry state");
    assert.strictEqual(cockpit.results.length,1);
    const retryPilot=cockpit.images[cockpit.images.length-1];retryPilot.naturalWidth=620;retryPilot.onload();
    const key={key:"ArrowRight",preventDefault(){},stopPropagation(){}};
    for(const listener of cockpit.events.get("keydown"))listener(key);
    for(let i=1;i<=10;i++)cockpit.frame(i*34);
    for(const listener of cockpit.events.get("keyup"))listener(key);
    for(const listener of cockpit.events.get("keydown"))listener({...key,key:"Enter"});
    await flush();cockpit.image(true);await flush();cockpit.frame(8540);await flush();
    assert.strictEqual(cockpit.results.length,2);assert.strictEqual(cockpit.results[1].completed,true);
    assert.strictEqual(cockpit.crashes,1);assert.strictEqual(cockpit.resets,1);
  }
  const neverLoads=flightHarness();vm.runInContext(deck,neverLoads.root);
  assert.strictEqual(neverLoads.board(),true);await flush();
  neverLoads.timer(12000);await flush();
  assert.strictEqual(neverLoads.results.length,1);assert.strictEqual(neverLoads.results[0].completed,false);
  assert.strictEqual(neverLoads.root.__goodBoysPilotAssetError.reason,"timeout");
  assert.strictEqual(neverLoads.nodes.has("good-boys-deck-supplied"),false);assert.strictEqual(neverLoads.frames.size,0);assert.strictEqual(neverLoads.timers.size,0);
  assert.strictEqual(neverLoads.events.get("blur").size,0);assert.strictEqual(neverLoads.docEvents.get("visibilitychange").size,0);
  assert.strictEqual(neverLoads.board(),true,"a never-settling pilot request must leave BOARD retryable");await flush();
  neverLoads.image(true);await flush();
  assert.strictEqual(neverLoads.timers.size,0,"successful pilot loading retires its watchdog");

  const lifecycle=flightHarness();vm.runInContext(deck,lifecycle.root);
  const previous={isConnected:true,focus(){this.restored=true;}};lifecycle.root.document.activeElement=previous;
  assert.strictEqual(lifecycle.board(),true);await flush();lifecycle.image(true);
  const host=lifecycle.nodes.get("good-boys-deck-supplied");assert.strictEqual(lifecycle.root.document.activeElement,host,"cockpit owns keyboard focus");
  const right={key:"ArrowRight",preventDefault(){},stopPropagation(){}};
  for(const listener of lifecycle.events.get("keydown"))listener(right);lifecycle.frame(34);lifecycle.frame(68);
  const moved=lifecycle.root.__goodBoysDeckInteract.playerX;
  for(const listener of lifecycle.events.get("blur"))listener();lifecycle.frame(102);
  assert.strictEqual(lifecycle.root.__goodBoysDeckInteract.playerX,moved,"blur clears held movement before the next frame");
  for(const listener of lifecycle.events.get("keydown"))listener(right);lifecycle.root.document.hidden=true;
  for(const listener of lifecycle.docEvents.get("visibilitychange"))listener();lifecycle.frame(136);lifecycle.frame(10000);
  assert.strictEqual(lifecycle.root.__goodBoysDeckInteract.playerX,moved,"background frames cannot advance cockpit position");
  for(const listener of lifecycle.events.get("keydown"))listener({...right,key:"Enter"});
  assert.strictEqual(lifecycle.results.length,0,"hidden cockpit cannot advance the mission");
  lifecycle.root.document.hidden=false;for(const listener of lifecycle.events.get("keydown"))listener(right);for(let i=0;i<8;i++)lifecycle.frame(10034+i*34);
  assert.strictEqual(lifecycle.root.__goodBoysDeckInteract.nearPilot,true,"resumed keyboard movement reaches the pilot");
  for(const listener of lifecycle.events.get("keyup"))listener(right);for(const listener of lifecycle.events.get("keydown"))listener({...right,key:"Enter"});await flush();await flush();
  lifecycle.image(true);await flush();lifecycle.frame(20000);await flush();
  assert.strictEqual(lifecycle.results.length,1);assert.strictEqual(lifecycle.results[0].completed,true);assert.strictEqual(previous.restored,true,"completion restores prior keyboard focus");
  assert.strictEqual(lifecycle.events.get("blur").size,0);assert.strictEqual(lifecycle.docEvents.get("visibilitychange").size,0);
  console.log("Good Dogs executable flight failure cleanup, retry, timeout and stale-callback settlement: PASS");
})().catch(error=>{console.error(error);process.exitCode=1;});
