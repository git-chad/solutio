import { Button } from "@/components/ui/button"
import { Container } from "@/components/ui/container"
import { Reveal } from "@/components/ui/reveal"
import { SectionLabel } from "@/components/ui/section-label"
import { Typography } from "@/components/ui/typography"
import { HeroImage } from "@/components/webgpu/hero-image"

/**
 * Copy entrance, in ms after mount.
 *
 * The scene behind starts resolving at 0 and is mostly there within about half
 * a second, so the copy begins arriving into a room that already exists rather
 * than onto an empty rectangle. `Reveal` is intersection-driven, and these are
 * above the fold, so they fire immediately — the delays *are* the timeline.
 */
const TIMELINE = {
  label: 260,
  heading: 400,
  body: 560,
  action: 700,
} as const

export function Hero() {
  return (
    <section className="relative flex tablet:h-screen tablet:max-h-[900px] min-h-[36rem] w-full items-center justify-center overflow-clip py-header-height">
      <HeroImage />

      <Container className="z-1 flex flex-col items-center gap-6 tablet:gap-7">
        <Reveal delay={TIMELINE.label}>
          <SectionLabel dot={false}>
            Tax Advisory &amp; Strategic Counsel
          </SectionLabel>
        </Reveal>

        <Reveal delay={TIMELINE.heading}>
          <Typography
            variant="heading-1"
            className="max-w-[34rem] text-balance text-center"
          >
            The value lies in how. We know how.
          </Typography>
        </Reveal>

        <Reveal delay={TIMELINE.body}>
          <Typography
            variant="body"
            className="max-w-[32rem] text-pretty text-center tablet:text-[1.125rem]/[1.875rem] text-base/[1.75rem] text-white"
          >
            We advise companies, individuals and families on complex tax and
            financial decisions, combining experience, judgment and strategic
            insight.
          </Typography>
        </Reveal>

        <Reveal delay={TIMELINE.action} className="mt-2">
          <Button variant="primary" href="#contact">
            Talk to us
          </Button>
        </Reveal>
      </Container>
    </section>
  )
}
