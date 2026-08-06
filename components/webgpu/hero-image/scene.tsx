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
  oneMinus,
  pow,
  positionGeometry,
  screenUV,
  smoothstep,
  texture,
  uniform,
  vec2,
  vec4,
} from "three/tsl"
import {
  ClampToEdgeWrapping,
  Color,
  LinearFilter,
  MeshBasicNodeMaterial,
  type Node,
  type Renderer,
  SRGBColorSpace,
  type Texture,
  Vector2,
} from "three/webgpu"
import { candlesBar, candlesCell } from "@/components/webgpu/lib/candles"
import {
  CHEAP_FLUID,
  createFluidSimulation,
} from "@/components/webgpu/lib/fluid/simulation"
import type { FluidPointer } from "@/components/webgpu/lib/fluid/use-fluid-pointer"

/** Halftone cell size in CSS px, at the reference height below. */
const CELL_SIZE = 8
/** Cell size is authored against this height so the pattern scales with it. */
const REFERENCE_HEIGHT = 900
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
/** Fraction of the hero height the bottom blend occupies. */
const BLEND_HEIGHT = 0.42
/** Curve of the bottom blend. Above 1 holds the image longer, then falls away fast. */
const BLEND_EASE = 2.6
/** Dye level at which a cell is fully given over to the pattern. */
const REVEAL_THRESHOLD = 0.16
/** How much the photo's own luminance contributes to bar width. */
const LUMA_WEIGHT = 0.5
/** How much the fluid widens the bars on top of that. */
const DYE_WEIGHT = 0.9
/** Brightness of a lit bar, relative to the photo. */
const PATTERN_GAIN = 2.2

type SceneProps = {
  map: Texture
  pointer: FluidPointer
}

export function Scene({ map, pointer }: SceneProps) {
  const size = useThree((state) => state.size)
  // R3F v10 still types `state.gl` as WebGLRenderer even when the canvas is
  // backed by WebGPURenderer. The simulation only calls setRenderTarget and
  // renders a QuadMesh, which both back ends support identically.
  const renderer = useThree((state) => state.gl) as unknown as Renderer

  const fluid = useMemo(() => createFluidSimulation(CHEAP_FLUID), [])
  useEffect(() => () => fluid.dispose(), [fluid])

  const { material, resolution, imageAspect } = useMemo(() => {
    const resolution = uniform(new Vector2(1, 1))
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

      // `screenUV` is y-down; the texture is stored y-up.
      return vec2(fitted.x, oneMinus(fitted.y))
    }

    /** Darkened, slightly contrastier photograph. */
    const photo = (uvCoord: Node) =>
      pow(texture(map, cover(uvCoord)).rgb, PHOTO_CONTRAST).mul(PHOTO_EXPOSURE)

    /**
     * The fluid's dye field. The simulation's targets are sampled y-up while
     * `screenUV` is y-down, so the lookup is flipped to match.
     */
    const dyeAt = (uvCoord: Node) =>
      fluid.dyeNode.sample(vec2(vec2(uvCoord).x, oneMinus(vec2(uvCoord).y))).x

    /**
     * Candles halftone, taking its colour from the image so the effect reads as
     * the photograph resolving into bars rather than as an overlay on top.
     *
     * The fluid is an input to the pattern, not a layer on top of it. Both the
     * dye and the photo are sampled at the *cell centre*, which quantises the
     * fluid to the halftone grid — so what you see is bars widening and
     * appearing, never the liquid's own silhouette. Sampling per pixel instead
     * would draw the dye's smooth outline straight onto the screen and turn the
     * simulation into a visible blob chasing the cursor.
     */
    const pattern = () => {
      // Scale the cell with the viewport so the halftone keeps its density.
      const cellSize = float(CELL_SIZE).mul(resolution.y).div(REFERENCE_HEIGHT)
      const { centre, localX } = candlesCell(screenUV, resolution, cellSize)

      const cellColor = photo(centre)
      const cellDye = dyeAt(centre)

      // Fluid widens the bars on top of the photo's own luminance, so the
      // pattern opens up where the fluid has been.
      const value = luminance(cellColor)
        .mul(LUMA_WEIGHT)
        .add(cellDye.mul(DYE_WEIGHT))

      return {
        cellColor,
        bar: candlesBar(value, localX),
        presence: clamp(cellDye.div(REVEAL_THRESHOLD), 0, 1),
      }
    }

    const material = new MeshBasicNodeMaterial()

    // ScreenQuad is a single oversized triangle whose vertices are already in
    // clip space. Node materials still run the model-view-projection matrix by
    // default, which would project it through the scene camera, so write the
    // position straight through and skip the camera entirely.
    material.vertexNode = vec4(positionGeometry.xy, 0, 1)

    material.colorNode = Fn(() => {
      const base = photo(screenUV)
      const { cellColor, bar, presence } = pattern()

      // Lit bars are the photo brightened; the gaps drop to the section
      // background, so a revealed cell reads as pattern-on-background rather
      // than as a tinted patch of photograph.
      const patternColor = mix(background, cellColor.mul(PATTERN_GAIN), bar)
      const composited = mix(base, patternColor, presence)

      /**
       * Readability plate behind the headline. Composited here rather than as
       * a DOM overlay so the reveal passes underneath it and the text cannot
       * lose contrast however bright the pattern gets.
       */
      const radial = oneMinus(
        smoothstep(0.05, 0.72, screenUV.sub(0.5).mul(vec2(1, 1.4)).length())
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
        smoothstep(float(1).sub(BLEND_HEIGHT), 1, screenUV.y),
        BLEND_EASE
      )

      const scrim = clamp(radial.mul(0.45), 0, 1)
      const plated = mix(composited, background, scrim)

      return mix(plated, background, blend)
    })()

    return { material, resolution, imageAspect }
  }, [map, fluid])

  useEffect(() => {
    resolution.value.set(size.width, size.height)
    fluid.resize(size.width, size.height)
  }, [resolution, size, fluid])

  useEffect(() => {
    const image = map.image as { width?: number; height?: number } | undefined
    if (image?.width && image?.height) {
      imageAspect.value = image.width / image.height
    }
  }, [imageAspect, map])

  useFrame((_state, delta) => {
    pointer.tick(delta)

    const movement = pointer.consume()
    if (movement) {
      fluid.splat(renderer, movement.point, movement.delta, movement.amount)
    }

    fluid.update(renderer, delta)
  })

  return <ScreenQuad material={material} />
}
