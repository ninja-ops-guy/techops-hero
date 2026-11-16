'use strict';
// Portable tests: no Git history, network, browser, campaign or save dependency.
const {test} = require('node:test');
const assert = require('node:assert/strict');
const sim = require('./simulation.cjs');
const KEYS = ['left', 'right', 'jump', 'punch', 'kick', 'block', 'dash'];
const BIT = Object.freeze({left: 1, right: 2, jump: 4, punch: 8, kick: 16, block: 32, dash: 64});
const ROSTER = ['mike', 'k', 'iona', 'felicia'];
const copy = value => JSON.parse(JSON.stringify(value));
const keys = buttons => Object.fromEntries(KEYS.map((key, bit) => [key, !!(buttons & (1 << bit))]));
function create(matchId = 'replay', characters = ['mike', 'k']) {
  return sim.createMatch({schemaVersion: 1, rulesetId: 'arena-138-v1', matchId, characters});
}
function frames(match, masks = [0, 0]) {
  return masks.map(buttons => buttons === null ? null : {
    tick: match.state.tick + 1, round: match.state.round, buttons
  });
}
function step(match, masks = [0, 0]) {
  return sim.stepMatch(match, frames(match, masks));
}
function advance(match, count, masks = [0, 0]) {
  const events = [];
  for (let i = 0; i < count; i++) events.push(...step(match, masks));
  return events;
}
function fight(matchId = 'fight') {
  const match = create(matchId);
  advance(match, 180);
  // Declared contact fixture, not a claim that this tape walked to these positions.
  match.state.players[0].x = 400;
  match.state.players[1].x = 450;
  return match;
}
function canonicalLegacy(state) {
  const normalized = copy(state);
  for (const player of normalized.players) {
    for (const name of ['previous', 'input']) {
      const held = player[name];
      player[name] = Object.fromEntries(KEYS.map(key => [key, held[key] === true]));
    }
  }
  return normalized;
}
function legacyStep(state, masks) {
  masks.forEach((buttons, slot) => sim.input(state, slot, keys(buttons || 0)));
  return sim.step(state);
}
function eventHeader(match, ordinal, type) {
  const {tick, round} = match.state;
  return {id: `${match.matchId}:${round}:${tick}:${ordinal}`,
    matchId: match.matchId, round, tick, ordinal, type};
}
function assertEventEnvelope(match, events, seen) {
  assert.ok(events.length <= 3, 'events must stay bounded per tick');
  events.forEach((event, ordinal) => {
    for (const [key, value] of Object.entries(eventHeader(match, ordinal, event.type))) {
      assert.equal(event[key], value, `event ${key}`);
    }
    assert.ok(!seen.has(event.id), 'event identity repeats within one match');
    seen.add(event.id);
    assert.ok(['contact', 'phase'].includes(event.type));
  });
}
function tape(tick, slot) {
  const phase = (tick + slot * 17) % 180;
  let buttons = 0;
  if (phase < 36) buttons |= slot ? BIT.left : BIT.right;
  if (phase >= 100 && phase < 124) buttons |= slot ? BIT.right : BIT.left;
  if (phase === 42 || phase === 55) buttons |= BIT.jump;
  if (phase === 87) buttons |= BIT.punch;
  if (phase === 125) buttons |= BIT.kick;
  if (phase >= 138 && phase < 150) buttons |= BIT.block;
  if (phase === 8) buttons |= BIT.dash;
  return buttons || null;
}

test('all 16 roster pairings keep complete strict/legacy state parity over 720 ticks', () => {
  for (const first of ROSTER) for (const second of ROSTER) {
    let match = create(`pair-${first}-${second}`, [first, second]);
    const legacy = sim.create([first, second]);
    const seen = new Set();
    assert.deepEqual(match.state, canonicalLegacy(legacy));
    for (let tick = 1; tick <= 720; tick++) {
      const masks = [tape(tick, 0), tape(tick, 1)];
      const events = step(match, masks);
      legacyStep(legacy, masks);
      assert.deepEqual(match.state, canonicalLegacy(legacy), `${first}/${second}, tick ${tick}`);
      assertEventEnvelope(match, events, seen);
      if (tick === 333) match = sim.restore(sim.snapshot(match));
    }
  }
});

