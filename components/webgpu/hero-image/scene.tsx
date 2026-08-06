"use client"

import { ScreenQuad } from "@react-three/drei"
import { useFrame } from "@react-three/fiber"
import { useEffect, useMemo, useRef } from "react"
import {
  abs,
  clamp,
  cos,
  dot,
  float,
  floor,
  Fn,
  fract,
  max,
  mix,
  mx_fractal_noise_float,
  oneMinus,
  positionGeometry,
  pow,
  sin,
  smoothstep,
  texture,
  time,
  uniform,
  vec2,
  vec3,
  vec4,
  viewportUV,
} from "three/tsl"
import {
  ClampToEdgeWrapping,
  LinearFilter,
  MeshBasicNodeMaterial,
  type Node,
  SRGBColorSpace,
  type Texture,
  type Vector2,
} from "three/webgpu"
import { backgroundColor } from "@/components/webgpu/lib/colors"
import { heroControls } from "@/components/webgpu/lib/hero-controls"
import {
  introControls,
  introTiming,
} from "@/components/webgpu/lib/intro-controls"
import { dither } from "@/components/webgpu/lib/mesh-gradient"

/**
 * Cheap 2D hash.
 *
 * The standard sin/fract trick. Not a good random number generator, but the
 * artefacts are invisible when all it decides is where a speck of dust sits.
 */
const hash21 = (p: Node) =>
  fract(sin(dot(vec2(p), vec2(127.1, 311.7))).mul(43758.5453))

type SceneProps = {
  map: Texture
  depthMap: Texture
  resolution: ReturnType<typeof uniform<Vector2>>
  pointer: ReturnType<typeof uniform<Vector2>>
}

/**
 * Smoothstep: eases in and out, roughly linear through the middle.
 *
 * An expo-out curve puts half the travel in the first tenth of the duration,
 * which makes the front cross the whole depth range almost instantly — the
 * sweep is the point here, so it needs a curve that actually spends time in
 * the middle.
 */
const easeInOut = (t: number) => t * t * (3 - 2 * t)

