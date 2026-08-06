"use client"

import { DialRoot, useDialKit } from "dialkit"
// Imported here rather than in the global sheet: dialkit's stylesheet starts
// with an `@import url(...)` for its own font, and CSS requires every @import
// to precede all rules — bundling it after our resets breaks the parse.
import "dialkit/styles.css"
import { useEffect } from "react"
import {
  GRADIENT_DEFAULTS as D,
  gradientControls,
} from "@/components/webgpu/lib/gradient-controls"
import {
  GRADE_DEFAULTS as C,
  gradeControls,
} from "@/components/webgpu/lib/grade"
import {
  HERO_DEFAULTS as H,
  heroControls,
} from "@/components/webgpu/lib/hero-controls"
import {
  INTRO_DEFAULTS as I,
  introControls,
  introTiming,
  replayIntro,
} from "@/components/webgpu/lib/intro-controls"

/**
 * Live controls for the gradient surfaces.
 *
 * Writes straight into the shader's uniforms, so nothing recompiles and nothing
 * re-renders — dragging a slider updates the value the next frame reads. The
 * defaults come from the same object the shader falls back to, so the panel
 * always opens showing exactly what production renders.
 *
 * `DialRoot` returns null outside development on its own, so there is no
 * separate production path to keep in sync.
 */
export function Dials() {
  const intro = useDialKit(
    "Intro",
    {
      replay: { type: "action", label: "Replay intro" },
      duration: [I.duration, 0.4, 6, 0.1],
      feather: [I.feather, 0.05, 1, 0.01],
      frontGlow: [I.frontGlow, 0, 0.4, 0.005],
      settleZoom: [I.settleZoom, 0, 0.3, 0.005],
      shimmer: [I.shimmer, 0, 3, 0.05],
      shimmerScale: [I.shimmerScale, 1, 60, 1],
      shimmerSpeed: [I.shimmerSpeed, 0, 6, 0.1],
      moteScale: [I.moteScale, 8, 160, 1],
      moteSize: [I.moteSize, 0.02, 0.45, 0.005],
      moteBurst: [I.moteBurst, 0, 4, 0.05],
      moteTrail: [I.moteTrail, 0.02, 1, 0.01],
      moteDrift: [I.moteDrift, 0, 1, 0.01],
    },
    {
      // Replays without a refresh, which is the point: reloading would throw
      // away every value tuned in this panel.
      onAction: (action) => {
        if (action === "replay") replayIntro()
      },
    }
  )

  useEffect(() => {
    introTiming.duration = intro.duration
    introControls.feather.value = intro.feather
    introControls.frontGlow.value = intro.frontGlow
    introControls.settleZoom.value = intro.settleZoom
    introControls.shimmer.value = intro.shimmer
    introControls.shimmerScale.value = intro.shimmerScale
    introControls.shimmerSpeed.value = intro.shimmerSpeed
    introControls.moteScale.value = intro.moteScale
    introControls.moteSize.value = intro.moteSize
    introControls.moteBurst.value = intro.moteBurst
    introControls.moteTrail.value = intro.moteTrail
    introControls.moteDrift.value = intro.moteDrift
  }, [intro])

  const hero = useDialKit("Hero", {
    exposure: [H.exposure, 0, 2, 0.01],
    contrast: [H.contrast, 0.5, 3, 0.01],
    parallax: [H.parallax, 0, 0.12, 0.001],
    parallaxPivot: [H.parallaxPivot, 0, 1, 0.01],
    parallaxMargin: [H.parallaxMargin, 0, 0.3, 0.005],
    scrim: [H.scrim, 0, 1, 0.01],
    blendHeight: [H.blendHeight, 0, 1, 0.01],
    blendEase: [H.blendEase, 0.5, 6, 0.1],
  })

  const gradient = useDialKit("Gradient", {
    // [default, min, max, step]
    speed: [D.speed, 0, 20, 0.1],
    radius: [D.radius, 0.05, 1.5, 0.01],
    warp: [D.warp, 0, 0.8, 0.005],
    warpScale: [D.warpScale, 0.2, 6, 0.05],
    warpSpeed: [D.warpSpeed, 0, 1.5, 0.01],
    hoverWarp: [D.hoverWarp, 0, 0.5, 0.005],
  })

  const pattern = useDialKit("Pattern", {
    cellSize: [D.cellSize, 2, 40, 1],
    barGain: [D.barGain, 0, 4, 0.05],
    barFloor: [D.barFloor, 0, 1, 0.01],
    barBias: [D.barBias, -0.5, 0.5, 0.01],
  })

  const color = useDialKit("Color", {
    brightness: [C.brightness, 0, 3, 0.01],
    contrast: [C.contrast, 0, 3, 0.01],
    gamma: [C.gamma, 0.2, 3, 0.01],
    saturation: [C.saturation, 0, 2, 0.01],
    tintAmount: [C.tintAmount, 0, 1, 0.01],
    tint: { type: "color", default: C.tint },
  })

  useEffect(() => {
    gradeControls.brightness.value = color.brightness
    gradeControls.contrast.value = color.contrast
    gradeControls.gamma.value = color.gamma
    gradeControls.saturation.value = color.saturation
    gradeControls.tintAmount.value = color.tintAmount
    // `Color.set` decodes the sRGB hex into the linear working space the
    // shader multiplies in, so the picker and the render agree.
    gradeControls.tint.value.set(color.tint)
  }, [color])

  useEffect(() => {
    heroControls.exposure.value = hero.exposure
    heroControls.contrast.value = hero.contrast
    heroControls.parallax.value = hero.parallax
    heroControls.parallaxPivot.value = hero.parallaxPivot
    heroControls.parallaxMargin.value = hero.parallaxMargin
    heroControls.scrim.value = hero.scrim
    heroControls.blendHeight.value = hero.blendHeight
    heroControls.blendEase.value = hero.blendEase
  }, [hero])

  useEffect(() => {
    gradientControls.speed.value = gradient.speed
    gradientControls.radius.value = gradient.radius
    gradientControls.warp.value = gradient.warp
    gradientControls.warpScale.value = gradient.warpScale
    gradientControls.warpSpeed.value = gradient.warpSpeed
    gradientControls.hoverWarp.value = gradient.hoverWarp
  }, [gradient])

  useEffect(() => {
    gradientControls.cellSize.value = pattern.cellSize
    gradientControls.barGain.value = pattern.barGain
    gradientControls.barFloor.value = pattern.barFloor
    gradientControls.barBias.value = pattern.barBias
  }, [pattern])

  // Collapsed on mount: the panel is a tuning tool, not part of the page, and
  // an open stack of sliders is the first thing the eye lands on in a review.
  // The state is in-memory only — nothing is persisted, so every load starts
  // closed regardless of how it was left.
  return <DialRoot position="bottom-right" theme="dark" defaultOpen={false} />
}
