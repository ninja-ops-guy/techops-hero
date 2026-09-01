const assert = require("assert");
const fs = require("fs");
const source = fs.readFileSync("good_boys_intro_repair.js", "utf8");
const progression = fs.readFileSync("good_boys_progression_authority.js", "utf8");
const board = fs.readFileSync("katrin_manchez.atlas.js", "utf8");
const core = fs.readFileSync("v736_hooks.js", "utf8");
new Function(source);
new Function(progression);
new Function(board);
new Function(core);

// Canonical opening: Clip 1 -> deterministic 3-system ship interaction -> Clip 2
// -> one premise -> TAKE CONTROL -> canonical Standard CLOCK IN -> CIO Dispatch -> direct M2 gameplay.
assert.ok(source.includes('VERSION=15'), "direct Good Boys opening must be v15");
assert.ok(!source.includes('SCENES=['), "legacy four-card intro must remain retired");
assert.ok(source.includes('GoodDogsCutscenes.play("GD_CUT_01"'), "opening must begin with GD_CUT_01");
assert.ok(source.includes('GoodDogsCutscenes.play("GD_CUT_02"'), "opening must resolve with GD_CUT_02");
assert.ok(source.includes('function showShipInterlude()'), "opening must contain playable ship interaction");
assert.ok(source.includes('root.TechOpsShipInteraction='), "ship interaction must expose a namespaced runtime contract");
assert.ok(source.includes('VERSION:2,active:true,totalSystems:3'), "ship interaction runtime contract must expose time-based v2 movement");
assert.ok(source.includes('totalSystems:3'), "ship interaction must require exactly three systems");
for (const id of ['nav','flight','dock']) assert.ok(source.includes('id:"'+id+'"'), `ship interaction must include ${id}`);
assert.ok(source.includes('bd<=92'), "ship interactions must be proximity gated");
assert.ok(source.includes('inspected.indexOf(systemId)>=0'), "each ship system must only count once");
assert.ok(source.includes('inspected.length>=systems.length'), "3/3 systems must auto-complete the ship beat");
assert.ok(source.includes('(ts-lastFrame)/1000'), "ship traversal must use elapsed time instead of frames");
assert.ok(source.includes('held*330*dt'), "ship traversal must have a frame-rate-independent speed");
assert.ok(source.includes('setPointerCapture'), "mobile movement holds must use pointer capture");
assert.ok(source.includes('lostpointercapture'), "captured movement must release safely");
assert.ok(!source.includes('x+held*5.5'), "frame-dependent ship movement must remain retired");
assert.ok(!source.includes('if(first&&first.skipped)return first'), "skipping Clip 1 must not skip required ship gameplay");
assert.ok(source.includes('phase("clip1")') && source.includes('phase("ship-interaction")') && source.includes('phase("clip2")'), "opening phases must remain ephemeral diagnostics");
assert.ok(source.includes('state.transition(1,2,"clip2-ended"'), "numeric campaign state must transition 1->2 only after the authored opening");
assert.ok(source.includes('authority.startNext(current,{directGameplay:current===2})'), "authored opening must request direct M2 gameplay attachment");
assert.ok(source.includes('premise.id="good-boys-campaign-intro"'), "opening must render one canonical premise blocker");
assert.ok(source.includes('TAKE CONTROL'), "canonical premise CTA must be TAKE CONTROL");
assert.ok(source.includes('dataset.gbdBypass="1"'), "legacy director launch interception must remain bypassed");
assert.ok(source.includes('legacyFollowTarget'), "stale FOLLOW THE TRAIL surfaces must be rescued/retired");
assert.ok(source.includes('legacy.remove()'), "obsolete director overlay must be removed when detected");
assert.ok(source.includes('e.stopImmediatePropagation()'), "launch must not leak into the legacy director");
assert.ok(source.includes('start.click()'), "handoff must use canonical CLOCK IN initialization");
assert.ok(source.includes('/Standard/i.test'), "Good Boys TAKE CONTROL must choose the canonical Standard difficulty");
assert.ok(source.includes('standard.click()'), "canonical Standard selection must complete startRun before M2 attachment");
assert.ok(source.includes('/CIO\\s+Dispatch/i.test'), "Good Boys TAKE CONTROL must consume only the canonical CIO Dispatch after startRun");
assert.ok(source.includes('clockIn.click()'), "canonical CIO Dispatch must complete through its real Clock in option");
assert.ok(source.includes('usedDispatch:usedDispatch'), "clock-in diagnostics must record CIO Dispatch completion");
assert.ok(source.includes('state.diff===1&&!state.inDialog'), "Good Boys may not start M2 until Standard startup dialogs are fully resolved");
assert.ok(source.includes('__goodBoysCanonicalClockIn'), "clock-in completion must expose a diagnostic contract");
assert.ok(source.includes('root.__gbiSkipBuiltinM1=true'), "duplicate legacy mission-1 cinematic must remain suppressed");
assert.ok(source.includes('gbiRepairInstalled==="15"'), "launch listener must install idempotently at v15");
assert.ok(source.includes('if(launching||attached())return false'), "launch must remain single-flight");

