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

const intervals=[];const sandbox={console,Date,performance:{now:()=>1},setInterval:(fn)=>{intervals.push(fn);return intervals.length;},clearInterval:()=>{},setTimeout:(fn)=>{fn();return 1;}};sandbox.globalThis=sandbox;sandbox.S={meta:{_v736:{m:1,evidence:[],k:false,waldo:false,done:false}},story:{schemaVersion:1,completedActs:["act_6"],facts:{orbital_signal_found:true},ending:null}};
sandbox.TechOpsStory={eligibleActs:s=>s.story.facts.orbital_signal_found&&s.story.completedActs.includes("act_6")&&!s.story.completedActs.includes("interlude")?["interlude"]:[],completeAct(s,id){assert.strictEqual(id,"interlude");s.story.completedActs.push(id);for(const fact of ["k_freed","waldo_freed","warden_null_defeated","crew_returned_to_earth"])s.story.facts[fact]=true;return true;}};
vm.runInNewContext(source,sandbox);
const api=sandbox.TechOpsGoodDogsCampaignState;assert.ok(api&&api.VERSION>=3);
for(let m=1;m<8;m++)api.markTransition(m,m+1);
let snap=api.snapshot();
assert.strictEqual(snap.k_identity_status,"K");assert.strictEqual(snap.waldo_relationship_k,"accepted");assert.strictEqual(snap.k_freed,true);assert.strictEqual(snap.waldo_freed,true);assert.strictEqual(snap.warden_null_defeated,true);
sandbox.S.meta._v736.done=true;api.completeReturn();snap=api.snapshot();
for(const flag of ["good_dogs_protocol_complete","good_dogs_returned","crew_returned_to_earth","watchdog_k_available","watchdog_waldo_available","watchdog_good_dogs_available"])assert.strictEqual(snap[flag],true,`${flag} not committed on return`);
assert.ok(sandbox.S.story.completedActs.includes("interlude"),"main campaign must record Good Dogs interlude completion");
for(const fact of ["k_freed","waldo_freed","warden_null_defeated","crew_returned_to_earth"])assert.strictEqual(sandbox.S.story.facts[fact],true,`${fact} missing from main story facts`);
const validation=api.validate();assert.strictEqual(validation.valid,true,`semantic validation failed: ${Array.from(validation.errors||[]).join(" | ")}`);assert.strictEqual((validation.errors||[]).length,0);

// A title-launched completion keeps all Good Dogs rewards/semantics local even
// when the underlying campaign happens to be eligible for the interlude.
const standalone={console,Date,performance:{now:()=>1},setInterval:()=>1,clearInterval:()=>{},setTimeout:(fn)=>{fn();return 1;},save:()=>true};standalone.globalThis=standalone;
standalone.S={meta:{_standaloneMode:"gooddogs",_v736:{m:8,k:true,waldo:true,done:true,campaignOrigin:"standalone"}},story:{schemaVersion:1,completedActs:["act_6"],facts:{orbital_signal_found:true},ending:null}};
standalone.TechOpsStory={eligibleActs:()=>["interlude"],completeAct(){throw new Error("standalone completion reached canonical story authority");}};
vm.runInNewContext(source,standalone);
const standaloneApi=standalone.TechOpsGoodDogsCampaignState,standaloneSnap=standaloneApi.completeReturn();
assert.strictEqual(standaloneSnap.good_dogs_protocol_complete,true,"standalone completion still earns its local completion state");
assert.strictEqual(standaloneSnap.watchdog_good_dogs_available,true,"standalone completion retains Good Dogs unlock semantics");
assert.strictEqual(standalone.S.story.completedActs.includes("interlude"),false,"standalone completion must not complete the canonical interlude");
for(const fact of ["k_freed","waldo_freed","warden_null_defeated","crew_returned_to_earth"])assert.strictEqual(standalone.S.story.facts[fact],undefined,`standalone completion leaked canonical fact ${fact}`);
assert.strictEqual(standalone.__goodDogsMainCampaignBridge.canonicalImported,false);

// The shared campaign completion poller must remain inert while the isolated
// title campaign owns the runtime.  It may park legacy private timers, but it
// cannot install or tick canonical Day/campaign authorities.
{
  const calls={gap:0,late:0,runtime:0,build:0,office:0,swarm:0},parked=[];
  const completion={console,Date,S:{meta:{_standaloneMode:"gooddogs",_v736:{campaignOrigin:"standalone"}}},setInterval:()=>44,clearInterval:id=>parked.push(id)};
  completion.TechOpsCampaignBibleGapPass={timer:11,tick(){calls.gap++;}};
  completion.TechOpsLateGameCampaign={timer:12,check(){calls.late++;}};
  completion.TechOpsMORNINGSTARRuntime={timer:13,install(){calls.runtime++;}};
  completion.TechOpsMORNINGSTARBuild={install(){calls.build++;}};
  completion.TechOpsFeliciaFirstOfficeDialogue={install(){calls.office++;}};
  completion.TechOpsSwarmDoctrine={checkQuestioningMoment(){calls.swarm++;}};
  completion.globalThis=completion;
  vm.runInNewContext(fs.readFileSync("campaign_completion_runtime.js","utf8"),completion);
  assert.ok(Object.values(calls).every(value=>value===0),"standalone Good Dogs must not tick canonical campaign owners");
  assert.strictEqual(completion.TechOpsCampaignBibleGapPass.timer,null);
  assert.strictEqual(completion.TechOpsLateGameCampaign.timer,null);
  assert.strictEqual(completion.TechOpsMORNINGSTARRuntime.timer,null);
  assert.deepStrictEqual(parked,[11,12,13],"standalone Good Dogs should park pre-existing private completion timers");
  completion.TechOpsCampaignCompletionRuntime.tick();
  assert.ok(Object.values(calls).every(value=>value===0),"subsequent completion ticks must remain isolated");
  assert.strictEqual(completion.__campaignCompletionRuntimeParked,"gooddogs");
}

