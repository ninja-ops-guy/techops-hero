'use strict';

// Socket-free deadline regressions. The production handler and real simulation
// run with an injected clock; time passage and timer dispatch are independent.
// Candidate check: ARENA_SERVER_SOURCE=/absolute/path/server.cjs node --test arena/deadline.test.cjs
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { createRequire } = require('node:module');

function harness(options = {}) {
  let clock = 100000, handler, nextTimer = 0;
  const timers = new Map(), listeners = new Map();
  const server = {
    on(event, callback) { listeners.set(event, callback); return this; },
    listen() { return this; },
    address() { return { port: 4260 }; },
    setTimeout() { return this; },
    close() { listeners.get('close')?.(); }
  };
  const filename = process.env.ARENA_SERVER_SOURCE
    ? path.resolve(process.env.ARENA_SERVER_SOURCE) : path.join(__dirname, 'server.cjs');
  const requireReal = createRequire(filename), module = { exports: {} };
  vm.runInNewContext(fs.readFileSync(filename, 'utf8'), {
    module, exports: module.exports, __dirname: path.dirname(filename), __filename: filename,
    require(name) {
      if (name === 'node:http') return { createServer(callback) { handler = callback; return server; } };
      return requireReal(name);
    },
    URL, Buffer, console,
    setInterval(callback) { const id = ++nextTimer; timers.set(id, callback); return id; },
    clearInterval(id) { timers.delete(id); }
  }, { filename });
  module.exports.start({ port: 0, now: () => clock, ...options });
  return {
    close: () => server.close(),
    elapse(ms) { assert.ok(ms >= 0); clock += ms; },
    timer() { for (const callback of timers.values()) callback(); },
    async call(data, { bodyDelayMs = 0 } = {}) {
      let status, body;
      const request = {
        method: 'POST', url: '/api', headers: { host: '127.0.0.1:4260' },
        socket: { remoteAddress: '127.0.0.1' },
        async *[Symbol.asyncIterator]() {
          yield Buffer.from(JSON.stringify(data));
          // The handler has already started. Time changes before body completion.
          clock += bodyDelayMs;
        }
      };
      await handler(request, {
        writeHead(code) { status = code; },
        end(value) { body = JSON.parse(value); }
      });
      assert.notEqual(status, undefined, 'the HTTP handler completes every request');
      return { status, body };
    }
  };
}
async function pair(h) {
  const first = await h.call({ action: 'create', character: 'mike' });
  assert.equal(first.status, 200);
  const second = await h.call({ action: 'join', code: first.body.code, character: 'k' });
  assert.equal(second.status, 200);
  return [first.body, second.body];
}
const poll = (h, seat, options) => h.call({ action: 'poll', token: seat.token }, options);
function timeout(response, winner) {
  assert.equal(response.status, 200, 'new terminal outcome remains readable during retention');
  assert.equal(response.body.state.phase, 'disconnected');
  assert.equal(response.body.state.winner, winner);
  assert.deepEqual(response.body.state.outcome, { reason: 'timeout', winner });
}

test('both late polls cannot refresh expired seats before a stalled timer', async t => {
  for (const order of [[0, 1], [1, 0]]) {
    const h = harness(); t.after(h.close);
    const seats = await pair(h);
    h.elapse(10001);
    const first = await poll(h, seats[order[0]]);
    timeout(first, null);
    const second = await poll(h, seats[order[1]]);
    timeout(second, null);
    h.timer();
    assert.deepEqual((await poll(h, seats[0])).body.state, first.body.state,
      'delayed timer dispatch cannot advance the frozen match or change the winner');
  }
});

test('an actually fresh peer wins independently of which late request arrives first', async t => {
  for (const firstRequester of [0, 1]) {
    const h = harness(); t.after(h.close);
    const seats = await pair(h);
    h.elapse(9000);
    assert.equal((await poll(h, seats[1])).body.state.phase, 'countdown');
    h.elapse(1001);
    timeout(await poll(h, seats[firstRequester]), 1);
    timeout(await poll(h, seats[1 - firstRequester]), 1);
  }
});

