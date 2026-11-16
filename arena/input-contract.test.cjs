'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const contract = require('./input-contract.js');
const { normalizeFramePair, KEYS, BUTTONS, ALL_BUTTONS_MASK } = contract;

const keys = ['left', 'right', 'jump', 'punch', 'kick', 'block', 'dash'];
const frame = (buttons = 0, tick = 1, round = 1) => ({ tick, round, buttons });
const neutral = () => Object.fromEntries(keys.map(key => [key, false]));
const normalize = pair => normalizeFramePair(pair, 0, 1);
function rejects(operation, code = 'ERR_ARENA_SCHEMA') {
  assert.throws(operation, error => {
    assert.equal(error.code, code);
    assert.ok(error instanceof (code === 'ERR_ARENA_SCHEMA' ? TypeError : RangeError));
    return true;
  });
}

test('published tables, bit assignments and module exports are exact and frozen', () => {
  assert.deepEqual(Object.keys(contract), ['KEYS', 'BUTTONS', 'ALL_BUTTONS_MASK', 'normalizeFramePair']);
  assert.deepEqual(KEYS, keys);
  assert.deepEqual(BUTTONS, { left: 1, right: 2, jump: 4, punch: 8, kick: 16, block: 32, dash: 64 });
  assert.equal(ALL_BUTTONS_MASK, 127);
  for (const value of [KEYS, BUTTONS, contract]) assert.equal(Object.isFrozen(value), true);
  assert.throws(() => KEYS.push('special'), TypeError);
  assert.throws(() => { BUTTONS.left = 64; }, TypeError);
  assert.throws(() => { contract.normalizeFramePair = () => []; }, TypeError);
  assert.throws(() => { contract.special = 128; }, TypeError);
});

test('all 128 admitted masks decode independently into seven exact booleans', () => {
  for (let mask = 0; mask <= 127; mask++) {
    const result = normalize([frame(mask), frame(127 ^ mask)]);
    assert.equal(result.length, 2);
    for (let slot = 0; slot < 2; slot++) {
      assert.deepEqual(Object.keys(result[slot]), keys);
      for (let bit = 0; bit < 7; bit++) {
        assert.equal(result[slot][keys[bit]], Boolean((slot ? 127 ^ mask : mask) & (2 ** bit)));
        assert.equal(typeof result[slot][keys[bit]], 'boolean');
      }
    }
  }
});

test('null seats normalize to fresh mutable neutral maps without aliasing', () => {
  const pair = Object.freeze([null, null]);
  const first = normalize(pair), second = normalize(pair);
  assert.deepEqual(first, [neutral(), neutral()]);
  assert.notEqual(first, second);
  assert.notEqual(first[0], first[1]);
  assert.notEqual(first[0], second[0]);
  first[0].left = true;
  assert.equal(first[1].left, false);
  assert.equal(second[0].left, false);
  assert.deepEqual(pair, [null, null]);
});

test('frozen plain and null-prototype frame records are accepted and left unchanged', () => {
  const a = Object.freeze(frame(9));
  const b = Object.freeze(Object.assign(Object.create(null), frame(64)));
  const pair = Object.freeze([a, b]);
  const before = Object.getOwnPropertyDescriptors(b);
  const normalized = normalize(pair);
  assert.equal(normalized[0].left, true);
  assert.equal(normalized[0].punch, true);
  assert.equal(normalized[1].dash, true);
  assert.deepEqual(Object.getOwnPropertyDescriptors(b), before);
  assert.deepEqual(a, frame(9));
});

test('current counters are validated and the next tick is computed internally', () => {
  assert.equal(normalizeFramePair([frame(1, 43, 4), null], 42, 4)[0].left, true);
  const invalidTicks = [-1, 0.5, '0', null, undefined, NaN, Infinity, -Infinity, 1n, new Number(0), Number.MAX_SAFE_INTEGER + 1];
  const invalidRounds = [0, -1, 0.5, '1', null, undefined, NaN, Infinity, 1n, new Number(1), Number.MAX_SAFE_INTEGER + 1];
  for (const value of invalidTicks) rejects(() => normalizeFramePair([null, null], value, 1));
  for (const value of invalidRounds) rejects(() => normalizeFramePair([null, null], 0, value));
  assert.deepEqual(normalizeFramePair([null, null], -0, 1), [neutral(), neutral()]);
});

