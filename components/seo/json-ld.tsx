import { SITE } from "@/lib/content/site"

const APP_BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000"

/**
 * Organization / ProfessionalService structured data.
 *
 * Rendered once in the root layout so every page carries it. Helps search
 * engines understand what Solutio is and surface richer results (name, contact,
 * area served). Kept as a single JSON-LD block — extend `@graph` if per-page
 * schema (Article, FAQ, …) is added later.
 */
export function JsonLd() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    name: SITE.legalName,
    alternateName: SITE.name,
    description: SITE.description,
    url: APP_BASE_URL,
    image: `${APP_BASE_URL}/opengraph-image.jpg`,
    email: SITE.email,
    address: {
      "@type": "PostalAddress",
      addressLocality: "Buenos Aires",
      addressCountry: "AR",
    },
    areaServed: "Worldwide",
    knowsAbout: [
      "Tax advisory",
      "Tax planning",
      "Strategic financial counsel",
      "International taxation",
    ],
  }

  return (
    <script
      type="application/ld+json"
      // Safe: `schema` is built from static, trusted values — no user input.
      // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD must be inlined as raw text.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}
