'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const core=require('./advanced-simulation.js'),input=require('./advanced-input.js'),moves=require('./advanced-moves.js');
const bits=k=>Object.entries(k).reduce((n,[key,v])=>n|(v?input.BUTTONS[key]:0),0);
function fresh(characters=['mike','k']){const m=core.createMatch({schemaVersion:2,rulesetId:core.RULESET_ID,matchId:'test',characters});for(let i=0;i<180;i++)step(m);return m;}
function step(m,a={},b={}){return core.stepMatch(m,[a,b].map(k=>({tick:m.state.tick+1,round:m.state.round,buttons:typeof k==='number'?k:bits(k)})));}
function n(m,t,a={},b={}){let out=[];for(let i=0;i<t;i++)out.push(...step(m,a,b));return out;}
function near(m){m.state.players[0].x=400;m.state.players[1].x=450;return m;}
test('all ground and air directions select and contact only on their defined tick',()=>{
  for(const [keys,air,id] of [[{light:true},false,'jab'],[{light:true,up:true},false,'uppercut'],[{light:true,down:true},false,'low'],[{heavy:true},false,'kick'],[{heavy:true,up:true},false,'rising-kick'],[{heavy:true,down:true},false,'sweep'],[{light:true},true,'air'],[{light:true,down:true},true,'air-down'],[{heavy:true},true,'air-kick'],[{heavy:true,down:true},true,'air-slam']]){
    const m=near(fresh());if(air)m.state.players.forEach(p=>{p.y=300;p.jumps=1;});
    const contact=moves.MOVES[id].contactTick;const early=n(m,contact-1,keys);assert.equal(m.state.players[0].attack.moveId,id);assert.equal(early.filter(e=>e.type==='contact').length,0);
    const events=step(m,keys);assert.equal(events.filter(e=>e.type==='contact').length,1,id);assert.equal(m.state.players[1].hp,100-moves.MOVES[id].damage,id);
  }
});
test('recovery has an exact end, held attacks do not repeat, buffer captures facing and press tick',()=>{
  const m=fresh();step(m,{light:true});n(m,9); // tick190, recovery until195
  step(m,{heavy:true,left:true}); // tick191: last four ticks
  assert.equal(m.state.players[0].buffer.face,-1,'buffer captures requested facing');assert.equal(m.state.players[0].attack.face,1,'active attack stays locked');
  n(m,3);assert.equal(m.state.players[0].attack.moveId,'jab');
  step(m);assert.equal(m.state.players[0].attack.moveId,'kick');assert.equal(m.state.players[0].lastPress,191);assert.equal(m.state.players[0].attack.face,-1);
  n(m,60,{heavy:true});assert.equal(m.state.players[0].attack,null);
});
test('beat chains require a confirmed hit, use press timing, and expire at 54 ticks',()=>{
  const m=near(fresh());n(m,5,{light:true});n(m,11); // next input gap16
  m.state.players[1].x=450;step(m,{light:true});assert.equal(m.state.players[0].attack.moveId,'cross');assert.equal(m.state.players[0].attack.beat,true);
  const miss=fresh();n(miss,16,{light:true});step(miss,{light:false});step(miss,{light:true});assert.equal(miss.state.players[0].attack.moveId,'jab');
  n(m,60);assert.equal(m.state.players[0].lastHit,null);assert.equal(m.state.players[0].comboHits,0);
});
test('server geometry rejects behind, out of reach, wrong height, low vs air, down vs above',()=>{
  for(const [keys,x,y] of [[{light:true},390,360],[{light:true},500,360],[{light:true},450,200],[{light:true,down:true},450,340],[{light:true,down:true},450,250]]){
    const m=near(fresh());m.state.players[1].x=x;m.state.players[1].y=y;if(y<360)m.state.players[1].jumps=1;
    if(y===250){m.state.players[0].y=300;m.state.players[0].jumps=1;}
    const out=n(m,5,keys);assert.equal(out.filter(e=>e.type==='contact').length,0);
  }
});
test('front block chips, back block fails, simultaneous trades are slot symmetric',()=>{
  for(const face of [-1,1]){const m=near(fresh());m.state.players[1].face=face;n(m,5,{light:true},{block:true});assert.equal(m.state.players[1].hp,face===-1?98:86);}
  for(const focus of [0,7,50,100]){const m=near(fresh());m.state.players.forEach(p=>p.focus=focus);const e=n(m,5,{light:true},{light:true});assert.deepEqual(m.state.players.map(p=>p.hp),[86,86]);assert.equal(m.state.players[0].focus,m.state.players[1].focus);assert.equal(e.filter(e=>e.type==='contact').length,2);assert.ok(m.state.players.every(p=>p.attack===null&&p.buffer===null));}
});
test('only a confirmed launcher jump-cancels; attacks and dash have deterministic priority',()=>{
  const m=near(fresh());n(m,5,{light:true,up:true});const e=step(m,{jump:true});assert.ok(e.some(x=>x.type==='jump-cancel'));assert.equal(m.state.players[0].attack,null);assert.equal(m.state.players[0].jumps,1);
  const miss=fresh();n(miss,5,{light:true,up:true});step(miss,{jump:true});assert.notEqual(miss.state.players[0].attack,null);assert.equal(miss.state.players[0].jumps,0);
  const both=fresh();step(both,{heavy:true,light:true,dash:true,jump:true});assert.equal(both.state.players[0].attack.moveId,'kick');assert.equal(both.state.players[0].jumps,0);assert.equal(both.state.players[0].dashReady,0);
});
test('air reactions cap at three without relaunch reset, and reset only after landing recovery',()=>{
  const m=near(fresh());m.state.players.forEach(p=>{p.y=300;p.jumps=1;});m.state.players[1].airHits=2;
  n(m,5,{light:true,up:true});assert.equal(m.state.players[1].airHits,3);assert.equal(m.state.players[1].airLocked,true);
  n(m,30);assert.equal(m.state.players[1].y,360);assert.equal(m.state.players[1].airHits,0);assert.equal(m.state.players[1].airLocked,false);
});
test('hurt cancels a queued attack and block prevents buffer consumption into an attack',()=>{
  const m=near(fresh());m.state.players[0].face=-1;
  step(m,{heavy:true});n(m,11);step(m,{}, {light:true});step(m);
  step(m,{light:true});assert.ok(m.state.players[0].buffer);
  n(m,2);assert.equal(m.state.players[0].buffer,null);assert.equal(m.state.players[0].attack,null);assert.equal(m.state.players[0].hp,86);
  const blocked=fresh();step(blocked,{light:true});n(blocked,9);step(blocked,{heavy:true});n(blocked,4,{block:true});assert.equal(blocked.state.players[0].attack,null);assert.equal(blocked.state.players[0].buffer,null);
});
test('checkpoint replay preserves every tick and event including queued intent and previous buttons',()=>{
  let m=near(fresh()),copy=core.restore(core.snapshot(m));
  for(let i=0;i<900;i++){
    const a={right:i%90<20,left:i%90>70,up:i%3===0,light:i%19===0,heavy:i%43===0,jump:i%67===0};const b={left:i%80<20,right:i%80>65,down:i%5===0,light:i%23===0,jump:i%71===0};
    assert.deepEqual(step(copy,a,b),step(m,a,b));assert.deepEqual(copy,m);
    if(i%17===0)copy=core.restore(JSON.parse(JSON.stringify(copy)));
    if(m.state.phase==='round-over'){assert.equal(core.nextRound(m),true);assert.equal(core.nextRound(copy),true);}
  }
});
test('all roster pairs use identical combat stats and no campaign modifier fields',()=>{
  for(const a of core.ROSTER)for(const b of core.ROSTER){const m=near(fresh([a,b]));n(m,5,{light:true});assert.equal(m.state.players[1].hp,86);assert.deepEqual(Object.keys(m.state.players[0]),Object.keys(fresh().state.players[0]));}
});
test('malformed frames and checkpoints reject atomically, old rulesets and injected stats reject',()=>{
  const m=fresh(),before=core.snapshot(m);assert.throws(()=>core.stepMatch(m,[{tick:181,round:1,buttons:8},{tick:182,round:1,buttons:0}]));assert.deepEqual(m,before);
  for(const edit of [c=>c.schemaVersion=1,c=>c.rulesetId='arena-138-v1',c=>c.state.players[0].damage=999,c=>c.state.players[0].hp=NaN,c=>c.state.players[0].buffer={action:'light',face:1,vertical:0,pressTick:180}]){const c=core.snapshot(m);edit(c);assert.throws(()=>core.restore(c));}
  let reads=0;const c=core.snapshot(m);Object.defineProperty(c.state.players[0],'hp',{enumerable:true,get(){reads++;return 100;}});assert.throws(()=>core.restore(c));assert.equal(reads,0);
});

test('checkpoint move identifiers reject coercion without executing user code',()=>{
 const m=fresh();step(m,{light:true});let calls=0;m.state.players[0].attack.moveId={toString(){calls++;return 'jab';}};assert.throws(()=>core.restore(m));assert.equal(calls,0);
});
test('reachable launcher followed by three air hits terminates the fourth without injected air counts',()=>{
 const m=near(fresh()),events=[];for(let i=0;i<70;i++){const k=i===0?{light:true,up:true}:i===5?{jump:true}:[12,28,44,60].includes(i)?{light:true}:{};events.push(...step(m,k));}
 assert.deepEqual(events.filter(e=>e.type==='contact').map(e=>e.moveId),['uppercut','air','air','air']);assert.ok(events.some(e=>e.type==='whiff'&&e.moveId==='air'));
});
test('checkpoint move-stage consistency rejects impossible active attack tuples',()=>{
 const m=fresh();step(m,{light:true});for(const edit of [a=>a.stage=2,a=>a.moveId='cross',a=>a.face=-1]){const copy=core.snapshot(m);edit(copy.state.players[0].attack);assert.throws(()=>core.restore(copy));}
});
