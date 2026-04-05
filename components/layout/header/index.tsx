"use client"

import { Link } from "@/components/ui/link"
import { Button } from "@/components/ui/button"

export function Header() {
  return (
    <header className="absolute top-0 left-0 z-10 flex w-full items-center justify-between px-12 py-8">
      <Link href="/" className="font-serif text-white text-xl/6 tracking-[-0.3px]">
        Solutio
      </Link>

      <nav className="flex items-center gap-1">
        <Link
          href="#about"
          className="rounded-full px-[18px] py-2 text-[13px]/4 text-solutio-text-muted transition-colors hover:text-white"
        >
          About
        </Link>
        <Link
          href="#services"
          className="rounded-full px-[18px] py-2 text-[13px]/4 text-solutio-text-muted transition-colors hover:text-white"
        >
          Services
        </Link>
        <Button variant="ghost" href="#contact">
          Talk to us
        </Button>
      </nav>
    </header>
  )
}
