'use strict';
const assert=require('assert/strict'),fs=require('fs'),vm=require('vm');
const Rescue=require('./campaign_low_quarter.js'),Campaign=require('./campaign_act1.js'),Story=require('./campaign_story.js');
let tests=0;
function test(name,fn){fn();tests++;}
const clone=x=>JSON.parse(JSON.stringify(x));
const gates=[...new Set(Rescue.COMMON.concat(...Object.values(Rescue.AUTHORITY)))];
// Synthetic test-only geography and strengths. Not registered in the shipped browser.
const def={id:'fixture',revision:'test_1',approved:true,
  sectors:[{id:'sector_a',requiredStrength:4,posts:['gate','reserve']}],
  actors:[{id:'observer',role:'witness',location:'sector_a'},
    {id:'officer',role:'officer',location:'sector_a'},
    {id:'engineer',role:'engineer',location:'sector_a'},
    {id:'receiver',role:'receiver',location:'safe'},
    {id:'driver',role:'engineer',location:'gate'},
    {id:'gate_witness',role:'witness',location:'gate'},
    {id:'commander',role:'commander',location:'sector_a'}],
  people:[{id:'person_a',sector:'sector_a'}],
  units:[{id:'military',kind:'military',strength:2,commandModes:['independent','central','distributed']},
    {id:'robots',kind:'robot',strength:2,commandModes:['independent','central','distributed']},
    {id:'replacement',kind:'military',strength:2,commandModes:['independent','central','distributed']}],
  routes:[{id:'west',sector:'sector_a',gate:'gate',destination:'safe',duration:3}],
  vehicles:[{id:'van',capacity:1,location:'gate'}],
  links:[{from:'gate',to:'safe',duration:3},{from:'safe',to:'gate',duration:3}],
  checks:gates.concat(['space_lead','ship_qualified','crew_accounted','home_handoff']).map(id=>({id,location:'sector_a',roles:['witness'],sources:['physical_check','independent_record']}))};
