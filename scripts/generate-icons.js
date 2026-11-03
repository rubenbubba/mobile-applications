// Draws the app icon and writes every size the app needs. Uses only Node, so no image library is required.
// Run with: npm run generate:icons
const { mkdirSync, writeFileSync } = require('fs');
const { join } = require('path');
const { deflateSync } = require('zlib');

const ROOT = join(__dirname, '..');
const BRAND = [14, 94, 78];
const WHITE = [255, 255, 255];
const SAMPLES = 4;

// The mark is a check that also reads as a V, on a unit square.
const STROKES = [
  { from: [0.3, 0.5], to: [0.45, 0.68], width: 0.085 },
  { from: [0.45, 0.68], to: [0.72, 0.32], width: 0.085 },
];

function distanceToSegment(x, y, [ax, ay], [bx, by]) {
  const dx = bx - ax;
  const dy = by - ay;
  const t = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(x - ax - t * dx, y - ay - t * dy);
}

function isInMark(x, y, scale) {
  const mx = 0.5 + (x - 0.5) / scale;
  const my = 0.5 + (y - 0.5) / scale;
  return STROKES.some(({ from, to, width }) => distanceToSegment(mx, my, from, to) <= width);
}

function isInRoundedSquare(x, y, radius) {
  const cx = Math.max(radius, Math.min(1 - radius, x));
  const cy = Math.max(radius, Math.min(1 - radius, y));
  return Math.hypot(x - cx, y - cy) <= radius;
}

// Returns RGBA pixels. Each pixel averages several samples so the edges are smooth.
function draw(size, { radius, markScale, background, foreground }) {
  const pixels = Buffer.alloc(size * size * 4);

  for (let py = 0; py < size; py += 1) {
    for (let px = 0; px < size; px += 1) {
      let red = 0;
      let green = 0;
      let blue = 0;
      let alpha = 0;

      for (let sy = 0; sy < SAMPLES; sy += 1) {
        for (let sx = 0; sx < SAMPLES; sx += 1) {
          const x = (px + (sx + 0.5) / SAMPLES) / size;
          const y = (py + (sy + 0.5) / SAMPLES) / size;
          const color = isInMark(x, y, markScale)
            ? foreground
            : background !== undefined && isInRoundedSquare(x, y, radius)
              ? background
              : undefined;

          if (color !== undefined) {
            red += color[0];
            green += color[1];
            blue += color[2];
            alpha += 1;
          }
        }
      }

      const offset = (py * size + px) * 4;
      if (alpha > 0) {
        pixels[offset] = Math.round(red / alpha);
        pixels[offset + 1] = Math.round(green / alpha);
        pixels[offset + 2] = Math.round(blue / alpha);
        pixels[offset + 3] = Math.round((alpha / (SAMPLES * SAMPLES)) * 255);
      }
    }
  }

  return pixels;
}

const CRC_TABLE = Array.from({ length: 256 }, (_, index) => {
  let value = index;
  for (let bit = 0; bit < 8; bit += 1) {
    value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  }
  return value >>> 0;
});

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const content = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(content));
  return Buffer.concat([length, content, crc]);
}

function encodePng(size, pixels) {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(size, 0);
  header.writeUInt32BE(size, 4);
  header[8] = 8; // 8 bits per channel
  header[9] = 6; // RGBA

  const rows = Buffer.alloc((size * 4 + 1) * size);
  for (let row = 0; row < size; row += 1) {
    pixels.copy(rows, row * (size * 4 + 1) + 1, row * size * 4, (row + 1) * size * 4);
  }

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', header),
    chunk('IDAT', deflateSync(rows, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

const ROUNDED = { radius: 0.22, markScale: 1, background: BRAND, foreground: WHITE };
const FULL_BLEED = { radius: 0, markScale: 1, background: BRAND, foreground: WHITE };
const MASKABLE = { radius: 0, markScale: 0.72, background: BRAND, foreground: WHITE };
const ADAPTIVE_FOREGROUND = { radius: 0, markScale: 0.62, background: undefined, foreground: BRAND };

const OUTPUTS = [
  { path: 'public/icons/icon-192.png', size: 192, style: ROUNDED },
  { path: 'public/icons/icon-512.png', size: 512, style: ROUNDED },
  { path: 'public/icons/maskable-192.png', size: 192, style: MASKABLE },
  { path: 'public/icons/maskable-512.png', size: 512, style: MASKABLE },
  { path: 'public/icons/apple-touch-icon.png', size: 180, style: FULL_BLEED },
  { path: 'assets/favicon.png', size: 48, style: ROUNDED },
  { path: 'assets/icon.png', size: 1024, style: FULL_BLEED },
  { path: 'assets/adaptive-icon.png', size: 1024, style: ADAPTIVE_FOREGROUND },
];

mkdirSync(join(ROOT, 'public', 'icons'), { recursive: true });
mkdirSync(join(ROOT, 'assets'), { recursive: true });

for (const { path, size, style } of OUTPUTS) {
  writeFileSync(join(ROOT, path), encodePng(size, draw(size, style)));
  console.log(`Wrote ${path}`);
}
