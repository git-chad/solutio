import { uniform } from "three/tsl"
import { Color } from "three/webgpu"

/**
 * Must stay in sync with `--color-solutio-bg`.
 *
 * Written as a hex and decoded by `Color` rather than as raw floats: the
 * renderer encodes linear to sRGB on output, so the sRGB value 0.039 written
 * directly into a shader leaves the canvas at #383838 rather than #0A0A0A.
 * `Color` does the decode into the linear space the shader maths runs in.
 */
export const BG_HEX = "#0A0A0A"

/** Shared background uniform, for anything that blends toward the page. */
export const backgroundColor = uniform(new Color(BG_HEX))
