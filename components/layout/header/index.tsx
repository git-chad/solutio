"use client"

import { useLenis } from "lenis/react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Container } from "@/components/ui/container"
import { Link } from "@/components/ui/link"
import { Wordmark } from "@/components/ui/wordmark"
import { NAV_LINKS, SITE } from "@/lib/content/site"
import { cn } from "@/lib/styles/cn"
import { INTERACTIVE, WORDMARK } from "@/lib/styles/motion"

/**
 * Scroll distance before the bar takes on a background, in px.
 *
 * Far enough that it does not flicker on a stray trackpad nudge, close enough
 * that the bar is solid before the copy behind it could collide with the nav.
 */
const SOLID_AFTER = 24

export function Header() {
  const [scrolled, setScrolled] = useState(false)

  // Driven from Lenis rather than a scroll listener, so it shares the one
  // scroll source the rest of the page already runs on. Setting state to its
  // current value bails out in React, so this is cheap despite firing per frame.
  useLenis((lenis) => {
    setScrolled(lenis.scroll > SOLID_AFTER)
  })

  return (
    // Full-bleed and fixed, with the grid alignment handled by `Container`
    // inside. Putting `Container` itself at `left-0` would break its `mx-auto`
    // centring — auto margins cannot centre an absolutely positioned box unless
    // both insets are set — which is what pulled the wordmark out of the
    // content column.
    <header className="fixed inset-x-0 top-0 z-50">
      {/*
        Backdrop as its own layer so only its opacity animates; fading the
        header itself would take the logo and links with it. The blur class is
        applied with the same toggle, so it switches on while the layer is still
        fully transparent and the change is invisible.
      */}
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-0 border-solutio-card-border border-b bg-solutio-bg/70 transition-opacity duration-200 ease-out",
          scrolled ? "opacity-100 backdrop-blur-md" : "opacity-0"
        )}
      />

      <Container className="flex h-header-height items-center justify-between">
        <Link
          href="/"
          aria-label={`${SITE.name} — home`}
          // `inline-flex` so the box hugs the mark: an inline SVG otherwise
          // sits on the text baseline and drags a descender's worth of space
          // below it, which throws the bar's vertical centring out.
          className={cn(INTERACTIVE, "inline-flex rounded-sm")}
        >
          <Wordmark className={WORDMARK} />
        </Link>

        <nav aria-label="Main" className="flex items-center gap-1">
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                INTERACTIVE,
                "tablet:block hidden rounded-full px-[18px] py-2 text-[13px]/4 text-solutio-text-muted hover:bg-solutio-ghost hover:text-white"
              )}
            >
              {label}
            </Link>
          ))}
          <Button variant="ghost" href="#contact">
            Talk to us
          </Button>
        </nav>
      </Container>
    </header>
  )
}
