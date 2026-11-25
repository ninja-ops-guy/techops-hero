'use strict';
const assert=require('node:assert/strict');
const {driver}=require('./test_campaign_low_quarter_mission.js');
const Archive=require('./campaign_living_archive.js'),Mission=require('./campaign_low_quarter_mission.js'),Rescue=require('./campaign_low_quarter.js'),Campaign=require('./campaign_act1.js'),Siege=require('./campaign_chorus_siege.js');
const clone=v=>JSON.parse(JSON.stringify(v));
let count=0;function test(name,fn){fn();count++;console.log('PASS '+name);}
// The initial completed epilogue is the existing mission harness fixture.
// Preparation, marking, local reading and positive traversal use world inputs.
const original=driver();original.prepare('transport');const prepared=clone(original.state);
function fresh(){const d=driver();d.state=clone(prepared);return d;}
function event(s,type,fields){return Rescue.applyEvent(s,Object.assign({id:'r_'+s.lowQuarter.events.length,runId:s.lowQuarter.runId,operation:s.lowQuarter.scenario,tick:Math.floor(s.lowQuarterMission.clock),type},fields));}
function marked(){const d=fresh();d.use('mark_approaches');return d;}
test('unwitnessed route flags and remote input cannot publish a mark',()=>{
 const d=driver();for(let i=0;i<4;i++)d.use('access_'+i);d.state.lowQuarterMission.routeTested.approaches=true;
 assert.equal(Archive.canPost(d.state,'approaches'),false);assert.throws(()=>Archive.post(d.state,'approaches'),/Test/);
 const s=clone(prepared);assert(Archive.canPost(s,'approaches'));assert.throws(()=>Archive.post(s,'approaches'),/physical/);
});
test('physical marks persist and move consenting walkers without nearby K',()=>{
 const d=marked(),m=d.state.lowQuarterMission,before=clone(m.residents),safeBefore=Rescue.evaluate(d.state).safe.length,story=clone(d.state.story);
 assert.equal(m.player.x,1640);assert.equal(Archive.status(d.state,'approaches').ready,true);
 assert.equal(m.archive.marks[0].by,'k_red_el');assert.equal(m.archive.marks[0].witness,'approaches_engineer');
 d.walk(2700);d.step({},40);
 assert.equal(d.state.lowQuarterMission.residents.lq_a_02.status,'gate');
 assert(d.state.lowQuarterMission.residents.lq_a_02.x>before.lq_a_02.x);
 assert.equal(d.state.lowQuarterMission.residents.lq_a_01.status,'home','attendant request does not follow unattended');
 assert.equal(Rescue.evaluate(d.state).safe.length,safeBefore,'directions do not establish receiving care');
 assert.deepEqual(d.state.story,story,'no new memory, intimacy, ending or progression fact');
 assert.equal(d.state.lowQuarterMission.archive.marks.length,1,'staying by a mark cannot duplicate it');
});
test('off-sector continuation uses the saved mark, not the character presence',()=>{
 const d=marked(),s=clone(d.state);s.lowQuarterMission.player={...s.lowQuarterMission.player,sector:'services',x:350};
 // Explicit position fixture isolates off-sector stepping, not a playthrough claim.
 const before=s.lowQuarterMission.residents.lq_a_02.x,next=Mission.step(s,{},.25);
 assert(next.lowQuarterMission.residents.lq_a_02.x>before);assert.equal(next.lowQuarterMission.residents.lq_a_02.followedMark,'mark_1');
});
test('unknown consent, refusal and a change of choice all stop autonomous following',()=>{
 const s=marked().state;
 for(const choice of [undefined,'declined','shelter']){const v=clone(s);v.lowQuarterMission.choices.lq_a_02=choice;assert.equal(Archive.canFollow(v,'lq_a_02'),false);}
 const d=marked();d.step({},80);d.use('lq_a_02');d.choose('declined');assert.equal(Archive.canFollow(d.state,'lq_a_02'),false);assert.equal(Rescue.inspect(d.state).people.lq_a_02.consent,'declined');
});
test('mirrored consent and care fields cannot substitute for authoritative sources',()=>{
 const s=marked().state,revoked=event(s,'consent',{actor:'approaches_witness',person:'lq_a_02',choice:'declined'});
 assert.equal(revoked.lowQuarterMission.choices.lq_a_02,'transport','intentionally stale mirror');assert.equal(Archive.canFollow(revoked,'lq_a_02'),false);
 const noConsent=clone(s);noConsent.lowQuarter.events=noConsent.lowQuarter.events.filter(e=>e.type!=='consent'||e.person!=='lq_a_02');assert.equal(Archive.canFollow(noConsent,'lq_a_02'),false);
 const care=clone(s);care.lowQuarterMission.residents.lq_a_01.care='ordinary care';assert.equal(Archive.canFollow(care,'lq_a_01'),false,'authored attendant requirement remains');
});
test('route closure and a later reopening never make an old mark current',()=>{
 const d=marked();d.state=event(d.state,'route',{actor:'approaches_engineer',route:'approaches_primary',open:false});
 assert.equal(Archive.status(d.state,'approaches').ready,false);assert.equal(Archive.canFollow(d.state,'lq_a_02'),false);
 d.state=event(d.state,'route',{actor:'approaches_engineer',route:'approaches_primary',open:true});
 assert.equal(Archive.status(d.state,'approaches').ready,false,'same lane with a different receipt needs correction');
 const old=clone(d.state.lowQuarterMission.archive.marks[0]);d.use('mark_approaches');
 assert.equal(Archive.status(d.state,'approaches').ready,true);assert.equal(d.state.lowQuarterMission.archive.marks.length,2);assert.deepEqual(d.state.lowQuarterMission.archive.marks[0],old);
});
test('a closed primary is replaced by a separately tested alternative',()=>{
 const d=marked();d.state=event(d.state,'route',{actor:'approaches_engineer',route:'approaches_primary',open:false});d.use('mark_approaches');
 assert.equal(Archive.currentMark(d.state,'approaches').route,'approaches_alternative');assert(Archive.status(d.state,'approaches').ready);
});
test('lost service, a missing defender and local threats each suspend unattended movement',()=>{
 const s=marked().state;
 let damaged=event(s,'sector',{actor:'approaches_engineer',sector:'approaches',habitable:false,contained:false});assert.equal(Archive.canFollow(damaged,'lq_a_02'),false);
 let lost=event(s,'unit',{actor:'approaches_officer',unit:'mil_a_bend',sector:'approaches',post:'a_bend',ready:false});assert.equal(Archive.canFollow(lost,'lq_a_02'),false);
 let threat=clone(s);threat.lowQuarterMission.enemies.push({id:'fixture_threat',sector:'approaches',x:1200,hp:3});assert.equal(Archive.canFollow(threat,'lq_a_02'),false);
 assert(Archive.canFollow(s,'lq_a_02'));assert.equal(Archive.currentMark(damaged,'approaches').id,'mark_1','repair history is retained');
});
test('pause and failed persistence cannot move people or commit new marks',()=>{
 const d=marked(),s=clone(d.state);assert.deepEqual(Mission.step(s,{paused:true},.25),s);
 const unmarked=clone(prepared);unmarked.lowQuarterMission.player.x=1640;
 assert.throws(()=>Rescue.transact(unmarked,v=>{v.lowQuarterMission.archive=Archive.post(v,'approaches');return v;},()=>false),/saved/);
 assert.equal(unmarked.lowQuarterMission.archive,undefined);
});
test('save and reload retain marks without granting transport or rescue',()=>{
 const s=marked().state,storage={value:null,setItem(k,v){this.value=v;},getItem(){return this.value;}};
 Campaign.save(s,storage);const reloaded=Campaign.load(storage);assert.deepEqual(reloaded.lowQuarterMission.archive,s.lowQuarterMission.archive);assert(Archive.status(reloaded,'approaches').ready);
 assert.deepEqual(Rescue.evaluate(reloaded),Rescue.evaluate(s));assert.equal(Archive.validate(reloaded).valid,true);
});
test('unbound records, a wrong run and future schemas preserve the input and block continuation',()=>{
 const s=marked().state;
 for(const defect of [v=>v.archive.marks[0].source='missing',v=>v.archive.runId='different',v=>v.archive.marks[0].by='mike']){
  const v=clone(s);defect(v.lowQuarterMission);const original=clone(v);assert.equal(Mission.validate(v).valid,false);assert.throws(()=>Mission.step(v,{},.25));assert.deepEqual(v,original);
 }
 const future=clone(s);future.lowQuarterMission.archive.schema=99;const before=clone(future);assert(Mission.validate(future).continuationBlocked);assert.throws(()=>Mission.step(future,{},.25),/unavailable/);assert.deepEqual(future,before);
});
test('local readings require a physical visit and remain honest last-read snapshots',()=>{
 const d=marked();assert.throws(()=>Archive.read(d.state,'approaches'),/physical/);d.use('records_approaches');
 assert.equal(d.state.lowQuarterMission.dialog.kind,'archive');d.choose('cancel');
 const remembered=Archive.remembered(d.state),before=clone(d.state);assert(remembered.some(c=>c.id==='approaches_route'));assert.equal(Archive.validate(d.state).valid,true);
 d.state=event(d.state,'route',{actor:'approaches_engineer',route:'approaches_primary',open:false});
 assert.deepEqual(Archive.remembered(d.state),remembered,'no remote update or omniscient notebook');
 assert(Archive.inspect(d.state,'approaches').find(c=>c.id==='approaches_route').body.includes('correct the old directions'));
 const control=clone(before);Archive.inspect(before,'approaches');assert.deepEqual(before,control,'inspection never writes shared evidence or a copied reading');
 d.use('records_approaches');d.choose('cancel');assert.notDeepEqual(Archive.remembered(d.state),remembered);
});
test('reading copies does not create records or advance the simulation',()=>{
 const d=fresh(),before=clone(d.state);d.step({readArchive:true});assert.equal(d.state.lowQuarterMission.dialog.kind,'archive');assert.equal(d.state.lowQuarterMission.elapsed,before.lowQuarterMission.elapsed);assert.equal(d.state.lowQuarterMission.archive,undefined);assert.deepEqual(Archive.remembered(d.state),[]);d.choose('cancel');
 assert.deepEqual(d.state.lowQuarter.events,before.lowQuarter.events);assert.deepEqual(d.state.lowQuarter.siege.events,before.lowQuarter.siege.events);
});
test('an unavailable archive module preserves legacy play and blocks marked saves',()=>{
 const fs=require('node:fs'),vm=require('node:vm'),context={TechOpsLowQuarter:Rescue,TechOpsChorusSiege:Siege,TechOpsLowQuarterScenario:Mission.content};context.globalThis=context;
 vm.runInNewContext(fs.readFileSync('./campaign_low_quarter_mission.js','utf8'),context);
 assert.equal(context.TechOpsLowQuarterMission.validate(prepared).valid,true);assert.equal(context.TechOpsLowQuarterMission.validate(prepared).continuationBlocked,undefined);
 const emptyView=clone(prepared);emptyView.lowQuarterMission.dialog={kind:'archive',sector:null};assert(context.TechOpsLowQuarterMission.validate(emptyView).continuationBlocked,'an open empty records view also requires its renderer dependency');
 const s=marked().state,before=clone(s);assert(context.TechOpsLowQuarterMission.validate(s).continuationBlocked);assert.throws(()=>context.TechOpsLowQuarterMission.step(s,{},.25),/unavailable/);assert.deepEqual(s,before);
});
test('copied readings reject removed or duplicate source references',()=>{
 const d=marked();d.use('records_approaches');d.choose('cancel');const s=clone(d.state);
 s.lowQuarterMission.archive.readings.approaches[0].sources[0].id='missing';assert.equal(Archive.validate(s).valid,false);
 const v=clone(d.state),refs=v.lowQuarterMission.archive.readings.approaches[0].sources;refs.push(clone(refs[0]));assert.equal(Archive.validate(v).valid,false);
});
test('one lane receipt cannot claim both lanes were checked',()=>{
 const d=driver();for(let i=0;i<4;i++)d.use('access_'+i);
 d.state=event(d.state,'route',{actor:'approaches_engineer',route:'approaches_primary',open:true});
 const text=Archive.inspect(d.state,'approaches').find(c=>c.id==='approaches_route').body;assert(!text.includes('Both local lanes'));assert(text.includes('A local lane record exists'));
});
test('Chorus traces need actual assimilation; relay loss does not erase acquired fragments',()=>{
 const d=fresh();assert(!Archive.inspect(d.state,'approaches').some(c=>c.id==='chorus_fragment'));
 d.walk(2600);d.waitUntil(s=>s.lowQuarterMission.picket==='assimilated');const acquired=Object.keys(Siege.status(d.state).acquiredFacts);assert(acquired.length>0);
 d.use('relay');assert.equal(d.state.lowQuarterMission.relay,false);assert.deepEqual(Object.keys(Siege.status(d.state).acquiredFacts),acquired);
 const fragment=Archive.inspect(d.state,'approaches').find(c=>c.id==='chorus_fragment');assert(fragment.body.includes('bounded tactical'));assert(fragment.body.includes('not reveal'));assert(fragment.sources.length>=2);
});
console.log('Living Archive: '+count+' groups PASS');
