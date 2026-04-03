"use client"

import { Preload } from "@react-three/drei"
import { Canvas } from "@react-three/fiber"
import dynamic from "next/dynamic"

import { FORCE_WEBGL } from "@/lib/renderer"
import { cn } from "@/lib/styles/cn"

const Scene = dynamic(
  () =>
    import("@/components/webgl/components/scene").then((mod) => mod.default),
  {
    ssr: false,
  }
)

export default function AppCanvas({ ...props }) {
  return (
    <Canvas
      className={cn("pointer-events-none h-lvh! w-full")}
      dpr={[1, 2]}
      eventPrefix="client"
      frameloop="always"
      camera={{
        far: 1000,
        near: 0.01,
        fov: 16,
        position: [0, 17, 350],
      }}
      renderer={FORCE_WEBGL ? { forceWebGL: true } : true}
      {...props}
    >
      <Scene />
      <Preload all />
    </Canvas>
  )
}
