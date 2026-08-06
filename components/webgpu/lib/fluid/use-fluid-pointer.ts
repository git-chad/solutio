"use client"

import { useEffect, useMemo, useRef } from "react"
import { uniform } from "three/tsl"
import { Vector2 } from "three/webgpu"

/** Seconds for hover strength to reach full, and to return to zero. */
const HOVER_FADE = 0.4
/** Dye injected per splat, scaled by hover strength. */
const DYE_AMOUNT = 0.55
/** Pointer movement below this (in UV) is treated as noise and ignored. */
const MIN_MOVEMENT = 0.0005

export type FluidPointer = {
  /** Attach to the element the effect covers. */
  ref: React.RefObject<HTMLDivElement | null>
  /**
   * Pixel size of the tracked element.
   *
   * Measured here rather than read from `useThree().size`, which under a shared
   * canvas reports the whole viewport rather than this view's rect.
   */
  resolution: ReturnType<typeof uniform<Vector2>>
  /**
   * Drain the movement accumulated since the last frame, or null if the pointer
   * has not moved. Returns UV position and UV delta.
   */
  consume: () => { point: Vector2; delta: Vector2; amount: number } | null
  /** Advance the hover fade. Call once per frame. */
  tick: (delta: number) => void
}

/**
 * Pointer tracking for the fluid simulation.
 *
 * Listens on the window and hit-tests the element's rect rather than binding to
 * the element itself: the effect sits behind the hero copy, so pointer events
 * over the headline are delivered to the text and never bubble down to it.
 * Tracking globally sidesteps the stacking, and keeps the surface
 * non-interactive so the CTA above it stays clickable.
 */
export function useFluidPointer(): FluidPointer {
  const ref = useRef<HTMLDivElement>(null)
  const resolution = useMemo(() => uniform(new Vector2(1, 1)), [])

  const state = useRef({
    point: new Vector2(0.5, 0.5),
    delta: new Vector2(0, 0),
    moved: false,
    hovering: false,
    hoverValue: 0,
  })

  useEffect(() => {
    const element = ref.current
    if (!element) return

    let rect = element.getBoundingClientRect()
    const measure = () => {
      rect = element.getBoundingClientRect()
      if (rect.width > 0 && rect.height > 0) {
        resolution.value.set(rect.width, rect.height)
      }
    }
    measure()

    const onPointerMove = (event: PointerEvent) => {
      if (rect.width === 0 || rect.height === 0) return

      const inside =
        event.clientX >= rect.left &&
        event.clientX <= rect.right &&
        event.clientY >= rect.top &&
        event.clientY <= rect.bottom

      state.current.hovering = inside
      if (!inside) return

      const x = (event.clientX - rect.left) / rect.width
      // The simulation's render targets are sampled with y-up UVs, so flip.
      const y = 1 - (event.clientY - rect.top) / rect.height

      const dx = x - state.current.point.x
      const dy = y - state.current.point.y
      state.current.point.set(x, y)

      if (Math.abs(dx) < MIN_MOVEMENT && Math.abs(dy) < MIN_MOVEMENT) return

      // Accumulate rather than overwrite: several pointer events can land
      // between two frames and each one carries real momentum.
      state.current.delta.x += dx
      state.current.delta.y += dy
      state.current.moved = true
    }

    const onPointerLeave = () => {
      state.current.hovering = false
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
  }, [resolution])

  return useMemo(
    () => ({
      ref,
      resolution,
      consume() {
        const current = state.current
        if (!current.moved) return null

        const result = {
          point: current.point.clone(),
          delta: current.delta.clone(),
          amount: DYE_AMOUNT * current.hoverValue,
        }
        current.delta.set(0, 0)
        current.moved = false

        return result
      },
      tick(delta: number) {
        const current = state.current
        const direction = current.hovering ? 1 : -1
        current.hoverValue = Math.max(
          0,
          Math.min(1, current.hoverValue + (direction * delta) / HOVER_FADE)
        )
      },
    }),
    [resolution]
  )
}
