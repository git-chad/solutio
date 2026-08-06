"use client"

import { useTexture } from "@react-three/drei"
import { Canvas } from "@react-three/fiber"
import { Suspense } from "react"
import { Scene } from "@/components/webgpu/hero-image/scene"
import {
  type FluidPointer,
  useFluidPointer,
} from "@/components/webgpu/lib/fluid/use-fluid-pointer"
import { FORCE_WEBGL } from "@/lib/renderer"

const TEXTURE = "/images/hero-bg.webp"

function SceneWithTexture({ pointer }: { pointer: FluidPointer }) {
  const map = useTexture(TEXTURE)

  return <Scene map={map} pointer={pointer} />
}

/**
 * Hero background: the photograph, with a candles halftone that a fluid
 * simulation reveals as the pointer moves over it.
 *
 * Rendered through `WebGPURenderer`, which falls back to WebGL2 on its own —
 * the TSL node graph compiles to either backend, so there is no second code
 * path. `FORCE_WEBGL` is the manual override for debugging that fallback.
 */
export function HeroImage() {
  const pointer = useFluidPointer()

  return (
    // The canvas stays non-interactive; the pointer hook tracks the window and
    // hit-tests this rect, so the headline and CTA above stay clickable.
    <div ref={pointer.ref} className="absolute inset-0">
      <Canvas
        className="h-full! w-full!"
        dpr={[1, 2]}
        flat
        renderer={
          FORCE_WEBGL
            ? { forceWebGL: true, antialias: false }
            : { antialias: false }
        }
      >
        <Suspense fallback={null}>
          <SceneWithTexture pointer={pointer} />
        </Suspense>
      </Canvas>
    </div>
  )
}
