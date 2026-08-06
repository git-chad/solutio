"use client"

import { ScreenQuad } from "@react-three/drei"
import { useEffect, useMemo } from "react"
import {
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

type SceneProps = {
  map: Texture
  depthMap: Texture
  resolution: ReturnType<typeof uniform<Vector2>>
  pointer: ReturnType<typeof uniform<Vector2>>
}

export function Scene({ map, depthMap, resolution, pointer }: SceneProps) {
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
     * image fills the quad without distorting, keeping it centred. Also zooms
     * in slightly to leave margin for the parallax offset.
     */
    const cover = (uvCoord: Node) => {
      const quadAspect = resolution.x.div(resolution.y)
      const ratio = quadAspect.div(imageAspect)
      const scale = vec2(max(ratio, 1), max(float(1).div(ratio), 1))
      const zoomed = vec2(uvCoord)
        .sub(0.5)
        .mul(oneMinus(controls.parallaxMargin))
        .add(0.5)
      const fitted = zoomed.sub(0.5).div(scale).add(0.5)

      // `viewportUV` is y-down; the texture is stored y-up.
      return vec2(fitted.x, oneMinus(fitted.y))
    }

    /**
     * Depth parallax.
     *
     * The depth map is a monocular estimate generated offline (see
     * `lib/scripts/generate-depth.ts`) where white is near and black is far.
     * Subtracting a pivot before scaling is what makes this read as depth
     * rather than as a pan: geometry nearer than the pivot slides with the
     * pointer, geometry behind it slides against it, and the pivot plane stays
     * pinned. The eye reads that differential as 3D.
     *
     * Depth is sampled at the unshifted position — the usual approximation, and
     * accurate enough at these offsets that the alternative (marching the ray
     * through the height field) would only cost more.
     */
    const parallaxUv = (uvCoord: Node) => {
      const base = cover(uvCoord)
      const depth = texture(depthMap, base).r
      const shift = vec2(pointer)
        .mul(controls.parallax)
        .mul(depth.sub(controls.parallaxPivot))

      // Y is negated because the texture lookup is flipped relative to the
      // pointer's y-down space; without it the image leans the wrong way.
      return base.add(vec2(shift.x, shift.y.negate()))
    }

    const material = new MeshBasicNodeMaterial()

    // ScreenQuad is a single oversized triangle whose vertices are already in
    // clip space. Node materials still run the model-view-projection matrix by
    // default, which would project it through the scene camera, so write the
    // position straight through and skip the camera entirely.
    material.vertexNode = vec4(positionGeometry.xy, 0, 1)

    material.colorNode = Fn(() => {
      const photo = pow(
        texture(map, parallaxUv(viewportUV)).rgb,
        controls.contrast
      ).mul(controls.exposure)

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
      const plated = mix(photo, background, scrim)

      return mix(plated, background, blend).add(dither())
    })()

    return { material, imageAspect }
  }, [map, depthMap, resolution, pointer])

  useEffect(() => {
    const image = map.image as { width?: number; height?: number } | undefined
    if (image?.width && image?.height) {
      imageAspect.value = image.width / image.height
    }
  }, [imageAspect, map])

  return <ScreenQuad material={material} />
}
