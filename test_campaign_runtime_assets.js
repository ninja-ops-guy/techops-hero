const assert = require("assert");
const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

const Assets = require("./campaign_assets.js");

const REQUIRED_SECTOR04 = [
  "sector04.access_guard.idle",
  "sector04.access_guard.attack",
  "sector04.access_guard.suppressed",
  "sector04.access_guard.respawn",
  "sector04.purple_damage.enemy",
  "sector04.purple_damage.fx",
  "sector04.identity_controller.active",
  "sector04.identity_controller.severed",
  "sector04.identity_controller.spark_fx",
  "sector04.locked_violin_door",
  "sector04.violin_note.fx",
  "sector04.terminal.symptoms"
];

function parsePng(filePath) {
  const buffer = fs.readFileSync(filePath);
  assert.strictEqual(buffer.toString("hex", 0, 8), "89504e470d0a1a0a", `${filePath} must be PNG`);
  let offset = 8;
  let width = 0;
  let height = 0;
  let colorType = null;
  const idat = [];

  while (offset < buffer.length) {
    const length = buffer.readUInt32BE(offset);
    const type = buffer.toString("ascii", offset + 4, offset + 8);
    const dataStart = offset + 8;
    const dataEnd = dataStart + length;
    const data = buffer.subarray(dataStart, dataEnd);
    if (type === "IHDR") {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      colorType = data[9];
    } else if (type === "IDAT") {
      idat.push(data);
    } else if (type === "IEND") {
      break;
    }
    offset = dataEnd + 4;
  }

  assert.strictEqual(colorType, 6, `${filePath} must be RGBA PNG`);
  const raw = zlib.inflateSync(Buffer.concat(idat));
  const stride = width * 4;
  let sourceOffset = 0;
  const pixels = Buffer.alloc(height * stride);
  let previous = Buffer.alloc(stride);

  for (let y = 0; y < height; y++) {
    const filter = raw[sourceOffset++];
    const row = Buffer.from(raw.subarray(sourceOffset, sourceOffset + stride));
    sourceOffset += stride;
    for (let x = 0; x < stride; x++) {
      const left = x >= 4 ? row[x - 4] : 0;
      const up = previous[x] || 0;
      const upLeft = x >= 4 ? previous[x - 4] || 0 : 0;
      if (filter === 1) row[x] = (row[x] + left) & 255;
      else if (filter === 2) row[x] = (row[x] + up) & 255;
      else if (filter === 3) row[x] = (row[x] + Math.floor((left + up) / 2)) & 255;
      else if (filter === 4) {
        const p = left + up - upLeft;
        const pa = Math.abs(p - left);
        const pb = Math.abs(p - up);
        const pc = Math.abs(p - upLeft);
        row[x] = (row[x] + (pa <= pb && pa <= pc ? left : pb <= pc ? up : upLeft)) & 255;
      } else {
        assert.strictEqual(filter, 0, `${filePath} has unsupported PNG filter ${filter}`);
      }
    }
    row.copy(pixels, y * stride);
    previous = row;
  }

  return { width, height, pixels };
}

function pixelStats(png) {
  let opaque = 0;
  let transparent = 0;
  let whiteOpaque = 0;
  for (let i = 0; i < png.pixels.length; i += 4) {
    const r = png.pixels[i];
    const g = png.pixels[i + 1];
    const b = png.pixels[i + 2];
    const a = png.pixels[i + 3];
    if (a === 0) transparent++;
    if (a > 16) {
      opaque++;
      if (r > 245 && g > 245 && b > 245) whiteOpaque++;
    }
  }
  return { opaque, transparent, whiteOpaque };
}

for (const slotId of REQUIRED_SECTOR04) {
  const filename = Assets.slotFilename(slotId);
  const filePath = path.join(__dirname, "assets", "campaign", filename);
  assert.ok(fs.existsSync(filePath), `${filename} must exist`);
  const png = parsePng(filePath);
  const stats = pixelStats(png);
  assert.ok(png.width >= 64 && png.height >= 64, `${filename} must be gameplay-scale readable`);
  assert.ok(stats.opaque > 80, `${filename} must contain visible art`);
  assert.ok(stats.transparent > stats.opaque * 0.2, `${filename} must preserve transparent padding`);
  assert.ok(stats.whiteOpaque < stats.opaque * 0.2, `${filename} must not carry a white sheet background`);
  const candidate = Assets.validateCandidate(slotId, {
    kind: "runtime_png",
    filename,
    format: "png",
    transparent: true,
    perspective: slotId.includes("access_guard") || slotId.includes("purple_damage") || slotId.includes("violin_note") ? "side" : "front"
  });
  assert.deepStrictEqual(candidate.errors, [], `${filename} contract errors: ${candidate.errors.join(", ")}`);
}

console.log("Campaign runtime assets: PASS");
