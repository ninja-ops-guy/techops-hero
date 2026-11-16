'use strict';

// API-level lifecycle regressions. The real server and simulation execute with a
// fake HTTP boundary and clock: no listener, sleeps, wall-clock races or network.
// Run: node --test arena/session.test.cjs
// Independent candidate: ARENA_SERVER_SOURCE=/absolute/path/server.cjs node --test arena/session.test.cjs
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { createRequire } = require('node:module');

function harness({ completedDrawFixture = false } = {}) {
  let clock = 100000;
  let handler;
  let nextTimer = 0;
  const timers = new Map();
  const listeners = new Map();
  const server = {
    on(event, callback) { listeners.set(event, callback); return this; },
    listen() { return this; },
    address() { return { port: 4260 }; },
    setTimeout() { return this; },
    close() { listeners.get('close')?.(); }
  };
  const filename = process.env.ARENA_SERVER_SOURCE
    ? path.resolve(process.env.ARENA_SERVER_SOURCE)
    : path.join(__dirname, 'server.cjs');
  const requireReal = createRequire(filename);
  const module = { exports: {} };
  class ClockDate extends Date { static now() { return clock; } }
  vm.runInNewContext(fs.readFileSync(filename, 'utf8'), {
    module, exports: module.exports, __dirname: path.dirname(filename), __filename: filename,
    require(name) {
      if (name === 'node:http') return { createServer(callback) { handler = callback; return server; } };
      const real = requireReal(name);
      if (name === './simulation.cjs' && completedDrawFixture) {
        // Current first-to-two play cannot finish in a draw. This isolated server
        // fixture covers preservation if a future match rule supplies one.
        return { ...real, create(...args) {
          const state = real.create(...args);
          return { ...state, phase: 'finished', scores: [2, 2], winner: null };
        } };
      }
      return real;
    },
    Date: ClockDate, URL, Buffer, console,
    setInterval(callback) { const id = ++nextTimer; timers.set(id, callback); return id; },
    clearInterval(id) { timers.delete(id); }
  }, { filename });
  module.exports.start({ port: 0, now: () => clock });
  return {
    close: () => server.close(),
    advance(ms) {
      clock += ms;
      for (const callback of timers.values()) callback();
    },
    async call(data) {
      let status;
      let body;
      const request = {
        method: 'POST', url: '/api', headers: { host: '127.0.0.1:4260' },
        socket: { remoteAddress: '127.0.0.1' },
        async *[Symbol.asyncIterator]() { yield Buffer.from(JSON.stringify(data)); }
      };
      const response = {
        writeHead(code) { status = code; },
        end(value) { body = JSON.parse(value); }
      };
      await handler(request, response);
      assert.notEqual(status, undefined, 'every request completes');
      return { status, body };
    }
  };
}

async function pair(h) {
  const a = await h.call({ action: 'create', character: 'mike' });
  assert.equal(a.status, 200);
  const b = await h.call({ action: 'join', code: a.body.code, character: 'k' });
  assert.equal(b.status, 200);
  return [a.body, b.body];
}

test('creator leaving a waiting room invalidates both room code and token', async t => {
  const h = harness(); t.after(h.close);
  const { body: a } = await h.call({ action: 'create', character: 'mike' });
  assert.equal((await h.call({ action: 'leave', token: a.token })).status, 200);
  assert.equal((await h.call({ action: 'poll', token: a.token })).status, 401);
  assert.equal((await h.call({ action: 'join', code: a.code, character: 'iona' })).status, 409,
    'a new player must not enter a room with an absent creator');
});

test('an abandoned waiting room expires after the idle limit', async t => {
  const h = harness(); t.after(h.close);
  const { body: a } = await h.call({ action: 'create', character: 'mike' });
  h.advance(120001);
  assert.equal((await h.call({ action: 'poll', token: a.token })).status, 401);
  assert.equal((await h.call({ action: 'join', code: a.code, character: 'iona' })).status, 409);
});

test('active departure records the surviving winner and freezes the terminal simulation', async t => {
  const h = harness(); t.after(h.close);
  const [a, b] = await pair(h);
  await h.call({ action: 'leave', token: a.token });
  const first = (await h.call({ action: 'poll', token: b.token })).body.state;
  assert.equal(first.phase, 'disconnected');
  assert.equal(first.winner, 1);
  assert.deepEqual(first.outcome, { reason: 'leave', winner: 1 });
  h.advance(1000);
  const later = (await h.call({ action: 'poll', token: b.token })).body.state;
  assert.deepEqual(later, first, 'terminal ticks, fighters and outcome must remain frozen');
  assert.equal((await h.call({ action: 'poll', token: a.token })).status, 401);
});

