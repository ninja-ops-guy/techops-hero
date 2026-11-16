'use strict';
// Pure local regression suite: no HTTP server, campaign globals, or save access.
const {test} = require('node:test');
const assert = require('node:assert/strict');
const sim = require('./simulation.cjs');

function advance(state, count) {
  for (let i = 0; i < count; i++) sim.step(state);
  return state;
}
function fight(characters = ['mike', 'k']) {
  const state = advance(sim.create(characters), 180);
  state.players[0].x = 400;
  state.players[1].x = 450;
  return state;
}
function trade(focus) {
  const state = fight();
  for (const player of state.players) player.focus = focus;
  sim.input(state, 0, {punch: true});
  sim.input(state, 1, {punch: true});
  return advance(state, 7);
}
function tape(tick, slot) {
  const phase = (tick + slot * 17) % 120;
  return {
    left: phase >= 60 && phase < 90,
    right: phase < 30,
    jump: phase === 12 || phase === 25,
    punch: phase === 40,
    kick: phase === 80,
    block: phase >= 92 && phase < 100,
    dash: phase === 4
  };
}

test('1,200 tick replay survives JSON save/restore of complete simulation state', () => {
  const state = sim.create(['iona', 'felicia']);
  let replay = sim.create(['iona', 'felicia']);
  for (let tick = 0; tick < 1200; tick++) {
    for (let slot = 0; slot < 2; slot++) {
      sim.input(state, slot, tape(tick, slot));
      sim.input(replay, slot, tape(tick, slot));
    }
    sim.step(state);
    sim.step(replay);
    if (tick === 333) replay = JSON.parse(JSON.stringify(replay));
    assert.deepEqual(replay, state, `replay diverged at tick ${tick + 1}`);
    for (const p of state.players) {
      for (const key of ['x', 'y', 'vx', 'vy', 'hp', 'focus']) assert.ok(Number.isFinite(p[key]), key);
      assert.ok(p.x >= 20 && p.x <= 940 && p.y <= 360);
      assert.ok(p.hp >= 0 && p.hp <= 100 && p.focus >= 0 && p.focus <= 100);
    }
  }
});

test('all four roster names have identical base match state except identity', () => {
  const normalized = character => {
    const state = fight([character, character]);
    for (const player of state.players) delete player.character;
    delete state.characters;
    return state;
  };
  const baseline = normalized('mike');
  for (const character of sim.ROSTER) assert.deepEqual(normalized(character), baseline);
});

test('countdown lasts 180 ticks and does not spend the 5,400 tick fight clock', () => {
  const state = sim.create();
  sim.input(state, 0, {right: true});
  advance(state, 179);
  assert.equal(state.phase, 'countdown');
  assert.equal(state.players[0].x, 310);
  sim.step(state);
  assert.equal(state.phase, 'fight');
  assert.equal(state.roundTicks, 5400);
  sim.step(state);
  assert.equal(state.players[0].x, 314);
  assert.equal(state.roundTicks, 5399);
});

test('light and heavy contacts occur once at the documented startup ticks', () => {
  for (const [key, startup, damage] of [['punch', 7, 10], ['kick', 14, 18]]) {
    const state = fight();
    sim.input(state, 0, {[key]: true});
    advance(state, startup - 1);
    assert.equal(state.players[1].hp, 100, `${key} early contact`);
    sim.step(state);
    assert.equal(state.players[1].hp, 100 - damage);
    advance(state, 180);
    assert.equal(state.players[1].hp, 100 - damage, `${key} repeats while held`);
    assert.equal(state.players[0].focus, 8);
  }
});

test('front block preserves chip and focus rules while back-facing block fails', () => {
  for (const front of [true, false]) {
    const state = fight();
    state.players[1].face = front ? -1 : 1;
    sim.input(state, 1, {block: true});
    sim.input(state, 0, {kick: true});
    advance(state, 14);
    assert.deepEqual(state.players.map(p => p.hp), [100, front ? 98 : 82]);
    assert.deepEqual(state.players.map(p => p.focus), front ? [2, 4] : [8, 0]);
    assert.equal(state.players[1].stun, front ? 0 : 12);
  }
});

test('light contact includes its horizontal reach boundary but excludes behind', () => {
  for (const [distance, face, expected] of [[62, 1, 90], [62.01, 1, 100], [50, -1, 100]]) {
    const state = fight();
    state.players[1].x = state.players[0].x + distance;
    state.players[0].face = face;
    sim.input(state, 0, {punch: true});
    advance(state, 7);
    assert.equal(state.players[1].hp, expected);
  }
});

test('movement baseline is 240 units/s and blocking movement is 80 units/s', () => {
  for (const [block, speed] of [[false, 240], [true, 80]]) {
    const state = fight();
    const start = state.players[0].x;
    sim.input(state, 0, {right: true, block});
    advance(state, 60);
    assert.ok(Math.abs(state.players[0].x - start - speed) < 1e-9);
  }
});

test('dash covers 117 units over nine active ticks then obeys neutral input', () => {
  const state = fight();
  const start = state.players[0].x;
  sim.input(state, 0, {dash: true});
  advance(state, 9);
  assert.equal(state.players[0].x - start, 117);
  sim.step(state);
  assert.equal(state.players[0].x - start, 117);
  assert.equal(state.players[0].dashCooldown, 27);
});

test('single unblocked hit awards and subtracts focus with bounded saturation', () => {
  for (const focus of [0, 50, 100]) {
    const state = fight();
    for (const player of state.players) player.focus = focus;
    sim.input(state, 0, {punch: true});
    advance(state, 7);
    assert.deepEqual(state.players.map(p => p.focus), [Math.min(100, focus + 8), Math.max(0, focus - 15)]);
  }
});

for (const focus of [0, 7, 50, 100]) {
  test(`simultaneous trades apply one net focus delta per fighter from starting focus ${focus}`, () => {
    const state = trade(focus);
    assert.deepEqual(state.players.map(p => p.hp), [90, 90], 'preserve simultaneous damage');
    assert.deepEqual(state.players.map(p => p.stun), [12, 12], 'preserve hit stun');
    assert.deepEqual(state.players.map(p => p.attack), [null, null], 'preserve attack interruption');
    const expected = Math.max(0, Math.min(100, focus + 8 - 15));
    assert.deepEqual(state.players.map(p => p.focus), [expected, expected], 'focus must not depend on slot iteration order');
  });
}

test('equal-health timeout is a draw and next round restores only match-local state', () => {
  const state = fight(['iona', 'felicia']);
  state.players[0].focus = 42;
  state.roundTicks = 1;
  sim.step(state);
  assert.equal(state.phase, 'round-over');
  assert.equal(state.winner, null);
  assert.deepEqual(state.scores, [0, 0]);
  assert.equal(sim.next(state), true);
  assert.equal(state.round, 2);
  assert.equal(state.phase, 'countdown');
  assert.deepEqual(state.characters, ['iona', 'felicia']);
  assert.deepEqual(state.players.map(p => [p.hp, p.focus]), [[100, 0], [100, 0]]);
});
