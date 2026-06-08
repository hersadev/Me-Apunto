// genera los iconos PNG de Me Apunto para la PWA
// uso: node generate-icons.js (desde la carpeta frontend/)
// no requiere dependencias externas

const zlib = require('zlib');
const fs = require('fs');
const path = require('path');

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) c = (c >>> 8) ^ CRC_TABLE[(c ^ buf[i]) & 0xFF];
  return (c ^ 0xFFFFFFFF) >>> 0;
}

function pngChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const tb = Buffer.from(type, 'ascii');
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([tb, data])));
  return Buffer.concat([len, tb, data, crcBuf]);
}

// píxeles para las letras "MA" en una cuadrícula de 11x7
// 0 = fondo, 1 = blanco
const GLYPH_MA = [
  [1,0,1, 0, 1,1,0],
  [1,1,1, 0, 1,0,1],
  [1,0,1, 0, 1,1,1],
  [1,0,1, 0, 1,0,1],
  [1,0,1, 0, 1,0,1],
];

function createPng(size) {
  // colores
  const [BR, BG, BB] = [145, 100, 50];  // dorado oscuro fondo
  const [TR, TG, TB] = [255, 255, 255]; // blanco texto

  // escala del glifo según tamaño del icono
  const glyphW = 7;
  const glyphH = 5;
  const scale = Math.floor(size / 14);
  const pixW = glyphW * scale;
  const pixH = glyphH * scale;
  const offX = Math.floor((size - pixW) / 2);
  const offY = Math.floor((size - pixH) / 2);

  const rowSize = 1 + size * 3;
  const raw = Buffer.alloc(size * rowSize);

  for (let y = 0; y < size; y++) {
    raw[y * rowSize] = 0; // filter None
    for (let x = 0; x < size; x++) {
      const px = x - offX;
      const py = y - offY;
      const gx = Math.floor(px / scale);
      const gy = Math.floor(py / scale);
      const isText =
        px >= 0 && py >= 0 &&
        gx < glyphW && gy < glyphH &&
        GLYPH_MA[gy] && GLYPH_MA[gy][gx] === 1;

      const off = y * rowSize + 1 + x * 3;
      raw[off]     = isText ? TR : BR;
      raw[off + 1] = isText ? TG : BG;
      raw[off + 2] = isText ? TB : BB;
    }
  }

  const idat = zlib.deflateSync(raw);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; ihdr[9] = 2; // 8-bit RGB

  const PNG_SIG = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  return Buffer.concat([
    PNG_SIG,
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', idat),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
}

const outDir = path.join(__dirname, 'public');

[[192, 'icon-192.png'], [512, 'icon-512.png'], [180, 'apple-touch-icon.png']].forEach(([size, name]) => {
  fs.writeFileSync(path.join(outDir, name), createPng(size));
  console.log(`✓ ${name} (${size}x${size})`);
});

console.log('Iconos generados en public/');
