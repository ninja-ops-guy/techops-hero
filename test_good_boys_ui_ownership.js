"use strict";
const assert=require("assert"),fs=require("fs"),vm=require("vm");

// The parser filter must remove both legacy status systems while retaining
// world drawing and the shared center mission message.
{
  const calls=[];
  const ctx={canvas:{width:640,height:720},fillRect(...a){calls.push(["rect",...a]);},strokeRect(...a){calls.push(["stroke",...a]);},fillText(...a){calls.push(["text",...a]);},drawImage(...a){calls.push(["image",...a]);}};
  const context={console,ctx,NM:{_v736:{}},__goodBoysHudLiteInstalled:true};
  context.__techopsFinalParserDrawNM=function(){
    ctx.fillRect(10,10,250,76);ctx.fillRect(18,18,160,10);ctx.fillText("HP",184,27);ctx.fillText("FOCUS",18,46);
    ctx.fillRect(378,10,252,62);ctx.fillText("DANGER",480,48);ctx.fillText("DOWNTOWN · ST 1/3",620,30);
    ctx.fillRect(10,92,250,66);ctx.fillText("KATRIN",20,110);
    ctx.fillRect(300,300,24,24);ctx.fillText("CLEAR THE HANGAR",320,118);
  };
  context.globalThis=context;vm.createContext(context);vm.runInContext(fs.readFileSync("good_boys_legacy_hud_filter.js","utf8"),context,{filename:"good_boys_legacy_hud_filter.js"});
  context.__techopsFinalParserDrawNM();
  assert.ok(context.TechOpsGoodBoysLegacyHudFilter.VERSION>=2,"single-HUD filter must include shared Night status bars");
  assert.ok(!calls.some(c=>c[0]==="rect"&&c[1]===10&&c[2]===10),"generic Night left HUD must be suppressed");
  assert.ok(!calls.some(c=>c[0]==="rect"&&c[1]===378&&c[2]===10),"generic Night right HUD must be suppressed");
  assert.ok(!calls.some(c=>c[0]==="rect"&&c[1]===10&&c[2]===92),"legacy duo HUD must be suppressed");
  assert.ok(calls.some(c=>c[0]==="rect"&&c[1]===300&&c[2]===300),"world rendering must remain intact");
  assert.ok(calls.some(c=>c[0]==="text"&&c[1]==="CLEAR THE HANGAR"),"center objective message must remain intact");
}

{
  let baseCards=0;
  const context={console,S:{meta:{_char:"nightcrawler"}},v63Card(){baseCards++;},document:{getElementById(){return null;}},setInterval(){return 1;}};
  context.globalThis=context;vm.createContext(context);vm.runInContext(fs.readFileSync("production_presentation_guard.js","utf8"),context,{filename:"production_presentation_guard.js"});
  context.v63Card("DAY 1","MONDAY · SHIFT 09:00");context.v63Card("🌃 NIGHT CRAWL","NEW HAVEN STREETS");assert.strictEqual(baseCards,0,"Night tutorial cannot overlap generic day or title cards");
}

{
  const card={style:{},innerHTML:"DAY 1",textContent:"DAY 1"},toast={textContent:"NEW HAVEN AFTER DARK",classList:{added:false,add(){this.added=true;}}};let baseCards=0;
  const context={console,NM:{_v736:{}},v63Card(){baseCards++;},document:{getElementById(id){return id==="v63-card"?card:id==="toast"?toast:null;}},setInterval(){return 1;}};
  context.globalThis=context;vm.createContext(context);vm.runInContext(fs.readFileSync("production_presentation_guard.js","utf8"),context,{filename:"production_presentation_guard.js"});context.v63Card("DAY 1","MONDAY SHIFT 09:00");
  assert.strictEqual(baseCards,0,"generic day card cannot render during Good Boys");assert.strictEqual(card.innerHTML,"","an already-mounted generic card must be cleared");assert.strictEqual(toast.textContent,"","Night Crawler tutorial toast must be cleared");assert.strictEqual(toast.classList.added,true);
}

const layout=fs.readFileSync("good_boys_mobile_controls_layout.js","utf8"),html=fs.readFileSync("index.html","utf8"),game=fs.readFileSync("game.js","utf8");
assert.ok(/var VERSION=7/.test(layout));assert.ok(layout.includes('classList.toggle("good-boys-controls",active())'),"controls must own their active body class");assert.ok(layout.includes("border-radius:11px"),"action controls must use compact rounded rectangles");assert.ok(layout.includes("#v55-nmbtns{display:none!important"),"legacy Night action buttons cannot overlap Good Boys controls");assert.ok(html.includes('id="sc-widget" title="Optional soundtrack" src="about:blank" data-src='),"SoundCloud iframe must be lazy");assert.ok(game.includes("initMusic(true)"),"soundtrack must load from explicit user input");assert.ok(game.includes("if (!userInitiated"),"run initialization cannot eagerly mount the SoundCloud widget");assert.ok(fs.readFileSync("style.css","utf8").includes("bottom:max(190px"),"Night BLOCK/DASH controls must clear the primary touch buttons");

