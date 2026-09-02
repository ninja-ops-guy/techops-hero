"use strict";

const assert = require("assert");
const fs = require("fs");

function jpegDimensions(bytes) {
  assert.strictEqual(bytes[0], 0xff, "deck image must begin with a JPEG marker");
  assert.strictEqual(bytes[1], 0xd8, "deck image must have a valid JPEG SOI");
  let i = 2;
  while (i + 8 < bytes.length) {
    if (bytes[i] !== 0xff) { i++; continue; }
    while (bytes[i] === 0xff) i++;
    const marker = bytes[i++];
    if (marker === 0xd8 || marker === 0xd9) continue;
    const length = bytes.readUInt16BE(i);
    const sof = marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker);
    if (sof) return { height: bytes.readUInt16BE(i + 3), width: bytes.readUInt16BE(i + 5) };
    i += length;
  }
  throw new Error("deck image has no JPEG size frame");
}

delete global.GOOD_BOYS_SHIP_DECK_USER_ASSET;
require("./good_boys_ship_deck_user_asset.js");
const asset = global.GOOD_BOYS_SHIP_DECK_USER_ASSET;
assert.ok(asset, "deck asset contract must load");
assert.strictEqual(asset.VERSION, 2, "fixed deck mapping must remain authoritative");
assert.strictEqual(asset.width, 620);
assert.strictEqual(asset.height, 170);
assert.strictEqual(asset.fit, "contain");
assert.ok(!asset.src.startsWith("data:"), "deck art must not regress to the invalid inline payload");

const imagePath = asset.src.split("?")[0];
const bytes = fs.readFileSync(imagePath);
assert.ok(bytes.length > 40000, "full bridge crop is unexpectedly small or truncated");
assert.deepStrictEqual(jpegDimensions(bytes), { width: 620, height: 170 });
assert.strictEqual(bytes[bytes.length - 2], 0xff, "deck image must have a valid JPEG EOI");
assert.strictEqual(bytes[bytes.length - 1], 0xd9, "deck image must have a valid JPEG EOI");

const scene = fs.readFileSync("good_boys_ship_deck_scene.js", "utf8");
assert.ok(scene.includes("VERSION=5"), "deck fix must preserve the interactive v5 pilot approach scene");
assert.ok(scene.includes("drawContain(ctx,inlineImg,0,70,960,330)"), "deck must map natural image bounds without stretching");
assert.ok(scene.includes("cockpit_pilot.jpg?v=20260902-deck-map-r2"), "pilot/deck image must bypass the broken cached crop");
assert.ok(!scene.includes("ctx.drawImage(env,0,0,asset.width"), "legacy guessed source rectangle must stay removed");
assert.ok(!scene.includes("ctx.drawImage(inlineImg,0,0,inlineImg.naturalWidth,inlineImg.naturalHeight,0,70,960,330)"), "interactive scene must not stretch the bridge crop");

const atlas = fs.readFileSync("katrin_manchez.atlas.js", "utf8");
const opening = fs.readFileSync("good_boys_opening_sequence_v4.js", "utf8");
const entry = fs.readFileSync("index.html", "utf8");
for (const source of [atlas, opening, entry]) {
  assert.ok(source.includes("20260902-deck-map-r2"), "every live deck renderer must bypass the broken cached crop");
}

console.log("Good Boys ship-deck mapping contract: PASS");
