'use strict';
const assert=require('assert/strict'),vm=require('vm'),fs=require('fs');
const Rescue=require('./campaign_low_quarter.js'),Siege=require('./campaign_chorus_siege.js'),Campaign=require('./campaign_act1.js');
const copy=x=>JSON.parse(JSON.stringify(x));let count=0;
function test(name,fn){fn();count++;console.log('PASS '+name);}
const sectors=Siege.AREAS.map(id=>({id,requiredStrength:2,posts:['front','reserve']}));
const checks=[...new Set([...Rescue.COMMON,...Object.values(Rescue.AUTHORITY).flat()])];
// TEST ONLY: these people, counts, locations, forces and times are not live canon.
const d={approved:true,rescue:{id:'siege_fixture',revision:'test_1',encounter:Siege.AUTHORITY,approved:true,sectors,
 actors:sectors.flatMap(s=>[{id:s.id+'_observer',role:'witness',location:s.id},{id:s.id+'_officer',role:'officer',location:s.id}]),
 people:sectors.map(s=>({id:s.id+'_resident',sector:s.id})),
 units:sectors.flatMap(s=>['front','reserve','replacement'].map(p=>({id:s.id+'_'+p,kind:'military',strength:1,commandModes:['independent','central','distributed']}))),
 vehicles:[],routes:[{id:'maintenance',sector:'approaches',gate:'approaches',destination:'departure',duration:5}],links:[],
 checks:checks.map(id=>({id,location:'approaches',roles:['witness'],sources:['survey','local_record']}))},
 areas:Object.fromEntries(Siege.AREAS.map(k=>[k,k])),relay:{location:'approaches',uploadDelay:2,orderDelay:1},hopperRecovery:10,
 waves:[{id:'first',tick:100,warningTick:1,infected:100000,sector:'approaches'},{id:'second',tick:120,warningTick:1,infected:100000,sector:'approaches'}],
 facts:[{id:'route_memory',kind:'route',target:'maintenance',sector:'approaches',version:'old_route',knownBy:['approaches_front']},
 {id:'secret_post',kind:'post',target:'reserve',sector:'shelters',version:'v1',knownBy:['shelters_front']}],
 observations:['arrival','resolution','assimilation','relay','response','order'].map(kind=>({id:kind,kind,location:'approaches',roles:['witness'],sources:['witness_report','sensor_record']}))};
