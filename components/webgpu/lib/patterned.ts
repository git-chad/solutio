import { clamp, float, luminance, mix, vec3 } from "three/tsl"
import type { uniform } from "three/tsl"
import type { Node, Vector2 } from "three/webgpu"
import { candlesBar, candlesCell } from "@/components/webgpu/lib/candles"
import { gradientControls } from "@/components/webgpu/lib/gradient-controls"

/** Cell size is authored against this height, then scaled with the surface. */
const REFERENCE_HEIGHT = 900

export type PatternedOptions = {
  /** Evaluates the underlying field at an arbitrary UV. */
  field: (uv: Node) => Node
  /** Pixel size of the surface. */
  resolution: ReturnType<typeof uniform<Vector2>>
  /** UV of the pixel being shaded. */
  uv: Node
}

/**
 * Renders a field *as* the candles halftone.
 *
 * The gradient is never drawn directly — it only supplies each cell's colour
 * and, through its luminance, that cell's bar width. So the surface is entirely
 * pattern: brighter regions produce wider bars, darker ones thinner, and the
 * gradient reads through the density rather than sitting behind it.
 *
 * The field is sampled once per cell rather than once per pixel, which is both
 * cheaper than the previous composite and the reason the pattern does not trace
 * the field's own contours — the grid, not the gradient, decides where edges
 * fall.
 */
export function patterned({ field, resolution, uv }: PatternedOptions): Node {
  const controls = gradientControls

  const cellSize = float(controls.cellSize)
    .mul(resolution.y)
    .div(REFERENCE_HEIGHT)
  const { centre, localX } = candlesCell(uv, resolution, cellSize)

  const cellColor = vec3(field(centre))
  const value = clamp(luminance(cellColor).add(controls.barBias), 0, 1)

  const bar = candlesBar(value, localX)

  return mix(
    cellColor.mul(controls.barFloor),
    cellColor.mul(controls.barGain),
    bar
  )
}
