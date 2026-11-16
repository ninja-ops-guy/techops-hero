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
 assert.equal(A.episode('no_common_channel').privateCompletion,true,'Iona’s final relay entry is not automatically delivered back into Mike’s general journal');
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
test('browser bridge keeps an undelivered Iona completion out of Mike’s general journal',()=>{
 function finish(id){
  const s=ready();s.done=s.done.filter(x=>x!==id);s.flags.waldo_invited=s.flags.waldo_visit_received=s.flags.relay_delivered=s.flags.relay_iona=true;
  A.start(s,id,{},true);s.active.step=A.episode(id).goals.length-1;const g=A.current(s);s.active.actor=g.actor||A.episode(id).actor;at(s,g);
  const n={x:s.active.x,y:s.active.y,w:22,h:34,enemies:[],_livingWorld:{active:true}},journal=[{title:'Existing personal record'}];let options,saves=0;
  const r={TechOpsLivingWorld:A,TechOpsLivingWorldData:A.Data,S:{meta:{livingWorld:s},nightMode:n,journal,day:1},document:{getElementById:()=>null},save:()=>{saves++;return true;},dlg:(title,body,choices)=>{options=choices;},closeDlg:()=>{}};r.globalThis=r;
  vm.runInNewContext(fs.readFileSync('campaign_living_world_runtime.js','utf8'),r);r.TechOpsLivingWorldRuntime.interact();options[0].f();
  assert.equal(s.active.finished,true);assert.equal(saves,1);return r.S.journal;
 }
 assert.equal(finish('no_common_channel').length,1);assert.equal(finish('service_ring').length,2);
});
test('aftermath reports only completed consequences',()=>{
 const s=A.initial();assert(!A.consequences(s).includes('An Unfinished Song:'));s.flags.song_shared=true;
 assert(A.consequences(s).includes('An Unfinished Song:'));assert(!A.consequences(s).includes('The Spare Key:'));
});
test('earlier viewpoints are explicit and never imply a physical return from space to Earth',()=>{
 for(const id of ['morrow_array','no_common_channel','hold_receiving','iona_receiving']){const e=A.episode(id);assert.match(e.chapter,/Earlier/);assert.match(e.bridge,/Earlier/);}
 assert.match(A.episode('no_common_channel').bridge,/before the pier convergence and departure/);
 assert.match(A.episode('morrow_array').bridge,/before the Earth fracture/);
});
test('Iona comic interlude unlocks from Night Walker progress and preserves comic chronology',()=>{
 const s=A.initial('campaign');
 s.flags.waldo_invited=s.flags.waldo_visit_received=true;
 s.done=['iona_local'];
 assert.equal(A.gate(s,'iona_pressure',{facts:{campaign_complete:true}}).open,true);
 s.done.push('iona_pressure');
 assert.equal(A.gate(s,'iona_world_left_running',{facts:{campaign_complete:false}}).open,false);
 assert.equal(A.gate(s,'iona_world_left_running',{facts:{campaign_complete:true}}).open,true);
 assert.equal(A.gate(s,'iona_freight_name',{facts:{campaign_complete:true}}).open,false);
 s.done.push('iona_world_left_running');
 assert.equal(A.gate(s,'iona_freight_name',{facts:{campaign_complete:true}}).open,true);
 assert.equal(A.gate(s,'archive',{facts:{campaign_complete:true}}).open,false);
 s.done.push('iona_freight_name');
 assert.equal(A.gate(s,'archive',{facts:{campaign_complete:true,mike_meets_k:true}}).open,true);
 assert.match(A.episode('iona_world_left_running').bridge,/after Red’s arrest and before Iona contacts K/);
 const revenge=A.episode('iona_world_left_running');
 assert.deepEqual(revenge.goals.slice(revenge.goals.findIndex(g=>g.id==='first_count'),revenge.goals.findIndex(g=>g.id==='sandbag')+1).map(g=>g.id),['first_count','position','draw_guard','sandbag']);
 assert(revenge.goals.findIndex(g=>g.id==='send_medics')<revenge.goals.findIndex(g=>g.id==='cut'));
 assert(revenge.goals.findIndex(g=>g.id==='lift_rescue')<revenge.goals.findIndex(g=>g.id==='free'));
 assert.match(revenge.goals.find(g=>g.id==='draw_guard').text,/closed security grille/);
 assert.match(revenge.goals.find(g=>g.id==='sandbag').text,/first guard is already across/);
 assert.match(revenge.goals.find(g=>g.id==='sandbag').text,/does not end the pursuit/);
 assert(revenge.goals.findIndex(g=>g.id==='all_clear')<revenge.goals.findIndex(g=>g.id==='burn'));
 assert.match(revenge.goals.find(g=>g.id==='burn').text,/only after the verified all-clear/);
 assert.match(A.episode('iona_freight_name').goals[1].options[1][2],/authorizer’s identity remains unresolved/);
});
test('shipboard coda preserves existing save IDs and distinguishes carried records from live Earth reports',()=>{
 const e=A.episode('queue_afterward');assert.deepEqual(e.rooms.map(r=>r.id),['desk','floor','home']);assert.deepEqual(e.goals.map(g=>g.id),['queue','repair','remember','end']);assert.deepEqual(e.after,['low_return']);assert.match(e.bridge,/existing crew/);assert.match(e.goals.at(-1).text,/rests aboard/);
 for(const id of ['spare_key','repair_held','takes_over','place_ready']){const q=A.Data.sidequests.find(q=>q.id===id);assert.match(q.steps.at(-1)[1],/Earth/);assert.equal(q.stages.at(-1).episode,'queue_afterward');}
 const s=ready();s.flags.waldo_invited=s.flags.waldo_visit_received=true;A.start(s,e.id,{});s.active.room='home';s.active.step=3;const old=A.validate(JSON.parse(JSON.stringify(s)));A.start(old,e.id,{});assert.equal(old.active.room,'home');assert.equal(old.active.step,3);
});
test('bounded return preserves two travelers, unequal clocks and the care watch',()=>{
 const e=A.episode('low_return');assert.match(e.bridge,/Only K and Iona/);assert.match(e.bridge,/six ship-side hours, twenty-four Low Quarter hours/);assert.match(e.bridge,/explicit care watch/);assert.match(e.bridge,/spare is consumed/);assert.match(A.episode('factory_return').bridge,/one living body remains under care/);
});
console.log(JSON.stringify({suite:'living-world-progression',checks}));
