'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const A=require('./campaign_living_world');let checks=0;
const test=(name,fn)=>{fn();checks++;console.log('PASS',name);};
const ready=()=>{const s=A.initial();s.done=A.Data.episodes.map(e=>e.id).filter(id=>id!=='waldo_visit');return s;};
function at(s,g){s.active.room=g.room;s.active.x=g.x-11;s.active.y=g.y-17;}
test('later invitation and physical visit are independently required, including legacy completed Iona saves',()=>{
 const s=ready();for(const e of A.Data.episodes.filter(e=>e.requiresVisit))assert.equal(A.gate(s,e.id,{}).open,false);
 A.start(s,'waldo_visit',{});const invite=A.current(s);at(s,invite);
 assert.equal(s.flags.waldo_invited,undefined);
 for(let i=0;i<invite.lines.length-1;i++){A.interact(s);assert.equal(s.flags.waldo_invited,undefined);}
 A.interact(s);assert.equal(s.flags.waldo_invited,true);assert.equal(A.gate(s,'low_quarter',{}).open,false);
 at(s,A.current(s));A.interact(s);const visit=A.current(s);
 assert.equal(A.interact(s).ok,false,'a distant conversation cannot count as visiting');at(s,visit);
 for(let i=0;i<visit.lines.length-1;i++){A.interact(s);assert.equal(A.gate(s,'iona_local',{}).open,false);}
 A.interact(s);assert.equal(s.flags.waldo_visit_received,true);assert.equal(A.gate(s,'iona_local',{}).open,true);
 assert.equal(s.knowledge.iona,undefined,'Mike did not hear Iona’s private scenes');
});
test('dialogue resumes on the exact unread line without completion flags',()=>{
 const s=ready();A.start(s,'waldo_visit',{});at(s,A.current(s));A.interact(s);A.leave(s);
 const restored=A.validate(JSON.parse(JSON.stringify(s)));A.start(restored,'waldo_visit',{});
 assert.deepEqual(A.sceneLine(restored),['Mike','Just to hang out?']);assert.equal(restored.flags.waldo_invited,undefined);
 const bad=A.clone(restored);bad.active.sceneIndex=999;assert.throws(()=>A.validate(bad));
});
test('all three dispatch orders preserve first-call consequences and cannot repeat completed calls',()=>{
 for(const first of ['power','access','people']){
  const s=ready();A.start(s,'three_calls',{},true);at(s,A.current(s));A.interact(s,first);const g=A.current(s);at(s,g);A.interact(s);
  for(let i=0;g.kind==='hold'&&A.current(s)===g&&i<150;i++)A.tick(s,.05,{x:s.active.x,y:s.active.y,vx:0});
  at(s,A.current(s));assert.equal(A.interact(s,first).ok,false);assert.equal(s.choices.first_call,first);
  const restored=A.validate(JSON.parse(JSON.stringify(s)));assert.deepEqual(restored.active.tasks,[first]);
  assert.equal(A.holdSeconds(s,A.episode('last_shift').goals[1]),first==='power'?3:6);
  A.start(s,'last_shift',{},true);assert.equal(A.routes(s).find(r=>r.to==='muster').open,first==='access');
  assert.equal(A.holdSeconds(s,A.episode('moving_safehouse').goals[3]),first==='people'?2:4);
 }
});
test('multi-chapter optional chains cannot advance from the old location or a supplied coordinate',()=>{
 const s=ready(),q=A.Data.sidequests.find(q=>q.id==='spare_key');A.start(s,'service_ring',{},true);s.active.room='service';s.active.x=339;A.sidequest(s,q.id);
 assert.throws(()=>A.sidequest(s,q.id,350));assert.equal(s.side[q.id],1);assert.equal(s.flags[q.reward],undefined);
 A.start(s,'last_shift',{},true);s.active.room='floor';s.active.x=339;A.sidequest(s,q.id);assert.equal(s.side[q.id],2);
});
test('delayed relay requires delivery and never copies private records',()=>{
 const s=ready();s.flags.waldo_invited=s.flags.waldo_visit_received=true;s.knowledge.mike=['Private memory'];
 A.start(s,'no_common_channel',{},true);s.active.step=2;A.switchActor(s);at(s,A.current(s));assert.equal(A.interact(s).ok,false);
 s.flags.relay_queued=true;assert.equal(s.knowledge.iona,undefined);A.interact(s);
 assert.equal(s.flags.relay_delivered,true);assert(!s.knowledge.iona.includes('Private memory'));assert.equal(s.flags.relay_iona,undefined);
});
test('old completed records remain replayable without inventing new completion or visit facts',()=>{
 const s=A.initial();s.done=['service_ring','annex'];s.runs={};assert.equal(A.gate(s,'annex',{}).open,true);
 A.validate(s);assert.equal(s.done.includes('three_calls'),false);assert.equal(s.flags.waldo_visit_received,undefined);
});
test('runtime Iona combat ownership requires the current authorized expedition viewpoint',()=>{
 const r={};r.globalThis=r;vm.runInNewContext(fs.readFileSync('night_combat.js','utf8'),r);
 const n={district:'industrial',enemies:[],_livingWorld:{active:true}};r.S={nightMode:n};let view=null;
 r.TechOpsLivingWorldRuntime={viewpoint:world=>world===n?view:null};
 assert.equal(r.TechOpsNightCombat.actor(n),'mike');view='iona';assert.equal(r.TechOpsNightCombat.actor(n),'iona');
 assert.equal(r.TechOpsNightCombat.actor({...n}),'mike');n.drive={};assert.equal(r.TechOpsNightCombat.actor(n),'mike');delete n.drive;view='mike';assert.equal(r.TechOpsNightCombat.actor(n),'mike');
});
test('aftermath reports only completed consequences',()=>{
 const s=A.initial();assert(!A.consequences(s).includes('An Unfinished Song:'));s.flags.song_shared=true;
 assert(A.consequences(s).includes('An Unfinished Song:'));assert(!A.consequences(s).includes('The Spare Key:'));
});
console.log(JSON.stringify({suite:'living-world-progression',checks}));