Rescue.registerScenario(def);
function base(ending){
  const s=Campaign.createInitialState();s.story={schemaVersion:2,ending,achievement:Story.ENDINGS[ending].achievement,completedActs:[],facts:{campaign_complete:true}};
  s.lateGame={chapters:{ending}};return s;
}
function start(ending='shutdown'){return Rescue.begin(base(ending),def.id,def.revision,'run_a');}
function apply(s,type,fields={}){const n=s.lowQuarter.events.length+1;return Rescue.applyEvent(s,{id:'e'+n,runId:'run_a',operation:'fixture',tick:(s.lowQuarter.events.at(-1)?.tick||0)+1,type,...fields});}
function check(s,key,fields={}){return apply(s,'check',{actor:'observer',check:key,sources:['physical_check','independent_record'],...fields});}
function ready(ending='shutdown',omit){
  let s=start(ending);s=apply(s,'survey',{actor:'observer',sector:'sector_a'});
  for(const k of Rescue.COMMON.concat(Rescue.AUTHORITY[ending]))if(k!==omit)s=check(s,k);
  if(omit!=='threat_corroborated')s=apply(s,'warn',{actor:'observer',sector:'sector_a'});
  s=apply(s,'consent',{actor:'observer',person:'person_a',choice:'shelter'});
  s=apply(s,'shelter',{actor:'observer',person:'person_a',careVerified:true,safetyVerified:true});
  if(!Rescue.AUTHORITY[ending].includes(omit))for(const [unit,post] of [['military','gate'],['robots','reserve']])s=apply(s,'unit',{actor:'officer',unit,post,sector:'sector_a',ready:true,independentControlTested:true});
  s=apply(s,'sector',{actor:'engineer',sector:'sector_a',habitable:true,contained:true});return s;
}
for(const ending of Object.keys(Rescue.AUTHORITY)){
  test(ending+' can save district with military and robots',()=>assert.equal(Rescue.evaluate(ready(ending)).outcome,'district_saved'));
  for(const key of Rescue.AUTHORITY[ending])test(ending+' requires '+key,()=>assert.notEqual(Rescue.evaluate(ready(ending,key)).outcome,'district_saved'));
}
for(const key of Rescue.COMMON)test('common requirement '+key,()=>assert.notEqual(Rescue.evaluate(ready('shutdown',key)).outcome,'district_saved'));
test('military replacement permits shutdown without robot capability',()=>{
  const d=clone(def);d.id='no_robot';d.units.find(u=>u.id==='robots').commandModes=['central','distributed'];Rescue.registerScenario(d);
  let s=Rescue.begin(base('shutdown'),d.id,d.revision,'run_a');
  const event=(type,fields)=>{const n=s.lowQuarter.events.length+1;s=Rescue.applyEvent(s,{id:'e'+n,runId:'run_a',operation:d.id,tick:(s.lowQuarter.events.at(-1)?.tick||0)+1,type,...fields});};
  event('survey',{actor:'observer',sector:'sector_a'});
  for(const k of Rescue.COMMON.concat(Rescue.AUTHORITY.shutdown))event('check',{actor:'observer',check:k,sources:['physical_check','independent_record']});
  assert.throws(()=>event('unit',{actor:'officer',unit:'robots',sector:'sector_a',post:'reserve',ready:true,independentControlTested:true}),/command arrangement/);
  for(const [unit,post] of [['military','gate'],['replacement','reserve']])event('unit',{actor:'officer',unit,post,sector:'sector_a',ready:true});
  event('warn',{actor:'observer',sector:'sector_a'});event('consent',{actor:'observer',person:'person_a',choice:'shelter'});
  event('shelter',{actor:'observer',person:'person_a',careVerified:true,safetyVerified:true});event('sector',{actor:'engineer',sector:'sector_a',habitable:true,contained:true});
  assert.equal(Rescue.evaluate(s).outcome,'district_saved');
});
test('shutdown robots need independently tested control',()=>assert.throws(()=>apply(ready(),'unit',{actor:'officer',unit:'robots',post:'reserve',sector:'sector_a',ready:true}),/independent control/));
test('coordination without strength does not save district',()=>{
  let s=ready('open_network');s=apply(s,'unit',{actor:'officer',unit:'robots',post:'reserve',sector:'sector_a',ready:false});assert.notEqual(Rescue.evaluate(s).outcome,'district_saved');assert(Rescue.evaluate(s).missing.includes('sector_a:defensive_capacity'));
});
test('strength without reserve coverage does not save district',()=>{
  const s=apply(ready(),'unit',{actor:'officer',unit:'robots',post:'gate',sector:'sector_a',ready:true,independentControlTested:true});assert.notEqual(Rescue.evaluate(s).outcome,'district_saved');
});
function evacuated(){
  let s=ready();s=apply(s,'consent',{actor:'observer',person:'person_a',choice:'transport'});
  s=apply(s,'route',{actor:'driver',route:'west',open:true});
  s=apply(s,'depart',{actor:'gate_witness',route:'west',vehicle:'van',trip:'trip_a',people:['person_a'],staff:['driver']});
  return apply(s,'arrive',{actor:'receiver',trip:'trip_a',careAccepted:true,tick:s.lowQuarter.events.at(-1).tick+3});
}
test('verified evacuation can save people but lose district',()=>{
  const s=apply(evacuated(),'sector',{actor:'engineer',sector:'sector_a',habitable:false,contained:false});assert.equal(Rescue.evaluate(s).outcome,'evacuation_only');
});
test('refusal is not rescue',()=>{
  let s=start();s=apply(s,'consent',{actor:'observer',person:'person_a',choice:'declined'});
  assert.throws(()=>apply(s,'shelter',{actor:'observer',person:'person_a',careVerified:true,safetyVerified:true}),/consent/);
  assert.equal(Rescue.evaluate(s).outcome,'rescue_failed');assert.equal(Rescue.evaluate(s).people.person_a.status,'unknown');
});
test('newly discovered person invalidates previous count',()=>{
  const s=apply(ready(),'discover',{actor:'observer',person:'person_b',sector:'sector_a'});
  const r=Rescue.evaluate(s);assert.equal(r.outcome,'partial_rescue');assert(r.missing.includes('roster_reconciled'));assert.deepEqual(r.unresolved,['person_b']);
});
for(const actor of ['commander','orpheus','receiver'])test('reject wrong role or location '+actor,()=>assert.throws(()=>check(start(),'threat_corroborated',{actor}),/verifier/));
test('single source cannot self authenticate',()=>assert.throws(()=>check(start(),'threat_corroborated',{sources:['physical_check']}),/sources/));
test('event scope and duplicate identity',()=>{
  const s=start(),e={id:'receipt_a',runId:'run_a',operation:'fixture',tick:1,type:'survey',actor:'observer',sector:'sector_a'};
  assert.throws(()=>Rescue.applyEvent(s,{...e,runId:'iona_depot'}),/different rescue/);
  const next=Rescue.applyEvent(s,e);assert.deepEqual(Rescue.applyEvent(next,e),next);assert.throws(()=>Rescue.applyEvent(next,{...e,tick:2}),/Conflicting/);
});
test('wrong actor cannot move through arbitrary geography',()=>assert.throws(()=>apply(start(),'move',{actor:'observer',to:'safe'}),/route/));
test('evacuation capacity and independent crossing witness',()=>{
  let s=ready();s=apply(s,'consent',{actor:'observer',person:'person_a',choice:'transport'});s=apply(s,'route',{actor:'driver',route:'west',open:true});
  assert.throws(()=>apply(s,'depart',{actor:'gate_witness',route:'west',vehicle:'van',trip:'trip_a',people:['person_a','person_a'],staff:['driver']}),/capacity/);
  assert.throws(()=>apply(s,'depart',{actor:'gate_witness',route:'west',vehicle:'van',trip:'trip_a',people:['person_a'],staff:['gate_witness']}),/independent/);
  s=apply(s,'depart',{actor:'gate_witness',route:'west',vehicle:'van',trip:'trip_a',people:['person_a'],staff:['driver']});
  assert.throws(()=>apply(s,'arrive',{actor:'receiver',trip:'trip_a',careAccepted:true}),/not arrived/);
  assert.throws(()=>apply(s,'move',{actor:'driver',to:'safe',tick:s.lowQuarter.events.at(-1).tick+3}),/transit/);
  const interrupted=apply(s,'trip_failed',{actor:'gate_witness',trip:'trip_a'});assert.equal(Rescue.evaluate(interrupted).people.person_a.status,'unknown');
  assert.throws(()=>apply(interrupted,'arrive',{actor:'receiver',trip:'trip_a',careAccepted:true,tick:100}),/Interrupted/);
});
test('closeout requires confirmation and optimistic event count',()=>{
  const s=ready(),n=s.lowQuarter.events.length;assert.throws(()=>Rescue.closeout(s,n,false),/Confirm/);assert.throws(()=>Rescue.closeout(s,n-1,true),/Stale/);
  const closed=Rescue.closeout(s,n,true);assert.equal(closed.lowQuarter.result.outcome,'district_saved');assert.throws(()=>apply(closed,'survey',{}),/not active/);assert.equal(Rescue.validate(closed).valid,true);
  closed.lowQuarter.result.outcome='rescue_failed';assert.equal(Rescue.validate(closed).valid,false);
});
test('save throws or false leave original state unchanged',()=>{
  const s=ready(),before=clone(s),op=x=>Rescue.closeout(x,x.lowQuarter.events.length,true);
  assert.throws(()=>Rescue.transact(s,op,()=>false),/saved/);assert.deepEqual(s,before);
  assert.throws(()=>Rescue.transact(s,op,()=>{throw new Error('quota');}),/quota/);assert.deepEqual(s,before);
});
test('canonical campaign serializer preserves rescue and legacy rewards',()=>{
  for(const ending of Object.keys(Rescue.AUTHORITY)){
    const data=new Map(),storage={setItem:(k,v)=>data.set(k,v),getItem:k=>data.get(k)};
    const s=ready(ending);s.privateMarker={unchanged:42};
    const saved=Rescue.transact(s,x=>Rescue.closeout(x,x.lowQuarter.events.length,true),x=>Campaign.save(x,storage));
    const loaded=Campaign.load(storage);assert.deepEqual(loaded.lowQuarter,saved.lowQuarter);assert.deepEqual(loaded.privateMarker,s.privateMarker);assert.equal(loaded.story.achievement,s.story.achievement);
  }
});
test('legacy migration preserves completion, ending and unknown fields',()=>{
  const s=base('control');s.custom={value:42};const migrated=Rescue.migrate(s);assert.deepEqual(Rescue.migrate(migrated),migrated);assert.deepEqual(migrated.story,s.story);assert.equal(migrated.lowQuarter.result,null);assert.equal(s.lowQuarter,undefined);
  assert.throws(()=>Rescue.begin({...s,story:{...s.story,facts:{}}},'fixture','test_1','run_a'),/epilogue/);
});
test('unknown future version and missing mission preserve save',()=>{
  const s=base('shutdown');s.lowQuarter={schema:99,phase:'future',payload:'preserve'};const before=clone(s);assert.equal(Rescue.validate(s).continuationBlocked,true);assert.deepEqual(s,before);
  const missing=ready();missing.lowQuarter.revision='missing';assert.equal(Rescue.validate(missing).continuationBlocked,true);
});
test('ending mismatch rejected without corruption',()=>{
  const s=ready();s.lateGame.chapters.ending='control';assert.throws(()=>Rescue.evaluate(s),/Conflicting/);assert.equal(Rescue.validate(s).valid,false);
});
test('space stays separate from every rescue outcome',()=>{
  for(const s of [ready(),evacuated(),start()]){
    const before=Rescue.evaluate(s);assert.equal(before.deepSpaceEligible,false);let next=s;
    for(const key of ['space_lead','ship_qualified','crew_accounted','home_handoff'])next=check(next,key);
    const r=Rescue.evaluate(next);assert.equal(r.deepSpaceEligible,true);assert.equal(r.malarUnlocked,false);assert.equal(r.chorus,'active');assert.equal(r.ionaCampaign,'ongoing');
  }
});
test('deadline is deterministic and needs explicit prior warning',()=>{
  const d=clone(def);d.id='deadline_fixture';d.deadline={warningTick:5,tick:10,location:'sector_a'};Rescue.registerScenario(d);
  const s=Rescue.begin(base('shutdown'),d.id,d.revision,'run_a');
  const e={id:'warn',runId:'run_a',operation:d.id,tick:5,type:'deadline_warning',actor:'observer'};
  const warned=Rescue.applyEvent(s,e);const expired=Rescue.applyEvent(warned,{...e,id:'end',tick:10,type:'deadline'});
  assert.throws(()=>Rescue.applyEvent(expired,{...e,id:'later',tick:11}),/closed/);
  assert.throws(()=>Rescue.applyEvent(s,{...e,id:'end',tick:10,type:'deadline'}),/prior/);
});
test('stored forged success fails replay validation',()=>{
  const s=ready();s.lowQuarter.events[0].actor='commander';assert.equal(Rescue.validate(s).valid,false);
});
test('scenario revisions cannot silently change',()=>assert.throws(()=>Rescue.registerScenario({...clone(def),people:[]}),/replaced/));
test('no synthetic mission ships in browser',()=>{
  const source=fs.readFileSync('campaign_low_quarter.js','utf8');assert(!source.includes("id:'fixture'"));assert.throws(()=>Rescue.begin(base('shutdown'),'not_authored','v1','run_a'),/not available/);
});
// Existing standalone engine already ignores arbitrary supplied flags and reconstructs history.
// Full isolation is also enforced by the browser bridge.
test('browser board blocks standalone scenes',()=>{
  const root={S:{meta:{_standaloneMode:'gooddogs'}},TechOpsCampaign:{load(){throw new Error('must not read');}},TechOpsLowQuarter:Rescue};root.globalThis=root;
  vm.runInNewContext(fs.readFileSync('campaign_low_quarter_runtime.js','utf8'),root);assert.equal(root.TechOpsLowQuarterRuntime.open(),false);assert.equal(root.TechOpsLowQuarterRuntime.snapshot().phase,'blocked');
});


