import {
  cos,
  float,
  Fn,
  max,
  min,
  mx_fractal_noise_float,
  oneMinus,
  sin,
  smoothstep,
  time,
  uniform,
  vec2,
  vec3,
  viewportUV,
} from "three/tsl"
import { Color, type Node, type Vector2 } from "three/webgpu"

/**
 * Greyscale ramp, keeping the tonal *structure* of `banner-blur.webp` — the
 * placeholder this replaces — without its warmth. The source ran ivory at the
 * top left into deep slate at the bottom right; these are the luminances of
 * those stops, so the gradient still reads as the same image in mono.
 */
export const GRADIENT_PALETTE = [
  "#EDEDED",
  "#C4C4C4",
  "#8C8C8C",
  "#5A5A5A",
  "#2E2E2E",
  "#141414",
] as const

/**
 * Where each tone sits, and how it drifts.
 *
 * `home` is the rest position in UV; `drift` is the radius of its wander;
 * `speed` and `phase` desynchronise the points so the field never visibly
 * loops. Ordering runs light (top-left) to dark (bottom-right).
 */
const POINTS = [
  { home: [0.12, 0.12], drift: [0.14, 0.1], speed: 0.11, phase: 0.0 },
  { home: [0.42, 0.2], drift: [0.17, 0.12], speed: 0.14, phase: 1.7 },
  { home: [0.22, 0.62], drift: [0.15, 0.16], speed: 0.09, phase: 3.1 },
  { home: [0.72, 0.45], drift: [0.18, 0.13], speed: 0.12, phase: 4.6 },
  { home: [0.85, 0.78], drift: [0.14, 0.11], speed: 0.1, phase: 2.3 },
  { home: [0.55, 0.95], drift: [0.16, 0.09], speed: 0.13, phase: 5.4 },
] as const

/**
 * Global multiplier on every animation rate.
 *
 * The per-point speeds above are ratios to each other, chosen so the points
 * never fall into step. This is the single knob for how fast the whole field
 * moves.
 */
const SPEED = 4.2
/** Falloff radius of each tone. Larger blends softer. */
const RADIUS = 0.42
/** Strength of the fbm domain warp, in UV. */
const WARP = 0.18
/** Scale of the warp noise. Lower is broader and calmer. */
const WARP_SCALE = 1.6
/** How fast the warp field itself churns. */
const WARP_SPEED = 0.22
/** Extra warp added at full hover. */
const HOVER_WARP = 0.1
/** Dither amplitude. Enough to break banding, below the threshold of vision. */
const DITHER = 0.004

export type MeshGradientOptions = {
  /** 0..1 hover strength; nudges the warp so the field stirs under the cursor. */
  hover: ReturnType<typeof uniform<number>>
  /** Aspect ratio of the surface, so the blobs stay round. */
  aspect: ReturnType<typeof uniform<number>>
  /** Overrides the default palette. Must be six sRGB hex strings. */
  palette?: readonly string[]
}

/**
 * The type any TSL math operation returns. Accumulators have to be declared as
 * this rather than inferred from their `float(0)` seed, whose narrower
 * `ConstNode` type will not accept the `OperatorNode` an `.add()` produces.
 */
type MathNode = ReturnType<ReturnType<typeof float>["add"]>

/**
 * Animated greyscale mesh gradient.
 *
 * Six tone points drift on independent lissajous paths; each pixel is a
 * weighted average of them, with weights falling off by squared distance and
 * normalised so the field stays smooth everywhere. The sample position is
 * domain-warped by fbm first, which is what turns concentric blobs into the
 * folded, marbled shapes a mesh gradient is supposed to have.
 *
 * Returns a builder rather than a node, because the pattern layer has to
 * evaluate the same field again at halftone cell centres. Colours go through
 * `Color`, which decodes the sRGB hex into the linear working space the shader
 * maths runs in.
 */
export function createMeshGradient({
  hover,
  aspect,
  palette = GRADIENT_PALETTE,
}: MeshGradientOptions) {
  const colors = palette.map((hex) => uniform(new Color(hex)))

  /** Evaluates the field at an arbitrary UV. */
  return (uvCoord: Node): MathNode => {
    const aspected = vec2(vec2(uvCoord).x.mul(float(aspect)), vec2(uvCoord).y)

    /**
     * Domain warp. Two octaves of fbm offset the lookup, so the iso-contours of
     * the distance field fold into each other instead of staying circular.
     */
    const warpAmount = float(WARP).add(float(hover).mul(HOVER_WARP))
    const warp = vec2(
      mx_fractal_noise_float(
        vec3(aspected.mul(WARP_SCALE), time.mul(WARP_SPEED * SPEED)),
        2,
        2,
        0.5
      ),
      mx_fractal_noise_float(
        vec3(
          aspected.mul(WARP_SCALE).add(19.7),
          time.mul(WARP_SPEED * SPEED * 0.9)
        ),
        2,
        2,
        0.5
      )
    ).mul(warpAmount)

    const sample = aspected.add(warp)

    // Accumulate colour and weight separately and divide at the end, so the
    // result does not depend on how many points happen to overlap here.
    let weightSum: MathNode = float(0).add(0)
    let colorSum: MathNode = vec3(0).add(0)

    POINTS.forEach((point, index) => {
      const color = colors[index]
      if (!color) return

      const t = time.mul(point.speed * SPEED).add(point.phase)
      const position = vec2(
        float(point.home[0]).add(sin(t).mul(point.drift[0])).mul(float(aspect)),
        float(point.home[1]).add(cos(t.mul(1.3)).mul(point.drift[1]))
      )

      // Inverse-square falloff with a floor, so every point contributes
      // everywhere and the field never has a dead spot.
      const distance = sample.sub(position).length()
      const weight = float(1).div(
        distance
          .mul(distance)
          .div(RADIUS * RADIUS)
          .add(0.06)
      )

      weightSum = weightSum.add(weight)
      colorSum = colorSum.add(vec3(color).mul(weight))
    })

    return colorSum.div(weightSum)
  }
}

/**
 * Sub-LSB noise, added once at the end of a composite.
 *
 * Smooth dark gradients band badly in 8-bit output — the dark end of this ramp
 * is exactly where that shows. Offsetting each pixel slightly breaks the
 * contours into stipple the eye integrates away.
 */
export function dither(): Node {
  return mx_fractal_noise_float(
    vec3(viewportUV.mul(900), time.mul(2)),
    1,
    2,
    0.5
  ).mul(DITHER)
}

/**
 * Alpha mask for a rounded rectangle filling the view.
 *
 * The shared canvas sits behind the page, so an element that wants the gradient
 * has to be transparent down to it — which means CSS `border-radius` and
 * `overflow: hidden` on that element cannot clip the effect, since the canvas
 * is not its descendant. The corners have to be cut in the shader instead.
 *
 * Standard rounded-box SDF, antialiased across roughly one pixel.
 */
export function roundedRectMask(
  resolution: ReturnType<typeof uniform<Vector2>>,
  radiusPx: number
): Node {
  return Fn(() => {
    const half = vec2(resolution).mul(0.5)
    const point = viewportUV.sub(0.5).mul(vec2(resolution))
    const corner = point.abs().sub(half).add(radiusPx)

    const distance = min(max(corner.x, corner.y), 0)
      .add(max(corner, vec2(0, 0)).length())
      .sub(radiusPx)

    return oneMinus(smoothstep(-1, 1, distance))
  })()
}
