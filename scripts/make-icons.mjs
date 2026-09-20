// One-off script to generate placeholder PWA icons (flat background + "$" glyph).
// Run with: node scripts/make-icons.mjs
import { deflateSync } from 'node:zlib'
import { writeFileSync } from 'node:fs'

function crc32(buf) {
  let c
  const table = crc32.table ?? (crc32.table = (() => {
    const t = new Uint32Array(256)
    for (let n = 0; n < 256; n++) {
      c = n
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
      t[n] = c
    }
    return t
  })())
  let crc = 0xffffffff
  for (let i = 0; i < buf.length; i++) crc = table[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8)
  return (crc ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length, 0)
  const typeBuf = Buffer.from(type, 'ascii')
  const crcBuf = Buffer.alloc(4)
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0)
  return Buffer.concat([len, typeBuf, data, crcBuf])
}

// Simple 5x7 bitmap font for "$" and "M" (enough for our glyph), scaled up.
const DOLLAR = [
  '00100',
  '01111',
  '10100',
  '01110',
  '00101',
  '11110',
  '00100',
]

function makePng(size, bg, fg) {
  const raw = Buffer.alloc(size * (1 + size * 4))
  const glyphRows = DOLLAR.length
  const glyphCols = DOLLAR[0].length
  const scale = Math.floor((size * 0.5) / glyphRows)
  const glyphW = glyphCols * scale
  const glyphH = glyphRows * scale
  const offsetX = Math.floor((size - glyphW) / 2)
  const offsetY = Math.floor((size - glyphH) / 2)

  for (let y = 0; y < size; y++) {
    const rowStart = y * (1 + size * 4)
    raw[rowStart] = 0 // filter type: none
    for (let x = 0; x < size; x++) {
      let r = bg[0], g = bg[1], b = bg[2], a = 255
      const gx = x - offsetX
      const gy = y - offsetY
      if (gx >= 0 && gx < glyphW && gy >= 0 && gy < glyphH) {
        const col = Math.floor(gx / scale)
        const row = Math.floor(gy / scale)
        if (DOLLAR[row][col] === '1') {
          r = fg[0]; g = fg[1]; b = fg[2]
        }
      }
      const px = rowStart + 1 + x * 4
      raw[px] = r
      raw[px + 1] = g
      raw[px + 2] = b
      raw[px + 3] = a
    }
  }

  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 6 // color type RGBA
  ihdr[10] = 0
  ihdr[11] = 0
  ihdr[12] = 0

  const idat = deflateSync(raw)
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])

  return Buffer.concat([
    signature,
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

const bg = [16, 185, 129] // emerald-500
const fg = [255, 255, 255]

writeFileSync('public/icon-192.png', makePng(192, bg, fg))
writeFileSync('public/icon-512.png', makePng(512, bg, fg))
writeFileSync('public/apple-touch-icon.png', makePng(180, bg, fg))

console.log('Icons written to public/')
