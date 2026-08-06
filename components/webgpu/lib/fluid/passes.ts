import { abs, float, length, max, min, uv, vec2, vec3, vec4 } from "three/tsl"
import type { texture } from "three/tsl"
import type { Node } from "three/webgpu"

/**
 * The fragment stages of Pavel Dobryakov's WebGL fluid simulation, ported to
 * TSL.
 *
 * https://github.com/PavelDoGreat/WebGL-Fluid-Simulation
 *
 * This is a semi-Lagrangian Navier-Stokes solver. Per frame the velocity field
 * is advected through itself, given back the swirl that advection numerically
 * destroys (curl + vorticity confinement), then made divergence-free by
 * solving a Poisson equation with Jacobi iterations and subtracting the
 * pressure gradient. The dye field is advected through the resulting velocity.
 *
 * Every field is passed as a `TextureNode` rather than a `Texture`, because the
 * simulation ping-pongs between two render targets per field. A node graph is
 * compiled once, so the pass has to read through something whose `.value` the
 * driver can re-point after each swap — binding a `Texture` directly would
 * silently pin each pass to whichever target happened to be current when the
 * material was built.
 *
 * The original samples neighbours via varyings computed in the vertex shader
 * (vL/vR/vT/vB). We offset in the fragment stage instead, which costs the same
 * on any modern GPU and keeps each pass to a single node graph.
 */

/** A `texture()` node whose `.value` the driver re-points between passes. */
export type TextureNode = ReturnType<typeof texture>

const left = (texel: Node) => uv().sub(vec2(vec2(texel).x, 0))
const right = (texel: Node) => uv().add(vec2(vec2(texel).x, 0))
const top = (texel: Node) => uv().add(vec2(0, vec2(texel).y))
const bottom = (texel: Node) => uv().sub(vec2(0, vec2(texel).y))

/**
 * Curl (scalar vorticity) of the velocity field: dVy/dx - dVx/dy, by central
 * difference.
 */
export function curlPass(velocity: TextureNode, texel: Node) {
  const l = velocity.sample(left(texel)).y
  const r = velocity.sample(right(texel)).y
  const t = velocity.sample(top(texel)).x
  const b = velocity.sample(bottom(texel)).x

  return vec4(r.sub(l).sub(t).add(b).mul(0.5), 0, 0, 1)
}

/**
 * Vorticity confinement.
 *
 * Semi-Lagrangian advection is diffusive and bleeds small vortices away within
 * a few frames. This finds where curl is concentrated and pushes velocity back
 * along that gradient, restoring the swirl. `curlStrength` decides whether the
 * fluid reads as syrupy or turbulent.
 */
export function vorticityPass(
  velocity: TextureNode,
  curl: TextureNode,
  texel: Node,
  curlStrength: Node,
  dt: Node
) {
  const l = curl.sample(left(texel)).x
  const r = curl.sample(right(texel)).x
  const t = curl.sample(top(texel)).x
  const b = curl.sample(bottom(texel)).x
  const c = curl.sample(uv()).x

  // Normalised gradient of |curl|. The epsilon keeps still water finite.
  const gradient = vec2(abs(t).sub(abs(b)), abs(r).sub(abs(l))).mul(0.5)
  const scaled = gradient
    .div(length(gradient).add(0.0001))
    .mul(float(curlStrength))
    .mul(c)

  // The y flip matches the original's screen-space handedness.
  const force = vec2(scaled.x, scaled.y.mul(-1))
  const result = velocity.sample(uv()).xy.add(force.mul(float(dt)))

  // Clamp so one bad frame delta cannot blow the field up irrecoverably.
  return vec4(min(max(result, -1000), 1000), 0, 1)
}

/** Divergence of the velocity field, with free-slip walls. */
export function divergencePass(velocity: TextureNode, texel: Node) {
  const centre = velocity.sample(uv()).xy

  // Mirror the component normal to each edge so fluid cannot leak out of the
  // domain — otherwise the pressure solve drains the field at the borders.
  const atLeft = uv().x.lessThan(vec2(texel).x)
  const atRight = uv().x.greaterThan(float(1).sub(vec2(texel).x))
  const atTop = uv().y.greaterThan(float(1).sub(vec2(texel).y))
  const atBottom = uv().y.lessThan(vec2(texel).y)

  const l = atLeft.select(centre.x.negate(), velocity.sample(left(texel)).x)
  const r = atRight.select(centre.x.negate(), velocity.sample(right(texel)).x)
  const t = atTop.select(centre.y.negate(), velocity.sample(top(texel)).y)
  const b = atBottom.select(centre.y.negate(), velocity.sample(bottom(texel)).y)

  return vec4(r.sub(l).add(t).sub(b).mul(0.5), 0, 0, 1)
}

/**
 * One Jacobi iteration of the pressure Poisson solve. Run repeatedly,
 * ping-ponging the pressure target — more iterations converge closer to truly
 * incompressible flow, fewer look softer and cost proportionally less.
 */
export function pressurePass(
  pressure: TextureNode,
  divergence: TextureNode,
  texel: Node
) {
  const l = pressure.sample(left(texel)).x
  const r = pressure.sample(right(texel)).x
  const t = pressure.sample(top(texel)).x
  const b = pressure.sample(bottom(texel)).x
  const d = divergence.sample(uv()).x

  return vec4(l.add(r).add(b).add(t).sub(d).mul(0.25), 0, 0, 1)
}

/** Subtract the pressure gradient, leaving a divergence-free velocity field. */
export function gradientSubtractPass(
  pressure: TextureNode,
  velocity: TextureNode,
  texel: Node
) {
  const l = pressure.sample(left(texel)).x
  const r = pressure.sample(right(texel)).x
  const t = pressure.sample(top(texel)).x
  const b = pressure.sample(bottom(texel)).x

  return vec4(velocity.sample(uv()).xy.sub(vec2(r.sub(l), t.sub(b))), 0, 1)
}

/**
 * Semi-Lagrangian advection: trace backwards along the velocity field and
 * sample whatever was there.
 *
 * `dissipation` is Pavel's exponential decay. Turning it up is what keeps a
 * coarse grid from smearing into mush — the flow settles before the missing
 * resolution becomes visible.
 */
export function advectionPass(
  velocity: TextureNode,
  source: TextureNode,
  texel: Node,
  dt: Node,
  dissipation: Node
) {
  const from = uv().sub(
    velocity.sample(uv()).xy.mul(float(dt)).mul(vec2(texel))
  )

  return vec4(source.sample(from).div(float(1).add(float(dissipation).mul(dt))))
}

/**
 * Additive gaussian blob, used to inject velocity and dye at the pointer.
 * `aspect` keeps the blob circular on a non-square target.
 */
export function splatPass(
  target: TextureNode,
  point: Node,
  splatColor: Node,
  radius: Node,
  aspect: Node
) {
  const offset = uv().sub(vec2(point))
  // Scale x by aspect so the blob stays circular on a non-square target.
  const scaled = vec2(offset.x.mul(float(aspect)), offset.y)

  const blob = scaled.dot(scaled).div(float(radius)).negate().exp()

  return vec4(target.sample(uv()).xyz.add(vec3(splatColor).mul(blob)), 1)
}
