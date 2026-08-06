/**
 * Re-encodes the source images in `public/images` to sane dimensions and
 * quality.
 *
 * The originals were exported near-lossless at up to 2048px square, which cost
 * ~11MB in the repo and made every `next/image` transform expensive. Each entry
 * below caps the longest edge at roughly 2x the largest size the image is ever
 * rendered at, which is all a 2x display can use.
 *
 * Run with `bun lib/scripts/optimize-images.ts`. Idempotent, but it overwrites
 * in place — commit or stash first.
 */
import { readdir, stat } from "node:fs/promises"
import { join } from "node:path"
import sharp from "sharp"

const IMAGES_DIR = join(process.cwd(), "public", "images")

/** Longest edge, in px, per image. Keys are filenames in `public/images`. */
const MAX_EDGE: Record<string, number> = {
  // Full-bleed blurred backdrop. Never shows detail, so it can go small.
  "banner-blur.webp": 1920,
  // Full-bleed banner behind the statement copy.
  "banner-desk.webp": 2560,
  // Sits in a ~540px column; 2x covers retina.
  "about.webp": 1360,
  // Portrait, so the long edge is the height. Native is 880x1168, which is
  // already only ~2.3x the ~372px column it renders in — recompress, no resize.
  "approach.webp": 1168,
  // Consumed as a shader texture, not through next/image. Left alone.
  "hero-bg.webp": 0,
}

const QUALITY = 80

const format = (bytes: number) => `${(bytes / 1024 / 1024).toFixed(2)}MB`

const files = await readdir(IMAGES_DIR)
let before = 0
let after = 0

for (const file of files) {
  if (!file.endsWith(".webp")) continue

  const path = join(IMAGES_DIR, file)
  const originalSize = (await stat(path)).size
  before += originalSize

  const maxEdge = MAX_EDGE[file]
  if (maxEdge === 0) {
    after += originalSize
    console.log(`skip  ${file} (${format(originalSize)})`)
    continue
  }
  if (maxEdge === undefined) {
    after += originalSize
    console.warn(`skip  ${file} — no MAX_EDGE entry, add one`)
    continue
  }

  // Decode to a buffer first: sharp cannot read and write the same path.
  const output = await sharp(path)
    .resize({
      width: maxEdge,
      height: maxEdge,
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality: QUALITY })
    .toBuffer()

  await Bun.write(path, output)
  after += output.length
  console.log(
    `write ${file} ${format(originalSize)} -> ${format(output.length)}`
  )
}

console.log(`\ntotal ${format(before)} -> ${format(after)}`)
