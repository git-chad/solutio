"use client"

import { useTexture, View } from "@react-three/drei"
import { useFrame } from "@react-three/fiber"
import { Suspense } from "react"
import { Scene } from "@/components/webgpu/hero-image/scene"
import { type Surface, useSurface } from "@/components/webgpu/lib/use-surface"

const TEXTURE = "/images/hero-bg.webp"
/** Generated offline by `lib/scripts/generate-depth.ts`. */
const DEPTH = "/images/hero-bg-depth.webp"

function SceneWithTextures({ surface }: { surface: Surface }) {
  const [map, depthMap] = useTexture([TEXTURE, DEPTH])

  useFrame((_state, delta) => {
    surface.tick(delta)
  })

  if (!(map && depthMap)) return null

  return (
    <Scene
      map={map}
      depthMap={depthMap}
      resolution={surface.resolution}
      pointer={surface.pointer}
    />
  )
}

/**
 * Hero background: the photograph, shifted by its own depth map as the pointer
 * moves, drawn into the shared canvas through a `<View>`.
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
        <SceneWithTextures surface={surface} />
      </Suspense>
    </View>
  )
}
