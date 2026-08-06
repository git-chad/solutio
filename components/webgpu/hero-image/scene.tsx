"use client"

import { ScreenQuad } from "@react-three/drei"
import { useFrame, useThree } from "@react-three/fiber"
import { useEffect, useMemo } from "react"
import {
  clamp,
  float,
  Fn,
  luminance,
  max,
  mix,
  mx_fractal_noise_float,
  oneMinus,
  smoothstep,
  texture,
  time,
  uniform,
  positionGeometry,
  screenUV,
  vec2,
  vec3,
  vec4,
} from "three/tsl"
import {
  ClampToEdgeWrapping,
  LinearFilter,
  MeshBasicNodeMaterial,
  SRGBColorSpace,
  type Node,
  type Texture,
  Vector2,
} from "three/webgpu"
import { candlesBar, candlesCell } from "@/components/webgpu/lib/candles"
import type { PointerTrail } from "@/components/webgpu/lib/use-pointer-trail"

/** Halftone cell size in CSS px, at the reference height below. */
const CELL_SIZE = 14
/** Cell size is authored against this height so the pattern scales with it. */
const REFERENCE_HEIGHT = 900
/** Radius of a single trail point's influence, in UV. */
const POINT_RADIUS = 0.17
/** How far the noise field pushes the reveal edge around, in UV. */
const NOISE_DISTORTION = 0.06
/** Background colour behind the readability scrim, matching --color-solutio-bg. */
const BG = 0.0392
/** Darkening applied across the whole image, before the centre and bottom plates. */
const BASE_SCRIM = 0.28

type SceneProps = {
  map: Texture
  trail: PointerTrail
}

export function Scene({ map, trail }: SceneProps) {
  const size = useThree((state) => state.size)

  const { material, resolution, imageAspect } = useMemo(() => {
    const resolution = uniform(new Vector2(1, 1))
    const imageAspect = uniform(1)

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

      // `screenUV` runs bottom-up; the texture is stored top-down, so sampling
      // it directly renders the image upside down.
      return vec2(fitted.x, oneMinus(fitted.y))
    }

    /**
     * Reveal mask driven by the pointer trail.
     *
     * Each point contributes a soft disc. The field is unioned with `max`
     * rather than summed, so overlapping points do not accumulate into a
     * hard-edged blob. The sample position is displaced by drifting fractal
     * noise first — that displacement is what stops the mask reading as a
     * circle chasing the cursor.
     */
    const revealMask = () => {
      const noise = mx_fractal_noise_float(
        vec3(screenUV.mul(3.2), time.mul(0.12)),
        3,
        2,
        0.5
      )
      const distorted = screenUV.add(noise.mul(NOISE_DISTORTION))

      const field = float(0).toVar()
      trail.points.forEach((point, index) => {
        // Thin the tail so the trail tapers instead of ending abruptly.
        const falloff = 1 - (index / trail.points.length) * 0.65
        const disc = smoothstep(
          POINT_RADIUS * falloff,
          0,
          distorted.distance(vec2(point))
        )
        field.assign(max(field, disc))
      })

      return clamp(field.mul(trail.strength), 0, 1)
    }

    /**
     * Candles halftone, taking its colour from the image so the effect reads as
     * the photograph resolving into bars rather than as an overlay on top.
     */
    const pattern = () => {
      // Scale the cell with the viewport so the halftone keeps its density.
      const cellSize = float(CELL_SIZE).mul(resolution.y).div(REFERENCE_HEIGHT)
      const { centre, localX } = candlesCell(screenUV, resolution, cellSize)

      // Sample at the cell centre so each cell gets one flat colour.
      const cellColor = texture(map, cover(centre))
      const bar = candlesBar(luminance(cellColor.rgb), localX)

      return { cellColor, bar }
    }

    const material = new MeshBasicNodeMaterial()

    // ScreenQuad is a single oversized triangle whose vertices are already in
    // clip space. Node materials still run the model-view-projection matrix by
    // default, which would project it through the scene camera, so write the
    // position straight through and skip the camera entirely.
    material.vertexNode = vec4(positionGeometry.xy, 0, 1)

    material.colorNode = Fn(() => {
      const baseColor = texture(map, cover(screenUV))
      const mask = revealMask()
      const { cellColor, bar } = pattern()

      // Off-bar falls back to a heavily darkened plate rather than black, so
      // the revealed area keeps the image's tonal structure while still
      // reading as a hard graphic pattern against the untouched photo.
      const patternColor = mix(
        cellColor.rgb.mul(0.04),
        cellColor.rgb.mul(1.9),
        bar
      )

      const composited = mix(baseColor.rgb, patternColor, mask)

      /**
       * Readability scrim for the headline. Composited here rather than as a
       * DOM overlay so the pattern reveal sits underneath it and the text
       * never loses contrast, however bright the pattern gets.
       */
      const radial = oneMinus(
        smoothstep(0.05, 0.7, screenUV.sub(0.5).mul(vec2(1, 1.4)).length())
      )
      // `screenUV` is y-down, so the bottom of the screen is y = 1.
      const bottom = smoothstep(0.5, 1, screenUV.y)
      const scrim = clamp(
        float(BASE_SCRIM).add(radial.mul(0.5)).add(bottom.mul(0.25)),
        0,
        0.9
      )

      return mix(composited, vec3(BG, BG, BG), scrim)
    })()

    return { material, resolution, imageAspect }
  }, [map, trail.points, trail.strength])

  useEffect(() => {
    resolution.value.set(size.width, size.height)
  }, [resolution, size])

  useEffect(() => {
    const image = map.image as { width?: number; height?: number } | undefined
    if (image?.width && image?.height) {
      imageAspect.value = image.width / image.height
    }
  }, [imageAspect, map])

  useFrame((_state, delta) => {
    trail.update(delta)
  })

  return <ScreenQuad material={material} />
}
