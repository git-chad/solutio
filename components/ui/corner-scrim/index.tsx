import { cn } from "@/lib/styles/cn"

/**
 * Layers of the progressive blur, corner-most last.
 *
 * A single `backdrop-filter` gives a uniform blur with a hard mask edge. Real
 * progressive blur comes from stacking several layers: each one blurs whatever
 * the layers beneath already produced, so the radii compound toward the corner
 * instead of switching on. Cumulative blur at the corner is roughly the
 * quadrature sum of these, ~18px.
 *
 * `blur` doubles while `solid`/`fade` contract, which is what makes the ramp
 * ease rather than step evenly — matching the scrim's `(1 - t)^1.9` falloff.
 * `solid` is where each layer is still fully opaque, `fade` where it reaches
 * transparent, both as a percentage of the corner-to-corner radius.
 */
const BLUR_LAYERS = [{ blur: 2, solid: 58, fade: 85 }]

const maskFor = (solid: number, fade: number) =>
  `radial-gradient(circle farthest-corner at 0% 50%, #000 0%, #000 ${solid}%, transparent ${fade}%)`

/**
 * Readability treatment for copy sitting in the bottom-left of a shader
 * surface: a progressive blur under an eased radial scrim.
 *
 * Both are anchored to the same corner with the same `circle farthest-corner`
 * geometry, so they stay in register — which is why they live in one component
 * rather than being applied separately at each call site.
 *
 * The blur reads the canvas *behind* the element, so any ancestor that forms a
 * backdrop root — `isolation: isolate`, `contain: paint`, a filter, opacity
 * below 1 — will cut it off and silently leave a plain scrim.
 */
export function CornerScrim({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn("pointer-events-none absolute inset-0", className)}
    >
      {BLUR_LAYERS.map((layer) => (
        <div
          key={layer.blur}
          className="absolute inset-0"
          style={{
            backdropFilter: `blur(${layer.blur}px)`,
            WebkitBackdropFilter: `blur(${layer.blur}px)`,
            maskImage: maskFor(layer.solid, layer.fade),
            WebkitMaskImage: maskFor(layer.solid, layer.fade),
          }}
        />
      ))}
      <div className="scrim-corner absolute inset-0" />
    </div>
  )
}