export function Scene({ map, depthMap, resolution, pointer }: SceneProps) {
  /** 0 = nothing resolved, 1 = fully arrived. Drives the whole intro. */
  const reveal = useMemo(() => uniform(0), [])
  const elapsed = useRef(0)

  const seenToken = useRef(introTiming.token)

  useEffect(() => {
    // Reduced motion still gets the scene — just already arrived.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      elapsed.current = introTiming.duration
      reveal.value = 1
    }
  }, [reveal])

  useFrame((_state, delta) => {
    // Replay is a counter rather than an event, so the scene picks it up on its
    // own clock without needing a subscription or a re-render.
    if (seenToken.current !== introTiming.token) {
      seenToken.current = introTiming.token
      elapsed.current = 0
    }

    const duration = introTiming.duration
    if (elapsed.current >= duration) return

    elapsed.current = Math.min(duration, elapsed.current + delta)
    reveal.value = easeInOut(elapsed.current / duration)
  })

  const { material, imageAspect } = useMemo(() => {
    const imageAspect = uniform(1)
    const controls = heroControls
    const intro = introControls
    const background = backgroundColor

    for (const tex of [map, depthMap]) {
      tex.wrapS = ClampToEdgeWrapping
      tex.wrapT = ClampToEdgeWrapping
      tex.minFilter = LinearFilter
      tex.magFilter = LinearFilter
    }
    // TextureLoader does not infer this. Without it the sRGB-encoded photo is
    // read as linear and then re-encoded on output, which washes it out. The
    // depth map is deliberately left linear — it is data, not colour.
    map.colorSpace = SRGBColorSpace

    /**
     * `object-fit: cover` in UV space: scales the over-long axis in so the
     * image fills the quad without distorting, keeping it centred. Zooms in
     * slightly to leave margin for the parallax offset, plus a little extra
     * while the scene is still arriving so it settles inward as it resolves.
     */
    const cover = (uvCoord: Node) => {
      const quadAspect = resolution.x.div(resolution.y)
      const ratio = quadAspect.div(imageAspect)
      const scale = vec2(max(ratio, 1), max(float(1).div(ratio), 1))

      const margin = float(controls.parallaxMargin).add(
        oneMinus(reveal).mul(intro.settleZoom)
      )
      const zoomed = vec2(uvCoord).sub(0.5).mul(oneMinus(margin)).add(0.5)
      const fitted = zoomed.sub(0.5).div(scale).add(0.5)

      // `viewportUV` is y-down; the texture is stored y-up.
      return vec2(fitted.x, oneMinus(fitted.y))
    }

    const material = new MeshBasicNodeMaterial()

    // ScreenQuad is a single oversized triangle whose vertices are already in
    // clip space. Node materials still run the model-view-projection matrix by
    // default, which would project it through the scene camera, so write the
    // position straight through and skip the camera entirely.
    material.vertexNode = vec4(positionGeometry.xy, 0, 1)

    material.colorNode = Fn(() => {
      const base = cover(viewportUV)

      /**
       * The depth map does double duty: it drives the pointer parallax, and it
       * sequences the intro. Sampling it once keeps both in the same space.
       * White is near, black is far.
       */
      const depth = texture(depthMap, base).r

      /**
       * Depth parallax.
       *
       * Offsetting around a pivot is what makes this read as depth rather than
       * as a pan: geometry nearer than the pivot slides with the pointer,
       * geometry behind it slides against, and the pivot plane stays pinned.
       */
      const shift = vec2(pointer)
        .mul(controls.parallax)
        .mul(depth.sub(controls.parallaxPivot))
      const shifted = base.add(vec2(shift.x, shift.y.negate()))

      const photo = pow(texture(map, shifted).rgb, controls.contrast).mul(
        controls.exposure
      )

      /**
       * The intro, sequenced by depth.
       *
       * A front sweeps from the far wall to the nearest object, so the room
       * resolves back-to-front and the foreground curtain and chair are last to
       * arrive. It is scaled past 1 by the feather width so that at the end of
       * the ramp even the nearest pixel is fully through the transition.
       */
      const feather = float(intro.feather)
      const front = reveal.mul(float(1).add(feather))
      const arrived = oneMinus(smoothstep(front.sub(feather), front, depth))

      /**
       * A faint lift travelling with the front itself, peaking where the
       * transition is happening. Reads as light finding each plane as it
       * arrives, and gives the sweep a direction the eye can follow.
       */
      const band = clamp(oneMinus(abs(depth.sub(front)).div(feather)), 0, 1)

      /**
       * Shimmer, breaking the front up so it glints rather than ramping
       * smoothly. Sampled in the *shifted* space so it travels with the room
       * under the pointer instead of sitting still on the glass.
       */
      const shimmerNoise = mx_fractal_noise_float(
        vec3(shifted.mul(intro.shimmerScale), time.mul(intro.shimmerSpeed)),
        2,
        2,
        0.5
      )
      const glint = band.mul(float(1).add(shimmerNoise.mul(intro.shimmer)))
      const lit = photo.add(glint.mul(intro.frontGlow))

      const composited = mix(background, lit, arrived)

      /**
       * Dust caught in the light.
       *
       * A hashed grid rather than a particle system: no geometry, no extra
       * draw calls, no second pass — a handful of hash and trig ops on top of
       * a fragment we are already shading. Placed in the shifted space so the
       * motes parallax with the room rather than floating on top of it.
       *
       * The grid only decides *where* a mote could be; whether it is lit is
       * entirely the front's business — see `wake` below.
       */
      const grid = shifted.mul(intro.moteScale)
      const cell = floor(grid)
      const local = fract(grid).sub(0.5)

      const seed = hash21(cell)
      const size = hash21(cell.add(17.3))

      // Per-cell phase, so they wander independently instead of in lockstep.
      const wander = time.mul(intro.moteDrift).add(seed.mul(6.283))
      const offset = vec2(sin(wander), cos(wander.mul(1.3))).mul(0.26)

      const shape = smoothstep(
        float(intro.moteSize).mul(size.mul(0.7).add(0.3)),
        0,
        local.sub(offset).length()
      )
      const twinkle = sin(time.mul(2.1).add(seed.mul(12)))
        .mul(0.4)
        .add(0.6)

      /**
       * Motes belong to the front, not to the room.
       *
       * `behind` is how far the front has travelled past this pixel's depth.
       * Nothing lights ahead of it; motes flare as it arrives and fade out over
       * `moteTrail` behind it, so the dust reads as a wake following the light
       * rather than a layer sitting on the photograph. Once the sweep finishes
       * the front is past every depth by more than the trail, so they are gone.
       *
       * Gating on `arrived` instead — which saturates to 1 everywhere once the
       * sweep ends — is what put specks over the whole image.
       */
      const behind = front.sub(depth)
      const wake = smoothstep(0, feather.mul(0.35), behind).mul(
        oneMinus(smoothstep(0, float(intro.moteTrail), behind))
      )

      /**
       * Added after the composite rather than before it, so motes still catch
       * the light inside the band — where `arrived` is only partial and would
       * otherwise scale them away.
       */
      const motes = shape.mul(twinkle).mul(wake).mul(intro.moteBurst)

      /**
       * Readability plate behind the headline. Composited here rather than as
       * a DOM overlay so the text keeps its contrast regardless of what the
       * parallax brings into frame.
       */
      const radial = oneMinus(
        smoothstep(0.05, 0.72, viewportUV.sub(0.5).mul(vec2(1, 1.4)).length())
      )

      /**
       * Blend into the section below.
       *
       * Eased rather than linear: a linear ramp reads as a visible band edge
       * because the eye tracks the constant rate of change. Raising it to a
       * power holds the photograph most of the way down and then falls away
       * quickly into the flat background.
       */
      const blend = pow(
        smoothstep(oneMinus(controls.blendHeight), 1, viewportUV.y),
        controls.blendEase
      )

      const scrim = clamp(radial.mul(controls.scrim), 0, 1)
      const plated = mix(composited.add(motes), background, scrim)

      return mix(plated, background, blend).add(dither())
    })()

    return { material, imageAspect }
  }, [map, depthMap, resolution, pointer, reveal])

  useEffect(() => {
    const image = map.image as { width?: number; height?: number } | undefined
    if (image?.width && image?.height) {
      imageAspect.value = image.width / image.height
    }
  }, [imageAspect, map])

  return <ScreenQuad material={material} />
}
