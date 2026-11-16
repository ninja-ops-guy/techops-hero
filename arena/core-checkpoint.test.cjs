'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const core = require('./simulation.cjs');

// Independent public-contract fixtures, frozen in 499c2c5 (source scope: PR #138).
// No live service, transport restoration, future controls, or implementation hooks.
const KEYS = ['left', 'right', 'jump', 'punch', 'kick', 'block', 'dash'];
const CANARY = 'PRIVATE_CANARY_MUST_NOT_ESCAPE';
const copy = value => structuredClone(value);
function make(matchId = 'checkpoint-fixture') {
  return core.createMatch({ schemaVersion: 1, rulesetId: 'arena-138-v1', matchId,
    characters: ['mike', 'k'] });
}
function frames(match, first = 0, second = 0) {
  return [first, second].map(buttons => buttons === null ? null : {
    tick: match.state.tick + 1, round: match.state.round, buttons
  });
}
function advance(match, count, first = 0, second = 0) {
  let events;
  for (let i = 0; i < count; i++) events = core.stepMatch(match, frames(match, first, second));
  return events;
}
function fight() { const match = make(); advance(match, 180); return match; }
function finished() {
  // Deliberately synthetic, schema-coherent checkpoint: no historical-proof claim.
  const match = fight();
  Object.assign(match.state, { phase: 'finished', round: 2, scores: [2, 0],
    roundTicks: 100, winner: 0 });
  match.state.players[1].hp = 0;
  return match;
}
function rejection(fn, code = 'ERR_ARENA_SCHEMA') {
  assert.throws(fn, error => {
    assert.equal(error.code, code);
    assert.ok(error instanceof (code === 'ERR_ARENA_SCHEMA' ? TypeError : RangeError));
    assert.equal(error.message.includes(CANARY), false);
    return true;
  });
}
function unchanged(match, operation, code = 'ERR_ARENA_SCHEMA') {
  const before = copy(match), state = match.state;
  rejection(operation, code);
  assert.deepEqual(match, before);
  assert.equal(match.state, state, 'rejection must not replace even the state reference');
}
function badCheckpoint(mutate, factory = make) {
  const candidate = core.snapshot(factory());
  mutate(candidate);
  rejection(() => core.restore(candidate));
}
function freeze(value) {
  if (value && typeof value === 'object') {
    for (const child of Object.values(value)) freeze(child);
    Object.freeze(value);
  }
  return value;
}

test('canonical checkpoints clone frozen data without sharing mutable history', () => {
  const original = make();
  for (const player of original.state.players) for (const name of ['previous', 'input'])
    assert.deepEqual(player[name], Object.fromEntries(KEYS.map(key => [key, false])));
  const checkpoint = freeze(core.snapshot(original));
  const restored = core.restore(checkpoint);
  assert.deepEqual(restored, checkpoint);
  assert.notEqual(restored.state, checkpoint.state);
  restored.state.players[0].input.jump = true;
  restored.state.players[1].previous.punch = true;
  assert.equal(checkpoint.state.players[0].input.jump, false);
  assert.equal(original.state.players[1].previous.punch, false);
  const detached = core.snapshot(original);
  detached.state.scores[0] = 1;
  assert.equal(original.state.scores[0], 0);
  const frozenState = freeze(original.state);
  core.stepMatch(original, [null, null]);
  assert.equal(original.state.remaining, 179);
  assert.equal(frozenState.remaining, 180);
});

test('unknown versions, rulesets, credentials and missing schema fields reject', () => {
  const mutations = [
    m => { m.schemaVersion = 2; }, m => { delete m.rulesetId; },
    m => { m.rulesetId = 'arena-137-v1'; }, m => { m.matchId = ''; },
    m => { m.matchId = 'x'.repeat(65); }, m => { m.matchId = 'not:an:id'; },
    m => { m.token = CANARY; }, m => { m.state.room = CANARY; },
    m => { m.state.players[0].awaitingRelease = ['punch']; },
    m => { m.state.players[0].input.special = true; },
    m => { delete m.state.players[1].previous; },
    m => { delete m.state.characters; }
  ];
  for (const mutate of mutations) badCheckpoint(mutate);
  const malformedConfig = { schemaVersion: 1, rulesetId: 'arena-138-v1',
    matchId: 'configuration', characters: ['mike', 'unknown'], token: CANARY };
  rejection(() => core.createMatch(malformedConfig));
});

