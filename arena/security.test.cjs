'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const { start } = require('./server.cjs');

// Security acceptance uses only fresh ephemeral loopback listeners and no live service.
async function withServer(options, run) {
  const server = start({ port: 0, ...options });
  await new Promise(resolve => server.once('listening', resolve));
  const port = server.address().port;
  const call = (data, { headers = {}, path = '/api', method = 'POST', raw } = {}) =>
    new Promise((resolve, reject) => {
      const req = http.request({ hostname: '127.0.0.1', port, path, method,
        headers: { 'Content-Type': 'application/json', ...headers } }, res => {
        let body = '';
        res.on('data', chunk => { body += chunk; });
        res.on('end', () => {
          try { body = JSON.parse(body); } catch { /* Static responses stay text. */ }
          resolve({ status: res.statusCode, body });
        });
      });
      req.on('error', reject);
      req.end(raw === undefined ? (data === undefined ? undefined : JSON.stringify(data)) : raw);
    });
  try { await run(call, port); }
  finally { await new Promise(resolve => server.close(resolve)); }
}
const create = call => call({ action: 'create', character: 'mike' });

test('untrusted matching Host and Origin cannot create a room or read the app', async () => {
  await withServer({}, async (call, port) => {
    const authority = `attacker.invalid:${port}`;
    const headers = { Host: authority, Origin: `http://${authority}` };
    assert.equal((await call({ action: 'create', character: 'mike' }, { headers })).status, 403);
    assert.equal((await call(undefined, { method: 'GET', path: '/', headers })).status, 403);
    assert.equal((await call(undefined, { method: 'GET', path: '/client.js', headers })).status, 403);
  });
});

test('pinned local authority works while foreign origins and forged tokens fail', async () => {
  await withServer({}, async (call, port) => {
    const authority = `127.0.0.1:${port}`;
    assert.equal((await call({ action: 'create', character: 'mike' }, {
      headers: { Host: authority, Origin: `http://${authority}` }
    })).status, 200);
    assert.equal((await call({ action: 'create', character: 'mike' }, {
      headers: { Host: authority, Origin: 'http://attacker.invalid' }
    })).status, 403);
    assert.equal((await call({ action: 'poll', token: 'forged' })).status, 401);
  });
});

test('unknown authenticated actions are rejected explicitly', async () => {
  await withServer({}, async call => {
    const room = (await create(call)).body;
    assert.equal((await call({ action: 'not-an-action', token: room.token })).status, 400);
  });
});

test('room creation has a source budget and recovers after its window', async () => {
  let clock = 0;
  await withServer({ now: () => clock }, async call => {
    for (let i = 0; i < 8; i++) assert.equal((await create(call)).status, 200);
    assert.equal((await create(call)).status, 429);
    clock = 10001;
    assert.equal((await create(call)).status, 200);
  });
});

test('room-code guesses have a source budget and recover after its window', async () => {
  let clock = 0;
  await withServer({ now: () => clock }, async call => {
    const guess = () => call({ action: 'join', code: '00000000', character: 'k' });
    for (let i = 0; i < 30; i++) assert.equal((await guess()).status, 409);
    assert.equal((await guess()).status, 429);
    clock = 10001;
    assert.equal((await guess()).status, 409);
  });
});

test('authenticated polling has a bounded token budget', async () => {
  let clock = 0;
  await withServer({ now: () => clock }, async call => {
    const room = (await create(call)).body;
    for (let i = 0; i < 180; i++)
      assert.equal((await call({ action: 'poll', token: room.token })).status, 200);
    assert.equal((await call({ action: 'poll', token: room.token })).status, 429);
    clock = 1001;
    assert.equal((await call({ action: 'poll', token: room.token })).status, 200);
  });
});

test('leaving an unjoined room reclaims its global capacity immediately', async () => {
  await withServer({ rateLimits: { create: { capacity: 64, windowMs: 10000 } } }, async call => {
    for (let i = 0; i < 33; i++) {
      const room = await create(call);
      assert.equal(room.status, 200, `create after ${i} leave operations`);
      assert.equal((await call({ action: 'leave', token: room.body.token })).status, 200);
      assert.equal((await call({ action: 'poll', token: room.body.token })).status, 401);
    }
  });
});

test('request body, token authority, sequence replay, and state fields stay bounded', async () => {
  await withServer({}, async call => {
    assert.equal((await call(undefined, { raw: JSON.stringify({ padding: 'x'.repeat(4096) }) })).status, 413);
    const first = (await create(call)).body;
    const second = (await call({ action: 'join', code: first.code, character: 'k' })).body;
    const input = { action: 'input', token: first.token, seq: 1, slot: 1,
      keys: { punch: true }, hp: 999, x: 900 };
    assert.equal((await call({ ...input, keys: { punch: true, damage: 999 } })).status, 400);
    assert.equal((await call({ ...input, keys: { punch: 1 } })).status, 400);
    const response = await call(input);
    assert.equal(response.status, 200);
    assert.equal(response.body.slot, 0);
    assert.equal(response.body.state.players[0].hp, 100);
    assert.equal(response.body.state.players[1].hp, 100);
    assert.equal(response.body.state.players[0].x, 310);
    assert.equal(response.body.state.players[1].x, 650);
    assert.equal((await call(input)).status, 409);
    assert.equal((await call({ ...input, seq: Number.MAX_SAFE_INTEGER + 1 })).status, 409);
    const serialized = JSON.stringify((await call({ action: 'poll', token: second.token })).body);
    assert.equal(serialized.includes(first.token), false);
    assert.equal(serialized.includes(second.token), false);
  });
});


test('body limit counts UTF-8 bytes rather than JavaScript characters', async () => {
  await withServer({}, async call => {
    const raw = JSON.stringify({ action: 'poll', token: 'forged', padding: 'é'.repeat(1010) });
    assert.ok(raw.length < 2048);
    assert.ok(Buffer.byteLength(raw) > 2048);
    assert.equal((await call(undefined, { raw })).status, 413);
  });
});

test('unauthenticated request budget recovers after its window', async () => {
  let clock = 0;
  await withServer({ now: () => clock }, async call => {
    const forged = () => call({ action: 'poll', token: 'forged' });
    for (let i = 0; i < 300; i++) assert.equal((await forged()).status, 401);
    assert.equal((await forged()).status, 429);
    clock = 1001;
    assert.equal((await forged()).status, 401);
  });
});
