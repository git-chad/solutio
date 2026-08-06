/**
 * Site-wide copy and contact details.
 *
 * TODO(client): every value marked PLACEHOLDER below is a guess and must be
 * confirmed with Solutio before launch. They are centralised here so there is
 * exactly one place to change.
 */
export const SITE = {
  name: "Solutio",
  /** PLACEHOLDER — needs the real address. */
  email: "hello@solutio.tax",
  /** PLACEHOLDER — needs the real address, or drop the line from the footer. */
  location: "Buenos Aires, Argentina",
  legalName: "Solutio",
  tagline: "Tax Advisory & Strategic Counsel",
  description:
    "Solutio advises companies, individuals and families on complex tax and financial decisions, combining experience, judgment and strategic insight.",
} as const

export const NAV_LINKS = [
  { href: "#about", label: "About" },
  { href: "#services", label: "Services" },
] as const