test('safe increment boundary is checked even when both frames are null', () => {
  const maximum = Number.MAX_SAFE_INTEGER;
  assert.equal(normalizeFramePair([frame(64, maximum, maximum), null], maximum - 1, maximum)[0].dash, true);
  rejects(() => normalizeFramePair([null, null], maximum, 1), 'ERR_ARENA_COUNTER');
  rejects(() => normalizeFramePair([frame(0, maximum), frame(0, maximum)], maximum, 1), 'ERR_ARENA_COUNTER');
});

test('otherwise valid tick and round mismatches have a distinct fixed frame error', () => {
  for (const invalid of [frame(0, 0), frame(0, 2), frame(0, -1), frame(0, 1, 0), frame(0, 1, -1), frame(0, 1, 2)]) {
    rejects(() => normalize([invalid, null]), 'ERR_ARENA_FRAME');
    rejects(() => normalize([null, invalid]), 'ERR_ARENA_FRAME');
  }
});

test('a pair must be an ordinary dense array of exactly two explicit members', () => {
  const sparse0 = new Array(2); sparse0[1] = null;
  const sparse1 = new Array(2); sparse1[0] = null;
  const extra = [null, null]; extra.metadata = 1;
  const symbol = [null, null]; symbol[Symbol('private')] = 1;
  const subclass = new (class Pair extends Array {})(null, null);
  const customPrototype = Object.setPrototypeOf([null, null], {});
  const nullPrototype = Object.setPrototypeOf([null, null], null);
  const hiddenIndex = [null, null]; Object.defineProperty(hiddenIndex, '0', { enumerable: false });
  const huge = []; huge.length = 0xffffffff;
  for (const value of [undefined, null, {}, { 0: null, 1: null, length: 2 }, new Set([null]), [], [null], [null, null, null], huge,
    sparse0, sparse1, extra, symbol, subclass, customPrototype, nullPrototype, hiddenIndex, [undefined, null], [null, undefined]]) {
    rejects(() => normalize(value));
  }
});

test('array member accessors and wrong-length arrays never execute getters', () => {
  let called = 0;
  for (const length of [1, 2, 3]) {
    const pair = new Array(length);
    if (length >= 2) pair[1] = null;
    Object.defineProperty(pair, '0', { enumerable: true, get() { called++; return frame(); } });
    rejects(() => normalize(pair));
  }
  const setter = [null, null];
  Object.defineProperty(setter, '1', { enumerable: true, set(value) { called++; } });
  rejects(() => normalize(setter));
  assert.equal(called, 0);
});

test('frames reject non-records, inherited fields and custom prototypes', () => {
  const inherited = Object.create(frame());
  const custom = Object.assign(Object.create({}), frame());
  class Frame { constructor() { Object.assign(this, frame()); } }
  for (const value of [undefined, false, true, 0, 'frame', 1n, Symbol('frame'), [], new Date(), new Number(1), () => frame(), inherited, custom, new Frame()]) {
    rejects(() => normalize([value, null]));
  }
});

test('frame fields must be exact enumerable data with no symbols or future fields', () => {
  for (const key of ['tick', 'round', 'buttons']) {
    const missing = frame(); delete missing[key];
    const hidden = frame(); Object.defineProperty(hidden, key, { enumerable: false });
    rejects(() => normalize([missing, null]));
    rejects(() => normalize([hidden, null]));
  }
  for (const key of ['slot', 'seq', 'edges', 'position', 'damage', 'duration', 'special', 'constructor', '__proto__', Symbol('payload')]) {
    const extra = frame();
    Object.defineProperty(extra, key, { value: 'PRIVATE_PAYLOAD', enumerable: true });
    rejects(() => normalize([extra, null]));
  }
});

test('getter and setter schema fields are rejected without executing user code', () => {
  let called = 0;
  for (const key of ['tick', 'round', 'buttons']) {
    for (const kind of ['get', 'set']) {
      const bad = frame();
      Object.defineProperty(bad, key, { enumerable: true, [kind]() { called++; return 1; } });
      rejects(() => normalize([bad, null]));
      rejects(() => normalize([frame(127), bad]));
    }
  }
  const extra = frame();
  Object.defineProperty(extra, 'special', { enumerable: true, get() { called++; throw Error('must not run'); } });
  rejects(() => normalize([extra, null]));
  assert.equal(called, 0);
});

