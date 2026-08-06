import { uniform } from "three/tsl"

/**
 * Shipped values for the hero intro.
 *
 * `duration` is read in JavaScript each frame rather than being a uniform,
 * because it scales the clock rather than being consumed by the shader. The
 * rest are uniforms so the dev panel can change them mid-sweep.
 */
export const INTRO_DEFAULTS = {
  /** Seconds for the front to travel from the far wall to the nearest object. */
  duration: 1.8,
  /**
   * Softness of the front, in depth units.
   *
   * A hard edge reads as a wipe tracing the depth map's object boundaries.
   * Feathering keeps several planes mid-resolve at once, which is what makes it
   * look like the room condensing rather than being uncovered.
   */
  feather: 0.86,
  /** Brightness lift on the front itself. */
  frontGlow: 0,
  /** Extra zoom at the start, easing out as the scene settles. */
  settleZoom: 0.15,

  /** How strongly noise breaks up the front. 0 leaves it a smooth ramp. */
  shimmer: 0.9,
  /** Spatial frequency of the shimmer. Higher is finer. */
  shimmerScale: 1,
  /** How fast the shimmer churns. */
  shimmerSpeed: 1.4,

  /** Mote grid density. Higher packs them tighter. */
  moteScale: 38,
  /** Mote radius within its cell. */
  moteSize: 0.04,
  /** Mote brightness while the front is passing over them. */
  moteBurst: 0.9,
  /**
   * How far behind the front motes keep glowing, in depth units.
   *
   * This is the "linger": each mote fades out over this distance *after* the
   * light reaches it, so the dust trails the sweep. It is bounded on purpose —
   * anything tied to the revealed area instead leaves specks across the whole
   * photograph once the sweep completes.
   */
  moteTrail: 0.6,
  /** How fast motes wander within their cell. */
  moteDrift: 0.58,
} as const

export const introControls = {
  feather: uniform<number>(INTRO_DEFAULTS.feather),
  frontGlow: uniform<number>(INTRO_DEFAULTS.frontGlow),
  settleZoom: uniform<number>(INTRO_DEFAULTS.settleZoom),

  shimmer: uniform<number>(INTRO_DEFAULTS.shimmer),
  shimmerScale: uniform<number>(INTRO_DEFAULTS.shimmerScale),
  shimmerSpeed: uniform<number>(INTRO_DEFAULTS.shimmerSpeed),

  moteScale: uniform<number>(INTRO_DEFAULTS.moteScale),
  moteSize: uniform<number>(INTRO_DEFAULTS.moteSize),
  moteBurst: uniform<number>(INTRO_DEFAULTS.moteBurst),
  moteTrail: uniform<number>(INTRO_DEFAULTS.moteTrail),
  moteDrift: uniform<number>(INTRO_DEFAULTS.moteDrift),
}

/**
 * Clock state for the intro, outside React.
 *
 * `token` is a replay counter: the scene compares it against the value it last
 * acted on and restarts its clock when they differ. Going through a plain
 * mutable object rather than React state means replaying costs no render, and
 * — the point of the button — leaves every tuned value untouched, which a page
 * refresh would not.
 */
export const introTiming = {
  duration: INTRO_DEFAULTS.duration as number,
  token: 0,
}

/** Restart the intro from the beginning, keeping current settings. */
export function replayIntro() {
  introTiming.token += 1
}
