'use strict';
const assert=require('node:assert/strict');
const Campaign=require('./campaign_act1.js'),Mission=require('./campaign_low_quarter_mission.js'),Rescue=require('./campaign_low_quarter.js'),Siege=require('./campaign_chorus_siege.js');
const clone=v=>JSON.parse(JSON.stringify(v));
// Only the completed original campaign is a fixture. Mission events are produced
// exclusively by walking, holding an interaction, choosing, and simulating play.
function driver(ending='shutdown'){
 let s=Campaign.createInitialState();s.story={ending,facts:{campaign_complete:true}};s.lateGame={chapters:{ending}};s=Mission.create(s);
 function step(input={},n=1){for(let i=0;i<n;i++)s=Mission.step(s,input,.25);return s;}
 function walk(x){let n=0;while(Math.abs(s.lowQuarterMission.player.x-x)>1){step({move:Math.max(-1,Math.min(1,(x-s.lowQuarterMission.player.x)/27.5)),attack:true,block:true});if(++n>1500)throw Error('walk unreachable '+x);}}
 function use(id){const o=Mission.objects(s).find(v=>v.id===id);assert(o,'Object available: '+id);walk(o.x);let n=0;
   do{step({interact:true,attack:true,block:true});if(++n>300)throw Error('interaction did not finish '+id+' '+s.lowQuarterMission.message);}while(Mission.objects(s).some(v=>v.id===id)&&!s.lowQuarterMission.dialog);
 }
 function choose(value){step({choice:value});}
 function go(to){const from=s.lowQuarterMission.player.sector;if(to===from)return;
   if(!Mission.objects(s).some(v=>v.id==='exit_'+to)){go('services');}
   use('exit_'+to);while(s.lowQuarterMission.travel)step();
 }
 function prepare(choice='shelter'){
   for(let i=0;i<4;i++)use('access_'+i);use('threat');
   for(const area of Mission.content.places){go(area.id);walk(1100);for(const prefix of ['survey','warn','repair','staff','route'])use(prefix+'_'+area.id);
     for(const p of Mission.content.definition.rescue.people.filter(p=>p.sector===area.id)){use(p.id);choose(choice);}
   }
   go('approaches');
   while(Mission.objects(s).some(o=>o.id.startsWith('command_'))){if(ending==='control'&&s.lowQuarterMission.branch.step===4){use('stop');while(s.lowQuarterMission.branch.crossing<1)step();}const o=Mission.objects(s).find(o=>o.id.startsWith('command_'));use(o.id);}
   use('deploy');while(!Mission.objects(s).some(o=>o.id==='launch'))step();use('launch');
 }
 function waitUntil(fn,max=10000){for(let n=0;!fn(s);n++){assert(n<max,'wait condition reached: '+s.lowQuarterMission.message);step({attack:true,block:true});}}
 function finish(savePicket=true){
   if(savePicket&&s.lowQuarterMission.picket==='exposed'){walk(350);waitUntil(s=>s.lowQuarterMission.waves.arrival_1?.arrived!==null&&s.lowQuarterMission.waves.arrival_1?.arrived!==undefined);use('picket');}
   else if(!savePicket){walk(2600);waitUntil(s=>s.lowQuarterMission.picket==='assimilated');use('reserve');waitUntil(s=>Object.keys(s.lowQuarterMission.orders).length>0);use('counter');}
   for(const area of Mission.content.places){go(area.id);waitUntil(s=>s.lowQuarterMission.waves['arrival_'+(Mission.content.places.indexOf(area)+1)]?.arrived!=null);
     // Fight through the ramp using actual proximity strikes. Allied fire and
     // containment continue while the player travels between sectors.
     walk(100);step({attack:true,block:true},100);use('ramp_'+area.id);
     waitUntil(s=>s.lowQuarterMission.waves['arrival_'+(Mission.content.places.indexOf(area)+1)].resolved);
     if(!s.lowQuarterMission.services[area.id])use('repair_'+area.id);walk(1100);use('sweep_'+area.id);
   }
   go('approaches');waitUntil(s=>s.lowQuarterMission.clock>=1082);
   // Live off-screen attacks can invalidate a service after the first visit.
   for(const area of Mission.content.places){if(!s.lowQuarterMission.services[area.id]){go(area.id);use('repair_'+area.id);}}
   go('approaches');waitUntil(s=>Siege.status(s).phase==='complete');use('account');use('closeout');choose('confirm');return s;
 }
 return {get state(){return s;},set state(v){s=v;},step,walk,use,choose,go,prepare,finish,waitUntil};
}
if(require.main===module){
let count=0;function test(name,fn){fn();count++;console.log('PASS '+name);}
for(const ending of ['shutdown','control','open_network'])test('normal world inputs earn a full response-area save: '+ending,()=>{
 const d=driver(ending);d.prepare();assert.equal(d.state.lowQuarterMission.clock,20,'preparation does not consume the assault window');
 const before=clone(d.state);d.step({paused:true},12);assert.deepEqual(d.state,before);
 const s=d.finish();assert.equal(s.lowQuarter.result.outcome,'district_saved');assert.equal(s.lowQuarter.result.safe.length,48);assert.equal(s.story.ending,ending);assert.equal(s.lowQuarter.result.malarUnlocked,false);assert.equal(s.lowQuarterMission.picket,'safe');assert.equal(Rescue.validate(s).valid,true);
 assert.equal(Object.keys(Siege.status(s).acquiredFacts).length,0);assert.equal(Siege.status(s).resolvedWaves.length,4);
 if(ending==='shutdown'){assert(!Object.keys(Rescue.inspect(s).units).some(id=>id.startsWith('robot')));assert.equal(s.lowQuarterMission.branch.tests.independent_command_tested.coordinatorConnected,false);}
 if(ending==='control'){assert(s.lowQuarterMission.branch.stopped);assert.equal(s.lowQuarterMission.branch.crossing,1);assert(Rescue.inspect(s).units.mil_s_supply);assert(!Rescue.inspect(s).units.robot_s_supply);}
 if(ending==='open_network')assert.equal(s.lowQuarterMission.branch.tests.local_fallback_tested.coordinatorConnected,false);
});
test('avoidable physical assimilation changes tactics and needs a fresh countermeasure',()=>{const d=driver();d.prepare();const s=d.finish(false);assert.equal(s.lowQuarter.result.outcome,'district_saved');assert.equal(s.lowQuarterMission.picket,'assimilated');const sg=Siege.status(s);assert.equal(Object.keys(sg.orders).length,1);assert.equal(sg.orders.old_route_attack.command,'sudo');assert(sg.responses.old_route_attack);assert.equal(Rescue.inspect(s).units.signal_picket.ready,false);assert(Rescue.inspect(s).units.reserve_1.ready);});
test('48 residents use eight real origin-bound trips with separate receivers and crew returns',()=>{
 const d=driver();d.prepare('transport');d.walk(350);d.waitUntil(s=>s.lowQuarterMission.waves.arrival_1?.arrived!=null);d.use('picket');
 for(const area of Mission.content.places){d.go(area.id);d.walk(620);
   while(d.state.lowQuarterMission.player.x<1500)d.step({move:.5,attack:true,block:true});
   d.waitUntil(s=>Object.values(s.lowQuarterMission.residents).filter(r=>r.sector===area.id).every(r=>r.status==='gate'));
   for(let trip=0;trip<2;trip++){
     d.waitUntil(s=>s.lowQuarterMission.carriers.some(c=>c.sector===area.id&&c.phase==='idle'));
     const carrier=d.state.lowQuarterMission.carriers.find(c=>c.sector===area.id&&c.phase==='idle');d.use(carrier.id);
   }
 }
 d.waitUntil(s=>Object.values(s.lowQuarterMission.residents).every(r=>r.status==='received'));
 const s=d.finish();assert.equal(s.lowQuarter.result.outcome,'district_saved');
 const events=s.lowQuarter.events;assert.equal(events.filter(e=>e.type==='depart').length,8);assert.equal(events.filter(e=>e.type==='arrive').length,8);
 assert(events.filter(e=>e.type==='return_vehicle').length>=6);assert.equal(s.lowQuarter.result.safe.length,48);
});
test('proximity, bounded time and access sequence reject shortcut input',()=>{const d=driver();d.step({interact:true},20);assert.equal(d.state.lowQuarterMission.access,0);assert(!d.state.lowQuarter);assert.throws(()=>Mission.step(d.state,{},100),/bounded/);});
test('legacy, missing and future mission checkpoints preserve state',()=>{const legacy=Campaign.createInitialState();assert.deepEqual(Mission.validate(legacy),{valid:true});const d=driver(),s=clone(d.state);s.lowQuarterMission.schema=99;const before=clone(s);assert(Mission.validate(s).continuationBlocked);assert.throws(()=>Mission.step(s,{},.1),/unavailable/);assert.deepEqual(s,before);});
test('reload keeps an unfinished world, does not grant evidence, and failed save is atomic',()=>{
 const d=driver();d.prepare();d.walk(2270);d.waitUntil(s=>s.lowQuarterMission.clock>=105);assert(!Mission.objects(d.state).some(o=>o.id==='relay'),'A component is not accessible during flight');d.walk(350);d.waitUntil(s=>s.lowQuarterMission.waves.arrival_1?.arrived!=null);assert(Mission.objects(d.state).some(o=>o.id==='relay'));d.step({attack:true},8);
 const before=clone(d.state),storage={data:null,setItem(k,v){this.data=v;},getItem(){return this.data;}};Campaign.save(before,storage);const loaded=Campaign.load(storage);assert.deepEqual(loaded.lowQuarterMission,before.lowQuarterMission);assert.deepEqual(loaded.lowQuarter.siege,before.lowQuarter.siege);
 assert.notEqual(Siege.status(loaded).phase,'complete');assert.throws(()=>Rescue.transact(loaded,s=>Mission.step(s,{move:1},.25),()=>false),/saved/);assert.deepEqual(loaded.lowQuarterMission,before.lowQuarterMission);
});
test('continuing refusal is respected and cannot count as a full save',()=>{const d=driver();for(let i=0;i<4;i++)d.use('access_'+i);d.use('lq_a_01');d.choose('declined');assert.equal(Rescue.inspect(d.state).people.lq_a_01.consent,'declined');assert(Rescue.evaluate(d.state).unresolved.includes('lq_a_01'));});
console.log('Playable Low Quarter: '+count+' groups PASS');
}
module.exports={driver};
