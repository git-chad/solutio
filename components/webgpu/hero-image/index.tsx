"use client"

import { useTexture, View } from "@react-three/drei"
import { useFrame } from "@react-three/fiber"
import { Suspense } from "react"
import { Scene } from "@/components/webgpu/hero-image/scene"
import { type Surface, useSurface } from "@/components/webgpu/lib/use-surface"

const TEXTURE = "/images/hero-bg.webp"

function SceneWithTexture({ surface }: { surface: Surface }) {
  const map = useTexture(TEXTURE)

  useFrame((_state, delta) => {
    surface.tick(delta)
  })

  return <Scene map={map} resolution={surface.resolution} />
}

/**
 * Hero background: the photograph with the candles halftone resolving out of
 * its lighter areas, drawn into the shared canvas through a `<View>`.
 */
export function HeroImage() {
  const surface = useSurface()

  return (
    // `View` renders this element itself and tracks it. Its `track` prop is
    // accepted but discarded — it always follows its own element — so the
    // className has to go here rather than on a separate div.
    <View
      ref={surface.ref as React.RefObject<HTMLElement>}
      aria-hidden
      className="pointer-events-none absolute inset-0"
    >
      <Suspense fallback={null}>
        <SceneWithTexture surface={surface} />
      </Suspense>
    </View>
  )
}
