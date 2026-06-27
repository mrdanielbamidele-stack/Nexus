// scripts/generate-icons.mjs
// Generates PNG app icons (the purple "N" Nexus mark) for the places that
// require PNG and can't use logo.svg: iOS home-screen (apple-touch-icon) and
// the Web Notification icon/badge. Dependency-free - draws the N geometrically
// and encodes PNG with Node's built-in zlib.
//
// Run:  node scripts/generate-icons.mjs
// Outputs into /public:  icon-192.png, icon-512.png, apple-touch-icon.png

import zlib from "node:zlib";
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const PUBLIC = join(dirname(fileURLToPath(import.meta.url)), "..", "public");

const PURPLE = [124, 58, 237]; // #7c3aed
const WHITE = [255, 255, 255];

// Distance from point P to segment AB.
function distToSeg(px, py, ax, ay, bx, by) {
  const dx = bx - ax;
  const dy = by - ay;
  const len2 = dx * dx + dy * dy || 1;
  let t = ((px - ax) * dx + (py - ay) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  const cx = ax + t * dx;
  const cy = ay + t * dy;
  return Math.hypot(px - cx, py - cy);
}

function makeIcon(size) {
  const buf = Buffer.alloc(size * size * 4);

  // N geometry (centered, sized to survive maskable cropping).
  const x0 = size * 0.32;
  const x1 = size * 0.68;
  const y0 = size * 0.30;
  const y1 = size * 0.70;
  const half = size * 0.055; // half stroke width

  const segs = [
    [x0, y0, x0, y1], // left vertical
    [x1, y0, x1, y1], // right vertical
    [x0, y0, x1, y1], // diagonal
  ];

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      // Full-bleed purple background (no transparent corners -> maskable-safe).
      let [r, g, b] = PURPLE;

      // White N with light anti-aliasing.
      let d = Infinity;
      for (const [ax, ay, bx, by] of segs) {
        const dd = distToSeg(x + 0.5, y + 0.5, ax, ay, bx, by);
        if (dd < d) d = dd;
      }
      const cover = Math.max(0, Math.min(1, half - d + 0.5));
      if (cover > 0) {
        r = Math.round(r + (WHITE[0] - r) * cover);
        g = Math.round(g + (WHITE[1] - g) * cover);
        b = Math.round(b + (WHITE[2] - b) * cover);
      }

      const i = (y * size + x) * 4;
      buf[i] = r;
      buf[i + 1] = g;
      buf[i + 2] = b;
      buf[i + 3] = 255;
    }
  }
  return buf;
}

/* --------------------------- minimal PNG encoder -------------------------- */

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type, "ascii");
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crc]);
}

function encodePng(rgba, size) {
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  // 10,11,12 = compression, filter, interlace = 0

  // Raw scanlines with filter byte 0 per row.
  const raw = Buffer.alloc(size * (size * 4 + 1));
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0;
    rgba.copy(raw, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4);
  }
  const idat = zlib.deflateSync(raw, { level: 9 });

  return Buffer.concat([
    sig,
    chunk("IHDR", ihdr),
    chunk("IDAT", idat),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

/* --------------------------------- main ---------------------------------- */

for (const [name, size] of [
  ["icon-192.png", 192],
  ["icon-512.png", 512],
  ["apple-touch-icon.png", 180],
]) {
  const png = encodePng(makeIcon(size), size);
  writeFileSync(join(PUBLIC, name), png);
  console.log(`wrote public/${name} (${size}x${size}, ${png.length} bytes)`);
}