// Exercise the actual Chapter X transaction, including storage failures.
function endingContext(saveResult){
  const state=base('open_network');state.story.ending=null;state.story.completedActs=['prologue','act_1','act_2','act_3','act_4','act_5','act_6','interlude','act_7','act_8'];
  state.story.facts={watchdog_defeated:true,orpheus_interface_reached:true,k_personhood_affirmed:true,duet_protocol_complete:true};state.lateGame={metrics:{evidence:80,trust:80},chapters:{ending:null,history:[]}};
  const root={console,Date,JSON,Object,Math,Array,Number,String,Boolean,RegExp,localStorage:{},S:{inDialog:true},setInterval:()=>0,setTimeout:()=>0,clearInterval:()=>{},TechOpsStory:Story,TechOpsCampaign:{load:()=>state,save:s=>{if(saveResult instanceof Error)throw saveResult;if(saveResult===false)return false;Object.assign(state,s);return true;}},TechOpsMORNINGSTARBuild:{getCurrentPhase:()=>5},TechOpsCampaignAct2:{snapshot:()=>({evidenceScore:80,trustScore:80})},dlg:()=>{},closeDlg:()=>{}};
  root.globalThis=root;vm.runInNewContext(fs.readFileSync('chapters_vii_x.js','utf8'),root);return {root,state};
}
for(const fail of [false,new Error('quota')])test('Chapter X save failure is atomic '+String(fail),()=>{
  const {root,state}=endingContext(fail),before=clone(state);assert.equal(root.TechOpsChapterX.selectEnding('open_network'),false);assert.deepEqual(clone(state),before);
});
test('Chapter X locks both ending records and repeated selection is a no-op',()=>{
  const {root,state}=endingContext(true);assert.equal(root.TechOpsChapterX.selectEnding('open_network'),true);const before=clone(state);
  assert.equal(root.TechOpsChapterX.selectEnding('open_network'),true);assert.deepEqual(clone(state),before);
  assert.equal(root.TechOpsChapterX.selectEnding('shutdown'),false);assert.deepEqual(clone(state),before);
  assert.equal(state.story.ending,state.lateGame.chapters.ending);
});
test('shelter loses verified safety when its sector falls',()=>{
  const s=apply(ready(),'sector',{actor:'engineer',sector:'sector_a',habitable:false,contained:false});assert.equal(Rescue.evaluate(s).outcome,'rescue_failed');assert.deepEqual(Rescue.evaluate(s).unresolved,['person_a']);
});


