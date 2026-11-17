(function (root, factory) {
  'use strict';
  const contract = factory();
  if (typeof module === 'object' && module !== null && module.exports) {
    module.exports = contract;
  } else {
    root.ArenaAdvancedInput = contract;
  }
})(typeof globalThis === 'object' ? globalThis : this, function () {
  'use strict';

  const KEYS = Object.freeze(['left', 'right', 'jump', 'light', 'heavy', 'block', 'dash', 'up', 'down']);
  const BUTTONS = Object.freeze({
    left: 1, right: 2, jump: 4, light: 8, heavy: 16, block: 32, dash: 64, up: 128, down: 256
  });
  const ALL_BUTTONS_MASK = 511;
  const FRAME_FIELDS = ['tick', 'round', 'buttons'];

  function schemaError() {
    const error = new TypeError('Invalid Arena input schema.');
    error.code = 'ERR_ARENA_SCHEMA';
    throw error;
  }

  function frameError() {
    const error = new RangeError('Arena input frame does not match the current step.');
    error.code = 'ERR_ARENA_FRAME';
    throw error;
  }

  function counterError() {
    const error = new RangeError('Arena input tick cannot be incremented safely.');
    error.code = 'ERR_ARENA_COUNTER';
    throw error;
  }

  function dataField(descriptor, enumerable) {
    return descriptor !== undefined &&
      Object.prototype.hasOwnProperty.call(descriptor, 'value') &&
      descriptor.enumerable === enumerable;
  }

  function ownDataField(descriptors, key, enumerable) {
    return Object.prototype.hasOwnProperty.call(descriptors, key) &&
      dataField(descriptors[key], enumerable);
  }

  function pairValues(frames) {
    if (!Array.isArray(frames)) schemaError();
    // Inspect length first: do not inspect members of a wrong-sized array.
    const length = Object.getOwnPropertyDescriptor(frames, 'length');
    if (!dataField(length, false) || length.value !== 2) schemaError();
    if (Object.getPrototypeOf(frames) !== Array.prototype) schemaError();
    const descriptors = Object.getOwnPropertyDescriptors(frames);
    if (Reflect.ownKeys(descriptors).length !== 3 ||
        !ownDataField(descriptors, '0', true) || !ownDataField(descriptors, '1', true)) {
      schemaError();
    }
    return [descriptors['0'].value, descriptors['1'].value];
  }

  function frameButtons(frame, expectedTick, currentRound) {
    if (frame === null) return 0;
    if (typeof frame !== 'object' || Array.isArray(frame)) schemaError();
    const prototype = Object.getPrototypeOf(frame);
    if (prototype !== Object.prototype && prototype !== null) schemaError();
    const descriptors = Object.getOwnPropertyDescriptors(frame);
    const fields = Reflect.ownKeys(descriptors);
    if (fields.length !== FRAME_FIELDS.length ||
        FRAME_FIELDS.some(field => !ownDataField(descriptors, field, true))) {
      schemaError();
    }
    const tick = descriptors.tick.value;
    const round = descriptors.round.value;
    const buttons = descriptors.buttons.value;
    if (!Number.isSafeInteger(tick) || !Number.isSafeInteger(round) ||
        !Number.isSafeInteger(buttons) || buttons < 0 || buttons > ALL_BUTTONS_MASK) {
      schemaError();
    }
    if (tick !== expectedTick || round !== currentRound) frameError();
    return buttons;
  }

  function keyMap(buttons) {
    const result = {};
    for (const key of KEYS) result[key] = (buttons & BUTTONS[key]) !== 0;
    return result;
  }

  function normalizeFramePair(frames, currentTick, currentRound) {
    if (!Number.isSafeInteger(currentTick) || currentTick < 0 ||
        !Number.isSafeInteger(currentRound) || currentRound < 1) {
      schemaError();
    }
    const expectedTick = currentTick + 1;
    if (!Number.isSafeInteger(expectedTick)) counterError();
    const values = pairValues(frames);
    // Validate both seats before constructing the detached normalized result.
    const buttons0 = frameButtons(values[0], expectedTick, currentRound);
    const buttons1 = frameButtons(values[1], expectedTick, currentRound);
    return [keyMap(buttons0), keyMap(buttons1)];
  }

  return Object.freeze({ KEYS, BUTTONS, ALL_BUTTONS_MASK, normalizeFramePair });
});
