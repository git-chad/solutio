"use client"

import dynamic from "next/dynamic"
import { Suspense, useRef } from "react"
import { cn } from "@/lib/styles/cn"

const WebGLCanvas = dynamic(() => import("./index"), {
  ssr: false,
})

export default function DynamicCanvas() {
  const eventSourceRef = useRef<HTMLDivElement>(null)

  return (
    <div
      ref={eventSourceRef}
      className={cn(
        "pointer-events-none fixed top-0 left-0 z-50 h-lvh w-full overflow-hidden"
      )}
    >
      <Suspense
        fallback={
          <div className="flex h-full w-full items-center justify-center bg-black/10">
            <span className="font-mono text-xs uppercase tracking-widest opacity-30">
              Loading WebGL...
            </span>
          </div>
        }
      >
        <WebGLCanvas eventSource={eventSourceRef} />
      </Suspense>
    </div>
  )
}
