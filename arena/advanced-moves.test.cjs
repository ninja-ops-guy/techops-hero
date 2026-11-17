'use strict';
const {test} = require('node:test');
const assert = require('node:assert/strict');
const c = require('./advanced-moves.js');
const base = {airborne:false,up:false,down:false,action:'light',tick:0,lastPress:null,lastHit:null};
test('directional attack selection is explicit and mirrored by posture', () => {
  const table = [
    [{},'jab'],[{up:true},'uppercut'],[{down:true},'low'],[{up:true,down:true},'jab'],
    [{action:'heavy'},'kick'],[{action:'heavy',up:true},'rising-kick'],[{action:'heavy',down:true},'sweep'],
    [{airborne:true},'air'],[{airborne:true,down:true},'air-down'],
    [{airborne:true,action:'heavy'},'air-kick'],[{airborne:true,action:'heavy',down:true},'air-slam']
  ];
  for (const [inputs,id] of table) assert.equal(c.selectMove({...base,...inputs}).moveId,id);
});
test('beat limits and confirmation are calculated from fixed ticks', () => {
  const s = { ...base, lastPress:0,lastHit:1, stage:0};
  assert.equal(c.selectMove({...s,tick:15}).beat,false);
  assert.deepEqual(c.selectMove({...s,tick:16}),{moveId:'cross',stage:1,beat:true});
  assert.equal(c.selectMove({...s,tick:30}).beat,true);
  assert.equal(c.selectMove({...s,tick:31}).beat,false);
  assert.equal(c.selectMove({...s,tick:34,pressTick:30}).beat,true, 'buffer preserves press timing');
  assert.equal(c.selectMove({...s,tick:16,lastHit:null}).beat,false);
  assert.equal(c.selectMove({...s,tick:16,stage:1}).moveId,'launcher');
  assert.equal(c.selectMove({...s,tick:55,lastPress:30,lastHit:1}).beat,false);
});
test('timing definitions round up and duration includes offline minimum contact tail', () => {
  assert.equal(c.MOVES.jab.contactTick,5); assert.equal(c.MOVES.jab.durationTicks,14);
  assert.equal(c.MOVES['air-down'].contactTick,3); assert.equal(c.MOVES['air-slam'].durationTicks,16);
  assert.equal(c.BUFFER_TICKS,4);
  assert.ok(Object.isFrozen(c.MOVES)); assert.ok(Object.isFrozen(c.MOVES.jab));
});
test('selection rejects malformed and future timestamps', () => {
  for (const extra of [{action:'grab'},{tick:1,lastHit:2},{stage:3},{up:1}])
    assert.throws(() => c.selectMove({...base,...extra}),TypeError);
});
