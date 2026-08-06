/**
 * Resolves the site's absolute base URL, used for metadata, canonical links,
 * OG/Twitter images, the sitemap and robots.
 *
 * Priority:
 * 1. `NEXT_PUBLIC_BASE_URL` — explicit override. Set this to the final custom
 *    domain in production; it wins over everything else.
 * 2. `VERCEL_PROJECT_PRODUCTION_URL` — Vercel's stable production alias
 *    (e.g. `solutio-pearl.vercel.app`), injected automatically at build and
 *    runtime. This is the safety net: without it, an unset override silently
 *    falls back to localhost and every absolute URL (OG image included) breaks
 *    in production.
 * 3. `http://localhost:3000` — local development.
 */
export function getBaseUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_BASE_URL
  if (explicit) return explicit.replace(/\/+$/, "")

  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL
  if (vercel) return `https://${vercel}`

  return "http://localhost:3000"
}