test('prototype, descriptor and accessor attacks reject without running getters', () => {
  for (const key of ['__proto__', 'constructor', 'prototype']) badCheckpoint(m => {
    Object.defineProperty(m.state.players[0].input, key, { value: CANARY, enumerable: true });
  });
  badCheckpoint(m => { Object.setPrototypeOf(m.state.players[0], { hp: 100 }); });
  badCheckpoint(m => { m.state.players[0].input = Object.create({ left: true }); });
  badCheckpoint(m => { m.state.players[0][Symbol('extra')] = CANARY; });
  badCheckpoint(m => { Object.defineProperty(m.state, 'tick', { value: 0, enumerable: false }); });
  let calls = 0;
  const malformed = core.snapshot(make());
  Object.defineProperty(malformed.state.players[1], 'hp', {
    enumerable: true, get() { calls++; throw new Error(CANARY); }
  });
  rejection(() => core.restore(malformed));
  assert.equal(calls, 0);
  const match = make(), pair = frames(match, 8, 0);
  Object.defineProperty(pair[1], 'buttons', {
    enumerable: true, get() { calls++; throw new Error(CANARY); }
  });
  unchanged(match, () => core.stepMatch(match, pair));
  assert.equal(calls, 0);
});

test('array shape and resource bounds reject sparse, oversized and extended collections', () => {
  for (const field of ['characters', 'scores', 'players']) {
    badCheckpoint(m => { m.state[field].pop(); });
    badCheckpoint(m => { m.state[field].push(m.state[field][0]); });
    badCheckpoint(m => { delete m.state[field][1]; });
    badCheckpoint(m => { m.state[field].extra = CANARY; });
    badCheckpoint(m => { m.state[field] = new Array(0xffffffff); });
  }
  const match = make();
  for (const pair of [[], [null], [null, null, null], new Array(2), new Array(0xffffffff)])
    unchanged(match, () => core.stepMatch(match, pair));
  const extended = [null, null]; extended.extra = true;
  unchanged(match, () => core.stepMatch(match, extended));
});

test('finite scalar and safe counter bounds reject coercion and out-of-range data', () => {
  for (const value of [NaN, Infinity, -Infinity, JSON.parse('1e309'), '0', 0.5, -1,
    Number.MAX_SAFE_INTEGER + 1, 0n, new Number(0)])
    badCheckpoint(m => { m.state.tick = value; });
  for (const [field, value] of [['round', 0], ['remaining', 181], ['roundTicks', 5401]])
    badCheckpoint(m => { m.state[field] = value; });
  for (const [field, value] of [['x', 19], ['x', 941], ['y', 198], ['y', 361],
    ['vx', 781], ['vy', 601], ['hp', 101], ['hp', 99], ['focus', -1], ['focus', 101],
    ['face', 0], ['jumps', 3], ['cooldown', 39], ['dashCooldown', 37], ['stun', 13]])
    badCheckpoint(m => { m.state.players[0][field] = value; }, fight);
});

test('attack checkpoints reject invented or internally inconsistent rule tuples', () => {
  const active = () => { const m = fight(); advance(m, 1, 8, 0); return m; };
  assert.doesNotThrow(() => core.restore(core.snapshot(active())));
  for (const [field, value] of [['damage', 999], ['reach', 82], ['contact', 14],
    ['age', 0], ['age', 24], ['age', 1.5]])
    badCheckpoint(m => { m.state.players[0].attack[field] = value; }, active);
  badCheckpoint(m => { m.state.players[0].cooldown--; }, active);
  badCheckpoint(m => { m.state.players[0].stun = 1; }, active);
  badCheckpoint(m => { m.state.players[0].attack.extra = CANARY; }, active);
});