Siege.registerScenario(d);
function base(ending='shutdown'){
 const s=Campaign.createInitialState();s.story={schemaVersion:2,ending,completedActs:[],facts:{campaign_complete:true}};s.lateGame={chapters:{ending}};
 return Siege.begin(s,d.rescue.id,d.rescue.revision,'run_a');
}
function tick(s){return Math.max(s.lowQuarter.events.at(-1)?.tick||0,s.lowQuarter.siege.events.at(-1)?.tick||0)+1;}
function rescue(s,type,fields={}){return Rescue.applyEvent(s,{id:'r'+s.lowQuarter.events.length,runId:'run_a',operation:d.rescue.id,tick:tick(s),type,...fields});}
function siege(s,type,fields={}){return Siege.applyEvent(s,{id:'s'+s.lowQuarter.siege.events.length,runId:'run_a',operation:d.rescue.id,rescueCount:s.lowQuarter.events.length,tick:tick(s),type,...fields});}
const observe={actor:'approaches_observer',sources:['witness_report','sensor_record']};
function observed(s,type,fields={}){const kind=({resolve_wave:'resolution',assimilate:'assimilation',relay_cut:'relay',respond:'response'})[type]||type;return siege(s,type,{...observe,observation:kind,...fields});}
function prepared(ending='shutdown'){
 let s=base(ending);
 for(const key of checks.filter(k=>!['roster_reconciled','final_sweep_witnessed'].includes(k)&&(Rescue.COMMON.includes(k)||Rescue.AUTHORITY[ending].includes(k))))s=rescue(s,'check',{actor:'approaches_observer',check:key,sources:['survey','local_record']});
 for(const a of sectors){
  s=rescue(s,'survey',{actor:a.id+'_observer',sector:a.id});s=rescue(s,'warn',{actor:a.id+'_observer',sector:a.id});
  s=rescue(s,'consent',{actor:a.id+'_observer',person:a.id+'_resident',choice:'shelter'});
  s=rescue(s,'shelter',{actor:a.id+'_observer',person:a.id+'_resident',careVerified:true,safetyVerified:true});
  s=rescue(s,'sector',{actor:a.id+'_officer',sector:a.id,habitable:true,contained:true});
  for(const p of a.posts)s=rescue(s,'unit',{actor:a.id+'_officer',unit:a.id+'_'+p,post:p,sector:a.id,ready:true});
 }
 // Survey invalidates earlier roster/final sweep receipts.
 for(const key of ['roster_reconciled','final_sweep_witnessed'])s=rescue(s,'check',{actor:'approaches_observer',check:key,sources:['survey','local_record']});
 s=siege(s,'advance',{phase:'deployment'});s=siege(s,'wave_warning',{wave:'first',receipt:'r0'});s=siege(s,'wave_warning',{wave:'second',receipt:'r0'});
 return siege(s,'advance',{phase:'first_assault'});
}
function arrived(ending){let s=prepared(ending);s=observed(s,'arrival',{wave:'first',tick:100});return siege(s,'advance',{phase:'adaptation'});}
function assimilated(){let s=arrived();s=rescue(s,'unit',{actor:'approaches_officer',unit:'approaches_front',sector:'approaches',post:'front',ready:false});return observed(s,'assimilate',{unit:'approaches_front',receipt:s.lowQuarter.events.at(-1).id});}
function ordered(){let s=assimilated();s=siege(s,'upload',{fact:'route_memory',tick:tick(s)+2});return observed(s,'order',{fact:'route_memory',command:'sudo',order:'bypass'});}
function complete(s){
 s=observed(s,'resolve_wave',{wave:'first'});s=observed(s,'arrival',{wave:'second',tick:Math.max(120,tick(s))});s=siege(s,'advance',{phase:'hold'});
 s=observed(s,'resolve_wave',{wave:'second'});return siege(s,'advance',{phase:'complete'});
}
for(const ending of Object.keys(Rescue.AUTHORITY))test('full district save without compulsory assimilation: '+ending,()=>{
 let s=complete(arrived(ending));assert.equal(Siege.status(s).phase,'complete');assert.equal(Rescue.evaluate(s).outcome,'district_saved');
 const r=Rescue.closeout(s,{rescue:s.lowQuarter.events.length,siege:s.lowQuarter.siege.events.length},true);assert.equal(Rescue.validate(r).valid,true);assert.throws(()=>siege(r,'upload',{fact:'route_memory'}),/closed/);
});
test('all rescue flags cannot skip the siege',()=>{assert.equal(Rescue.evaluate(prepared()).outcome,'evacuation_only');assert(Rescue.evaluate(prepared()).missing.includes('siege_hold_unverified'));});
test('cannot skip warning or readiness phases',()=>{
 assert.throws(()=>siege(base(),'advance',{phase:'first_assault'}),/transition/);
 assert.throws(()=>siege(base(),'advance',{phase:'deployment'}),/warning/);
});
test('missing post blocks preparation even with spare strength elsewhere',()=>{
 let s=prepared();s.lowQuarter.siege.events.pop();s=rescue(s,'unit',{actor:'shelters_officer',unit:'shelters_reserve',sector:'shelters',post:'front',ready:true});
 assert.throws(()=>siege(s,'advance',{phase:'first_assault'}),/posts/);
});
test('arrival requires advance warning and recovery, no arbitrary future waves',()=>{
 const s=prepared();assert.throws(()=>observed(s,'arrival',{wave:'first',tick:99}),/arrival/);
 assert.throws(()=>observed(s,'arrival',{wave:'third',tick:100}),/arrival/);
 const late=observed(s,'arrival',{wave:'first',tick:119});assert.throws(()=>observed(late,'arrival',{wave:'second',tick:120}),/recovery/);
});
test('assimilation requires physical presence and a witnessed unavailable human unit',()=>{
 assert.throws(()=>observed(arrived(),'assimilate',{unit:'approaches_front',receipt:'r0'}),/rescue observation/);
 const s=assimilated(),r=Rescue.inspect(s);assert.equal(r.units.approaches_front.ready,false);assert.deepEqual(Object.keys(Siege.status(s).acquiredFacts),['route_memory']);
 assert(!Siege.status(s).sudoFacts.route_memory);
});
test('Sudo cannot use private, future or unacquired knowledge',()=>{
 const s=assimilated();assert.throws(()=>observed(s,'order',{fact:'secret_post',command:'sudo',order:'secret'}),/unknown/);
 assert.throws(()=>observed(s,'order',{fact:'route_memory',command:'sudo',order:'early'}),/unknown/);
 assert.throws(()=>siege(s,'upload',{fact:'route_memory'}),/acquisition/);
});
test('relay cut stops new Sudo access, preserves acquired orders and local autonomy',()=>{
 let s=ordered();const old=Siege.status(s).orders;s=observed(s,'relay_cut');assert.deepEqual(Siege.status(s).orders,old);
 assert.throws(()=>observed(s,'order',{fact:'route_memory',command:'sudo',order:'new'}),/live/);
 s=observed(s,'order',{fact:'route_memory',command:'local',order:'local_bypass'});assert.equal(Siege.status(s).orders.local_bypass.version,'old_route');
 assert.equal(Rescue.evaluate(s).chorus,'active');assert.equal(Rescue.evaluate(s).ionaCampaign,'ongoing');
});
test('orders require responses and defense must be restored',()=>{
 let s=ordered();s=observed(s,'arrival',{wave:'second',tick:120});assert.throws(()=>siege(s,'advance',{phase:'hold'}),/address/);
 assert.throws(()=>observed(s,'respond',{order:'bypass',receipt:'r0'}),/rescue observation/);
 s=rescue(s,'route',{actor:'approaches_officer',route:'maintenance',open:false});s=observed(s,'respond',{order:'bypass',receipt:s.lowQuarter.events.at(-1).id});
 s=siege(s,'advance',{phase:'hold'});s=observed(s,'resolve_wave',{wave:'first'});s=observed(s,'resolve_wave',{wave:'second'});
 assert.throws(()=>siege(s,'advance',{phase:'complete'}),/Hold every post/);
 s=rescue(s,'unit',{actor:'approaches_officer',unit:'approaches_replacement',sector:'approaches',post:'front',ready:true});
 s=siege(s,'advance',{phase:'complete'});assert.equal(Rescue.evaluate(s).outcome,'district_saved');
});
test('independent observation cannot be replaced by commander or missing source',()=>{
 assert.throws(()=>observed(prepared(),'arrival',{wave:'first',tick:100,actor:'orpheus'}),/observer/);
 assert.throws(()=>observed(prepared(),'arrival',{wave:'first',tick:100,sources:['sensor_record']}),/sources/);
});
test('event scope, idempotency, conflicts and rejected mutations',()=>{
 const s=arrived(),before=copy(s),e={id:'new',runId:'run_a',operation:d.rescue.id,tick:103,rescueCount:s.lowQuarter.events.length,type:'relay_cut',...observe,observation:'relay'};
 assert.throws(()=>Siege.applyEvent(s,{...e,runId:'other'}),/scope/);assert.deepEqual(s,before);
 const n=Siege.applyEvent(s,e);assert.deepEqual(Siege.applyEvent(n,e),n);assert.throws(()=>Siege.applyEvent(n,{...e,tick:104}),/Conflicting/);
});
test('future rescue receipts and time reversal reject',()=>{
 const s=arrived();assert.throws(()=>siege(s,'relay_cut',{...observe,observation:'relay',rescueCount:999}),/boundary/);
 const n=copy(s);n.lowQuarter.events.push({...n.lowQuarter.events[0],id:'backdated',tick:1});assert.equal(Rescue.validate(n).valid,false);
});
test('persistence failures are atomic and reload replays both ledgers',()=>{
 const s=complete(arrived()),before=copy(s),data=new Map(),storage={getItem:k=>data.get(k),setItem:(k,v)=>data.set(k,v)};
 assert.throws(()=>Rescue.transact(s,x=>Rescue.closeout(x,{rescue:x.lowQuarter.events.length,siege:x.lowQuarter.siege.events.length},true),()=>false),/saved/);assert.deepEqual(s,before);
 const saved=Rescue.transact(s,x=>Rescue.closeout(x,{rescue:x.lowQuarter.events.length,siege:x.lowQuarter.siege.events.length},true),x=>Campaign.save(x,storage));
 assert.deepEqual(Campaign.load(storage).lowQuarter,saved.lowQuarter);assert.equal(Siege.status(Campaign.load(storage)).phase,'complete');
});
test('corrupt siege history cannot be saved',()=>{
 const s=complete(arrived());s.lowQuarter.siege.events[0].phase='complete';assert.equal(Rescue.validate(s).valid,false);assert.throws(()=>Campaign.save(s,{setItem(){throw Error('must not write');}}),/transition/);
});
test('missing encounter module preserves the save and blocks only continuation',()=>{
 const root={};vm.createContext(root);vm.runInContext(fs.readFileSync('campaign_low_quarter.js','utf8'),root);
 root.TechOpsLowQuarter.registerScenario(copy(d.rescue));const s=complete(arrived()),before=copy(s),v=root.TechOpsLowQuarter.validate(s);
 assert.equal(v.valid,true);assert.equal(v.continuationBlocked,true);assert.deepEqual(s,before);
});
test('scenario redefinition, incomplete scope and omniscient facts reject',()=>{
 const changed=copy(d);changed.hopperRecovery=11;assert.throws(()=>Siege.registerScenario(changed),/replaced/);
 const bad=copy(d);bad.rescue.id='bad';bad.areas.services='approaches';assert.throws(()=>Siege.registerScenario(bad),/Distinct/);
 const secret=copy(d);secret.rescue.id='secret';secret.facts[0].kind='all_memories';assert.throws(()=>Siege.registerScenario(secret),/Bounded/);
});
test('an obsolete route closure cannot answer a new attack',()=>{let s=arrived();s=rescue(s,'route',{actor:'approaches_officer',route:'maintenance',open:false});const old=s.lowQuarter.events.at(-1).id;s=rescue(s,'unit',{actor:'approaches_officer',unit:'approaches_front',sector:'approaches',post:'front',ready:false});s=observed(s,'assimilate',{unit:'approaches_front',receipt:s.lowQuarter.events.at(-1).id});s=observed(s,'order',{fact:'route_memory',command:'local',order:'stale'});assert.throws(()=>observed(s,'respond',{order:'stale',receipt:old}),/rescue observation/);});
test('closeout binds both event histories',()=>{const s=complete(arrived());assert.throws(()=>Rescue.closeout(s,s.lowQuarter.events.length,true),/Stale siege/);assert.throws(()=>Rescue.closeout(s,{rescue:s.lowQuarter.events.length,siege:0},true),/Stale siege/);});
test('future siege schema is preserved without success inference',()=>{const s=arrived();s.lowQuarter.siege.schema=99;const b=copy(s),v=Rescue.validate(s);assert.equal(v.valid,true);assert.equal(v.continuationBlocked,true);assert.deepEqual(s,b);});
test('assimilated defenders cannot silently be reactivated',()=>{const s=rescue(assimilated(),'unit',{actor:'approaches_officer',unit:'approaches_front',sector:'approaches',post:'front',ready:true});assert.equal(Rescue.validate(s).valid,false);});
module.exports={definition:d,prepared,arrived,complete,ordered};
console.log('Chorus siege: '+count+' tests PASS');
