"use client"

import { useTexture } from "@react-three/drei"
import { Canvas } from "@react-three/fiber"
import { Suspense } from "react"
import { Scene } from "@/components/webgpu/hero-image/scene"
import { usePointerTrail } from "@/components/webgpu/lib/use-pointer-trail"
import { FORCE_WEBGL } from "@/lib/renderer"

const TEXTURE = "/images/hero-bg.webp"

function SceneWithTexture({
  trail,
}: {
  trail: ReturnType<typeof usePointerTrail>
}) {
  const map = useTexture(TEXTURE)

  return <Scene map={map} trail={trail} />
}

/**
 * Hero background: the photograph, with a candles halftone that a pointer-driven
 * trail reveals on hover.
 *
 * Rendered through `WebGPURenderer`, which falls back to WebGL on its own — the
 * TSL node graph compiles to either backend, so there is no second code path.
 * `FORCE_WEBGL` is the manual override for debugging that fallback.
 */
export function HeroImage() {
  const trail = usePointerTrail()

  return (
    // The wrapper, not the canvas, owns the pointer events: the canvas is
    // behind the headline, so hit-testing it directly would be blocked by the
    // text above it.
    <div ref={trail.ref} className="absolute inset-0">
      <Canvas
        className="h-full! w-full!"
        dpr={[1, 2]}
        // Nothing here reacts to scroll or camera, so the default perspective
        // camera is unused — ScreenQuad bypasses it entirely.
        flat
        renderer={
          FORCE_WEBGL
            ? { forceWebGL: true, antialias: false }
            : { antialias: false }
        }
      >
        <Suspense fallback={null}>
          <SceneWithTexture trail={trail} />
        </Suspense>
      </Canvas>
    </div>
  )
}