test('both frames validate atomically before any first-player input is applied', () => {
  const match = fight();
  const mutations = [
    f => { f.buttons = 128; }, f => { f.buttons = -1; }, f => { f.buttons = 0.5; },
    f => { f.buttons = '8'; }, f => { f.slot = 1; }, f => { f.special = true; },
    f => { delete f.round; }
  ];
  for (const mutate of mutations) {
    const pair = frames(match, 8, 0); mutate(pair[1]);
    const firstBefore = copy(pair[0]);
    unchanged(match, () => core.stepMatch(match, pair));
    assert.deepEqual(pair[0], firstBefore);
  }
  for (const [field, delta] of [['tick', -1], ['tick', 1], ['round', 1]]) {
    const pair = frames(match, 8, 0); pair[1][field] += delta;
    unchanged(match, () => core.stepMatch(match, pair), 'ERR_ARENA_FRAME');
  }
  unchanged(match, () => core.stepMatch(match, [frames(match, 8)[0], undefined]));
});

test('readonly destinations and invalid prospective states never partially commit', () => {
  const readonly = make();
  Object.defineProperty(readonly, 'state', { writable: false });
  unchanged(readonly, () => core.stepMatch(readonly, [null, null]));
  // Explicitly synthetic checkpoint allowed by scalar bounds, but not reachable.
  const synthetic = fight();
  Object.assign(synthetic.state.players[0], { y: 199, vy: -420, jumps: 2 });
  assert.doesNotThrow(() => core.restore(core.snapshot(synthetic)));
  unchanged(synthetic, () => core.stepMatch(synthetic, [null, null]));
});

test('safe-integer overflow rejects before tick, round, input or event changes', () => {
  const match = make(); match.state.tick = Number.MAX_SAFE_INTEGER;
  assert.doesNotThrow(() => core.restore(core.snapshot(match)));
  unchanged(match, () => core.stepMatch(match, [null, null]), 'ERR_ARENA_COUNTER');
  const terminal = fight();
  Object.assign(terminal.state, { round: Number.MAX_SAFE_INTEGER,
    phase: 'round-over', roundTicks: 0, winner: null });
  unchanged(terminal, () => core.nextRound(terminal), 'ERR_ARENA_COUNTER');
  const disconnected = make();
  Object.assign(disconnected.state, { tick: Number.MAX_SAFE_INTEGER,
    phase: 'disconnected', winner: null, outcome: { reason: 'timeout', winner: null } });
  unchanged(disconnected, () => core.stepMatch(disconnected, [null, null]), 'ERR_ARENA_COUNTER');
});

test('restoring held attack history does not manufacture a new edge', () => {
  const original = fight(); advance(original, 24, 8, 8);
  assert.equal(original.state.players[0].attack, null);
  assert.equal(original.state.players[0].input.punch, true);
  assert.equal(original.state.players[0].previous.punch, true);
  assert.equal(original.state.players[1].input.punch, true);
  assert.equal(original.state.players[1].previous.punch, true);
  const restored = core.restore(core.snapshot(original));
  const expected = advance(original, 1, 8, 8);
  assert.deepEqual(advance(restored, 1, 8, 8), expected);
  assert.deepEqual(restored, original);
  assert.equal(restored.state.players[0].attack, null);
  advance(restored, 1, null, null);
  advance(restored, 1, 8, 8);
  assert.equal(restored.state.players[0].attack.age, 1);
  assert.equal(restored.state.players[1].attack.age, 1);
  const countdown = make(); advance(countdown, 1, 4, 0);
  assert.equal(countdown.state.players[0].input.jump, true);
  assert.equal(countdown.state.players[0].previous.jump, false);
  const pendingEdge = core.restore(core.snapshot(countdown));
  advance(pendingEdge, 179, 4, 0);
  assert.equal(pendingEdge.state.players[0].jumps, 0);
  advance(pendingEdge, 1, 4, 0);
  assert.equal(pendingEdge.state.players[0].jumps, 1);
  badCheckpoint(m => { delete m.state.players[0].previous.punch; }, () => original);
});

test('real hit cancellation and stun survive restore with positive cooldown', () => {
  const original = fight();
  original.state.players[0].x = 400; original.state.players[1].x = 450;
  advance(original, 7, 16, 8);
  assert.equal(original.state.players[0].attack, null);
  assert.ok(original.state.players[0].cooldown > 0);
  assert.equal(original.state.players[0].stun, 12);
  const restored = core.restore(core.snapshot(original));
  assert.deepEqual(advance(restored, 1, 16, 8), advance(original, 1, 16, 8));
  assert.deepEqual(restored, original);
});