test('active contact preserves the existing strict 10000 ms absence boundary', async t => {
  for (const elapsed of [9999, 10000, 10001]) {
    const h = harness(); t.after(h.close);
    const [first] = await pair(h);
    h.elapse(elapsed);
    const response = await poll(h, first);
    if (elapsed <= 10000) {
      assert.equal(response.status, 200);
      assert.equal(response.body.state.phase, 'countdown');
    } else timeout(response, null);
  }
});

test('admission uses time after the awaited body completes, not handler entry', async t => {
  const h = harness(); t.after(h.close);
  const [first, second] = await pair(h);
  h.elapse(9999);
  const response = await poll(h, first, { bodyDelayMs: 2 });
  timeout(response, null);
  h.timer();
  assert.deepEqual((await poll(h, second)).body.state, response.body.state);
});

test('late leave cannot replace the timeout outcome that already won the race', async t => {
  const h = harness(); t.after(h.close);
  const [first, second] = await pair(h);
  h.elapse(9000);
  await poll(h, second);
  h.elapse(999);
  await h.call({ action: 'leave', token: first.token }, { bodyDelayMs: 2 });
  const result = await poll(h, second);
  timeout(result, 1);
  h.timer();
  assert.deepEqual((await poll(h, second)).body.state, result.body.state);
});

test('terminal retention expires on requests despite a stalled timer and survivor polls', async t => {
  const h = harness(); t.after(h.close);
  const [first, second] = await pair(h);
  assert.equal((await h.call({ action: 'leave', token: first.token })).status, 200);
  h.elapse(9999);
  const retained = await poll(h, second);
  assert.equal(retained.status, 200);
  assert.deepEqual(retained.body.state.outcome, { reason: 'leave', winner: 1 });
  h.elapse(1);
  assert.equal((await poll(h, second)).status, 401,
    'polls must not refresh the fixed terminal deadline');
  assert.equal((await h.call({ action: 'join', code: first.code, character: 'iona' })).status, 409);
});

test('an expired waiting room cannot admit a second fighter before timer cleanup', async t => {
  for (const bodyDelayMs of [0, 2]) {
    const h = harness(); t.after(h.close);
    const created = await h.call({ action: 'create', character: 'mike' });
    h.elapse(bodyDelayMs ? 119999 : 120001);
    const joined = await h.call({ action: 'join', code: created.body.code, character: 'k' }, { bodyDelayMs });
    assert.equal(joined.status, 409);
    assert.equal((await poll(h, created.body)).status, 401);
  }
});

test('waiting heartbeat preserves equality but cannot revive after the idle boundary', async t => {
  for (const elapsed of [120000, 120001]) {
    const h = harness(); t.after(h.close);
    const created = await h.call({ action: 'create', character: 'mike' });
    h.elapse(elapsed);
    const response = await poll(h, created.body);
    if (elapsed === 120000) {
      assert.equal(response.status, 200, 'existing idle policy admits contact at exact equality');
      assert.equal(response.body.waiting, true);
    } else {
      assert.equal(response.status, 401);
      assert.equal((await h.call({ action: 'join', code: created.body.code, character: 'k' })).status, 409);
    }
  }
});

test('expired input and ready reject before they can revive a room without timer dispatch', async t => {
  for (const action of ['input', 'ready']) {
    const h = harness(); t.after(h.close);
    const [first, second] = await pair(h);
    h.elapse(10001);
    const request = action === 'input'
      ? { action, token: first.token, seq: 0, keys: { right: true } }
      : { action, token: first.token };
    assert.equal((await h.call(request)).status, 409);
    const terminal = await poll(h, second);
    timeout(terminal, null);
    h.timer();
    assert.deepEqual((await poll(h, second)).body.state, terminal.body.state);
  }
});

test('room admission reclaims expired capacity even when all timer callbacks stalled', async t => {
  const h = harness({ rateLimits: { create: { capacity: 64, windowMs: 10000 } } });
  t.after(h.close);
  const rooms = [];
  for (let i = 0; i < 32; i++) {
    const created = await h.call({ action: 'create', character: 'mike' });
    assert.equal(created.status, 200); rooms.push(created.body);
  }
  h.elapse(120001);
  const fresh = await h.call({ action: 'create', character: 'felicia' });
  assert.equal(fresh.status, 200, 'admitted create must not see expired rooms as live capacity');
  assert.equal((await poll(h, fresh.body)).body.waiting, true);
  assert.equal((await poll(h, rooms[0])).status, 401);
});