test('terminal-room retention is bounded despite continuing survivor polls', async t => {
  const h = harness(); t.after(h.close);
  const [a, b] = await pair(h);
  await h.call({ action: 'leave', token: a.token });
  for (let i = 0; i < 9; i++) {
    h.advance(1000);
    assert.equal((await h.call({ action: 'poll', token: b.token })).status, 200);
  }
  h.advance(1001);
  assert.equal((await h.call({ action: 'poll', token: b.token })).status, 401,
    'terminal TTL is ten seconds from departure, independent of room.updated');
  assert.equal((await h.call({ action: 'join', code: a.code, character: 'iona' })).status, 409);
});

test('a timed-out seat loses; polling and ready cannot resume its terminal room', async t => {
  const h = harness(); t.after(h.close);
  const [a, b] = await pair(h);
  h.advance(9999);
  await h.call({ action: 'poll', token: b.token });
  h.advance(2);
  const first = (await h.call({ action: 'poll', token: b.token })).body.state;
  assert.equal(first.phase, 'disconnected');
  assert.equal(first.winner, 1);
  assert.deepEqual(first.outcome, { reason: 'timeout', winner: 1 });
  const late = await h.call({ action: 'poll', token: a.token });
  assert.ok(late.status === 401 || late.body.state?.phase === 'disconnected');
  await h.call({ action: 'ready', token: a.token });
  await h.call({ action: 'ready', token: b.token });
  h.advance(1);
  assert.deepEqual((await h.call({ action: 'poll', token: b.token })).body.state, first);
});

test('both peers timing out records no winner', async t => {
  const h = harness(); t.after(h.close);
  const [a] = await pair(h);
  h.advance(10001);
  const snapshot = await h.call({ action: 'poll', token: a.token });
  assert.equal(snapshot.status, 200, 'terminal outcome remains readable during its retention window');
  assert.equal(snapshot.body.state.phase, 'disconnected');
  assert.equal(snapshot.body.state.winner, null);
  assert.deepEqual(snapshot.body.state.outcome, { reason: 'timeout', winner: null });
});

test('duplicate ready votes cannot advance a round without the other peer', async t => {
  const h = harness(); t.after(h.close);
  const [a, b] = await pair(h);
  // Reach the actual clock-driven draw through production simulation steps.
  for (let i = 0; i < 5600; i++) {
    h.advance(1000 / 60);
    if (i % 100 === 0) {
      await h.call({ action: 'poll', token: a.token });
      await h.call({ action: 'poll', token: b.token });
    }
  }
  const before = (await h.call({ action: 'poll', token: a.token })).body.state;
  assert.equal(before.phase, 'round-over');
  await h.call({ action: 'ready', token: a.token });
  const one = await h.call({ action: 'ready', token: a.token });
  assert.equal(one.body.ready, 1);
  assert.equal(one.body.state.round, 1);
  const both = await h.call({ action: 'ready', token: b.token });
  assert.equal(both.body.ready, 0);
  assert.equal(both.body.state.phase, 'countdown');
  assert.equal(both.body.state.round, 2);
  assert.deepEqual(both.body.state.players.map(p => p.hp), [100, 100]);
});

test('terminal simulation ticks and fighters do not advance after a leave', async t => {
  const h = harness(); t.after(h.close);
  const [a, b] = await pair(h);
  await h.call({ action: 'leave', token: a.token });
  const first = (await h.call({ action: 'poll', token: b.token })).body.state;
  h.advance(1000);
  const later = (await h.call({ action: 'poll', token: b.token })).body.state;
  assert.equal(later.tick, first.tick);
  assert.deepEqual(later.players, first.players);
});

