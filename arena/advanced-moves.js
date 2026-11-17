(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory();
  else root.ArenaAdvancedMoves=factory();
})(typeof globalThis==='object'?globalThis:this,function(){
'use strict';
// Normalized Arena base kit; provisional competitive balance.
// Source: #135 7fe5d319 and #137 db996700, night_combat.js.
// Damage and reach use campaign base values, not approved PvP balance.
// Launcher velocities convert units/frame to units/second. Air slam adds an
// explicit downward target constraint; this is proposed Arena aiming behavior.
const HZ = 60;
const ticks = ms => Math.ceil(ms * HZ / 1000);
const definition = (damage, reach, windup, duration, flags = {}) => Object.freeze({
  damage, reach, contactTick: ticks(windup), durationTicks: ticks(Math.max(duration, windup + 45)), ...flags
});
const MOVES = Object.freeze({
  jab: definition(14,76,70,230), cross: definition(18,76,70,230),
  launcher: definition(24,80,70,230,{launch:true,vx:84,vy:-576}),
  uppercut: definition(20,82,80,270,{launch:true,vx:54,vy:-588}), low: definition(12,76,65,210,{low:true}),
  kick: definition(22,104,100,300,{launch:true,vx:108,vy:-528}),
  'rising-kick': definition(26,94,110,320,{launch:true,vx:60,vy:-612}),
  sweep: definition(16,96,90,300,{low:true,knockdown:true}),
  air: definition(14,112,70,230), 'air-kick': definition(18,102,70,230),
  'air-slam': definition(22,98,85,260,{slam:true,downward:true}),
  'air-down': definition(12,96,50,180,{downward:true})
});
const BEAT_MIN_TICKS = ticks(260); // inclusive: 16 ticks
const BEAT_MAX_TICKS = Math.floor(500 * HZ / 1000); // inclusive: 30 ticks
// Offline checks contact age < 900 ms; at 60 Hz ticks 0..53 are valid.
const CHAIN_LIFE_TICKS = ticks(900);
const BUFFER_TICKS = ticks(65);

// Press tick and last-confirmed-contact tick are simulation ticks, not wall time.
// A null timestamp denotes no earlier event. Simultaneous up/down neutralize.
// `stage` advances only on a confirmed on-beat chain, and equipment/passives
// are intentionally absent. For now all roster members share this base kit.
function selectMove({airborne, up, down, action, tick, pressTick = tick, lastPress, lastHit, stage = 0}) {
  if (typeof airborne !== 'boolean' || typeof up !== 'boolean' || typeof down !== 'boolean' ||
      !['light','heavy'].includes(action) || !Number.isSafeInteger(tick) || tick < 0 ||
      !Number.isSafeInteger(pressTick) || pressTick < 0 || pressTick > tick ||
      !Number.isInteger(stage) || stage < 0 || stage > 2 ||
      ![lastPress,lastHit].every(v => v === null || (Number.isSafeInteger(v) && v >= 0 && v <= tick))) {
    throw new TypeError('Invalid combat selection');
  }
  if (lastPress !== null && lastPress > pressTick) throw new TypeError('Invalid combat selection');
  const gap = lastPress === null ? null : pressTick - lastPress;
  const beat = lastHit !== null && tick - lastHit < CHAIN_LIFE_TICKS && gap !== null &&
    gap >= BEAT_MIN_TICKS && gap <= BEAT_MAX_TICKS;
  const nextStage = beat ? (stage + 1) % 3 : 0;
  const vertical = up === down ? 'neutral' : up ? 'up' : 'down';
  let moveId;
  if (airborne) moveId = action === 'light' ? (vertical === 'down' ? 'air-down' : 'air') :
    (vertical === 'down' ? 'air-slam' : 'air-kick');
  else if (action === 'heavy') moveId = vertical === 'up' ? 'rising-kick' : vertical === 'down' ? 'sweep' : 'kick';
  else moveId = vertical === 'up' ? 'uppercut' : vertical === 'down' ? 'low' :
    nextStage === 2 ? 'launcher' : nextStage === 1 ? 'cross' : 'jab';
  return {moveId, stage: nextStage, beat};
}
return Object.freeze({HZ, MOVES, BEAT_MIN_TICKS, BEAT_MAX_TICKS, CHAIN_LIFE_TICKS, BUFFER_TICKS, selectMove});

});
