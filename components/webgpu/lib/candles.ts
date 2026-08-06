import { abs, clamp, float, floor, fract, step, vec2 } from "three/tsl"
import type { Node } from "three/webgpu"

/**
 * Candles halftone.
 *
 * Ported from `@basementstudio/shader-lab`'s `candles` pattern preset. That
 * implementation fetches four 16px SVGs, rasterises them into a canvas atlas
 * and binarises the result; each cell is a centred vertical bar 2, 6, 10 or
 * 14px wide.
 *
 * Because the widths are an arithmetic sequence (`2 + 4n`) we derive them
 * directly, which drops the SVG fetch and the atlas canvas, is resolution
 * independent, and costs no extra texture sample.
 *
 * These are plain node-graph builders rather than `Fn()` shader functions —
 * they are called once at material construction, so there is nothing to gain
 * from a callable shader function, and `Fn` cannot return a struct here.
 */

/** Geometry of the original atlas cell, in px. */
const CELL_PX = 16
const BASE_BAR_PX = 2
const BAR_STEP_PX = 4
/** Number of distinct bar widths. */
const LEVELS = 4

/**
 * Coverage (0 or 1) of the candle bar for a pixel sitting at `localX` (0..1
 * across its cell), given a `value` in 0..1 — normally source luminance.
 *
 * Brighter input produces a wider bar. Invert `value` to flip that.
 */
export function candlesBar(value: Node, localX: Node) {
  const level = clamp(floor(float(value).mul(LEVELS)), 0, LEVELS - 1)
  const barWidth = level.mul(BAR_STEP_PX).add(BASE_BAR_PX).div(CELL_PX)

  // Distance from the cell centre, so the bar widens symmetrically.
  const distance = abs(float(localX).sub(0.5))

  return step(distance, barWidth.mul(0.5))
}

/**
 * Splits `uvCoord` into a grid of `cellSize`-px cells across `resolution`.
 *
 * `centre` is the UV of the cell's midpoint — sample the source there so the
 * pattern reads as a halftone of blocks rather than of individual pixels.
 * `localX` is the horizontal position within the cell, 0..1.
 */
export function candlesCell(uvCoord: Node, resolution: Node, cellSize: Node) {
  const pixels = vec2(uvCoord).mul(vec2(resolution))
  const cell = floor(pixels.div(float(cellSize)))

  return {
    centre: cell.add(0.5).mul(float(cellSize)).div(vec2(resolution)),
    localX: fract(pixels.x.div(float(cellSize))),
  }
}
