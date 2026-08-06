"use client"

import { ReactLenis, useLenis } from "lenis/react"
import { useEffect, useState } from "react"
import { scrollTick } from "@/components/layout/smooth-scroll/tick"

/**
 * Smooth scrolling, driven from the render loop rather than its own RAF.
 *
 * `autoRaf` is off deliberately. drei's `View` positions each effect by reading
 * `getBoundingClientRect()` every frame, so if Lenis advances scroll on its own
 * RAF the two callbacks race: whichever browser schedules second wins, and the
 * views lag the page by a frame while scrolling. Ticking Lenis inside the
 * canvas's loop (see `LenisSync`) makes the order explicit — scroll is applied,
 * then views measure.
 */
export function SmoothScroll({ children }: { children: React.ReactNode }) {
  const reducedMotion = useReducedMotion()

  return (
    <ReactLenis
      root
      options={{
        autoRaf: false,
        // Frame-rate independent smoothing; lower is heavier.
        lerp: 0.12,
        wheelMultiplier: 1,
        touchMultiplier: 1.6,
        // Smoothing the wheel is exactly the motion this preference is about,
        // so hand scrolling back to the browser rather than easing it.
        smoothWheel: !reducedMotion,
      }}
    >
      <ScrollWatchdog />
      <AnchorScrolling reducedMotion={reducedMotion} />
      {children}
    </ReactLenis>
  )
}

/**
 * Drives Lenis if the canvas stops doing so.
 *
 * Without this, a renderer that fails to initialise takes the page's scrolling
 * down with it. The threshold is generous enough not to fight the canvas on a
 * slow frame, and short enough that a real failure is unnoticeable.
 */
function ScrollWatchdog() {
  const lenis = useLenis()

  useEffect(() => {
    if (!lenis) return

    let handle = 0
    const STALE_MS = 120

    const tick = (now: number) => {
      if (now - scrollTick.last > STALE_MS) lenis.raf(now)
      handle = requestAnimationFrame(tick)
    }

    handle = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(handle)
  }, [lenis])

  return null
}

function useReducedMotion() {
  const [reduced, setReduced] = useState(false)

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)")
    const update = () => setReduced(query.matches)

    update()
    query.addEventListener("change", update)
    return () => query.removeEventListener("change", update)
  }, [])

  return reduced
}

/**
 * Routes in-page anchor clicks through Lenis.
 *
 * Native `scroll-behavior: smooth` fights Lenis for control of the scroll
 * position, so it is disabled while Lenis is active — which would otherwise
 * leave the nav links jumping instantly. The offset mirrors the CSS
 * `scroll-margin-top`, read from the same token so the two cannot drift.
 */
function AnchorScrolling({ reducedMotion }: { reducedMotion: boolean }) {
  const lenis = useLenis()

  useEffect(() => {
    if (!lenis) return

    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0) return
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
        return

      const anchor = (event.target as HTMLElement | null)?.closest("a")
      const href = anchor?.getAttribute("href")
      if (!href?.startsWith("#") || href === "#") return

      const target = document.querySelector(href)
      if (!target) return

      event.preventDefault()

      const styles = getComputedStyle(document.documentElement)
      const headerHeight = Number.parseFloat(
        styles.getPropertyValue("--header-height")
      )
      const gap = Number.parseFloat(styles.getPropertyValue("--gap"))
      const offset = -(
        (Number.isNaN(headerHeight) ? 0 : headerHeight) +
        (Number.isNaN(gap) ? 0 : gap)
      )

      lenis.scrollTo(target as HTMLElement, {
        offset,
        ...(reducedMotion ? { immediate: true } : {}),
      })
      history.pushState(null, "", href)
    }

    document.addEventListener("click", onClick)
    return () => document.removeEventListener("click", onClick)
  }, [lenis, reducedMotion])

  return null
}
