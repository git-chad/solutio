import { Button } from "@/components/ui/button"
import { Container } from "@/components/ui/container"
import { Link } from "@/components/ui/link"
import { NAV_LINKS, SITE } from "@/lib/content/site"

export function Header() {
  return (
    <Container
      as="header"
      className="absolute top-0 left-0 z-10 flex h-header-height items-center justify-between"
    >
      <Link
        href="/"
        aria-label={`${SITE.name} — home`}
        className="rounded-sm font-serif text-white text-xl/6 tracking-[-0.3px]"
      >
        {SITE.name}
      </Link>

      <nav aria-label="Main" className="flex items-center gap-1">
        {NAV_LINKS.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className="tablet:block hidden rounded-full px-[18px] py-2 text-[13px]/4 text-solutio-text-muted transition-colors duration-200 ease-out hover:text-white"
          >
            {label}
          </Link>
        ))}
        <Button variant="ghost" href="#contact">
          Talk to us
        </Button>
      </nav>
    </Container>
  )
}