const access=fs.readFileSync("good_boys_access_core_authority.js","utf8");
assert.ok(/THE MIKE INDEX/.test(access)&&/recorded-behavior-only/.test(access),"Mike Index must exist and use history-only prediction semantics");
assert.ok(!/future-input/.test(access)||/never a future-input reader/.test(access),"Mike Index may not read future input");
const earth=fs.readFileSync("good_boys_earthfall_ending.js","utf8");
assert.ok(/K walks out under his own name/.test(earth)&&/Waldo walks back through his own door/.test(earth),"Earthfall must preserve K personhood and Waldo return tone");

// The authored ending commits semantics and the isolated save before its final
// CTA returns to title; a completed run can replay this same authority.
{
  const nodes={},events=[];
  const classes=()=>{const values=new Set();return{add:v=>values.add(v),remove:v=>values.delete(v),contains:v=>values.has(v)};};
  const button={addEventListener(type,fn){this[type]=fn;}};
  const card={innerHTML:"",querySelector(selector){return selector==="#gbe-next"?button:null;}};
  const canvas={clientWidth:960,clientHeight:540,getContext(){return null;}};
  const overlay={id:"",style:{},parentNode:null,innerHTML:"",querySelector(selector){return selector===".gbe-card"?card:selector==="canvas"?canvas:null;}};
  const body={classList:classes(),appendChild(node){nodes[node.id]=node;node.parentNode=this;},removeChild(node){delete nodes[node.id];node.parentNode=null;}};
  const head={appendChild(node){nodes[node.id]=node;node.parentNode=this;}};
  const document={body,head,documentElement:head,getElementById:id=>nodes[id]||null,createElement(tag){return tag==="div"?overlay:{id:"",style:{},textContent:"",parentNode:null};},addEventListener(){},removeEventListener(){}};
  const ending={console,Date,performance:{now:()=>1},document,S:{inDialog:false,meta:{_standaloneMode:"gooddogs",_v736:{m:8,k:true,waldo:true,done:false,campaignOrigin:"standalone"}}},NM:{_v736:{m:8,ending:false},enemies:[{}],clear:true},localStorage:{setItem(){}},TechOpsGoodDogsCampaignState:{completeReturn(){events.push("semantic");return true;}},save(){events.push("save");return true;},location:{reload(){events.push("reload");}},setInterval:()=>1,clearInterval:()=>{}};ending.globalThis=ending;
  vm.runInNewContext(earth,ending);
  const finale=ending.TechOpsGoodBoysEarthfallEnding;assert.strictEqual(finale.acceptance().running,true,"M8 boots the authored Earthfall sequence");
  finale.next();finale.next();finale.next();assert.match(card.innerHTML,/SAVE &amp; RETURN TO TITLE|SAVE & RETURN TO TITLE/);
  assert.strictEqual(finale.next(),true);assert.deepStrictEqual(events,["semantic","save","reload"],"completion must commit semantics/save before returning to title");
  assert.strictEqual(ending.S.meta._v736.done,true);assert.strictEqual(ending.__goodBoysEarthfallReturnToTitle.saved,true);
  assert.strictEqual(finale.replay(),true,"completed runs can replay the authored Earthfall authority");assert.strictEqual(finale.acceptance().replaying,true);
  events.length=0;ending.save=()=>{events.push("save");return false;};
  finale.next();finale.next();finale.next();
  assert.strictEqual(finale.next(),false,"a failed isolated save must keep the finale open instead of returning to title");
  assert.deepStrictEqual(events,["semantic","save"]);
}
console.log("Good Dogs Story Bible semantic contract: PASS");

// Loading a completed pre-bridge save must preserve valid rescue/writeback state.
const legacy={console,Date,S:{meta:{_v736:{m:8,k:true,waldo:true,done:true}}},save:()=>true};
legacy.globalThis=legacy;
vm.runInNewContext(source,legacy);
vm.runInNewContext(fs.readFileSync("state_validator.js","utf8"),legacy);
assert.strictEqual(legacy.TechOpsStateValidator.validate(legacy.S).valid,true,"legacy completed saves must remain valid");
assert.strictEqual(legacy.TechOpsGoodDogsCampaignState.snapshot().mike_index_defeated,undefined,"legacy migration must not invent an Index victory");
legacy.S.meta.goodDogs.waldo_freed=true;legacy.S.meta.goodDogs.k_freed=false;legacy.S.meta.k_freed=false;
assert.strictEqual(legacy.TechOpsStateValidator.validate(legacy.S).valid,false,"invalid rescue ordering must be rejected");
// A failed save is observable; the bridge cannot report persistence it did not achieve.
sandbox.save=()=>false;
api.markTransition(1,2);
assert.strictEqual(sandbox.__goodDogsSemanticTransition.persisted,false);
