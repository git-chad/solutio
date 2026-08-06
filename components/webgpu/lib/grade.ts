import { float, luminance, max, mix, pow, uniform, vec3 } from "three/tsl"
import { Color, type Node } from "three/webgpu"

/**
 * Shipped values for the output grade.
 *
 * Not neutral: brightness pulls the whole surface well down so the halftone
 * sits back and the copy over it stays dominant.
 */
export const GRADE_DEFAULTS = {
  /** Linear multiplier. 1 leaves the image alone. */
  brightness: 0.45,
  /** Expansion around mid-grey. Above 1 pushes darks down and lights up. */
  contrast: 1.1,
  /** Power curve. Below 1 lifts shadows, above 1 deepens them. */
  gamma: 1.11,
  /** 0 is fully greyscale, 1 leaves saturation alone, above 1 exaggerates. */
  saturation: 1,
  /** How much of the tint colour is applied, 0..1. */
  tintAmount: 0,
  /** Colour multiplied in at full `tintAmount`. */
  tint: "#FFFFFF",
} as const

/**
 * Output grade for the gradient surfaces, as live uniforms.
 *
 * Separate from `gradientControls` because this is about the finished pixel
 * rather than the field that produced it — it applies after the halftone, so
 * brightness moves the whole surface rather than only the lit bars.
 */
export const gradeControls = {
  brightness: uniform<number>(GRADE_DEFAULTS.brightness),
  contrast: uniform<number>(GRADE_DEFAULTS.contrast),
  gamma: uniform<number>(GRADE_DEFAULTS.gamma),
  saturation: uniform<number>(GRADE_DEFAULTS.saturation),
  tintAmount: uniform<number>(GRADE_DEFAULTS.tintAmount),
  tint: uniform(new Color(GRADE_DEFAULTS.tint)),
}

/** Mid-grey, the point contrast expands around. */
const PIVOT = 0.5

/**
 * Applies the output grade.
 *
 * Order is the conventional one and it matters: gain before contrast before
 * gamma, then saturation, then tint. Contrast expands around mid-grey, so
 * running it before brightness would make the two knobs fight — the pivot would
 * sit somewhere different depending on how bright the image already was.
 *
 * Values are floored at zero before `pow`, because a negative base with a
 * fractional exponent is undefined and shows up as NaN pixels — which read as
 * black or, on some drivers, as garbage.
 */
export function grade(color: Node): Node {
  const controls = gradeControls

  const brightened = vec3(color).mul(controls.brightness)
  const contrasted = brightened.sub(PIVOT).mul(controls.contrast).add(PIVOT)
  const gammaed = pow(max(contrasted, vec3(0, 0, 0)), controls.gamma)

  const saturated = mix(
    vec3(luminance(gammaed)),
    gammaed,
    float(controls.saturation)
  )

  return mix(saturated, saturated.mul(controls.tint), controls.tintAmount)
}
