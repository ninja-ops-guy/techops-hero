'use strict';
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const sim = require('./simulation.cjs');
const ACTIONS = new Set(['create', 'join', 'poll', 'input', 'ready', 'leave']);
const EDGE_KEYS = ['jump', 'punch', 'kick', 'dash'];
const DEFAULT_LIMITS = {
  request: { capacity: 300, windowMs: 1000 },
  create: { capacity: 8, windowMs: 10000 },
  join: { capacity: 30, windowMs: 10000 },
  session: { capacity: 180, windowMs: 1000 }
};
function start({ port = 4260, host = '127.0.0.1', allowedOrigins,
  now = Date.now, terminalTtlMs = 10000, disconnectMs = 10000,
  roomIdleMs = 120000, inputStaleMs = 250, rateLimits = {} } = {}) {
  const loopback = ['127.0.0.1', 'localhost', '::1'].includes(host);
  if (!loopback && !allowedOrigins?.length) {
    throw new Error('Non-loopback Arena requires explicit allowedOrigins; public hosting is not qualified.');
  }
  const configuredOrigins = allowedOrigins?.map(value => {
    const url = new URL(value);
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password ||
        url.pathname !== '/' || url.search || url.hash) throw new Error('Invalid Arena origin');
    return url.origin;
  });
  const limits = Object.fromEntries(Object.entries(DEFAULT_LIMITS).map(([key, value]) =>
    [key, { ...value, ...rateLimits[key] }]));
  for (const limit of Object.values(limits)) {
    if (!Number.isSafeInteger(limit.capacity) || limit.capacity < 1 ||
        !Number.isSafeInteger(limit.windowMs) || limit.windowMs < 1) throw new Error('Invalid rate limit');
  }
  const rooms = new Map(), tokens = new Map(), sources = new Map();
  const json = (res, status, value) => {
    if (res.destroyed || res.writableEnded) return;
    res.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff' });
    res.end(JSON.stringify(value));
  };
  function admitted(buckets, kind, time) {
    const limit = limits[kind];
    let bucket = buckets[kind];
    if (!bucket || time - bucket.start >= limit.windowMs) bucket = buckets[kind] = { start: time, count: 0 };
    return ++bucket.count <= limit.capacity;
  }
  function sourceFor(address, time) {
    for (const [key, value] of sources) if (time - value.seen > 120000) sources.delete(key);
    let source = sources.get(address);
    if (!source) {
      if (sources.size >= 256) return null;
      source = { seen: time, buckets: {} };
      sources.set(address, source);
    }
    source.seen = time;
    return source;
  }
  function remove(code) {
    const room = rooms.get(code);
    if (room) for (const seat of room.seats) tokens.delete(seat.token);
    rooms.delete(code);
  }
  function end(room, reason, absent, time) {
    if (room.endedAt !== null || !room.state) return;
    room.endedAt = time;
    const matchComplete = room.state.phase === 'finished';
    const winner = matchComplete ? room.state.winner : (absent.length === 1 ? 1 - absent[0] : null);
    room.state.phase = 'disconnected';
    room.state.winner = winner;
    room.state.outcome = { reason, winner, ...(matchComplete ? { matchComplete: true } : {}) };
    for (let i = 0; i < room.seats.length; i++) sim.input(room.state, i, {});
    room.votes.clear();
  }
  // Enforce deadlines at every action as well as on the timer. A stalled timer
  // must not let a late heartbeat refresh an already-expired match.
  function expireRoom(code, room, time) {
    if (room.endedAt !== null) {
      if (time - room.endedAt >= terminalTtlMs) remove(code);
      return true;
    }
    if (time - room.updated > roomIdleMs) { remove(code); return true; }
    if (room.state) {
      // Evaluate both prior contacts before applying either player's heartbeat.
      const absent = room.seats.flatMap((seat, slot) => time - seat.seen > disconnectMs ? [slot] : []);
      if (absent.length) { end(room, 'timeout', absent, time); return true; }
    }
    return false;
  }
  function snapshot(room, auth) {
    return { slot: auth.slot, code: auth.code, waiting: !room.state,
      state: room.state ? { tick: room.state.tick, phase: room.state.phase,
        remaining: room.state.remaining, roundTicks: room.state.roundTicks,
        round: room.state.round, scores: room.state.scores, winner: room.state.winner,
        ...(room.state.outcome ? { outcome: room.state.outcome } : {}),
        players: room.state.players.map(({ previous, input, ...player }) => player) } : null,
      ready: room.votes.size };
  }
  const server = http.createServer(async (req, res) => {
    try {
      // Pin both fields to operator configuration. Comparing Origin to the supplied
      // Host alone trusts two attacker-controlled values (including DNS rebinding).
      const actualPort = server.address().port;
      const origins = configuredOrigins || ['127.0.0.1', 'localhost', '[::1]'].map(h => `http://${h}:${actualPort}`);
      const hosts = origins.map(origin => new URL(origin).host);
      if (!hosts.includes(req.headers.host) || (req.headers.origin && !origins.includes(req.headers.origin))) {
        return json(res, 403, { error: 'Origin or host rejected' });
      }
      const url = new URL(req.url, 'http://localhost');
      const assets = { '/': 'index.html', '/client.js': 'client.js',
        '/input-contract.js': 'input-contract.js', '/simulation.cjs': 'simulation.cjs' };
      if (req.method === 'GET' && Object.hasOwn(assets, url.pathname)) {
        res.writeHead(200, { 'Content-Type': url.pathname === '/' ? 'text/html' : 'text/javascript',
          'Content-Security-Policy': "default-src 'self'; style-src 'self' 'unsafe-inline'; connect-src 'self'",
          'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
        return res.end(fs.readFileSync(path.join(__dirname, assets[url.pathname])));
      }
      if (req.method !== 'POST' || url.pathname !== '/api') return json(res, 404, { error: 'Not found' });
      const receivedAt = now(), source = sourceFor(req.socket.remoteAddress, receivedAt);
      if (!source || !admitted(source.buckets, 'request', receivedAt)) return json(res, 429, { error: 'Request rate exceeded' });
      let size = 0;
      const chunks = [];
      for await (const chunk of req) {
        size += chunk.length;
        if (size > 2048) return json(res, 413, { error: 'Request too large' });
        chunks.push(chunk);
      }
      const data = JSON.parse(Buffer.concat(chunks).toString('utf8'));
      if (!data || Array.isArray(data) || typeof data !== 'object' || !ACTIONS.has(data.action)) {
        return json(res, 400, { error: 'Unknown or invalid action' });
      }
      // Body parsing is asynchronous; authority uses the current action time.
      const time = now();
      if (data.action === 'create' || data.action === 'join') {
        if (!sim.ROSTER.includes(data.character)) return json(res, 400, { error: 'Choose a fighter' });
        if (!admitted(source.buckets, data.action, time)) return json(res, 429, { error: 'Room admission rate exceeded' });
        let code = data.code, room = rooms.get(code);
        if (data.action === 'join' && room) { expireRoom(code, room, time); room = rooms.get(code); }
        if (data.action === 'create') {
          // At most 32 rooms: reclaim expired capacity even if the timer stalled.
          for (const [existingCode, existingRoom] of rooms) expireRoom(existingCode, existingRoom, time);
          if (rooms.size >= 32) return json(res, 503, { error: 'Room limit reached' });
          do { code = crypto.randomBytes(4).toString('hex').toUpperCase(); } while (rooms.has(code));
          room = { seats: [], state: null, updated: time, endedAt: null, votes: new Set() };
          rooms.set(code, room);
        }
        if (!room || room.seats.length >= 2 || room.state) return json(res, 409, { error: 'Room unavailable' });
        const token = crypto.randomBytes(24).toString('hex'), slot = room.seats.length;
        room.seats.push({ token, character: data.character, seen: time, seq: -1,
          lastInput: time, awaitingRelease: new Set(), buckets: {} });
        tokens.set(token, { code, slot });
        room.updated = time;
        if (room.seats.length === 2) room.state = sim.create(room.seats.map(seat => seat.character));
        return json(res, 200, { token, slot, code });
      }
      const auth = tokens.get(data.token), room = auth && rooms.get(auth.code);
      if (!room) return json(res, 401, { error: 'Session expired. Create or join another room.' });
      expireRoom(auth.code, room, time);
      if (!rooms.has(auth.code) || !tokens.has(data.token)) {
        return json(res, 401, { error: 'Session expired. Create or join another room.' });
      }
      const seat = room.seats[auth.slot];
      if (!admitted(seat.buckets, 'session', time)) return json(res, 429, { error: 'Session rate exceeded' });
      if (data.action === 'leave') {
        tokens.delete(seat.token);
        if (!room.state) remove(auth.code);
        else end(room, 'leave', [auth.slot], time);
        return json(res, 200, { ok: true });
      }
      if (data.action === 'input') {
        if (!room.state || !['countdown', 'fight'].includes(room.state.phase)) {
          return json(res, 409, { error: 'Match is not accepting input' });
        }
        if (!Number.isSafeInteger(data.seq) || data.seq <= seat.seq) return json(res, 409, { error: 'Stale input' });
        if (!data.keys || Array.isArray(data.keys) || typeof data.keys !== 'object' ||
            Object.keys(data.keys).some(key => !sim.KEYS.includes(key) || typeof data.keys[key] !== 'boolean')) {
          return json(res, 400, { error: 'Invalid input controls' });
        }
        const keys = { ...data.keys };
        for (const key of seat.awaitingRelease) {
          if (!keys[key]) seat.awaitingRelease.delete(key);
          else keys[key] = false;
        }
        seat.seq = data.seq;
        seat.lastInput = time;
        sim.input(room.state, auth.slot, keys);
      }
      if (data.action === 'ready') {
        if (!room.state || !['round-over', 'finished'].includes(room.state.phase)) {
          return json(res, 409, { error: 'Round is not ready' });
        }
        room.votes.add(auth.slot);
        if (room.votes.size === 2) {
          if (room.state.phase === 'finished') room.state = sim.create(room.state.characters);
          else sim.next(room.state);
          room.votes.clear();
        }
      }
      if (room.endedAt === null) { seat.seen = time; room.updated = time; }
      return json(res, 200, snapshot(room, auth));
    } catch (error) {
      json(res, 400, { error: 'Invalid request' });
    }
  });
  server.requestTimeout = 5000;
  server.headersTimeout = 5000;
  server.setTimeout(5000, socket => socket.destroy());
  const timer = setInterval(() => {
    const time = now();
    for (const [code, room] of rooms) {
      if (expireRoom(code, room, time)) continue;
      if (!room.state) continue;
      for (let slot = 0; slot < room.seats.length; slot++) {
        const seat = room.seats[slot];
        if (time - seat.lastInput > inputStaleMs) {
          for (const key of EDGE_KEYS) if (room.state.players[slot].input[key]) seat.awaitingRelease.add(key);
          sim.input(room.state, slot, {});
        }
      }
      sim.step(room.state);
    }
  }, 1000 / sim.HZ);
  server.on('close', () => clearInterval(timer));
  server.listen(port, host);
  return server;
}
if (require.main === module) {
  const host = process.env.ARENA_HOST || '127.0.0.1', port = Number(process.env.PORT) || 4260;
  const allowedOrigins = process.env.ARENA_ALLOWED_ORIGINS?.split(',').map(value => value.trim());
  start({ port, host, allowedOrigins });
  console.log(`Arena prototype: http://${host}:${port}`);
}
module.exports = { start };
