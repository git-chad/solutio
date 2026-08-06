"use client"

import { useEffect, useMemo, useRef } from "react"
import { uniform } from "three/tsl"
import { Vector2 } from "three/webgpu"

/** Seconds for hover strength to reach full, and to return to zero. */
const HOVER_FADE = 0.5

export type Surface = {
  /** Attach to the element the effect covers. */
  ref: React.RefObject<HTMLDivElement | null>
  /** 0..1, eases while the pointer is over the element. */
  hover: ReturnType<typeof uniform<number>>
  /** Width / height of the element, so effects can keep shapes round. */
  aspect: ReturnType<typeof uniform<number>>
  /**
   * Pixel size of the element. Measured here rather than read from
   * `useThree().size`, which under a shared canvas reports the whole viewport.
   */
  resolution: ReturnType<typeof uniform<Vector2>>
  /** Advance the hover fade. Call once per frame. */
  tick: (delta: number) => void
}

/**
 * Tracks hover state and aspect ratio for an effect's DOM surface.
 *
 * Hover is read from the window and hit-tested against the element's rect
 * rather than bound to the element directly: these surfaces sit behind their
 * section's content, so pointer events land on the copy above them and never
 * bubble down. Tracking globally sidesteps the stacking, and leaves the surface
 * non-interactive so links and buttons over it still work.
 *
 * Aspect comes from a ResizeObserver rather than the renderer, because under a
 * shared canvas the renderer's size is the whole viewport, not this view.
 */
export function useSurface(): Surface {
  const ref = useRef<HTMLDivElement>(null)

  const { hover, aspect, resolution } = useMemo(
    () => ({
      hover: uniform(0),
      aspect: uniform(1),
      resolution: uniform(new Vector2(1, 1)),
    }),
    []
  )

  const hovering = useRef(false)
  const hoverValue = useRef(0)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    let rect = element.getBoundingClientRect()
    const measure = () => {
      rect = element.getBoundingClientRect()
      if (rect.width > 0 && rect.height > 0) {
        aspect.value = rect.width / rect.height
        resolution.value.set(rect.width, rect.height)
      }
    }
    measure()

    const onPointerMove = (event: PointerEvent) => {
      hovering.current =
        event.clientX >= rect.left &&
        event.clientX <= rect.right &&
        event.clientY >= rect.top &&
        event.clientY <= rect.bottom
    }

    const onPointerLeave = () => {
      hovering.current = false
    }

    const observer = new ResizeObserver(measure)
    observer.observe(element)

    window.addEventListener("pointermove", onPointerMove, { passive: true })
    window.addEventListener("scroll", measure, { passive: true })
    window.addEventListener("resize", measure, { passive: true })
    document.addEventListener("pointerleave", onPointerLeave, { passive: true })

    return () => {
      observer.disconnect()
      window.removeEventListener("pointermove", onPointerMove)
      window.removeEventListener("scroll", measure)
      window.removeEventListener("resize", measure)
      document.removeEventListener("pointerleave", onPointerLeave)
    }
  }, [aspect, resolution])

  return useMemo(
    () => ({
      ref,
      hover,
      aspect,
      resolution,
      tick(delta: number) {
        const direction = hovering.current ? 1 : -1
        hoverValue.current = Math.max(
          0,
          Math.min(1, hoverValue.current + (direction * delta) / HOVER_FADE)
        )
        hover.value = hoverValue.current
      },
    }),
    [hover, aspect, resolution]
  )
}