// Handoff contract: M2 gets a synchronous fast path; later missions remain async-safe.
assert.ok(progression.includes('VERSION=12'), "progression authority must expose v12 core-owned direct-M2 + async-safe handoff semantics");
assert.ok(progression.includes('function finalizeHandoff(reason)'), "progression authority must expose handoff finalization");
assert.ok(progression.includes('if(!c||c.ending)'), "handoff must reject absent or stale ending runtimes");
assert.ok(progression.includes('status:c&&c.ending?"awaiting-fresh-runtime":"awaiting-runtime"'), "handoff diagnostics must distinguish stale runtime from missing runtime");
assert.ok(progression.includes('finalizeHandoff("tick-handoff")'), "authority tick must settle later cinematic handoffs when the fresh runtime appears");
assert.ok(progression.includes('function startNext(next,options)'), "canonical runtime start must accept explicit handoff options");
assert.ok(progression.includes('directGameplay:!!options.directGameplay'), "directGameplay must be forwarded through the v736 start contract");
assert.ok(!progression.includes('cine.skip()'), "progression authority must not emulate direct gameplay by skipping the cinematic engine");
assert.ok(core.includes('function start736(options)'), "v736 core must accept explicit start options");
assert.ok(core.includes('if (options.directGameplay)'), "v736 core must own the direct gameplay branch");
assert.ok(core.includes('startCombat736(mission)'), "direct M2 gameplay must mount combat from inside v736 core");
assert.ok(core.includes('source: "v736-core"'), "direct M2 diagnostics must identify the core runtime owner");
assert.ok(progression.includes('var restart=function(){try{startNext(next);'), "ordinary M3+ progression must not opt into directGameplay");
assert.ok(!progression.includes('throw new Error("Good Boys mission invariant failed after v736.start")'), "v736.start must not require synchronous runtime attachment on ordinary cinematic paths");
assert.ok(source.includes('function liveM2()'), "intro owner must distinguish a live M2 runtime from metadata-only M2");
assert.ok(source.includes('board&&!liveM2()'), "stale BOARD THE SHIP surface must be removed outside live M2 ownership");
assert.ok(source.includes('suppressStaleBoard'), "stale boarding clicks must be captured before legacy handlers can intercept the handoff");
assert.ok(source.includes('attempt<240'), "attachment verifier must retain a bounded async fallback if direct mounting cannot complete");
assert.ok(!source.includes('if(attempt<3){startCampaign();'), "attachment verification must never relaunch the campaign while a handoff is pending");

// BOARD THE SHIP is defense-in-depth owned by live M2 gameplay itself.
assert.ok(board.includes('Good Boys M2 boarding action owner v2'), "boarding action must expose runtime-owned v2 contract");
assert.ok(board.includes('function isLiveM2(s)'), "boarding action must define live M2 ownership");
assert.ok(board.includes('s.c&&!s.c.ending&&Number(s.c.m||0)===2&&s.m===2'), "boarding ownership must require fresh runtime M2 and canonical M2");
assert.ok(board.includes('var visible=isLiveM2(s)&&s.revealed&&s.living===0&&s.x>=1080'), "boarding surface must not render before genuine M2 boarding conditions");

console.log("Good Boys canonical opening contract: PASS");