/**
 * Site-wide copy and contact details.
 *
 * TODO(client): every value marked PLACEHOLDER below is a guess and must be
 * confirmed with Solutio before launch. They are centralised here so there is
 * exactly one place to change.
 */
export const SITE = {
  name: "Solutio",
  email: "tomas.b.gonzalez@hotmail.com",
  location: "Buenos Aires, Argentina",
  legalName: "Solutio",
  tagline: "Tax Advisory & Strategic Counsel",
  description:
    "Solutio advises companies, individuals and families on complex tax and financial decisions, combining experience, judgment and strategic insight.",
  /**
   * SEO keywords surfaced in page metadata. Kept tight and relevant — long,
   * spammy lists are ignored (or penalised) by search engines.
   */
  keywords: [
    "tax advisory",
    "tax planning",
    "strategic tax counsel",
    "international taxation",
    "corporate tax",
    "wealth and estate planning",
    "financial advisory",
    "tax consulting Buenos Aires",
  ],
} as const

export const NAV_LINKS = [
  { href: "#about", label: "About" },
  { href: "#services", label: "Services" },
] as const
