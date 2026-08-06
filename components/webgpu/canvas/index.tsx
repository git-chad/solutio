"use client"

import { View } from "@react-three/drei"
import { Canvas } from "@react-three/fiber"
import { FORCE_WEBGL } from "@/lib/renderer"

/**
 * The one WebGPU canvas on the page.
 *
 * Every effect is a `<View>` scissored to a tracked DOM rect rather than its
 * own `<Canvas>`. Browsers cap the number of live GPU contexts, and each extra
 * canvas costs a renderer, a swap chain and its own render loop — so one canvas
 * is the only thing that scales past a couple of effects.
 *
 * It sits fixed behind the page at z-0. The body's background paints below all
 * positioned content, so the canvas covers it, and `main` sits above at z-10.
 * Sections that want the canvas to show through simply stay transparent;
 * everywhere no View is tracking, the canvas is untouched and the body colour
 * shows.
 *
 * `pointer-events-none` keeps every link and button underneath clickable —
 * effects that need the cursor track the window and hit-test their own rect.
 */
export function SharedCanvas() {
  return (
    // The positioning lives on this wrapper, not on `<Canvas>`: R3F owns its
    // container element (`r3f-canvas-container`) and does not merge a className
    // onto it, so styling the Canvas directly silently does nothing.
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0"
      // R3F sizes the canvas from its container, which needs real dimensions.
      style={{ width: "100vw", height: "100vh" }}
    >
      <Canvas
        dpr={[1, 2]}
        flat
        // Views draw into scissored regions, so anything not covered by a View
        // must stay transparent for the page background to show through.
        renderer={
          FORCE_WEBGL
            ? { forceWebGL: true, antialias: false, alpha: true }
            : { antialias: false, alpha: true }
        }
      >
        <View.Port />
      </Canvas>
    </div>
  )
}
