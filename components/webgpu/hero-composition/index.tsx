"use client"

import {
  ShaderLabComposition,
  type ShaderLabConfig,
} from "@basementstudio/shader-lab"

const config: ShaderLabConfig = {
  composition: {
    height: 949,
    width: 1512,
  },
  layers: [
    {
      blendMode: "normal",
      compositeMode: "filter",
      maskConfig: {
        invert: false,
        mode: "multiply",
        source: "luminance",
      },
      hue: 0,
      id: "07629612-71a4-4471-bdd7-d65c6e312de4",
      kind: "effect",
      name: "Progressive Blur",
      opacity: 1,
      params: {
        angle: 90,
        start: 1,
        end: 0.21,
        strength: 26,
        samples: 10,
      },
      saturation: 1,
      type: "smear",
      visible: true,
    },
    {
      blendMode: "normal",
      compositeMode: "filter",
      maskConfig: {
        invert: false,
        mode: "multiply",
        source: "luminance",
      },
      hue: 0,
      id: "c0297f40-bbd3-4aa5-aa01-86d37dd255d3",
      kind: "effect",
      name: "Particle Grid",
      opacity: 1,
      params: {
        gridResolution: 204,
        pointSize: 3,
        displacement: 0.09,
        backgroundColor: "#000000",
        noiseAmount: 0.24,
        noiseScale: 4.8,
        noiseSpeed: 0.5,
        bloomEnabled: true,
        bloomIntensity: 1.25,
        bloomThreshold: 0.42,
        bloomRadius: 9.5,
        bloomSoftness: 0.28,
      },
      saturation: 1,
      type: "particle-grid",
      visible: true,
    },
    {
      blendMode: "normal",
      compositeMode: "filter",
      maskConfig: {
        invert: false,
        mode: "multiply",
        source: "luminance",
      },
      hue: 0,
      id: "3a031ba3-0262-4b4e-b48a-023fe004ce33",
      kind: "source",
      name: "Image",
      opacity: 1,
      params: {
        fitMode: "cover",
        scale: 1,
        offset: [0, 0],
      },
      saturation: 1,
      type: "image",
      visible: true,
      asset: {
        fileName: "hero-bg.webp",
        kind: "image",
        src: "/images/hero-bg.webp",
      },
    },
  ],
  timeline: {
    duration: 8,
    loop: true,
    tracks: [],
  },
}

export function HeroComposition() {
  return <ShaderLabComposition config={config} />
}