test('countdown stores held input without consuming its first fight edge', () => {
  const match = create('countdown');
  assert.deepEqual(advance(match, 179, [BIT.punch, null]), []);
  assert.equal(match.state.tick, 179);
  assert.equal(match.state.remaining, 1);
  assert.equal(match.state.players[0].previous.punch, false);
  assert.equal(match.state.players[0].input.punch, true);
  const resumed = sim.restore(sim.snapshot(match));
  const events = step(match, [BIT.punch, null]);
  assert.deepEqual(step(resumed, [BIT.punch, null]), events);
  assert.deepEqual(resumed, match);
  assert.deepEqual(events, [{...eventHeader(match, 0, 'phase'), phase: 'fight', winner: null}]);
  assert.equal(match.state.tick, 180);
  assert.equal(match.state.roundTicks, 5400);
  assert.equal(match.state.players[0].attack, null);
  assert.deepEqual(step(match, [BIT.punch, null]), []);
  assert.deepEqual(step(resumed, [BIT.punch, null]), []);
  assert.deepEqual(resumed, match);
  assert.equal(match.state.players[0].attack.age, 1);
  assert.equal(match.state.players[0].attack.damage, 10);
  assert.equal(match.state.roundTicks, 5399);
});

test('existing simultaneous jump/dash/attack order and kick precedence remain intact', () => {
  const match = fight('simultaneous-actions');
  const mask = BIT.jump | BIT.dash | BIT.punch | BIT.kick;
  const legacy = copy(match.state);
  assert.deepEqual(step(match, [mask, null]), []);
  legacyStep(legacy, [mask, null]);
  assert.deepEqual(match.state, canonicalLegacy(legacy));
  const player = match.state.players[0];
  assert.equal(player.jumps, 1);
  assert.equal(player.x, 413);
  assert.equal(player.vx, 780);
  assert.equal(player.dashCooldown, 36);
  assert.deepEqual(player.attack, {age: 1, contact: 14, damage: 18, reach: 82});
});

test('light/heavy contact events preserve hits, front block, back block and whiffs', () => {
  for (const fixture of [
    {id: 'light', button: BIT.punch, ticks: 7, damage: 10, hp: 90, focus: [8, 0]},
    {id: 'blocked', button: BIT.kick, ticks: 14, damage: 2, hp: 98, focus: [2, 4], block: true},
    {id: 'back-block', button: BIT.kick, ticks: 14, damage: 18, hp: 82, focus: [8, 0], block: true, back: true}
  ]) {
    const match = fight(fixture.id);
    if (fixture.back) match.state.players[1].face = 1;
    const masks = [fixture.button, fixture.block ? BIT.block : null];
    assert.deepEqual(advance(match, fixture.ticks - 1, masks), []);
    const events = step(match, masks);
    assert.deepEqual(events, [{...eventHeader(match, 0, 'contact'), source: 0, target: 1,
      kind: fixture.button === BIT.punch ? 'punch' : 'kick',
      blocked: fixture.damage === 2, damage: fixture.damage}]);
    assert.equal(match.state.players[1].hp, fixture.hp);
    assert.deepEqual(match.state.players.map(p => p.focus), fixture.focus);
    assert.equal(match.state.players[1].stun, fixture.damage === 2 ? 0 : 12);
  }
  const miss = fight('whiff');
  miss.state.players[0].face = -1;
  assert.deepEqual(advance(miss, 30, [BIT.punch, null]), []);
  assert.equal(miss.state.players[1].hp, 100);
});

