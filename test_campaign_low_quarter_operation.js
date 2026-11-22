'use strict';
const assert=require('node:assert/strict'),O=require('./campaign_low_quarter_operation.js'),C=require('./campaign_act1.js'),R=require('./campaign_low_quarter.js'),S=require('./campaign_chorus_siege.js');
let tests=0;
function test(name,fn){fn();console.log('PASS '+name);tests++;}
function setup(ending='shutdown'){const s=C.createInitialState();s.story={ending,facts:{campaign_complete:true}};return O.begin(s,ending,'test_'+ending);}
function tick(s,t,input={}){for(let n=0;n<t-1e-8;n+=.1)O.step(s,Math.min(.1,t-n),input);}
function walk(s,x){const o=s.lowQuarterOperation;for(let n=0;Math.abs(o.x-x)>4&&n<2000;n++)O.step(s,.02,{[o.x<x?'right':'left']:true});assert(Math.abs(o.x-x)<=4,'Cannot reach '+x);}
function work(s,id){const p=O.PROPS.find(p=>p.id===id);assert(p,'Unknown work '+id);assert.equal(s.lowQuarterOperation.room,p.room,id+' location');walk(s,p.x);assert(O.interact(s,id),id+': '+s.lowQuarterOperation.message);tick(s,p.seconds+.2);assert(s.lowQuarterOperation.done[id],id+' incomplete');}
function go(s,room){assert(O.travel(s,room),'Route '+s.lowQuarterOperation.room+' to '+room);const t=s.lowQuarterOperation.travel.duration;tick(s,t+.2);assert.equal(s.lowQuarterOperation.room,room);}
function prepare(s,robotApproach=false){
 work(s,'lookout');work(s,'watch');work(s,'survey_approaches');go(s,'services');work(s,'survey_services');work(s,'power');work(s,'radio');
 go(s,'shelters');work(s,'survey_shelters');work(s,'vent');work(s,'care');if(s.story.ending==='open_network')work(s,'cooperate');work(s,'test_shelters');
 for(const p of s.lowQuarterOperation.residents.filter(p=>p.room==='shelters')){walk(s,p.x);assert(O.interact(s,p.id));}
 go(s,'departure');work(s,'survey_departure');work(s,'road');work(s,'alternative');work(s,'test_departure');
 go(s,'services');go(s,'approaches');work(s,'test_approaches');go(s,'services');work(s,'rota');work(s,'test_services');
 if(s.story.ending==='shutdown'){work(s,'records');work(s,'coalition');work(s,'dispatch');tick(s,22);}
 if(s.story.ending==='control'){work(s,'dispatch');work(s,'stop');work(s,'audit');go(s,'departure');work(s,'veto');work(s,'challenge');go(s,'services');}
 if(s.story.ending==='open_network'){work(s,'dispatch');tick(s,22);work(s,'isolate');tick(s,18);work(s,'restore');}
 assert(R.AUTHORITY[s.story.ending].every(k=>R.inspect(s).checks[k]),JSON.stringify(R.inspect(s).checks));
 // Gather four actual teams; all follow on each physical route.
 for(const room of O.ROOMS){if(robotApproach&&room==='departure')continue;const u=s.lowQuarterOperation.units.find(u=>u.id==='team_'+room);walk(s,u.x);assert(O.interact(s,u.id));}
 if(robotApproach){const u=s.lowQuarterOperation.units.find(u=>u.id==='robot');walk(s,u.x);assert(O.interact(s,'robot'));}
 for(const room of ['shelters','departure','services','approaches']){
   if(s.lowQuarterOperation.room!==room)go(s,room);
   walk(s,820);tick(s,1);assert(O.interact(s,'post'),'Assign '+room);
 }
 work(s,'ready');
}
function combat(s){const o=s.lowQuarterOperation;let tries=0;while(o.kills<18&&!o.halted&&tries++<4000){const target=o.enemies.find(e=>e.alive);if(target){const dir=target.x>o.x?'right':'left';O.step(s,.1,Math.abs(target.x-o.x)>45?{[dir]:true}:{});O.attack(s);}else tick(s,.1);}assert.equal(o.kills,18,o.message+' hp:'+o.hp);assert(o.hp>0);work(s,'gate');}
function civilians(s){
 go(s,'services');go(s,'departure');
 for(const id of Array.from({length:8},(_,i)=>'resident_'+(i+1))){const p=s.lowQuarterOperation.residents.find(p=>p.id===id);walk(s,p.x);assert(O.interact(s,p.id));}
 walk(s,1120);tick(s,9);work(s,'van');go(s,'receiving');work(s,'receiver');
}
test('physical distance and prerequisite refusal emit no authority receipts',()=>{const s=setup();assert.equal(O.interact(s,'watch'),false);walk(s,320);assert.equal(O.interact(s,'watch'),false);assert.equal(s.lowQuarter.events.length,0);});
test('work requires elapsed simulation time and pause makes no progress',()=>{const s=setup();walk(s,160);O.interact(s,'lookout');tick(s,1);assert(!s.lowQuarterOperation.done.lookout);const copy=JSON.stringify(s);assert.equal(JSON.stringify(s),copy);tick(s,2.2);assert(s.lowQuarterOperation.done.lookout);assert.equal(s.lowQuarter.events.length,0);});
test('declined resident is unresolved and has no transport reservation',()=>{const s=setup();go(s,'services');go(s,'departure');walk(s,240);assert(O.interact(s,'resident_1','declined'));assert.equal(R.inspect(s).people.resident_1.consent,'declined');assert.equal(R.inspect(s).people.resident_1.status,'unknown');assert.equal(O.interact(s,'van'),false);});
for(const ending of ['shutdown','control','open_network'])test(ending+' physical opening and receiving checkpoint; no district success',()=>{
 const s=setup(ending);prepare(s);tick(s,901-s.lowQuarterOperation.tick);combat(s);civilians(s);tick(s,.2);
 assert(s.lowQuarterOperation.checkpoint,O.objective(s));const result=R.evaluate(s);assert.equal(result.safe.length,12);assert.notEqual(result.outcome,'district_saved');assert.equal(s.lowQuarter.phase,'active');assert.equal(s.lowQuarter.result,null);assert.equal(S.status(s).resolvedWaves.length,0);assert.equal(S.status(s).acquiredFacts.road_v1,undefined);assert(!result.deepSpaceEligible);assert.equal(result.ionaCampaign,'ongoing');assert.equal(result.malarUnlocked,false);assert(O.validate(s).valid);
 const storage={data:{},setItem(k,v){this.data[k]=v;},getItem(k){return this.data[k]||null;}};C.save(s,storage);const restored=C.load(storage);assert.deepEqual(restored.lowQuarter,s.lowQuarter);assert.deepEqual(restored.lowQuarterOperation,s.lowQuarterOperation);
});
test('lost exposed defender, source-bound delayed adaptation, actual closure and replacement',()=>{
 const s=setup();prepare(s);tick(s,901-s.lowQuarterOperation.tick);go(s,'services');tick(s,90);const o=s.lowQuarterOperation;
 assert(o.done.assimilated);assert(o.done.enemy_order);const sg=S.status(s);assert.equal(sg.orders.road_attack.fact,'road_v1');assert.equal(sg.acquiredFacts.road_v1.version,'v1');const lost=s.lowQuarter.siege.events.find(e=>e.type==='assimilate');assert.equal(lost.unit,o.exposedUnit);assert.equal(o.units.find(u=>u.id===lost.unit).room,'approaches');assert.equal(R.inspect(s).units[lost.unit].ready,false);assert.equal(s.lowQuarter.events.find(e=>e.id===lost.receipt).unit,lost.unit);
 go(s,'departure');work(s,'cut_route');assert(S.status(s).responses.road_attack);assert.equal(S.status(s).relayConnected,true);
 // Route interruption does not erase already acquired knowledge.
 assert(S.status(s).sudoFacts.road_v1);
});
test('physical robot loss cannot produce human assimilation or tactical memories',()=>{const s=setup('control');prepare(s,true);tick(s,901-s.lowQuarterOperation.tick);assert.equal(s.lowQuarterOperation.exposedUnit,'robot');go(s,'services');tick(s,100);assert.equal(R.inspect(s).units.robot.ready,false);assert.equal(s.lowQuarter.siege.events.filter(e=>e.type==='assimilate').length,0);assert.deepEqual(S.status(s).acquiredFacts,{});});
test('failed save leaves original operation and ledgers byte-identical',()=>{const s=setup(),before=JSON.stringify(s);assert.throws(()=>O.transact(s,c=>O.step(c,.5),()=>false),/not saved/);assert.equal(JSON.stringify(s),before);});
test('unknown operation revision preserves data and blocks only review',()=>{const s=setup();s.lowQuarterOperation.revision='future';const before=JSON.stringify(s),v=O.validate(s);assert(v.valid&&v.blocked);assert.equal(JSON.stringify(s),before);});
test('ordinary legacy campaign has no review operation',()=>{const s=C.createInitialState();assert(O.validate(s).valid);assert.equal(s.lowQuarterOperation,undefined);});
test('unready landing deadline does not invent readiness, deaths or victory',()=>{const s=setup();tick(s,901);assert(s.lowQuarterOperation.halted);assert.equal(s.lowQuarter.events.length,0);assert.equal(s.lowQuarter.result,null);assert.equal(S.status(s).arrivedWaves.length,0);assert.equal(R.evaluate(s).safe.length,0);assert.equal(R.evaluate(s).unresolved.length,12);});
console.log(tests+' operation tests passed');
module.exports={setup,work,walk,go,tick,prepare,combat,civilians};
