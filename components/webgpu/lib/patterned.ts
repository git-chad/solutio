import { clamp, float, luminance, mix, smoothstep, vec3 } from "three/tsl"
import type { uniform } from "three/tsl"
import type { Node, Vector2 } from "three/webgpu"
import { candlesBar, candlesCell } from "@/components/webgpu/lib/candles"

/**
 * Halftone cell size in CSS px, at the reference height below.
 *
 * Authored against a fixed height and scaled from there, so the pattern keeps
 * its density rather than getting coarser on a taller surface.
 */
const CELL_SIZE = 8
const REFERENCE_HEIGHT = 900

/**
 * Default luminance window over which bars fade in.
 *
 * Surfaces override this, because their tonal ranges differ: the gradient runs
 * the full 0..1, while the graded photograph tops out around 0.44, so one
 * shared window would leave the hero with no pattern at all.
 */
const PATTERN_START = 0.34
const PATTERN_FULL = 0.72
/** Brightness of a lit bar, relative to its source. */
const PATTERN_GAIN = 1.35
/** How dark the gaps between bars go, relative to their source. */
const PATTERN_FLOOR = 0.16

export type PatternedOptions = {
  /** Evaluates the underlying field at an arbitrary UV. */
  field: (uv: Node) => Node
  /** Pixel size of the surface. */
  resolution: ReturnType<typeof uniform<Vector2>>
  /** UV of the pixel being shaded. */
  uv: Node
  /** Luminance at which bars begin to appear. */
  start?: number
  /** Luminance at which bars are fully present. */
  full?: number
}

/**
 * Composites the candles halftone over a field, in its lighter areas.
 *
 * This is the page's one visual rule: bright regions resolve into vertical
 * bars, dark regions stay smooth. Tying the pattern to luminance rather than to
 * an interaction means it reads as a property of the material itself, and it
 * gives the gradients and the hero photograph the same language.
 *
 * The field is sampled twice — once per pixel for the smooth base, and once at
 * each cell's centre for the bars. Quantising to the cell is what stops the
 * pattern from tracing the field's own contours: what you see is bars widening
 * across a grid, not a shape outlined in stipple. The field is arithmetic
 * rather than texture reads, so the second evaluation is cheap.
 */
export function patterned({
  field,
  resolution,
  uv,
  start = PATTERN_START,
  full = PATTERN_FULL,
}: PatternedOptions): Node {
  const base = vec3(field(uv))

  const cellSize = float(CELL_SIZE).mul(resolution.y).div(REFERENCE_HEIGHT)
  const { centre, localX } = candlesCell(uv, resolution, cellSize)

  const cellColor = vec3(field(centre))
  const cellLuma = luminance(cellColor)

  // Brighter cells get wider bars, and the pattern only exists at all above
  // PATTERN_START — so it emerges out of the highlights instead of being
  // switched on across the whole surface.
  const bar = candlesBar(cellLuma, localX)
  const presence = clamp(smoothstep(start, full, cellLuma), 0, 1)

  const patternColor = mix(
    cellColor.mul(PATTERN_FLOOR),
    cellColor.mul(PATTERN_GAIN),
    bar
  )

  return mix(base, patternColor, presence)
}
