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
const bgNocRef=localScriptRefs.find(ref=>localPath(ref)==="bg_noc.js");assert.ok(/^bg_noc\.js\?v=/.test(bgNocRef||""),"production bootstrap entrypoint must be cache-versioned");
for(const tag of [...html.matchAll(/<link\b[^>]*>/g)].map(m=>m[0])){const a=attrs(tag);if(a.rel!=="stylesheet"||!a.href||isExternal(a.href))continue;assertLocalFile(a.href,"index.html stylesheet");}
[
  "campaign_act1.js","campaign_assets.js","campaign_story.js","campaign_runtime.js","campaign_sector04.js","campaign_sector04_runtime.js","campaign_native_act1.js","good_boys_intro_repair.js","good_dogs_cutscenes_v2_2.js","good_dogs_cutscene_bridge.js"
].forEach(src=>assert.strictEqual(localScripts.filter(candidate=>candidate===src).length,1,`${src} must be loaded exactly once`));
const order=src=>localScripts.indexOf(src);
assert.ok(order("campaign_act1.js")<order("campaign_runtime.js"),"campaign runtime must load after campaign_act1.js");
assert.ok(order("campaign_assets.js")<order("campaign_sector04_runtime.js"),"Sector 04 runtime must load after campaign_assets.js");
assert.ok(order("campaign_sector04.js")<order("campaign_sector04_runtime.js"),"Sector 04 runtime must load after campaign_sector04.js");
assert.ok(order("campaign_sector04_runtime.js")<order("campaign_native_act1.js"),"native Act I must load after Sector 04 runtime");
assert.ok(order("good_boys_campaign_director.js")<order("good_boys_intro_repair.js"),"Good Boys intro owner must load after the presentation-only director");
assert.ok(order("good_boys_intro_repair.js")<order("good_dogs_cutscenes_v2_2.js"),"Good Boys intro owner must arm before source-master mission cutscenes begin");
assert.ok(order("good_boys_prison_cinematic_patch.js")<order("good_dogs_cutscene_bridge.js"),"Good Dogs bridge must load after the prison cinematic patch");
assert.ok(order("good_boys_progression_authority.js")<order("good_dogs_cutscene_bridge.js"),"Good Dogs bridge must load after canonical Good Boys progression");
assert.ok(order("good_dogs_cutscenes_v2_2.js")<order("good_dogs_cutscene_bridge.js"),"Good Dogs cutscene player must load before the bridge");

const introSource=fs.readFileSync(path.join(__dirname,"good_boys_intro_repair.js"),"utf8");new Function(introSource);
assert.ok(introSource.includes('VERSION=13'),"direct intro must expose the v13 canonical mobile handoff contract");
assert.ok(introSource.includes('dataset.gbdBypass="1"'),"direct intro must bypass obsolete director start interception");
assert.ok(introSource.includes('GoodDogsCutscenes.play("GD_CUT_01"'),"Good Boys must open with GD_CUT_01");
assert.ok(introSource.includes('function showShipInterlude()'),"Good Boys opening must include the playable ship inspection beat");
assert.ok(introSource.includes('VERSION:2,active:true,totalSystems:3'),"Good Boys ship runtime must expose time-based v2 controls");
assert.ok(introSource.includes('totalSystems:3'),"Good Boys opening must require exactly three ship systems");
assert.ok(introSource.includes('(ts-lastFrame)/1000'),"Good Boys ship traversal must use elapsed time rather than animation-frame count");
assert.ok(introSource.includes('held*330*dt'),"Good Boys ship traversal must remain frame-rate independent");
assert.ok(introSource.includes('setPointerCapture'),"Good Boys mobile ship controls must capture valid finger holds");
assert.ok(introSource.includes('lostpointercapture'),"Good Boys mobile ship controls must release captured holds safely");
assert.ok(!introSource.includes('x+held*5.5'),"retired frame-dependent ship movement must not return");
assert.ok(introSource.includes('GoodDogsCutscenes.play("GD_CUT_02"'),"Good Boys opening must resolve with GD_CUT_02");
assert.ok(!introSource.includes('if(first&&first.skipped)return first'),"skipping clip 1 must not skip required ship gameplay");
assert.ok(introSource.includes('premise.id="good-boys-campaign-intro"'),"TAKE CONTROL premise must participate in the authored blocker contract");
assert.ok(!introSource.includes('SCENES=['),"retired four-card preamble must not return");
assert.ok(introSource.includes('e.stopImmediatePropagation()'),"direct intro launch must isolate the title click");
assert.ok(introSource.includes('start.click()'),"direct intro must use canonical CLOCK IN initialization");
assert.ok(introSource.includes('/Standard/i.test'),"direct intro must choose the canonical Standard difficulty before M2");
assert.ok(introSource.includes('standard.click()'),"direct intro must complete startRun through the canonical difficulty option");
assert.ok(introSource.includes('/CIO\\s+Dispatch/i.test'),"direct intro must consume the canonical CIO Dispatch after Standard startRun");
assert.ok(introSource.includes('clockIn.click()'),"direct intro must complete the canonical CIO Dispatch option before M2");
assert.ok(introSource.includes('usedDispatch:usedDispatch'),"direct intro clock-in diagnostics must record CIO Dispatch completion");
assert.ok(introSource.includes('state.diff===1&&!state.inDialog'),"direct intro must verify Standard startup has no remaining canonical dialog");
assert.ok(introSource.includes('__goodBoysCanonicalClockIn'),"direct intro must expose canonical clock-in diagnostics");
assert.ok(introSource.includes('state.transition(1,2,"clip2-ended"'),"opening must commit canonical M1->M2 only at the final handoff");
assert.ok(introSource.includes('authority.startNext(current)'),"canonical progression authority must start the persisted mission");
assert.ok(introSource.includes('function verify(attempt,epoch)'),"direct intro must verify campaign attachment against a single launch epoch");
assert.ok(introSource.includes('attempt<3'),"direct intro attachment retry must remain bounded");
assert.ok(introSource.includes('gbiRepairInstalled==="13"'),"direct intro listener installation must be idempotent");

