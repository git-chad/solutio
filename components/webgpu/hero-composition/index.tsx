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
      id: "f068fd78-bbe0-4209-834c-387a6cda3a5c",
      kind: "effect",
      name: "Particle Grid",
      opacity: 1,
      params: {
        gridResolution: 256,
        pointSize: 4,
        displacement: 0.03,
        backgroundColor: "#000000",
        noiseAmount: 0.34,
        noiseScale: 4.9,
        noiseSpeed: 0.5,
        bloomEnabled: true,
        bloomIntensity: 1.25,
        bloomThreshold: 0.47,
        bloomRadius: 0,
        bloomSoftness: 0.09,
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
      id: "2618c9ae-082e-43bb-b023-78cedeace76e",
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
    duration: 0,
    loop: true,
    tracks: [],
  },
}

export function HeroComposition() {
  return <ShaderLabComposition config={config} />
}