const handoff=fs.readFileSync("good_boys_handoff_ui_patch.js","utf8"),hard=fs.readFileSync("good_boys_button_hard_fix.js","utf8"),deck=fs.readFileSync("good_boys_ship_deck_scene.js","utf8"),flight=fs.readFileSync("good_boys_ship_flight.js","utf8"),cutscenes=fs.readFileSync("good_dogs_cutscenes_v2_2.js","utf8");
for(const [name,src] of [["handoff",handoff],["hard",hard],["deck",deck],["flight",flight],["cutscenes",cutscenes]]) assert.doesNotThrow(()=>new Function(src),`${name} source must parse`);
assert.ok(handoff.includes("VERSION=3"),"handoff isolation must be passive v3");assert.ok(handoff.includes('launchOwner:"TechOpsGoodBoysButtonHardFix"'),"handoff must name the sole launch owner");assert.ok(!handoff.includes('addEventListener("click",isolatedLaunch,true)'),"handoff may not consume the title click");assert.ok(!handoff.includes("v736.start({mission:Number(m)"),"handoff may not boot/resume a Good Boys mission");
assert.ok(hard.includes("VERSION=13"),"hard title button must be the v13 opening authority");assert.ok(hard.includes("TechOpsGoodBoysShipFlight"),"opening must call the canonical ship-flight authority directly");assert.ok(!hard.includes("o.showSpaceFlight()"),"opening may not route through the legacy flight alias");assert.ok(hard.includes("result.completed!==true"),"opening must reject incomplete canonical flight callbacks");assert.ok(hard.includes("result&&result.assetError"),"canonical flight asset failures must fail closed before the prison cutscene");
assert.ok(deck.includes("assets/v736/good_boys_ship/cockpit_pilot.jpg"),"cockpit must integrate the existing pilot asset");assert.ok(deck.includes("pilotX=480"),"cockpit interaction target must sit on the center pilot");assert.ok(deck.includes("MOVE TO PILOT")&&deck.includes("INTERACT"),"pilot must be a gameplay interaction target");assert.ok(deck.includes("VERSION=7"),"deck scene must retain the Good Ship gameplay asset integration contract");assert.ok(flight.includes("assets/good_boys/good_ship_arcade.atlas.png"),"flight must use the supplied Good Ship atlas");assert.ok(flight.includes("VERSION=5"),"flight must require the gameplay-integration atlas loader");assert.ok(flight.includes("20260903-good-ship-gameplay-assets-r2"),"flight must bypass the stale strip atlas");assert.ok(flight.includes("asteroid_1")&&flight.includes("ship_player")&&flight.includes("prison_station"),"flight must use supplied ship/hazard/prison frames");
assert.ok(cutscenes.includes('VERSION:"3.5"'),"cutscene player must expose the fresh-video-node v3.5 playback contract");assert.ok(cutscenes.includes("freshVideoNode:true"),"each cinematic session must own a fresh video element");assert.ok(cutscenes.includes("Detach callbacks before touching media"),"cutscene teardown must detach callbacks before removing media");assert.ok(!cutscenes.includes('video.removeAttribute("src");video.load()'),"cutscene finish may not synchronously reload an aborted media element");
assert.ok(cutscenes.includes("02_signal_pull_transition_pixel.mp4?v=20260903-picked-pilot-attack-r1"),"takeover cutscene must cache-bust the picked cockpit attack clip");assert.ok(fs.existsSync("assets/cutscenes/good_dogs/02_signal_pull_transition_pixel.mp4"),"picked cockpit attack clip must be present");assert.ok(cutscenes.includes("attemptAutoplay"),"cutscene player must attempt muted inline autoplay");assert.ok(!/STARTING|TRANSMISSION/.test(cutscenes),"cutscene player must not flash non-bible transmission text over the film");assert.ok(!cutscenes.includes(".gd-film-status"),"cutscene player must not render the retired status text layer");assert.ok(!cutscenes.includes('if(ios)waitForUser("ios-ready"'),"iPhone must not be forced through a manual VIDEO READY gate");assert.ok(hard.includes('cine.play("GD_CUT_02",{force:true,muted:true,autoplay:true,noPoster:true})'),"takeover clip must request autoplay without a poster plate");assert.ok(!hard.includes('cine.play("GD_CUT_03"'),"the extra flying-ship cutscene must be removed from the opening");
const crashScene=fs.readFileSync("good_boys_crash_scene.js","utf8");assert.ok(crashScene.includes("VERSION=5"),"crash scene must expose the bounded picked-media v5 contract");assert.ok(crashScene.includes("video-stall")&&crashScene.includes("video-absolute-watchdog"),"crash scene must bound stalled playback and absolute playback time");assert.ok(crashScene.includes("watchdogTriggered")&&crashScene.includes("watchdogReason"),"crash watchdog telemetry must be observable");assert.ok(crashScene.includes("__authoredCrashVideoV3")&&crashScene.includes("__authoredCrashClipV3"),"crash scene must expose the authored-media compatibility contracts");assert.ok(crashScene.includes("09_prison_crash_selected_pixel.mp4?v=20260903-picked-crash-r1"),"crash scene must cache-bust the picked crash clip");assert.ok(fs.existsSync("assets/cutscenes/good_dogs/09_prison_crash_selected_pixel.mp4"),"picked crash clip must be present");assert.ok(crashScene.includes("procedural:false"),"crash scene must not use the generated canvas crash path");assert.ok(!crashScene.includes("drawShip(")&&!crashScene.includes("sh_reentry"),"old procedural shuttle crash animation must stay removed");
const openingStart=hard.indexOf("async function opening(source)"),takeover=hard.indexOf('cine.play("GD_CUT_02"',openingStart),shipRun=hard.indexOf("runCanonicalFlight(ship)",takeover),crash=hard.indexOf("o.showCrashScene()",shipRun);assert.ok(openingStart>=0&&takeover>openingStart&&takeover<shipRun&&shipRun<crash,"opening order must be pilot -> GD_CUT_02 -> flight -> authored crash");

console.log("Good Boys UI ownership, single opening authority, hardened cutscene lifecycle, fail-closed flight, and lazy media regression: PASS");
