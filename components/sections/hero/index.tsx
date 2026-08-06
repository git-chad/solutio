import { Button } from "@/components/ui/button"
import { Container } from "@/components/ui/container"
import { SectionLabel } from "@/components/ui/section-label"
import { Typography } from "@/components/ui/typography"
import { HeroImage } from "@/components/webgpu/hero-image"

export function Hero() {
  return (
    <section className="relative flex tablet:h-screen tablet:max-h-[900px] min-h-[36rem] w-full items-center justify-center overflow-clip py-header-height">
      <HeroImage />

      <Container className="z-1 flex flex-col items-center gap-6 tablet:gap-7">
        <SectionLabel dot={false}>
          Tax Advisory &amp; Strategic Counsel
        </SectionLabel>

        <Typography
          variant="heading-1"
          className="max-w-[29rem] text-balance text-center"
        >
          The value lies in how. We know how.
        </Typography>

        <Typography
          variant="body"
          className="max-w-[30rem] text-pretty text-center"
        >
          We advise companies, individuals and families on complex tax and
          financial decisions, combining experience, judgment and strategic
          insight.
        </Typography>

        <Button variant="primary" href="#contact" className="mt-2">
          Talk to us
        </Button>
      </Container>
    </section>
  )
}
