"use client"

import { useEffect, useMemo, useRef } from "react"
import { uniform } from "three/tsl"
import { Vector2 } from "three/webgpu"

/** Number of trail samples fed to the shader. */
export const TRAIL_LENGTH = 12

/**
 * How far the head chases the real cursor each frame, as a fraction of the
 * remaining distance at 60fps. Lower is heavier.
 */
const HEAD_EASE = 0.18
/** How fast each sample hands its position down the chain. Lower is longer. */
const TAIL_EASE = 0.13
/** Seconds for hover strength to reach full, and to return to zero. */
const HOVER_FADE = 0.45

export type PointerTrail = {
  /** Attach to the element the effect covers. */
  ref: React.RefObject<HTMLDivElement | null>
  /** Trail positions in UV space, index 0 is the head. */
  points: ReturnType<typeof uniform<Vector2>>[]
  /** 0..1, eases in while the pointer is over the element. */
  strength: ReturnType<typeof uniform<number>>
  /** Advance the simulation. Call once per frame with the frame delta. */
  update: (delta: number) => void
}

/**
 * A deliberately cheap stand-in for a fluid sim.
 *
 * Rather than advecting a velocity field through a pressure solve, this keeps a
 * short chain of points that each ease toward the one ahead of them. The head
 * lags the real cursor, so fast movement stretches the chain and slow movement
 * bunches it up — which is the part of fluid motion that actually reads at a
 * glance. Cost is one distance and one smoothstep per point in the shader, no
 * render targets and no per-frame GPU passes.
 *
 * Upgrade path if it needs real momentum: swap the chain for a ping-pong render
 * target that advects and decays, and sample that texture instead. The shader
 * only consumes `points` and `strength`, so nothing else has to change.
 */
export function usePointerTrail(): PointerTrail {
  const ref = useRef<HTMLDivElement>(null)

  const { points, strength } = useMemo(
    () => ({
      points: Array.from({ length: TRAIL_LENGTH }, () =>
        uniform(new Vector2(0.5, 0.5))
      ),
      strength: uniform(0),
    }),
    []
  )

  // Written by pointer events, read by the frame loop. Refs rather than state,
  // so moving the mouse never triggers a React render.
  const target = useRef({ x: 0.5, y: 0.5 })
  const chain = useRef(
    Array.from({ length: TRAIL_LENGTH }, () => ({ x: 0.5, y: 0.5 }))
  )
  const hovering = useRef(false)
  const hoverValue = useRef(0)
  const seeded = useRef(false)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    /**
     * Listen on the window rather than on `element`.
     *
     * The canvas sits behind the hero copy as a *sibling*, not an ancestor, so
     * pointer events over the headline are delivered to the text and never
     * bubble to it — hovering the middle of the hero would do nothing. Tracking
     * globally and hit-testing the rect ourselves sidesteps the stacking
     * entirely, and keeps the canvas non-interactive so the CTA stays clickable.
     */
    let rect = element.getBoundingClientRect()
    const measure = () => {
      rect = element.getBoundingClientRect()
    }

    const onPointerMove = (event: PointerEvent) => {
      if (rect.width === 0 || rect.height === 0) return

      const inside =
        event.clientX >= rect.left &&
        event.clientX <= rect.right &&
        event.clientY >= rect.top &&
        event.clientY <= rect.bottom

      hovering.current = inside
      if (!inside) return

      const x = (event.clientX - rect.left) / rect.width
      // `screenUV`, which consumes these, is y-down like clientY — so no flip.
      const y = (event.clientY - rect.top) / rect.height

      target.current = { x, y }

      // Snap the whole chain to the first real position, otherwise the trail
      // whips across the element from its centre seed on first movement.
      if (!seeded.current) {
        seeded.current = true
        for (const point of chain.current) {
          point.x = x
          point.y = y
        }
      }
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
  }, [])

  const update = useMemo(
    () => (delta: number) => {
      // Normalise easing to 60fps so the feel does not change with refresh
      // rate, and clamp so a backgrounded tab does not teleport the chain.
      const frames = Math.min(delta, 0.1) * 60

      const head = chain.current[0]
      if (!head) return
      head.x += (target.current.x - head.x) * Math.min(1, HEAD_EASE * frames)
      head.y += (target.current.y - head.y) * Math.min(1, HEAD_EASE * frames)

      for (let i = 1; i < chain.current.length; i++) {
        const point = chain.current[i]
        const ahead = chain.current[i - 1]
        if (!(point && ahead)) continue
        point.x += (ahead.x - point.x) * Math.min(1, TAIL_EASE * frames)
        point.y += (ahead.y - point.y) * Math.min(1, TAIL_EASE * frames)
      }

      const direction = hovering.current ? 1 : -1
      hoverValue.current = Math.max(
        0,
        Math.min(1, hoverValue.current + (direction * delta) / HOVER_FADE)
      )

      for (const [i, point] of chain.current.entries()) {
        points[i]?.value.set(point.x, point.y)
      }
      strength.value = hoverValue.current
    },
    [points, strength]
  )

  return { ref, points, strength, update }
}
