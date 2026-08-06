"use client"

import { DialRoot, useDialKit } from "dialkit"
// Imported here rather than in the global sheet: dialkit's stylesheet starts
// with an `@import url(...)` for its own font, and CSS requires every @import
// to precede all rules — bundling it after our resets breaks the parse.
import "dialkit/styles.css"
import { useEffect } from "react"
import {
  GRADIENT_DEFAULTS as D,
  gradientControls,
} from "@/components/webgpu/lib/gradient-controls"

/**
 * Live controls for the gradient surfaces.
 *
 * Writes straight into the shader's uniforms, so nothing recompiles and nothing
 * re-renders — dragging a slider updates the value the next frame reads. The
 * defaults come from the same object the shader falls back to, so the panel
 * always opens showing exactly what production renders.
 *
 * `DialRoot` returns null outside development on its own, so there is no
 * separate production path to keep in sync.
 */
export function Dials() {
  const gradient = useDialKit("Gradient", {
    // [default, min, max, step]
    speed: [D.speed, 0, 20, 0.1],
    radius: [D.radius, 0.05, 1.5, 0.01],
    warp: [D.warp, 0, 0.8, 0.005],
    warpScale: [D.warpScale, 0.2, 6, 0.05],
    warpSpeed: [D.warpSpeed, 0, 1.5, 0.01],
    hoverWarp: [D.hoverWarp, 0, 0.5, 0.005],
  })

  const pattern = useDialKit("Pattern", {
    cellSize: [D.cellSize, 2, 40, 1],
    barGain: [D.barGain, 0, 4, 0.05],
    barFloor: [D.barFloor, 0, 1, 0.01],
    barBias: [D.barBias, -0.5, 0.5, 0.01],
  })

  useEffect(() => {
    gradientControls.speed.value = gradient.speed
    gradientControls.radius.value = gradient.radius
    gradientControls.warp.value = gradient.warp
    gradientControls.warpScale.value = gradient.warpScale
    gradientControls.warpSpeed.value = gradient.warpSpeed
    gradientControls.hoverWarp.value = gradient.hoverWarp
  }, [gradient])

  useEffect(() => {
    gradientControls.cellSize.value = pattern.cellSize
    gradientControls.barGain.value = pattern.barGain
    gradientControls.barFloor.value = pattern.barFloor
    gradientControls.barBias.value = pattern.barBias
  }, [pattern])

  return <DialRoot position="bottom-right" theme="dark" />
}
