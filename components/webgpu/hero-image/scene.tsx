"use client"

import { ScreenQuad } from "@react-three/drei"
import { useFrame } from "@react-three/fiber"
import { useEffect, useMemo, useRef } from "react"
import {
  abs,
  clamp,
  float,
  Fn,
  max,
  mix,
  oneMinus,
  positionGeometry,
  pow,
  smoothstep,
  texture,
  uniform,
  vec2,
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
import { dither } from "@/components/webgpu/lib/mesh-gradient"

/** Seconds for the scene to resolve from farthest to nearest. */
const REVEAL_DURATION = 1.8
/**
 * Softness of the advancing front, in depth units.
 *
 * With a hard edge the reveal reads as a wipe following the depth map's object
 * boundaries. Feathering it across a third of the depth range means several
 * planes are always mid-resolve, which is what makes it look like the room is
 * condensing out of the dark rather than being uncovered.
 */
const FEATHER = 0.34
/** Extra zoom at the start, easing out as the scene settles into place. */
const SETTLE_ZOOM = 0.05
/** Brightness lift on the front itself, so the edge reads as light arriving. */
const FRONT_GLOW = 0.05

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

  useEffect(() => {
    // Reduced motion still gets the scene — just already arrived.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      elapsed.current = REVEAL_DURATION
      reveal.value = 1
    }
  }, [reveal])

  useFrame((_state, delta) => {
    if (elapsed.current >= REVEAL_DURATION) return

    elapsed.current = Math.min(REVEAL_DURATION, elapsed.current + delta)
    reveal.value = easeInOut(elapsed.current / REVEAL_DURATION)
  })

  const { material, imageAspect } = useMemo(() => {
    const imageAspect = uniform(1)
    const controls = heroControls
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
        oneMinus(reveal).mul(SETTLE_ZOOM)
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
      const front = reveal.mul(1 + FEATHER)
      const arrived = oneMinus(smoothstep(front.sub(FEATHER), front, depth))

      /**
       * A faint lift travelling with the front itself, peaking where the
       * transition is happening. Reads as light finding each plane as it
       * arrives, and gives the sweep a direction the eye can follow.
       */
      const band = clamp(oneMinus(abs(depth.sub(front)).div(FEATHER)), 0, 1)
      const lit = photo.add(band.mul(FRONT_GLOW))

      const composited = mix(background, lit, arrived)

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
      const plated = mix(composited, background, scrim)

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