const directorSource=fs.readFileSync(path.join(__dirname,"good_boys_campaign_director.js"),"utf8");new Function(directorSource);
assert.ok(directorSource.includes('VERSION=6'),"Good Boys director must be presentation-only v6");
assert.ok(directorSource.includes('openingOwner:"TechOpsGoodBoysIntroRepair"'),"director must delegate opening ownership to the canonical intro module");
assert.ok(!directorSource.includes('FOLLOW THE TRAIL'),"legacy FOLLOW THE TRAIL path must be removed at source");
assert.ok(!directorSource.includes('installStartCinematic'),"legacy director start capture must be removed");

const progressionSource=fs.readFileSync(path.join(__dirname,"good_boys_progression_authority.js"),"utf8");new Function(progressionSource);
assert.ok(progressionSource.includes('VERSION=9'),"Good Boys progression must expose v9 canonical state authority");
assert.ok(progressionSource.includes('root.TechOpsGoodBoysCampaignState=CampaignState'),"canonical campaign state API must be globally available");
assert.ok(progressionSource.includes('CampaignState.transition(from,next'),"mission advancement must go through canonical transition()");
assert.ok(progressionSource.includes('root.v736.start({mission:next'),"v736 runtime start must receive explicit canonical mission options");
assert.ok(!progressionSource.includes('_gbWaldoTrailComplete'),"retired Waldo trail completion flag must not drive progression");

const accessSource=fs.readFileSync(path.join(__dirname,"good_boys_access_core_authority.js"),"utf8");new Function(accessSource);
assert.ok(accessSource.includes('VERSION=5'),"Access Core must expose canonical-only v5");
assert.ok(accessSource.includes('TechOpsGoodBoysCampaignState'),"Access Core mission reads must delegate to canonical campaign state");
assert.ok(accessSource.includes('timer:null'),"Access Core must not own an independent competing timer");

const bridgeSource=fs.readFileSync(path.join(__dirname,"good_dogs_cutscene_bridge.js"),"utf8");new Function(bridgeSource);
['3:["GD_CUT_03"]','4:["GD_CUT_04","GD_CUT_05"]','5:["GD_CUT_06"]','6:["GD_CUT_07"]','7:["GD_CUT_08"]'].forEach(contract=>assert.ok(bridgeSource.includes(contract),`Good Dogs mission/cutscene contract missing: ${contract}`));
assert.ok(!bridgeSource.includes('1:["GD_CUT_01"]'),"opening GD_CUT_01 must remain owned by direct intro");
assert.ok(!bridgeSource.includes('3:["GD_CUT_02","GD_CUT_03"]'),"opening GD_CUT_02 must not replay during mission 3");
assert.ok(bridgeSource.includes('write("k_identity_status","K_pending")'),"K reveal must persist K_pending identity state");
assert.ok(bridgeSource.includes('m===4)return false'),"Cell 118 legacy mission card must remain suppressed after canonical reveal pair");

console.log("Static entrypoint integrity: PASS");