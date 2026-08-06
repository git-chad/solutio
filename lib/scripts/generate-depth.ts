/**
 * Generates a depth map for the hero photograph.
 *
 * Run once, offline — the model is a build-time tool, not a runtime dependency.
 * The output is a plain greyscale image the shader samples like any other
 * texture, so nothing about this reaches the browser.
 *
 *   bun lib/scripts/generate-depth.ts [--src public/images/hero-bg.webp]
 *       [--out public/images/hero-bg-depth.webp] [--model <hf-id>]
 *
 * Depth Anything V2 (small) is a monocular depth estimator: it infers relative
 * depth from a single photo. Relative is all we need — the parallax only cares
 * about which things are nearer than which, not about metric distance.
 *
 * The first run downloads the model (~100MB) into the transformers.js cache.
 */
import { join } from "node:path"
import { pipeline, RawImage } from "@huggingface/transformers"
import sharp from "sharp"

const args = process.argv.slice(2)
const flag = (name: string, fallback: string) => {
  const index = args.indexOf(`--${name}`)
  return index === -1 ? fallback : (args[index + 1] ?? fallback)
}

const src = join(process.cwd(), flag("src", "public/images/hero-bg.webp"))
const out = join(process.cwd(), flag("out", "public/images/hero-bg-depth.webp"))
const model = flag("model", "onnx-community/depth-anything-v2-small")

/**
 * The map is only ever read at low frequency to displace UVs, so it does not
 * need the colour image's resolution. Smaller also means the shader's
 * neighbourhood reads stay in cache.
 */
const WIDTH = 1024
/** Blur radius, in px of the output. Softens the model's hard object edges. */
const SMOOTH = 2

console.log(`loading ${model} …`)
const estimator = await pipeline("depth-estimation", model)

console.log(`reading ${src}`)
// The model wants PNG/JPEG-decodable input; sharp gives us raw pixels either
// way, and RawImage takes those directly.
const { data, info } = await sharp(src)
  .resize({ width: WIDTH, withoutEnlargement: true })
  .removeAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true })

const image = new RawImage(
  new Uint8ClampedArray(data),
  info.width,
  info.height,
  3
)

console.log("estimating depth …")
const result = await estimator(image)
const depth = Array.isArray(result) ? result[0]?.depth : result.depth
if (!depth) throw new Error("model returned no depth map")

/**
 * Normalise to the full 0..255 range.
 *
 * The model's output range varies per image, and a map that only spans, say,
 * 60..190 would silently halve the parallax. Stretching here means the shader's
 * strength control always means the same thing.
 */
const raw = depth.data as Uint8Array | Float32Array
let min = Number.POSITIVE_INFINITY
let max = Number.NEGATIVE_INFINITY
for (const value of raw) {
  if (value < min) min = value
  if (value > max) max = value
}
const span = max - min || 1

const normalised = Buffer.alloc(raw.length)
for (let i = 0; i < raw.length; i++) {
  normalised[i] = Math.round((((raw[i] ?? min) - min) / span) * 255)
}

const encoded = await sharp(normalised, {
  raw: { width: depth.width, height: depth.height, channels: 1 },
})
  // Smoothed so the parallax shears gradually across object boundaries instead
  // of tearing along them.
  .blur(SMOOTH)
  .webp({ quality: 90 })
  .toBuffer()

await Bun.write(out, encoded)
console.log(
  `wrote ${out} — ${depth.width}x${depth.height}, ${(encoded.length / 1024).toFixed(0)}KB, source range ${min.toFixed(1)}..${max.toFixed(1)}`
)
