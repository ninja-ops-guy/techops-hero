"use strict";

const assert = require("assert");
const fs = require("fs");

const html = fs.readFileSync("index.html", "utf8");
const source = fs.readFileSync("good_boys_button_hard_fix.js", "utf8");
const progression = fs.readFileSync("good_boys_progression_authority.js", "utf8");
const board = fs.readFileSync("katrin_manchez.atlas.js", "utf8");
const flight = fs.readFileSync("good_boys_ship_flight.js", "utf8");
const core = fs.readFileSync("v736_hooks.js", "utf8");
for (const candidate of [source, progression, board, flight, core]) new Function(candidate);

assert.ok(!html.includes('src="good_boys_intro_repair.js'), "retired direct-to-M2 opening must stay out of production");
assert.ok(!html.includes('src="good_boys_ship_approach.js'), "retired duplicate flight wrapper must stay out of production");
assert.ok(source.includes("VERSION=16"), "canonical Good Dogs title authority must be v16");
assert.ok(source.includes("function freshConfig(){return{mission:1"), "fresh play must begin at M1");
assert.ok(!source.includes('GoodDogsCutscenes.play("GD_CUT_01"'), "ship footage must not precede M1");
assert.ok(source.includes("return mount(cfg,source)"), "the opening film must hand off to mounted gameplay");
assert.ok(!source.includes('GoodDogsCutscenes.play("GD_CUT_02"'), "the title button may not skip M1/M2 into the ship sequence");
assert.ok(source.includes("freshStoryStart:cfg.fresh") && source.includes("resume:!cfg.fresh"), "fresh and resume telemetry must remain distinguishable");
assert.ok(source.includes("TechOpsPresentationDirector"), "the opening film must claim the shared presentation director");
assert.ok(source.includes("endPresentation(\"error\")"), "failed media must release presentation ownership and fail closed");

assert.ok(progression.includes("VERSION=14"), "progression must expose objective-gated v14 ownership");
assert.ok(progression.includes("function completionStatus(which)"));
for (const marker of ["_gbWaldoTrailComplete", "_gbHiddenBayEntered", "_gbBoardSequenceComplete", "prisonOpsV2.complete", "_gbAccessNodeSeized", "_gbDecryptComplete", "_gbWardenTandemDefeated", "_gbShuttleReached"]) {
  assert.ok(progression.includes(marker), `completion authority missing ${marker}`);
}
assert.ok(progression.includes("CampaignState.transition(from,next"), "all mission progression must use the canonical state transition");
assert.ok(progression.includes("function finalizeHandoff(reason)"), "cinematic mission transitions must wait for a fresh runtime");
assert.ok(progression.includes('__goodBoysProgressionObserverSuppressed'), "the production compositor must suppress redundant observers");

assert.ok(core.includes("function start736(options)"));
assert.ok(core.includes("function missionSpec(m)"), "v7.36 must consume the canonical level registry");
assert.ok(core.includes("goodDogsEncounter"), "v7.36 encounter identity must come from the registry");
assert.ok(!core.includes("cs.towers.every"), "M2 must not retain the obsolete three-tower objective");
assert.ok(/_gbHiddenBayEntered\s*=\s*true/.test(core), "M1 must require an explicit Hidden Bay interaction");

assert.ok(board.includes("Good Dogs M2 boarding action owner v3"));
assert.ok(board.includes("function isLiveM2(s)"));
assert.ok(board.includes('s.p.advance(3,"boarded-secret-ship-button")'), "BOARD must enter the M2-owned exit sequence");
assert.ok(flight.includes("VERSION=6"));
const ordered = ["showDeckInteraction()", 'c.play("GD_CUT_02"', "return flightPromise()", "o.showCrashScene()", "_gbBoardSequenceComplete=true", 'origAdvance(3,"m2-board-flight-crash-complete")'].map(marker => flight.indexOf(marker));
assert.ok(ordered.every(index => index >= 0));
for (let i = 1; i < ordered.length; i++) assert.ok(ordered[i] > ordered[i - 1], "M2 exit sequence must complete in canonical order before persistence advances");
assert.ok(flight.includes("resetBoard()") && flight.includes("boarding-error"), "M2 media/asset failure must remain retryable without advancing state");

console.log("Good Dogs canonical M1-first opening and M2-owned flight handoff: PASS");

(async function cancelledSelectorCanReopenImmediately() {
  let choices=0;
  const context={Date:{now:()=>1000},console,
    document:{addEventListener(){},getElementById(){return null;}},
    localStorage:{getItem(){return null;}},
    __productionBootstrapReady:true,__techopsWrapperGuardInstalled:true,__goodBoysShipFlightInstalled:true,
    TechOpsGoodDogsHomeScene:{choose:async()=>{choices++;return null;}},TechOpsGoodDogsCoop:{},
    GoodDogsCutscenes:{VERSION:3.4,play(){}},TechOpsGoodDogsSingleAtlasAuthority:{VERSION:2},
    TechOpsGoodBoysProgressionAuthority:{VERSION:14},v736:{start(){throw Error('cancel cannot start gameplay');}}
  };
  require('vm').runInNewContext(source,context);
  const owner=context.TechOpsGoodBoysButtonHardFix;
  owner.launch('first');
  await new Promise(setImmediate);
  assert.equal(choices,1);assert.equal(owner.launching,false);
  owner.launch('immediate-reopen');
  await new Promise(setImmediate);
  assert.equal(choices,2,'completed cancellation releases the old click debounce immediately');
  assert.equal(owner.launching,false);
  console.log('Good Dogs immediate selector reopen: PASS');
})().catch(error=>{console.error(error);process.exitCode=1;});
