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
  Color,
  LinearFilter,
  MeshBasicNodeMaterial,
  type Node,
  SRGBColorSpace,
  type Texture,
  type Vector2,
} from "three/webgpu"
import { dither } from "@/components/webgpu/lib/mesh-gradient"
import { patterned } from "@/components/webgpu/lib/patterned"

/**
 * Must stay in sync with `--color-solutio-bg`.
 *
 * Built through `Color` rather than written as a raw float: the renderer
 * encodes linear to sRGB on output, so a literal 0.039 in the shader leaves the
 * canvas as #383838 rather than #0A0A0A. `Color` does the sRGB decode for us.
 */
const BG_HEX = "#0A0A0A"
/** Flat multiplier on the photograph. Below 1 it reads darker and less hazy. */
const PHOTO_EXPOSURE = 0.44
/** Raising the photo to this power deepens its shadows without crushing highlights. */
const PHOTO_CONTRAST = 1.35
/** Luminance window over which the halftone emerges from the photo. */
const PATTERN_START = 0.13
const PATTERN_FULL = 0.34
/** Fraction of the hero height the bottom blend occupies. */
const BLEND_HEIGHT = 0.42
/** Curve of the bottom blend. Above 1 holds the image longer, then falls away fast. */
const BLEND_EASE = 2.6

type SceneProps = {
  map: Texture
  resolution: ReturnType<typeof uniform<Vector2>>
}

export function Scene({ map, resolution }: SceneProps) {
  const { material, imageAspect } = useMemo(() => {
    const imageAspect = uniform(1)
    // `Color` decodes the sRGB hex into the linear working space the shader
    // maths happens in, so this lands on exactly #0A0A0A after output encoding.
    const background = uniform(new Color(BG_HEX))

    map.wrapS = ClampToEdgeWrapping
    map.wrapT = ClampToEdgeWrapping
    map.minFilter = LinearFilter
    map.magFilter = LinearFilter
    // TextureLoader does not infer this. Without it the sRGB-encoded photo is
    // read as linear and then re-encoded on output, which washes it out.
    map.colorSpace = SRGBColorSpace

    /**
     * `object-fit: cover` in UV space: scales the over-long axis in so the
     * image fills the quad without distorting, keeping it centred.
     */
    const cover = (uvCoord: Node) => {
      const quadAspect = resolution.x.div(resolution.y)
      const ratio = quadAspect.div(imageAspect)
      const scale = vec2(max(ratio, 1), max(float(1).div(ratio), 1))
      const fitted = vec2(uvCoord).sub(0.5).div(scale).add(0.5)

      // `viewportUV` is y-down; the texture is stored y-up.
      return vec2(fitted.x, oneMinus(fitted.y))
    }

    /** Darkened, slightly contrastier photograph. */
    const photo = (uvCoord: Node) =>
      pow(texture(map, cover(uvCoord)).rgb, PHOTO_CONTRAST).mul(PHOTO_EXPOSURE)

    const material = new MeshBasicNodeMaterial()

    // ScreenQuad is a single oversized triangle whose vertices are already in
    // clip space. Node materials still run the model-view-projection matrix by
    // default, which would project it through the scene camera, so write the
    // position straight through and skip the camera entirely.
    material.vertexNode = vec4(positionGeometry.xy, 0, 1)

    material.colorNode = Fn(() => {
      // Same rule as the gradients: the halftone resolves out of the lighter
      // parts of the image, so the photograph and the gradients read as the
      // same material rather than as two unrelated effects.
      const composited = patterned({
        field: photo,
        resolution,
        uv: viewportUV,
        // Tuned to the graded photo's range, which tops out near
        // PHOTO_EXPOSURE rather than at 1.
        start: PATTERN_START,
        full: PATTERN_FULL,
      })

      /**
       * Readability plate behind the headline. Composited here rather than as
       * a DOM overlay so the pattern sits underneath it and the text cannot
       * lose contrast however bright the highlights get.
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
        smoothstep(float(1).sub(BLEND_HEIGHT), 1, viewportUV.y),
        BLEND_EASE
      )

      const scrim = clamp(radial.mul(0.45), 0, 1)
      const plated = mix(composited, background, scrim)

      return mix(plated, background, blend).add(dither())
    })()

    return { material, imageAspect }
  }, [map, resolution])

  useEffect(() => {
    const image = map.image as { width?: number; height?: number } | undefined
    if (image?.width && image?.height) {
      imageAspect.value = image.width / image.height
    }
  }, [imageAspect, map])

  return <ScreenQuad material={material} />
}
