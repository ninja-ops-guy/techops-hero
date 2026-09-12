const assert = require("assert");
const fs = require("fs");
const path = require("path");

const html = fs.readFileSync("index.html", "utf8");
function attrs(tag) { const out={}; for(const match of tag.matchAll(/\s([a-zA-Z0-9:-]+)="([^"]*)"/g)) out[match[1]]=match[2]; return out; }
function isExternal(ref) { return /^(https?:)?\/\//.test(ref) || ref.startsWith("data:") || ref.startsWith("#"); }
function localPath(ref) { return ref.split(/[?#]/,1)[0]; }
function assertLocalFile(ref,owner){if(ref.includes("?"))assert.ok(/^[A-Za-z0-9_./-]+\.(?:js|css)\?v=[A-Za-z0-9._-]+$/.test(ref),`${owner} uses an invalid cache-version query: ${ref}`);assert.ok(fs.existsSync(path.join(__dirname,localPath(ref))),`${owner} references missing local file: ${ref}`);}

const scriptTags=[...html.matchAll(/<script\b[^>]*><\/script>/g)].map(m=>m[0]);
const localScriptRefs=[],localScripts=[];
for(const tag of scriptTags){const src=attrs(tag).src;if(!src||isExternal(src))continue;localScriptRefs.push(src);localScripts.push(localPath(src));assertLocalFile(src,"index.html script");}
const duplicateScripts=localScripts.filter((src,index)=>localScripts.indexOf(src)!==index);
assert.deepStrictEqual(duplicateScripts,[],"index.html must not load duplicate local scripts");
const refFor=src=>localScriptRefs.find(ref=>localPath(ref)===src)||"";
for(const src of ["good_boys_bible_world.js"]){assert.strictEqual(refFor(src),src+"?v=20260912-pr12-canon");}
for(const src of ["good_boys_access_core_authority.js","cinematic_systems.js","good_boys_progression_authority.js","v736_hooks.js","katrin_manchez.atlas.js","campaign_story.js"]){assert.strictEqual(refFor(src),src+"?v=20260912-local-coop-r3");}
for(const src of ["campaign_world_visuals.js"])assert.strictEqual(refFor(src),src+"?v=20260912-night-combat-r1");
const bgNocRef=refFor("bg_noc.js");assert.strictEqual(bgNocRef,"bg_noc.js?v=20260912-night-lifecycle-r1","production bootstrap entrypoint must bypass stale mobile caches");
[
  "good_boys_prison_cinematic_patch.js",
].forEach(src=>assert.strictEqual(refFor(src),src+"?v=20260911-cinematic-cohesion-r1",src+" must bypass stale caches for the cinematic-cohesion handoff"));
assert.strictEqual(refFor("good_dogs_cutscene_bridge.js"),"good_dogs_cutscene_bridge.js?v=20260904-m3-prison-breach-r1");
assert.ok(!html.includes("good_dogs_cutscene_bridge.js?v=20260831-gooddogs-master-v1"),"entrypoint must not serve the stale M3 cutscene bridge");
assert.ok(!html.includes("good_boys_progression_authority.js?v=20260901-goodboys-certified-r1"),"entrypoint must not serve the stale M3 progression authority");
for(const tag of [...html.matchAll(/<link\b[^>]*>/g)].map(m=>m[0])){const a=attrs(tag);if(a.rel!=="stylesheet"||!a.href||isExternal(a.href))continue;assertLocalFile(a.href,"index.html stylesheet");}
[
  "campaign_act1.js","campaign_assets.js","campaign_story.js","campaign_runtime.js","campaign_sector04.js","campaign_sector04_runtime.js","campaign_native_act1.js","cinematic_systems.js","good_dogs_cutscenes_v2_2.js","good_dogs_cutscene_bridge.js"
].forEach(src=>assert.strictEqual(localScripts.filter(candidate=>candidate===src).length,1,`${src} must be loaded exactly once`));
assert.strictEqual(localScripts.filter(candidate=>candidate==="good_boys_intro_repair.js").length,0,"obsolete direct-to-M2 intro must not be parser loaded");
assert.strictEqual(localScripts.filter(candidate=>candidate==="good_boys_ship_approach.js").length,0,"obsolete duplicate ship-approach wrapper must not be parser loaded");
const order=src=>localScripts.indexOf(src);
assert.ok(order("campaign_act1.js")<order("campaign_runtime.js"),"campaign runtime must load after campaign_act1.js");
assert.ok(order("campaign_assets.js")<order("campaign_sector04_runtime.js"),"Sector 04 runtime must load after campaign_assets.js");
assert.ok(order("campaign_sector04.js")<order("campaign_sector04_runtime.js"),"Sector 04 runtime must load after campaign_sector04.js");
assert.ok(order("campaign_sector04_runtime.js")<order("campaign_native_act1.js"),"native Act I must load after Sector 04 runtime");
assert.ok(order("game.js")<order("cinematic_systems.js")&&order("cinematic_systems.js")<order("night_hooks.js"),"shared registry/camera/presentation/animation services must precede runtime consumers");
assert.ok(order("good_boys_prison_cinematic_patch.js")<order("good_dogs_cutscene_bridge.js"),"Good Dogs bridge must load after the prison cinematic patch");
assert.ok(order("good_boys_progression_authority.js")<order("good_dogs_cutscene_bridge.js"),"Good Dogs bridge must load after canonical Good Boys progression");
assert.ok(order("good_dogs_cutscenes_v2_2.js")<order("good_dogs_cutscene_bridge.js"),"Good Dogs cutscene player must load before the bridge");

const introSource=fs.readFileSync(path.join(__dirname,"good_boys_button_hard_fix.js"),"utf8");new Function(introSource);
assert.ok(introSource.includes('VERSION=16'),"title authority must expose the M1-first v16 contract");
assert.ok(introSource.includes('function freshConfig(){return{mission:1'),"fresh campaigns must begin at Waldo's House");
assert.ok(!introSource.includes('GoodDogsCutscenes.play("GD_CUT_01"'),"Good Dogs must open on the property, not aboard ship");
assert.ok(!introSource.includes('GoodDogsCutscenes.play("GD_CUT_02"'),"title launch may not bypass M1/M2 into the ship handoff");
assert.ok(introSource.includes('root.v736.start({mission:cfg.mission')&&introSource.includes('directGameplay:true'),"fresh and resumed missions must mount canonical gameplay directly");
assert.ok(introSource.includes('openingContract:"playable M1 -> playable M2'),"launch diagnostics must expose the full M1→M3 route");
assert.ok(introSource.includes('e.stopImmediatePropagation()'),"title launch must isolate the physical click");
assert.ok(introSource.includes('TechOpsPresentationDirector'),"the opening must participate in shared presentation ownership");

const directorSource=fs.readFileSync(path.join(__dirname,"good_boys_campaign_director.js"),"utf8");new Function(directorSource);
assert.ok(directorSource.includes('VERSION=7'),"Good Boys director must be presentation-only v7 with compositor-owned observation");
assert.ok(directorSource.includes('openingOwner:"TechOpsGoodBoysButtonHardFix"'),"director must delegate opening ownership to the M1-first title module");
assert.ok(!directorSource.includes('installStartCinematic'),"legacy director start capture must be removed");

const progressionSource=fs.readFileSync(path.join(__dirname,"good_boys_progression_authority.js"),"utf8");new Function(progressionSource);
const v736Source=fs.readFileSync(path.join(__dirname,"v736_hooks.js"),"utf8");new Function(v736Source);
assert.ok(progressionSource.includes('VERSION=14'),"Good Dogs progression must expose objective-gated v14 ownership");
assert.ok(progressionSource.includes('root.TechOpsGoodBoysCampaignState=CampaignState'),"canonical campaign state API must be globally available");
assert.ok(progressionSource.includes('CampaignState.transition(from,next'),"mission advancement must go through canonical transition()");
assert.ok(progressionSource.includes('function startNext(next,options)'),"canonical runtime handoff must accept explicit options");
assert.ok(progressionSource.includes('root.v736.start({mission:next'),"v736 runtime start must receive explicit canonical mission options");
assert.ok(progressionSource.includes('directGameplay:!!options.directGameplay'),"directGameplay must be forwarded only when explicitly requested");
assert.ok(!progressionSource.includes('cine.skip()'),"progression authority must not skip the cinematic engine to synthesize direct gameplay");
assert.ok(v736Source.includes('function start736(options)'),"v736 core start must accept handoff options");
assert.ok(v736Source.includes('if (options.directGameplay)'),"v736 core must own the direct gameplay branch");
assert.ok(v736Source.includes('startCombat736(mission)'),"direct mission resume must synchronously mount combat inside v736 core");
assert.ok(v736Source.includes('source: "v736-core"'),"v736 direct-play diagnostics must identify the core owner");
assert.ok(progressionSource.includes('if(from===2)startNext(next,{directGameplay:true});else startNext(next);'),"ordinary mission progression must retain authored cinematic handoffs");
assert.ok(progressionSource.includes('function finalizeHandoff(reason)'),"progression authority must wait for a fresh runtime on normal cinematic handoffs");
assert.ok(progressionSource.includes('if(!c||c.ending)'),"stale ending runtime must not satisfy handoff ownership");
assert.ok(progressionSource.includes('finalizeHandoff("tick-handoff")'),"runtime attachment must be finalized by the authority tick");
assert.ok(!progressionSource.includes('throw new Error("Good Boys mission invariant failed after v736.start")'),"runtime start may not enforce a synchronous attachment invariant on normal paths");
assert.ok(progressionSource.includes('_gbWaldoTrailComplete')&&progressionSource.includes('_gbHiddenBayEntered'),"M1 progression must require the trail and explicit Hidden Bay interaction");
assert.ok(progressionSource.includes('_gbBoardSequenceComplete'),"M2 progression must require the whole board/film/flight/crash sequence");

const boardSource=fs.readFileSync(path.join(__dirname,"katrin_manchez.atlas.js"),"utf8");new Function(boardSource);
assert.ok(boardSource.includes('Good Dogs M2 boarding action owner v3'),"M2 boarding action must expose the v3 near-ship runtime-ownership contract");
assert.ok(boardSource.includes('function isLiveM2(s)'),"M2 boarding action must define a live-runtime ownership gate");
assert.ok(boardSource.includes('s.c&&!s.c.ending&&Number(s.c.m||0)===2&&s.m===2'),"BOARD THE SHIP must require a fresh mounted M2 runtime as well as canonical M2 metadata");
assert.ok(boardSource.includes('var visible=isLiveM2(s)&&s.revealed&&s.living===0&&s.x>=BOARD_X'),"BOARD THE SHIP render eligibility must require runtime ownership, clear arena, reveal, and near-ship position");
assert.ok(boardSource.includes('if(!isLiveM2(s)||!s.revealed||s.living>0||s.x<BOARD_X)'),"BOARD THE SHIP activation must reject stale/pre-handoff surfaces");
assert.ok(boardSource.includes('if(!visible){if(b)remove();return;}'),"boarding UI must be removed immediately whenever ownership is lost");

const accessSource=fs.readFileSync(path.join(__dirname,"good_boys_access_core_authority.js"),"utf8");new Function(accessSource);
assert.ok(accessSource.includes('VERSION=8'),"Access Core must expose the explicit Mike Index and route-control interaction v8 contract");
assert.ok(accessSource.includes('function seizeAccessNode()'),"M5 must require seizing the Access Node after security clears");
assert.ok(accessSource.includes('TechOpsGoodBoysCampaignState'),"Access Core mission reads must delegate to canonical campaign state");
assert.ok(accessSource.includes('timer:null'),"Access Core must not own an independent competing timer");

const bridgeSource=fs.readFileSync(path.join(__dirname,"good_dogs_cutscene_bridge.js"),"utf8");new Function(bridgeSource);
['4:["GD_CUT_04"]','5:["GD_CUT_06"]','6:["GD_CUT_07"]','7:["GD_CUT_08"]'].forEach(contract=>assert.ok(bridgeSource.includes(contract),`Good Dogs mission/cutscene contract missing: ${contract}`));
assert.ok(bridgeSource.includes('CONDITIONAL_SEQUENCE={4:{id:"GD_CUT_05",when:"cellOpened"}}'),"K reveal must be gated to the actual Cell 118 open event");
assert.ok(!bridgeSource.includes('4:["GD_CUT_04","GD_CUT_05"]'),"Cell 118 videos must not play back-to-back at mission entry");
assert.ok(!bridgeSource.includes('3:["GD_CUT_03"]'),"mission 3 must not replay the retired flying-ship cutscene");
assert.ok(!bridgeSource.includes('1:["GD_CUT_01"]'),"ship establishing GD_CUT_01 must remain owned by M2 boarding");
assert.ok(!bridgeSource.includes('3:["GD_CUT_02","GD_CUT_03"]'),"opening GD_CUT_02 must not replay during mission 3");
assert.ok(bridgeSource.includes('write("k_identity_status","K_pending")'),"K reveal must persist K_pending identity state");
assert.ok(bridgeSource.includes('m===4)return false'),"Cell 118 legacy mission card must remain suppressed around the canonical reveal flow");

const prisonGameplay=fs.readFileSync(path.join(__dirname,"good_boys_prison_gameplay_v2.js"),"utf8");new Function(prisonGameplay);
assert.ok(prisonGameplay.includes('BLACKSITE MERIDIAN — BREACH PROTOCOL'),"M3 must use the multi-stage prison breach objective");
assert.ok(prisonGameplay.includes('SECURITY RELAY')&&prisonGameplay.includes('counterattack'),"M3 must include relay interaction and counterattack beats");
assert.ok(prisonGameplay.includes('PACK CHAIN')&&prisonGameplay.includes('PACK BREAKER'),"orbital prison combat must expose the five-hit paired combat cadence");

console.log("Static entrypoint integrity: PASS");

for (const src of ["game.js", "night_hooks.js", "v55_hooks.js", "v57_hooks.js", "v716_hooks.js", "v733_hooks.js", "campaign_sector04_runtime.js"]) assert.strictEqual(refFor(src), src + "?v=20260912-night-lifecycle-r1", "Night lifecycle cache pin");
