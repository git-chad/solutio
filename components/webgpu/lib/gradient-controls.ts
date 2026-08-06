import { uniform } from "three/tsl"

/**
 * Shipped values for the gradient surfaces.
 *
 * The uniforms below are built from this object rather than repeating the
 * numbers, so the shader's fallback and the dev panel's slider defaults cannot
 * drift apart — the panel always opens showing exactly what production renders.
 */
export const GRADIENT_DEFAULTS = {
  /** Global multiplier on every animation rate. */
  speed: 2,
  /**
   * Falloff radius of each tone.
   *
   * Small values make the weights collapse toward whichever point is nearest,
   * which is what turns the field from a soft blend into distinct marbled
   * regions.
   */
  radius: 0.05,
  /** Strength of the fbm domain warp, in UV. */
  warp: 0.8,
  /** Scale of the warp noise. Lower is broader and calmer. */
  warpScale: 2.4,
  /** How fast the warp field itself churns. */
  warpSpeed: 0.22,
  /** Extra warp added at full hover. */
  hoverWarp: 0.1,

  /** Halftone cell size in CSS px, at a 900px reference height. */
  cellSize: 29,
  /** Brightness of a lit bar, relative to the gradient beneath it. */
  barGain: 1.45,
  /** How dark the gaps between bars go, relative to that same source. */
  barFloor: 0.1,
  /**
   * Bias applied to the luminance driving bar width.
   *
   * Shifts the whole pattern denser or sparser without touching the palette,
   * which is the knob you actually reach for when the bars read too heavy.
   */
  barBias: -0.08,
} as const

/**
 * Tweakable parameters for the gradient surfaces, as live uniforms.
 *
 * A single shared set rather than one per instance: every gradient on the page
 * is meant to be the same material, so tuning is a global decision. The dev
 * panel writes these; the shader reads them.
 *
 * Anything that would change the node graph's *shape* — the number of colour
 * points, the palette length — deliberately stays a module constant, because
 * changing it needs a shader recompile rather than a uniform update.
 */
export const gradientControls = {
  speed: uniform<number>(GRADIENT_DEFAULTS.speed),
  radius: uniform<number>(GRADIENT_DEFAULTS.radius),
  warp: uniform<number>(GRADIENT_DEFAULTS.warp),
  warpScale: uniform<number>(GRADIENT_DEFAULTS.warpScale),
  warpSpeed: uniform<number>(GRADIENT_DEFAULTS.warpSpeed),
  hoverWarp: uniform<number>(GRADIENT_DEFAULTS.hoverWarp),

  cellSize: uniform<number>(GRADIENT_DEFAULTS.cellSize),
  barGain: uniform<number>(GRADIENT_DEFAULTS.barGain),
  barFloor: uniform<number>(GRADIENT_DEFAULTS.barFloor),
  barBias: uniform<number>(GRADIENT_DEFAULTS.barBias),
}

export type GradientControls = typeof gradientControls
