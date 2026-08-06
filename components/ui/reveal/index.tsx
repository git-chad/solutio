"use client"

import { useEffect, useRef } from "react"
import { resolveAs } from "@/components/ui/polymorphic"
import { cn } from "@/lib/styles/cn"

/**
 * How far into the viewport an element must be before it reveals.
 *
 * Triggering at the very edge fires while the element is still a sliver, so the
 * animation is mostly over by the time it is properly on screen. Shrinking the
 * root's bottom edge makes it wait until a meaningful amount is visible.
 */
const ROOT_MARGIN = "0px 0px -120px 0px"

type Revealed = (element: HTMLElement) => void

/**
 * One observer for the whole page rather than one per element.
 *
 * Each `IntersectionObserver` is cheap but not free, and a page of staggered
 * children would otherwise create dozens. Sharing one also means the browser
 * batches all the intersection work into a single callback.
 */
let observer: IntersectionObserver | null = null
const callbacks = new WeakMap<Element, Revealed>()

function getObserver() {
  if (observer) return observer

  observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue

        const element = entry.target as HTMLElement
        callbacks.get(element)?.(element)
        callbacks.delete(element)
        // Reveals run once. Unobserving immediately keeps the observer's
        // element set from growing for the life of the page.
        observer?.unobserve(element)
      }
    },
    { rootMargin: ROOT_MARGIN }
  )

  return observer
}

type RevealProps = React.ComponentPropsWithoutRef<"div"> & {
  as?: React.ElementType
  /** Stagger offset in ms. Use the index when mapping over a list. */
  delay?: number
}

/**
 * Reveals its children as they scroll into view: a slow rise out of a soft
 * blur, easing to rest.
 *
 * Movement is `opacity` and `transform` only, which the compositor can run
 * without repainting. The blur bridges the arrival, and is kept small — see the
 * `reveal` utility for why the radius matters more than it looks.
 *
 * `will-change` is set while the element is waiting and cleared the moment its
 * transition finishes. Left on permanently it would pin a compositor layer per
 * element for the life of the page, which on a page this long costs more memory
 * than the animation saves.
 */
export function Reveal({
  as,
  delay = 0,
  className,
  style,
  ...props
}: RevealProps) {
  const Component = resolveAs(as, "div")
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    // Matches the CSS guard: without scripting nothing here runs, and the
    // content must stay visible rather than sitting at opacity 0 forever.
    if (!document.documentElement.classList.contains("js")) return

    const clearHint = () => {
      element.style.willChange = "auto"
    }

    element.style.willChange = "opacity, transform, filter"

    callbacks.set(element, () => {
      element.dataset.revealed = ""
      element.addEventListener("transitionend", clearHint, { once: true })
    })
    getObserver().observe(element)

    return () => {
      callbacks.delete(element)
      observer?.unobserve(element)
      element.removeEventListener("transitionend", clearHint)
    }
  }, [])

  return (
    <Component
      ref={ref}
      className={cn("reveal", className)}
      style={{ ...style, ...(delay ? { "--reveal-delay": `${delay}ms` } : {}) }}
      {...props}
    />
  )
}