test('stale input rejects reordering and absent fresh input releases movement', async t => {
  const h = harness(); t.after(h.close);
  const [a, b] = await pair(h);
  for (let i = 0; i < 200; i++) h.advance(1000 / 60);
  const accepted = await h.call({ action: 'input', token: a.token, seq: 2, keys: { right: true } });
  assert.equal(accepted.status, 200);
  assert.equal((await h.call({ action: 'input', token: a.token, seq: 1, keys: { left: true } })).status, 409);
  for (let i = 0; i < 10; i++) h.advance(1000 / 60);
  const moving = (await h.call({ action: 'poll', token: b.token })).body.state.players[0];
  assert.ok(moving.x > accepted.body.state.players[0].x, 'reordered input must not reverse movement');
  for (let i = 0; i < 30; i++) h.advance(1000 / 60);
  const stopped = (await h.call({ action: 'poll', token: b.token })).body.state.players[0];
  for (let i = 0; i < 10; i++) h.advance(1000 / 60);
  assert.equal((await h.call({ action: 'poll', token: b.token })).body.state.players[0].x, stopped.x,
    'polling keeps contact alive but must not keep movement held');
});

test('an ended match preserves its completed result when its winner leaves', async t => {
  const h = harness(); t.after(h.close);
  const [a, b] = await pair(h);
  let seq = 0;
  const input = keys => h.call({ action: 'input', token: a.token, seq: seq++, keys });
  const steps = n => { for (let i = 0; i < n; i++) h.advance(1000 / 60); };
  for (let round = 0; round < 2; round++) {
    steps(200);
    for (let hit = 0; hit < 10; hit++) {
      // Follow real knockback rather than modifying simulation positions/health.
      let positions = (await h.call({ action: 'poll', token: b.token })).body.state.players;
      while (positions[1].x - positions[0].x > 40) {
        await input({ right: true }); steps(10);
        positions = (await h.call({ action: 'poll', token: b.token })).body.state.players;
      }
      assert.equal((await input({ punch: true })).status, 200);
      steps(7);
      if (hit < 9) { await input({}); steps(23); }
    }
    const result = (await h.call({ action: 'poll', token: b.token })).body.state;
    assert.equal(result.winner, 0);
    if (round === 0) {
      assert.equal(result.phase, 'round-over');
      await h.call({ action: 'ready', token: a.token });
      await h.call({ action: 'ready', token: b.token });
    }
  }
  const completed = (await h.call({ action: 'poll', token: b.token })).body.state;
  assert.equal(completed.phase, 'finished');
  assert.deepEqual(completed.scores, [2, 0]);
  await h.call({ action: 'leave', token: a.token });
  const terminal = (await h.call({ action: 'poll', token: b.token })).body.state;
  assert.equal(terminal.phase, 'disconnected');
  assert.equal(terminal.winner, 0, 'post-match departure cannot award the losing peer a victory');
  assert.deepEqual(terminal.scores, completed.scores);
  assert.deepEqual(terminal.outcome, { reason: 'leave', winner: 0, matchComplete: true });
  await h.call({ action: 'ready', token: b.token });
  assert.deepEqual((await h.call({ action: 'poll', token: b.token })).body.state, terminal);
});

test('a synthetic completed draw is preserved on departure without assigning a winner', async t => {
  const h = harness({ completedDrawFixture: true }); t.after(h.close);
  const [a, b] = await pair(h);
  await h.call({ action: 'leave', token: a.token });
  const terminal = (await h.call({ action: 'poll', token: b.token })).body.state;
  assert.equal(terminal.phase, 'disconnected');
  assert.equal(terminal.winner, null);
  assert.deepEqual(terminal.scores, [2, 2]);
  assert.deepEqual(terminal.outcome, { reason: 'leave', winner: null, matchComplete: true });
});

test('stale held press edges require release before the same action can fire again', async t => {
  const h = harness(); t.after(h.close);
  const [a, b] = await pair(h);
  const steps = n => { for (let i = 0; i < n; i++) h.advance(1000 / 60); };
  steps(200);
  await h.call({ action: 'input', token: a.token, seq: 0, keys: { punch: true } });
  steps(31);
  assert.equal((await h.call({ action: 'poll', token: b.token })).body.state.players[0].attack, null);
  await h.call({ action: 'input', token: a.token, seq: 1, keys: { punch: true } });
  steps(1);
  assert.equal((await h.call({ action: 'poll', token: b.token })).body.state.players[0].attack, null,
    'input expiry must not manufacture a second rising edge for a still-held button');
  await h.call({ action: 'input', token: a.token, seq: 2, keys: { punch: false } });
  steps(1);
  await h.call({ action: 'input', token: a.token, seq: 3, keys: { punch: true } });
  steps(1);
  assert.ok((await h.call({ action: 'poll', token: b.token })).body.state.players[0].attack,
    'a fresh press after an observed release remains usable');
});
