"use client"

import { useTexture, View } from "@react-three/drei"
import { Suspense } from "react"
import { Scene } from "@/components/webgpu/hero-image/scene"
import {
  type FluidPointer,
  useFluidPointer,
} from "@/components/webgpu/lib/fluid/use-fluid-pointer"

const TEXTURE = "/images/hero-bg.webp"

function SceneWithTexture({ pointer }: { pointer: FluidPointer }) {
  const map = useTexture(TEXTURE)

  return <Scene map={map} pointer={pointer} />
}

/**
 * Hero background: the photograph, with a candles halftone that a fluid
 * simulation reveals as the pointer moves over it.
 *
 * Draws into the shared canvas through a `<View>` scissored to the tracked div,
 * rather than owning a canvas of its own.
 */
export function HeroImage() {
  const pointer = useFluidPointer()

  return (
    // `View` renders this element itself and tracks it. Its `track` prop is
    // accepted but discarded — it always follows its own element — so the
    // className has to go here rather than on a separate div.
    <View
      ref={pointer.ref as React.RefObject<HTMLElement>}
      aria-hidden
      className="pointer-events-none absolute inset-0"
    >
      <Suspense fallback={null}>
        <SceneWithTexture pointer={pointer} />
      </Suspense>
    </View>
  )
}
