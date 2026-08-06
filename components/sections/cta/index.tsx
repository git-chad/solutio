import { Button } from "@/components/ui/button"
import { Container } from "@/components/ui/container"
import { Typography } from "@/components/ui/typography"
import { MeshGradient } from "@/components/webgpu/mesh-gradient"
import { SITE } from "@/lib/content/site"

export function CTA() {
  return (
    <Container as="section" id="contact" className="py-12">
      <div className="relative isolate flex min-h-80 tablet:min-h-120 tablet:flex-row flex-col items-start tablet:items-end justify-end tablet:justify-between gap-8 rounded-panel p-8 tablet:p-12">
        <MeshGradient radius={20} />
        {/* Sets the surface's overall level. Kept as a DOM overlay rather than
            folded into the shader: CSS composites opacity in sRGB while the
            shader mixes in linear, so the same alpha reads brighter there. */}
        <div className="absolute inset-0 bg-solutio-bg/45" />
        <div
          aria-hidden
          className="scrim-corner absolute inset-0 rounded-panel"
        />

        <div className="relative flex flex-col gap-2">
          <Typography variant="heading-2">Schedule a conversation</Typography>
          <Typography variant="caption" className="text-solutio-text-muted">
            Confidential. Direct. No intermediaries.
          </Typography>
        </div>

        <Button
          variant="primary"
          href={`mailto:${SITE.email}`}
          className="relative"
        >
          Talk to us
        </Button>
      </div>
    </Container>
  )
}