test('numeric fields never coerce strings, boxed values or non-finite numbers', () => {
  const invalid = [undefined, null, true, false, '1', 0.1, NaN, Infinity, -Infinity, 1n, Symbol('numeric'), new Number(1),
    Number.MAX_SAFE_INTEGER + 1, { valueOf() { throw Error('must not coerce'); } }];
  for (const key of ['tick', 'round', 'buttons']) {
    for (const value of invalid) {
      const bad = frame(); bad[key] = value;
      rejects(() => normalize([bad, null]));
    }
  }
  for (const buttons of [-1, 128, 255, Number.MAX_SAFE_INTEGER]) rejects(() => normalize([frame(buttons), null]));
});

test('invalid seat one leaves both caller frames and their property descriptors unchanged', () => {
  const first = frame(127);
  const second = frame(128);
  const pair = [first, second];
  const before = pair.map(value => Object.getOwnPropertyDescriptors(value));
  rejects(() => normalize(pair));
  assert.deepEqual(pair.map(value => Object.getOwnPropertyDescriptors(value)), before);
  assert.equal(pair[0], first);
  assert.equal(pair[1], second);
});

test('errors have fixed messages and codes without reflecting attacker-controlled payloads', () => {
  function capture(operation) { try { operation(); } catch (error) { return error; } assert.fail('expected rejection'); }
  const schemaA = capture(() => normalize([frame('PRIVATE_PAYLOAD_A'), null]));
  const schemaB = capture(() => normalize([{ ...frame(), PRIVATE_PAYLOAD_B: 1 }, null]));
  const frameA = capture(() => normalize([frame(0, 2), null]));
  const frameB = capture(() => normalize([null, frame(0, 1, 2)]));
  assert.equal(schemaA.message, schemaB.message);
  assert.equal(frameA.message, frameB.message);
  for (const error of [schemaA, schemaB, frameA, frameB]) assert.doesNotMatch(error.message, /PRIVATE_PAYLOAD/);
});

test('the same UMD source exports a frozen browser global with identical normalization', () => {
  const context = vm.createContext({});
  vm.runInContext(fs.readFileSync(path.join(__dirname, 'input-contract.js'), 'utf8'), context);
  const browser = vm.runInContext(`(() => {
    const c = globalThis.ArenaInputContract;
    return JSON.stringify({
      keys: c.KEYS, buttons: c.BUTTONS, mask: c.ALL_BUTTONS_MASK,
      frozen: [c, c.KEYS, c.BUTTONS].every(Object.isFrozen),
      masks: Array.from({length:128}, (_, buttons) =>
        c.normalizeFramePair([{tick:2,round:3,buttons},null],1,3)),
      overflow: (() => { try { c.normalizeFramePair([null,null],Number.MAX_SAFE_INTEGER,1); }
        catch (error) { return {name:error.name,code:error.code,message:error.message}; } })()
    });
  })()`, context);
  const result = JSON.parse(browser);
  assert.deepEqual(result.keys, KEYS);
  assert.deepEqual(result.buttons, BUTTONS);
  assert.equal(result.mask, ALL_BUTTONS_MASK);
  assert.equal(result.frozen, true);
  assert.deepEqual(result.masks, Array.from({ length: 128 }, (_, buttons) => normalizeFramePair([frame(buttons, 2, 3), null], 1, 3)));
  assert.equal(result.overflow.name, 'RangeError');
  assert.equal(result.overflow.code, 'ERR_ARENA_COUNTER');
  assert.equal(typeof context.require, 'undefined');
});

test('inherited descriptor-container fields cannot satisfy missing schema fields or run getters', () => {
  const context = vm.createContext({});
  vm.runInContext(fs.readFileSync(path.join(__dirname, 'input-contract.js'), 'utf8'), context);
  const result = vm.runInContext(`(() => {
    let calls = 0, code;
    Object.defineProperty(Object.prototype, 'tick', {
      configurable: true, get() { calls++; return {value:1,enumerable:true}; }
    });
    try {
      ArenaInputContract.normalizeFramePair([{round:1,buttons:0,extra:1},null],0,1);
    } catch (error) { code = error.code; }
    finally { delete Object.prototype.tick; }
    return JSON.stringify({calls,code});
  })()`, context);
  assert.deepEqual(JSON.parse(result), { calls: 0, code: 'ERR_ARENA_SCHEMA' });
});
