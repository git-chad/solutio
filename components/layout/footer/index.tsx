import { CurrentYear } from "@/components/layout/footer/current-year"
import { Container } from "@/components/ui/container"
import { Link } from "@/components/ui/link"
import { Typography } from "@/components/ui/typography"
import { NAV_LINKS, SITE } from "@/lib/content/site"
import { cn } from "@/lib/styles/cn"
import { INTERACTIVE, WORDMARK } from "@/lib/styles/motion"

/** Footer links sit a step quieter than the header's, and brighten on hover. */
const FOOTER_LINK = cn(
  INTERACTIVE,
  "rounded-sm text-[0.8125rem]/5 text-solutio-text-muted hover:text-white"
)

export function Footer() {
  return (
    // `relative z-10` for the same reason `main` has it: the shared canvas is a
    // positioned element at z-0, so a static footer would paint *beneath* it.
    <Container
      as="footer"
      className="relative z-10 flex tablet:flex-row flex-col tablet:items-end tablet:justify-between gap-10 border-solutio-card-border border-t pt-14 pb-12"
    >
      <div className="flex flex-col gap-4">
        <Link
          href="/"
          aria-label={`${SITE.name} — home`}
          className={cn(INTERACTIVE, WORDMARK, "rounded-sm")}
        >
          {SITE.name}
        </Link>
        <Typography variant="caption" className="max-w-[22rem] text-pretty">
          {SITE.tagline}
        </Typography>
      </div>

      <div className="flex flex-col tablet:items-end gap-5">
        <nav
          aria-label="Footer"
          className="flex flex-wrap items-center gap-x-6 gap-y-2"
        >
          {NAV_LINKS.map(({ href, label }) => (
            <Link key={href} href={href} className={FOOTER_LINK}>
              {label}
            </Link>
          ))}
          {/*
            Kept in the nav but visually promoted: it is the page's only direct
            contact route, and the CTA above it scrolls rather than mailing.
          */}
          <Link
            href={`mailto:${SITE.email}`}
            className={cn(
              INTERACTIVE,
              "rounded-sm text-[0.8125rem]/5 text-white underline decoration-solutio-text-ghost underline-offset-4 hover:decoration-white"
            )}
          >
            {SITE.email}
          </Link>
        </nav>

        <Typography
          variant="caption"
          className="text-[0.75rem]/4 text-solutio-text-ghost"
        >
          &copy; <CurrentYear />
          {SITE.legalName}. All rights reserved.
        </Typography>
      </div>
    </Container>
  )
}
