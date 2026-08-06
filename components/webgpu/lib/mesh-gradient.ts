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
 * Palette sampled from `banner-blur.webp`, the placeholder this replaces.
 *
 * The source runs warm ivory and sand through the upper left into cool slate
 * at the lower right. Keeping that warm-to-cool diagonal is what makes the
 * generated version read as the same image rather than merely the same hues.
 */
export const GRADIENT_PALETTE = [
  "#F5F1DE", // ivory
  "#E6CBA9", // sand
  "#B27E60", // terracotta
  "#5F5450", // taupe
  "#2A333D", // slate
  "#141C25", // deep slate
] as const

/**
 * Where each colour sits, and how it drifts.
 *
 * `home` is the rest position in UV; `drift` is the radius of its wander;
 * `speed` and `phase` desynchronise the points so the field never visibly
 * loops. Ordering runs warm (top-left) to cool (bottom-right).
 */
const POINTS = [
  { home: [0.12, 0.12], drift: [0.1, 0.07], speed: 0.11, phase: 0.0 },
  { home: [0.42, 0.2], drift: [0.13, 0.09], speed: 0.14, phase: 1.7 },
  { home: [0.22, 0.62], drift: [0.11, 0.12], speed: 0.09, phase: 3.1 },
  { home: [0.72, 0.45], drift: [0.14, 0.1], speed: 0.12, phase: 4.6 },
  { home: [0.85, 0.78], drift: [0.1, 0.08], speed: 0.1, phase: 2.3 },
  { home: [0.55, 0.95], drift: [0.12, 0.06], speed: 0.13, phase: 5.4 },
] as const

/** Falloff radius of each colour point. Larger blends softer. */
const RADIUS = 0.42
/** Strength of the fbm domain warp, in UV. */
const WARP = 0.16
/** Scale of the warp noise. Lower is broader and calmer. */
const WARP_SCALE = 1.6
/** Extra warp added at full hover. */
const HOVER_WARP = 0.09
/** Dither amplitude. Enough to break banding, below the threshold of vision. */
const DITHER = 0.004

/**
 * The type any TSL math operation returns. Accumulators have to be declared as
 * this rather than inferred from their `float(0)` seed, whose narrower
 * `ConstNode` type will not accept the `OperatorNode` an `.add()` produces.
 */
type MathNode = ReturnType<ReturnType<typeof float>["add"]>

export type MeshGradientOptions = {
  /** 0..1 hover strength; nudges the warp so the field stirs under the cursor. */
  hover: ReturnType<typeof uniform<number>>
  /** Aspect ratio of the surface, so the blobs stay round. */
  aspect: ReturnType<typeof uniform<number>>
  /** Overrides the default palette. Must be six sRGB hex strings. */
  palette?: readonly string[]
}

/**
 * Animated mesh gradient.
 *
 * Six colour points drift on independent lissajous paths; each pixel is a
 * weighted average of them, with weights falling off by squared distance and
 * normalised so the field stays smooth and fully saturated everywhere. The
 * sample position is domain-warped by fbm first, which is what turns concentric
 * blobs into the folded, marbled shapes a mesh gradient is supposed to have.
 *
 * Colours go through `Color`, which decodes the sRGB hex into the linear
 * working space the shader maths runs in — writing hex-derived floats directly
 * would render noticeably washed out once the renderer re-encodes on output.
 */
export function meshGradient({
  hover,
  aspect,
  palette = GRADIENT_PALETTE,
}: MeshGradientOptions): Node {
  const colors = palette.map((hex) => uniform(new Color(hex)))

  return Fn(() => {
    // Correct for the surface's aspect so the blobs are round, not stretched.
    const uvCoord = vec2(viewportUV.x.mul(float(aspect)), viewportUV.y)

    /**
     * Domain warp. Two octaves of fbm offset the lookup, so the iso-contours of
     * the distance field fold into each other instead of staying circular.
     */
    const warpAmount = float(WARP).add(float(hover).mul(HOVER_WARP))
    const warp = vec2(
      mx_fractal_noise_float(
        vec3(uvCoord.mul(WARP_SCALE), time.mul(0.05)),
        2,
        2,
        0.5
      ),
      mx_fractal_noise_float(
        vec3(uvCoord.mul(WARP_SCALE).add(19.7), time.mul(0.045)),
        2,
        2,
        0.5
      )
    ).mul(warpAmount)

    const sample = uvCoord.add(warp)

    // Weighted average over the drifting points. Accumulating colour and weight
    // separately and dividing at the end keeps the result independent of how
    // many points happen to overlap here.
    let weightSum: MathNode = float(0).add(0)
    let colorSum: MathNode = vec3(0).add(0)

    POINTS.forEach((point, index) => {
      const color = colors[index]
      if (!color) return

      const t = time.mul(point.speed).add(point.phase)
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

    const blended = colorSum.div(weightSum)

    /**
     * Ordered-ish dither.
     *
     * Smooth dark gradients band badly in 8-bit output — the slate end of this
     * palette is exactly where that shows. A sub-LSB noise offset breaks the
     * contours into stipple the eye integrates away.
     */
    const dither = mx_fractal_noise_float(
      vec3(viewportUV.mul(900), time.mul(2)),
      1,
      2,
      0.5
    ).mul(DITHER)

    return blended.add(dither)
  })()
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
