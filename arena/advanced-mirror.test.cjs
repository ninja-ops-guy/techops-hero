'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const c=require('./advanced-simulation.js');
test('20,000 seeded steps mirror seats, facing, movement and combat outcomes',()=>{
 const config=characters=>({schemaVersion:2,rulesetId:c.RULESET_ID,matchId:'mirror',characters});
 const reflect=b=>(b&~3)|((b&1)<<1)|((b&2)>>1);let r=74375,steps=0,contacts=0;
 for(let game=0;game<10;game++){
  const a=c.createMatch(config(['mike','k'])),b=c.createMatch(config(['k','mike']));
  for(let i=0;i<2000;i++){
   const roll=()=>{r=(r*1664525+1013904223)>>>0;return r&511;},x=roll(),y=roll();
   const frame=(m,buttons)=>({tick:m.state.tick+1,round:m.state.round,buttons});
   contacts+=c.stepMatch(a,[frame(a,x),frame(a,y)]).filter(e=>e.type==='contact').length;
   c.stepMatch(b,[frame(b,reflect(y)),frame(b,reflect(x))]);steps++;
   for(let j=0;j<2;j++){const p=a.state.players[j],q=b.state.players[1-j];
    for(const key of ['hp','focus','y','jumps','airHits','airLocked','comboStage','comboHits'])assert.equal(p[key],q[key]);
    assert.ok(Math.abs(p.x+q.x-960)<1e-8);assert.equal(p.face,-q.face);
   }
   if(a.state.phase==='round-over'){c.nextRound(a);c.nextRound(b);}if(a.state.phase==='finished')break;
  }
 }
 assert.equal(steps,20000);assert.ok(contacts>0,'tape must exercise contacts as well as motion');
});