test('disconnected outcomes preserve forfeits and completed results without revival', () => {
  const forfeit = fight();
  forfeit.state.players[1].hp = 2;
  Object.assign(forfeit.state, { phase: 'disconnected', winner: 1,
    outcome: { reason: 'leave', winner: 1 } });
  const complete = finished();
  Object.assign(complete.state, { phase: 'disconnected',
    outcome: { reason: 'timeout', winner: 0, matchComplete: true } });
  for (const value of [forfeit, complete]) {
    const restored = core.restore(core.snapshot(value)), before = copy(restored);
    assert.deepEqual(core.stepMatch(restored, frames(restored, 8, 16)), []);
    assert.equal(core.nextRound(restored), false);
    assert.deepEqual(restored, before);
  }
  for (const mutate of [m => { delete m.state.outcome; },
    m => { m.state.outcome.reason = 'network'; }, m => { m.state.outcome.winner = 0; },
    m => { m.state.outcome.matchComplete = false; }, m => { m.state.outcome.matchComplete = null; },
    m => { m.state.outcome.matchComplete = true; }, m => { m.state.outcome.token = CANARY; }])
    badCheckpoint(mutate, () => forfeit);
  badCheckpoint(m => { delete m.state.outcome.matchComplete; }, () => complete);
});

test('HTTP projections and raw legacy state cannot be repaired into checkpoints', () => {
  const match = fight();
  rejection(() => core.restore(copy(match.state)));
  const projection = core.snapshot(match);
  delete projection.state.characters;
  for (const player of projection.state.players) { delete player.input; delete player.previous; }
  rejection(() => core.restore(projection));
  badCheckpoint(m => { m.state.players[0].input = {}; });
  badCheckpoint(m => { m.state.players[1].previous = {}; });
  badCheckpoint(m => { m.state.players[0].character = 'felicia'; });
});

test('phase, score and timer invariants reject contradictions without imposing history', () => {
  badCheckpoint(m => { m.state.remaining = 0; });
  badCheckpoint(m => { m.state.players[0].previous.jump = true; });
  badCheckpoint(m => { m.state.roundTicks = 5399; });
  badCheckpoint(m => { m.state.players[0].hp = 0; }, fight);
  badCheckpoint(m => { m.state.scores = [2, 2]; }, finished);
  badCheckpoint(m => { m.state.winner = 1; }, finished);
  badCheckpoint(m => { m.state.outcome = { reason: 'leave', winner: null }; });
  const drawn = fight();
  Object.assign(drawn.state, { phase: 'round-over', tick: 0, roundTicks: 0, winner: null });
  const restored = core.restore(core.snapshot(drawn));
  assert.equal(core.nextRound(restored), true);
  assert.equal(restored.state.round, 2);
  assert.equal(restored.state.tick, 0);
  assert.doesNotThrow(() => core.restore(core.snapshot(restored)));
});

test('events and exported checkpoints contain only bounded detached public data', () => {
  const match = fight();
  match.state.players[0].x = 400; match.state.players[1].x = 450;
  match.state.players[1].hp = 10;
  const events = advance(match, 7, 8, 0);
  assert.equal(events.length, 2);
  assert.deepEqual(events.map(event => event.type), ['contact', 'phase']);
  assert.deepEqual(Object.keys(events[0]).sort(),
    ['id', 'matchId', 'round', 'tick', 'ordinal', 'type', 'source', 'target', 'kind', 'blocked', 'damage'].sort());
  assert.deepEqual(Object.keys(events[1]).sort(),
    ['id', 'matchId', 'round', 'tick', 'ordinal', 'type', 'phase', 'winner'].sort());
  assert.equal(events[0].damage, 10);
  assert.equal(events[1].winner, 0);
  for (const [ordinal, event] of events.entries()) {
    assert.equal(event.ordinal, ordinal);
    assert.equal(event.matchId, match.matchId);
    assert.equal(event.round, match.state.round);
    assert.equal(event.tick, match.state.tick);
    assert.equal(event.id, `${match.matchId}:${match.state.round}:${match.state.tick}:${ordinal}`);
  }
  const checkpoint = core.snapshot(match), stateBefore = copy(match);
  events[0].damage = 999; checkpoint.state.players[1].hp = 100;
  assert.deepEqual(match, stateBefore);
  assert.equal(JSON.stringify(core.snapshot(match)).includes(CANARY), false);
});
