"use strict";
const assert=require("assert");
const fs=require("fs");
const vm=require("vm");
const source=fs.readFileSync("good_dogs_campaign_state.js","utf8");
new Function(source);
const stateSource=source;
for(const flag of [
  "good_dogs_signal_heard","good_dogs_campaign_started","good_dogs_tutorial_complete","cell_118_known","cell_1984_known",
  "shuttle_launched","orbital_detention_seen","prison_infiltrated","good_dogs_advanced_traversal_unlocked","cell_118_reached","k_seen","k_freed",
  "mike_index_defeated","cell_1984_route_open","waldo_seen","waldo_freed","waldo_relationship_k","release_expected_seen","orpheus_prediction_seeded",
  "warden_null_active","shuttle_bay_reached","warden_null_defeated","orbital_custody_broken","waldo_returned","good_dogs_protocol_complete","good_dogs_returned",
  "watchdog_k_available","watchdog_waldo_available","watchdog_good_dogs_available","crew_returned_to_earth"
]) assert.ok(stateSource.includes(flag),`missing Story Bible semantic ${flag}`);

const intervals=[];const sandbox={console,Date,performance:{now:()=>1},setInterval:(fn)=>{intervals.push(fn);return intervals.length;},clearInterval:()=>{},setTimeout:(fn)=>{fn();return 1;}};sandbox.globalThis=sandbox;sandbox.S={meta:{_v736:{m:1,evidence:[],k:false,waldo:false,done:false}},story:{schemaVersion:1,completedActs:[],facts:{},ending:null}};
vm.runInNewContext(source,sandbox);
const api=sandbox.TechOpsGoodDogsCampaignState;assert.ok(api&&api.VERSION>=3);
for(let m=1;m<8;m++)api.markTransition(m,m+1);
let snap=api.snapshot();
assert.strictEqual(snap.k_identity_status,"K");assert.strictEqual(snap.waldo_relationship_k,"accepted");assert.strictEqual(snap.k_freed,true);assert.strictEqual(snap.waldo_freed,true);assert.strictEqual(snap.warden_null_defeated,true);
sandbox.S.meta._v736.done=true;api.completeReturn();snap=api.snapshot();
for(const flag of ["good_dogs_protocol_complete","good_dogs_returned","crew_returned_to_earth","watchdog_k_available","watchdog_waldo_available","watchdog_good_dogs_available"])assert.strictEqual(snap[flag],true,`${flag} not committed on return`);
assert.ok(sandbox.S.story.completedActs.includes("interlude"),"main campaign must record Good Dogs interlude completion");
for(const fact of ["k_freed","waldo_freed","warden_null_defeated","crew_returned_to_earth"])assert.strictEqual(sandbox.S.story.facts[fact],true,`${fact} missing from main story facts`);
assert.deepStrictEqual(api.validate().errors,[]);

const access=fs.readFileSync("good_boys_access_core_authority.js","utf8");
assert.ok(/THE MIKE INDEX/.test(access)&&/recorded-behavior-only/.test(access),"Mike Index must exist and use history-only prediction semantics");
assert.ok(!/future-input/.test(access)||/never a future-input reader/.test(access),"Mike Index may not read future input");
const earth=fs.readFileSync("good_boys_earthfall_ending.js","utf8");
assert.ok(/K walks out under his own name/.test(earth)&&/Waldo walks back through his own door/.test(earth),"Earthfall must preserve K personhood and Waldo return tone");
console.log("Good Dogs Story Bible semantic contract: PASS");
