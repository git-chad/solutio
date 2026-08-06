import { Container } from "@/components/ui/container"
import { Link } from "@/components/ui/link"
import { Typography } from "@/components/ui/typography"
import { NAV_LINKS, SITE } from "@/lib/content/site"

export function Footer() {
  return (
    <Container
      as="footer"
      className="flex tablet:flex-row flex-col tablet:items-end tablet:justify-between gap-8 border-solutio-card-border border-t py-10"
    >
      <div className="flex flex-col gap-3">
        <Typography
          as="span"
          className="font-serif text-white text-xl/6 tracking-[-0.3px]"
        >
          {SITE.name}
        </Typography>
        <Typography variant="caption" className="max-w-[20rem] text-pretty">
          {SITE.tagline}
        </Typography>
      </div>

      <div className="flex flex-col tablet:items-end gap-3">
        <nav aria-label="Footer" className="flex items-center gap-5">
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="rounded-sm text-[13px]/4 text-solutio-text-muted transition-colors duration-200 ease-out hover:text-white"
            >
              {label}
            </Link>
          ))}
          <Link
            href={`mailto:${SITE.email}`}
            className="rounded-sm text-[13px]/4 text-solutio-text-muted transition-colors duration-200 ease-out hover:text-white"
          >
            {SITE.email}
          </Link>
        </nav>

        <Typography variant="caption" className="text-solutio-text-ghost">
          &copy; {new Date().getFullYear()} {SITE.legalName}. All rights
          reserved.
        </Typography>
      </div>
    </Container>
  )
}
