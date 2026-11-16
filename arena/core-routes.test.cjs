'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { once } = require('node:events');
const fs = require('node:fs');
const path = require('node:path');
const { start } = require('./server.cjs');

test('portable core routes serve exact self-hosted module bytes without exposing server source', async t => {
  const server = start({ port: 0 });
  await once(server, 'listening');
  t.after(() => new Promise(resolve => server.close(resolve)));
  const origin = `http://127.0.0.1:${server.address().port}`;
  for (const file of ['input-contract.js', 'simulation.cjs']) {
    const response = await fetch(`${origin}/${file}`);
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('content-type'), 'text/javascript');
    assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
    assert.equal(response.headers.get('cache-control'), 'no-store');
    assert.match(response.headers.get('content-security-policy'), /default-src 'self'/);
    assert.equal(await response.text(), fs.readFileSync(path.join(__dirname, file), 'utf8'));
    const hostile = await fetch(`${origin}/${file}`, { headers: { Origin: 'https://attacker.invalid' } });
    assert.equal(hostile.status, 403);
  }
  for (const route of ['/server.cjs', '/test.cjs', '/package.json', '/..%2Fserver.cjs', '/constructor', '/__proto__']) {
    assert.equal((await fetch(origin + route)).status, 404, route);
  }
  assert.equal((await fetch(`${origin}/simulation.cjs`, { method: 'POST' })).status, 404);
});
