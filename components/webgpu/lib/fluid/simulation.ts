import { texture, uniform } from "three/tsl"
import {
  ClampToEdgeWrapping,
  HalfFloatType,
  LinearFilter,
  type Node,
  NodeMaterial,
  type PixelFormat,
  QuadMesh,
  RedFormat,
  type Renderer,
  RenderTarget,
  RGFormat,
  Vector2,
  Vector3,
} from "three/webgpu"
import {
  advectionPass,
  curlPass,
  divergencePass,
  gradientSubtractPass,
  pressurePass,
  splatPass,
  vorticityPass,
} from "@/components/webgpu/lib/fluid/passes"

export type FluidConfig = {
  /** Velocity/pressure grid resolution. */
  simResolution: number
  /** Dye grid resolution. */
  dyeResolution: number
  /** Jacobi iterations for the pressure solve. */
  pressureIterations: number
  /** Vorticity confinement strength. */
  curl: number
  /** Exponential decay of the velocity field. */
  velocityDissipation: number
  /** Exponential decay of the dye field. */
  densityDissipation: number
  /** Splat size, in squared UV. */
  splatRadius: number
  /** Velocity injected per unit of pointer movement. */
  splatForce: number
}

/**
 * Deliberately cheap defaults.
 *
 * A 64px sim grid with 8 pressure iterations is a small fraction of Pavel's
 * default cost. Low curl and high dissipation are what make that coarse grid
 * viable: the flow settles before the missing resolution has time to show up
 * as blocky artefacts.
 */
export const CHEAP_FLUID: FluidConfig = {
  simResolution: 64,
  dyeResolution: 256,
  pressureIterations: 8,
  curl: 3,
  velocityDissipation: 3.5,
  densityDissipation: 4,
  splatRadius: 0.0025,
  splatForce: 5000,
}

function createTarget(size: number, format: PixelFormat) {
  const target = new RenderTarget(size, size, {
    type: HalfFloatType,
    format,
    minFilter: LinearFilter,
    magFilter: LinearFilter,
    depthBuffer: false,
    stencilBuffer: false,
  })
  target.texture.wrapS = ClampToEdgeWrapping
  target.texture.wrapT = ClampToEdgeWrapping
  target.texture.generateMipmaps = false
  return target
}

/**
 * A ping-pong pair plus the `texture()` node that reads from whichever half is
 * current. Swapping re-points the node, so materials built against it stay
 * correct without recompiling.
 */
function createField(size: number, format: PixelFormat) {
  const a = createTarget(size, format)
  const b = createTarget(size, format)
  const node = texture(a.texture)

  const field = {
    read: a,
    write: b,
    node,
    swap() {
      const previous = field.read
      field.read = field.write
      field.write = previous
      field.node.value = field.read.texture
    },
    dispose() {
      a.dispose()
      b.dispose()
    },
  }

  return field
}

/**
 * Pavel Dobryakov's fluid simulation, driven through three's node system.
 *
 * Runs as fragment passes into ping-pong render targets rather than as compute
 * shaders: compute is WebGPU-only, and this has to survive the WebGL2 fallback.
 * At these resolutions the extra draw calls cost far less than maintaining two
 * implementations would.
 *
 * Call `resize` when the canvas changes, `splat` on pointer movement, and
 * `update` once per frame. Sample `dyeNode` in your own material.
 */
