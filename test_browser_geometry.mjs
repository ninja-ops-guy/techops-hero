import assert from 'node:assert/strict';
import { assertTouchTarget } from './scripts/responsive_control_contract.mjs';

const observed = 43.999969482421875;
assert.doesNotThrow(() => assertTouchTarget({ width: 44, height: 44 }));
assert.doesNotThrow(() => assertTouchTarget({ width: 389, height: observed }, 'CI music choice'));
assert.doesNotThrow(() => assertTouchTarget({ width: observed, height: 44 }, 'transformed width'));
for (const axis of ['width', 'height']) {
  for (const value of [43.99, 38, 0, -1, NaN, Infinity, -Infinity, undefined, null, '44']) {
    assert.throws(() => assertTouchTarget({ width: 44, height: 44, [axis]: value }), `${axis}=${String(value)} must fail`);
  }
}
for (const box of [undefined, null, {}, [44, 44]]) assert.throws(() => assertTouchTarget(box));
console.log('Browser geometry accepts measured 44px roundoff, rejects undersized or invalid targets: PASS');