test('simultaneous knockout trades emit two ordered contacts then a draw', () => {
  const match = fight('trade');
  // Declared low-health/saturated-focus fixture exercises one-tick event bounds.
  for (const player of match.state.players) { player.hp = 10; player.focus = 100; }
  advance(match, 6, [BIT.punch, BIT.punch]);
  const events = step(match, [BIT.punch, BIT.punch]);
  assert.deepEqual(events, [
    {...eventHeader(match, 0, 'contact'), source: 0, target: 1, kind: 'punch', blocked: false, damage: 10},
    {...eventHeader(match, 1, 'contact'), source: 1, target: 0, kind: 'punch', blocked: false, damage: 10},
    {...eventHeader(match, 2, 'phase'), phase: 'round-over', winner: null}
  ]);
  assert.deepEqual(match.state.players.map(p => p.hp), [0, 0]);
  assert.deepEqual(match.state.players.map(p => p.focus), [93, 93]);
  assert.deepEqual(match.state.players.map(p => p.stun), [12, 12]);
  assert.deepEqual(match.state.scores, [0, 0]);
  assert.equal(match.state.winner, null);
});

test('contact damage reports rule amount before the health floor clamp', () => {
  const match = fight('overkill');
  match.state.players[1].hp = 2;
  advance(match, 13, [BIT.kick, null]);
  const events = step(match, [BIT.kick, null]);
  assert.equal(events[0].damage, 18);
  assert.deepEqual(events[1], {...eventHeader(match, 1, 'phase'), phase: 'round-over', winner: 0});
  assert.equal(match.state.players[1].hp, 0);
  assert.deepEqual(match.state.scores, [1, 0]);
});

test('round reset, first-to-two victory, terminal ticks and rematches preserve parity', () => {
  const match = fight('rounds');
  const legacy = copy(match.state);
  for (let round = 1; round <= 2; round++) {
    // Declared timeout/health fixture; the transition and reset are real operations.
    match.state.roundTicks = legacy.roundTicks = 1;
    match.state.players[1].hp = legacy.players[1].hp = 98;
    const events = step(match, [null, null]);
    legacyStep(legacy, [null, null]);
    assert.deepEqual(match.state, canonicalLegacy(legacy));
    const phase = round === 2 ? 'finished' : 'round-over';
    assert.deepEqual(events, [{...eventHeader(match, 0, 'phase'), phase, winner: 0}]);
    assert.deepEqual(match.state.scores, [round, 0]);
    const before = copy(match.state);
    const resumed = sim.restore(sim.snapshot(match));
    assert.deepEqual(step(resumed, [BIT.jump | BIT.punch, BIT.block]), []);
    assert.deepEqual(step(match, [BIT.jump | BIT.punch, BIT.block]), []);
    assert.deepEqual(resumed, match);
    legacyStep(legacy, [BIT.jump | BIT.punch, BIT.block]);
    assert.deepEqual(match.state, canonicalLegacy(legacy));
    assert.equal(match.state.tick, before.tick + 1);
    assert.deepEqual(match.state.players.map(p => p.previous), before.players.map(p => p.previous));
    const expectedNext = round === 1;
    assert.equal(sim.nextRound(match), expectedNext);
    assert.equal(sim.next(legacy), expectedNext);
    assert.deepEqual(match.state, canonicalLegacy(legacy));
    if (expectedNext) {
      assert.equal(match.state.round, 2);
      assert.equal(match.state.tick, before.tick + 1);
      assert.equal(match.matchId, 'rounds');
      assert.deepEqual(match.state.players.map(p => [p.hp, p.focus]), [[100, 0], [100, 0]]);
      for (let tick = 0; tick < 180; tick++) {
        step(match, [null, null]); legacyStep(legacy, [null, null]);
      }
      assert.deepEqual(match.state, canonicalLegacy(legacy));
    }
  }
  const first = create('match-a'), rematch = create('match-b');
  const a = advance(first, 180), b = advance(rematch, 180);
  assert.deepEqual(first.state, rematch.state);
  assert.notEqual(a[0].id, b[0].id);
  assert.deepEqual([rematch.state.round, rematch.state.tick, rematch.state.scores], [1, 180, [0, 0]]);
});

