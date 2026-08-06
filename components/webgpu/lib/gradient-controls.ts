import { uniform } from "three/tsl"

/**
 * Tweakable parameters for the gradient surfaces, as live uniforms.
 *
 * A single shared set rather than one per instance: every gradient on the page
 * is meant to be the same material, so tuning is a global decision. The dev
 * panel writes these; the shader reads them. Anything that would change the
 * node graph's *shape* — the number of colour points, the palette length —
 * deliberately stays a module constant, because changing it needs a shader
 * recompile rather than a uniform update.
 *
 * The defaults here are the shipped look. The dev panel only mutates them, so
 * production renders exactly this with no panel involved.
 */
export const gradientControls = {
  /** Global multiplier on every animation rate. */
  speed: uniform(4.2),
  /** Falloff radius of each tone. Larger blends softer. */
  radius: uniform(0.42),
  /** Strength of the fbm domain warp, in UV. */
  warp: uniform(0.18),
  /** Scale of the warp noise. Lower is broader and calmer. */
  warpScale: uniform(1.6),
  /** How fast the warp field itself churns. */
  warpSpeed: uniform(0.22),
  /** Extra warp added at full hover. */
  hoverWarp: uniform(0.1),

  /** Halftone cell size in CSS px, at a 900px reference height. */
  cellSize: uniform(8),
  /** Brightness of a lit bar, relative to the gradient beneath it. */
  barGain: uniform(1.35),
  /** How dark the gaps between bars go, relative to that same source. */
  barFloor: uniform(0.16),
  /**
   * Bias applied to the luminance driving bar width.
   *
   * Shifts the whole pattern denser or sparser without touching the palette,
   * which is the knob you actually reach for when the bars read too heavy.
   */
  barBias: uniform(0),
}

export type GradientControls = typeof gradientControls

/** Defaults, kept so the dev panel can seed its sliders from one source. */
export const GRADIENT_DEFAULTS = {
  speed: 4.2,
  radius: 0.42,
  warp: 0.18,
  warpScale: 1.6,
  warpSpeed: 0.22,
  hoverWarp: 0.1,
  cellSize: 8,
  barGain: 1.35,
  barFloor: 0.16,
  barBias: 0,
} as const
