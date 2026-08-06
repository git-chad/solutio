"use client"

import { ScreenQuad, View } from "@react-three/drei"
import { useFrame } from "@react-three/fiber"
import { useMemo } from "react"
import { positionGeometry, vec4 } from "three/tsl"
import { MeshBasicNodeMaterial } from "three/webgpu"
import {
  meshGradient,
  roundedRectMask,
} from "@/components/webgpu/lib/mesh-gradient"
import { type Surface, useSurface } from "@/components/webgpu/lib/use-surface"
import { cn } from "@/lib/styles/cn"

function GradientScene({
  surface,
  palette,
  radius,
}: {
  surface: Surface
  palette?: readonly string[]
  radius: number
}) {
  const material = useMemo(() => {
    const mat = new MeshBasicNodeMaterial()

    // ScreenQuad's vertices are already in clip space. Node materials would
    // otherwise run them through the view's camera; writing the position
    // straight through makes the quad fill exactly the view's scissor rect.
    mat.vertexNode = vec4(positionGeometry.xy, 0, 1)
    mat.colorNode = meshGradient({
      hover: surface.hover,
      aspect: surface.aspect,
      ...(palette ? { palette } : {}),
    })

    if (radius > 0) {
      mat.transparent = true
      mat.opacityNode = roundedRectMask(surface.resolution, radius)
    }

    return mat
  }, [surface.hover, surface.aspect, surface.resolution, palette, radius])

  useFrame((_state, delta) => {
    surface.tick(delta)
  })

  return <ScreenQuad material={material} />
}

/**
 * Animated mesh gradient, filling its container.
 *
 * Renders a tracked div plus a `<View>` that draws into the shared canvas at
 * that div's rect. The div itself stays empty and non-interactive — it exists
 * only to give the view a rect to follow, so content layered above it keeps
 * working normally.
 */
export function MeshGradient({
  className,
  palette,
  radius = 0,
}: {
  className?: string
  palette?: readonly string[]
  /**
   * Corner radius in px, cut in the shader.
   *
   * The shared canvas is not a descendant of the element it fills, so CSS
   * `border-radius` on that element cannot clip it. Pass the same value the
   * container uses — `--radius-panel` is 1.25rem, i.e. 20.
   */
  radius?: number
}) {
  const surface = useSurface()

  return (
    // `View` renders this element itself and tracks it. Its `track` prop is
    // accepted but discarded — it always follows its own element — so the
    // className has to go here rather than on a separate div.
    <View
      ref={surface.ref as React.RefObject<HTMLElement>}
      aria-hidden
      className={cn("pointer-events-none absolute inset-0", className)}
    >
      <GradientScene
        surface={surface}
        radius={radius}
        {...(palette ? { palette } : {})}
      />
    </View>
  )
}