test('equal-health timeout is a draw without a score and round reset has no events', () => {
  const match = fight('timeout-draw');
  match.state.roundTicks = 1;
  assert.deepEqual(step(match), [{...eventHeader(match, 0, 'phase'), phase: 'round-over', winner: null}]);
  assert.deepEqual(match.state.scores, [0, 0]);
  assert.equal(sim.nextRound(match), true);
  assert.equal(match.state.phase, 'countdown');
  assert.deepEqual(step(match), []);
});

test('restoring held input after recovery does not fabricate a new attack edge', () => {
  const original = fight('held-restore');
  advance(original, 24, [BIT.punch, null]);
  assert.equal(original.state.players[0].attack, null);
  const restored = sim.restore(sim.snapshot(original));
  for (let tick = 0; tick < 60; tick++) {
    assert.deepEqual(step(restored, [BIT.punch, null]), step(original, [BIT.punch, null]));
    assert.deepEqual(restored, original);
    assert.equal(restored.state.players[0].attack, null);
    assert.equal(restored.state.players[1].hp, 90);
  }
  step(restored, [null, null]);
  step(restored, [BIT.punch, null]);
  assert.equal(restored.state.players[0].attack.age, 1, 'explicit neutral frame releases held edge');
});

test('startup and hit-stun checkpoints replay identical states and event identities', () => {
  for (const checkpointTick of [3, 6, 7, 9]) {
    const original = fight(`checkpoint-${checkpointTick}`);
    advance(original, checkpointTick, [BIT.punch, null]);
    const restored = sim.restore(sim.snapshot(original));
    for (let tick = 0; tick < 60; tick++) {
      const masks = tick < 20 ? [BIT.punch, null] : [tape(tick, 0), tape(tick, 1)];
      assert.deepEqual(step(restored, masks), step(original, masks));
      assert.deepEqual(restored, original);
    }
  }
});

test('event records are detached from core state and deterministic replay', () => {
  const match = fight('events-detached');
  advance(match, 6, [BIT.punch, null]);
  const replay = sim.restore(sim.snapshot(match));
  const events = step(match, [BIT.punch, null]);
  const expected = step(replay, [BIT.punch, null]);
  assert.deepEqual(events, expected);
  const stateAfter = copy(match);
  events[0].damage = 999;
  events[0].id = 'consumer-edited';
  assert.deepEqual(match, stateAfter);
  assert.equal(expected[0].damage, 10);
  assert.notEqual(expected[0].id, 'consumer-edited');
});

test('disconnected checkpoints stay frozen while legacy raw step retains its tick exception', () => {
  for (const reason of ['leave', 'timeout']) for (const completed of [false, true]) {
    const match = fight(`disconnect-${reason}-${completed}`);
    if (completed) {
      match.state.round = 2;
      match.state.scores = [2, 0];
      match.state.players[1].hp = 0;
    }
    match.state.phase = 'disconnected';
    match.state.winner = completed ? 0 : reason === 'leave' ? 1 : null;
    match.state.outcome = {reason, winner: match.state.winner, ...(completed ? {matchComplete: true} : {})};
    const restored = sim.restore(sim.snapshot(match));
    const before = copy(restored);
    const legacy = copy(restored.state);
    assert.deepEqual(step(restored, [BIT.dash, BIT.punch]), []);
    assert.deepEqual(restored, before);
    assert.equal(sim.nextRound(restored), false);
    assert.deepEqual(restored, before);
    assert.equal(sim.step(legacy), legacy);
    assert.deepEqual(legacy, {...before.state, tick: before.state.tick + 1});
  }
});