test('later space preparation cannot rewrite a closed district outcome',()=>{
  for(const open of [ready(),start()]){
    let s=Rescue.closeout(open,open.lowQuarter.events.length,true),result=clone(s.lowQuarter.result);
    for(const key of ['space_lead','ship_qualified','crew_accounted','home_handoff']){
      const n=s.lowQuarter.events.length+(s.lowQuarter.continuationEvents||[]).length+1;
      s=Rescue.applyContinuationEvent(s,{id:'later_'+n,runId:'run_a',operation:'fixture',tick:100+n,type:'check',actor:'observer',check:key,sources:['physical_check','independent_record']});
    }
    assert.equal(Rescue.continuationStatus(s).deepSpaceEligible,true);assert.deepEqual(s.lowQuarter.result,result);assert.equal(Rescue.validate(s).valid,true);
    assert.throws(()=>Rescue.applyContinuationEvent(s,{id:'rewrite',runId:'run_a',operation:'fixture',tick:999,type:'sector',actor:'engineer',sector:'sector_a',habitable:true}),/cannot rewrite/);
  }
});


test('vehicle cannot be reused until its driver returns it physically',()=>{
  let s=evacuated();s=apply(s,'discover',{actor:'observer',person:'person_b',sector:'sector_a'});s=apply(s,'consent',{actor:'observer',person:'person_b',choice:'transport'});
  assert.throws(()=>apply(s,'depart',{actor:'gate_witness',route:'west',vehicle:'van',trip:'trip_b',people:['person_b'],staff:['driver']}),/returned/);
  s=apply(s,'return_vehicle',{actor:'driver',vehicle:'van',to:'gate',tick:s.lowQuarter.events.at(-1).tick+3});
  s=apply(s,'depart',{actor:'gate_witness',route:'west',vehicle:'van',trip:'trip_b',people:['person_b'],staff:['driver']});
  s=apply(s,'arrive',{actor:'receiver',trip:'trip_b',careAccepted:true,tick:s.lowQuarter.events.at(-1).tick+3});
  assert.equal(Rescue.evaluate(s).people.person_b.status,'evacuated');
});


test('canonical save refuses forged closed rescue results',()=>{
  const s=ready();s.lowQuarter.phase='closed';s.lowQuarter.result={outcome:'district_saved'};
  const storage={setItem(){throw new Error('must never write invalid result');}};
  assert.throws(()=>Campaign.save(s,storage),/verified events/);
});
test('schema 1 campaign migration retains optional rescue state',()=>{
  const s=ready();s.schemaVersion=1;
  const storage={getItem(){return JSON.stringify(s);}};const loaded=Campaign.load(storage);
  assert.equal(loaded.schemaVersion,2);assert.deepEqual(loaded.lowQuarter,s.lowQuarter);
});
console.log('Low Quarter final integration total: '+tests+' cases');
