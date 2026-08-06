"use client"

import { useEffect, useState } from "react"

/**
 * The current year, filled in on the client.
 *
 * The page is statically prerendered, so anything computed during render is
 * frozen into the HTML at build time — a year rendered on the server goes stale
 * on 1 January and stays stale until the next deploy. Computing it in an effect
 * costs a barely-visible fill-in, well below the fold, for a value that is
 * always right.
 *
 * Starting at `null` means the first client render matches the server's, so
 * hydration stays clean. The surrounding copy is written to read correctly
 * without the year, which is what crawlers and no-JS visitors get.
 */
export function CurrentYear() {
  const [year, setYear] = useState<number | null>(null)

  useEffect(() => {
    setYear(new Date().getFullYear())
  }, [])

  if (year === null) return null

  // Trailing space belongs here: without the year the line reads
  // "© Solutio." with correct spacing, and with it "© 2026 Solutio."
  return <span className="tabular-nums">{year} </span>
}
