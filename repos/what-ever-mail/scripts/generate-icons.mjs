#!/usr/bin/env node
/**
 * Generate platform icon files from resources/icon.svg
 *
 * Outputs:
 *   resources/icon.png   — 512×512 (Linux + fallback)
 *   resources/icon.ico   — multi-size Windows icon
 *   resources/icon.icns  — macOS iconset (macOS only, requires iconutil)
 */

import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { execFileSync } from 'child_process'
import sharp from 'sharp'
import pngToIco from 'png-to-ico'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const RESOURCES = join(ROOT, 'resources')
const SVG_PATH = join(RESOURCES, 'icon.svg')

const SIZES = [16, 32, 48, 64, 128, 256, 512, 1024]

async function main() {
  if (!existsSync(SVG_PATH)) {
    console.error('❌  resources/icon.svg not found')
    process.exit(1)
  }

  const svgBuffer = readFileSync(SVG_PATH)
  console.log('🎨  Generating icons from resources/icon.svg…')

  // ── 1. Generate PNGs at all required sizes ──────────────────────────────
  const pngBuffers = {}
  for (const size of SIZES) {
    pngBuffers[size] = await sharp(svgBuffer, { density: 300 })
      .resize(size, size)
      .png()
      .toBuffer()
    process.stdout.write(`   PNG ${size}×${size} ✓\n`)
  }

  // ── 2. Save icon.png (512px) ──────────────────────────────────────────
  const pngPath = join(RESOURCES, 'icon.png')
  writeFileSync(pngPath, pngBuffers[512])
  console.log(`✅  resources/icon.png (512px)`)

  // ── 3. Build icon.ico (Windows) ────────────────────────────────────────
  const icoSizes = [16, 32, 48, 64, 128, 256]
  const icoBuffer = await pngToIco(icoSizes.map((s) => pngBuffers[s]))
  writeFileSync(join(RESOURCES, 'icon.ico'), icoBuffer)
  console.log(`✅  resources/icon.ico (${icoSizes.join(', ')}px)`)

  // ── 4. Build icon.icns (macOS only) ────────────────────────────────────
  if (process.platform !== 'darwin') {
    console.log('⚠️   Skipping icon.icns — iconutil only available on macOS')
    return
  }

  const iconsetDir = join(RESOURCES, 'icon.iconset')
  if (existsSync(iconsetDir)) rmSync(iconsetDir, { recursive: true })
  mkdirSync(iconsetDir)

  // macOS iconset naming convention
  const icnsMap = [
    { name: 'icon_16x16.png',      size: 16   },
    { name: 'icon_16x16@2x.png',   size: 32   },
    { name: 'icon_32x32.png',      size: 32   },
    { name: 'icon_32x32@2x.png',   size: 64   },
    { name: 'icon_64x64.png',      size: 64   },
    { name: 'icon_64x64@2x.png',   size: 128  },
    { name: 'icon_128x128.png',    size: 128  },
    { name: 'icon_128x128@2x.png', size: 256  },
    { name: 'icon_256x256.png',    size: 256  },
    { name: 'icon_256x256@2x.png', size: 512  },
    { name: 'icon_512x512.png',    size: 512  },
    { name: 'icon_512x512@2x.png', size: 1024 },
  ]

  for (const { name, size } of icnsMap) {
    writeFileSync(join(iconsetDir, name), pngBuffers[size])
  }

  // iconutil path is fixed on macOS — no user input involved
  execFileSync('/usr/bin/iconutil', ['-c', 'icns', iconsetDir, '-o', join(RESOURCES, 'icon.icns')])
  rmSync(iconsetDir, { recursive: true })
  console.log(`✅  resources/icon.icns`)

  console.log('\n🏁  Done. All icon files are in resources/')
}

main().catch((err) => {
  console.error('❌  Error:', err.message)
  process.exit(1)
})
