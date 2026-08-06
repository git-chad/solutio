/**
 * Generates `public/opengraph-image.jpg`, the 1200x630 card used by
 * `app/layout.tsx` metadata for link previews.
 *
 * This is a stand-in so shares do not 404 — replace it with a designed asset
 * when the client supplies one, and this script can go.
 *
 * Run with `bun lib/scripts/generate-og.ts`.
 */
import { join } from "node:path"
import sharp from "sharp"
import { SITE } from "@/lib/content/site"

const WIDTH = 1200
const HEIGHT = 630
const SOURCE = join(process.cwd(), "public", "images", "about.webp")
const OUTPUT = join(process.cwd(), "public", "opengraph-image.jpg")

const escapeXml = (value: string) =>
  value.replace(
    /[<>&'"]/g,
    (char) =>
      ({
        "<": "&lt;",
        ">": "&gt;",
        "&": "&amp;",
        "'": "&apos;",
        '"': "&quot;",
      })[char] as string
  )

// Rendered by librsvg via sharp, so this is limited to fonts installed on the
// machine running the script — hence the generic serif stack.
const overlay = Buffer.from(`
  <svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${WIDTH}" height="${HEIGHT}" fill="#0A0A0A" opacity="0.72" />
    <text x="80" y="300" fill="#FFFFFF" font-family="Georgia, 'Times New Roman', serif" font-size="86" letter-spacing="-2">
      ${escapeXml(SITE.name)}
    </text>
    <text x="80" y="360" fill="#FFFFFFBF" font-family="Helvetica, Arial, sans-serif" font-size="28">
      ${escapeXml(SITE.tagline)}
    </text>
    <rect x="80" y="404" width="72" height="2" fill="#FFFFFF59" />
  </svg>
`)

const output = await sharp(SOURCE)
  .resize(WIDTH, HEIGHT, { fit: "cover", position: "attention" })
  .composite([{ input: overlay, top: 0, left: 0 }])
  .jpeg({ quality: 88, mozjpeg: true })
  .toBuffer()

await Bun.write(OUTPUT, output)
console.log(`wrote ${OUTPUT} (${(output.length / 1024).toFixed(0)}KB)`)