export function createFluidSimulation(config: FluidConfig = CHEAP_FLUID) {
  const quad = new QuadMesh()

  const velocity = createField(config.simResolution, RGFormat)
  const pressure = createField(config.simResolution, RedFormat)
  const dye = createField(config.dyeResolution, RedFormat)

  const divergence = createTarget(config.simResolution, RedFormat)
  const curl = createTarget(config.simResolution, RedFormat)
  const divergenceNode = texture(divergence.texture)
  const curlNode = texture(curl.texture)

  const simTexel = uniform(
    new Vector2(1 / config.simResolution, 1 / config.simResolution)
  )
  const dyeTexel = uniform(
    new Vector2(1 / config.dyeResolution, 1 / config.dyeResolution)
  )
  const dt = uniform(1 / 60)
  const curlStrength = uniform(config.curl)
  const velocityDissipation = uniform(config.velocityDissipation)
  const densityDissipation = uniform(config.densityDissipation)
  const splatPoint = uniform(new Vector2(0.5, 0.5))
  const splatColor = uniform(new Vector3(0, 0, 0))
  const splatRadius = uniform(config.splatRadius)
  const splatAspect = uniform(1)

  // Built once. Rebuilding a node graph recompiles the shader, so doing it per
  // frame would stall constantly — the ping-pong is handled by re-pointing the
  // texture nodes instead.
  const build = (fragmentNode: Node) => {
    const material = new NodeMaterial()
    // `fragmentNode` writes the raw value, bypassing tone mapping and output
    // colour conversion, both of which would corrupt simulation data.
    material.fragmentNode = fragmentNode
    return material
  }

  const materials = {
    curl: build(curlPass(velocity.node, simTexel)),
    vorticity: build(
      vorticityPass(velocity.node, curlNode, simTexel, curlStrength, dt)
    ),
    divergence: build(divergencePass(velocity.node, simTexel)),
    pressure: build(pressurePass(pressure.node, divergenceNode, simTexel)),
    gradientSubtract: build(
      gradientSubtractPass(pressure.node, velocity.node, simTexel)
    ),
    advectVelocity: build(
      advectionPass(
        velocity.node,
        velocity.node,
        simTexel,
        dt,
        velocityDissipation
      )
    ),
    advectDye: build(
      advectionPass(velocity.node, dye.node, dyeTexel, dt, densityDissipation)
    ),
    splatVelocity: build(
      splatPass(velocity.node, splatPoint, splatColor, splatRadius, splatAspect)
    ),
    splatDye: build(
      splatPass(dye.node, splatPoint, splatColor, splatRadius, splatAspect)
    ),
  }

  const run = (
    renderer: Renderer,
    material: NodeMaterial,
    target: RenderTarget
  ) => {
    quad.material = material
    renderer.setRenderTarget(target)
    quad.render(renderer)
    renderer.setRenderTarget(null)
  }

  return {
    /** Single-channel dye field. Sample this as the reveal mask. */
    dyeNode: dye.node,

    /** Keeps splats circular on a non-square canvas. */
    resize(width: number, height: number) {
      splatAspect.value = width / Math.max(height, 1)
    },

    /**
     * Inject dye and velocity at `point` (UV), with `delta` being pointer
     * movement in the same space.
     */
    splat(renderer: Renderer, point: Vector2, delta: Vector2, amount: number) {
      splatPoint.value.copy(point)

      splatColor.value.set(
        delta.x * config.splatForce,
        delta.y * config.splatForce,
        0
      )
      run(renderer, materials.splatVelocity, velocity.write)
      velocity.swap()

      splatColor.value.set(amount, amount, amount)
      run(renderer, materials.splatDye, dye.write)
      dye.swap()
    },

    /** Advance one step. */
    update(renderer: Renderer, delta: number) {
      // Clamp so a stalled tab does not advect the field halfway across the
      // screen on the frame it resumes.
      dt.value = Math.min(delta, 1 / 30)

      run(renderer, materials.curl, curl)
      run(renderer, materials.vorticity, velocity.write)
      velocity.swap()

      run(renderer, materials.divergence, divergence)

      for (let i = 0; i < config.pressureIterations; i++) {
        run(renderer, materials.pressure, pressure.write)
        pressure.swap()
      }

      run(renderer, materials.gradientSubtract, velocity.write)
      velocity.swap()

      run(renderer, materials.advectVelocity, velocity.write)
      velocity.swap()

      run(renderer, materials.advectDye, dye.write)
      dye.swap()
    },

    dispose() {
      velocity.dispose()
      pressure.dispose()
      dye.dispose()
      divergence.dispose()
      curl.dispose()
      for (const material of Object.values(materials)) material.dispose()
      quad.geometry.dispose()
    },
  }
}
