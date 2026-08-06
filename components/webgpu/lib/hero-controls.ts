import { uniform } from "three/tsl"

/**
 * Tweakable parameters for the hero, as live uniforms.
 *
 * Same arrangement as `gradientControls`: the dev panel writes these, the
 * shader reads them, and the defaults here are what production renders.
 */
export const heroControls = {
  /** Flat multiplier on the photograph. Below 1 it reads darker and less hazy. */
  exposure: uniform(0.44),
  /** Gamma on the photo. Above 1 deepens shadows without crushing highlights. */
  contrast: uniform(1.35),

  /**
   * How far the nearest parts of the image slide, as a fraction of width.
   *
   * Small numbers go a long way — beyond about 0.05 the UV shear starts
   * smearing edges rather than reading as depth.
   */
  parallax: uniform(0.022),
  /**
   * The depth that stays put, 0..1.
   *
   * Everything nearer than this moves with the pointer and everything further
   * moves against it, which is what produces motion parallax rather than a
   * whole-image pan.
   */
  parallaxPivot: uniform(0.45),
  /**
   * Inward zoom, as a fraction, reserving margin for the offset.
   *
   * Without it the parallax samples past the edges of the texture and clamps
   * into visible streaks along the borders.
   */
  parallaxMargin: uniform(0.06),

  /** Strength of the readability plate behind the headline. */
  scrim: uniform(0.45),
  /** Fraction of the hero height the bottom blend occupies. */
  blendHeight: uniform(0.42),
  /** Curve of the bottom blend. Above 1 holds the image longer, then falls fast. */
  blendEase: uniform(2.6),
}

/** Defaults, kept so the dev panel can seed its sliders from one source. */
export const HERO_DEFAULTS = {
  exposure: 0.44,
  contrast: 1.35,
  parallax: 0.022,
  parallaxPivot: 0.45,
  parallaxMargin: 0.06,
  scrim: 0.45,
  blendHeight: 0.42,
  blendEase: 2.6,
} as const
